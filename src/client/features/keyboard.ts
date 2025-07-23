import { html } from '@logosdx/dom';

import { observer } from '../utils/observer.ts';

type Alphabet = (
    'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' |
    'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' |
    's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | 'A' |
    'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' |
    'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' |
    'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
)

type Numbers = (
    '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
)

type Symbols = (
    '!' | '@' | '#' | '$' | '%' | '^' | '&' | '*' | '(' |
    ')' | '_' | '+' | '=' | '-' | '`' | '~' | '[' | ']' |
    '{' | '}' | '|' | '\\' | ':' | ';' | '"' | "'" | '<' |
    '>' | '.' | ',' | '?' | '/'
)

type Special = (
    'Backspace' | 'Delete' | 'Insert' | 'Home' | 'End' |
    'PageUp' | 'PageDown' | 'Escape' | 'Enter' | 'Tab' |
    'Shift' | 'Control' | 'Alt' | 'Meta' | 'CapsLock' |
    'NumLock' | 'ScrollLock' | 'Pause' | 'Break' | 'PrintScreen' |
    'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12'
)

type KeyCodes = Alphabet | Numbers | Symbols | Special;

declare global {
    interface FrontendEvents extends Record<KeyCodes, KeyboardEvent> {}
}

/**
 * Instead of binding to window keyboard events anywhere
 * that we need it, we can just listen for the keycode events
 * directly. If you don't need a sophisticated keyboard feature,
 * this is more than good enough.
 *
 * @example
 *
 * ```ts
 * import { observer } from '../utils/observer.ts';
 *
 * observer.on('a', () => moveLeft());
 * observer.on('d', () => moveRight());
 * observer.on('w', () => moveUp());
 * observer.on('s', () => moveDown());
 *
 * observer.on('Enter', () => form.submit());
 * observer.on('Escape', () => form.reset());
 * ```
 */
export const bindKeyboard = () => {

    html.events.on(window, 'keydown', (evt) => {

        const e = evt as KeyboardEvent;

        observer.emit(e.key as KeyCodes, e);
    });
}