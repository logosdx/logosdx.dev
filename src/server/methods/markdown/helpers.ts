import type { RouteOptionsCache } from '@hapi/hapi';
import Joi from 'joi';

import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import MarkdownItAbbr from 'markdown-it-abbr';
import * as MarkdownItEmoji from 'markdown-it-emoji';
import MarkdownItFootnote from 'markdown-it-footnote';
import MarkdownTaskList from 'markdown-it-task-lists';

import { frontmatterPlugin } from './plugins/frontmatter.ts';
import { codesandboxPlugin } from './plugins/codesandbox.ts';
import { typescriptSandboxPlugin } from './plugins/typescript-sandbox.ts';
import { youtubePlugin } from './plugins/youtube.ts';
import { vimeoPlugin } from './plugins/vimeo.ts';
import { twitterPlugin } from './plugins/twitter.ts';

export type Frontmatter = {
    title: string;
    description: string;
    image: string;
    author: string;
    published: boolean;
    publishedAt?: Date;
    updatedAt?: Date;
    slug?: string;
    excerpt?: string;
    sort?: number;
    tags?: string[];
    layout?: string;

    httpHeaders?: Record<string, string>;
    cache?: RouteOptionsCache;

    // SEO and meta tags
    meta?: Partial<{
        fbTitle: string;
        fbDescription: string;
        fbImage: string;
        fbType: string;
        fbLocale: string;
        fbSiteName: string;

        twTitle: string;
        twDescription: string;
        twImage: string;
        twAuthor: string;
        twCard: string;
        twSite: string;
        twCreator: string;

        // Additional SEO fields
        keywords: string[];
        canonical: string;
        robots: string;

        // Structured data
        structuredData: Record<string, any>;
    }>

    // Redirects
    redirect?: {
        to: string | number;
        permanent: boolean;
    }
}

export const frontmatterSchema = Joi.object<Frontmatter>({
    title: Joi.string().required(),
    description: Joi.string().required(),
    slug: Joi.string(),
    published: Joi.boolean().default(false),
    publishedAt: Joi.date(),
    excerpt: Joi.string(),
    sort: Joi.number(),
    tags: Joi.array().items(Joi.string()),
    updatedAt: Joi.date(),
    image: Joi.string().uri(),
    layout: Joi.string().default('main'),

    cache: Joi.alternatives().try(
        Joi.object({
            expiresIn: Joi.number(),
            expiresAt: Joi.string(),
            privacy: Joi.string(),
            statuses: Joi.array().items(Joi.number()),
            otherwise: Joi.string(),
        }),
        Joi.boolean()
    ),

    httpHeaders: Joi.object().pattern(
        Joi.string(),
        Joi.string()
    ),
    meta: Joi.object({
        fbTitle: Joi.string(),
        fbDescription: Joi.string(),
        fbImage: Joi.string(),
        fbType: Joi.string(),
        fbLocale: Joi.string(),
        fbSiteName: Joi.string(),

        twTitle: Joi.string(),
        twDescription: Joi.string(),
        twImage: Joi.string(),
        twAuthor: Joi.string(),
        twCard: Joi.string(),
        twSite: Joi.string(),
        twCreator: Joi.string(),

        keywords: Joi.array().items(Joi.string()),
        canonical: Joi.string(),
        robots: Joi.string(),

        structuredData: Joi.object().pattern(
            Joi.string(),
            Joi.any()
        ),
    }),
    redirect: Joi.object({
        to: Joi.string().required(),
        permanent: Joi.boolean().default(false),
    }),
});

export const markdown = new MarkdownIt({
    breaks: true,
    html: true,
    linkify: true,
    typographer: true,
    xhtmlOut: true,
    highlight(str, lang) {

        if (lang === 'ts') {
            lang = 'typescript';
        }

        if (lang === 'js') {
            lang = 'javascript';
        }

        if (lang === 'sh') {
            lang = 'bash';
        }

        return `<pre><code class="language-${lang}">${str}</code></pre>`;
    },
})
    .use(frontmatterPlugin)
    .use(MarkdownItAbbr)
    .use(MarkdownItEmoji.full)
    .use(MarkdownItFootnote)
    .use(MarkdownItAnchor)
    .use(MarkdownTaskList)
    .use(codesandboxPlugin)
    .use(typescriptSandboxPlugin)
    .use(youtubePlugin)
    .use(vimeoPlugin)
    .use(twitterPlugin)
;
