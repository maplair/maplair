import type { Mercator } from '../projection/Projection.Mercator.js';
/** @import {Projection} from '../projection/index.js' */
/**
 * Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
 */
export class EPSG3395 extends EarthCRS {
    /** @type {string} */
    static code: string;
    /** @type {Projection} */
    static projection: Projection;
    /** @type {Transformation} */
    static transformation: Transformation;
}
import { EarthCRS } from './EarthCRS.js';
import type { Projection } from '../projection/index.js';
import { Transformation } from '../../geometry/Transformation.js';
