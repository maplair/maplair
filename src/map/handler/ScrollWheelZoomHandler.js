import {Handler} from '../../core/Handler.js';
import * as DomEvent from '../../dom/DomEvent.js';
import * as PointerEvents from '../../dom/DomEvent.PointerEvents.js';
import {Point} from '../../geometry/Point.js';

/*
 * Handler.ScrollWheelZoom is used by Map to enable mouse scroll wheel zoom on the map,
 * as well as touchpad gestures: pinching zooms, and with `scrollWheelZoom: 'trackpad'`
 * scrolling with two fingers pans.
 */

// The number of pixels of a touchpad pinch (wheel event with `ctrlKey`) for zooming by one zoom level.
const pinchPxPerZoomLevel = 100;

// The time (ms) without further wheel events after which a touchpad pinch or pan ends.
const gestureEndDelay = 150;

export class ScrollWheelZoomHandler extends Handler {
	constructor(...args) {
		super(...args);
		this.callInitHooks(ScrollWheelZoomHandler);
	}

	addHooks() {
		DomEvent.on(this._map._container, 'wheel', this._onWheelScroll, this);
		// Touchpad pinch in Safari (macOS)
		DomEvent.on(this._map._container, 'gesturestart', this._onGestureStart, this);
		DomEvent.on(this._map._container, 'gesturechange', this._onGestureChange, this);
		DomEvent.on(this._map._container, 'gestureend', this._onGestureEnd, this);

		this._delta = 0;
	}

	removeHooks() {
		DomEvent.off(this._map._container, 'wheel', this._onWheelScroll, this);
		DomEvent.off(this._map._container, 'gesturestart', this._onGestureStart, this);
		DomEvent.off(this._map._container, 'gesturechange', this._onGestureChange, this);
		DomEvent.off(this._map._container, 'gestureend', this._onGestureEnd, this);
		clearTimeout(this._timer);
		this._endPinch();
		this._endPan();
	}

	_onWheelScroll(e) {
		if (e.ctrlKey) {
			// A touchpad pinch, or the wheel with the Ctrl key pressed
			DomEvent.stop(e);
			const delta = -e.deltaY * (e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 60 : 1);
			this._pinchTo(e, (this._pinch?.zoom ?? this._map.getZoom()) + delta / pinchPxPerZoomLevel);
			clearTimeout(this._pinchTimer);
			this._pinchTimer = setTimeout(this._endPinch.bind(this), gestureEndDelay);
			return;
		}
		if (this._map.options.scrollWheelZoom === 'trackpad') {
			this._panBy(e);
			return;
		}
		this._onWheelZoom(e);
	}

	_onGestureStart(e) {
		// On touch screens, pinching is handled by `PinchZoomHandler`
		if (PointerEvents.getPointers().length) { return; }
		DomEvent.stop(e);
		this._gestureStartZoom = this._map.getZoom();
	}

	_onGestureChange(e) {
		if (this._gestureStartZoom === undefined) { return; }
		DomEvent.stop(e);
		this._pinchTo(e, this._gestureStartZoom + Math.log2(e.scale));
	}

	_onGestureEnd(e) {
		if (this._gestureStartZoom === undefined) { return; }
		DomEvent.stop(e);
		this._gestureStartZoom = undefined;
		this._endPinch();
	}

