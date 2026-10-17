import {LatLng} from '../geo/LatLng.js';

const leadingHashRe = /^#/;

/*
 * @class Hash
 *
 * Keeps the view of the map in the hash of the URL, e.g. `#13/47.2692/11.4041`
 * (zoom, latitude, longitude, and the bearing of a rotated map), so that it can be
 * bookmarked and shared. The view is restored from the hash when creating the
 * `Hash` and when the hash changes (e.g. with the back button of the browser).
 *
 * Inspired by the [leaflet-hash](https://github.com/mlevans/leaflet-hash) plugin.
 *
 * @example
 * ```js
 * const map = new MaplairMap('map').setView([47.27, 11.40], 13);
 * new Hash(map);
 * ```
 */

// @namespace Hash
// @constructor Hash(map: MaplairMap)
// Synchronizes the view of `map` with the hash of the URL.
export class Hash {
	constructor(map) {
		this._map = map;
		this._onHashChange = this._onHashChange.bind(this);

		window.addEventListener('hashchange', this._onHashChange);
		map.on('moveend', this._onMoveEnd, this);

		if (!this._onHashChange() && map._loaded) {
			this._onMoveEnd();
		}
	}

	// @method remove(): this
	// Stops synchronizing the view with the hash of the URL.
	remove() {
		window.removeEventListener('hashchange', this._onHashChange);
		this._map.off('moveend', this._onMoveEnd, this);
		return this;
	}

	// Restores the view from the hash, returns whether it was valid
	_onHashChange() {
		const view = Hash.parse(location.hash);
		if (!view) { return false; }
		if (view.hash === this._hash) { return true; }

		this._hash = view.hash;
		this._map.setView(view.center, view.zoom, {animate: false});
		// with the map rotation (see `MaplairMap.setBearing()`)
		if (this._map.setBearing && (view.bearing !== undefined || this._map.getBearing())) {
			this._map.setBearing(view.bearing ?? 0);
		}
		return true;
	}

	_onMoveEnd() {
		const hash = Hash.format(this._map);
		if (hash === this._hash || hash === location.hash) { return; }
		this._hash = hash;
		// without adding entries to the history of the browser
		history.replaceState(history.state, '', hash);
	}

	// @function parse(hash: String): Object
	// Parses a hash like `#13/47.2692/11.4041[/30]` to an object with the
	// `zoom`, `center` (`LatLng`) and the optional `bearing`, or returns
	// `undefined` for other hashes.
	static parse(hash) {
		const parts = hash.replace(leadingHashRe, '').split('/');
		if ((parts.length !== 3 && parts.length !== 4) || parts.includes('')) { return undefined; }
		const [zoom, lat, lng, bearing] = parts.map(Number);
		if ([zoom, lat, lng].some(Number.isNaN) || (parts.length === 4 && Number.isNaN(bearing))) { return undefined; }
		return {zoom, center: new LatLng(lat, lng), bearing, hash: `#${parts.join('/')}`};
	}

	// @function format(map: MaplairMap): String
	// Returns the hash for the view of the map, with as many decimal places of
	// the coordinates as needed for the precision of a pixel.
	static format(map) {
		const zoom = map.getZoom(),
		center = map.getCenter(),
		bearing = map.getBearing?.(),
		// degrees per pixel ≈ 360 / (256 · 2^zoom)
		precision = Math.max(0, Math.ceil(Math.log10(256 * 2 ** zoom / 360)));
		let hash = `#${Math.round(zoom * 100) / 100}/${center.lat.toFixed(precision)}/${center.lng.toFixed(precision)}`;
		if (bearing) {
			hash += `/${Math.round(bearing * 10) / 10}`;
		}
		return hash;
	}
}
