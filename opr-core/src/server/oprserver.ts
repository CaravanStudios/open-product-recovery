/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {JwksProvider} from '../auth/jwksprovider';
import {StandardVerifier, Verifier} from '../auth/verifier';
import {FrontendConfig} from '../config/frontendconfig';
import {frontendConfigToOrgConfig} from '../config/frontendconfigtoorgconfig';
import {OrgConfigProvider} from '../config/orgconfigprovider';
import {StatusError} from '../util/statuserror';
import 'express-async-errors';
import express, {
  Express,
  NextFunction,
  Request,
  Response,
  json as expressJson,
} from 'express';
import {JWTPayload, JWTVerifyOptions} from 'jose';
import {Clock} from '../util/clock';
import {DefaultClock} from '../util/defaultclock';
import {Server} from 'http';
import {AuthenticatedRequestHandler} from './handlers/authenticatedrequesthandler';
import {ListRequestHandler} from './handlers/listrequesthandler';
import {Signer} from '../auth/signer';
import {AcceptRequestHandler} from './handlers/acceptrequesthandler';
import {RejectRequestHandler} from './handlers/rejectrequesthandler';
import {ReserveRequestHandler} from './handlers/reserverequesthandler';
import {HistoryRequestHandler} from './handlers/historyrequesthandler';
import {OprDatabase} from '../database/oprdatabase';
import {OprClient, OprClientConfig} from '../net/oprclient';
import loglevel, {Logger} from '../util/loglevel';
import {OprFeedProducer} from '../offerproducer/oprfeedproducer';
import {ServerAccessControlList} from '../policy/serveraccesscontrollist';
import {FeedConfig, FeedConfigProvider} from '../policy/feedconfig';
import {OfferProducer, OfferSetUpdate} from '../offerproducer/offerproducer';
import {CustomRequestHandler} from './customrequesthandler';
import {getBearerToken} from '../auth/getbearertoken';

const DEFAULT_RESERVATION_TIME_SECS = 5 * 60;

export interface OprServerOptions {
  frontendConfig: FrontendConfig;
  orgConfigProvider: OrgConfigProvider;
  database: OprDatabase;
  signer?: Signer;
  jwksProvider?: JwksProvider;
  app?: Express;
  clock?: Clock;
  logger?: Logger;
  strictCorrectnessChecks?: boolean;
  defaultReservationTimeSecs?: number;
  clientConfig?: Partial<OprClientConfig>;
  accessControlList: ServerAccessControlList;
  feedConfigProvider?: FeedConfigProvider;
  producers?: Array<OfferProducer>;
  verifier?: Verifier;
  /** Any custom handlers to install for user-specified behavior. */
  customHandlers?: Record<string, CustomRequestHandler>;
  /**
   * Custom startup routines run after all built-in and custom handlers are
   * installed, but before the server actually begins listening for connections.
   */
  customStartupRoutines?: Array<CustomStartupRoutine>;
}

export type CustomStartupRoutine = (app: Express) => Promise<void>;

export class OprServer {
  readonly app: Express;
  private frontendConfig: FrontendConfig;
  private orgConfigProvider: OrgConfigProvider;
  private jwksProvider?: JwksProvider;
  private verifier: Verifier;
  private accessControlList: ServerAccessControlList;
  private clock: Clock;
  private database: OprDatabase;
  private server?: Server;
  private logger: Logger;
  private strictCorrectnessChecks: boolean;
  private listRequestHandler: ListRequestHandler;
  private acceptRequestHandler: AcceptRequestHandler;
  private rejectRequestHandler: RejectRequestHandler;
  private reserveRequestHandler: ReserveRequestHandler;
  private historyRequestHandler: HistoryRequestHandler;
  private offerProducers: Array<OfferProducer>;
  private client?: OprClient;
  private feedConfigProvider?: FeedConfigProvider;
  private customHandlers: Record<string, CustomRequestHandler>;
  private customStartupRoutines: Array<CustomStartupRoutine>;

