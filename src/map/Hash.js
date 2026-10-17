import {LatLng} from '../geo/LatLng.js';

const leadingHashRe = /^#/,
geoRe = /^geo:(-?[\d.]+),(-?[\d.]+)$/;

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
 * Inspired by the [leaflet-hash](https://github.com/mlevans/leaflet-hash) plugin.
 *
 * @example
 * ```js
 * const map = new MaplairMap('map').setView([47.27, 11.40], 13);
 * new Hash(map);
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
			...options
		};
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
		this._map.setView(view.center, view.zoom ?? this._map.getZoom(), {animate: false});
		// with the map rotation (see `MaplairMap.setBearing()`)
		if (this._map.setBearing && (view.bearing !== undefined || this._map.getBearing())) {
			this._map.setBearing(view.bearing ?? 0);
		}
		return true;
	}

	_onMoveEnd() {
		const hash = Hash.format(this._map, this.options.format);
		if (hash === this._hash || hash === location.hash) { return; }
		this._hash = hash;
		// without adding entries to the history of the browser
		history.replaceState(history.state, '', hash);
	}

	// @function parse(hash: String): Object
	// Parses a hash like `#13/47.2692/11.4041[/30]` or `#geo:47.2692,11.4041[?z=13]`
	// to an object with the `center` (`LatLng`), the `zoom` (if any) and the
	// optional `bearing`, or returns `undefined` for other hashes.
	static parse(hash) {
		const [path, query] = hash.replace(leadingHashRe, '').split('?'),
		params = new URLSearchParams(query);
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
		return {zoom, center: new LatLng(lat, lng), bearing, hash: `#${hash.replace(leadingHashRe, '')}`};
	}

	// @function format(map: MaplairMap, format?: String): String
	// Returns the hash for the view of the map in the given `format` (see the
	// options), with as many decimal places of the coordinates as needed for
	// the precision of a pixel.
	static format(map, format = 'zoom/lat/lng') {
		const zoom = Math.round(map.getZoom() * 100) / 100,
		center = map.getCenter(),
		bearing = Math.round((map.getBearing?.() ?? 0) * 10) / 10,
		// degrees per pixel ≈ 360 / (256 · 2^zoom)
		precision = Math.max(0, Math.ceil(Math.log10(256 * 2 ** map.getZoom() / 360))),
		lat = center.lat.toFixed(precision),
		lng = center.lng.toFixed(precision);
		if (format === 'geo') {
			return `#geo:${lat},${lng}?z=${zoom}${bearing ? `&bearing=${bearing}` : ''}`;
		}
		return `#${zoom}/${lat}/${lng}${bearing ? `/${bearing}` : ''}`;
	}
}
