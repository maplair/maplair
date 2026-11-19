import type { latLngsToCoords, getFeature } from '../GeoJSONUtil.js';
import type { PathOptions } from './Path.js';
/** @import {Feature} from 'geojson' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/** @import {PathOptions} from './Path.js' */
/**
 * Options of `Polyline`.
 * @typedef {object} PolylineOptions
 * @property {number} [smoothFactor=0.5] How much to simplify the polyline on each zoom
 * level (Douglas–Peucker epsilon, in pixels). Higher values mean faster rendering but
 * less accuracy; lower values mean more accuracy but slower rendering.
 * @property {boolean} [noClip=false] Disable polyline clipping.
 * @extends PathOptions
 */
/**
 * A class for drawing polyline overlays on a map. Extends `Path`.
 *
 * @example
 * ```js
 * // create a red polyline from an array of LatLng points
 * const latlngs = [
 * 	[45.51, -122.68],
 * 	[37.77, -122.43],
 * 	[34.04, -118.2]
 * ];
 *
 * const polyline = new Polyline(latlngs, {color: 'red'}).addTo(map);
 *
 * // zoom the map to the polyline
 * map.fitBounds(polyline.getBounds());
 * ```
 *
 * You can also pass a multi-dimensional array to represent a `MultiPolyline` shape:
 *
 * ```js
 * // create a red polyline from an array of arrays of LatLng points
 * const latlngs = [
 * 	[[45.51, -122.68],
 * 	 [37.77, -122.43],
 * 	 [34.04, -118.2]],
 * 	[[40.78, -73.91],
 * 	 [41.83, -87.62],
 * 	 [32.76, -96.72]]
 * ];
 * ```
 */
export class Polyline extends Path {
    static defaultOptions: Partial<PolylineOptions>;
    /**
     * Instantiates a polyline object given an array of geographical points and
     * optionally an options object. You can create a `Polyline` object with
     * multiple separate lines (`MultiPolyline`) by passing an array of arrays
     * of geographic points.
     * @param {LatLngExpression[]|LatLngExpression[][]|LatLngExpression[][][]} latlngs
     * @param {PolylineOptions} [options]
     */
    constructor(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options?: PolylineOptions);
    /**
     * Returns an array of the points in the path, or nested arrays of points in case of
     * multi-polyline.
     * @returns {LatLng[]|LatLng[][]|LatLng[][][]}
     */
    getLatLngs(): LatLng[] | LatLng[][] | LatLng[][][];
    /**
     * Replaces all the points in the polyline with the given array of geographical points.
     * @param {LatLngExpression[]|LatLngExpression[][]|LatLngExpression[][][]} latlngs
     * @returns {this}
     */
    setLatLngs(latlngs: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]): this;
    /**
     * Returns `true` if the Polyline has no LatLngs.
     * @returns {boolean}
     */
    isEmpty(): boolean;
    /**
     * Returns the point closest to `p` on the Polyline, with its `distance` to `p` in
     * pixels, or `null` if the polyline is not visible.
     * @param {PointExpression} p
     * @returns {(Point & {distance: number})|null}
     */
    closestLayerPoint(p: PointExpression): (Point & {
        distance: number;
    }) | null;
    /**
     * Returns the center ([centroid](https://en.wikipedia.org/wiki/Centroid)) of the polyline.
     * @returns {LatLng}
     */
    getCenter(): LatLng;
    /**
     * Returns the `LatLngBounds` of the path.
     * @returns {LatLngBounds}
     */
    getBounds(): LatLngBounds;
    /**
     * Adds a given point to the polyline. By default, adds to the first ring of
     * the polyline in case of a multi-polyline, but can be overridden by passing
     * a specific ring as a LatLng array (that you can earlier access with
     * [`getLatLngs`](#polyline-getlatlngs)).
     * @param {LatLngExpression} latlng
     * @param {LatLng[]} [latlngs]
     * @returns {this}
     */
    addLatLng(latlng: LatLngExpression, latlngs?: LatLng[]): this;
    /**
     * Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
     * given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
     * representation of the polyline (as a GeoJSON `LineString` or `MultiLineString`
     * Feature).
     * @param {number|false} [precision]
     * @returns {Feature}
     */
    toGeoJSON(precision?: number | false): Feature;
    /** The options of the Polyline, see [the options](#polylineoptions). */
    options: PolylineOptions;
}
/**
 * Options of `Polyline`.
 */
export interface PolylineOptions extends PathOptions {
    /**
     * How much to simplify the polyline on each zoom
     * level (Douglas–Peucker epsilon, in pixels). Higher values mean faster rendering but
     * less accuracy; lower values mean more accuracy but slower rendering.
     * @default 0.5
     */
    smoothFactor?: number;
    /**
     * Disable polyline clipping.
     * @default false
     */
    noClip?: boolean;
}
import { Path } from './Path.js';
import { LatLng } from '../../geo/LatLng.js';
import type { LatLngExpression } from '../../geo/LatLng.js';
import type { PointExpression } from '../../geometry/Point.js';
import { Point } from '../../geometry/Point.js';
import { LatLngBounds } from '../../geo/LatLngBounds.js';
import { Bounds } from '../../geometry/Bounds.js';
import type { Feature } from 'geojson';
