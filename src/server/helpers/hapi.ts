import { Lifecycle, Plugin, Server, ServerExtOptions, ServerExtPointFunction, ServerExtType, ServerMethodOptions, ServerRegisterPluginObject, ServerRequestExtType, ServerRoute } from '@hapi/hapi';
import { OneOrMany } from '@logosdx/kit';
import Joi from 'joi';


type TypeOrPromise<T> = T | Promise<T>;
export type ServerDependentFn<T = unknown> = (server: Server) => TypeOrPromise<T | T[]>;

/**
 * Extract configuration objects for the server by first
 * executing the units that require the server object
 * in order to load their configuration
 */
export const dependencyInjectServer = <R extends unknown, T extends unknown = any>(server: Server, things: T | T[]) => {

    if (!Array.isArray(things)) {
        things = [things] as T[];
    }

    return Promise.all(

        things.map((thing) => {

            if (typeof thing === 'function') {

                return thing(server);
            }

            return thing;
        }).flat() as R[]
    )
};


const methodSchema = Joi.object({
    name: Joi.string().required(),
    method: Joi.func().required(),
    options: Joi.object(),
});

export type MethodConfig = {
    name: string;
    method: (...args: any[]) => any;
    options?: ServerMethodOptions;
}

export type Methods = MethodConfig | MethodConfig[] | ServerDependentFn<MethodConfig | MethodConfig[]>;

export const registerMethods = async (server: Server, _methods: Methods[]) => {

    const methods = await dependencyInjectServer<MethodConfig>(server, _methods);

    Joi.assert(
        methods,
        Joi.array().items(methodSchema),
    );

    methods.forEach(({ name, method, options }) => {

        server.method(name, method, options);
    });

}

const extensionSchema = Joi.object({
    type: Joi
        .string()
        .required()
        .valid(
            'onCredentials',
            'onPostAuth',
            'onPostHandler',
            'onPostResponse',
            'onPostStart',
            'onPostStop',
            'onPreAuth',
            'onPreHandler',
            'onPreResponse',
            'onPreStart',
            'onPreStop',
            'onRequest',
        ),
    method: Joi.alt(
        Joi.func().arity(1),
        Joi.func().arity(2),
    ).required(),
    options: Joi.object(),
});

export type ExtensionConfig = {
    type: ServerExtType | ServerRequestExtType,
    method: Lifecycle.Method | ServerExtPointFunction,
    options?: ServerExtOptions
}

export type Extensions = ExtensionConfig | ExtensionConfig[] | ServerDependentFn<ExtensionConfig | ExtensionConfig[]>;

export const registerExtensions = async (server: Server, _extensions: Extensions[]) => {

    const extensions = await dependencyInjectServer<ExtensionConfig>(server, _extensions);

    Joi.assert(
        extensions,
        Joi.array().items(extensionSchema),
    );

    extensions.forEach(({ type, method, options }) => {

        server.ext(type as ServerExtType, method as ServerExtPointFunction, options);
    });
}

export type PluginConfigs = (

    Plugin<any, any> |
    ServerRegisterPluginObject<any, any>
);

export type PluginConfigFn = ServerDependentFn<PluginConfigs | PluginConfigs[]>;

export type Plugins = OneOrMany<PluginConfigs | PluginConfigFn>;

export const registerPlugins = async (server: Server, _plugins: Plugins) => {

    const plugins = await dependencyInjectServer<ServerRegisterPluginObject<any, any>>(server, _plugins);

    await server.register(plugins);
}

export type Routes = ServerRoute | ServerRoute[] | ServerDependentFn<ServerRoute | ServerRoute[]>;

export const registerRoutes = async (server: Server, _routes: Routes[]) => {

    const routes = await dependencyInjectServer<ServerRoute>(server, _routes);

    routes.forEach((route) => {

        server.route(route);
    });
}

