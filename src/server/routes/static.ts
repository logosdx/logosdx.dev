import { ServerRoute } from '@hapi/hapi'
import { isEnv } from '../helpers/index.ts';

const assets: ServerRoute = {
    method: 'GET',
    path: '/assets/{param*}',
    handler: {
        directory: {
            path: '.',
            redirectToSlash: true,
            index: true,
            listing: true
        }
    },
    options: {
        app: {
            excludeFromFeed: true,
        },
        cache: {
            // 30 days in production, 0 in development
            // to prevent caching issues
            expiresIn: isEnv('development') ? 0 : 60 * 60 * 24 * 30, // 30 days
            privacy: 'private',
        },
        cors: {
            origin: ['*'],
        }
    }
}

export default [
    assets
];