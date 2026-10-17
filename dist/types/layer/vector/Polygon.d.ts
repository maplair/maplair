import type { LatLng } from '../../geo/LatLng.js';
import type { Point } from '../../geometry/Point.js';
import type { Bounds } from '../../geometry/Bounds.js';
import type { PolylineOptions } from './Polyline.js';
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {PolylineOptions} from './Polyline.js' */
/**
 * Options of `Polygon`.
 * @typedef {object} PolygonOptions
 * @property {boolean} [fill=true] Whether to fill the polygon with color.
 * @extends PolylineOptions
 */
/**
 * A class for drawing polygon overlays on a map. Extends `Polyline`.
 *
 * Note that points you pass when creating a polygon shouldn't have an additional last
 * point equal to the first one — it's better to filter out such points.
 *
 * @example
 * ```js
 * // create a red polygon from an array of LatLng points
 * const latlngs = [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]];
 *
 * const polygon = new Polygon(latlngs, {color: 'red'}).addTo(map);
 *
 * // zoom the map to the polygon
 * map.fitBounds(polygon.getBounds());
 * ```
 *
 * You can also pass an array of arrays of latlngs, with the first array representing
 * the outer shape and the other arrays representing holes in the outer shape:
 *
 * ```js
 * const latlngs = [
 *   [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
 *   [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
 * ];
 * ```
 *
 * Additionally, you can pass a multi-dimensional array to represent a MultiPolygon shape.
 *
 * ```js
 * const latlngs = [
 *   [ // first polygon
 *     [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
 *     [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
 *   ],
 *   [ // second polygon
 *     [[41, -111.03],[45, -111.04],[45, -104.05],[41, -104.05]]
 *   ]
 * ];
 * ```
 */
export class Polygon extends Polyline {
    /**
     * Instantiates a polygon object given an array of geographical points (or arrays
     * of them for holes and multi-polygons) and optionally an options object.
     * @overload
     * @param {LatLngExpression[]|LatLngExpression[][]|LatLngExpression[][][]} latlngs
     * @param {PolygonOptions} [options]
     */
    constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolygonOptions | undefined);
    /** The options of the Polygon, see [the options](#polygonoptions). */
    options: PolygonOptions;
}
/**
 * Options of `Polygon`.
 */
export interface PolygonOptions extends PolylineOptions {
    /**
     * Whether to fill the polygon with color.
     * @default true
     */
    fill?: boolean;
}
import { Polyline } from './Polyline.js';
import type { LatLngExpression } from '../../geo/LatLng.js';
