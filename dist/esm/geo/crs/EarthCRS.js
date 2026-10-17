import { CRS } from "./CRS.js";
//#region src/geo/crs/EarthCRS.js
/** @import {LatLng} from '../LatLng.js' */
/**
* Serves as the base for CRS that are global such that they cover the earth.
* Can only be used as the base for other CRS and cannot be used directly,
* since it does not have a `code`, `projection` or `transformation`. `distance()` returns
* meters.
*/
var EarthCRS = class extends CRS {
	/**
	* The range around which the longitude axis wraps.
	* @type {[number, number]}
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
		const rad = Math.PI / 180, lat1 = latlng1.lat * rad, lat2 = latlng2.lat * rad, sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2), sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2), a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon, c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return this.R * c;
	}
};
//#endregion
export { EarthCRS };

//# sourceMappingURL=EarthCRS.js.map