import { getPointers } from "../../dom/DomEvent.PointerEvents.js";
import { off, on } from "../../dom/DomEvent.js";
import { Handler } from "../../core/Handler.js";
//#region src/map/handler/PinchZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
/**
* Map options of `PinchZoomHandler`, touch interaction options.
* @typedef {object} PinchZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|'center'} [pinchZoom=true] Whether the map can be zoomed by
* touch-dragging with two fingers. If passed `'center'`, it will zoom to the center of
* the view regardless of where the touch events (fingers) were. Enabled for
* touch-capable web browsers.
* @property {boolean} [bounceAtZoomLimits=true] Set it to false if you don't want the
* map to zoom beyond min/max zoom and then bounce back when pinch-zooming.
* @property {boolean|'center'} [touchZoom] Deprecated, use `pinchZoom` instead.
*/
/**
* Handler of `MaplairMap` for pinch zoom.
* @typedef {object} PinchZoomHandlerMapProperties
* @lends MaplairMap
* @property {PinchZoomHandler} pinchZoom Pinch zoom handler.
* @property {PinchZoomHandler} touchZoom Deprecated, the same as `pinchZoom`.
*/
/**
* Adds pinch zoom to the map on supported mobile browsers, enabled by default, see the
* map option `pinchZoom`.
*/
var PinchZoomHandler = class PinchZoomHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(PinchZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		this._map._container.classList.add("maplair-touch-zoom");
		on(this._map._container, "pointerdown", this._onPointerStart, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		this._map._container.classList.remove("maplair-touch-zoom");
		off(this._map._container, "pointerdown", this._onPointerStart, this);
		off(this._map._container, "pointermove", this._onPointerMove, this);
		off(this._map._container, "pointerup pointercancel", this._onPointerEnd, this);
	}
	_onPointerStart(e) {
		const map = this._map;
		const pointers = getPointers();
		if (pointers.length !== 2 || map._animatingZoom || this._zooming) return;
		const p1 = map.pointerEventToContainerPoint(pointers[0]), p2 = map.pointerEventToContainerPoint(pointers[1]);
		this._centerPoint = map.getSize()._divideBy(2);
		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
		if (map.options.pinchZoom !== "center") this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
		this._startDist = p1.distanceTo(p2);
		this._startZoom = map.getZoom();
		this._moved = false;
		this._zooming = true;
		map._stop();
		on(this._map._container, "pointermove", this._onPointerMove, this);
		on(this._map._container, "pointerup pointercancel", this._onPointerEnd, this);
		e.preventDefault();
	}
	_onPointerMove(e) {
		const pointers = getPointers();
		if (pointers.length !== 2 || !this._zooming) return;
		const map = this._map, p1 = map.pointerEventToContainerPoint(pointers[0]), p2 = map.pointerEventToContainerPoint(pointers[1]), scale = p1.distanceTo(p2) / this._startDist;
		this._zoom = map.getScaleZoom(scale, this._startZoom);
		if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale < 1 || this._zoom > map.getMaxZoom() && scale > 1)) this._zoom = map._limitZoom(this._zoom);
		if (map.options.pinchZoom === "center") {
			this._center = this._startLatLng;
			if (scale === 1) return;
		} else {
			const delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
			if (scale === 1 && delta.x === 0 && delta.y === 0) return;
			this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
		}
		if (!this._moved) {
			map._setUserEvent(e);
			map._moveStart(true, false);
			this._moved = true;
		}
		cancelAnimationFrame(this._animRequest);
		const moveFn = map._move.bind(map, this._center, this._zoom, {
			pinch: true,
			round: false
		}, void 0);
		this._animRequest = requestAnimationFrame(moveFn.bind(this));
		e.preventDefault();
	}
	_onPointerEnd() {
		off(this._map._container, "pointermove", this._onPointerMove, this);
		off(this._map._container, "pointerup pointercancel", this._onPointerEnd, this);
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}
		this._zooming = false;
		cancelAnimationFrame(this._animRequest);
		if (this._map._zoomAnimated) this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
		else this._map._resetView(this._center, this._map._limitZoom(this._zoom));
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			pinchZoom: true,
			bounceAtZoomLimits: true
		});
		MaplairMap.addInitHook("addHandler", "pinchZoom", PinchZoomHandler);
		MaplairMap.addInitHook(function() {
			this.touchZoom = this.pinchZoom;
			if (this.options.touchZoom !== void 0) {
				console.warn("Map: touchZoom option is deprecated and will be removed in future versions. Use pinchZoom instead.");
				this.options.pinchZoom = this.options.touchZoom;
				delete this.options.touchZoom;
			}
			if (this.options.pinchZoom) this.pinchZoom.enable();
			else this.pinchZoom.disable();
		});
	}
};
//#endregion
export { PinchZoomHandler };

//# sourceMappingURL=PinchZoomHandler.js.map