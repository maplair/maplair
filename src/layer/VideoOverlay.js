import {ImageOverlay} from './ImageOverlay.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import * as Util from '../core/Util.js';

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

	static {
		this.setDefaultOptions({
			autoplay: true,
			controls: false,
			loop: true,
			keepAspectRatio: true,
			muted: false,
			playsInline: true
		});
	}

	/**
	 * Instantiates a video overlay object given the URL of the video (or array of
	 * URLs, or even a video element) and the geographical bounds it is tied to.
	 * @overload
	 * @param {string|string[]|HTMLVideoElement} video
	 * @param {LatLngBoundsExpression} bounds
	 * @param {VideoOverlayOptions} [options]
	 */
	/**
	 * @param {...any} args
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(VideoOverlay);
	}

	_initImage() {
		const wasElementSupplied = this._url.tagName === 'VIDEO';
		const vid = this._image = wasElementSupplied ? this._url : DomUtil.create('video');

		vid.classList.add('maplair-image-layer');
		if (this._zoomAnimated) { vid.classList.add('maplair-zoom-animated'); }
		if (this.options.className) { vid.classList.add(...Util.splitWords(this.options.className)); }

		DomEvent.on(vid, 'pointerdown', (e) => {
			if (vid.controls) {
				// Prevent the map from moving when the video or the seekbar is moved
				DomEvent.stopPropagation(e);
			}
		});

		vid.onloadeddata = this.fire.bind(this, 'load');

		if (wasElementSupplied) {
			const sourceElements = vid.getElementsByTagName('source');
			const sources = sourceElements.map(e => e.src);
			this._url = (sourceElements.length > 0) ? sources : [vid.src];
			return;
		}

		if (!Array.isArray(this._url)) { this._url = [this._url]; }

		if (!this.options.keepAspectRatio && Object.hasOwn(vid.style, 'objectFit')) {
			vid.style['objectFit'] = 'fill';
		}
		vid.autoplay = !!this.options.autoplay;
		vid.controls = !!this.options.controls;
		vid.loop = !!this.options.loop;
		vid.muted = !!this.options.muted;
		vid.playsInline = !!this.options.playsInline;
		for (const url of this._url) {
			const source = DomUtil.create('source');
			source.src = url;
			vid.appendChild(source);
		}
	}
}