  constructor(options: OprServerOptions) {
    this.frontendConfig = options.frontendConfig;
    this.accessControlList = options.accessControlList;
    this.logger = options.logger ?? loglevel.getLogger('OprServer');
    this.app = options.app || express();
    this.orgConfigProvider = options.orgConfigProvider;
    this.jwksProvider = options.jwksProvider;
    this.database = options.database;
    this.clock = options.clock || new DefaultClock();
    this.verifier =
      options.verifier || new StandardVerifier(this.orgConfigProvider);
    this.listRequestHandler = new ListRequestHandler(this.database);
    this.acceptRequestHandler = new AcceptRequestHandler(
      this.database,
      options.frontendConfig.organizationURL,
      this.verifier
    );
    this.rejectRequestHandler = new RejectRequestHandler(this.database);
    this.reserveRequestHandler = new ReserveRequestHandler(
      this.database,
      options.defaultReservationTimeSecs || DEFAULT_RESERVATION_TIME_SECS,
      options.frontendConfig.organizationURL,
      this.verifier
    );
    this.historyRequestHandler = new HistoryRequestHandler(this.database);
    if (options.clientConfig || options.signer) {
      this.logger.debug('Starting server with opr client config',
          options.clientConfig);
      if (!options.signer) {
        throw new StatusError(
          'Cannot create an opr client without a signer',
          'SERVER_CONFIG_ERROR',
          500
        );
      }
      this.client = new OprClient({
        signer: options.clientConfig?.signer ?? options.signer,
        configProvider: options.clientConfig?.configProvider ??
            options.orgConfigProvider,
        urlMapper: options.clientConfig?.urlMapper,
        jsonFetcher: options.clientConfig?.jsonFetcher
      });
    }
    this.feedConfigProvider = options.feedConfigProvider;
    this.strictCorrectnessChecks = options.strictCorrectnessChecks || false;
    this.offerProducers = options.producers ?? [];
    this.customHandlers = options.customHandlers || {};
    this.customStartupRoutines = options.customStartupRoutines || [];
  }

  start(port: number): Promise<void> {
    this.logger.info(
      'Starting frontend server',
      this.frontendConfig.organizationURL,
      'on port',
      port
    );
    return new Promise(acceptFn => {
      this.server = this.app.listen(port, async () => {
        await this.initializeServer();
        acceptFn();
      });
    });
  }

  async stop(): Promise<void> {
    const promises = [
      new Promise<void>((acceptFn, rejectFn) => {
        this.server?.close(err => {
          if (err) {
            rejectFn(err);
          } else {
            acceptFn();
          }
        });
      }),
      this.database.shutdown(),
    ];
    await Promise.all(promises);
  }

  private async getFeedProducers(): Promise<Array<OfferProducer>> {
    if (!this.feedConfigProvider) {
      return [];
    }
    const feedConfigs = await this.feedConfigProvider.getFeeds();
    return feedConfigs.map(feedConfig =>
      this.getOfferProducerFromFeedConfig(feedConfig)
    );
  }

  private getOfferProducerFromFeedConfig(
    feedConfig: FeedConfig
  ): OfferProducer {
    if (!this.client) {
      throw new StatusError(
        'An OPR client must be specified to install feeds',
        'SERVER_CONFIG_ERROR_NO_OPR_CLIENT',
        500
      );
    }
    return new OprFeedProducer(
      this.client,
      feedConfig.organizationUrl,
      feedConfig.maxUpdateFrequencyMillis
    );
  }

  async ingest(): Promise<void> {
    this.logger.info('Ingesting offers');
    const producers = [
      ...(await this.getFeedProducers()),
      ...this.offerProducers,
    ];
    this.logger.info(
      'Found producers:',
      producers.map(p => p.id)
    );
    const producerPromises = [];
    for (const producer of producers) {
      producerPromises.push(this.produceOffers(producer));
    }
    await Promise.all(producerPromises);
    this.logger.info('Ingestion complete');
  }

