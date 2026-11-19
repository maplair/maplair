/**
 * The great-circle distance on a sphere of radius `R`, shared with `EarthCRS.distance()`.
 * @param {LatLng} latlng1
 * @param {LatLng} latlng2
 * @param {number} R
 * @returns {number}
 */
export function haversineDistance(latlng1: LatLng, latlng2: LatLng, R: number): number;
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
    static from(lat: number | LatLngExpression, lng?: number, alt?: number): LatLng;
    /**
     * Returns `true` if the LatLng object can be properly initialized with the given
     * arguments (the same as of the constructor).
     * @param {any} lat
     * @param {any} [lng]
     * @param {any} [alt]
     * @returns {boolean}
     */
    static validate(lat: any, lng?: any, alt?: any): boolean;
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
    static parse(text: string): LatLng | null;
    /**
     * Creates an object representing a geographical point with the given latitude and
     * longitude (and optionally altitude). Alternatively, expects a `LatLng` object, an
     * array of the form `[lat, lng]` or `[lat, lng, alt]`, or a plain object of the form
     * `{lat, lng}` or `{lat, lng, alt}` (`lon` can be used in place of `lng`) instead.
     * @param {number|LatLngExpression} lat Latitude in degrees, or the coordinates.
     * @param {number} [lng] Longitude in degrees.
     * @param {number} [alt] Altitude in meters.
     */
    constructor(lat: number | LatLngExpression, lng?: number, alt?: number);
    /**
     * Latitude in degrees.
     * @type {number}
     */
    lat: number;
    /**
     * Longitude in degrees.
     * @type {number}
     */
    lng: number;
    /**
     * Altitude in meters (optional).
     * @type {number|undefined}
     */
    alt: number | undefined;
    /**
     * Returns `true` if the given `LatLng` point is at the same position (within a small
     * margin of error). The margin of error can be overridden by setting `maxMargin` to
     * a small number.
     * @param {LatLngExpression} obj
     * @param {number} [maxMargin]
     * @returns {boolean}
     */
    equals(obj: LatLngExpression, maxMargin?: number): boolean;
    /**
     * Returns a string representation of the point (for debugging purposes).
     * @param {number|false} [precision]
     * @returns {string}
     */
    toString(precision?: number | false): string;
    /**
     * Returns the distance (in meters) to the given `LatLng` calculated using the
     * [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula).
     * @param {LatLngExpression} other
     * @returns {number}
     */
    distanceTo(other: LatLngExpression): number;
    /**
     * Returns a new `LatLng` object with the longitude wrapped so it's always between
     * -180 and +180 degrees.
     * @returns {LatLng}
     */
    wrap(): LatLng;
    /**
     * Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2`
     * meters apart from the `LatLng`.
     * @param {number} sizeInMeters
     * @returns {LatLngBounds}
     */
    toBounds(sizeInMeters: number): LatLngBounds;
}
/**
 * A geographical point: a `LatLng`, an array of the form `[lat, lng]` or
 * `[lat, lng, alt]`, or a plain object of the form `{lat, lng}` or `{lat, lng, alt}`
 * (`lon` can be used in place of `lng`). Accepted by all Maplair methods which accept
 * `LatLng` objects (unless noted otherwise). Plain arrays (`number[]`) are accepted
 * for JavaScript, where array literals in variables are no tuples.
 */
export type LatLngExpression = LatLng | [number, number] | [number, number, number] | number[] | {
    lat: number;
    lng: number;
    alt?: number;
} | {
    lat: number;
    lon: number;
    alt?: number;
};
import { LatLngBounds } from './LatLngBounds.js';
