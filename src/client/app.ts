import { onceReady, html } from '@logosdx/dom';

import './app.scss';

import { bindKeyboard } from './features/keyboard.ts';
import { bindMouse } from './features/mouse.ts';
import { bindBody } from './features/body.ts';
import { bindCopy } from './features/copy.ts';
import { bindToc } from './features/toc.ts';
import { bindSnippets } from './features/snippets/index.ts';
import { bindAlerts } from './features/alerts/index.ts';
import { bindMobileMenu } from './components/nav/index.ts';
import { bindVideos } from './features/videos.ts';
import { bindLinks } from './features/links.ts';

const init = () => {

    html.behaviors.createBehaviorRegistry({
        keyboard: bindKeyboard,
        mouse: bindMouse,
        body: bindBody,
        highlight: () => hljs.highlightAll(),
        mobileMenu: bindMobileMenu,
        copy: bindCopy,
        toc: bindToc,
        snippets: bindSnippets,
        alerts: bindAlerts,
        videos: bindVideos,
        links: bindLinks,
    });

    html.behaviors.dispatchPrepare(
        'keyboard',
        'mouse',
        'body',
        'highlight',
        'mobileMenu',
        'copy',
        'toc',
        'snippets',
        'alerts',
        'videos',
        'links',
    );
}

onceReady(() => init());