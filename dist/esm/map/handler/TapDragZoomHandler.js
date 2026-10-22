import { Point } from "../../geometry/Point.js";
import { getPointers } from "../../dom/DomEvent.PointerEvents.js";
import { off, on } from "../../dom/DomEvent.js";
import { Handler } from "../../core/Handler.js";
import { Draggable } from "../../dom/Draggable.js";
//#region src/map/handler/TapDragZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
const maxTapInterval = 500;
const maxTapDistance = 30;
const pixelsPerZoomLevel = 128;
/**
* Map options of `TapDragZoomHandler`, touch interaction options.
* @typedef {object} TapDragZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|'center'} [tapDragZoom=true] Whether the map can be zoomed with
* one finger by tapping once, then touching again and dragging down (zoom in) or up
* (zoom out). If passed `'center'`, it will zoom to the center of the view regardless
* of where the finger was.
*/
/**
* Handler of `MaplairMap` for tap-drag zoom.
* @typedef {object} TapDragZoomHandlerMapProperties
* @lends MaplairMap
* @property {TapDragZoomHandler} tapDragZoom Tap-drag zoom handler (double tap and
* drag with one finger).
*/
/**
* Zooms the map with one finger on touch devices: tap once, then touch again and drag
* down to zoom in or up to zoom out (as known from MapLibre GL JS and Google Maps).
* Enabled by default, see the map option `tapDragZoom`.
*/
var TapDragZoomHandler = class TapDragZoomHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(TapDragZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "pointerdown", this._onDown, this);
		on(this._map._container, "pointerup", this._onTapUp, this);
		on(this._map._container, "pointercancel", this._reset, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "pointerdown", this._onDown, this);
		off(this._map._container, "pointerup", this._onTapUp, this);
		off(this._map._container, "pointercancel", this._reset, this);
		this._onUp();
		this._reset();
	}
	_onDown(e) {
		if (e.pointerType === "mouse" || getPointers().length !== 1) {
			this._onUp();
			this._reset();
			return;
		}
		const map = this._map, pos = new Point(e.clientX, e.clientY), now = Date.now();
		if (!this._tapPos || now - this._tapTime > maxTapInterval || pos.distanceTo(this._tapPos) > maxTapDistance || map._animatingZoom) {
			this._tapPos = null;
			this._downPos = pos;
			this._downTime = now;
			return;
		}
		this._tapPos = this._downPos = null;
		this._startPos = pos;
		this._startZoom = map.getZoom();
		this._moved = false;
		this._zooming = true;
		const containerPoint = map.pointerEventToContainerPoint(e);
		this._centerPoint = map.getSize()._divideBy(2);
		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
		if (map.options.tapDragZoom !== "center") {
			this._aroundLatLng = map.containerPointToLatLng(containerPoint);
			this._aroundOffset = containerPoint.subtract(this._centerPoint);
		}
		this._cancelDragging();
		on(map._container, "pointermove", this._onMove, this);
		on(map._container, "pointerup pointercancel", this._onUp, this);
	}
	_onTapUp(e) {
		if (!this._downPos) return;
		const pos = new Point(e.clientX, e.clientY), now = Date.now();
		if (now - this._downTime <= maxTapInterval && pos.distanceTo(this._downPos) <= this._map.options.tapTolerance) {
			this._tapPos = this._downPos;
			this._tapTime = now;
		}
		this._downPos = null;
	}
	_reset() {
		this._tapPos = this._downPos = null;
	}
	_cancelDragging() {
		const draggable = this._map.dragging?._draggable;
		if (draggable && Draggable._dragging === draggable) draggable.finishDrag(true);
	}
	_onMove(e) {
		if (!this._zooming || getPointers().length !== 1) return;
		const map = this._map, dy = e.clientY - this._startPos.y;
		if (!this._moved && Math.abs(dy) <= map.options.tapTolerance) return;
		this._cancelDragging();
		this._zoom = this._startZoom + dy / pixelsPerZoomLevel;
		if (!map.options.bounceAtZoomLimits) this._zoom = map._limitZoom(this._zoom);
		if (map.options.tapDragZoom === "center") this._center = this._startLatLng;
		else this._center = map.unproject(map.project(this._aroundLatLng, this._zoom).subtract(this._aroundOffset), this._zoom);
		if (!this._moved) {
			map._stop();
			map._setUserEvent(e);
			map._moveStart(true, false);
			this._moved = true;
		}
		cancelAnimationFrame(this._animRequest);
		this._animRequest = requestAnimationFrame(() => map._move(this._center, this._zoom, {
			pinch: true,
			round: false
		}));
		e.preventDefault();
	}
	_onUp() {
		off(this._map._container, "pointermove", this._onMove, this);
		off(this._map._container, "pointerup pointercancel", this._onUp, this);
		if (!this._zooming) return;
		this._zooming = false;
		if (!this._moved) return;
		this._moved = false;
		cancelAnimationFrame(this._animRequest);
		const map = this._map, zoom = map._limitZoom(this._zoom);
		if (map.options.zoomAnimation) map._animateZoom(this._center, zoom, true, map.options.zoomSnap);
		else map._move(this._center, zoom)._moveEnd(true);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ tapDragZoom: true });
		MaplairMap.addInitHook("addHandler", "tapDragZoom", TapDragZoomHandler);
	}
};
//#endregion
export { TapDragZoomHandler };

//# sourceMappingURL=TapDragZoomHandler.js.map