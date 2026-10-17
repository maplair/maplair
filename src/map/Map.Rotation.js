import {MaplairMap} from './Map.js';
import Browser from '../core/Browser.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import * as PointerEvents from '../dom/DomEvent.PointerEvents.js';
import {Draggable} from '../dom/Draggable.js';
import {Point} from '../geometry/Point.js';
import {Bounds} from '../geometry/Bounds.js';
import {BlanketOverlay} from '../layer/BlanketOverlay.js';
import {GridLayer} from '../layer/tile/GridLayer.js';
import {DivOverlay} from '../layer/DivOverlay.js';
import {Popup} from '../layer/Popup.js';
import {Tooltip} from '../layer/Tooltip.js';
import {Marker} from '../layer/marker/Marker.js';
import {MarkerDrag} from '../layer/marker/Marker.Drag.js';
import '../layer/marker/Marker.Rotation.js';
import {DragHandler} from './handler/DragHandler.js';
import {PinchZoomHandler} from './handler/PinchZoomHandler.js';
import {ScrollWheelZoomHandler} from './handler/ScrollWheelZoomHandler.js';
import {TapDragZoomHandler} from './handler/TapDragZoomHandler.js';
import {RotateControl} from '../control/RotateControl.js';
/** @import {MaplairEvent} from '../core/Events.js' */
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {PanOptions, InvalidateSizeOptions} from './Map.js' */

export {RotateControl};

// The bearing in degrees in the range [0, 360)
function normalizeBearing(bearing) {
	return ((Number(bearing) % 360) + 360) % 360;
}

// Rotates `point` clockwise (on the screen) by `degrees` around the origin
function rotatePoint(point, degrees) {
	const angle = degrees * Math.PI / 180,
	cos = Math.cos(angle),
	sin = Math.sin(angle);
	return new Point(point.x * cos - point.y * sin, point.x * sin + point.y * cos);
}

// The maps of the rotated panes, see `Draggable`
const rotatedMaps = new WeakMap();

// Possible size savings: about 60% of the code of this module (about 7–8 kB of
// its 13 kB minified) are copies of core methods, which are overridden because
// the rotation changes a computation in their middle:
// * Popup#_adjustPan, MarkerDrag#_adjustPan, DragHandler#_onDragEnd: the offsets
//   for panBy() in container pixels (about 1.1–1.3 kB each)
// * PinchZoomHandler#_onPointerMove (1.6 kB) and ScrollWheelZoomHandler#_panBy:
//   the rotation by two fingers, the pinch and pan offsets in the rotated frame
// * MaplairMap#invalidateSize, #_tryAnimatedPan, #_continuousZoom, #getPixelBounds,
//   GridLayer#_getTiledPixelBounds, BlanketOverlay#_updateTransform, #_onMoveEnd,
//   #_resizeContainer, DivOverlay#_updatePosition, #_setContainerPosition,
//   Popup#_animateZoom: the bounding box of the rotated view, the upright overlays
// Most of these copies could be replaced by small extension points in the core
// classes, which this module overrides instead: e.g. MaplairMap#_rotateToPane(offset),
// #_rotateToContainer(offset) and #_getViewSize() returning the offset or size
// unchanged, used where the copied methods differ (well below 1 kB in core, for
// all maps); or by splitting the core methods, so that the computations in
// question become methods of their own (e.g. the pinch center from the offset of
// the fingers, the inertia offset, the box of a popup in container pixels).
// Both would change the pre-existing classes, which this module leaves untouched.

// The methods extended below
const {panBy} = MaplairMap.prototype,
{getEvents: getDivOverlayEvents} = DivOverlay.prototype,
{_setPosition: setTooltipPosition} = Tooltip.prototype,
{getEvents: getMarkerEvents} = Marker.prototype,
{_onDown: onDraggableDown, _updatePosition: updateDraggablePosition} = Draggable.prototype,
{_onPointerStart: onPinchStart} = PinchZoomHandler.prototype,
{_onDown: onTapDragDown} = TapDragZoomHandler.prototype,
{_pinchTo: pinchTo} = ScrollWheelZoomHandler.prototype;

