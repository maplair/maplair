import type { LatLngBounds } from '../../geo/LatLngBounds.js';
/** @import {LatLngBoundsExpression} from '../../geo/LatLngBounds.js' */
/** @import {PolygonOptions} from './Polygon.js' */
/**
 * A class for drawing rectangle overlays on a map. Extends `Polygon`.
 *
 * @example
 * ```js
 * // define rectangle geographical bounds
 * const bounds = [[54.559322, -5.767822], [56.1210604, -3.021240]];
 *
 * // create an orange rectangle
 * new Rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
 *
 * // zoom the map to the rectangle bounds
 * map.fitBounds(bounds);
 * ```
 */
export class Rectangle extends Polygon {
    /**
     * Instantiates a rectangle object given the geographical bounds, and an optional
     * options object.
     * @param {LatLngBoundsExpression} latLngBounds
     * @param {PolygonOptions} [options]
     */
    constructor(latLngBounds: LatLngBoundsExpression, options?: PolygonOptions);
    /**
     * Redraws the rectangle with the passed bounds.
     * @param {LatLngBoundsExpression} latLngBounds
     * @returns {this}
     */
    setBounds(latLngBounds: LatLngBoundsExpression): this;
}
import { Polygon } from './Polygon.js';
import type { LatLngBoundsExpression } from '../../geo/LatLngBounds.js';
import type { PolygonOptions } from './Polygon.js';
