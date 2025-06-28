import { join } from 'path';

import { Server } from '@hapi/hapi';
import { generateId } from '@logosdx/kit';

import { isEnv } from '../../server/helpers/index.ts';


const viewHelpers = (server: Server) => {

    const { url, data: { metadata } } = server.appSettings();

    // Generate a run ID for the current session
    // to prevent caching issues across deployments
    const runId = generateId();

    /**
     * Check if the path is an external link
     */
    const isExternalLink = (path: string) => path.startsWith('http');

    /**
     * Make an internal URL from the base URL and the paths
     */
    const makeUrl = (...paths: string[]) => {

        const u = new URL(url);

        u.pathname = join(u.pathname, ...paths);
        u.searchParams.set('v', runId);

        // Add version to the URL for development
        // to prevent caching issues
        if (isEnv('development')) {
            u.searchParams.set('v', generateId());
        }


        return u.toString();
    }

    // Makes an internal or external asset URL
    const assetUrl = (path: string) => isExternalLink(path) ? path : makeUrl('assets', path);

    // Makes an internal or external link URL
    const link = (path: string) => isExternalLink(path) ? path : makeUrl(path);

    // Check if the current path is the same as the path
    const isActive = (currentPath: string, path: string) => currentPath === path;

    // Check if the current path is the same as the path and returns a class name
    const isActiveClass = (currentPath: string, path: string) => isActive(currentPath, path) ? 'active' : '';

    // Get the meta value or the default value
    const metaOrDefault = (value: string, key: keyof typeof metadata) => value || metadata[key];

    // Check if the current path matches the path
    const pathMatches = (currentPath: string, path: string) => currentPath.startsWith(path);

    return {
        url,
        currentYear: () => new Date().getFullYear(),
        assetUrl,
        link,
        isActive,
        isActiveClass,
        metaOrDefault,
        pathMatches,
    }
}

export default viewHelpers;