/**
 * Map options of the map rotation (`maplair/map-rotation`).
 * @typedef {object} RotationMapOptions
 * @lends MaplairMapOptions
 * @property {number} [bearing=0] Initial rotation of the map in degrees: the compass
 * direction pointing up, clockwise from north (e.g. `90` for east up), see
 * `setBearing()`.
 * @property {boolean} [pinchRotate=false] Whether the map can be rotated by turning two
 * fingers, see `setBearing()`.
 */

MaplairMap.mergeOptions({
	bearing: 0,
	pinchRotate: false
});

MaplairMap.addInitHook(function () {
	if (this.options.bearing || this.options.pinchRotate || this.options.rotateControl) {
		this._rotate(this.options.bearing);
		if (this._loaded) {
			this.fire('moveend');
		}
	}
});

RotateControl.register(MaplairMap);

/**
 * Methods of `MaplairMap` for the map rotation. The rotation of the map is an optional
 * feature: import this module (`maplair/map-rotation`) to add the `bearing`,
 * `pinchRotate` and `rotateControl` options, `setBearing()`, `getBearing()` and the
 * `rotate` event to `MaplairMap`, and the `RotateControl`. Maps not using it don't
 * contain its code.
 *
 * The map pane is wrapped in a pane rotated around the center of the container.
 * Container/layer point conversions, `getPixelBounds()` and `getBounds()` account
 * for the rotation; grid layers and vector renderers cover the bounding box of
 * the rotated view; markers, popups and tooltips stay upright (see the Marker
 * option `rotateWithView`); dragging, `panBy()`, the keyboard, pinch, tap-drag,
 * touchpad and continuous zoom work in container pixels.
 *
 * @example
 * ```js
 * import {MaplairMap} from 'maplair';
 * import {RotateControl} from 'maplair/map-rotation';
 *
 * const map = new MaplairMap('map', {bearing: 30, pinchRotate: true, rotateControl: true});
 * ```
 *
 * @lends MaplairMap.prototype
 * @fires MaplairMap#rotate {MaplairEvent} Fired when the bearing of the map changes,
 * see `setBearing()`.
 */
