/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {Bounds} from './Bounds.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/**
 * Dramatically reduces the number of points in a polyline while retaining
 * its shape and returns a new array of simplified points, using the
 * [Ramer-Douglas-Peucker algorithm](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm).
 * Used for a huge performance boost when processing/displaying Maplair polylines for
 * each zoom level and also reducing visual noise. tolerance affects the amount of
 * simplification (lesser value means higher quality but slower and with more points).
 * Also released as a separated micro-library
 * [Simplify.js](https://mourner.github.io/simplify-js/).
 * @param {Point[]} points
 * @param {number} tolerance
 * @returns {Point[]}
 */
export function simplify(points: Point[], tolerance: number): Point[];
/**
 * Returns the distance between point `p` and segment `p1` to `p2`.
 * @param {Point} p
 * @param {Point} p1
 * @param {Point} p2
 * @returns {number}
 */
export function pointToSegmentDistance(p: Point, p1: Point, p2: Point): number;
/**
 * Returns the closest point from a point `p` on a segment `p1` to `p2`.
 * @param {Point} p
 * @param {Point} p1
 * @param {Point} p2
 * @returns {Point}
 */
export function closestPointOnSegment(p: Point, p1: Point, p2: Point): Point;
/**
 * Clips the segment a to b by rectangular bounds with the
 * [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
 * (modifying the segment points directly!). Used by Maplair to only show polyline
 * points that are on the screen or near, increasing performance. Returns `false` if
 * the segment is outside of the bounds.
 * @param {Point} a
 * @param {Point} b
 * @param {Bounds} bounds
 * @param {boolean} [useLastCode]
 * @param {boolean} [round]
 * @returns {[Point, Point]|false}
 */
export function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: boolean, round?: boolean): [Point, Point] | false;
/**
 * Returns true if `latlngs` is a flat array, false is nested.
 * @param {LatLngExpression[]|LatLngExpression[][]} latlngs
 * @returns {boolean}
 */
export function isFlat(latlngs: LatLngExpression[] | LatLngExpression[][]): boolean;
/**
 * Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the passed
 * LatLngs (first ring) from a polyline.
 * @param {LatLngExpression[]|LatLngExpression[][]} latlngs
 * @param {typeof CRS} crs
 * @returns {LatLng}
 */
export function polylineCenter(latlngs: LatLngExpression[] | LatLngExpression[][], crs: typeof CRS): LatLng;
import { Point } from './Point.js';
import type { Bounds } from './Bounds.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import type { CRS } from '../geo/crs/CRS.js';
import { LatLng } from '../geo/LatLng.js';
