import {LatLng} from '../geo/LatLng.js';

const leadingHashRe = /^#/,
leadingQuestionMarkRe = /^\?/,
geoRe = /^geo:(-?[\d.]+),(-?[\d.]+)$/,
// the parameters of the query mode
queryParams = ['zoom', 'lat', 'lng', 'bearing', 'layers'];

// The names of the layers in a query string like `layers=A,B` (names may contain
// commas, which are encoded), or `undefined` without the parameter
function parseLayers(query) {
	const raw = (query ?? '').split('&').find(param => param.startsWith('layers='))?.slice(7);
	return raw === undefined ? undefined : raw.split(',').filter(Boolean).map(decodeURIComponent);
}

// The rounded view of the map and the names of the given layers on it
function viewOf(map, layers) {
	const center = map.getCenter(),
	// degrees per pixel ≈ 360 / (256 · 2^zoom)
	precision = Math.max(0, Math.ceil(Math.log10(256 * 2 ** map.getZoom() / 360))),
	names = layers && Object.keys(layers).filter(name => map.hasLayer(layers[name]));
	return {
		zoom: Math.round(map.getZoom() * 100) / 100,
		lat: center.lat.toFixed(precision),
		lng: center.lng.toFixed(precision),
		bearing: Math.round((map.getBearing?.() ?? 0) * 10) / 10,
		layers: names ? `layers=${names.map(encodeURIComponent).join(',')}` : ''
	};
}

