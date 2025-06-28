import { Server, ServerRoute } from '@hapi/hapi'
import * as Hoek from '@hapi/hoek';

const getPackages: (server: Server) => ServerRoute[] = (server) => {

    const _packages = server.appSettings().data.packages;

    const packages = _packages.map(({ slug, title, description }) => ({
        slug,
        title,
        description,
    }));

    const packageRoutes: ServerRoute[] = _packages.map((pkg) => {

        const {
            title,
            description,
            slug,
            githubLink,
            metadata,
        } = pkg;

        return {
            method: 'GET',
            path: `/packages/${pkg.slug}`,
            handler: async (req, h) => {

                const [ghApi, filePath] = githubLink.split('/contents/');
                const commitLink = `${ghApi}/commits?path=${encodeURIComponent(filePath)}`;

                const content = await req.server.methods.ghContent(githubLink);
                const updatedAt = await req.server.methods.ghLastUpdated(commitLink);

                const html = await req.server.methods.markdown(content);
                const metadata = await req.server.methods.getMarkdownMetadata({
                    stats: {
                        mtime: new Date(updatedAt),
                    } as any,
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
                        updatedAt,
                    }
                );

                return h.view('packages', { html, meta, packages });
            },
            options: {
                app: {
                    title,
                    description,
                    slug,
                    ...metadata,
                }
            }
        }
    });

    return [
        ...packageRoutes,
        {
            method: 'GET',
            path: '/packages',
            handler: (request, h) => {

                return h
                    .redirect('/packages/utils')
                    .temporary()
                ;
            }
        }
    ]
}

export default getPackages;