import { haversineDistance } from "../LatLng.js";
import { CRS } from "./CRS.js";
// src/geo/crs/EarthCRS.js
/** @import {LatLng} from '../LatLng.js' */
/**
* The base for CRSs that cover the whole earth, such as `EPSG3857` and `EPSG4326`:
* the longitude wraps around at ±180°, the scale doubles on each zoom level, and
* `distance()` returns meters. Extend it with your own `code`, `projection` and
* `transformation`.
*/
var EarthCRS = class extends CRS {
	/**
	* The range around which the longitude axis wraps (none if `undefined`).
	* @type {[number, number]|undefined}
	*/
	static wrapLng = [-180, 180];
	/**
	* Mean Earth Radius in meters, as recommended for use by
	* the International Union of Geodesy and Geophysics,
	* see https://rosettacode.org/wiki/Haversine_formula
	* @type {number}
	*/
	static R = 6371e3;
	/**
	* Returns the distance in meters between two geographical points using the
	* Haversine approximation.
	* @param {LatLng} latlng1
	* @param {LatLng} latlng2
	* @returns {number}
	*/
	static distance(latlng1, latlng2) {
		return haversineDistance(latlng1, latlng2, this.R);
	}
};
export { EarthCRS };

//# sourceMappingURL=EarthCRS.js.map