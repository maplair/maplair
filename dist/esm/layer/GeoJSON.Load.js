import { GeoJSON } from "./GeoJSON.js";
//#region src/layer/GeoJSON.Load.js
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
GeoJSON.include({ options: {
	url: void 0,
	fetchOptions: void 0,
	fitBounds: false
} });
/** @typedef {typeof geoJSONLoadMethods} GeoJSONLoadMethods */
GeoJSON.include({ 
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
	const controller = this._loadAbort = new AbortController(), data = typeof source === "string" ? fetch(source, {
		...fetchOptions,
		signal: controller.signal
	}).then((response) => {
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		return response.json();
	}) : source;
	this.fire("loading");
	return Promise.resolve(data).then((geojson) => {
		if (controller.signal.aborted) return this;
		this._loadAbort = null;
		this.clearLayers().addData(geojson);
		if (this.options.fitBounds && this._map && this.getBounds().isValid()) this._map.fitBounds(this.getBounds());
		this.fire("load", { data: geojson });
		return this;
	}, (error) => {
		if (controller.signal.aborted) return this;
		this._loadAbort = null;
		this.fire("error", { error });
		throw error;
	});
} });
GeoJSON.addInitHook(function() {
	if (this.options.url) this.load(this.options.url).catch(() => {});
});
//#endregion

//# sourceMappingURL=GeoJSON.Load.js.map