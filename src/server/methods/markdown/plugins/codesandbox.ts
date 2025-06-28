import MarkdownIt from 'markdown-it';
import type { StateBlock, Token } from 'markdown-it/index.js';

/**
 * MarkdownIt plugin for rendering CodeSandbox embeds.
 *
 * Parses the format [codesandbox sandbox-id /optional/file.js] and converts
 * it to an iframe that embeds the CodeSandbox.
 *
 * @example
 * [codesandbox sandbox-7giodp /optional/file.js 1024 576]
 * [codesandbox sandbox-7giodp 1024 576]
 * // Renders: <section class="codesandbox"><iframe src="https://codesandbox.io/p/sandbox/sandbox-7giodp?file=/optional/file.js"></iframe></section>
 */
export const codesandboxPlugin = (md: MarkdownIt) => {

    function codesandboxEmbed(state: StateBlock, startLine: number, endLine: number, silent: boolean) {

        let token: Token;
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];

        // Check if this line matches codesandbox pattern
        const line = state.src.slice(start, max).trim();
        const match = line.match(/^\[codesandbox\s+([a-zA-Z0-9-]+)(?:\s+(\/[^\]]+))?\s*\]$/);

        if (!match) {

            return false;
        }

        // Since match is found, we can report success here in validation mode
        if (silent) {

            return true;
        }

        let [, sandboxId, filePath, width, height] = match;

        if (/^\d+$/.test(filePath)) {

            width = filePath;
            height = width;
        }

        // Create the token
        token = state.push('codesandbox_embed', 'div', 0);
        token.markup = line;
        token.block = true;
        token.map = [startLine, startLine + 1];
        token.meta = { sandboxId, filePath, width, height };

        state.line = startLine + 1;

        return true;
    }

    md.block.ruler.before(
        'paragraph',
        'codesandbox_embed',
        codesandboxEmbed,
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
    md.renderer.rules.codesandbox_embed = (tokens, idx) => {

        const token = tokens[idx];
        const { sandboxId, filePath, width, height } = token.meta;

        const baseUrl = 'https://codesandbox.io/p/sandbox/';
        const url = filePath ? `${baseUrl}${sandboxId}?file=${filePath}` : `${baseUrl}${sandboxId}`;

        const style = width && height ? `style="width: ${width}px; height: ${height}px; border: 0;"` : '';

        return `<section class="sandbox"><iframe src="${url}" ${style}></iframe></section>`;
    };
};