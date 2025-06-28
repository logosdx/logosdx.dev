import { $, html } from '@logosdx/dom';

import { observer } from '../utils/observer.ts';

interface LinksEvents {

    LinkFix: null;
}

declare global {
    interface FrontendEvents extends LinksEvents {}
}

const domain = window.location.host;

const fixLink = (el: Element) => {

    const link = el as HTMLAnchorElement;

    if (
        link.href.includes(domain) ||
        !link.href.includes('http')
    ) {
        return;
    }

    const url = new URL(link.href);

    // add the ref param to the link
    url.searchParams.set('ref', domain);

    // set the new href
    link.href = url.toString();
    link.target = '_blank';

    // prevent the link from being indexed by search engines
    link.rel = 'noopener noreferrer';
}

const fixLinks = () => {

    const links = $('a') as HTMLAnchorElement[];

    links.forEach((link) => {

        html.behaviors.bindBehavior(
            link,
            'LinkFix',
            fixLink
        )
    })
}

export const bindLinks = () => {

    observer.on('LinkFix', () => fixLinks());

    fixLinks();
};