const mapRotationMethods = {
	/**
	 * Rotates the map around the center of the view, so that the compass direction
	 * `bearing` (in degrees, clockwise from north) points up. Markers, popups and
	 * tooltips stay upright. With `{animate: true}`, the map rotates smoothly (the
	 * shorter way round).
	 * @group Map rotation
	 * @param {number} bearing
	 * @param {{animate?: boolean}} [options]
	 * @returns {this}
	 */
	setBearing(bearing, options) {
		bearing = normalizeBearing(bearing);
		const from = this.getBearing();
		if (!this._rotatePane && !bearing) { return this; }
		if (bearing === from) { return this; }

		this._stop();
		if (!options?.animate || !this._loaded || Browser.reducedMotion) {
			this._rotate(bearing);
			return this._loaded ? this.fire('movestart').fire('move').fire('moveend') : this;
		}

		// the shorter way round
		const delta = ((bearing - from + 540) % 360) - 180,
		start = performance.now(),
		duration = 250;
		this.fire('movestart');
		const frame = () => {
			const t = Math.min(1, (performance.now() - start) / duration);
			this._rotate(from + delta * (1 - (1 - t) ** 2));
			this.fire('move');
			if (t < 1) {
				// cancelled by `_stop()`
				this._flyToFrame = requestAnimationFrame(frame);
			} else {
				this.fire('moveend');
			}
		};
		this._flyToFrame = requestAnimationFrame(frame);
		return this;
	},

	// Applies the bearing without the events of a view change (e.g. while pinching)
	_rotate(bearing) {
		bearing = normalizeBearing(bearing);
		if (!this._rotatePane) {
			// the map pane is wrapped in a pane rotated around the center of the container
			const rotatePane = this._rotatePane = DomUtil.create('div', 'maplair-rotate-pane');
			rotatedMaps.set(rotatePane, this);
			this._container.insertBefore(rotatePane, this._mapPane);
			rotatePane.appendChild(this._mapPane);
		}
		if (bearing === this.getBearing()) { return; }

		this._bearing = bearing;
		this._rotatePane.style.transform = bearing ? `rotate(${-bearing}deg)` : '';

		if (this._loaded) {
			this.fire('rotate');
		}
	},

	/**
	 * Returns the rotation of the map, see `setBearing()`.
	 * @group Map rotation
	 * @returns {number}
	 */
	getBearing() {
		return this._bearing ?? 0;
	},

	// Rotates an offset in container (screen) pixels to the frame of the rotated map pane
	_rotateToPane(point) {
		return this._bearing ? rotatePoint(point, this._bearing) : point;
	},

	// Rotates an offset in the frame of the rotated map pane to container (screen) pixels
	_rotateToContainer(point) {
		return this._bearing ? rotatePoint(point, -this._bearing) : point;
	},

	// The size of the bounding box of the rotated view, in pixels of the map pane
	_getViewSize() {
		const size = this.getSize();
		if (!this._bearing) { return size; }
		const angle = this._bearing * Math.PI / 180,
		cos = Math.abs(Math.cos(angle)),
		sin = Math.abs(Math.sin(angle));
		return new Point(size.x * cos + size.y * sin, size.x * sin + size.y * cos);
	},

	// Counter-rotates `el` (positioned with `DomUtil.setPosition()`) around its CSS
	// `transformOrigin`, so that it stays upright on a rotated map.
	_rotateUpright(el, transformOrigin) {
		if (this._bearing) {
			el.style.transform += ` rotate(${this._bearing}deg)`;
			el.style.transformOrigin = transformOrigin;
		} else if (el.style.transformOrigin) {
			el.style.transformOrigin = '';
		}
	},

	/**
	 * Overrides `containerPointToLayerPoint()` of `MaplairMap` (documented there) to
	 * account for the rotation.
	 * @internal
	 * @param {PointExpression} point
	 * @returns {Point}
	 */
	containerPointToLayerPoint(point) { // (Point)
		point = new Point(point);
		if (this._bearing) {
			// the map pane is rotated around the center of the container
			const center = this.getSize()._divideBy(2);
			point = this._rotateToPane(point.subtract(center))._add(center);
		}
		return point.subtract(this._getMapPanePos());
	},

	/**
	 * Overrides `layerPointToContainerPoint()` of `MaplairMap` (documented there) to
	 * account for the rotation.
	 * @internal
	 * @param {PointExpression} point
	 * @returns {Point}
	 */
	layerPointToContainerPoint(point) { // (Point)
		point = new Point(point).add(this._getMapPanePos());
		if (this._bearing) {
			const center = this.getSize()._divideBy(2);
			point = this._rotateToContainer(point.subtract(center))._add(center);
		}
		return point;
	},

	/**
	 * Overrides `getPixelBounds()` of `MaplairMap` (documented there): the bounding box
	 * of the rotated view.
	 * @internal
	 * @param {LatLng} [center]
	 * @param {number} [zoom]
	 * @returns {Bounds}
	 */
	getPixelBounds(center, zoom) {
		const topLeftPoint = this._getTopLeftPoint(center, zoom);
		if (!this._bearing) {
			return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
		}
		// the bounding box of the rotated view
		const pixelCenter = topLeftPoint.add(this.getSize()._divideBy(2)),
		half = this._getViewSize()._divideBy(2);
		return new Bounds(pixelCenter.subtract(half), pixelCenter.add(half));
	},

	/**
	 * Overrides `panBy()` of `MaplairMap` (documented there): `panBy()` takes offsets in
	 * container pixels, the map pane moves in its rotated frame.
	 * @internal
	 * @param {PointExpression} offset
	 * @param {PanOptions} [options]
	 * @returns {this}
	 */
	panBy(offset, options) {
		return panBy.call(this, this._rotateToPane(new Point(offset)), options);
	},

	_tryAnimatedPan(center, options) {
		// difference between the new and current centers in pixels
		const offset = this._rotateToContainer(this._getCenterOffset(center)._trunc());

		// don't animate too far unless animate: true specified in options
		if (options?.animate !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	},

	/**
	 * Overrides `invalidateSize()` of `MaplairMap` (documented there) to pan in container
	 * pixels.
	 * @internal
	 * @param {boolean|InvalidateSizeOptions} [options]
	 * @returns {this}
	 */
	invalidateSize(options) {
		if (!this._loaded) { return this; }

		options = {
			animate: false,
			pan: true,
			...(options === true ? {animate: true} : options)
		};

		const oldSize = this.getSize();
		this._sizeChanged = true;
		this._lastCenter = null;

		const newSize = this.getSize(),
		oldCenter = oldSize.divideBy(2).round(),
		newCenter = newSize.divideBy(2).round(),
		offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(this._rotateToContainer(offset));

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(this.fire.bind(this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		return this.fire('resize', {
			oldSize,
			newSize
		});
	},

	// Zooms to `center` and `zoom` frame by frame around the zoom origin at `offset`
	// from the center (as the CSS zoom animation does), see the `continuousZoom` option.
	_continuousZoom(center, zoom, offset, options) {
		const startZoom = this._zoom,
		originOffset = offset.multiplyBy(-1),
		origin = this.layerPointToLatLng(this._getCenterLayerPoint().add(offset)),
		start = performance.now(),
		duration = 250;

		this._moveStart(true, options.noMoveStart ?? false);

		const frame = () => {
			const t = Math.min(1, (performance.now() - start) / duration);
			if (t < 1) {
				// ease out, like the CSS zoom transition
				const z = startZoom + (zoom - startZoom) * (1 - (1 - t) ** 2);
				this._move(this.unproject(this.project(origin, z).add(originOffset), z), z, {continuous: true});
				// cancelled by `_stop()`
				this._flyToFrame = requestAnimationFrame(frame);
			} else {
				this._move(center, zoom)._moveEnd(true);
			}
		};
		this._flyToFrame = requestAnimationFrame(frame);
	}
};
/** @typedef {typeof mapRotationMethods} MapRotationMethods */

MaplairMap.include(mapRotationMethods);

/**
 * Methods of `GridLayer` for the map rotation: the tiles cover the bounding box of the
 * rotated view.
 * @lends GridLayer.prototype
 */
const gridLayerRotationMethods = {
	_getTiledPixelBounds(center) {
		const map = this._map,
		mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
		scale = map.getZoomScale(mapZoom, this._tileZoom),
		pixelCenter = map.project(center, this._tileZoom).floor(),
		halfSize = map._getViewSize().divideBy(scale * 2);

		return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
	}
};
/** @typedef {typeof gridLayerRotationMethods} GridLayerMapRotationMethods */

GridLayer.include(gridLayerRotationMethods);

/**
 * Methods of `BlanketOverlay` for the map rotation: the overlay covers the bounding
 * box of the rotated view.
 * @lends BlanketOverlay.prototype
 */
const blanketOverlayRotationMethods = {
	_updateTransform(center, zoom) {
		const scale = this._map.getZoomScale(zoom, this._zoom),
		viewHalf = this._map._getViewSize().multiplyBy(0.5 + this.options.padding),
		currentCenterPoint = this._map.project(this._center, zoom),
		topLeftOffset = viewHalf.multiplyBy(-scale)._add(currentCenterPoint)
			._subtract(this._map._getNewPixelOrigin(center, zoom))
			._round();

		DomUtil.setTransform(this._container, topLeftOffset, scale);
	},

	_onMoveEnd(ev) {
		// Update pixel bounds of renderer container (for positioning/sizing/clipping later)
		// the bounding box of the (possibly rotated) view, extended by the padding
		const p = this.options.padding,
		size = this._map._getViewSize();
		if (!size.multiplyBy(1 + p * 2).round().equals(this._containerSize)) {
			// e.g. after rotating the map
			this._resizeContainer();
		}
		const min = this._map._getCenterLayerPoint().subtract(size.multiplyBy(0.5 + p)).round();

		this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());

		this._center = this._map.getCenter();
		this._zoom = this._map.getZoom();
		this._updateTransform(this._center, this._zoom);

		this._onSettled(ev);
	},

	_resizeContainer() {
		const p = this.options.padding,
		size = this._containerSize = this._map._getViewSize().multiplyBy(1 + p * 2).round();
		this._container.style.width = `${size.x}px`;
		this._container.style.height = `${size.y}px`;
		return size;
	}
};
/** @typedef {typeof blanketOverlayRotationMethods} BlanketOverlayMapRotationMethods */

BlanketOverlay.include(blanketOverlayRotationMethods);

/**
 * Methods of `DivOverlay` for the map rotation: the overlays stay upright.
 * @lends DivOverlay.prototype
 */
const divOverlayRotationMethods = {
	/**
	 * Overrides `getEvents()` of `DivOverlay` to update the position on rotation.
	 * @internal
	 * @returns {Record<string, Function>}
	 */
	getEvents() {
		return {...getDivOverlayEvents.call(this), rotate: this._updatePosition};
	},

	_updatePosition() {
		if (!this._map) { return; }

		const map = this._map,
		pos = map.latLngToLayerPoint(this._latlng),
		// on a rotated map, the anchor is relative to the upright overlay
		anchor = map._rotateToPane(new Point(this._getAnchor()));
		let offset = new Point(this.options.offset);

		const transformed = this._zoomAnimated || this.options.overflow || map._bearing;
		if (!transformed) {
			offset = offset.add(pos).add(anchor);
		}

		const bottom = this._containerBottom = -offset.y,
		left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

		// bottom position the overlay in case the height of the overlay changes (images loading etc)
		if (this.options.overflow) {
			// relative to the top of the viewport instead of the pane origin
			this._container.style.top = 'auto';
			this._container.style.bottom = `calc(100% + ${bottom}px)`;
		} else {
			this._container.style.bottom = `${bottom}px`;
		}
		this._container.style.left = `${left}px`;

		if (transformed) {
			// upright around the anchored point (below the bottom margin, see `Popup`)
			this._setContainerPosition(pos.add(anchor), `${-left}px calc(100% + ${bottom + (this._containerMarginBottom ?? 0)}px)`);
		}
	},

	// Positions the container at the given layer point. An overflowing overlay
	// lives in the top layer of the page, so it is positioned in viewport coordinates.
	// `transformOrigin` is the point around which the container is kept upright on a rotated map.
	_setContainerPosition(pos, transformOrigin) {
		this._containerPos = pos;
		if (this.options.overflow) {
			const mapContainer = this._map._container,
			rect = mapContainer.getBoundingClientRect();
			pos = this._map.layerPointToContainerPoint(pos)
				._add(new Point(rect.left + mapContainer.clientLeft, rect.top + mapContainer.clientTop));
		}
		DomUtil.setPosition(this._container, pos);
		if (!this.options.overflow) {
			this._map._rotateUpright(this._container, transformOrigin);
		}
	}
};
/** @typedef {typeof divOverlayRotationMethods} DivOverlayMapRotationMethods */

DivOverlay.include(divOverlayRotationMethods);

/**
 * Methods of `Popup` for the map rotation: the popup stays upright, autopanning in
 * container pixels.
 * @lends Popup.prototype
 */
const popupRotationMethods = {
	_animateZoom(e) {
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
		anchor = this._map._rotateToPane(new Point(this._getAnchor()));
		this._setContainerPosition(pos.add(anchor), this._container.style.transformOrigin);
	},

	_adjustPan() {
		if (!this.options.autoPan) { return; }
		this._map._panAnim?.stop();

		// We can endlessly recurse if keepInView is set and the view resets.
		// Let's guard against that by exiting early if we're responding to our own autopan.
		if (this._autopanning) {
			this._autopanning = false;
			return;
		}

		const map = this._map,
		marginBottom = this._containerMarginBottom ?? (parseInt(getComputedStyle(this._container).marginBottom, 10) || 0),
		containerHeight = this._containerHeight + marginBottom,
		containerWidth = this._containerWidth,
		// the top left corner, relative to the (upright) anchored point
		topLeft = new Point(this._containerLeft, -containerHeight - this._containerBottom);

		const containerPos = map.layerPointToContainerPoint(this._getContainerPosition())._add(topLeft),
		padding = new Point(this.options.autoPanPadding),
		paddingTL = new Point(this.options.autoPanPaddingTopLeft ?? padding),
		paddingBR = new Point(this.options.autoPanPaddingBottomRight ?? padding),
		size = map.getSize();
		let dx = 0,
		dy = 0;

		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		}
		if (containerPos.x - dx - paddingTL.x < 0) { // left
			dx = containerPos.x - paddingTL.x;
		}
		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		}
		if (containerPos.y - dy - paddingTL.y < 0) { // top
			dy = containerPos.y - paddingTL.y;
		}

		// see the `autopanstart` event of `Popup`
		if (dx || dy) {
			// Track that we're autopanning, as this function will be re-ran on moveend
			if (this.options.keepInView) {
				this._autopanning = true;
			}

			map
				.fire('autopanstart')
				.panBy([dx, dy]);
		}
	}
};
/** @typedef {typeof popupRotationMethods} PopupMapRotationMethods */

