import {
    $,
    html,
    createElWith,
    appendIn,
    copyToClipboard,
} from '@logosdx/dom';
import { observer } from '../../utils/observer.ts';
import { makeIcon } from '../../utils/elements.ts';
import { wait } from '@logosdx/kit';

declare global {

    interface FrontendEvents {
        Alert: Alert;
    }
}

type Alert = {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

const alerts: Alert[] = [];

const createAlertEl = (alert: Alert) => {

    const fadeOut = () => {

        html.css.set(el, { opacity: '0' });

        setTimeout(() => el.remove(), 100);

        clearInterval(interval);
        cleanup?.();
    }

    const jump = async () => {

        html.css.set(copyButton, {
            transition: 'transform 0.03s ease-in-out',
            transform: 'translateY(0)',
        });

        const setTo = (value: string) => {
            html.css.set(copyButton, {
                transform: value,
            });
        }

        for (let i = 0; i < 3; i++) {

            setTo(`translateY(-5px)`);
            await wait(30);

            setTo(`translateY(5px)`);

            await wait(30);
        }

        setTo(`translateY(0)`);
    }

    const closeIcon = makeIcon('xmark');
    const copyIcon = makeIcon('copy');

    const closeButton = createElWith('span', {
        class: ['close'],
        domEvents: { click: fadeOut },
        children: [closeIcon],
    });

    const copyButton = createElWith('span', {
        class: ['copy'],
        domEvents: { click: () => (copyToClipboard(alert.message), jump()) },
        children: [copyIcon],
    });

    const countDownBar = createElWith('div', {
        class: ['countdown'],
        css: { width: '100%' },
    });

    const el = createElWith('div', {
        class: [alert.type, 'alert'],
        children: [closeButton, copyButton, countDownBar],
        text: alert.message,
    });

    const now = Date.now();
    const cleanup = observer.once('Escape', fadeOut);
    const interval = setInterval(() => {

        const width = (alert.duration! - (Date.now() - now)) / alert.duration! * 100;

        html.css.set(countDownBar, { width: `${width}%` });
    }, 20);

    if (alert.duration) {
        setTimeout(fadeOut, alert.duration, interval);
    }
    else {

        clearInterval(interval);
        countDownBar.remove();
    }

    return el;
}

export const bindAlerts = () => {

    const [container] = $('#alerts');

    if (!container) {
        return;
    }

    alerts.forEach(createAlertEl);

    observer.on('Alert', (alert) => {

        const el = createAlertEl(alert);
        appendIn(container, el);
    });
}