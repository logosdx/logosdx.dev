import { ObserverEngine, Events } from '@logosdx/kit';

declare global {
    /**
     * Extend this interface to add custom events to the observer.
     */
    interface FrontendEvents {}


    type FrontendEventKeys = Events<FrontendEvents>;

    interface Window {
        observer: ObserverEngine<FrontendEvents>;
    }

    /**
     * Magic variable that is set by vite.config.ts.
     * @see vite.config.ts
     */
    const isViteLocalDev: boolean;
}

export const observer = new ObserverEngine<FrontendEvents>({
    name: 'frontend',
    spy: isViteLocalDev ? (act) => console.info(
        'Observer: ',
        act.fn,
        act.event,
        act.data || act.listener,
    ) : undefined,
});

window.observer = observer;