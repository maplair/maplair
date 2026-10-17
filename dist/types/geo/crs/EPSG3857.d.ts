import type { SphericalMercator } from '../projection/Projection.SphericalMercator.js';
/** @import {Projection} from '../projection/index.js' */
/**
 * The most common CRS for online maps, used by almost all free and commercial
 * tile providers. Uses Spherical Mercator projection. Set in by default in
 * Map's `crs` option.
 */
export class EPSG3857 extends EarthCRS {
    /** @type {string} */
    static code: string;
    /** @type {Projection} */
    static projection: Projection;
    /** @type {Transformation} */
    static transformation: Transformation;
}
/**
 * The same as `EPSG3857`, with its former unofficial code `EPSG:900913`.
 */
export class EPSG900913 extends EPSG3857 {
}
import { EarthCRS } from './EarthCRS.js';
import type { Projection } from '../projection/index.js';
import { Transformation } from '../../geometry/Transformation.js';
