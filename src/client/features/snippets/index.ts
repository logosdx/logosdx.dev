import { $, appendBefore, appendIn, createElWith, html } from '@logosdx/dom';
import { generateId } from '@logosdx/kit'

export const bindSnippet = (pre: Element) => {

    const id = generateId();

    const code = pre.querySelector('code.hljs');
    const langClass = code?.className.split(' ').find(
        (className) => className.startsWith('language-')
    )

    const lang = langClass?.replace('language-', '').toUpperCase();

    const copyEl = createElWith('span', {
        attrs: {
            copy: `#${id} > pre > code.hljs`,
        },
        class: ['copy'],
        children: [
            createElWith('i', {
                attrs: {
                    class: 'fa-sharp fa-copy'
                }
            })
        ]
    });

    const langEl = createElWith('span', {
        attrs: {
            class: `lang ${lang?.toLowerCase() ?? ''}`
        },
        text: lang
    });

    const wrapper = createElWith('div', {
        attrs: {
            id,
        },
        class: ['snippet'],
        children: [
            copyEl,
            langEl
        ]
    });

    appendBefore(pre, wrapper);
    appendIn(wrapper, pre);

    html.behaviors.dispatch('copy');
}
