import type { GeoJSON } from './GeoJSON.js';
import type { MaplairEvent } from '../core/Events.js';

/**
 * Options of `GeoJSON` for loading GeoJSON from a URL, added by importing this module.
 */
export interface GeoJSONLoadOptions {
    /**
     * A URL to [load](#geojson-load) the GeoJSON data
     * from when creating the layer.
     * @default undefined
     */
    url?: string;
    /**
     * Options for
     * [`fetch()`](https://developer.mozilla.org/docs/Web/API/Window/fetch) when loading,
     * e.g. `{headers: {Authorization: 'Bearer …'}}`.
     * @default undefined
     */
    fetchOptions?: RequestInit;
    /**
     * Whether to fit the map to the bounds of the
     * data once loaded.
     * @default false
     */
    fitBounds?: boolean;
}
/**
 * Event of `GeoJSON` when the data of `load()` has been added.
 */
export interface GeoJSONLoadEvent extends MaplairEvent {
    /**
     * The loaded GeoJSON data.
     */
    data: GeoJsonObject|GeoJsonObject[];
}
/**
 * Event of `GeoJSON` when `load()` fails.
 */
export interface GeoJSONLoadErrorEvent extends MaplairEvent {
    /**
     * The error of loading the data.
     */
    error: any;
}
/**
 * Loading GeoJSON from a URL is an optional feature: import this module to add the
 * `url`, `fetchOptions` and `fitBounds` options and `load()` to `GeoJSON`.
 *
 * ```js
 * import 'maplair/geojson-loading';
 *
 * const layer = new GeoJSON(null, {url: 'districts.json', fitBounds: true}).addTo(map);
 * // later, replacing the data
 * layer.load('districts.json?year=2026');
 * ```
 *
 * Inspired by the [leaflet-ajax](https://github.com/calvinmetcalf/leaflet-ajax) plugin.
 * @fires GeoJSON#loading {MaplairEvent} Fired when starting to load data with `load()`.
 * @fires GeoJSON#load {GeoJSONLoadEvent} Fired when the data of `load()` has been
 * added, with the `data`.
 * @fires GeoJSON#error {GeoJSONLoadErrorEvent} Fired when `load()` fails, with the
 * `error`.
 */
export interface GeoJSONLoadMethods {
    /**
     * Loads GeoJSON data from a URL (or a promise of the data) and replaces the
     * layers with it. A running load is aborted. Returns a promise of this layer.
     * @group Loading GeoJSON
     * @param {string|Promise<GeoJsonObject|GeoJsonObject[]>} source
     * @param {RequestInit} [fetchOptions] Defaults to the `fetchOptions` option.
     * @returns {Promise<this>}
     */
    load(source: string | Promise<GeoJsonObject | GeoJsonObject[]>, fetchOptions?: RequestInit): Promise<this>;
}
import type { GeoJsonObject } from 'geojson';
export {};
declare module './GeoJSON.js' {
    interface GeoJSONOptions extends GeoJSONLoadOptions {
    }
}
declare module './GeoJSON.js' {
    interface GeoJSON extends GeoJSONLoadMethods {
    }
}
