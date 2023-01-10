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
import {TenantNodeConfigProvider} from '../config/tenantnodeconfigprovider';
import {OprTenantNode} from './oprtenantnode';
import {ConfigJson, resolveConfigJson} from '../config/resolveconfigjson';
import {TenantIdExtractor} from '../config/tenantidextractor';
import {PluggableFactorySet} from '../integrations/pluggablefactoryset';
import {PluggableFactory} from '../integrations/pluggablefactory';
import {Pluggable} from '../integrations/pluggable';
import {TenantNodeIntegrationInstaller} from '../integrations/tenantnodeintegrationinstaller';
import {TenantNodeConfig} from '../config/tenantnodeconfig';

export type CustomStartupRoutine = (
  app: Express,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server: OprServer<any>
) => Promise<void>;

export interface ServerConfig<Allowed extends PluggableFactorySet> {
  storage: PersistentStorage;
  hostSetup: TenantNodeConfigProvider<Allowed>;
  hostMapping: TenantIdExtractor;
  hostName?: string;
  app?: Express;
  clock?: Clock;
  logger?: Logger;
  /**
   * Custom startup routines run after all built-in and custom handlers are
   * installed, but before the server actually begins listening for connections.
   */
  customStartupRoutines?: Array<CustomStartupRoutine>;
}

export class OprServer<T extends PluggableFactorySet> {
  readonly app: Express;
  private storage!: PersistentStorage;
  private hostConfigProvider!: TenantNodeConfigProvider<T>;
  private hostIdExtractor!: TenantIdExtractor;
  private hostName?: string;
  private server?: Server;
  private logger: Logger;
  private clock: Clock;
  private allowedPluginSet: T;
  private customStartupRoutines: Array<CustomStartupRoutine>;
  private isStarted = false;
  private config: ConfigJson<ServerConfig<T>, T>;

  constructor(
    config: ConfigJson<ServerConfig<T>, T>,
    allowedPluginFactories: T
  ) {
    this.allowedPluginSet = allowedPluginFactories;
    this.config = config;
    this.logger = config.logger ?? loglevel.getLogger('OprServer');
    this.app = config.app || express();
    this.clock = config.clock || new DefaultClock();
    this.customStartupRoutines = config.customStartupRoutines || [];
  }

  /** Returns the storage system. */
  getStorage(): PersistentStorage {
    return this.storage;
  }

  async start(port: number): Promise<void> {
    const resolved = await resolveConfigJson(
      this.config,
      this.allowedPluginSet
    );
    console.log('Resolved config', resolved);
    this.hostIdExtractor = resolved.result.hostMapping;
    this.hostConfigProvider = resolved.result.hostSetup;
    this.storage = resolved.result.storage;
    this.hostName = resolved.result.hostName;

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
        const hostId = this.hostIdExtractor.getTenantId(fullUrl);
        if (hostId === undefined) {
          next();
          return;
        }
        let hostConfig: TenantNodeConfig;
        try {
          hostConfig = await this.getHostConfig(hostId);
        } catch (e) {
          next();
          return;
        }
        const host = new OprTenantNode(
          {
            ...hostConfig,
            clock: this.clock,
          },
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

  private async getHostConfig(hostId: string): Promise<TenantNodeConfig> {
    // TODO: Cache these in memory for a few minutes
    let hostUrlRoot = this.hostIdExtractor.getRootPathFromId(hostId);
    const configJson = await this.hostConfigProvider.getTenantConfig(hostId);
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
      this.allowedPluginSet,
      {hostOrgUrl}
    );
    // Integration installers need to be annotated with a user-provided mount
    // point. We want to be absolutely sure that the mount point value is right,
    // because it's used to namespace any endpoints created by the installer. So
    // we don't trust the pluggable factory to pickup that config value and set
    // it properly. Instead, we manually inject those values into the
    // configuration to ensure they're correct.
    for (const resolvedPluggable of resolved.allPluggables) {
      if (resolvedPluggable.result.type === 'integrationInstaller') {
        const installer =
          resolvedPluggable.result as TenantNodeIntegrationInstaller;
        installer.mountPath = resolvedPluggable.configJson.mountPath;
      }
    }
    console.log('Resolved', resolved);
    return {
      ...resolved.result,
      hostOrgUrl: hostOrgUrl,
      hostUrlRoot: hostUrlRoot,
      destroy: () => resolved.destroyAll(),
    };
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
    for await (const hostId of this.hostConfigProvider.getAllTenantIds()) {
      const hostConfig = await this.getHostConfig(hostId);
      const host = new OprTenantNode(hostConfig, this.storage);
      this.logger.info('Starting ingest on host', host.hostOrgUrl);
      await host.start();
      await host.ingest();
      await host.destroy();
    }
  }
}
