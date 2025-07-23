import { html } from '@logosdx/dom';
import { debounce, throttle } from '@logosdx/kit';

import { observer } from '../utils/observer.ts';

interface MouseEvents {

    Click: MouseEvent;
    Scroll: Event;
    Resize: UIEvent;
    MouseMove: MouseEvent;
    MouseDown: MouseEvent;
    MouseUp: MouseEvent;
}

declare global {
    interface FrontendEvents extends MouseEvents {}
}

type MousePosition = {
    x: number;
    y: number;
    timestamp: number;
    target: EventTarget | null;
}

/**
 * It's useful to track the mouse's latest positions so that we
 * can paint elements on the screen in real time.
 */
export const state = {

    current: {} as MousePosition,
    mouseUp: {} as MousePosition,
    mouseDown: {} as MousePosition,
    isDown: false,
}

const getMousePosition = (evt: MouseEvent): MousePosition => {

    return {
        x: evt.clientX,
        y: evt.clientY,
        timestamp: Date.now(),
        target: evt.target,
    }
}

/**
 * Make mouse movements available via the observer. We obviously want
 * to throttle or debounce certain events to prevent framerate and
 * performance issues.
 */
export const bindMouse = () => {

    const fps60 = 1000 / 60;

    html.events.on(
        window,
        'mouseup',
        (evt) => {

            state.mouseUp = getMousePosition(evt as MouseEvent);
            state.isDown = false;
            observer.emit('Click', evt as MouseEvent);
            observer.emit('MouseUp', evt as MouseEvent);
        }
    );

    html.events.on(
        window,
        'mousedown',
        (evt) => {

            state.mouseDown = getMousePosition(evt as MouseEvent);
            state.isDown = true;
            observer.emit('MouseDown', evt as MouseEvent);
        }
    );

    html.events.on(
        window,
        'mousemove',
        debounce((evt) => {

            state.current = getMousePosition(evt as MouseEvent);
            observer.emit('MouseMove', evt as MouseEvent);
        }, { delay: fps60 })
    );

    html.events.on(
        window,
        'scroll',
        throttle((evt) => observer.emit('Scroll', evt), { delay: fps60 })
    );

    html.events.on(
        window,
        'resize',
        throttle((evt) => observer.emit('Resize', evt as UIEvent), { delay: fps60 })
    );
}