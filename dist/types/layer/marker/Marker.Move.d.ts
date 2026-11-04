import type { Marker } from './Marker.js';
import type { LatLng } from '../../geo/LatLng.js';
import type { Point } from '../../geometry/Point.js';
import type { MaplairEvent } from '../../core/Events.js';

/**
 * Options of the movement of markers, see `moveAlong()`.
 */
export interface MarkerMovementOptions {
    /**
     * The duration of the movement in milliseconds.
     * @default 1000
     */
    duration?: number;
    /**
     * The speed in meters (or units of the CRS) per second
     * instead of the `duration`.
     */
    speed?: number;
    /**
     * Whether to set the `rotation` of the marker to
     * the heading of the movement (for icons pointing up).
     * @default false
     */
    rotate?: boolean;
}
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
 * @fires Marker#moveend {MaplairEvent} Fired when the marker stops moving (after dragging
 * or `moveAlong()`).
 */
export interface MarkerMoveMethods {
    /**
     * Moves the marker smoothly to `latlng`, see `moveAlong()`.
     * @group Marker movement
     * @param {LatLngExpression} latlng
     * @param {MarkerMovementOptions} [options]
     * @returns {this}
     */
    moveTo(latlng: LatLngExpression, options?: MarkerMovementOptions): this;
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
    moveAlong(latlngs: LatLngExpression[], options?: MarkerMovementOptions): this;
    /**
     * Stops the movement of `moveTo()` or `moveAlong()`.
     * @group Marker movement
     * @returns {this}
     */
    stopMoving(): this;
    /**
     * Returns `true` while the marker moves with `moveTo()` or `moveAlong()`.
     * @group Marker movement
     * @returns {boolean}
     */
    isMoving(): boolean;
}
import type { LatLngExpression } from '../../geo/LatLng.js';
import type { MaplairMap } from '../../map/Map.js';
export {};
declare module './Marker.js' {
    interface Marker extends MarkerMoveMethods {
    }
}
