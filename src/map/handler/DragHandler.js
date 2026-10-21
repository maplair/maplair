import {Handler} from '../../core/Handler.js';
import {Draggable} from '../../dom/Draggable.js';
import {LatLngBounds} from '../../geo/LatLngBounds.js';
import {Bounds} from '../../geometry/Bounds.js';
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent, DragEndEvent} from '../../core/Events.js' */

/**
 * Map options of `DragHandler`, the interaction options for dragging.
 * @typedef {object} DragHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [dragging=true] Whether the map is draggable with pointer or not.
 * @property {boolean} [inertia=true] If enabled, panning of the map will have an
 * inertia effect where the map builds momentum while dragging and continues moving in
 * the same direction for some time. Feels especially nice on touch devices.
 * @property {number} [inertiaDeceleration=3400] The rate with which the inertial
 * movement slows down, in pixels/second².
 * @property {number} [inertiaMaxSpeed=Infinity] Max speed of the inertial movement,
 * in pixels/second.
 * @property {number} [easeLinearity=0.2] The linearity of the easing of the inertial
 * movement.
 * @property {boolean} [worldCopyJump=false] With this option enabled, the map tracks
 * when you pan to another "copy" of the world and seamlessly jumps to the original one
 * so that all overlays like markers and vector layers are still visible.
 * @property {number} [maxBoundsViscosity=0.0] If `maxBounds` is set, this option will
 * control how solid the bounds are when dragging the map around. The default value of
 * `0.0` allows the user to drag outside the bounds at normal speed, higher values will
 * slow down map dragging outside bounds, and `1.0` makes the bounds fully solid,
 * preventing the user from dragging outside the bounds.
 */

/**
 * Handler of `MaplairMap` for dragging.
 * @typedef {object} DragHandlerMapProperties
 * @lends MaplairMap
 * @property {DragHandler} dragging Map dragging handler.
 */

/**
 * Makes the map draggable (with panning inertia), enabled by default, see the map
 * option `dragging`.
 *
 * @fires MaplairMap#dragstart {MaplairEvent} Fired when the user starts dragging the map.
 * @fires MaplairMap#drag {MaplairEvent} Fired repeatedly while the user drags the map.
 * @fires MaplairMap#dragend {DragEndEvent} Fired when the user stops dragging the map.
 */
export class DragHandler extends Handler {
	/**
	 * @param {...MaplairMap} args The map.
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(DragHandler);
	}

	/**
	 * Called when the handler is enabled, adds the event hooks.
	 */
	addHooks() {
		if (!this._draggable) {
			const map = this._map;

			this._draggable = new Draggable(map._mapPane, map._container);

			this._draggable.on({
				dragstart: this._onDragStart,
				drag: this._onDrag,
				dragend: this._onDragEnd
			}, this);

			this._draggable.on('predrag', this._onPreDragLimit, this);
			if (map.options.worldCopyJump) {
				this._draggable.on('predrag', this._onPreDragWrap, this);
			}
		}
		this._map._container.classList.add('maplair-grab', 'maplair-touch-drag');
		this._draggable.enable();
		this._positions = [];
		this._times = [];
	}

	/**
	 * Called when the handler is disabled, removes the event hooks.
	 */
	removeHooks() {
		this._map._container.classList.remove('maplair-grab', 'maplair-touch-drag');
		this._draggable.disable();
	}

	/**
	 * Returns `true` if the map has been moved by the current or last drag.
	 * @returns {boolean}
	 */
	moved() {
		return this._draggable?._moved;
	}

	/**
	 * Returns `true` while the map is being dragged.
	 * @returns {boolean}
	 */
	moving() {
		return this._draggable?._moving;
	}

	_onDragStart(e) {
		const map = this._map;

		map._stop();
		map._setUserEvent(e.originalEvent);
		if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
			const bounds = LatLngBounds.from(this._map.options.maxBounds);

			this._offsetLimit = new Bounds(
				this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
				this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1)
					.add(this._map.getSize()));

			this._viscosity = Math.min(1.0, Math.max(0.0, this._map.options.maxBoundsViscosity));
		} else {
			this._offsetLimit = null;
		}

		map
			.fire('movestart')
			.fire('dragstart');

		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	}

	_onDrag(e) {
		if (this._map.options.inertia) {
			const time = this._lastTime = Date.now(),
			pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;

			this._positions.push(pos);
			this._times.push(time);

			this._prunePositions(time);
		}

		this._map
			.fire('move', e)
			.fire('drag', e);
	}

	_prunePositions(time) {
		while (this._positions.length > 1 && time - this._times[0] > 50) {
			this._positions.shift();
			this._times.shift();
		}
	}

	_viscousLimit(value, threshold) {
		return value - (value - threshold) * this._viscosity;
	}

	_onPreDragLimit() {
		if (!this._viscosity || !this._offsetLimit) { return; }

		const offset = this._draggable._newPos.subtract(this._draggable._startPos);

		const limit = this._offsetLimit;
		if (offset.x < limit.min.x) { offset.x = this._viscousLimit(offset.x, limit.min.x); }
		if (offset.y < limit.min.y) { offset.y = this._viscousLimit(offset.y, limit.min.y); }
		if (offset.x > limit.max.x) { offset.x = this._viscousLimit(offset.x, limit.max.x); }
		if (offset.y > limit.max.y) { offset.y = this._viscousLimit(offset.y, limit.max.y); }

		this._draggable._newPos = this._draggable._startPos.add(offset);
	}

	_onPreDragWrap() {
		const draggable = this._draggable;
		draggable._absPos = draggable._newPos;
		draggable._newPos = this._map._wrapWorldCopy(draggable._newPos);
	}

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
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true,
						animate: true
					});
				});
			}
		}
	}

	/**
	 * Registers this default feature on the map class, called by `MaplairMap` itself.
	 * @internal
	 * @param {typeof MaplairMap} MaplairMap
	 */
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			dragging: true,
			inertia: true,
			inertiaDeceleration: 3400, // px/s^2
			inertiaMaxSpeed: Infinity, // px/s
			easeLinearity: 0.2,
			// TODO refactor, move to CRS
			worldCopyJump: false,
			maxBoundsViscosity: 0.0
		});

		MaplairMap.addInitHook('addHandler', 'dragging', DragHandler);
	}
}
