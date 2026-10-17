import {Handler} from '../../core/Handler.js';
import * as DomUtil from '../../dom/DomUtil.js';
import {Draggable} from '../../dom/Draggable.js';
import {Bounds} from '../../geometry/Bounds.js';
import {Point} from '../../geometry/Point.js';

/** @import {Marker, MarkerMoveEvent} from './Marker.js' */
/** @import {MaplairEvent, DragEndEvent} from '../../core/Events.js' */

/**
 * The handler of `Marker` which makes the markers draggable, see the
 * [`dragging`](#marker-dragging) property of markers and its `draggable` option.
 *
 * @fires Marker#dragstart {MaplairEvent} Fired when the user starts dragging the marker.
 * @fires Marker#movestart {MaplairEvent} Fired when the marker starts moving (because of
 * dragging).
 * @fires Marker#drag {MarkerMoveEvent} Fired repeatedly while the user drags the marker.
 * @fires Marker#dragend {DragEndEvent} Fired when the user stops dragging the marker.
 * @fires Marker#moveend {MaplairEvent} Fired when the marker stops moving (because of
 * dragging).
 */
export class MarkerDrag extends Handler {
	/**
	 * Creates the dragging handler of the given marker.
	 * @param {Marker} marker
	 */
	constructor(marker) {
		super(marker._map);
		this._marker = marker;

		this.callInitHooks(MarkerDrag);
	}

	/**
	 * Makes the icon of the marker draggable, called by `enable()`.
	 */
	addHooks() {
		const icon = this._marker._icon;

		if (!this._draggable) {
			this._draggable = new Draggable(icon, icon, true);
		}

		this._draggable.on({
			dragstart: this._onDragStart,
			predrag: this._onPreDrag,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).enable();

		icon.classList.add('maplair-marker-draggable');
	}

	/**
	 * Makes the icon of the marker undraggable, called by `disable()`.
	 */
	removeHooks() {
		this._draggable.off({
			dragstart: this._onDragStart,
			predrag: this._onPreDrag,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).disable();

		this._marker._icon?.classList.remove('maplair-marker-draggable');
	}

	/**
	 * Returns `true` if the marker has been moved by the current or last drag.
	 * @returns {boolean}
	 */
	moved() {
		return this._draggable?._moved;
	}

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

			map.panBy(movement, {animate: false});

			this._draggable._newPos._add(movement);
			this._draggable._startPos._add(movement);

			DomUtil.setPosition(marker._icon, this._draggable._newPos);
			this._onDrag(e);

			this._panRequest = requestAnimationFrame(this._adjustPan.bind(this, e));
		}
	}

	_onDragStart() {
		this._oldLatLng = this._marker.getLatLng();

		// When using ES6 imports it could not be set when `Popup` was not imported as well
		this._marker.closePopup?.();

		this._marker
			.fire('movestart')
			.fire('dragstart');
	}

	_onPreDrag(e) {
		if (this._marker.options.autoPan) {
			cancelAnimationFrame(this._panRequest);
			this._panRequest = requestAnimationFrame(this._adjustPan.bind(this, e));
		}
	}

	_onDrag(e) {
		const marker = this._marker,
		shadow = marker._shadow,
		iconPos = DomUtil.getPosition(marker._icon),
		latlng = marker._map.layerPointToLatLng(iconPos);

		// update shadow position
		if (shadow) {
			DomUtil.setPosition(shadow, iconPos);
		}

		marker._latlng = latlng;
		e.latlng = latlng;
		e.oldLatLng = this._oldLatLng;

		marker
			.fire('move', e)
			.fire('drag', e);
	}

	_onDragEnd(e) {
		cancelAnimationFrame(this._panRequest);

		delete this._oldLatLng;
		this._marker
			.fire('moveend')
			.fire('dragend', e);
	}
}
