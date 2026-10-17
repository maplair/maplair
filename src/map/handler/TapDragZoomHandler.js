import {Handler} from '../../core/Handler.js';
import * as DomEvent from '../../dom/DomEvent.js';
import * as PointerEvents from '../../dom/DomEvent.PointerEvents.js';
import {Draggable} from '../../dom/Draggable.js';
import {Point} from '../../geometry/Point.js';

/*
 * Handler.TapDragZoom is used to zoom the map with one finger on touch devices:
 * tap once, then touch again and drag down to zoom in or up to zoom out
 * (as known from MapLibre GL JS and Google Maps).
 */

// The max time (ms) between the two taps and the max duration of the first tap.
const maxTapInterval = 500;

// The max distance (px) between the first and the second tap.
const maxTapDistance = 30;

// The number of pixels to drag vertically for zooming by one zoom level.
const pixelsPerZoomLevel = 128;

export class TapDragZoomHandler extends Handler {
	constructor(...args) {
		super(...args);
		this.callInitHooks(TapDragZoomHandler);
	}

	addHooks() {
		DomEvent.on(this._map._container, 'pointerdown', this._onDown, this);
		DomEvent.on(this._map._container, 'pointerup', this._onTapUp, this);
		DomEvent.on(this._map._container, 'pointercancel', this._reset, this);
	}

	removeHooks() {
		DomEvent.off(this._map._container, 'pointerdown', this._onDown, this);
		DomEvent.off(this._map._container, 'pointerup', this._onTapUp, this);
		DomEvent.off(this._map._container, 'pointercancel', this._reset, this);
		this._onUp();
		this._reset();
	}

	_onDown(e) {
		if (e.pointerType === 'mouse' || PointerEvents.getPointers().length !== 1) {
			// A second finger hands over to pinch zoom
			this._onUp();
			this._reset();
			return;
		}

		const map = this._map,
		pos = new Point(e.clientX, e.clientY),
		now = Date.now();

		if (!this._tapPos || now - this._tapTime > maxTapInterval ||
			pos.distanceTo(this._tapPos) > maxTapDistance || map._animatingZoom) {
			// Possibly the first tap
			this._tapPos = null;
			this._downPos = pos;
			this._downTime = now;
			return;
		}

		// Second tap: zoom on dragging
		this._tapPos = this._downPos = null;
		this._startPos = pos;
		this._startZoom = map.getZoom();
		this._moved = false;
		this._zooming = true;

		const containerPoint = map.pointerEventToContainerPoint(e);
		this._centerPoint = map.getSize()._divideBy(2);
		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
		if (map.options.tapDragZoom !== 'center') {
			this._aroundLatLng = map.containerPointToLatLng(containerPoint);
			this._aroundOffset = containerPoint.subtract(this._centerPoint);
		}

		this._cancelDragging();

		DomEvent.on(map._container, 'pointermove', this._onMove, this);
		DomEvent.on(map._container, 'pointerup pointercancel', this._onUp, this);
	}

	// Keeps track of the first tap of a possible tap-drag gesture.
	_onTapUp(e) {
		if (!this._downPos) { return; }

		const pos = new Point(e.clientX, e.clientY),
		now = Date.now();

		if (now - this._downTime <= maxTapInterval &&
			pos.distanceTo(this._downPos) <= this._map.options.tapTolerance) {
			this._tapPos = this._downPos;
			this._tapTime = now;
		}
		this._downPos = null;
	}

	_reset() {
		this._tapPos = this._downPos = null;
	}

	// Prevents the map from being panned by the second tap.
	_cancelDragging() {
		const draggable = this._map.dragging?._draggable;
		if (draggable && Draggable._dragging === draggable) {
			draggable.finishDrag(true);
		}
	}

	_onMove(e) {
		if (!this._zooming || PointerEvents.getPointers().length !== 1) { return; }

		const map = this._map,
		dy = e.clientY - this._startPos.y;

		if (!this._moved && Math.abs(dy) <= map.options.tapTolerance) { return; }

		this._cancelDragging();

		// Dragging down zooms in, dragging up zooms out
		this._zoom = this._startZoom + dy / pixelsPerZoomLevel;

		if (!map.options.bounceAtZoomLimits) {
			this._zoom = map._limitZoom(this._zoom);
		}

		if (map.options.tapDragZoom === 'center') {
			this._center = this._startLatLng;
		} else {
			this._center = map.unproject(map.project(this._aroundLatLng, this._zoom).subtract(this._aroundOffset), this._zoom);
		}

		if (!this._moved) {
			map._stop();
			map._setUserEvent(e);
			map._moveStart(true, false);
			this._moved = true;
		}

		cancelAnimationFrame(this._animRequest);
		this._animRequest = requestAnimationFrame(() => map._move(this._center, this._zoom, {pinch: true, round: false}));

		e.preventDefault();
	}

	_onUp() {
		DomEvent.off(this._map._container, 'pointermove', this._onMove, this);
		DomEvent.off(this._map._container, 'pointerup pointercancel', this._onUp, this);

		if (!this._zooming) { return; }
		this._zooming = false;

		// Without moving, the second tap is a double tap (see `doubleClickZoom`)
		if (!this._moved) { return; }
		this._moved = false;

		cancelAnimationFrame(this._animRequest);

		const map = this._map,
		zoom = map._limitZoom(this._zoom);
		if (map.options.zoomAnimation) {
			map._animateZoom(this._center, zoom, true, map.options.zoomSnap);
		} else {
			// `_moveStart()` has already been called on the first move
			map._move(this._center, zoom)._moveEnd(true);
		}
	}

	// Registers this default feature on the map class, called by `MaplairMap` itself.
	static register(MaplairMap) {
		// @namespace MaplairMap
		// @section Interaction Options
		MaplairMap.mergeOptions({
			// @section Touch interaction options
			// @option tapDragZoom: Boolean|String = true
			// Whether the map can be zoomed with one finger by tapping once, then
			// touching again and dragging down (zoom in) or up (zoom out). If
			// passed `'center'`, it will zoom to the center of the view regardless
			// of where the finger was.
			tapDragZoom: true
		});

		// @section Handlers
		// @property tapDragZoom: Handler
		// Tap-drag zoom handler (double tap and drag with one finger).
		MaplairMap.addInitHook('addHandler', 'tapDragZoom', TapDragZoomHandler);
	}
}