Popup.include(popupRotationMethods);

// The margins of the directions, see `.maplair-tooltip-top` etc. in maplair.css
const tooltipMargins = {
	top: [0, -6],
	bottom: [0, 6],
	left: [-6, 0],
	right: [6, 0]
};

/**
 * Methods of `Tooltip` for the map rotation: the tooltip stays upright.
 * @lends Tooltip.prototype
 */
const tooltipRotationMethods = {
	// On a rotated map, the tooltip is positioned at its source and kept upright
	// around it (taking the margin of the direction into account)
	_setPosition(pos) {
		setTooltipPosition.call(this, pos);
		const container = this._container;
		if (this.options.overflow) { return; }
		if (!this._map._bearing) {
			container.style.left = container.style.top = '';
			return;
		}
		const delta = this._containerPos.subtract(pos),
		direction = Object.keys(tooltipMargins).find(d => container.classList.contains(`maplair-tooltip-${d}`)),
		margin = tooltipMargins[direction] ?? [0, 0];
		container.style.left = `${delta.x}px`;
		container.style.top = `${delta.y}px`;
		this._setContainerPosition(pos, `${-delta.x - margin[0]}px ${-delta.y - margin[1]}px`);
	}
};
/** @typedef {typeof tooltipRotationMethods} TooltipMapRotationMethods */

