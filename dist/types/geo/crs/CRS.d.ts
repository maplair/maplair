/** @import {LatLngExpression} from '../LatLng.js' */
/** @import {LatLngBoundsExpression} from '../LatLngBounds.js' */
/** @import {Point} from '../../geometry/Point.js' */
/** @import {Transformation} from '../../geometry/Transformation.js' */
/** @import {Projection} from '../projection/index.js' */
/**
 * Object that defines coordinate reference systems for projecting
 * geographical points into pixel (screen) coordinates and back (and to
 * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service)
 * services). See
 * [spatial reference system](https://en.wikipedia.org/wiki/Spatial_reference_system).
 *
 * Maplair defines the most usual CRSs by default. If you want to use a
 * CRS not defined by default, extend `CRS` with a projection of your own, e.g.
 * based on [Proj4js](https://github.com/proj4js/proj4js) (the Leaflet plugin
 * [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) doesn't work with Maplair).
 *
 * The CRSs are classes with static properties and methods only; they are not
 * instantiated, the class itself is passed as the CRS, e.g. to the `crs` option of the
 * map. Maplair's CRSs extend `CRS` (`EarthCRS` for the global ones).
 *
 * Besides the properties and methods below, a CRS may define:
 *
 * * `code: string`: Standard code name of the CRS passed into WMS services (e.g.
 *   `'EPSG:3857'`).
 * * `wrapLng: [number, number]`: An array of two numbers defining whether the longitude
 *   (horizontal) coordinate axis wraps around a given range and how. Defaults to
 *   `[-180, 180]` in most geographical CRSs. If `undefined`, the longitude axis does
 *   not wrap around.
 * * `wrapLat: [number, number]`: Like `wrapLng`, but for the latitude (vertical) axis.
 * * `distance(latlng1: LatLng, latlng2: LatLng): number`: Returns the distance between
 *   two geographical coordinates.
 */
export class CRS {
    /**
     * The projection of the CRS.
     * @type {Projection|undefined}
     */
    static projection: Projection | undefined;
    /**
     * The transformation of projected coordinates into pixel coordinates at zoom 0.
     * @type {Transformation|undefined}
     */
    static transformation: Transformation | undefined;
    /**
     * Projects geographical coordinates into pixel coordinates for a given zoom.
     * @param {LatLngExpression} latlng
     * @param {number} zoom
     * @returns {Point}
     */
    static latLngToPoint(latlng: LatLngExpression, zoom: number): Point;
    /**
     * The inverse of `latLngToPoint`. Projects pixel coordinates on a given
     * zoom into geographical coordinates.
     * @param {Point} point
     * @param {number} zoom
     * @returns {LatLng}
     */
    static pointToLatLng(point: Point, zoom: number): LatLng;
    /**
     * Projects geographical coordinates into coordinates in units accepted for
     * this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
     * @param {LatLngExpression} latlng
     * @returns {Point}
     */
    static project(latlng: LatLngExpression): Point;
    /**
     * Given a projected coordinate returns the corresponding LatLng.
     * The inverse of `project`.
     * @param {Point} point
     * @returns {LatLng}
     */
    static unproject(point: Point): LatLng;
    /**
     * Returns the scale used when transforming projected coordinates into
     * pixel coordinates for a particular zoom. For example, it returns
     * `256 * 2^zoom` for Mercator-based CRS.
     * @param {number} zoom
     * @returns {number}
     */
    static scale(zoom: number): number;
    /**
     * Inverse of `scale()`, returns the zoom level corresponding to a scale
     * factor of `scale`.
     * @param {number} scale
     * @returns {number}
     */
    static zoom(scale: number): number;
    /**
     * Returns the projection's bounds scaled and transformed for the provided `zoom`
     * (`null` if the CRS is `infinite`).
     * @param {number} zoom
     * @returns {Bounds|null}
     */
    static getProjectedBounds(zoom: number): Bounds | null;
    /**
     * If true, the coordinate space will be unbounded (infinite in both axes).
     * @type {boolean}
     */
    static infinite: boolean;
    /**
     * Returns a `LatLng` where lat and lng has been wrapped according to the
     * CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
     * @param {LatLngExpression} latlng
     * @returns {LatLng}
     */
    static wrapLatLng(latlng: LatLngExpression): LatLng;
    /**
     * Returns a `LatLngBounds` with the same size as the given one, ensuring
     * that its center is within the CRS's bounds.
     * @param {LatLngBoundsExpression} bounds
     * @returns {LatLngBounds}
     */
    static wrapLatLngBounds(bounds: LatLngBoundsExpression): LatLngBounds;
}
import type { Projection } from '../projection/index.js';
import type { Transformation } from '../../geometry/Transformation.js';
import type { LatLngExpression } from '../LatLng.js';
import type { Point } from '../../geometry/Point.js';
import { LatLng } from '../LatLng.js';
import { Bounds } from '../../geometry/Bounds.js';
import type { LatLngBoundsExpression } from '../LatLngBounds.js';
import { LatLngBounds } from '../LatLngBounds.js';
