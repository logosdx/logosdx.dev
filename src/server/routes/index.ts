import StaticRoutes from './static.ts';
import MainRoutes from './main.ts';
import PackagesRoutes from './packages.ts';
import PagesRoutes from './pages.ts';

export default [
    ...StaticRoutes,
    ...MainRoutes,
    PackagesRoutes,
    PagesRoutes,
];