import * as Util from '../core/Util.js';
import {EarthCRS} from './crs/EarthCRS.js';
import {LatLngBounds} from './LatLngBounds.js';

// a coordinate in decimal degrees, with an optional degree sign
const coordinate = String.raw`([+-]?\d+(?:\.\d+)?)\s*°?`,
separator = String.raw`(?:\s*[,;]\s*|\s+)`,
// `47.27 11.4`, `47.27, 11.4`, `+47.27;+11.4`
plainRe = new RegExp(`^${coordinate}${separator}${coordinate}$`),
// `N47.27 E11.4`, `N 47.27°, E 11.4°`
prefixRe = new RegExp(`^([NSEW])\\s*${coordinate}${separator}([NSEW])\\s*${coordinate}$`, 'i'),
// `47.27N 11.4E`, `47.27° N, 11.4° E`
suffixRe = new RegExp(`^${coordinate}\\s*([NSEW])${separator}${coordinate}\\s*([NSEW])$`, 'i'),
hemisphereRe = /^[NSEW]$/i,
// `geo:47.27,11.4`, `geo:47.27,11.4,500;u=35`, `geo:47.27,11.4?z=13` (RFC 5870)
geoUriRe = /^geo:([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)(?:,([+-]?\d+(?:\.\d+)?))?(?:[;?].*)?$/i;

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
export class LatLng {
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
		const valid = LatLng.validate(lat, lng, alt);
		if (!valid) {
			throw new Error(`Invalid LatLng object: (${lat}, ${lng})`);
		}

		let _lat, _lng, _alt;
		if (lat instanceof LatLng) {
			_lat = lat.lat;
			_lng = lat.lng;
			_alt = lat.alt;
		} else if (Array.isArray(lat) && typeof lat[0] !== 'object') {
			if (lat.length === 3) {
				_lat = lat[0];
				_lng = lat[1];
				_alt = lat[2];
			} else if (lat.length === 2) {
				_lat = lat[0];
				_lng = lat[1];
			}
		} else if (typeof lat === 'object' && 'lat' in lat) {
			_lat = lat.lat;
			_lng = 'lng' in lat ? lat.lng : lat.lon;
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

		if (_alt !== undefined) {
			/**
			 * Altitude in meters (optional).
			 * @type {number|undefined}
			 */
			this.alt = +_alt;
		}
	}

	/**
	 * Returns the given `LatLng` object as it is, or else a new `LatLng` object created
	 * from the given arguments (the same as of the constructor) — unlike the
	 * constructor, which always creates a new object.
	 *
	 * @example
	 * ```js
	 * LatLng.from(latlng) === latlng; // true
	 * LatLng.from([50.5, 30.5]); // LatLng(50.5, 30.5)
	 * ```
	 * @param {number|LatLngExpression} lat Latitude in degrees, or the coordinates.
	 * @param {number} [lng] Longitude in degrees.
	 * @param {number} [alt] Altitude in meters.
	 * @returns {LatLng}
	 */
	static from(lat, lng, alt) {
		return lat instanceof LatLng ? lat : new LatLng(lat, lng, alt);
	}

	/**
	 * Returns `true` if the LatLng object can be properly initialized with the given
	 * arguments (the same as of the constructor).
	 * @param {any} lat
	 * @param {any} [lng]
	 * @param {any} [alt]
	 * @returns {boolean}
	 */
	// eslint-disable-next-line no-unused-vars
	static validate(lat, lng, alt) {
		if (lat instanceof LatLng || (typeof lat === 'object' && lat !== null && 'lat' in lat)) {
			return true;
		} else if (lat && Array.isArray(lat) && typeof lat[0] !== 'object') {
			if (lat.length === 3 || lat.length === 2) {
				return true;
			}
			return false;
		} else if ((lat || lat === 0) && (lng || lng === 0)) {
			return true;
		}
		return false;
	}

	/**
	 * Parses coordinates in decimal degrees: a pair of numbers (latitude first), e.g.
	 * `'47.27, 11.4'` or `'47.27 11.4'`, with the hemispheres before or after the numbers,
	 * e.g. `'N 47.27, E 11.4'`, `'47.27° S 11.4° W'` (also longitude first), or a
	 * [geo URI](https://www.rfc-editor.org/rfc/rfc5870) like `'geo:47.27,11.4'` (with an
	 * optional altitude). Returns `null` for other text and out-of-range coordinates.
	 *
	 * @example
	 * ```js
	 * LatLng.parse('47.2692 N, 11.4041 E'); // LatLng(47.2692, 11.4041)
	 * LatLng.parse('geo:47.2692,11.4041?z=13'); // LatLng(47.2692, 11.4041)
	 * ```
	 * @param {string} text
	 * @returns {LatLng|null}
	 */
	static parse(text) {
		text = text.trim();
		let lat, lng, alt, match;
		if ((match = geoUriRe.exec(text))) {
			[lat, lng, alt] = match.slice(1).map(n => (n === undefined ? undefined : Number(n)));
		} else if ((match = plainRe.exec(text))) {
			[lat, lng] = match.slice(1).map(Number);
		} else if ((match = prefixRe.exec(text) ?? suffixRe.exec(text))) {
			// the hemisphere and the number of both coordinates
			const prefixed = hemisphereRe.test(match[1]),
			coords = prefixed ?
				[[match[1], match[2]], [match[3], match[4]]] :
				[[match[2], match[1]], [match[4], match[3]]];
			for (const [hemisphere, number] of coords) {
				const h = hemisphere.toUpperCase(),
				value = Math.abs(Number(number)) * (h === 'S' || h === 'W' ? -1 : 1);
				if (h === 'N' || h === 'S') {
					if (lat !== undefined) { return null; }
					lat = value;
				} else {
					if (lng !== undefined) { return null; }
					lng = value;
				}
			}
		}
		if (lat === undefined || Math.abs(lat) > 90 || Math.abs(lng) > 180) { return null; }
		return new LatLng(lat, lng, alt);
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
		if (!obj) { return false; }

		obj = LatLng.from(obj);

		const margin = Math.max(
			Math.abs(this.lat - obj.lat),
			Math.abs(this.lng - obj.lng));

		return margin <= (maxMargin ?? 1.0E-9);
	}

	/**
	 * Returns a string representation of the point (for debugging purposes).
	 * @param {number|false} [precision]
	 * @returns {string}
	 */
	toString(precision) {
		return `LatLng(${Util.formatNum(this.lat, precision)}, ${Util.formatNum(this.lng, precision)})`;
	}

	/**
	 * Returns the distance (in meters) to the given `LatLng` calculated using the
	 * [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula).
	 * @param {LatLngExpression} other
	 * @returns {number}
	 */
	distanceTo(other) {
		return EarthCRS.distance(this, LatLng.from(other));
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
		const latAccuracy = 180 * sizeInMeters / 40075017,
		lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

		return new LatLngBounds(
			[this.lat - latAccuracy, this.lng - lngAccuracy],
			[this.lat + latAccuracy, this.lng + lngAccuracy]);
	}

};
