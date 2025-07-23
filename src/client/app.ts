import { onceReady, html } from '@logosdx/dom';

import './app.scss';

import { bindKeyboard } from './features/keyboard.ts';
import { bindMouse } from './features/mouse.ts';
import { bindBody } from './features/body.ts';
import { bindCopy } from './features/copy.ts';
import { bindToc } from './features/toc.ts';
import { bindSnippet, copyableCodeElements, bindLines } from './features/snippets/index.ts';
import { bindAlerts } from './features/alerts/index.ts';
import { bindMobileMenu } from './components/nav/index.ts';
import { bindVideos } from './features/videos.ts';
import { fixLink } from './features/links.ts';
import { bindHome } from './features/home.ts';

const init = () => {

    hljs.addPlugin({
        'after:highlightElement': (opts: any) => {

            const el = opts?.el;
            if (!el) return;

            const lines = el.innerHTML.split('\n').map(
                (line: string) => {
                    return `<codeline>${line}</codeline>`;
                }
            ).join('\n');

            el.innerHTML = lines;
        },
    });

    const { dispatch } = html.behaviors.create({
        keyboard: bindKeyboard,
        mouse: bindMouse,
        body: bindBody,
        highlight: () => hljs.highlightAll(),
        mobileMenu: bindMobileMenu,
        alerts: bindAlerts,
        videos: bindVideos,
        lines: bindLines,
        snippets: {
            els: 'pre:has(> code[class*="language-"])',
            handler: bindSnippet,
        },
        code: {
            els: 'code',
            handler: copyableCodeElements,
        },
        links: {
            els: 'a',
            handler: fixLink,
        },
        copy: {
            els: '[copy]',
            handler: bindCopy,
        },
        toc: bindToc,
        home: bindHome,
    });

    dispatch();
}

onceReady(() => init());