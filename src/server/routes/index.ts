import StaticRoutes from './static.ts';
import MainRoutes from './main.ts';
import PackagesRoutes from './packages.ts';
import MarkdownRoutes from './markdown.ts';

export default [
    ...StaticRoutes,
    ...MainRoutes,
    PackagesRoutes,
    MarkdownRoutes,
];