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

    const { type = 'sharp', ...rest } = opts;

    const el = createElWith('i', {
        class: [`fa-${type}`, `fa-${icon}`],
        ...rest,
    });

    return el;
}