import Path from 'path';
import Hapi from '@hapi/hapi';
import CatboxMemory from '@hapi/catbox-memory';
import Exiting from 'exiting';
import Joi from 'joi';

import {
    inMinutes,
    dependencyInjectServer,
    registerMethods,
    validateEnv,
    registerExtensions,
    registerRoutes,
    registerPlugins
} from './helpers/index.ts';

import AppPlugins from './plugins/index.ts';
import AppExtensions from './extensions/index.ts';
import AppRoutes from './routes/index.ts';
import AppMethods from './methods/index.ts';

import {
    Packages,
    Metadata,
    Nav,
    Redirects
} from './data/index.ts';

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        url: string;
        githubToken: string;
        data: {
            packages: typeof Packages;
            metadata: typeof Metadata;
            nav: typeof Nav;
            redirects: typeof Redirects;
        };
    }

    interface Server {
        appSettings: () => ServerApplicationState;
    }

    interface Request {
        appSettings: () => ServerApplicationState;
    }
}

const deployment = async () => {

    /**
     * First, validate the environment
     */
    const env = validateEnv(process.env.NODE_ENV);

    if (!env) {

        process.exit(1);
    }

    /**
     * Create a new server instance
     */
    const server = Hapi.server({
        port: env.APP_PORT,
        host: '0.0.0.0',
        routes: {
            files: {
                relativeTo: Path.join(import.meta.dirname, 'assets')
            }
        },
        app: {
            githubToken: env.GITHUB_TOKEN,
            url: env.APP_URL,
            data: {
                packages: Packages,
                metadata: Metadata,
                nav: Nav,
                redirects: Redirects
            }
        }
    });

    server.decorate('server', 'appSettings', () => server.settings.app);
    server.decorate('request', 'appSettings', () => server.settings.app);

    /**
     * Use the Joi as the validator
     */
    server.validator(Joi);

    /**
     * Register a cache
     */
    server.cache.provision({
        name: 'memory',
        provider: {
            constructor: CatboxMemory.Engine,
            options: {
                partition: 'cache',
            }
        }
    });

    /**
     * Create a new Exiting manager.
     *
     * This will handle the server shutdown and
     * exit signal capture.
     */
    const manager = Exiting.createManager(server, { exitTimeout: inMinutes(0.5) });

    /**
     * Handle the redirects
     */
    server.ext('onRequest', (request, h) => {

        const { permanent, temporary } = request.appSettings().data.redirects;
        type PermPath = keyof typeof permanent;
        type TempPath = keyof typeof temporary;

        const path = request.path as PermPath | TempPath;

        if (path in permanent) {
            return h
                .redirect(permanent[path as PermPath])
                .permanent()
                .takeover()
            ;
        }

        if (path in temporary) {
            return h
                .redirect(temporary[path as TempPath])
                .temporary()
                .takeover()
            ;
        }

        return h.continue;
    });

    /**
     * Build the server
     */

    await registerExtensions(server, AppExtensions);
    await registerMethods(server, AppMethods);
    await registerPlugins(server, AppPlugins);
    await registerRoutes(server, AppRoutes);

    /**
     * Lets get started
     */

    await server.initialize();
    await manager.start();

    return server;
}

if (import.meta.url === new URL(import.meta.url).href) {

    deployment();
}