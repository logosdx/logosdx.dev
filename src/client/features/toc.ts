import {
    $,
    html,
    scrollToElement,
    createElWith,
    appendIn,
    createEl,
    isInViewport
} from '@logosdx/dom';

import { memoizeSync, debounce } from '@logosdx/kit';
import { observer } from '../utils/observer.ts';

/**
 * This feature is used to add a table of contents to the
 * side nav based on the headings in the page. It will
 * automatically insert, and scroll to the heading when
 * the user clicks on it.
 */

/**
 * A heading object
 */
type Heading = {
    level: number;
    text: string;
    element: HTMLElement;
    link: HTMLElement | null;
    children?: Heading[];
}

const tocState = {
    toc: null as Element | null,
    navHeight: 0
}

/**
 * Make a hierarchy of headings
 * @param headings - The headings to make a hierarchy of
 * @returns A hierarchy of headings
 */
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

    return hierarchy;
}

/**
 * Make a TOC list
 * @param hierarchy - The hierarchy of headings
 * @param appendTo - The element to append the list to
 * @returns The list of headings
 */
const makeTocList = (hierarchy: Heading[], appendTo: Element) => {

    const list = createElWith('ul', {
        class: ['toc']
    });

    hierarchy.forEach((heading) => {

        const item = createElWith('li', {
            class: heading.children?.length ? ['has-children'] : []
        });

        const link = createElWith('a', {
            domEvents: {
                click: (e) => {

                    e.preventDefault();

                    scrollToElement(
                        heading.element as HTMLElement,
                        tocState.navHeight + 25
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
    (hierarchy: Heading[]): Heading[] => {


        const flat = hierarchy.flatMap((heading) => {

            const children = flatHeadings(heading.children || []);

            return [heading, ...children || []];
        });

        return flat;
    },
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

const tocScrollFeatures = (hierarchy: Heading[]) => {

    const flat = flatHeadings(hierarchy);
    const nav = getAsideNav();

    if (!nav) {

        return;
    }

    $('.toc .active', nav).forEach(
        li => li.classList.remove('active')
    );

    let top: number | null = null;

    flat.reverse().forEach((heading) => {

        if (isInViewport(heading.element as HTMLElement)) {

            heading.link?.classList.add('active');

            if (!isInViewport(heading.link as HTMLElement)) {

                console.log(heading.link, isInViewport(heading.link as HTMLElement))

                top = (heading.link?.offsetTop || 0) - 100;
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
 * Bind the TOC feature
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

    if (
        !sideNav ||
        !nav ||
        !main
    ) {
        console.warn('TOC: Could not find required elements');

        return;
    }

    tocState.navHeight = nav?.getBoundingClientRect().height || 0;

    const heading = createElWith('h2', {
        text: 'Table of Contents'
    });

    // Get all the headings in the page
    const headings = $('h2, h3, h4, h5, h6', main);

    if (headings.length === 0) {
        console.warn('TOC: No headings found');
        return;
    }

    // Make a hierarchy of headings
    const hierarchy = makeHeadingHierarchy(headings);

    // Make the TOC list
    const toc = makeTocList(hierarchy, sideNav);

    // Set to the top so we have a reference point
    toc.classList.add('top');

    const hr = createEl('hr');

    // Add the heading to the TOC
    appendIn(sideNav, hr, heading, toc);

    // Add the TOC to the state
    tocState.toc = toc;

    observer.on('Scroll', debounce(() => tocScrollFeatures(hierarchy), { delay: 200 }));

    tocScrollFeatures(hierarchy);
}