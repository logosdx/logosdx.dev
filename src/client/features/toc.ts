/**
 * This feature is for adding a table of contents to the
 * side nav based on the headings in the page. It will
 * automatically insert, and scroll to the heading when
 * the user clicks on it.
 */

import {
    $,
    html,
    scrollToElement,
    createElWith,
    appendIn,
    createEl,
    isInViewport,
    appendBefore
} from '@logosdx/dom';

import { memoizeSync, debounce } from '@logosdx/kit';
import { observer } from '../utils/observer.ts';
import { makeIcon } from '../utils/elements.ts';

/**
 * The data structure used to represent headings and their
 * hierarchy.
 */
type Heading = {
    level: number;
    text: string;
    element: HTMLElement;
    distanceUntilNext: number;
    link: HTMLElement | null;
    children?: Heading[];
}

/**
 * We need to hoist the TOC root element, and the nav
 * height to calculate scrolling offsets.
 */
const tocState = {
    toc: null as Element | null,
    navHeight: 0
}

/**
 * For storing the the parent list element
 */
export const PARENT_LIST = Symbol('parentList');

export interface TocHeading extends HTMLHeadingElement {
    [PARENT_LIST]?: Element;
}

const getFlatHeadings = (hierarchy: Heading[]): Heading[] => {

    return hierarchy.flatMap((heading) => {

        return [heading, ...getFlatHeadings(heading.children || [])];
    });
}

const makeHeadingHierarchy = (headings: Element[]) => {

    const hierarchy: Heading[] = [];
    const stack: { level: number, node: Heading }[] = [];

    headings.forEach((heading) => {

        const level = parseInt(heading.tagName.substring(1));
        const text = heading.textContent;
        const omit = (
            html.attrs.has(heading as HTMLElement, 'omit-toc') ||
            heading.innerHTML.includes('omit-toc') ||
            heading.innerHTML.includes('omit-from-toc')
        );

        if (omit) {
            return;
        }

        const headingObj: Heading = {
            level,
            text: text || '',
            element: heading as HTMLElement,
            distanceUntilNext: 0,
            link: null,
            children: []
        };

        while (
            stack.length > 0 &&
            stack[stack.length - 1].level >= level
        ) {

            stack.pop();
        }

        if (stack.length === 0) {

            hierarchy.push(headingObj);
        }
        else {

            stack[stack.length - 1].node.children?.push(headingObj);
        }

        stack.push({ level, node: headingObj });
    });

    const flat = getFlatHeadings(hierarchy);

    flat.forEach((heading, index) => {

        let next = flat[index + 1];

        const nextRect = next?.element.getBoundingClientRect() || { top: 0, bottom: 0 };
        const currRect = heading.element.getBoundingClientRect();

        if (index === flat.length - 1) {

            heading.distanceUntilNext = document.body.scrollHeight - currRect.bottom;
        }

        if (!next) {
            return;
        }

        heading.distanceUntilNext = nextRect.top - currRect.top;
        heading.distanceUntilNext < 0 && (heading.distanceUntilNext = 0);
    });

    return hierarchy;
}

const makeTocList = (hierarchy: Heading[], appendTo: Element) => {

    const list = createElWith('ul', {
        class: ['toc']
    });

    hierarchy.forEach((heading) => {

        const headingEl = heading.element as TocHeading;

        headingEl[PARENT_LIST] = list;

        const item = createElWith('li', {
            class: heading.children?.length ? ['has-children'] : []
        });

        const link = createElWith('a', {
            domEvents: {
                click: (e) => {

                    e.preventDefault();

                    scrollToElement(
                        heading.element as HTMLElement,
                        {
                            behavior: 'smooth',
                            offset: tocState.navHeight + 25
                        }
                    );

                    heading.element.id && (

                        history.pushState(null, '', `#${heading.element.id}`)
                    );
                }
            },
            text: heading.text
        });

        heading.link = link;

        link.href = `#${heading.element.id}`;

        item.appendChild(link);
        list.appendChild(item);

        if (heading.children && heading.children.length > 0) {

            makeTocList(heading.children, item);
        }
    });

    appendIn(appendTo, list);

    return list;
}

