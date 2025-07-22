import { $, appendIn } from '@logosdx/dom';
import { observer } from '../../utils/observer.ts';
import { makeIcon } from '../../utils/elements.ts';

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

    const desktopSubNavs = $('li:has(ul)', window.sideNav);
    const mobileSubNavs = $('li:has(ul)', window.mobile);

    [
        ...desktopSubNavs,
        ...mobileSubNavs,
    ].forEach((subNavContainer) => {

        const subNav = $('ul', subNavContainer);
        console.log(subNavContainer, subNav);

        if (subNav.length === 0) return;

        const icon = makeIcon('chevron-down', { class: ['toggle'] });

        appendIn(subNavContainer, icon);

    });

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

        // Handle package submenu toggle only for links in the side nav
        if (
            target.classList.contains('toggle') &&
            target.parentElement?.nodeName === 'LI' &&
            target.closest('#sideNav')
        ) {

            const icon = target as HTMLElement;
            const submenu = icon.previousElementSibling as HTMLUListElement;
            const listItem = icon.parentElement as HTMLLIElement;

            if (submenu && submenu.tagName === 'UL') {
                evt.preventDefault();
                listItem?.classList.toggle('expanded');
                return;
            }
        }

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