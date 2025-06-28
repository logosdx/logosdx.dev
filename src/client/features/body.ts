import { html } from '@logosdx/dom';

import { observer } from '../utils/observer.ts';

interface BodyEvents {

    Lock: null;
    Unlock: null;
}

declare global {
    interface FrontendEvents extends BodyEvents {}
}


export const bindBody = () => {

    observer.on('Lock', () => {

        html.css.set(window.document.body, { overflow: 'hidden' });
    });

    observer.on('Unlock', () => {

        html.css.set(window.document.body, { overflow: '' });
    });
}