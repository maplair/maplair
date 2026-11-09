/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {Bounds} from './Bounds.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/**
 * Clips the polygon geometry defined by the given `points` by the given bounds (using
 * the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
 * Used by Maplair to only show polygon points that are on the screen or near, increasing
 * performance. Note that polygon points needs different algorithm for clipping
 * than polyline, so there's a separate method for it.
 * @param {Point[]} points
 * @param {Bounds} bounds
 * @param {boolean} [round]
 * @returns {Point[]}
 */
export function clipPolygon(points: Point[], bounds: Bounds, round?: boolean): Point[];
/**
 * Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the passed
 * LatLngs (first ring) from a polygon.
 * @param {LatLngExpression[]|LatLngExpression[][]} latlngs
 * @param {typeof CRS} crs
 * @returns {LatLng}
 */
export function polygonCenter(latlngs: LatLngExpression[] | LatLngExpression[][], crs: typeof CRS): LatLng;
/**
 * Returns the 'center of mass' of the passed LatLngs.
 * @param {LatLngExpression[]} coords
 * @returns {LatLng}
 */
export function centroid(coords: LatLngExpression[]): LatLng;
import { Point } from './Point.js';
import type { Bounds } from './Bounds.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import type { CRS } from '../geo/crs/CRS.js';
import { LatLng } from '../geo/LatLng.js';