Tooltip.include(tooltipRotationMethods);

/**
 * Methods of `Marker` for the map rotation: the marker is updated on rotation.
 * @lends Marker.prototype
 */
const markerRotationMethods = {
	/**
	 * Overrides `getEvents()` of `Marker` to update the marker on rotation.
	 * @internal
	 * @returns {Record<string, Function>}
	 */
	getEvents() {
		return {...getMarkerEvents.call(this), rotate: this.update};
	}
};
/** @typedef {typeof markerRotationMethods} MarkerMapRotationMethods */

Marker.include(markerRotationMethods);

/**
 * Methods of `MarkerDrag` for the map rotation: autopanning in container pixels.
 * @lends MarkerDrag.prototype
 */
const markerDragRotationMethods = {
	_adjustPan(e) {
		const marker = this._marker,
		map = marker._map,
		speed = this._marker.options.autoPanSpeed,
		padding = this._marker.options.autoPanPadding,
		iconPos = DomUtil.getPosition(marker._icon),
		bounds = map.getPixelBounds(),
		origin = map.getPixelOrigin();

		const panBounds = new Bounds(
			bounds.min._subtract(origin).add(padding),
			bounds.max._subtract(origin).subtract(padding)
		);

		if (!panBounds.contains(iconPos)) {
			// Compute incremental movement
			const movement = new Point(
				(Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) -
					(Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x),

				(Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) -
					(Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)
			).multiplyBy(speed);

			map.panBy(map._rotateToContainer(movement), {animate: false});

			this._draggable._newPos._add(movement);
			this._draggable._startPos._add(movement);

			DomUtil.setPosition(marker._icon, this._draggable._newPos);
			this._onDrag(e);

			this._panRequest = requestAnimationFrame(this._adjustPan.bind(this, e));
		}
	}
};
/** @typedef {typeof markerDragRotationMethods} MarkerDragMapRotationMethods */

