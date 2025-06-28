import MarkdownIt from 'markdown-it';
import type { StateBlock, Token } from 'markdown-it/index.js';

/**
 * Extracts the Twitter tweet ID from a URL.
 * https://twitter.com/MattIPv4/status/1576415168426573825
 * https://x.com/i/status/1881200000000000000
 *
 * @param _url - The URL to extract the tweet ID from.
 * @returns The tweet ID, or null if the URL is not a valid Twitter URL.
 */
const extractTwitterId = (_url: string) => {

    const url = new URL(_url);

    if (
        !url.hostname.includes('twitter.com') &&
        !url.hostname.includes('x.com')
    ) {
        return null;
    }

    const match = url.pathname.match(/\/status\/(\d+)/);

    return match ? match[1] : null;
}

/**
 * MarkdownIt plugin for rendering Twitter embeds.
 *
 * Parses the format [twitter 1881200000000000000] and converts
 * it to an iframe that embeds the Twitter video.
 *
 * @example
 * [twitter 1881200000000000000]
 * [twitter https://x.com/i/status/1881200000000000000]
 *
 * // Renders: <blockquote class="twitter-tweet"><p lang="en" dir="ltr">The temptation to leave tech and run away to some charity in the countryside doing good for the world increases evermore each day.</p>&mdash; Matt Cowley (@MattIPv4) <a href="https://twitter.com/MattIPv4/status/1576415168426573825?ref_src=twsrc%5Etfw">October 2, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
 */
export const twitterPlugin = (md: MarkdownIt) => {

    function twitterEmbed(state: StateBlock, startLine: number, endLine: number, silent: boolean) {

        let token: Token;
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];

        // Check if this line matches twitter pattern
        const line = state.src.slice(start, max).trim();
        const match = line.match(/^\[twitter\s+([^\s\]]+)\s*\]$/);

        if (!match) {

            return false;
        }

        // Since match is found, we can report success here in validation mode
        if (silent) {

            return true;
        }

        let [, tweetIdOrUrl] = match;

        // Extract tweet ID if URL is provided
        if (/^https?:\/\//.test(tweetIdOrUrl)) {

            tweetIdOrUrl = extractTwitterId(tweetIdOrUrl)!;
        }

        // Create the token
        token = state.push('twitter_embed', 'div', 0);
        token.markup = line;
        token.block = true;
        token.map = [startLine, startLine + 1];
        token.meta = { tweetId: tweetIdOrUrl };

        state.line = startLine + 1;

        return true;
    }

    md.block.ruler.before(
        'paragraph',
        'twitter_embed',
        twitterEmbed,
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
    md.renderer.rules.twitter_embed = (tokens, idx) => {

        const token = tokens[idx];
        const { tweetId } = token.meta;

        return `<section class="twitter"><blockquote class="twitter-tweet"><a href="https://twitter.com/MattIPv4/status/${tweetId}"></a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script></section>`;
    };
};