import { html } from '@logosdx/dom';

import { observer } from '../utils/observer.ts';

interface KeyboardEvents {

    Escape: KeyboardEvent;
    Enter: KeyboardEvent;
    Space: KeyboardEvent;
    Tab: KeyboardEvent;
    ArrowUp: KeyboardEvent;
    ArrowDown: KeyboardEvent;
}

declare global {
    interface FrontendEvents extends KeyboardEvents {}
}


export const bindKeyboard = () => {

    html.events.on(window, 'keydown', (evt) => {

        const e = evt as KeyboardEvent;

        observer.emit(e.key as keyof KeyboardEvents, e) ;
    });
}