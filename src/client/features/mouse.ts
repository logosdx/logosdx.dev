import { html } from '@logosdx/dom';
import { throttle } from '@logosdx/kit';

import { observer } from '../utils/observer.ts';

interface MouseEvents {

    Click: MouseEvent;
    Scroll: Event;
    Resize: UIEvent;

}

declare global {
    interface FrontendEvents extends MouseEvents {}
}


export const bindMouse = () => {

    html.events.on(
        window,
        'click',
        (evt) => observer.emit('Click', evt as MouseEvent)
    );

    html.events.on(
        window,
        'scroll',
        throttle((evt) => observer.emit('Scroll', evt), { delay: 100 })
    );

    html.events.on(
        window,
        'resize',
        throttle((evt) => observer.emit('Resize', evt as UIEvent), { delay: 100 })
    );
}