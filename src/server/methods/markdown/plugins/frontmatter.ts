import MarkdownIt from 'markdown-it';
import type { StateBlock, Token } from 'markdown-it/index.js'
import Yaml from 'yaml';

import { sha1 } from '../../../helpers/misc.ts';
import { Frontmatter } from '../helpers.ts';

const fmCache = new Map<string, Frontmatter>();

const generateKey = (text: string) => {
    return sha1(text.trim());
}


export const getFrontmatter = (text: string) => {

    if (typeof text !== 'string') {
        throw new Error('getFrontmatter: Text must be a string');
    }

    return fmCache.get(generateKey(text)) || null;
}

/**
 * MarkdownIt plugin for extracting Frontmatter and preventing it
 * from being rendered.
 *
 * @see https://github.com/parksb/markdown-it-front-matter/blob/master/index.js
 *
 * @example
 * ---
 * title: My Title
 * description: My Description
 * ---
 *
 * # My Title
 *
 * // Renders: <h1>My Title</h1>
 */
export const frontmatterPlugin = (md: MarkdownIt) => {
    const min_markers = 3;
    const marker_str = '-';
    const marker_char = marker_str.charCodeAt(0);
    const marker_len = marker_str.length;

    function frontMatter(state: StateBlock, startLine: number, endLine: number, silent: boolean) {
        let pos;
        let nextLine;
        let marker_count;
        let token: Token;
        let old_parent;
        let old_line_max;
        let start_content;
        let auto_closed = false;
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];

        // Check out the first character of the first line quickly,
        // this should filter out non-front matter
        if (startLine !== 0 || marker_char !== state.src.charCodeAt(0)) {
            return false;
        }

        // Check out the rest of the marker string
        // while pos <= 3
        for (pos = start + 1; pos <= max; pos++) {
            if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
                start_content = pos + 1;
                break;
            }
        }

        marker_count = Math.floor((pos - start) / marker_len);

        if (marker_count < min_markers) {
            return false;
        }
        pos -= (pos - start) % marker_len;

        // Since start is found, we can report success here in validation mode
        if (silent) {
            return true;
        }

        const key = generateKey(state.src);

        // Search for the end of the block
        nextLine = startLine;

        for (; ;) {
            nextLine++;
            if (nextLine >= endLine) {
                // unclosed block should be autoclosed by end of document.
                // also block seems to be autoclosed by end of parent
                break;
            }

            if (state.src.slice(start, max) === '...') {
                break;
            }

            start = state.bMarks[nextLine] + state.tShift[nextLine];
            max = state.eMarks[nextLine];

            if (start < max && state.sCount[nextLine] < state.blkIndent) {
                // non-empty line with negative indent should stop the list:
                // - ```
                //  test
                break;
            }

            if (marker_char !== state.src.charCodeAt(start)) {
                continue;
            }

            if (state.sCount[nextLine] - state.blkIndent >= 4) {
                // closing fence should be indented less than 4 spaces
                continue;
            }

            for (pos = start + 1; pos <= max; pos++) {
                if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
                    break;
                }
            }

            // closing code fence must be at least as long as the opening one
            if (Math.floor((pos - start) / marker_len) < marker_count) {
                continue;
            }

            // make sure tail has spaces only
            pos -= (pos - start) % marker_len;
            pos = state.skipSpaces(pos);

            if (pos < max) {
                continue;
            }

            // found!
            auto_closed = true;
            break;
        }

        old_parent = state.parentType;
        old_line_max = state.lineMax;

        state.parentType = 'root';

        // this will prevent lazy continuations from ever going past our end marker
        state.lineMax = nextLine;

        token = state.push('front_matter', 'front_matter', 0);
        token.hidden = true;
        token.markup = state.src.slice(startLine, pos);
        token.block = true;
        token.map = [startLine, nextLine + (auto_closed ? 1 : 0)];
        token.meta = state.src.slice(start_content, start - 1);

        state.parentType = old_parent;
        state.lineMax = old_line_max;
        state.line = nextLine + (auto_closed ? 1 : 0);

        const fm = Yaml.parse(token.meta);

        fmCache.set(key, fm);

        return true;
    }

    md.block.ruler.before(
        'table',
        'front_matter',
        frontMatter,
        {
            alt: [
                'paragraph',
                'reference',
                'blockquote',
                'list'
            ]
        }
    );
};