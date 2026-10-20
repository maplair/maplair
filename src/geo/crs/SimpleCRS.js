import {CRS} from './CRS.js';
import {LonLat} from '../projection/Projection.LonLat.js';
import {Transformation} from '../../geometry/Transformation.js';
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
	static projection = LonLat;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ new Transformation(1, 0, -1, 0);

	/**
	 * Returns `2^zoom`.
	 * @param {number} zoom
	 * @returns {number}
	 */
	static scale(zoom) {
		return 2 ** zoom;
	}

	/**
	 * Inverse of `scale()`.
	 * @param {number} scale
	 * @returns {number}
	 */
	static zoom(scale) {
		return Math.log(scale) / Math.LN2;
	}

	/**
	 * Returns the euclidean distance between two points.
	 * @param {LatLng} latlng1
	 * @param {LatLng} latlng2
	 * @returns {number}
	 */
	static distance(latlng1, latlng2) {
		const dx = latlng2.lng - latlng1.lng,
		dy = latlng2.lat - latlng1.lat;

		return Math.sqrt(dx * dx + dy * dy);
	}

	/** @type {boolean} */
	static infinite = true;
}
