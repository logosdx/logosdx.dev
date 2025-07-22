import Fs from 'fs';
import Path from 'path';

import { Lifecycle, Request, RouteOptions, Server, ServerRoute } from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import * as Hoek from '@hapi/hoek'

import { Frontmatter } from '../methods/markdown/helpers.ts';
import { merge } from '@logosdx/kit';

declare module '@hapi/hapi' {
    interface RouteOptionsApp {
        publishedAt?: Date;
        updatedAt?: Date;
        title?: string;
        description?: string;
        image?: string;
        author?: string;
        keywords?: string;
        excludeFromFeed?: boolean;
        published?: boolean;
    }
}

export const docsPath = Path.resolve(import.meta.dirname, '../../docs');

export const findMarkdownFiles = (path: string, exclude: string[] = []) => {

    const excludeRgx = new RegExp(`(${exclude.join('|')})`);

    const files = Fs.readdirSync(path);
    const markdownFiles = files
        .filter((file) => file.endsWith('.md'))
        .filter((file) => !excludeRgx.test(file))
    ;
    const directories = files
        .filter((file) => Fs.statSync(`${path}/${file}`).isDirectory())
        .filter((file) => !excludeRgx.test(file))
    ;

    directories.forEach((directory) => {

        const subFiles = findMarkdownFiles(`${path}/${directory}`);
        markdownFiles.push(...subFiles.map((file) => `${directory}/${file}`));
    });

    return markdownFiles;
}

export const onPreAuth = (metadata: Frontmatter): Lifecycle.Method => {

    const {
        published,
        publishedAt,
    } = metadata;

    const hook: Lifecycle.Method = (_, h) => {

        const today = new Date();

        if (published === false) {

            return Boom.notFound();
        }

        if (publishedAt && today < publishedAt) {

            return Boom.notFound();
        }

        return h.continue;
    }

    return hook;
}

export const parseMarkdownFile = async (server: Server, mdFile: string) => {

    const content = Fs.readFileSync(`${docsPath}/${mdFile}`, 'utf8');
    const stats = Fs.statSync(`${docsPath}/${mdFile}`);

    const html = await server.methods.markdown(content);
    const metadata = await server.methods.getMarkdownMetadata({
        stats,
        mdFile,
        content
    });

    Hoek.assert(metadata, Boom.badImplementation(`No frontmatter found in ${mdFile}`));

    return {
        metadata,
        html,
    };
};

export const getMarkdownData = async (server: Server, exclude: string[] = []) => {

    const mdFiles = findMarkdownFiles(docsPath, exclude);

    const data = await Promise.all(mdFiles.map((mdFile) => parseMarkdownFile(server, mdFile)));

    return data.sort(
        (a, b) => {

            return a.metadata.sort! - b.metadata.sort!;
        }
    );
}

export const makeDocsNavData = (data: { metadata: Frontmatter, html: string }[]) => {

    const nav = data.map((item) => ({
        label: item.metadata.title,
        slug: item.metadata.slug,
        description: item.metadata.excerpt,
    }));

    return nav;
}

export type MakeRouteConfigOpts = {
    metadata: Frontmatter,
    handler: Lifecycle.Method,
    slug?: string,
    options?: RouteOptions,
}

export const makeRouteConfig = (opts: MakeRouteConfigOpts): ServerRoute => ({

    method: 'GET',
    path: opts.slug || opts.metadata.slug!.replace(/\/$/, ''),
    handler: opts.handler,
    options: merge({
        cache: opts.metadata.cache,
        app: {
            publishedAt: opts.metadata.publishedAt,
            updatedAt: opts.metadata.updatedAt,
            published: opts.metadata.published,
            title: opts.metadata.title,
            description: opts.metadata.description,
            image: opts.metadata.image,
            author: opts.metadata.author,
            keywords: opts.metadata.tags?.join(',') || '',
        },
        ext: {
            onPreAuth: [
                {
                    method: onPreAuth(opts.metadata),
                }
            ]
        }
    }, opts.options || {}) as RouteOptions
});