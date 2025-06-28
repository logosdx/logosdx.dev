import Fs from 'fs';
import Path from 'path';

import { Lifecycle, Request, Server, ServerRoute } from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import * as Hoek from '@hapi/hoek'

import { Frontmatter } from '../methods/markdown/helpers.ts';

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

const docsPath = Path.resolve(import.meta.dirname, '../../docs');

const findMarkdownFiles = (path: string) => {

    const files = Fs.readdirSync(path);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));
    const directories = files.filter((file) => Fs.statSync(`${path}/${file}`).isDirectory());

    directories.forEach((directory) => {

        const subFiles = findMarkdownFiles(`${path}/${directory}`);
        markdownFiles.push(...subFiles.map((file) => `${directory}/${file}`));
    });

    return markdownFiles;
}

const onPreAuth = (metadata: Frontmatter): Lifecycle.Method => {

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

const parseMarkdownFile = async (server: Server, mdFile: string) => {

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

const getMarkdownData = async (server: Server) => {

    const mdFiles = findMarkdownFiles(docsPath);

    const data = await Promise.all(mdFiles.map((mdFile) => parseMarkdownFile(server, mdFile)));

    return data.sort(
        (a, b) => {

            return a.metadata.sort! - b.metadata.sort!;
        }
    );
}

const makeDocsNavData = (data: { metadata: Frontmatter, html: string }[]) => {

    const nav = data.map((item) => ({
        label: item.metadata.title,
        slug: item.metadata.slug,
        description: item.metadata.excerpt,
    }));

    return nav;
}

export default async (server: Server): Promise<ServerRoute[]> => {

    const data = await getMarkdownData(server);
    const nav = makeDocsNavData(data);

    return data.map(({ metadata, html }) => ({
        method: 'GET',
        path: metadata.slug!,
        handler(_: Request, h) {

            const context = { meta: metadata, html, docs: nav };
            const viewOpts = { layout: metadata.layout };

            let res = h.view('docs', context, viewOpts);

            if (metadata.httpHeaders) {

                Object.entries(metadata.httpHeaders).forEach(([key, val]) => {

                    res = res.header(key, val as string);
                });
            }

            return res.code(200);
        },
        options: {
            cache: metadata.cache,
            app: {
                publishedAt: metadata.publishedAt,
                updatedAt: metadata.updatedAt,
                published: metadata.published,
                title: metadata.title,
                description: metadata.description,
                image: metadata.image,
                author: metadata.author,
                keywords: metadata.tags?.join(',') || '',
            },
            ext: {
                onPreAuth: [
                    {
                        method: onPreAuth(metadata),
                    }
                ]
            }
        }
    }));
};