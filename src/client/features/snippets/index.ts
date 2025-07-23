import { $, appendBefore, appendIn, copyToClipboard, createEl, createElWith, html } from '@logosdx/dom';
import { generateId } from '@logosdx/kit'

import { isElementBefore, makeIcon } from '../../utils/elements.ts';
import { observer } from '../../utils/observer.ts';

const unfocus = () => {
    $('codeline.focus').forEach(
        line => line.classList.remove('focus')
    );
}

/**
 * Converts stand-alone `<code>` elements into copyable elements.
 * Because we want to be able to copy whenever options are displayed
 * in the documentation.
 */
export const copyableCodeElements = (code: Element) => {

    if (
        code.className.includes('language-') === true ||
        code.closest('pre')
    ) return;

    const icon = makeIcon('copy');

    code.appendChild(icon);

    html.attrs.set(code as HTMLElement, {
        copy: '',
        'copy-text': code.textContent!,
        title: 'Copy to clipboard'
    })
}

/**
 * Prettify code snippets by placing them inside of a wrapper,
 * adding line numbers, and adding a copy button. It gives utility
 * and visual appeal to code snippets.
 */
export const bindSnippet = (pre: Element) => {

    const id = generateId();

    const [code] = $('code[class*="language-"]', pre);
    const langClass = code?.className.split(' ').find(
        (className) => className.startsWith('language-')
    )

    if (!code) {
        return;
    }

    const innerText = code?.textContent;

    let lang = langClass?.replace('language-', '').toLowerCase();

    if (lang === 'ts') {
        lang = 'typescript';
    }

    if (lang === 'js') {
        lang = 'javascript';
    }

    if (lang === 'sh') {
        lang = 'bash';
    }

    const btns = [
        createElWith('span', { class: ['btn'] }),
        createElWith('span', { class: ['btn'] }),
        createElWith('span', { class: ['btn'] }),
    ];

    const btnContainer = createElWith('span', { class: ['btns'], children: btns });
    const utils = createElWith('span', { class: ['utils'] });

    const copyEl = createElWith('span', {
        attrs: {
            copy: '',
            'copy-text': innerText!
        },
        class: ['copy'],
        children: [
            makeIcon('copy'),
            ' snippet'
        ]
    });

    const copyLinesEl = createElWith('span', {
        attrs: {
            copy: '',
            class: 'copy-lines',
            'copy-text': ''
        },
        children: [
            makeIcon('copy'),
            ' lines'
        ]
    });

    const langEl = createElWith('span', {
        attrs: {
            class: `lang ${lang?.toLowerCase() ?? ''}`
        },
        text: lang
    });

    const macButton = createElWith('span', {
        class: ['mac'],
        children: [
            btnContainer,
            langEl,
            utils
        ]
    });


    const wrapper = createElWith('div', {
        attrs: {
            id,
        },
        class: ['snippet'],
        children: [macButton]
    });

    appendIn(utils, copyLinesEl, copyEl);

    appendBefore(pre, wrapper);
    appendIn(wrapper, pre);

    html.behaviors.dispatch('copy');
}

export const bindLines = () => {

    const setCopyText = (snippet: HTMLElement, lines: HTMLElement[]) => {

        const copyLinesEl = $('.copy-lines', snippet);
        const text = lines.map(line => line.innerText).join('\n');

        html.attrs.set(copyLinesEl, { 'copy-text': text });
    }

    const focusedLines = new Set<HTMLElement>();

    const walkLine = (
        line1: HTMLElement,
        line2?: HTMLElement
    ) => {

        let lineStart = line1;
        let lineEnd = line2 ?? line1;

        if (isElementBefore(lineEnd, lineStart)) {
            lineStart = line2 ?? line1;
            lineEnd = line1;
        }

        const siblings: Set<HTMLElement> = new Set([lineStart]);

        if (lineStart === lineEnd || !lineEnd) return siblings;

        let current = lineStart;

        while (current !== lineEnd && current !== null) {
            siblings.add(current);
            current = current.nextElementSibling as HTMLElement;
        }

        siblings.add(lineEnd);

        return siblings;
    }

    observer.on('MouseUp', (evt) => {

        const target = evt.target as HTMLElement;
        const snippet = target.closest('.snippet') as HTMLElement;

        if (!snippet) {

            unfocus();
            focusedLines.clear();

            return;
        }

        const pre = $('pre', snippet);
        const line = target.closest('codeline') as HTMLElement;

        if (!pre || !line) return;
        if (line) focusedLines.add(line)
        if (!line || focusedLines.size === 1) unfocus();


        if (focusedLines.size < 2) {

            line.classList.add('focus');

            setCopyText(snippet, [line]);
            return;
        }

        const inBetweenLines = walkLine(...[...focusedLines] as [HTMLElement, HTMLElement]);

        inBetweenLines.forEach(line => line.classList.add('focus'));
        focusedLines.clear();

        setCopyText(snippet, [...inBetweenLines]);
    });

    observer.on('Escape', () => unfocus());
}