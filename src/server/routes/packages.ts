import { glob, globSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { ResponseToolkit, Server, ServerRoute } from '@hapi/hapi'
import * as Hoek from '@hapi/hoek';
import { Frontmatter } from '../methods/markdown/helpers.ts';
import { makeRouteConfig, MakeRouteConfigOpts } from '../helpers/docs.ts';

const docsPath = join(import.meta.dirname, '../../docs');

type Package = {
    slug: string;
    title: string;
    description: string;
    items: PackageItem[];
}

type PackageItem = {
    slug: string;
    title: string;
    description: string;
    updatedAt: Date;
    html: string;
    metadata: Frontmatter;
}

const getPackages: (server: Server) => Promise<ServerRoute[]> = async (server) => {

    const _packages = server.appSettings().data.packages as Package[];

    const packages: Package[] = _packages.map(({ slug, title, description }) => ({
        slug,
        title,
        description,
        items: [],
    }));

    const rendereData = await Promise.all(_packages.map(async (pkg, i) => {

        const {
            title,
            description,
            slug,
        } = pkg;

        const filePath = join(docsPath, `packages/${slug}/index.md`);
        const content = readFileSync(filePath, 'utf8');
        const stats = statSync(filePath);
        const html = await server.methods.markdown(content);
        const metadata = await server.methods.getMarkdownMetadata({
            stats,
            mdFile: filePath,
            content,
            external: true,
        });

        const meta = Hoek.merge(
            metadata || {},
            {
                title,
                description,
                slug,
                updatedAt: stats.mtime,
            }
        );

        const children = globSync(
            join(docsPath, `packages/${slug}/**/*.md`)
        )
            .filter(f => !f.includes('index.md') && f.endsWith('.md'));

        const _items: PackageItem[] = await Promise.all(
            children.map(async (p) => {

                const content = readFileSync(p, 'utf8');
                const stats = statSync(p);
                const html = await server.methods.markdown(content);
                const metadata = await server.methods.getMarkdownMetadata({
                    stats,
                    mdFile: p,
                    content,
                });

                const fileSlug = p.replace(resolve(docsPath, `packages`, slug), '').replace('.md', '');
                const metadataSlug = resolve(slug, fileSlug);

                return {
                    slug: metadataSlug,
                    title: metadata?.title,
                    description: metadata?.description,
                    updatedAt: stats.mtime,
                    html,
                    metadata,
                }
            })
        );

        pkg.items = _items;

        packages[i] = pkg;

        return {
            metadata,
            items: _items,
            html,
            slug,
        }
    }));

    const routes = rendereData.map((pkg) => {

        const {
            slug,
            html,
            metadata,
        } = pkg;

        const subRoutes = pkg.items.map((item) => makeRouteConfig({
            slug: `/packages/${slug}${item.slug}`,
            handler: async (_, h) => {

                const context = {
                    meta: item.metadata,
                    html: item.html,
                    packages,
                };
                const viewOpts = { layout: metadata.layout };

                let res = h.view('packages', context, viewOpts);

                if (metadata.httpHeaders) {

                    Object.entries(metadata.httpHeaders).forEach(([key, val]) => {

                        res = res.header(key, val as string);
                    });
                }

                return res.code(200);
            },
            metadata: item.metadata,
        }));

        const rootRoute = makeRouteConfig({
            slug: `/packages/${slug}`,
            handler: async (_, h) => {

                const context = { meta: metadata, html, packages };
                const viewOpts = { layout: metadata.layout };

                let res = h.view('packages', context, viewOpts);

                if (metadata.httpHeaders) {

                    Object.entries(metadata.httpHeaders).forEach(([key, val]) => {

                        res = res.header(key, val as string);
                    });
                }

                return res.code(200);
            },
            metadata,
        });

        return [
            rootRoute,
            ...subRoutes
        ]
    })

    return [
        ...routes.flat(),
        {
            method: 'GET',
            path: '/packages',
            handler: (_, h) => {

                return h
                    .redirect('/packages/utils')
                    .temporary()
                ;
            }
        }
    ]
}

export default getPackages;