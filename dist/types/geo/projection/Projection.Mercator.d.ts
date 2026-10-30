import type { LatLng } from '../LatLng.js';
import type { Bounds } from '../../geometry/Bounds.js';
import type { Point } from '../../geometry/Point.js';
/**
 * Elliptical Mercator projection — more complex than Spherical Mercator. Assumes that
 * Earth is an ellipsoid. Used by the EPSG:3395 CRS.
 * @type {Projection & {R: number, R_MINOR: number}}
 */
export const Mercator: Projection & {
    R: number;
    R_MINOR: number;
};
import type { Projection } from './index.js';
