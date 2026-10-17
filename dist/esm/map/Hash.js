import { LatLng } from "../geo/LatLng.js";
//#region src/map/Hash.js
/** @import {MaplairMap} from './Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
const leadingHashRe = /^#/;
const leadingQuestionMarkRe = /^\?/;
const geoRe = /^geo:(-?[\d.]+),(-?[\d.]+)$/;
const queryParams = [
	"zoom",
	"lat",
	"lng",
	"bearing",
	"layers"
];
function parseLayers(query) {
	const raw = (query ?? "").split("&").find((param) => param.startsWith("layers="))?.slice(7);
	return raw === void 0 ? void 0 : raw.split(",").filter(Boolean).map(decodeURIComponent);
}
function viewOf(map, layers) {
	const center = map.getCenter(), precision = Math.max(0, Math.ceil(Math.log10(256 * 2 ** map.getZoom() / 360))), names = layers && Object.keys(layers).filter((name) => map.hasLayer(layers[name]));
	return {
		zoom: Math.round(map.getZoom() * 100) / 100,
		lat: center.lat.toFixed(precision),
		lng: center.lng.toFixed(precision),
		bearing: Math.round((map.getBearing?.() ?? 0) * 10) / 10,
		layers: names ? `layers=${names.map(encodeURIComponent).join(",")}` : ""
	};
}
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
var Hash = class Hash {
	/**
	* Synchronizes the view of `map` with the hash of the URL.
	* @param {MaplairMap} map
	* @param {HashOptions} [options]
	*/
	constructor(map, options) {
		/** @type {HashOptions} */
		this.options = {
			format: "zoom/lat/lng",
			layers: void 0,
			mode: "hash",
			...options
		};
		this._map = map;
		this._onHashChange = this._onHashChange.bind(this);
		this._event = this.options.mode === "query" ? "popstate" : "hashchange";
		window.addEventListener(this._event, this._onHashChange);
		map.on("moveend layeradd layerremove", this._onMoveEnd, this);
		if (!this._onHashChange() && map._loaded) this._onMoveEnd();
	}
	/**
	* Stops synchronizing the view with the hash of the URL.
	* @returns {this}
	*/
	remove() {
		window.removeEventListener(this._event, this._onHashChange);
		this._map.off("moveend layeradd layerremove", this._onMoveEnd, this);
		return this;
	}
	_onHashChange() {
		const view = this.options.mode === "query" ? Hash.parseQuery(location.search) : Hash.parse(location.hash);
		if (!view) return false;
		if (view.hash === this._hash) return true;
		this._hash = view.hash;
		this._restoring = true;
		const map = this._map;
		map.setView(view.center, view.zoom ?? map.getZoom(), { animate: false });
		if (map.setBearing && (view.bearing !== void 0 || map.getBearing())) map.setBearing(view.bearing ?? 0);
		if (view.layers && this.options.layers) {
			for (const [name, layer] of Object.entries(this.options.layers)) if (view.layers.includes(name)) map.addLayer(layer);
			else if (map.hasLayer(layer)) map.removeLayer(layer);
		}
		this._restoring = false;
		this._onMoveEnd();
		return true;
	}
	_onMoveEnd() {
		if (this._restoring || !this._map._loaded) return;
		const query = this.options.mode === "query", hash = query ? Hash.formatQuery(this._map, this.options.layers, location.search) : Hash.format(this._map, this.options.format, this.options.layers);
		if (hash === this._hash || hash === (query ? location.search : location.hash)) return;
		this._hash = hash;
		history.replaceState(history.state, "", query ? hash + location.hash : hash);
	}
	/**
	* Parses a hash like `#13/47.2692/11.4041[/30][?layers=A,B]` or
	* `#geo:47.2692,11.4041[?z=13][&layers=A,B]` to an object with the `center`
	* (`LatLng`), the `zoom` (if any), the optional `bearing` and the names of the
	* `layers` (if any), or returns `undefined` for other hashes.
	* @param {string} hash
	* @returns {HashView|undefined}
	*/
	static parse(hash) {
		const [path, query] = hash.replace(leadingHashRe, "").split("?"), params = new URLSearchParams(query), layers = parseLayers(query);
		let zoom, lat, lng, bearing;
		const geo = geoRe.exec(path);
		if (geo) {
			[lat, lng] = geo.slice(1).map(Number);
			zoom = params.has("z") ? Number(params.get("z")) : void 0;
			bearing = params.has("bearing") ? Number(params.get("bearing")) : void 0;
		} else {
			const parts = path.split("/");
			if (parts.length !== 3 && parts.length !== 4 || parts.includes("")) return;
			[zoom, lat, lng, bearing] = parts.map(Number);
		}
		if ([
			zoom,
			lat,
			lng,
			bearing
		].some(Number.isNaN)) return;
		return {
			zoom,
			center: new LatLng(lat, lng),
			bearing,
			layers,
			hash: `#${hash.replace(leadingHashRe, "")}`
		};
	}
	/**
	* Returns the hash for the view of the map in the given `format` (see the
	* options), with as many decimal places of the coordinates as needed for
	* the precision of a pixel, and the names of the given `layers` on the map.
	* @param {MaplairMap} map
	* @param {'zoom/lat/lng'|'geo'} [format='zoom/lat/lng']
	* @param {Record<string, Layer>} [layers]
	* @returns {string}
	*/
	static format(map, format = "zoom/lat/lng", layers = void 0) {
		const { zoom, lat, lng, bearing, layers: layerParam } = viewOf(map, layers);
		if (format === "geo") return `#geo:${lat},${lng}?z=${zoom}${bearing ? `&bearing=${bearing}` : ""}${layerParam ? `&${layerParam}` : ""}`;
		return `#${zoom}/${lat}/${lng}${bearing ? `/${bearing}` : ""}${layerParam ? `?${layerParam}` : ""}`;
	}
	/**
	* Parses the parameters `zoom`, `lat`, `lng`, `bearing` and `layers` of a query
	* string like `?q=cafe&zoom=13&lat=47.2692&lng=11.4041` like `parse()`, or
	* returns `undefined` without `lat` and `lng`.
	* @param {string} search
	* @returns {HashView|undefined}
	*/
	static parseQuery(search) {
		const query = search.replace(leadingQuestionMarkRe, ""), params = new URLSearchParams(query);
		if (!params.has("lat") || !params.has("lng")) return;
		const [zoom, bearing] = ["zoom", "bearing"].map((name) => params.has(name) ? Number(params.get(name)) : void 0), lat = Number(params.get("lat")), lng = Number(params.get("lng"));
		if ([
			zoom,
			lat,
			lng,
			bearing
		].some(Number.isNaN)) return;
		return {
			zoom,
			center: new LatLng(lat, lng),
			bearing,
			layers: parseLayers(query),
			hash: search
		};
	}
	/**
	* Returns the query string `search` with the parameters for the view of the map
	* (see `format()`) instead of the previous ones, keeping the other parameters.
	* @param {MaplairMap} map
	* @param {Record<string, Layer>} [layers]
	* @param {string} [search='']
	* @returns {string}
	*/
	static formatQuery(map, layers = void 0, search = "") {
		const view = viewOf(map, layers), params = new URLSearchParams(search);
		for (const name of queryParams) params.delete(name);
		return `?${[
			params.toString(),
			`zoom=${view.zoom}&lat=${view.lat}&lng=${view.lng}`,
			view.bearing ? `bearing=${view.bearing}` : "",
			view.layers
		].filter(Boolean).join("&")}`;
	}
};
//#endregion
export { Hash };

//# sourceMappingURL=Hash.js.map