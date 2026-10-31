import {Handler} from '../../core/Handler.js';
import * as DomEvent from '../../dom/DomEvent.js';
import * as DomUtil from '../../dom/DomUtil.js';
import {Draggable} from '../../dom/Draggable.js';
import {Bounds} from '../../geometry/Bounds.js';
import {Point} from '../../geometry/Point.js';

/** @import {Marker, MarkerMoveEvent} from './Marker.js' */
/** @import {MaplairEvent, DragEndEvent} from '../../core/Events.js' */

/** @type {Record<string, [number, number]>} */
const arrows = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};

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
			this._draggable = new Draggable(icon);
		}

		this._draggable.on({
			dragstart: this._onDragStart,
			predrag: this._onPreDrag,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).enable();

		DomEvent.on(icon, 'keydown keyup blur', this._onKey, this);

		icon.classList.add('maplair-marker-draggable');
	}

	/**
	 * Makes the icon of the marker undraggable, called by `disable()`.
	 */
	removeHooks() {
		this._keyOffset = null; // disabling the Draggable below ends a keyboard drag in progress, as it does a pointer drag

		this._draggable.off({
			dragstart: this._onDragStart,
			predrag: this._onPreDrag,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).disable();

		DomEvent.off(this._draggable._element, 'keydown keyup blur', this._onKey, this);

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
		iconPos = DomUtil.getPosition(marker._icon),
		latlng = marker._map.layerPointToLatLng(iconPos);

		// Draggable only moved the icon and dropped its rotation
		marker._positionElements(iconPos);

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

	// Arrow keys move a focused marker. Holding a key down is one drag, driven through the Draggable like a pointer
	// drag (so the two can't overlap), and ends on keyup or blur.
	/** @param {KeyboardEvent|FocusEvent} e */
	_onKey(e) {
		const k = /** @type {KeyboardEvent} */ (e), // all but blur
		dir = arrows[k.key],
		draggable = this._draggable,
		{options, _map: map} = this._marker;

		if (e.type !== 'keydown') {
			if (this._keyOffset) {
				this._keyOffset = null;
				draggable.finishDrag();
			}

		} else if (dir && k.target === draggable._element && !(k.altKey || k.ctrlKey || k.metaKey)) {
			e.preventDefault(); // don't scroll the page

			if (!this._keyOffset) {
				if (Draggable._dragging) { return; }
				Draggable._dragging = draggable;
				draggable._startPos = DomUtil.getPosition(draggable._element);
				draggable._moved = draggable._moving = true;
				this._keyOffset = new Point(0, 0);
				draggable.fire('dragstart');
			}

			// in container pixels, which the map rotation (if any) turns to the frame of the rotated pane
			const offset = new Point(...dir).multiplyBy(k.shiftKey ? 30 : 10);
			this._keyOffset = this._keyOffset.add(map._rotateToPane?.(offset) ?? offset);
			// not through _updatePosition, whose predrag would start the pointer autoPan loop
			draggable._newPos = draggable._startPos.add(this._keyOffset);
			DomUtil.setPosition(draggable._element, draggable._newPos);
			draggable.fire('drag', {originalEvent: k});

			if (options.autoPan) {
				map.panInside(this._marker._latlng, {padding: options.autoPanPadding, animate: false});
			}
		}
	}
}
