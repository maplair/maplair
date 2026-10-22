import type { LatLng } from '../LatLng.js';
import type { Bounds } from '../../geometry/Bounds.js';
import type { Point } from '../../geometry/Point.js';
/**
 * Spherical Mercator projection — the most common projection for online maps,
 * used by almost all free and commercial tile providers. Assumes that Earth is
 * a sphere. Used by the `EPSG:3857` CRS.
 * @type {Projection & {R: number, MAX_LATITUDE: number}}
 */
export const SphericalMercator: Projection & {
    R: number;
    MAX_LATITUDE: number;
};
import type { Projection } from './index.js';
