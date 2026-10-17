import { formatNum } from "../core/Util.js";
import { LatLngBounds } from "./LatLngBounds.js";
import { EarthCRS } from "./crs/EarthCRS.js";
//#region src/geo/LatLng.js
/**
* A geographical point: a `LatLng`, an array of the form `[lat, lng]` or
* `[lat, lng, alt]`, or a plain object of the form `{lat, lng}` or `{lat, lng, alt}`
* (`lon` can be used in place of `lng`). Accepted by all Maplair methods which accept
* `LatLng` objects (unless noted otherwise). Plain arrays (`number[]`) are accepted
* for JavaScript, where array literals in variables are no tuples.
* @typedef {LatLng|[number, number]|[number, number, number]|number[]|{lat: number, lng: number, alt?: number}|{lat: number, lon: number, alt?: number}} LatLngExpression
*/
/**
* Represents a geographical point with a certain latitude and longitude.
*
* @example
* ```js
* const latlng = new LatLng(50.5, 30.5);
* ```
*
* All Maplair methods that accept LatLng objects also accept them in a simple Array
* form and simple object form (unless noted otherwise), so these lines are equivalent:
*
* ```js
* map.panTo([50, 30]);
* map.panTo({lat: 50, lng: 30});
* map.panTo({lat: 50, lon: 30});
* map.panTo(new LatLng(50, 30));
* ```
*
* Note that `LatLng` does not inherit from Maplair's `Class` object,
* which means new classes can't inherit from it, and new methods
* can't be added to it with the `include` function.
*/
var LatLng = class LatLng {
	/**
	* Creates an object representing a geographical point with the given latitude and
	* longitude (and optionally altitude). Alternatively, expects a `LatLng` object, an
	* array of the form `[lat, lng]` or `[lat, lng, alt]`, or a plain object of the form
	* `{lat, lng}` or `{lat, lng, alt}` (`lon` can be used in place of `lng`) instead.
	* @param {number|LatLngExpression} lat Latitude in degrees, or the coordinates.
	* @param {number} [lng] Longitude in degrees.
	* @param {number} [alt] Altitude in meters.
	*/
	constructor(lat, lng, alt) {
		if (!LatLng.validate(lat, lng, alt)) throw new Error(`Invalid LatLng object: (${lat}, ${lng})`);
		let _lat, _lng, _alt;
		if (lat instanceof LatLng) {
			_lat = lat.lat;
			_lng = lat.lng;
			_alt = lat.alt;
		} else if (Array.isArray(lat) && typeof lat[0] !== "object") {
			if (lat.length === 3) {
				_lat = lat[0];
				_lng = lat[1];
				_alt = lat[2];
			} else if (lat.length === 2) {
				_lat = lat[0];
				_lng = lat[1];
			}
		} else if (typeof lat === "object" && "lat" in lat) {
			_lat = lat.lat;
			_lng = "lng" in lat ? lat.lng : lat.lon;
			_alt = lat.alt;
		} else {
			_lat = lat;
			_lng = lng;
			_alt = alt;
		}
		/**
		* Latitude in degrees.
		* @type {number}
		*/
		this.lat = +_lat;
		/**
		* Longitude in degrees.
		* @type {number}
		*/
		this.lng = +_lng;
		if (_alt !== void 0)
 /**
		* Altitude in meters (optional).
		* @type {number|undefined}
		*/
		this.alt = +_alt;
	}
	/**
	* Returns `true` if the LatLng object can be properly initialized with the given
	* arguments (the same as of the constructor).
	* @param {any} lat
	* @param {any} [lng]
	* @param {any} [alt]
	* @returns {boolean}
	*/
	static validate(lat, lng, alt) {
		if (lat instanceof LatLng || typeof lat === "object" && lat !== null && "lat" in lat) return true;
		else if (lat && Array.isArray(lat) && typeof lat[0] !== "object") {
			if (lat.length === 3 || lat.length === 2) return true;
			return false;
		} else if ((lat || lat === 0) && (lng || lng === 0)) return true;
		return false;
	}
	/**
	* Returns `true` if the given `LatLng` point is at the same position (within a small
	* margin of error). The margin of error can be overridden by setting `maxMargin` to
	* a small number.
	* @param {LatLngExpression} obj
	* @param {number} [maxMargin]
	* @returns {boolean}
	*/
	equals(obj, maxMargin) {
		if (!obj) return false;
		obj = new LatLng(obj);
		return Math.max(Math.abs(this.lat - obj.lat), Math.abs(this.lng - obj.lng)) <= (maxMargin ?? 1e-9);
	}
	/**
	* Returns a string representation of the point (for debugging purposes).
	* @param {number|false} [precision]
	* @returns {string}
	*/
	toString(precision) {
		return `LatLng(${formatNum(this.lat, precision)}, ${formatNum(this.lng, precision)})`;
	}
	/**
	* Returns the distance (in meters) to the given `LatLng` calculated using the
	* [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula).
	* @param {LatLngExpression} other
	* @returns {number}
	*/
	distanceTo(other) {
		return EarthCRS.distance(this, new LatLng(other));
	}
	/**
	* Returns a new `LatLng` object with the longitude wrapped so it's always between
	* -180 and +180 degrees.
	* @returns {LatLng}
	*/
	wrap() {
		return EarthCRS.wrapLatLng(this);
	}
	/**
	* Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2`
	* meters apart from the `LatLng`.
	* @param {number} sizeInMeters
	* @returns {LatLngBounds}
	*/
	toBounds(sizeInMeters) {
		const latAccuracy = 180 * sizeInMeters / 40075017, lngAccuracy = latAccuracy / Math.cos(Math.PI / 180 * this.lat);
		return new LatLngBounds([this.lat - latAccuracy, this.lng - lngAccuracy], [this.lat + latAccuracy, this.lng + lngAccuracy]);
	}
};
//#endregion
export { LatLng };

//# sourceMappingURL=LatLng.js.map