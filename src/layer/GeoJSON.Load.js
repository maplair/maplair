import {GeoJSON} from './GeoJSON.js';

/*
 * @namespace GeoJSON
 * @section Loading GeoJSON
 *
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
 */

GeoJSON.include({
	options: {
		// @section
		// @aka GeoJSON options
		// @option url: String = undefined
		// A URL to [load](#geojson-load) the GeoJSON data from when creating the layer.
		url: undefined,

		// @option fetchOptions: Object = undefined
		// Options for [`fetch()`](https://developer.mozilla.org/docs/Web/API/Window/fetch)
		// when loading, e.g. `{headers: {Authorization: 'Bearer …'}}`.
		fetchOptions: undefined,

		// @option fitBounds: Boolean = false
		// Whether to fit the map to the bounds of the data once loaded.
		fitBounds: false
	},

	// @method load(source: String|Promise, fetchOptions?: Object): Promise
	// Loads GeoJSON data from a URL (or a promise of the data) and replaces the
	// layers with it. A running load is aborted. Returns a promise of this layer.
	load(source, fetchOptions = this.options.fetchOptions) {
		this._loadAbort?.abort();
		const controller = this._loadAbort = new AbortController(),
		data = typeof source === 'string' ?
			fetch(source, {...fetchOptions, signal: controller.signal}).then((response) => {
				if (!response.ok) { throw new Error(`${response.status} ${response.statusText}`); }
				return response.json();
			}) :
			source;

		// @section Loading GeoJSON events
		// @event loading: Event
		// Fired when starting to load data with `load()`.
		this.fire('loading');

		return Promise.resolve(data).then((geojson) => {
			// superseded by another load
			if (controller.signal.aborted) { return this; }
			this._loadAbort = null;
			this.clearLayers().addData(geojson);
			if (this.options.fitBounds && this._map && this.getBounds().isValid()) {
				this._map.fitBounds(this.getBounds());
			}
			// @event load: Event
			// Fired when the data of `load()` has been added, with the `data`.
			this.fire('load', {data: geojson});
			return this;
		}, (error) => {
			if (controller.signal.aborted) { return this; }
			this._loadAbort = null;
			// @event error: ErrorEvent
			// Fired when `load()` fails, with the `error`.
			this.fire('error', {error});
			throw error;
		});
	}
});

GeoJSON.addInitHook(function () {
	if (this.options.url) {
		// errors are fired as `error` event
		this.load(this.options.url).catch(() => {});
	}
});