  private async produceOffers(producer: OfferProducer): Promise<void> {
    this.logger.info('Ingesting offers from', producer.id);
    // Note: If there's already a request in process, locking the producer will
    // throw an exception that cancels this entire operation.
    this.logger.debug('Obtaining lock on', producer.id);
    let metadata;
    try {
      metadata = await this.database.lockProducer(producer.id);
    } catch (e) {
      this.logger.warn(
        'Failed to obtain lock on',
        producer.id,
        'update frequency may be too high',
        e
      );
      return;
    }
    this.logger.debug('Lock obtained on', producer.id);
    const now = this.clock.now();
    let nextRunTimestampUTC = metadata?.nextRunTimestampUTC;
    let result: OfferSetUpdate | undefined;
    try {
      if (nextRunTimestampUTC && nextRunTimestampUTC > now) {
        this.logger.info(
          'Skipping feed',
          producer.id,
          ', cannot fetch again for',
          nextRunTimestampUTC - now,
          'ms'
        );
        await this.database.unlockProducer({
          lastUpdateTimeUTC: now,
          nextRunTimestampUTC: nextRunTimestampUTC ?? now,
          producerId: producer.id,
        });
        return;
      }
      result = await producer.produceOffers({
        requestedResultFormat: 'DIFF',
        diffStartTimestampUTC: metadata?.lastUpdateTimeUTC,
      });
      nextRunTimestampUTC = result.earliestNextRequestUTC;
      await this.database.processUpdate(producer.id, result);
      await this.database.unlockProducer({
        lastUpdateTimeUTC: now,
        nextRunTimestampUTC: nextRunTimestampUTC ?? now,
        producerId: producer.id,
      });
      this.logger.info('Ingestion of', producer.id, 'succeeded');
      this.logger.debug('dbg Lock released on', producer.id);
    } catch (e) {
      this.logger.warn('Failed to fetch', producer.id, 'error:', e);
      nextRunTimestampUTC =
        now + this.getFailedRetryIntervalMillis(producer.id);
      await this.database.unlockProducer({
        lastUpdateTimeUTC: metadata?.lastUpdateTimeUTC,
        nextRunTimestampUTC: nextRunTimestampUTC ?? now,
        producerId: producer.id,
      });
      this.logger.debug('Lock released on', producer.id);
    }
  }

  /**
   * Returns the minimum number of milliseconds to wait before retrying a
   * failed request from a producer. This takes the producer id so that
   * a producer-specific backoff policy can be implemented.
   */
  protected getFailedRetryIntervalMillis(producerId: string): number {
    // TODO: Build a useful, per-producer backoff policy.
    return 10 * 1000 /* 10 seconds */;
  }

  private serveCustomEndpoints() {
    for (const key in this.customHandlers) {
      const handler = this.customHandlers[key];
      const expressHandler = async (req: Request, res: Response) => {
        this.logger.info('Called custom handler', key);
        res.json(await handler.handle(req.body as unknown, req));
      };
      const path = key.startsWith('/') ? key : '/' + key;
      const methods = Array.isArray(handler.method)
        ? handler.method
        : handler.method ?? 'POST';
      if (methods.indexOf('GET') >= 0) {
        this.app.get(path, expressHandler);
      }
      if (methods.indexOf('POST') >= 0) {
        this.app.post(path, expressHandler);
      }
    }
  }

  private async doCustomStartup(): Promise<void> {
    for (const customStartupRoutine of this.customStartupRoutines) {
      await customStartupRoutine(this.app);
    }
  }

