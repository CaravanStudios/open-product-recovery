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

import {StatusError} from '../util/statuserror';
import 'express-async-errors';
import express, {
  Express,
  NextFunction,
  Request,
  Response,
  json as expressJson,
} from 'express';
import {Clock} from '../util/clock';
import {DefaultClock} from '../util/defaultclock';
import {Server} from 'http';
import loglevel, {Logger} from '../util/loglevel';
import {PersistentStorage} from '../database/persistentstorage';
import {HostConfigJsonProvider} from '../config/hostconfigprovider';
import {ServerConfigJson} from '../config/serverconfigjson';
import {OprHost} from './oprhost';
import {HostConfig} from './hostconfig';
import {resolveConfigJson} from '../config/resolveconfigjson';
import {HostIdExtractor} from '../config/hostidextractor';
import {JsonMap} from '../util/jsonvalue';

export type OprServerOptions = {
  app?: Express;
  clock?: Clock;
  logger?: Logger;
  config: ServerConfigJson;
  /**
   * Custom startup routines run after all built-in and custom handlers are
   * installed, but before the server actually begins listening for connections.
   */
  customStartupRoutines?: Array<CustomStartupRoutine>;
};

export type CustomStartupRoutine = (
  app: Express,
  server: OprServer
) => Promise<void>;

export class OprServer {
  readonly app: Express;
  private storage!: PersistentStorage;
  private hostConfigProvider!: HostConfigJsonProvider;
  private hostIdExtractor!: HostIdExtractor;
  private hostName?: string;
  private config: ServerConfigJson;
  private server?: Server;
  private logger: Logger;
  private clock: Clock;

  private customStartupRoutines: Array<CustomStartupRoutine>;
  private isStarted = false;

  constructor(options: OprServerOptions | ServerConfigJson) {
    if (!(options as OprServerOptions).config) {
      const configJson = options as ServerConfigJson;
      options = {
        config: configJson,
      } as OprServerOptions;
    } else {
      options = options as OprServerOptions;
    }
    this.config = options.config;
    this.logger = options.logger ?? loglevel.getLogger('OprServer');
    this.app = options.app || express();
    this.clock = options.clock || new DefaultClock();
    this.customStartupRoutines = options.customStartupRoutines || [];
  }

  /** Returns the storage system. */
  getStorage(): PersistentStorage {
    return this.storage;
  }

  async start(port: number): Promise<void> {
    const resolved = await resolveConfigJson(this.config);
    console.log('Resolved config', resolved);
    this.hostIdExtractor = resolved.resolvedConfig.hostMapping;
    this.hostConfigProvider = resolved.resolvedConfig.hostSetup;
    this.storage = resolved.resolvedConfig.storage;
    this.hostName = resolved.resolvedConfig.hostName;

    this.logger.info('Starting frontend server on port', port);
    return new Promise(acceptFn => {
      this.server = this.app.listen(port, async () => {
        console.log('server is listening');
        await this.initializeServer();
        acceptFn();
      });
    });
  }

  async stop(): Promise<void> {
    await new Promise<void>((acceptFn, rejectFn) => {
      this.server?.close(err => {
        if (err) {
          rejectFn(err);
        } else {
          acceptFn();
        }
      });
    });
  }

  getExpressServer(): Express {
    return this.app;
  }

  installCustomStartupRoutine(routine: CustomStartupRoutine) {
    if (this.isStarted) {
      throw new StatusError(
        'Cannot install startup routines after the server has started',
        'SERVER_ERROR_INSTALL_CUSTOM_STARTUP'
      );
    }
    this.customStartupRoutines.push(routine);
  }

  private async doCustomStartup(): Promise<void> {
    for (const customStartupRoutine of this.customStartupRoutines) {
      await customStartupRoutine(this.app, this);
    }
  }

  private async initializeServer() {
    // core server components
    this.app.use(expressJson());

    // user customizations
    await this.doCustomStartup();

    this.app.use(
      '/',
      async (req: Request, res: Response, next: NextFunction) => {
        const hostName =
          this.hostName ?? req.protocol + '://' + req.get('host');
        const fullUrl = hostName + req.originalUrl;
        // const hostId = this.hostConfigProvider.getHostId(fullUrl);
        const hostId = this.hostIdExtractor.getHostId(fullUrl);
        if (hostId === undefined) {
          next();
          return;
        }
        let hostConfig: HostConfig;
        try {
          hostConfig = await this.getHostConfig(hostId);
        } catch (e) {
          next();
          return;
        }
        const host = new OprHost(
          {
            ...hostConfig,
            clock: this.clock,
          } as HostConfig,
          this.storage
        );
        await host.start();
        res.on('finish', async () => {
          console.log('Destroying host config for', host.hostOrgUrl);
          await host.destroy();
          await hostConfig.destroy();
        });
        const hostUrlRoot = this.hostIdExtractor.getRootPathFromId(hostId);
        if (!fullUrl.startsWith(hostUrlRoot)) {
          throw new StatusError(
            `Unexpected different url roots: ${hostUrlRoot}, ${fullUrl}`,
            'NO_URL_PREFIX_MATCH'
          );
        }
        const relativePath = fullUrl.substring(hostUrlRoot.length);
        req.url = relativePath;
        host.getRouter()(req, res, next);
      }
    );
    this.isStarted = true;

    // catch unhandled errors
    this.app.use(
      // NOTE: This handler must be registered last, and it MUST have the
      // unused 'next' parameter as its last argument.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        this.logger.error(error);
        this.handleError(error, req, res);
      }
    );
  }

  private async getHostConfig(hostId: string): Promise<HostConfig> {
    // TODO: Cache these in memory for a few minutes
    let hostUrlRoot = this.hostIdExtractor.getRootPathFromId(hostId);
    const configJson = await this.hostConfigProvider.getHostConfig(hostId);
    let orgFilePath = configJson.orgFilePath ?? './org.json';
    if (orgFilePath.startsWith('/')) {
      orgFilePath = '.' + orgFilePath;
    }
    if (!hostUrlRoot.endsWith('/')) {
      hostUrlRoot = hostUrlRoot + '/';
    }
    const hostOrgUrl = new URL(orgFilePath, hostUrlRoot).toString();
    console.log('Resolving cloud config json', configJson, hostOrgUrl);
    const resolved = await resolveConfigJson(
      configJson,
      {hostOrgUrl},
      // Transform installers into annotated installers
      (x: unknown, config: JsonMap) => {
        if (typeof x === 'function') {
          return {
            moduleName: config.moduleName,
            params: config.params ?? {},
            install: x,
          };
        } else {
          return x;
        }
      }
    );
    console.log('Resolved', resolved);
    return {
      ...resolved.resolvedConfig,
      hostOrgUrl: hostOrgUrl,
      hostUrlRoot: hostUrlRoot,
      destroy: () => resolved.destroyAll(),
    } as HostConfig;
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

  async ingest(): Promise<void> {
    for await (const hostId of this.hostConfigProvider.getAllHostIds()) {
      const hostConfig = await this.getHostConfig(hostId);
      const host = new OprHost(hostConfig, this.storage);
      this.logger.info('Starting ingest on host', host.hostOrgUrl);
      await host.start();
      await host.ingest();
      await host.destroy();
    }
  }
}
