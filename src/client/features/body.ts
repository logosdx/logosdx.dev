import { html } from '@logosdx/dom';

import { observer } from '../utils/observer.ts';

interface BodyEvents {

    Lock: null;
    Unlock: null;
}

declare global {
    interface FrontendEvents extends BodyEvents {}
}

/**
 * Makes the body scrollable or not depending on the event.
 * Because when we're focusing on certain UI elements, we don't
 * want the body to scroll. Use this when opening modals, navs, etc.
 */
export const bindBody = () => {

    observer.on('Lock', () => {

        html.css.set(window.document.body, { overflow: 'hidden' });
    });

    observer.on('Unlock', () => {

        html.css.set(window.document.body, { overflow: '' });
    });
}