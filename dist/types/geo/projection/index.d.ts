export { LonLat } from "./Projection.LonLat.js";
export { Mercator } from "./Projection.Mercator.js";
export { SphericalMercator } from "./Projection.SphericalMercator.js";
/**
 * An object with methods for projecting geographical coordinates of the world onto
 * a flat surface (and back). See [Map projection](https://en.wikipedia.org/wiki/Map_projection).
 *
 * Maplair comes with a set of already defined projections out of the box: `LonLat`,
 * `Mercator` and `SphericalMercator` (in the `Projection` namespace).
 *
 * Note that the projection instances do not inherit from Maplair's `Class` object,
 * and can't be instantiated. Also, new classes can't inherit from them,
 * and methods can't be added to them with the `include` function.
 */
export interface Projection {
    /**
     * The bounds (specified in CRS units) where the projection is
     * valid.
     */
    bounds: Bounds;
    /**
     * Projects geographical coordinates into
     * a 2D point. Only accepts actual `LatLng` instances, not arrays.
     */
    project: (latlng: LatLng) => Point;
    /**
     * The inverse of `project`. Projects a
     * 2D point into a geographical location. Only accepts actual `Point` instances, not
     * arrays.
     */
    unproject: (point: Point) => LatLng;
}
import type { Bounds } from '../../geometry/Bounds.js';
import type { LatLng } from '../LatLng.js';
import type { Point } from '../../geometry/Point.js';
