import {Marker} from './Marker.js';
import {LatLng} from '../../geo/LatLng.js';
import {Point} from '../../geometry/Point.js';
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */

/**
 * Options of the movement of markers, see `moveAlong()`.
 * @typedef {object} MarkerMovementOptions
 * @property {number} [duration=1000] The duration of the movement in milliseconds.
 * @property {number} [speed] The speed in meters (or units of the CRS) per second
 * instead of the `duration`.
 * @property {boolean} [rotate=false] Whether to set the `rotationAngle` of the icon to
 * the heading of the movement (for icons pointing up; needs the marker rotation, see
 * `rotationAngle`).
 */

// The methods extended below
const {onRemove} = Marker.prototype;

/**
 * Methods of `Marker` for the animated movement of markers, an optional feature: import
 * this module to add `moveTo()`, `moveAlong()`, `stopMoving()` and `isMoving()` to
 * `Marker`.
 *
 * ```js
 * import 'maplair/marker-movement';
 *
 * marker.moveAlong([[47.27, 11.40], [47.28, 11.42]], {duration: 5000});
 * ```
 *
 * Inspired by the [Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker)
 * and [Leaflet.AnimatedMarker](https://github.com/openplans/Leaflet.AnimatedMarker) plugins.
 * @lends Marker.prototype
 * @fires Marker#moveend {MaplairEvent} Fired when the marker stops moving (after dragging
 * or `moveAlong()`).
 */
const markerMoveMethods = {
	/**
	 * Moves the marker smoothly to `latlng`, see `moveAlong()`.
	 * @group Marker movement
	 * @param {LatLngExpression} latlng
	 * @param {MarkerMovementOptions} [options]
	 * @returns {this}
	 */
	moveTo(latlng, options) {
		return this.moveAlong([latlng], options);
	},

	/**
	 * Moves the marker smoothly along the given points, frame by frame at a constant
	 * speed, e.g. to follow a vehicle or to replay a track. Fires `move` with each
	 * frame and `moveend` at the end. A new movement or `stopMoving()` stops it; with
	 * [reduced motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion),
	 * the marker jumps to the end.
	 * Inspired by the [Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker)
	 * and [Leaflet.AnimatedMarker](https://github.com/openplans/Leaflet.AnimatedMarker) plugins.
	 * @group Marker movement
	 * @param {LatLngExpression[]} latlngs
	 * @param {MarkerMovementOptions} [options]
	 * @returns {this}
	 */
	moveAlong(latlngs, options = {}) {
		this.stopMoving();

		const points = [this._latlng, ...latlngs.map(latlng => LatLng.from(latlng))],
		lengths = points.slice(1).map((point, i) => this._map?.distance(points[i], point) ?? points[i].distanceTo(point)),
		total = lengths.reduce((sum, length) => sum + length, 0),
		duration = options.speed ? total / options.speed * 1000 : (options.duration ?? 1000),
		start = performance.now();

		const frame = () => {
			// the distance moved, at a constant speed
			let distance = duration && !this._map?._prefersReducedMotion() ? Math.min(1, (performance.now() - start) / duration) * total : total,
			i = 0;
			const moved = distance;
			while (i < lengths.length - 1 && distance > lengths[i]) {
				distance -= lengths[i];
				i++;
			}
			const from = points[i], to = points[i + 1];
			if (options.rotate && !from.equals(to)) {
				this.options.rotationAngle = this._heading(from, to);
			}
			this.setLatLng(this._interpolate(from, to, lengths[i] ? Math.min(1, distance / lengths[i]) : 1));

			if (moved < total) {
				this._moveFrame = requestAnimationFrame(frame);
			} else {
				this._moveFrame = null;
				this.fire('moveend');
			}
		};
		this._moveFrame = requestAnimationFrame(frame);
		return this;
	},

	/**
	 * Stops the movement of `moveTo()` or `moveAlong()`.
	 * @group Marker movement
	 * @returns {this}
	 */
	stopMoving() {
		cancelAnimationFrame(this._moveFrame);
		this._moveFrame = null;
		return this;
	},

	/**
	 * Returns `true` while the marker moves with `moveTo()` or `moveAlong()`.
	 * @group Marker movement
	 * @returns {boolean}
	 */
	isMoving() {
		return !!this._moveFrame;
	},

	// A straight line in the projection of the map (if any)
	_interpolate(from, to, t) {
		const crs = this._map?.options.crs;
		if (!crs) {
			return new LatLng(from.lat + (to.lat - from.lat) * t, from.lng + (to.lng - from.lng) * t);
		}
		const a = crs.projection.project(from),
		b = crs.projection.project(to);
		return crs.projection.unproject(a.add(b.subtract(a).multiplyBy(t)));
	},

	// The heading from `from` to `to` in degrees clockwise from north, relative to
	// the screen unless the icon rotates with the view
	_heading(from, to) {
		const crs = this._map?.options.crs,
		a = crs ? crs.latLngToPoint(from, 0) : new Point(from.lng, -from.lat),
		b = crs ? crs.latLngToPoint(to, 0) : new Point(to.lng, -to.lat),
		heading = Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI;
		return heading - (this.options.rotateWithView ? 0 : (this._map?.getBearing?.() ?? 0));
	},

	/**
	 * Stops the movement when the marker is removed from the map.
	 * @internal
	 * @param {MaplairMap} map
	 */
	onRemove(map) {
		this.stopMoving();
		return onRemove.call(this, map);
	}
};
/** @typedef {typeof markerMoveMethods} MarkerMoveMethods */

Marker.include(markerMoveMethods);
