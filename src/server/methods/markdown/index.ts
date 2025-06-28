import { basename, join } from 'path';
import { Stats } from 'fs';

import { ServerMethodOptions} from '@hapi/hapi';
import { stringify } from '@hapi/hoek';

import { sha1, inHours } from '../../helpers/index.ts';

import { getFrontmatter } from './plugins/frontmatter.ts';
import { markdown, Frontmatter, frontmatterSchema } from './helpers.ts';

declare module '@hapi/hapi' {

    interface ServerMethods {
        markdown: typeof generateMarkdown;
        getMarkdownMetadata: typeof getMarkdownMetadata;
    }
}

const getMarkdownMetadata = async (opts: {
    stats: Stats,
    mdFile: string,
    content: string,
    external?: boolean,
}): Promise<Frontmatter> => {

    const { stats, mdFile, content } = opts;

    const frontmatter = getFrontmatter(content);

    if (!frontmatter) {
        throw new Error(`No frontmatter found in ${mdFile}`);
    }

    if (!opts.external) {

        const { error } = frontmatterSchema.validate(frontmatter);

        if (error) {
            (error as any).cause = `docs/${mdFile}`;

            throw error;
        }
    }

    let slug = mdFile.replace('.md', '');

    if (frontmatter.slug) {
        slug = mdFile.replace(basename(mdFile), frontmatter.slug);
    }

    if (!frontmatter.excerpt) {
        frontmatter.excerpt = frontmatter.description;
    }

    if (!frontmatter.sort) {
        frontmatter.sort = 0;
    }

    slug = join('/docs', slug);

    const publishedAt = frontmatter.publishedAt ? new Date(frontmatter.publishedAt) : undefined;
    const updatedAt = stats.mtime < (publishedAt || 0) ? publishedAt : stats.mtime;

    return {
        ...frontmatter,
        slug,
        updatedAt,
        publishedAt,
        meta: {
            ...frontmatter.meta,
            fbTitle: frontmatter.meta?.fbTitle || frontmatter.title,
            fbDescription: frontmatter.meta?.fbDescription || frontmatter.description,
            fbImage: frontmatter.meta?.fbImage || frontmatter.image,
            fbType: frontmatter.meta?.fbType || 'website',
            fbLocale: frontmatter.meta?.fbLocale || 'en_US',
            fbSiteName: frontmatter.meta?.fbSiteName || 'Logosdx.dev',

            twTitle: frontmatter.meta?.twTitle || frontmatter.title,
            twDescription: frontmatter.meta?.twDescription || frontmatter.description,
            twImage: frontmatter.meta?.twImage || frontmatter.image,
            twAuthor: frontmatter.meta?.twAuthor || frontmatter.author,
            twCard: frontmatter.meta?.twCard || 'summary_large_image',
            twSite: frontmatter.meta?.twSite || 'Logosdx.dev',
            twCreator: frontmatter.meta?.twCreator || '@Logosdx',

            keywords: frontmatter.meta?.keywords || [],
            canonical: frontmatter.meta?.canonical || frontmatter.slug,
            robots: frontmatter.meta?.robots || 'index, follow',
        }
    }
};


const generateMarkdown = async (text: string) => markdown.render(text);

const options: (segment: string) => ServerMethodOptions = (segment) => ({
    cache: {
        cache: 'memory',
        segment,
        expiresIn: inHours(24),
        generateTimeout: 1000,
        staleIn: inHours(1),
        staleTimeout: 10,
    },

    generateKey(...args: any[]) {

        return sha1(stringify(args));
    },
});


export default [
    {
        name: 'getMarkdownMetadata',
        method: getMarkdownMetadata,
        options: options('getMarkdownMetadata')
    },
    {
        name: 'markdown',
        method: generateMarkdown,
        options: options('markdown')
    }
];
