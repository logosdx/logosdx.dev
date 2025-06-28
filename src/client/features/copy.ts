import { $, copyToClipboard, html } from '@logosdx/dom'
import { observer } from '../utils/observer.ts';

const prepareElement = (el: Element) => {

    const selector = el.getAttribute('copy');
    const copyText = el.getAttribute('copy-text');

    if (!selector && !copyText) {
        console.warn('No selector found for copy behavior', el);
        return;
    }

    html.events.on(el, 'click', () => {

        if (copyText) {

            copyToClipboard(copyText);

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

        observer.emit('Alert', {
            type: 'success',
            message: 'Copied to clipboard',
            duration: 200,
        })
    });
}

export const bindCopy = () => {

    const elements = $('[copy]');

    elements.forEach((el) => {

        html.behaviors.bindBehavior(
            el,
            'Copy',
            prepareElement
        )
    });
}