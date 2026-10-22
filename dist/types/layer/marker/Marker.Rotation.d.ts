import type { Marker } from './Marker.js';
import type { MarkerDrag } from './Marker.Drag.js';

/**
 * Options of `Marker` for the rotation of marker icons, see the
 * [marker rotation](#marker-setrotationangle).
 */
export interface MarkerRotationOptions {
    /**
     * Rotation of the icon in degrees, clockwise, e.g.
     * for the heading of a vehicle. On a rotated map, the angle is relative to the screen,
     * or to north with `rotateWithView`. The shadow is not rotated.
     * @default 0
     */
    rotationAngle?: number;
    /**
     * The CSS
     * [`transform-origin`](https://developer.mozilla.org/docs/Web/CSS/transform-origin) to
     * rotate the icon around, e.g. `'center'`. By default the anchor of the icon.
     */
    rotationOrigin?: string;
    /**
     * On a rotated map (see
     * `MaplairMap.setBearing()`), whether the icon rotates with the map (e.g. for arrows
     * pointing in a geographic direction) instead of staying upright.
     * @default false
     */
    rotateWithView?: boolean;
}
/**
 * Methods of `Marker` for the rotation of marker icons, an optional feature: import
 * this module to add the `rotationAngle`, `rotationOrigin` and `rotateWithView` options
 * and `setRotationAngle()`/`setRotationOrigin()` to `Marker` (it is also part of the
 * map rotation, see `MaplairMap.setBearing()`).
 *
 * ```js
 * import 'maplair/marker-rotation';
 *
 * new Marker([47.27, 11.40], {rotationAngle: 45}).addTo(map);
 * ```
 *
 * Inspired by the [Leaflet.RotatedMarker](https://github.com/bbecquet/Leaflet.RotatedMarker) plugin.
 */
export interface MarkerRotationMethods {
    /**
     * Changes the [`rotationAngle`](#markeroptions-rotationangle) of the icon.
     * @group Marker rotation
     * @param {number} angle
     * @returns {this}
     */
    setRotationAngle(angle: number): this;
    /**
     * Changes the [`rotationOrigin`](#markeroptions-rotationorigin) of the icon.
     * @group Marker rotation
     * @param {string} origin
     * @returns {this}
     */
    setRotationOrigin(origin: string): this;
}
export {};
declare module './Marker.js' {
    interface MarkerOptions extends MarkerRotationOptions {
    }
}
declare module './Marker.js' {
    interface Marker extends MarkerRotationMethods {
    }
}
