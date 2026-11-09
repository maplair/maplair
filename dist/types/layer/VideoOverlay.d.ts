import type { ImageOverlayOptions } from './ImageOverlay.js';
import type { MaplairEvent } from '../core/Events.js';
/** @import {ImageOverlayOptions} from './ImageOverlay.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
 * Options of `VideoOverlay`.
 * @typedef {object} VideoOverlayOptions
 * @property {boolean} [autoplay=true] Whether the video starts playing automatically
 * when loaded. On some browsers autoplay will only work with `muted: true`.
 * @property {boolean} [controls=false] Whether the browser will offer controls to
 * allow the user to control video playback, including volume, seeking, and
 * pause/resume playback.
 * @property {boolean} [loop=true] Whether the video will loop back to the beginning
 * when played.
 * @property {boolean} [keepAspectRatio=true] Whether the video will save aspect ratio
 * after the projection.
 * @property {boolean} [muted=false] Whether the video starts on mute when loaded.
 * @property {boolean} [playsInline=true] Mobile browsers will play the video right
 * where it is instead of open it up in fullscreen mode.
 * @extends ImageOverlayOptions
 */
/**
 * Used to load and display a video player over specific bounds of the map. Extends
 * `ImageOverlay`.
 *
 * A video overlay uses the [`<video>`](https://developer.mozilla.org/docs/Web/HTML/Element/video)
 * HTML element; `getElement()` returns the instance of
 * [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement)
 * used by this overlay.
 *
 * @example
 * ```js
 * const videoUrl = 'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
 * 	videoBounds = [[ 32, -130], [ 13, -100]];
 * new VideoOverlay(videoUrl, videoBounds ).addTo(map);
 * ```
 *
 * @fires load {MaplairEvent} Fired when the video has finished loading the first frame.
 */
export class VideoOverlay extends ImageOverlay {
    static defaultOptions: Partial<VideoOverlayOptions>;
    /**
     * Instantiates a video overlay object given the URL of the video (or array of
     * URLs, or even a video element) and the geographical bounds it is tied to.
     * @overload
     * @param {string|string[]|HTMLVideoElement} video
     * @param {LatLngBoundsExpression} bounds
     * @param {VideoOverlayOptions} [options]
     */
    constructor(video: string | string[] | HTMLVideoElement, bounds: LatLngBoundsExpression, options?: VideoOverlayOptions | undefined);
    /** The options of the VideoOverlay, see [the options](#videooverlayoptions). */
    options: VideoOverlayOptions;
}
/**
 * Options of `VideoOverlay`.
 */
export interface VideoOverlayOptions extends ImageOverlayOptions {
    /**
     * Whether the video starts playing automatically
     * when loaded. On some browsers autoplay will only work with `muted: true`.
     * @default true
     */
    autoplay?: boolean;
    /**
     * Whether the browser will offer controls to
     * allow the user to control video playback, including volume, seeking, and
     * pause/resume playback.
     * @default false
     */
    controls?: boolean;
    /**
     * Whether the video will loop back to the beginning
     * when played.
     * @default true
     */
    loop?: boolean;
    /**
     * Whether the video will save aspect ratio
     * after the projection.
     * @default true
     */
    keepAspectRatio?: boolean;
    /**
     * Whether the video starts on mute when loaded.
     * @default false
     */
    muted?: boolean;
    /**
     * Mobile browsers will play the video right
     * where it is instead of open it up in fullscreen mode.
     * @default true
     */
    playsInline?: boolean;
}
import { ImageOverlay } from './ImageOverlay.js';
import type { LatLngBoundsExpression } from '../geo/LatLngBounds.js';
