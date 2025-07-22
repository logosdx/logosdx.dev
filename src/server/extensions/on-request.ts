
import { Extensions } from '../helpers/hapi.ts';

const onRequest: Extensions = {
    type: 'onRequest',
    method: (request, h) => {

        const { path } = request;

        if (path.endsWith('/') && path !== '/') {

            return h
                .redirect(path.slice(0, -1))
                .temporary()
                .takeover()
            ;
        }

        return h.continue;
    },
}

export default [
    onRequest
]