import MarkdownIt from 'markdown-it';
import type { StateBlock, Token } from 'markdown-it/index.js';

const extractVimeoId = (_url: string) => {

    const url = new URL(_url);

    if (!url.hostname.includes('vimeo.com')) {
        return null;
    }

    const pathname = url.pathname;

    const [, videoId] = pathname.split('/');

    return videoId;
}

/**
 * MarkdownIt plugin for rendering Vimeo embeds.
 *
 * Parses the format [vimeo 123456789 100% 720px] and converts
 * it to an iframe that embeds the Vimeo video.
 *
 * @example
 * [vimeo 123456789 1024 576]
 * [vimeo https://vimeo.com/123456789 1024 576]
 *
 * // Renders: <section class="vimeo"><iframe src="https://player.vimeo.com/video/123456789" width="1024" height="576" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></section>
 */
export const vimeoPlugin = (md: MarkdownIt) => {

    function vimeoEmbed(state: StateBlock, startLine: number, endLine: number, silent: boolean) {

        let token: Token;
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];

        // Check if this line matches vimeo pattern
        const line = state.src.slice(start, max).trim();
        const match = line.match(/^\[vimeo\s+([^\s\]]+)(?:\s+(\d+))?(?:\s+(\d+))?\s*\]$/);

        if (!match) {

            return false;
        }

        // Since match is found, we can report success here in validation mode
        if (silent) {

            return true;
        }

        let [, videoIdOrUrl, width = '1024', height = '576'] = match;

        // Extract video ID if URL is provided
        if (/^https?:\/\//.test(videoIdOrUrl)) {

            videoIdOrUrl = extractVimeoId(videoIdOrUrl)!;
        }

        // Create the token
        token = state.push('vimeo_embed', 'div', 0);
        token.markup = line;
        token.block = true;
        token.map = [startLine, startLine + 1];
        token.meta = { videoId: videoIdOrUrl, width, height };

        state.line = startLine + 1;

        return true;
    }

    md.block.ruler.before(
        'paragraph',
        'vimeo_embed',
        vimeoEmbed,
        {
            alt: [
                'paragraph',
                'reference',
                'blockquote',
                'list'
            ]
        }
    );

    // Renderer
    md.renderer.rules.vimeo_embed = (tokens, idx) => {

        const token = tokens[idx];
        const { videoId, width = '1024', height = '576' } = token.meta;

        const baseUrl = 'https://player.vimeo.com/video/';
        const url = `${baseUrl}${videoId}`;

        const style = width && height ? `style="width: ${width}px; height: ${height}px; border: 0;"` : '';

        return `<section class="vimeo"><iframe src="${url}" ${style} width="${width}" height="${height}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></section>`;
    };
};