const flatHeadings = memoizeSync(
    getFlatHeadings,
    {
        ttl: 5 * 60 * 1000,
        maxSize: 1000,
        onError: console.error,
        generateKey(args) {

            return args[0].map((h) => h.element.id).join(',');
        },
    }
);

const getAsideNav = memoizeSync(
    () => {
        return $('body > .content > aside > nav').pop() as HTMLElement;
    },
    {
        ttl: 5 * 60 * 1000,
        maxSize: 1,
        onError: console.error,
        generateKey: () => 'aside'
    }
)

const headingIsVisible = (heading: Heading) => {

    const headingEl = heading.element as TocHeading;
    const rect = headingEl?.getBoundingClientRect() || { top: 0, bottom: 0 };
    let elementTop = rect.top;

    // If the heading is above the viewport, we calculate the difference
    // between the heading and the next heading, which should give us the
    // space between the two headings (the content).
    if (elementTop < 0) {
        elementTop = rect.top + heading.distanceUntilNext - 100;
    }

    if (elementTop < 0) {

        return false;
    }

    if (elementTop > window.innerHeight) {

        return false;
    }

    return true;

}

const calculateScrollPosition = (hierarchy: Heading[]) => {

    const flat = flatHeadings(hierarchy);
    const nav = getAsideNav();

    if (!nav) {

        return;
    }

    let top: number | null = null;

    $('.toc .active', nav).forEach(
        li => li.classList.remove('active')
    );

    flat.reverse().forEach((heading) => {

        if (headingIsVisible(heading)) {

            const headingEl = heading.element as TocHeading;
            const parentList = headingEl[PARENT_LIST];

            if (parentList) {

                parentList.parentElement?.classList.add('active');
                parentList.previousElementSibling?.classList.add('active');
            }

            heading.link?.classList.add('active');
            heading.link?.parentElement?.classList.add('active');

            if (!isInViewport(heading.link as HTMLElement)) {

                const pos = heading.link?.getBoundingClientRect();

                top = (pos?.top || 0) - 100;
            }
        }
    })

    if (top === null) {

        return;
    }

    nav.scrollTo({
        top,
        behavior: 'smooth'
    });
}

/**
 * Creates a table of contents on the side nav, dynamically,
 * based on the headings in the page. It will also scroll to
 * the heading when the user clicks on it. As the user scrolls,
 * heading links will be highlighted, and the nav itself will
 * be scrolled to the active heading.
 *
 * Works on mobile or desktop, so that the user can always find
 * their way around the page.
 */
export const bindToc = () => {

    // Allow TOC to regenerate itself
    if (tocState.toc) {

        tocState.toc.remove();
        tocState.toc = null;
    }

    const [nav] = $('body > header');
    const [main] = $('main');
    const [sideNav] = $('body > .content > aside > nav');

    if (!sideNav || !nav || !main) {
        console.warn('TOC: Could not find required elements');

        return;
    }

    tocState.navHeight = nav?.getBoundingClientRect().height || 0;

    const heading = createElWith('h2', {
        text: 'Table of Contents'
    });

    const headings = $('h2, h3, h4, h5, h6', main);

    if (headings.length === 0) {
        console.warn('TOC: No headings found');
        return;
    }

    const hierarchy = makeHeadingHierarchy(headings);
    const toc = makeTocList(hierarchy, sideNav);

    toc.classList.add('top');

    const hr = createEl('hr');

    appendIn(sideNav, hr, heading, toc);

    tocState.toc = toc;

    flatHeadings(hierarchy).forEach((heading) => {

        const url = new URL(window.location.href);
        const hash = encodeURIComponent(heading.element.id);
        url.hash = hash;

        const icon = makeIcon('link', { class: ['icon'] });

        appendBefore(
            heading.element.firstChild as HTMLElement,
            ' ',
            icon
        );

        const link = createElWith('a', {
            attrs: {
                href: url.toString(),
            },
            class: ['heading']
        })

        appendBefore(heading.element, link);
        appendIn(link, heading.element);
    });

    observer.on('Scroll', debounce(() => calculateScrollPosition(hierarchy), { delay: 200 }));

    calculateScrollPosition(hierarchy);
}