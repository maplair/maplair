import {GeoJSON} from './GeoJSON.js';
/** @import {GeoJsonObject} from 'geojson' */
/** @import {MaplairEvent} from '../core/Events.js' */

/**
 * Options of `GeoJSON` for loading GeoJSON from a URL, added by importing this module.
 * @typedef {object} GeoJSONLoadOptions
 * @lends GeoJSONOptions
 * @property {string} [url=undefined] A URL to [load](#geojson-load) the GeoJSON data
 * from when creating the layer.
 * @property {RequestInit} [fetchOptions=undefined] Options for
 * [`fetch()`](https://developer.mozilla.org/docs/Web/API/Window/fetch) when loading,
 * e.g. `{headers: {Authorization: 'Bearer …'}}`.
 * @property {boolean} [fitBounds=false] Whether to fit the map to the bounds of the
 * data once loaded.
 */

GeoJSON.include({
	options: {
		url: undefined,
		fetchOptions: undefined,
		fitBounds: false
	}
});

/**
 * Event of `GeoJSON` when the data of `load()` has been added.
 * @typedef {object} GeoJSONLoadEvent
 * @property {GeoJsonObject|GeoJsonObject[]} data The loaded GeoJSON data.
 * @extends MaplairEvent
 */

/**
 * Event of `GeoJSON` when `load()` fails.
 * @typedef {object} GeoJSONLoadErrorEvent
 * @property {any} error The error of loading the data.
 * @extends MaplairEvent
 */

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
 *
 * @lends GeoJSON.prototype
 * @fires GeoJSON#loading {MaplairEvent} Fired when starting to load data with `load()`.
 * @fires GeoJSON#load {GeoJSONLoadEvent} Fired when the data of `load()` has been
 * added, with the `data`.
 * @fires GeoJSON#error {GeoJSONLoadErrorEvent} Fired when `load()` fails, with the
 * `error`.
 */
const geoJSONLoadMethods = {
	/**
	 * Loads GeoJSON data from a URL (or a promise of the data) and replaces the
	 * layers with it. A running load is aborted. Returns a promise of this layer.
	 * @group Loading GeoJSON
	 * @param {string|Promise<GeoJsonObject|GeoJsonObject[]>} source
	 * @param {RequestInit} [fetchOptions] Defaults to the `fetchOptions` option.
	 * @returns {Promise<this>}
	 */
	load(source, fetchOptions = this.options.fetchOptions) {
		this._loadAbort?.abort();
		const controller = this._loadAbort = new AbortController(),
		data = typeof source === 'string' ?
			fetch(source, {...fetchOptions, signal: controller.signal}).then((response) => {
				if (!response.ok) { throw new Error(`${response.status} ${response.statusText}`); }
				return response.json();
			}) :
			source;

		this.fire('loading');

		return Promise.resolve(data).then((geojson) => {
			// superseded by another load
			if (controller.signal.aborted) { return this; }
			this._loadAbort = null;
			this.clearLayers().addData(geojson);
			if (this.options.fitBounds && this._map && this.getBounds().isValid()) {
				this._map.fitBounds(this.getBounds());
			}
			this.fire('load', {data: geojson});
			return this;
		}, (error) => {
			if (controller.signal.aborted) { return this; }
			this._loadAbort = null;
			this.fire('error', {error});
			throw error;
		});
	}
};
/** @typedef {typeof geoJSONLoadMethods} GeoJSONLoadMethods */

GeoJSON.include(geoJSONLoadMethods);

GeoJSON.addInitHook(function () {
	if (this.options.url) {
		// errors are fired as `error` event
		this.load(this.options.url).catch(() => {});
	}
});
