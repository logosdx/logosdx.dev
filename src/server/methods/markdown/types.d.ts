declare module 'markdown-it-abbr' {

    import MarkdownIt from 'markdown-it';
    export default function abbr(md: MarkdownIt): void;
}

declare module 'markdown-it-emoji' {
    import MarkdownIt from 'markdown-it';

    interface EmojiOptions {
        defs?: Record<string, string>;
        enabled?: string[];
        shortcuts?: Record<string, string | string[]>;
    }

    const plugin: (md: MarkdownIt, options?: EmojiOptions) => void;

    export const full: typeof plugin;
    export const light: typeof plugin;
    export const bare: typeof plugin;

    // Legacy default export for backward compatibility
    const emoji: {
        full: typeof plugin;
        light: typeof plugin;
        bare: typeof plugin;
    };

    export default emoji;
}

declare module 'markdown-it-footnote' {
    import MarkdownIt from 'markdown-it';
    export default function footnote(md: MarkdownIt): void;
}

declare module 'markdown-it-table-of-contents' {
    import MarkdownIt from 'markdown-it';

    interface TocOptions {
        includeLevel?: number[];
        containerClass?: string;
        slugify?: (text: string, content?: string) => string;
        markerPattern?: RegExp;
        listType?: 'ul' | 'ol';
        format?: (content: string, md: MarkdownIt) => string;
        containerHeaderHtml?: string;
        containerFooterHtml?: string;
        transformLink?: (link: string) => string;
        transformContainerOpen?: (containerClass: string, containerHeaderHtml?: string) => string;
        transformContainerClose?: (containerFooterHtml?: string) => string;
        getTokensText?: (tokens: any[]) => string;
    }

    export default function toc(md: MarkdownIt, options?: TocOptions): void;
}

declare module 'markdown-it-task-lists' {
    import MarkdownIt from 'markdown-it';

    interface TaskListOptions {
        enabled?: boolean;
        label?: boolean;
        labelAfter?: boolean;
    }

    export default function taskLists(md: MarkdownIt, options?: TaskListOptions): void;
}

