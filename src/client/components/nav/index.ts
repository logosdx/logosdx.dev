import { observer } from '../../utils/observer.ts';

declare global {
    interface FrontendEvents {
        'MobileMenu:Open': () => void;
        'MobileMenu:Close': () => void;
        'SideNav:Toggle': () => void;
    }

    interface Window {
        mobile: HTMLDivElement;
        sideNav: HTMLDivElement;
    }
}

export const bindMobileMenu = () => {

    observer.on('MobileMenu:Open', () => {

        observer.emit('Lock');
        window.mobile?.classList.add('open');
    });

    observer.on('MobileMenu:Close', () => {

        observer.emit('Unlock');
        window.mobile?.classList.remove('open');
    });

    observer.on('Escape', () => {

        observer.emit('Unlock');
        window.mobile?.classList.remove('open');
        window.sideNav?.classList.remove('open');
    });

    observer.on('SideNav:Toggle', () => {

        observer.emit('Lock');
        window.sideNav?.classList.toggle('open');
    });

    observer.on('Click', (evt) => {

        const target = evt.target as HTMLElement;
        const sideNav = window.sideNav;

        if (
            sideNav?.classList.contains('open')
        ) {

            if (
                !target.closest('#sideNav') ||
                target.nodeName === 'A'
            ) {

                observer.emit('Unlock');
                sideNav?.classList.remove('open');
            }
        }

    });
}