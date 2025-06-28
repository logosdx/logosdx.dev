import { Plugin, ServerRegisterPluginObject } from '@hapi/hapi'
import Inert from '@hapi/inert'

import { Plugins } from '../helpers/index.ts';

import DevWatch from './_dev/watch.ts';
import Logger, { jsonPrint, LogEvent, LoggerOpts, prettyPrint } from './logger/index.ts'
import VisionPlugins from './vision/index.ts';
// import RssFeed from './rss-feed';

const LOG_PICK_DEFAULT = [
    'method',
    'path',
    'query',
    'statusCode',
    'time',
    'message',
    'stack',
    'data',
];

// Extra log fields to pick
const LOG_PICK_EXTRA = process.env.APP_LOG_PICK_EXTRA?.split(',') || []
// All log fields to pick
const LOG_PICK = process.env.APP_LOG_PICK?.split(',') || LOG_PICK_DEFAULT.concat(LOG_PICK_EXTRA)

const loggerPlugin: ServerRegisterPluginObject<LoggerOpts> = {

    plugin: Logger,
    options: {
        handler: process.env.NODE_ENV === 'production' ? jsonPrint : prettyPrint,
        pick: LOG_PICK as (keyof LogEvent)[],
        stripStack: process.env.APP_LOG_STRIP_STACK === 'true'
    }
}

const inertPlugin: ServerRegisterPluginObject<Inert.OptionalRegistrationOptions> = {
    plugin: Inert,
    options: {}
}


const plugins: Plugins = [

    loggerPlugin,
    inertPlugin,
    ...VisionPlugins,
    // RssFeed,
    DevWatch
] as const;

export default plugins;