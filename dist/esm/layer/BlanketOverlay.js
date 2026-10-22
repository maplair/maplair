import { setOptions } from "../core/Util.js";
import { off } from "../dom/DomEvent.js";
import { create, setTransform } from "../dom/DomUtil.js";
import { Layer } from "./Layer.js";
import { Bounds } from "../geometry/Bounds.js";
//#region src/layer/BlanketOverlay.js
/** @import {LayerOptions} from './Layer.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener} from '../core/Events.js' */
/**
* Options of `BlanketOverlay`.
* @typedef {object} BlanketOverlayOptions
* @property {number} [padding=0.1] How much to extend the clip area around the map
* view (relative to its size) e.g. 0.1 would be 10% of map view in each direction.
* @property {boolean} [continuous=false] When `false`, the blanket will update its
* position only when the map state settles (*after* a pan/zoom animation). When
* `true`, it will update when the map state changes (*during* pan/zoom animations).
* @extends LayerOptions
*/
/**
* Represents an HTML element that covers ("blankets") the entire surface
* of the map.
*
* Do not use this class directly. It's meant for `Renderer`, and for plugins
* that rely on one single HTML element.
*
* Subclasses must define the following methods:
*
* * `_initContainer()` must initialize the HTML element to use as blanket, and store
*   it as `this._container`. The base implementation creates a blank `<div>`.
* * `_destroyContainer()` must destroy the HTML element in `this._container` and free
*   any other resources. The base implementation destroys the element and removes
*   any event handlers attached to it.
* * `_resizeContainer(): Point`: the base implementation resizes the container
*   (based on the map's size and taking into account the padding), returning the new
*   size in CSS pixels. Subclass implementations shall reset container parameters and
*   data structures as needed.
* * `_onZoomEnd(ev?: PointerEvent)` (optional) runs on the map's `zoomend` event.
* * `_onViewReset(ev?: PointerEvent)` (optional) runs on the map's `viewreset` event.
* * `_onSettled()` runs whenever the map state settles after changing (at the end of
*   pan/zoom animations, etc). This should trigger the bulk of any rendering logic.
*   If the `continuous` option is set to `true`, then this also runs on any map
*   state change (including *during* pan/zoom animations).
*/
var BlanketOverlay = class BlanketOverlay extends Layer {
	static defaultOptions = {
		padding: .1,
		continuous: false
	};
	/**
	* @param {BlanketOverlayOptions} [options]
	*/
	constructor(options) {
		super();
		setOptions(this, options);
		this.callInitHooks(BlanketOverlay);
	}
	/**
	* Adds the blanket to the map.
	* @type {(map: MaplairMap) => void}
	*/
	onAdd() {
		if (!this._container) {
			this._initContainer();
			this._container.classList.add("maplair-zoom-animated");
		}
		this.getPane().appendChild(this._container);
		this._resizeContainer();
		this._onMoveEnd();
	}
	/**
	* Removes the blanket from the map.
	* @type {(map: MaplairMap) => void}
	*/
	onRemove() {
		this._destroyContainer();
	}
	/**
	* Returns the map events the blanket listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = {
			viewreset: this._reset,
			zoom: this._onZoom,
			moveend: this._onMoveEnd,
			resize: this._resizeContainer,
			zoomend: this._onZoomEnd,
			zoomanim: this._onAnimZoom
		};
		if (this.options.continuous) events.move = this._onMoveEnd;
		return events;
	}
	_onAnimZoom(ev) {
		this._updateTransform(ev.center, ev.zoom);
	}
	_onZoom() {
		this._updateTransform(this._map.getCenter(), this._map.getZoom());
	}
	_updateTransform(center, zoom) {
		const scale = this._map.getZoomScale(zoom, this._zoom), viewHalf = this._map.getSize().multiplyBy(.5 + this.options.padding), currentCenterPoint = this._map.project(this._center, zoom), topLeftOffset = viewHalf.multiplyBy(-scale)._add(currentCenterPoint)._subtract(this._map._getNewPixelOrigin(center, zoom))._round();
		setTransform(this._container, topLeftOffset, scale);
	}
	_onMoveEnd(ev) {
		const p = this.options.padding, size = this._map.getSize(), min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();
		this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
		this._center = this._map.getCenter();
		this._zoom = this._map.getZoom();
		this._updateTransform(this._center, this._zoom);
		this._onSettled(ev);
	}
	_reset() {
		this._onSettled();
		this._updateTransform(this._center, this._zoom);
		this._onViewReset();
	}
	_initContainer() {
		this._container = create("div");
	}
	_destroyContainer() {
		off(this._container);
		this._container.remove();
		delete this._container;
	}
	_resizeContainer() {
		const p = this.options.padding, size = this._map.getSize().multiplyBy(1 + p * 2).round();
		this._container.style.width = `${size.x}px`;
		this._container.style.height = `${size.y}px`;
		return size;
	}
	_onZoomEnd() {}
	_onViewReset() {}
	_onSettled() {}
};
//#endregion
export { BlanketOverlay };

//# sourceMappingURL=BlanketOverlay.js.map