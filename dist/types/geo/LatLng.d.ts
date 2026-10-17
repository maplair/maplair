import type { EarthCRS } from './crs/EarthCRS.js';
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
     * Returns `true` if the LatLng object can be properly initialized with the given
     * arguments (the same as of the constructor).
     * @param {any} lat
     * @param {any} [lng]
     * @param {any} [alt]
     * @returns {boolean}
     */
    static validate(lat: any, lng?: any, alt?: any): boolean;
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
