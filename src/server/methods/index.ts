import { MethodConfig, ServerDependentFn } from '../helpers/index.ts';

import Github from './github.ts';
import Markdown from './markdown/index.ts';

type Methods = MethodConfig | ServerDependentFn<MethodConfig[] | MethodConfig>;

const methods: Methods[] = [
    Github,
    ...Markdown,
];

export default methods;