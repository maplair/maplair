import { Point } from "../../geometry/Point.js";
import { getPointers } from "../../dom/DomEvent.PointerEvents.js";
import { getWheelDelta, off, on, stop } from "../../dom/DomEvent.js";
import { Handler } from "../../core/Handler.js";
// src/map/handler/ScrollWheelZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
const pinchPxPerZoomLevel = 100;
const gestureEndDelay = 150;
/**
* Map options of `ScrollWheelZoomHandler`, the mouse wheel options.
* @typedef {object} ScrollWheelZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|'center'|'trackpad'} [scrollWheelZoom=true] Whether the map can
* be zoomed by using the mouse wheel and by pinching on a touchpad (or using the mouse
* wheel with the Ctrl key). If passed `'center'`, it will zoom to the center of the
* view regardless of where the pointer was. If passed `'trackpad'`, scrolling (e.g.
* with two fingers on a touchpad) pans the map instead, while pinching still zooms.
* @property {number} [wheelDebounceTime=40] Limits the rate at which a wheel can fire
* (in milliseconds). By default, the user can't zoom via wheel more often than once
* per 40 ms.
* @property {number} [wheelPxPerZoomLevel=60] How many scroll pixels (as reported by
* [DomEvent.getWheelDelta](#domevent-getwheeldelta)) mean a change of one full zoom
* level. Smaller values will make wheel-zooming faster (and vice versa).
*/
/**
* Handler of `MaplairMap` for scroll wheel zoom.
* @typedef {object} ScrollWheelZoomHandlerMapProperties
* @lends MaplairMap
* @property {ScrollWheelZoomHandler} scrollWheelZoom Scroll wheel zoom handler.
*/
/**
* Enables mouse scroll wheel zoom on the map, as well as touchpad gestures: pinching
* zooms, and with `scrollWheelZoom: 'trackpad'` scrolling with two fingers pans.
* Enabled by default, see the map option `scrollWheelZoom`.
*/
var ScrollWheelZoomHandler = class ScrollWheelZoomHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(ScrollWheelZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "wheel", this._onWheelScroll, this);
		on(this._map._container, "gesturestart", this._onGestureStart, this);
		on(this._map._container, "gesturechange", this._onGestureChange, this);
		on(this._map._container, "gestureend", this._onGestureEnd, this);
		this._delta = 0;
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "wheel", this._onWheelScroll, this);
		off(this._map._container, "gesturestart", this._onGestureStart, this);
		off(this._map._container, "gesturechange", this._onGestureChange, this);
		off(this._map._container, "gestureend", this._onGestureEnd, this);
		clearTimeout(this._timer);
		this._endPinch();
		this._endPan();
	}
	_onWheelScroll(e) {
		if (e.ctrlKey) {
			stop(e);
			const delta = -e.deltaY * (e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 60 : 1);
			this._pinchTo(e, (this._pinch?.zoom ?? this._map.getZoom()) + delta / pinchPxPerZoomLevel);
			clearTimeout(this._pinchTimer);
			this._pinchTimer = setTimeout(this._endPinch.bind(this), gestureEndDelay);
			return;
		}
		if (this._map.options.scrollWheelZoom === "trackpad") {
			this._panBy(e);
			return;
		}
		this._onWheelZoom(e);
	}
	_onGestureStart(e) {
		if (getPointers().length) return;
		stop(e);
		this._gestureStartZoom = this._map.getZoom();
	}
	_onGestureChange(e) {
		if (this._gestureStartZoom === void 0) return;
		stop(e);
		this._pinchTo(e, this._gestureStartZoom + Math.log2(e.scale));
	}
	_onGestureEnd(e) {
		if (this._gestureStartZoom === void 0) return;
		stop(e);
		this._gestureStartZoom = void 0;
		this._endPinch();
	}
	_pinchTo(e, zoom, eased) {
		const map = this._map;
		if (!this._pinch) {
			if (map._animatingZoom) return;
			map._stop();
			const point = map.pointerEventToContainerPoint(e), offset = point.subtract(map.getSize()._divideBy(2));
			this._pinch = {
				aroundLatLng: map.options.scrollWheelZoom === "center" ? map.getCenter() : map.containerPointToLatLng(point),
				offset: map.options.scrollWheelZoom === "center" ? new Point(0, 0) : offset
			};
			map._setUserEvent(e);
			map._moveStart(true, false);
		}
		if (!map.options.bounceAtZoomLimits || eased) zoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), zoom));
		this._pinch.zoom = zoom;
		this._pinch.shown ??= map.getZoom();
		const frame = () => {
			const pinch = this._pinch, delta = pinch.zoom - pinch.shown;
			pinch.shown = eased && Math.abs(delta) > .01 ? pinch.shown + delta * .3 : pinch.zoom;
			map._move(this._getPinchCenter(pinch.shown), pinch.shown, {
				pinch: true,
				round: false
			});
			if (pinch.shown !== pinch.zoom) this._pinchFrame = requestAnimationFrame(frame);
		};
		cancelAnimationFrame(this._pinchFrame);
		this._pinchFrame = requestAnimationFrame(frame);
	}
	_getPinchCenter(zoom) {
		const { aroundLatLng, offset } = this._pinch, map = this._map;
		return map.unproject(map.project(aroundLatLng, zoom).subtract(offset), zoom);
	}
	_endPinch() {
		clearTimeout(this._pinchTimer);
		if (!this._pinch) return;
		cancelAnimationFrame(this._pinchFrame);
		const map = this._map, zoom = map._limitZoom(this._pinch.zoom), center = this._getPinchCenter(zoom);
		this._pinch = null;
		if (map.options.zoomAnimation && Math.abs(zoom - map.getZoom()) > 1e-9) map._animateZoom(center, zoom, true, map.options.zoomSnap);
		else map._move(center, zoom)._moveEnd(true);
	}
	_panBy(e) {
		stop(e);
		const map = this._map;
		if (map._animatingZoom) return;
		const factor = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 60 : 1;
		let offset = new Point(e.deltaX * factor, e.deltaY * factor);
		if (e.shiftKey && !e.deltaX) offset = new Point(offset.y, 0);
		if (map.options.maxBounds) offset = map._limitOffset(offset, map.options.maxBounds);
		if (!this._panning) {
			map._stop();
			this._panning = true;
			map._setUserEvent(e);
			map.fire("movestart");
		}
		map._rawPanBy(offset.round());
		map.fire("move");
		clearTimeout(this._panTimer);
		this._panTimer = setTimeout(this._endPan.bind(this), gestureEndDelay);
	}
	_endPan() {
		clearTimeout(this._panTimer);
		if (!this._panning) return;
		this._panning = false;
		this._map.fire("moveend");
	}
	_onWheelZoom(e) {
		if (this._map.options.continuousZoom) {
			stop(e);
			const delta = getWheelDelta(e) / this._map.options.wheelPxPerZoomLevel;
			this._pinchTo(e, (this._pinch?.zoom ?? this._map.getZoom()) + delta, true);
			clearTimeout(this._pinchTimer);
			this._pinchTimer = setTimeout(this._endPinch.bind(this), gestureEndDelay);
			return;
		}
		const delta = getWheelDelta(e);
		const debounce = this._map.options.wheelDebounceTime;
		this._delta += delta;
		this._lastEvent = e;
		if (!this._startTime) this._startTime = Date.now();
		const left = Math.max(debounce - (Date.now() - this._startTime), 0);
		clearTimeout(this._timer);
		this._timer = setTimeout(this._performZoom.bind(this), left);
		stop(e);
	}
	_performZoom() {
		const map = this._map, zoom = map.getZoom(), snap = this._map.options.zoomSnap ?? 0;
		map._stop();
		const d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4), d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2, d4 = snap ? Math.ceil(d3 / snap) * snap : d3, d5 = map._prefersReducedMotion() ? Math.min(d4, 1) : d4, delta = map._limitZoom(zoom + (this._delta > 0 ? d5 : -d5)) - zoom;
		this._delta = 0;
		this._startTime = null;
		if (!delta || map._zoomInputBlocked()) return;
		map._setUserEvent(this._lastEvent);
		if (map.options.scrollWheelZoom === "center") map.setZoom(zoom + delta);
		else map.setZoomAround(map.pointerEventToContainerPoint(this._lastEvent), zoom + delta);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			scrollWheelZoom: true,
			wheelDebounceTime: 40,
			wheelPxPerZoomLevel: 60
		});
		MaplairMap.addInitHook("addHandler", "scrollWheelZoom", ScrollWheelZoomHandler);
	}
};
export { ScrollWheelZoomHandler };

//# sourceMappingURL=ScrollWheelZoomHandler.js.map