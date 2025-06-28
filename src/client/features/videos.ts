import { $, html } from '@logosdx/dom';

import { observer } from '../utils/observer.ts';

interface VideosEvents {

    VideoResize: null;
}

declare global {
    interface FrontendEvents extends VideosEvents {}
}

interface VideoContainer extends HTMLElement {
    [ASPECT_RATIO]: {
        width: number;
        height: number;
        aspect: number;
        iframe: HTMLElement;
    };
}

const ASPECT_RATIO = Symbol('aspect-ratio');

const resizeVideos = () => {

    const videos = $('.youtube, .vimeo') as VideoContainer[];

    videos.forEach((video) => {

        if (video[ASPECT_RATIO]) {
            return;
        }

        const [iframe] = $('iframe', video);

        const { height, width } = html.attrs.get(iframe, ['width', 'height']);

        const aspect = parseInt(width) / parseInt(height);

        const container = video as VideoContainer;

        container[ASPECT_RATIO] = {
            width: parseInt(width),
            height: parseInt(height),
            aspect,
            iframe,
        };
    });

    videos.forEach((video) => {

        console.log(video[ASPECT_RATIO])

        const { aspect, iframe } = video[ASPECT_RATIO];

        const parentInnerWidth = video.parentElement!.clientWidth;

        const newHeight = Math.round(parentInnerWidth / aspect);

        html.css.set(video, {
            width: `100%`,
            height: `${newHeight}px`,
        });

        html.attrs.set(iframe, {
            width: '100%',
            height: '100%',
        });
    });
}

export const bindVideos = () => {

    observer.on('VideoResize', () => resizeVideos());
    observer.on('Resize', () => resizeVideos());

    resizeVideos();
}