MarkerDrag.include(markerDragRotationMethods);

/**
 * Methods of `Draggable` for the map rotation: dragging in the rotated frame of the
 * map pane.
 * @lends Draggable.prototype
 */
const draggableRotationMethods = {
	_onDown(e) {
		onDraggableDown.call(this, e);
		// on a rotated map, the element moves in the rotated frame of the map pane,
		// and the rotated pane is scaled by its bounding box (see `DomUtil.getScale()`)
		const rotatePane = this._element.closest?.('.maplair-rotate-pane');
		this._rotatedMap = rotatePane && rotatedMaps.get(rotatePane);
		if (this._rotatedMap && this._parentScale) {
			this._parentScale = DomUtil.getScale(rotatePane.parentNode);
		}
	},

	_updatePosition() {
		const map = this._rotatedMap;
		if (map?._bearing) {
			this._newPos = this._startPos.add(map._rotateToPane(this._newPos.subtract(this._startPos)));
		}
		updateDraggablePosition.call(this);
	}
};
/** @typedef {typeof draggableRotationMethods} DraggableMapRotationMethods */

Draggable.include(draggableRotationMethods);

/**
 * Methods of `DragHandler` for the map rotation: the inertia in container pixels.
 * @lends DragHandler.prototype
 */
const dragHandlerRotationMethods = {
	_onDragEnd(e) {
		const map = this._map,
		options = map.options,

		noInertia = !options.inertia || e.noInertia || this._times.length < 2;

		map.fire('dragend', e);

		if (noInertia) {
			map.fire('moveend');

		} else {
			this._prunePositions(Date.now());

			const direction = this._lastPos.subtract(this._positions[0]),
			duration = (this._lastTime - this._times[0]) / 1000,
			ease = options.easeLinearity,

			speedVector = direction.multiplyBy(ease / duration),
			speed = speedVector.distanceTo([0, 0]),

			limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
			limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

			decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease);
			let offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

			if (!offset.x && !offset.y) {
				map.fire('moveend');

			} else {
				offset = map._limitOffset(offset, map.options.maxBounds);

				requestAnimationFrame(() => {
					// the offset of the map pane, `panBy()` takes container pixels
					map.panBy(map._rotateToContainer(offset), {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true,
						animate: true
					});
				});
			}
		}
	}
};
/** @typedef {typeof dragHandlerRotationMethods} DragHandlerMapRotationMethods */

