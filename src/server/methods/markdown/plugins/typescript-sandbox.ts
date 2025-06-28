import MarkdownIt from 'markdown-it';
import type { StateBlock, Token } from 'markdown-it/index.js';

/**
 * MarkdownIt plugin for rendering TypeScript Sandbox embeds.
 *
 * Parses the format [typescript-sandbox PTAEH....] and converts
 * it to an iframe that embeds the TypeScript Sandbox.
 *
 * @example
 * [typescript-sandbox PTAEH....]
 * [typescript-sandbox PTAEH.... 1024 576]
 * // Renders: <section class="sandbox"><iframe src="https://www.typescriptlang.org/play/?#code/PTAEH...."></iframe></section>
 */
export const typescriptSandboxPlugin = (md: MarkdownIt) => {

    function typescriptSandboxEmbed(state: StateBlock, startLine: number, endLine: number, silent: boolean) {

        let token: Token;
        let start = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];

        // Check if this line matches typescript-sandbox pattern
        const line = state.src.slice(start, max).trim();
        const match = line.match(/^\[typescript-sandbox\s+([a-zA-Z0-9-+]+)(?:\s+(\d+))?(?:\s+(\d+))?\s*\]$/);

        if (!match) {

            return false;
        }

        // Since match is found, we can report success here in validation mode
        if (silent) {

            return true;
        }

        let [, sandboxId, width, height] = match;

        // Create the token
        token = state.push('typescript_sandbox_embed', 'div', 0);
        token.markup = line;
        token.block = true;
        token.map = [startLine, startLine + 1];
        token.meta = { sandboxId, width, height };

        state.line = startLine + 1;

        return true;
    }

    md.block.ruler.before(
        'paragraph',
        'typescript_sandbox_embed',
        typescriptSandboxEmbed,
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
    md.renderer.rules.typescript_sandbox_embed = (tokens, idx) => {

        const token = tokens[idx];
        const { sandboxId, width, height } = token.meta;

        const baseUrl = 'https://www.typescriptlang.org/play/?#code/';
        const url = `${baseUrl}${sandboxId}`;

        const style = width && height ? `style="width: ${width}px; height: ${height}px; border: 0;"` : '';

        return `<section class="sandbox"><iframe src="${url}" ${style}></iframe></section>`;
    };
};