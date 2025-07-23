import { $, copyToClipboard, createElWith, html } from '@logosdx/dom'
import { state as mouseState } from './mouse.ts';
import { attemptSync } from '@logosdx/kit';

/**
 * Let the user know that the text has been copied to the clipboard.
 */
const copyAlert = () => {

    const { x, y } = mouseState.mouseUp;

    const alert = createElWith('div', {
        class: ['alert', 'success', 'xs', 'animate__fadeIn', 'animate__animated'],
        css: {
            position: 'fixed',
            zIndex: '1000',
            left: `${x+3}px`,
            top: `${y+3}px`,
            animationDuration: '0.25s',
        },
        text: 'Copied!',
    });

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.classList.add('animate__fadeOut')
        alert.classList.remove('animate__fadeIn')
        setTimeout(() => alert.remove(), 250);
    }, 250);
}

/**
 * Extend the DOM with copy behavior. Any element with the `copy` attribute
 * or `copy-text` attribute will have the copy behavior.
 *
 * `copy` is a selector that will be used to find the elements to copy innerText from.
 * `copy-text` is a text that will be copied to the clipboard.
 *
 * Example:
 *
 * Copy the text of the first paragraph:
 *
 * ```html
 * <button copy="p">Copy</button>
 *
 * <p>Hello, world!</p>
 * ```
 *
 * Copy the text "Hello, world!":
 *
 * ```html
 * <button copy-text="Hello, world!">Copy</button>
 * ```
 *
 *
 */
export const bindCopy = (el: Element) => {

    const selector = el.getAttribute('copy');
    const hasCopyText = el.hasAttribute('copy-text');

    if (!selector && !hasCopyText) {
        console.warn('No selector or copy-text found for copy behavior', el);
        return;
    }

    html.events.on(el, 'click', () => {

        const copyText = el.getAttribute('copy-text');

        if (hasCopyText && !copyText) {
            console.warn('No copy-text found for copy behavior', el);
            return;
        }

        if (copyText) {

            attemptSync(() => copyToClipboard(copyText));
            copyAlert();

            return;
        }

        const elsToCopy = $(selector!);

        if (elsToCopy.length === 0) {

            console.warn('No element found for copy behavior', selector, el);
            return;
        }

        const [elToCopy] = elsToCopy;

        const text = elToCopy.textContent || elToCopy.innerText;

        if (!text) {
            console.warn('No text found for copy behavior', elToCopy, el);
            return;
        }

        copyToClipboard(text);
        copyAlert();
    });
}