  private async initializeServer() {
    this.app.use(expressJson());
    this.serveOrgFile();
    this.maybeServeJwks();
    this.serveApiEndpoints();
    this.serveCustomEndpoints();
    await this.doCustomStartup();
    this.app.use(
      // NOTE: This handler must be registered last, and it MUST have the
      // unused 'next' parameter as its last argument.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        this.handleError(error, req, res);
      }
    );
    await this.database.initialize();
  }

  handleError(error: any, req: Request, res: Response) {
    let status = 500;
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
        ? error.message
        : 'unknown error';
    let code = 'INTERNAL_ERROR';
    let otherFields = {};
    if (error instanceof StatusError) {
      status = error.httpStatus;
      code = error.errorCode;
      otherFields = error.otherFields;
    }
    res.status(status).json({
      ...otherFields,
      code: code,
      message: message,
    });
  }

  serveOrgFile(): void {
    const orgFilePath = this.frontendConfig.orgFilePath || '/org.json';

    const orgJson = frontendConfigToOrgConfig(this.frontendConfig);

    this.app.get(orgFilePath, async (req, res) => {
      res.json(orgJson);
    });
  }

  maybeServeJwks(): void {
    if (this.frontendConfig.jwksURL) {
      const testUrl = new URL(this.frontendConfig.jwksURL, 'http://localhost');
      if (testUrl.hostname === 'localhost') {
        // If the jwksURL is just a pathname, we need to host the
        // key set.
        const jwksProvider = this.jwksProvider;
        if (!jwksProvider) {
          throw new StatusError(
            'No jwksProvider specified. A JWKS provider is required if the ' +
              'frontend server is hosting the JWKS file.',
            'NO_JWKS_PROVIDER'
          );
        }
        this.app.get(testUrl.pathname, async (req, res) => {
          const publicKeys = await jwksProvider.getJwks();
          res.send(publicKeys);
        });
      }
    }
  }

  serveApiEndpoints(): void {
    const c = this.frontendConfig;
    if (c.listProductsPath) {
      this.app.post(c.listProductsPath, async (req, res) => {
        return await this.handleList(req, res);
      });
    }
    if (c.acceptProductPath) {
      this.app.post(c.acceptProductPath, (req, res) => {
        return this.handleAccept(req, res);
      });
    }
    if (c.rejectProductPath) {
      this.app.post(c.rejectProductPath, (req, res) => {
        return this.handleReject(req, res);
      });
    }
    if (c.reserveProductPath) {
      this.app.post(c.reserveProductPath, (req, res) => {
        return this.handleReserve(req, res);
      });
    }
    if (c.historyPath) {
      this.app.post(c.historyPath, (req, res) => {
        return this.handleHistory(req, res);
      });
    }
  }

  async checkAuth(
    req: Request,
    options?: JWTVerifyOptions
  ): Promise<JWTPayload> {
    options = {...options, currentDate: new Date(this.clock.now())};
    const token = getBearerToken(req.header('Authorization'));
    const payload = (await this.verifier.verify(token, options)).payload;
    return payload;
  }

  async handleAuthenticatedRequest<RequestType, ResponseType>(
    req: Request,
    res: Response,
    requestHandler: AuthenticatedRequestHandler<RequestType, ResponseType>
  ): Promise<void> {
    // Check the token.
    const jwtPayload = await this.checkAuth(req);
    // Check for required fields.
    if (!jwtPayload.iss) {
      throw new StatusError(
        'Auth token does not specify the required iss field',
        'AUTH_ERROR_ISS_MISSING',
        401
      );
    }
    if (jwtPayload.aud) {
      if (jwtPayload.aud !== this.frontendConfig.organizationURL) {
        // TODO(johndayrichter): Add support for a list of additional
        // acceptable org urls to allow for smooth URL changes.
        throw new StatusError(
          'Auth token audience is ' +
            jwtPayload.aud +
            ', but this server' +
            'requires audience ' +
            this.frontendConfig.organizationURL,
          'AUTH_ERROR_AUD_INVALID',
          401
        );
      }
    } else {
      throw new StatusError(
        'Auth token does not specify the required aud field',
        'AUTH_ERROR_AUD_MISSING',
        401
      );
    }
    // Check the scopes
    if (!this.frontendConfig.scopesDisabled) {
      const jwtScopes = ((jwtPayload['scope'] as string) || '').split(' ');
      for (const scope of requestHandler.scopes || []) {
        if (jwtScopes.indexOf(scope) < 0) {
          throw new StatusError(
            'Auth token is missing required scope ' + scope,
            'AUTH_ERROR_MISSING_SCOPE',
            403
          );
        }
      }
    }
    // Check that the request is valid.
    const requestBody = req.body as unknown;
    requestHandler.validateRequest(requestBody);

    // Check the ACL, if appropriate
    if (!requestHandler.shouldIgnoreAccessControlList(requestBody)) {
      const matched = await this.accessControlList.isAllowed(jwtPayload.iss);
      if (!matched) {
        throw new StatusError(
          'Organization ' +
            jwtPayload.iss +
            ' does not have permission to access this server',
          'AUTH_ERROR_ORG_NOT_AUTHORIZED',
          403
        );
      }
    }

    const response = await requestHandler.handle(requestBody, jwtPayload);
    if (this.strictCorrectnessChecks) {
      requestHandler.validateResponse(response);
    }
    res.json(response);
  }

  async handleList(req: Request, res: Response): Promise<void> {
    this.logger.info('Handling request to list');
    await this.handleAuthenticatedRequest(req, res, this.listRequestHandler);
  }

  async handleAccept(req: Request, res: Response): Promise<void> {
    this.logger.info('Handling request to accept');
    await this.handleAuthenticatedRequest(req, res, this.acceptRequestHandler);
  }

  async handleReject(req: Request, res: Response): Promise<void> {
    this.logger.info('Handling request to reject');
    await this.handleAuthenticatedRequest(req, res, this.rejectRequestHandler);
  }

  async handleReserve(req: Request, res: Response): Promise<void> {
    this.logger.info('Handling request to reserve');
    await this.handleAuthenticatedRequest(req, res, this.reserveRequestHandler);
  }

  async handleHistory(req: Request, res: Response): Promise<void> {
    this.logger.info('Handling request to reserve');
    await this.handleAuthenticatedRequest(req, res, this.historyRequestHandler);
  }
}
