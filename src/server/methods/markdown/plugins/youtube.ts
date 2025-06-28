import MarkdownIt from 'markdown-it';
import type { StateBlock, Token } from 'markdown-it/index.js';

/**
 * Extracts the Youtube video ID from a URL.
 * https://www.youtube.com/watch?v=igoUKsvQqfI
 * https://youtu.be/igoUKsvQqfI?si=U7nmSEf_cS9DbC1u
 *
 * @param _url - The URL to extract the video ID from.
 * @returns The video ID, or null if the URL is not a valid Youtube URL.
 */
const extractYoutubeId = (_url: string) => {

    const url = new URL(_url);

    if (
        !url.hostname.includes('youtube.com') &&
        !url.hostname.includes('youtu.be')
    ) {
        return null;
    }

    let [, videoId] = url.pathname.split('/');

    if (url.searchParams.has('v')) {
        videoId = url.searchParams.get('v')!;
    }

    return videoId;
}

/**
 * MarkdownIt plugin for rendering Youtube embeds.
 *
 * Parses the format [youtube dQw4w9WgXcQ 100% 720px] and converts
 * it to an iframe that embeds the Youtube video.
 *
 * @example
 * [youtube dQw4w9WgXcQ 1024 576]
 * [youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ 1024 576]
 *
 * // Renders: <section class="youtube"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="1024" height="576" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></section>
 */
export const youtubePlugin = (md: MarkdownIt) => {

    function youtubeEmbed(state: StateBlock, startLine: number, endLine: number, silent: boolean) {

        let token: Token;
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];

        // Check if this line matches youtube pattern
        const line = state.src.slice(start, max).trim();
        const match = line.match(/^\[youtube\s+([^\s\]]+)(?:\s+(\d+))?(?:\s+(\d+))?\s*\]$/);

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

            videoIdOrUrl = extractYoutubeId(videoIdOrUrl)!;
        }

        // Create the token
        token = state.push('youtube_embed', 'div', 0);
        token.markup = line;
        token.block = true;
        token.map = [startLine, startLine + 1];
        token.meta = { videoId: videoIdOrUrl, width, height };

        state.line = startLine + 1;

        return true;
    }

    md.block.ruler.before(
        'paragraph',
        'youtube_embed',
        youtubeEmbed,
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
    md.renderer.rules.youtube_embed = (tokens, idx) => {

        const token = tokens[idx];
        const { videoId, width = '1024', height = '576' } = token.meta;

        const baseUrl = 'https://www.youtube.com/embed/';
        const url = `${baseUrl}${videoId}`;

        const style = width && height ? `style="width: ${width}px; height: ${height}px; border: 0;"` : '';

        return `<section class="youtube"><iframe src="${url}" ${style} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></section>`;
    };
};