	// Zooms continuously like `PinchZoomHandler`, around the pointer position of `e`.
	_pinchTo(e, zoom) {
		const map = this._map;

		if (!this._pinch) {
			if (map._animatingZoom) { return; }
			map._stop();
			const point = map.pointerEventToContainerPoint(e),
			offset = point.subtract(map.getSize()._divideBy(2));
			this._pinch = {
				aroundLatLng: map.options.scrollWheelZoom === 'center' ? map.getCenter() : map.containerPointToLatLng(point),
				offset: map.options.scrollWheelZoom === 'center' ? new Point(0, 0) : offset
			};
			map._setUserEvent(e);
			map._moveStart(true, false);
		}

		if (!map.options.bounceAtZoomLimits) {
			zoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), zoom));
		}
		this._pinch.zoom = zoom;

		cancelAnimationFrame(this._pinchFrame);
		this._pinchFrame = requestAnimationFrame(() => {
			map._move(this._getPinchCenter(zoom), zoom, {pinch: true, round: false});
		});
	}

	_getPinchCenter(zoom) {
		const {aroundLatLng, offset} = this._pinch,
		map = this._map;
		return map.unproject(map.project(aroundLatLng, zoom).subtract(offset), zoom);
	}

	_endPinch() {
		clearTimeout(this._pinchTimer);
		if (!this._pinch) { return; }
		cancelAnimationFrame(this._pinchFrame);

		const map = this._map,
		zoom = map._limitZoom(this._pinch.zoom),
		center = this._getPinchCenter(zoom);
		this._pinch = null;

		if (map.options.zoomAnimation) {
			map._animateZoom(center, zoom, true, map.options.zoomSnap);
		} else {
			// `_moveStart()` has already been called on the first event
			map._move(center, zoom)._moveEnd(true);
		}
	}

	// Pans the map by the wheel deltas, as by scrolling with two fingers on a touchpad.
	_panBy(e) {
		DomEvent.stop(e);
		const map = this._map;
		if (map._animatingZoom) { return; }

		const factor = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 60 : 1;
		let offset = new Point(e.deltaX * factor, e.deltaY * factor);
		if (e.shiftKey && !e.deltaX) {
			// Shift with a mouse wheel scrolls horizontally
			offset = new Point(offset.y, 0);
		}
		if (map.options.maxBounds) {
			offset = map._limitOffset(offset, map.options.maxBounds);
		}

		if (!this._panning) {
			map._stop();
			this._panning = true;
			map._setUserEvent(e);
			map.fire('movestart');
		}
		map._rawPanBy(offset.round());
		map.fire('move');

		clearTimeout(this._panTimer);
		this._panTimer = setTimeout(this._endPan.bind(this), gestureEndDelay);
	}

	_endPan() {
		clearTimeout(this._panTimer);
		if (!this._panning) { return; }
		this._panning = false;
		this._map.fire('moveend');
	}

	_onWheelZoom(e) {
		const delta = DomEvent.getWheelDelta(e);

		const debounce = this._map.options.wheelDebounceTime;

		this._delta += delta;
		this._lastMousePos = this._map.pointerEventToContainerPoint(e);
		this._lastEvent = e;

		if (!this._startTime) {
			this._startTime = Date.now();
		}

		const left = Math.max(debounce - (Date.now() - this._startTime), 0);

		clearTimeout(this._timer);
		this._timer = setTimeout(this._performZoom.bind(this), left);

		DomEvent.stop(e);
	}

	_performZoom() {
		const map = this._map,
		zoom = map.getZoom(),
		snap = this._map.options.zoomSnap ?? 0;

		map._stop(); // stop panning and fly animations if any

		// map the delta with a sigmoid function to -4..4 range leaning on -1..1
		const d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4),
		d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
		d4 = snap ? Math.ceil(d3 / snap) * snap : d3,
		delta = map._limitZoom(zoom + (this._delta > 0 ? d4 : -d4)) - zoom;

		this._delta = 0;
		this._startTime = null;

		if (!delta) { return; }

		map._setUserEvent(this._lastEvent);
		if (map.options.scrollWheelZoom === 'center') {
			map.setZoom(zoom + delta);
		} else {
			map.setZoomAround(this._lastMousePos, zoom + delta);
		}
	}

	// Registers this default feature on the map class, called by `MaplairMap` itself.
	static register(MaplairMap) {
		// @namespace MaplairMap
		// @section Interaction Options
		MaplairMap.mergeOptions({
			// @section Mouse wheel options
			// @option scrollWheelZoom: Boolean|String = true
			// Whether the map can be zoomed by using the mouse wheel and by pinching on a
			// touchpad (or using the mouse wheel with the Ctrl key). If passed `'center'`,
			// it will zoom to the center of the view regardless of where the pointer was.
			// If passed `'trackpad'`, scrolling (e.g. with two fingers on a touchpad) pans
			// the map instead, while pinching still zooms.
			scrollWheelZoom: true,

			// @option wheelDebounceTime: Number = 40
			// Limits the rate at which a wheel can fire (in milliseconds). By default, the
			// user can't zoom via wheel more often than once per 40 ms.
			wheelDebounceTime: 40,

			// @option wheelPxPerZoomLevel: Number = 60
			// How many scroll pixels (as reported by [DomEvent.getWheelDelta](#domevent-getwheeldelta))
			// mean a change of one full zoom level. Smaller values will make wheel-zooming
			// faster (and vice versa).
			wheelPxPerZoomLevel: 60
		});

		// @section Handlers
		// @property scrollWheelZoom: Handler
		// Scroll wheel zoom handler.
		MaplairMap.addInitHook('addHandler', 'scrollWheelZoom', ScrollWheelZoomHandler);
	}
}
