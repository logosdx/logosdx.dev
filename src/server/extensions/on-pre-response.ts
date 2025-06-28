
import { Boom } from '@hapi/boom';
import { Extensions } from '../helpers/hapi.ts';

const onPreResponse: Extensions = {
    type: 'onPreResponse',
    method: (request, h) => {

        const asBoom = request.response as Boom;
        const asError = request.response as Error;

        if (asBoom.isBoom || asError instanceof Error) {

            const error = asBoom.output.payload;

            if (error.statusCode === 404) {

                return h.view('err-404', {
                    title: '404 - Not Found',
                    message: 'The page you are looking for does not exist.',
                }).code(404);
            }

            const statusCode = asBoom.output.statusCode || 500;

            return h.view('err-500', {
                title: `${statusCode} - ${asBoom.output?.payload?.error || 'Internal Server Error'}`,
                message: asError.stack,
            }).code(statusCode);
        }

        return h.continue;
    },
}

export default [
    onPreResponse
]