import {EarthCRS} from './EarthCRS.js';
import {MercatorProjection} from '../projection/MercatorProjection.js';
import {Transformation} from '../../geometry/Transformation.js';
/** @import {Projection} from '../projection/index.js' */

/**
 * Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
 */
export class EPSG3395 extends EarthCRS {
	/** @type {string} */
	static code = 'EPSG:3395';
	/** @type {Projection} */
	static projection = MercatorProjection;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ (() => {
		const scale = 0.5 / (Math.PI * MercatorProjection.R);
		return new Transformation(scale, 0.5, -scale, 0.5);
	})();
}
