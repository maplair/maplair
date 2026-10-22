import type { EarthCRS } from '../../geo/crs/EarthCRS.js';
import type { CircleMarkerOptions } from './CircleMarker.js';
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {CircleMarkerOptions} from './CircleMarker.js' */
/**
 * Options of `Circle`.
 * @typedef {object} CircleOptions
 * @property {number} [radius] Radius of the circle, in meters.
 * @extends CircleMarkerOptions
 */
/**
 * A class for drawing circle overlays on a map with radius specified in meters.
 * Extends `CircleMarker`, its `setRadius()` and `getRadius()` use meters.
 *
 * It's an approximation and starts to diverge from a real circle closer to poles
 * (due to projection distortion).
 *
 * @example
 * ```js
 * new Circle([50.5, 30.5], {radius: 200}).addTo(map);
 * ```
 */
export class Circle extends CircleMarker {
    /**
     * Instantiates a circle object given a geographical point, and an options object
     * which contains the circle radius.
     * @param {LatLngExpression} latlng
     * @param {CircleOptions} [options]
     */
    constructor(latlng: LatLngExpression, options?: CircleOptions);
    /**
     * Returns the `LatLngBounds` of the path.
     * @returns {LatLngBounds}
     */
    getBounds(): LatLngBounds;
    /** The options of the Circle, see [the options](#circleoptions). */
    options: CircleOptions;
}
/**
 * Options of `Circle`.
 */
export interface CircleOptions extends CircleMarkerOptions {
    /**
     * Radius of the circle, in meters.
     */
    radius?: number;
}
import { CircleMarker } from './CircleMarker.js';
import { LatLngBounds } from '../../geo/LatLngBounds.js';
import type { LatLngExpression } from '../../geo/LatLng.js';