DragHandler.include(dragHandlerRotationMethods);

// The time (ms) without further wheel events after which a touchpad pan ends, see `ScrollWheelZoomHandler`
const gestureEndDelay = 150;

// The angle (degrees) the fingers have to turn before the map starts rotating
const rotateThreshold = 15;

function angleOf(p1, p2) {
	return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

/**
 * Methods of `PinchZoomHandler` for the map rotation: rotating by turning two fingers
 * (see the map option `pinchRotate`), pinching in the rotated frame.
 * @lends PinchZoomHandler.prototype
 */
const pinchZoomHandlerRotationMethods = {
	_onPointerStart(e) {
		onPinchStart.call(this, e);
		const pointers = PointerEvents.getPointers();
		if (this._zooming && pointers.length === 2) {
			this._startAngle = angleOf(...pointers.map(p => this._map.pointerEventToContainerPoint(p)));
			this._startBearing = this._map.getBearing();
			this._rotating = false;
		}
	},

	_onPointerMove(e) {
		const pointers = PointerEvents.getPointers();
		if (pointers.length !== 2 || !this._zooming) { return; }

		const map = this._map,
		p1 = map.pointerEventToContainerPoint(pointers[0]),
		p2 = map.pointerEventToContainerPoint(pointers[1]),
		scale = p1.distanceTo(p2) / this._startDist;

		this._zoom = map.getScaleZoom(scale, this._startZoom);

		if (map.options.pinchRotate) {
			const angle = angleOf(p1, p2);
			let delta = ((angle - this._startAngle + 540) % 360) - 180;
			if (!this._rotating && Math.abs(delta) > rotateThreshold) {
				// start rotating from the threshold on, without a jump
				this._rotating = true;
				this._startAngle += Math.sign(delta) * rotateThreshold;
				delta -= Math.sign(delta) * rotateThreshold;
			}
			if (this._rotating) {
				// turning the fingers clockwise turns the map clockwise
				map._rotate(this._startBearing - delta);
			}
		}

		if (!map.options.bounceAtZoomLimits && (
			(this._zoom < map.getMinZoom() && scale < 1) ||
				(this._zoom > map.getMaxZoom() && scale > 1))) {
			this._zoom = map._limitZoom(this._zoom);
		}

		if (map.options.pinchZoom === 'center') {
			this._center = this._startLatLng;
			if (scale === 1 && !this._rotating) { return; }
		} else {
			// Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
			const delta = map._rotateToPane(p1._add(p2)._divideBy(2)._subtract(this._centerPoint));
			if (scale === 1 && delta.x === 0 && delta.y === 0 && !this._rotating) { return; }
			this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
		}

		if (!this._moved) {
			map._setUserEvent(e);
			map._moveStart(true, false);
			this._moved = true;
		}

		cancelAnimationFrame(this._animRequest);

		const moveFn = map._move.bind(map, this._center, this._zoom, {pinch: true, round: false}, undefined);
		this._animRequest = requestAnimationFrame(moveFn.bind(this));

		e.preventDefault();
	}
};
/** @typedef {typeof pinchZoomHandlerRotationMethods} PinchZoomHandlerMapRotationMethods */

PinchZoomHandler.include(pinchZoomHandlerRotationMethods);

/**
 * Methods of `TapDragZoomHandler` for the map rotation: the zoom origin in the rotated
 * frame.
 * @lends TapDragZoomHandler.prototype
 */
const tapDragZoomHandlerRotationMethods = {
	_onDown(e) {
		onTapDragDown.call(this, e);
		// the offset of the zoom origin in the rotated frame of the map pane
		if (this._zooming && this._aroundOffset) {
			this._aroundOffset = this._map._rotateToPane(this._aroundOffset);
		}
	}
};
/** @typedef {typeof tapDragZoomHandlerRotationMethods} TapDragZoomHandlerMapRotationMethods */

TapDragZoomHandler.include(tapDragZoomHandlerRotationMethods);

/**
 * Methods of `ScrollWheelZoomHandler` for the map rotation: zooming and panning in the
 * rotated frame.
 * @lends ScrollWheelZoomHandler.prototype
 */
const scrollWheelZoomHandlerRotationMethods = {
	_pinchTo(e, zoom, eased) {
		pinchTo.call(this, e, zoom, eased);
		// the offset of the zoom origin in the rotated frame of the map pane
		if (this._pinch && !this._pinch.rotated) {
			this._pinch.offset = this._map._rotateToPane(this._pinch.offset);
			this._pinch.rotated = true;
		}
	},

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
		// in the rotated frame of the map pane
		offset = map._rotateToPane(offset);
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
};
/** @typedef {typeof scrollWheelZoomHandlerRotationMethods} ScrollWheelZoomHandlerMapRotationMethods */

ScrollWheelZoomHandler.include(scrollWheelZoomHandlerRotationMethods);
