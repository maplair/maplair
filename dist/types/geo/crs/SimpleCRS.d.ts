import type { LonLat } from '../projection/Projection.LonLat.js';
/** @import {LatLng} from '../LatLng.js' */
/** @import {Projection} from '../projection/index.js' */
/**
 * A simple CRS that maps longitude and latitude into `x` and `y` directly.
 * May be used for maps of flat surfaces (e.g. game maps). Note that the `y`
 * axis should still be inverted (going from bottom to top). `distance()` returns
 * simple euclidean distance.
 */
export class SimpleCRS extends CRS {
    /** @type {Projection} */
    static projection: Projection;
    /** @type {Transformation} */
    static transformation: Transformation;
    /**
     * Returns the euclidean distance between two points.
     * @param {LatLng} latlng1
     * @param {LatLng} latlng2
     * @returns {number}
     */
    static distance(latlng1: LatLng, latlng2: LatLng): number;
}
import { CRS } from './CRS.js';
import type { Projection } from '../projection/index.js';
import { Transformation } from '../../geometry/Transformation.js';
import type { LatLng } from '../LatLng.js';
