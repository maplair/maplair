import { setOptions, splitWords } from "../core/Util.js";
import { create, setPosition, setTransform, toBack, toFront } from "../dom/DomUtil.js";
import { Layer } from "./Layer.js";
import { Bounds } from "../geometry/Bounds.js";
import { LatLngBounds } from "../geo/LatLngBounds.js";
//#region src/layer/ImageOverlay.js
/** @import {InteractiveLayerOptions} from './Layer.js' */
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, MaplairEvent} from '../core/Events.js' */
/**
* Options of `ImageOverlay`.
* @typedef {object} ImageOverlayOptions
* @property {number} [opacity=1] The opacity of the image overlay.
* @property {string} [alt=''] Text for the `alt` attribute of the image (useful for
* accessibility).
* @property {boolean} [interactive=false] If `true`, the image overlay will emit
* [pointer events](#interactivelayeroptions) when clicked or hovered.
* @property {boolean|string} [crossOrigin=false] Whether the crossOrigin attribute
* will be added to the image. If a String is provided, the image will have its
* crossOrigin attribute set to the String provided. This is needed if you want to
* access image pixel data. Refer to
* [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
* for valid String values.
* @property {string} [errorOverlayUrl=''] URL to the overlay image to show in place
* of the overlay that failed to load.
* @property {number} [zIndex=1] The explicit
* [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index)
* of the overlay layer.
* @property {string} [className=''] A custom class name to assign to the image. Empty
* by default.
* @property {boolean} [pixelated=false] Whether to scale the image with
* nearest-neighbour interpolation (`image-rendering: pixelated`) instead of smoothing
* it, so that its pixels stay crisp when zoomed in. Useful for raster data, pixel art
* or scientific imagery.
* @property {string} [decoding='auto'] Tells the browser whether to decode the image
* in a synchronous fashion, as per the
* [`decoding` HTML attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding).
* If the image overlay is flickering when being added/removed, set this option to
* `'sync'`.
* @extends InteractiveLayerOptions
*/
/**
* Used to load and display a single image over specific bounds of the map. Extends `Layer`.
*
* @example
* ```js
* const imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
* 	imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
* new ImageOverlay(imageUrl, imageBounds).addTo(map);
* ```
*
* @fires load {MaplairEvent} Fired when the ImageOverlay layer has loaded its image.
* @fires error {MaplairEvent} Fired when the ImageOverlay layer fails to load its image.
*/
var ImageOverlay = class ImageOverlay extends Layer {
	static defaultOptions = {
		opacity: 1,
		alt: "",
		interactive: false,
		crossOrigin: false,
		errorOverlayUrl: "",
		zIndex: 1,
		className: "",
		pixelated: false,
		decoding: "auto"
	};
	/**
	* Instantiates an image overlay object given the URL of the image (or an image
	* element) and the geographical bounds it is tied to.
	* @param {string|HTMLImageElement} url
	* @param {LatLngBoundsExpression} bounds
	* @param {ImageOverlayOptions} [options]
	*/
	constructor(url, bounds, options) {
		super();
		this._url = url;
		this._bounds = new LatLngBounds(bounds);
		setOptions(this, options);
		this.callInitHooks(ImageOverlay);
	}
	/**
	* Adds the image to the map.
	* @type {(map: MaplairMap) => void}
	*/
	onAdd() {
		if (!this._image) {
			this._initImage();
			if (this.options.opacity < 1) this._updateOpacity();
		}
		if (this.options.interactive) {
			this._image.classList.add("maplair-interactive");
			this.addInteractiveTarget(this._image);
		}
		this._image.classList.toggle("maplair-pixelated", !!this.options.pixelated);
		this.getPane().appendChild(this._image);
		this._reset();
	}
	/**
	* Removes the image from the map.
	* @type {(map: MaplairMap) => void}
	*/
	onRemove() {
		this._image.remove();
		if (this.options.interactive) this.removeInteractiveTarget(this._image);
	}
	_updateInteractive() {
		this._image.classList.toggle("maplair-interactive", this.options.interactive);
		if (this.options.interactive) this.addInteractiveTarget(this._image);
		else this.removeInteractiveTarget(this._image);
	}
	/**
	* Sets the opacity of the overlay.
	* @param {number} opacity
	* @returns {this}
	*/
	setOpacity(opacity) {
		this.options.opacity = opacity;
		if (this._image) this._updateOpacity();
		return this;
	}
	/**
	* Sets the opacity of the overlay from the given style options, e.g. by
	* `FeatureGroup.setStyle()`.
	* @param {{opacity?: number}} styleOpts
	* @returns {this}
	*/
	setStyle(styleOpts) {
		if (styleOpts.opacity) this.setOpacity(styleOpts.opacity);
		return this;
	}
	/**
	* Brings the layer to the top of all overlays.
	* @returns {this}
	*/
	bringToFront() {
		if (this._map) toFront(this._image);
		return this;
	}
	/**
	* Brings the layer to the bottom of all overlays.
	* @returns {this}
	*/
	bringToBack() {
		if (this._map) toBack(this._image);
		return this;
	}
	/**
	* Changes the URL of the image.
	* @param {string} url
	* @returns {this}
	*/
	setUrl(url) {
		this._url = url;
		if (this._image) this._image.src = url;
		return this;
	}
	/**
	* Update the bounds that this ImageOverlay covers.
	* @param {LatLngBoundsExpression} bounds
	* @returns {this}
	*/
	setBounds(bounds) {
		this._bounds = new LatLngBounds(bounds);
		if (this._map) this._reset();
		return this;
	}
	/**
	* Returns the map events the overlay listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		return {
			zoom: this._reset,
			viewreset: this._reset,
			zoomanim: this._animateZoom
		};
	}
	/**
	* Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
	* @param {number} value
	* @returns {this}
	*/
	setZIndex(value) {
		this.options.zIndex = value;
		this._updateZIndex();
		return this;
	}
	/**
	* Get the bounds that this ImageOverlay covers.
	* @returns {LatLngBounds}
	*/
	getBounds() {
		return this._bounds;
	}
	/**
	* Returns the instance of
	* [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
	* used by this overlay (`HTMLVideoElement` for `VideoOverlay`, `SVGElement` for
	* `SVGOverlay`).
	* @returns {HTMLElement|SVGElement}
	*/
	getElement() {
		return this._image;
	}
	_initImage() {
		const wasElementSupplied = this._url instanceof HTMLImageElement;
		const img = this._image = wasElementSupplied ? this._url : create("img");
		img.classList.add("maplair-image-layer", "maplair-zoom-animated");
		if (this.options.className) img.classList.add(...splitWords(this.options.className));
		img.onload = this.fire.bind(this, "load");
		img.onerror = this._overlayOnError.bind(this);
		if (this.options.crossOrigin || this.options.crossOrigin === "") img.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
		img.decoding = this.options.decoding;
		if (this.options.zIndex) this._updateZIndex();
		if (wasElementSupplied) {
			this._url = img.src;
			return;
		}
		img.src = this._url;
		img.alt = this.options.alt;
	}
	_animateZoom(e) {
		const scale = this._map.getZoomScale(e.zoom), offset = this._map._latLngToNewLayerPoint(this._bounds.getNorthWest(), e.zoom, e.center);
		setTransform(this._image, offset, scale);
	}
	_reset() {
		const image = this._image, bounds = new Bounds(this._map.latLngToLayerPoint(this._bounds.getNorthWest()), this._map.latLngToLayerPoint(this._bounds.getSouthEast())), size = bounds.getSize();
		setPosition(image, bounds.min);
		image.style.width = `${size.x}px`;
		image.style.height = `${size.y}px`;
	}
	_updateOpacity() {
		this._image.style.opacity = `${this.options.opacity}`;
	}
	_updateZIndex() {
		if (this._image && this.options.zIndex !== void 0 && this.options.zIndex !== null) this._image.style.zIndex = `${this.options.zIndex}`;
	}
	_overlayOnError() {
		this.fire("error");
		const errorUrl = this.options.errorOverlayUrl;
		if (errorUrl && this._url !== errorUrl) {
			this._url = errorUrl;
			this._image.src = errorUrl;
		}
	}
	/**
	* Returns the center of the ImageOverlay.
	* @returns {LatLng}
	*/
	getCenter() {
		return this._bounds.getCenter();
	}
};
//#endregion
export { ImageOverlay };

//# sourceMappingURL=ImageOverlay.js.map