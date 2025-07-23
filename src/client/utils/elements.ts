import { createElWith } from '@logosdx/dom';
import { assert, isObject } from '@logosdx/kit';

type CreateElWithOpts = Parameters<typeof createElWith>[1];

export const makeIcon = (
    icon: string,
    opts: {
        type?: 'sharp' | 'brands',
    } & CreateElWithOpts = {}
): HTMLElement => {

    assert(icon, 'Icon is required');
    assert(!opts || isObject(opts), 'Opts must be an object');

    const { type = 'sharp', class: classes, ...rest } = opts;

    const el = createElWith('i', {
        class: [`fa-${type}`, `fa-${icon}`, ...(classes || [])],
        ...rest,
    });

    return el;
};

/**
 * Check if elementA is before elementB in the DOM
 * @param elementA - The first element
 * @param elementB - The second element
 * @returns True if elementA is before elementB, false otherwise
 */
export const isElementBefore = (elementA: HTMLElement, elementB: HTMLElement) => {

    if (!elementA || !elementB || !(elementA instanceof Node) || !(elementB instanceof Node)) {
        console.error("Both arguments must be valid DOM nodes.");
        return false;
    }

    const position = elementA.compareDocumentPosition(elementB);

    return (position & Node.DOCUMENT_POSITION_FOLLOWING) === Node.DOCUMENT_POSITION_FOLLOWING;
}