/*
 * @class Hash
 *
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

// @namespace Hash
// @constructor Hash(map: MaplairMap, options?: Hash options)
// Synchronizes the view of `map` with the hash of the URL.
export class Hash {
	constructor(map, options) {
		// @section
		// @aka Hash options
		this.options = {
			// @option format: String = 'zoom/lat/lng'
			// The format of the hash: `'zoom/lat/lng'` for `#13/47.2692/11.4041`, or
			// `'geo'` for a [geo URI](https://www.rfc-editor.org/rfc/rfc5870) with the
			// zoom as parameter `z` like in Android, `#geo:47.2692,11.4041?z=13`. The
			// bearing of a rotated map is added as fourth number or parameter `bearing`.
			format: 'zoom/lat/lng',

			// @option layers: Object = undefined
			// The layers to keep in the hash by name, e.g. the base layers and overlays
			// of a `LayersControl`: the names of those on the map are added as
			// parameter `layers`, and restoring the hash adds the named layers to
			// the map and removes the others.
			layers: undefined,

			// @option mode: String = 'hash'
			// Where to keep the view: `'hash'` for the hash of the URL, or `'query'` for
			// the parameters `zoom`, `lat`, `lng`, `bearing` (of a rotated map) and
			// `layers` of the query string (the `format` option is ignored), keeping the
			// other parameters, e.g. `?q=cafe&zoom=13&lat=47.2692&lng=11.4041`. The view is
			// restored on navigating in the history of the browser (`popstate`).
			mode: 'hash',
			...options
		};
		this._map = map;
		this._onHashChange = this._onHashChange.bind(this);
		this._event = this.options.mode === 'query' ? 'popstate' : 'hashchange';

		window.addEventListener(this._event, this._onHashChange);
		map.on('moveend layeradd layerremove', this._onMoveEnd, this);

		if (!this._onHashChange() && map._loaded) {
			this._onMoveEnd();
		}
	}

	// @method remove(): this
	// Stops synchronizing the view with the hash of the URL.
	remove() {
		window.removeEventListener(this._event, this._onHashChange);
		this._map.off('moveend layeradd layerremove', this._onMoveEnd, this);
		return this;
	}

	// Restores the view from the hash, returns whether it was valid
	_onHashChange() {
		const view = this.options.mode === 'query' ? Hash.parseQuery(location.search) : Hash.parse(location.hash);
		if (!view) { return false; }
		if (view.hash === this._hash) { return true; }

		this._hash = view.hash;
		this._restoring = true;
		const map = this._map;
		map.setView(view.center, view.zoom ?? map.getZoom(), {animate: false});
		// with the map rotation (see `MaplairMap.setBearing()`)
		if (map.setBearing && (view.bearing !== undefined || map.getBearing())) {
			map.setBearing(view.bearing ?? 0);
		}
		if (view.layers && this.options.layers) {
			for (const [name, layer] of Object.entries(this.options.layers)) {
				if (view.layers.includes(name)) {
					map.addLayer(layer);
				} else if (map.hasLayer(layer)) {
					map.removeLayer(layer);
				}
			}
		}
		this._restoring = false;
		// e.g. adding the layers to a hash without them
		this._onMoveEnd();
		return true;
	}

	_onMoveEnd() {
		if (this._restoring || !this._map._loaded) { return; }
		const query = this.options.mode === 'query',
		hash = query ?
			Hash.formatQuery(this._map, this.options.layers, location.search) :
			Hash.format(this._map, this.options.format, this.options.layers);
		if (hash === this._hash || hash === (query ? location.search : location.hash)) { return; }
		this._hash = hash;
		// without adding entries to the history of the browser
		history.replaceState(history.state, '', query ? hash + location.hash : hash);
	}

	// @function parse(hash: String): Object
	// Parses a hash like `#13/47.2692/11.4041[/30][?layers=A,B]` or
	// `#geo:47.2692,11.4041[?z=13][&layers=A,B]` to an object with the `center`
	// (`LatLng`), the `zoom` (if any), the optional `bearing` and the names of the
	// `layers` (if any), or returns `undefined` for other hashes.
	static parse(hash) {
		const [path, query] = hash.replace(leadingHashRe, '').split('?'),
		params = new URLSearchParams(query),
		layers = parseLayers(query);
		let zoom, lat, lng, bearing;

		const geo = geoRe.exec(path);
		if (geo) {
			[lat, lng] = geo.slice(1).map(Number);
			zoom = params.has('z') ? Number(params.get('z')) : undefined;
			bearing = params.has('bearing') ? Number(params.get('bearing')) : undefined;
		} else {
			const parts = path.split('/');
			if ((parts.length !== 3 && parts.length !== 4) || parts.includes('')) { return undefined; }
			[zoom, lat, lng, bearing] = parts.map(Number);
		}
		if ([zoom, lat, lng, bearing].some(Number.isNaN)) { return undefined; }
		return {zoom, center: new LatLng(lat, lng), bearing, layers, hash: `#${hash.replace(leadingHashRe, '')}`};
	}

	// @function format(map: MaplairMap, format?: String, layers?: Object): String
	// Returns the hash for the view of the map in the given `format` (see the
	// options), with as many decimal places of the coordinates as needed for
	// the precision of a pixel, and the names of the given `layers` on the map.
	static format(map, format = 'zoom/lat/lng', layers = undefined) {
		const {zoom, lat, lng, bearing, layers: layerParam} = viewOf(map, layers);
		if (format === 'geo') {
			return `#geo:${lat},${lng}?z=${zoom}${bearing ? `&bearing=${bearing}` : ''}${layerParam ? `&${layerParam}` : ''}`;
		}
		return `#${zoom}/${lat}/${lng}${bearing ? `/${bearing}` : ''}${layerParam ? `?${layerParam}` : ''}`;
	}

	// @function parseQuery(search: String): Object
	// Parses the parameters `zoom`, `lat`, `lng`, `bearing` and `layers` of a query
	// string like `?q=cafe&zoom=13&lat=47.2692&lng=11.4041` like `parse()`, or
	// returns `undefined` without `lat` and `lng`.
	static parseQuery(search) {
		const query = search.replace(leadingQuestionMarkRe, ''),
		params = new URLSearchParams(query);
		if (!params.has('lat') || !params.has('lng')) { return undefined; }
		const [zoom, bearing] = ['zoom', 'bearing'].map(name => (params.has(name) ? Number(params.get(name)) : undefined)),
		lat = Number(params.get('lat')),
		lng = Number(params.get('lng'));
		if ([zoom, lat, lng, bearing].some(Number.isNaN)) { return undefined; }
		return {zoom, center: new LatLng(lat, lng), bearing, layers: parseLayers(query), hash: search};
	}

	// @function formatQuery(map: MaplairMap, layers?: Object, search?: String): String
	// Returns the query string `search` with the parameters for the view of the map
	// (see `format()`) instead of the previous ones, keeping the other parameters.
	static formatQuery(map, layers = undefined, search = '') {
		const view = viewOf(map, layers),
		params = new URLSearchParams(search);
		for (const name of queryParams) {
			params.delete(name);
		}
		const others = params.toString();
		return `?${[
			others,
			`zoom=${view.zoom}&lat=${view.lat}&lng=${view.lng}`,
			view.bearing ? `bearing=${view.bearing}` : '',
			view.layers
		].filter(Boolean).join('&')}`;
	}
}
