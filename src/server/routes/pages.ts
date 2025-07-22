import { Server, ServerRoute } from '@hapi/hapi';

import { Frontmatter } from '../methods/markdown/helpers.ts';
import { getMarkdownData, makeRouteConfig } from '../helpers/docs.ts';

const makeDocsNavData = (data: { metadata: Frontmatter, html: string }[]) => {

    const nav = data.map((item) => ({
        label: item.metadata.title,
        slug: item.metadata.slug,
        description: item.metadata.excerpt,
    }));

    return nav;
}

export default async (server: Server): Promise<ServerRoute[]> => {

    const data = await getMarkdownData(server, ['/packages']);
    const nav = makeDocsNavData(data);


    return data.map(({ metadata, html }) => makeRouteConfig({
        metadata,
        slug: metadata.slug!.replace(/\/$/, ''),
        handler: (_, h) => {

            const context = { meta: metadata, html, docs: nav };
            const viewOpts = { layout: metadata.layout };

            let res = h.view('docs', context, viewOpts);

            if (metadata.httpHeaders) {

                Object.entries(metadata.httpHeaders).forEach(([key, val]) => {

                    res = res.header(key, val as string);
                });
            }

            return res.code(200);
        }
    }));
};