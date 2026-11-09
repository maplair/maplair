/**
 * Options of `Hash`.
 * @typedef {object} HashOptions
 * @property {'zoom/lat/lng'|'geo'} [format='zoom/lat/lng'] The format of the hash:
 * `'zoom/lat/lng'` for `#13/47.2692/11.4041`, or `'geo'` for a
 * [geo URI](https://www.rfc-editor.org/rfc/rfc5870) with the zoom as parameter `z` like
 * in Android, `#geo:47.2692,11.4041?z=13`. The bearing of a rotated map is added as
 * fourth number or parameter `bearing`.
 * @property {Record<string, Layer>} [layers] The layers to keep in the hash by name,
 * e.g. the base layers and overlays of a `LayersControl`: the names of those on the map
 * are added as parameter `layers`, and restoring the hash adds the named layers to the
 * map and removes the others.
 * @property {'hash'|'query'} [mode='hash'] Where to keep the view: `'hash'` for the hash
 * of the URL, or `'query'` for the parameters `zoom`, `lat`, `lng`, `bearing` (of a
 * rotated map) and `layers` of the query string (the `format` option is ignored),
 * keeping the other parameters, e.g. `?q=cafe&zoom=13&lat=47.2692&lng=11.4041`. The
 * view is restored on navigating in the history of the browser (`popstate`).
 */
/**
 * A view of the map parsed from a hash or query string by `Hash.parse()` and
 * `Hash.parseQuery()`.
 * @typedef {object} HashView
 * @property {LatLng} center The center of the map.
 * @property {number} [zoom] The zoom level, if any.
 * @property {number} [bearing] The bearing of a rotated map, if any.
 * @property {string[]} [layers] The names of the layers, if any.
 * @property {string} hash The parsed hash or query string.
 */
/**
 * Keeps the view of the map in the hash of the URL, e.g. `#13/47.2692/11.4041`
 * (zoom, latitude, longitude, and the bearing of a rotated map) or as
 * [geo URI](https://www.rfc-editor.org/rfc/rfc5870) `#geo:47.2692,11.4041?z=13`
 * (see the `format` option), so that it can be bookmarked and shared. The view
 * is restored from the hash (in either format) when creating the `Hash` and when
 * the hash changes (e.g. with the back button of the browser).
 *
 * With the `layers` option, the hash also keeps the base layer and the overlays
 * shown on the map, e.g. `#13/47.2692/11.4041?layers=OSM,Bike%20routes`.
 *
 * With the option `mode: 'query'`, the view is kept in the query string instead,
 * e.g. `?zoom=13&lat=47.2692&lng=11.4041`, keeping the other parameters of the app.
 *
 * Inspired by the [leaflet-hash](https://github.com/mlevans/leaflet-hash) plugin.
 *
 * @example
 * ```js
 * const map = new MaplairMap('map').setView([47.27, 11.40], 13);
 * new Hash(map);
 *
 * // with the layers of a layers control
 * const baseLayers = {OSM: osm, Topo: topo}, overlays = {'Bike routes': bikes};
 * new LayersControl(baseLayers, overlays).addTo(map);
 * new Hash(map, {layers: {...baseLayers, ...overlays}});
 *
 * // in the query string, e.g. ?q=cafe&zoom=13&lat=47.2692&lng=11.4041
 * new Hash(map, {mode: 'query'});
 * ```
 */
export class Hash {
    /**
     * Parses a hash like `#13/47.2692/11.4041[/30][?layers=A,B]` or
     * `#geo:47.2692,11.4041[?z=13][&layers=A,B]` to an object with the `center`
     * (`LatLng`), the `zoom` (if any), the optional `bearing` and the names of the
     * `layers` (if any), or returns `undefined` for other hashes.
     * @param {string} hash
     * @returns {HashView|undefined}
     */
    static parse(hash: string): HashView | undefined;
    /**
     * Returns the hash for the view of the map in the given `format` (see the
     * options), with as many decimal places of the coordinates as needed for
     * the precision of a pixel, and the names of the given `layers` on the map.
     * @param {MaplairMap} map
     * @param {'zoom/lat/lng'|'geo'} [format='zoom/lat/lng']
     * @param {Record<string, Layer>} [layers]
     * @returns {string}
     */
    static format(map: MaplairMap, format?: "zoom/lat/lng" | "geo", layers?: Record<string, Layer>): string;
    /**
     * Parses the parameters `zoom`, `lat`, `lng`, `bearing` and `layers` of a query
     * string like `?q=cafe&zoom=13&lat=47.2692&lng=11.4041` like `parse()`, or
     * returns `undefined` without `lat` and `lng`.
     * @param {string} search
     * @returns {HashView|undefined}
     */
    static parseQuery(search: string): HashView | undefined;
    /**
     * Returns the query string `search` with the parameters for the view of the map
     * (see `format()`) instead of the previous ones, keeping the other parameters.
     * @param {MaplairMap} map
     * @param {Record<string, Layer>} [layers]
     * @param {string} [search='']
     * @returns {string}
     */
    static formatQuery(map: MaplairMap, layers?: Record<string, Layer>, search?: string): string;
    /**
     * Synchronizes the view of `map` with the hash of the URL.
     * @param {MaplairMap} map
     * @param {HashOptions} [options]
     */
    constructor(map: MaplairMap, options?: HashOptions);
    /** @type {HashOptions} */
    options: HashOptions;
    /**
     * Stops synchronizing the view with the hash of the URL.
     * @returns {this}
     */
    remove(): this;
}
/**
 * Options of `Hash`.
 */
export interface HashOptions {
    /**
     * The format of the hash:
     * `'zoom/lat/lng'` for `#13/47.2692/11.4041`, or `'geo'` for a
     * [geo URI](https://www.rfc-editor.org/rfc/rfc5870) with the zoom as parameter `z` like
     * in Android, `#geo:47.2692,11.4041?z=13`. The bearing of a rotated map is added as
     * fourth number or parameter `bearing`.
     * @default 'zoom/lat/lng'
     */
    format?: 'zoom/lat/lng'|'geo';
    /**
     * The layers to keep in the hash by name,
     * e.g. the base layers and overlays of a `LayersControl`: the names of those on the map
     * are added as parameter `layers`, and restoring the hash adds the named layers to the
     * map and removes the others.
     */
    layers?: Record<string, Layer>;
    /**
     * Where to keep the view: `'hash'` for the hash
     * of the URL, or `'query'` for the parameters `zoom`, `lat`, `lng`, `bearing` (of a
     * rotated map) and `layers` of the query string (the `format` option is ignored),
     * keeping the other parameters, e.g. `?q=cafe&zoom=13&lat=47.2692&lng=11.4041`. The
     * view is restored on navigating in the history of the browser (`popstate`).
     * @default 'hash'
     */
    mode?: 'hash'|'query';
}
/**
 * A view of the map parsed from a hash or query string by `Hash.parse()` and
 * `Hash.parseQuery()`.
 */
export interface HashView {
    /**
     * The center of the map.
     */
    center: LatLng;
    /**
     * The zoom level, if any.
     */
    zoom?: number;
    /**
     * The bearing of a rotated map, if any.
     */
    bearing?: number;
    /**
     * The names of the layers, if any.
     */
    layers?: string[];
    /**
     * The parsed hash or query string.
     */
    hash: string;
}
import type { MaplairMap } from './Map.js';
import type { Layer } from '../layer/Layer.js';
import { LatLng } from '../geo/LatLng.js';
