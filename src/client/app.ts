import { onceReady, html } from '@logosdx/dom';

import './app.scss';

import { bindKeyboard } from './features/keyboard.ts';
import { bindMouse } from './features/mouse.ts';
import { bindBody } from './features/body.ts';
import { bindCopy } from './features/copy.ts';
import { bindToc } from './features/toc.ts';
import { bindSnippet } from './features/snippets/index.ts';
import { bindAlerts } from './features/alerts/index.ts';
import { bindMobileMenu } from './components/nav/index.ts';
import { bindVideos } from './features/videos.ts';
import { fixLink } from './features/links.ts';

const init = () => {

    const { dispatch} = html.behaviors.create({
        keyboard: bindKeyboard,
        mouse: bindMouse,
        body: bindBody,
        highlight: () => hljs.highlightAll(),
        mobileMenu: bindMobileMenu,
        copy: {
            els: '[copy]',
            handler: bindCopy,
        },
        snippets: {
            els: 'pre:has(>code[class*="language-"])',
            handler: bindSnippet,
        },
        links: {
            els: 'a',
            handler: fixLink,
        },
        toc: bindToc,
        alerts: bindAlerts,
        videos: bindVideos,
    });

    dispatch();
}

onceReady(() => init());