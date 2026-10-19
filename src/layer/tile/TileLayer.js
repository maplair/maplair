import {GridLayer} from './GridLayer.js';
import Browser from '../../core/Browser.js';
import * as Util from '../../core/Util.js';
import * as DomEvent from '../../dom/DomEvent.js';
import {I18n} from '../../core/I18n.js';
/** @import {Point} from '../../geometry/Point.js' */
/** @import {GridLayerOptions, TileDoneCallback} from './GridLayer.js' */
/** @import {TileEvent} from '../../core/Events.js' */

/**
 * Options of `TileLayer`.
 * @typedef {object} TileLayerOptions
 * @property {number} [minZoom=0] The minimum zoom level down to which this layer will be
 * displayed (inclusive).
 * @property {number} [maxZoom=18] The maximum zoom level up to which this layer will be
 * displayed (inclusive).
 * @property {string|string[]} [subdomains='abc'] Subdomains of the tile service. Can be
 * passed in the form of one string (where each letter is a subdomain name) or an array
 * of strings.
 * @property {string} [errorTileUrl=''] URL to the tile image to show in place of the
 * tile that failed to load.
 * @property {number} [zoomOffset=0] The zoom number used in tile URLs will be offset
 * with this value.
 * @property {boolean} [tms=false] If `true`, inverses Y axis numbering for tiles (turn
 * this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
 * @property {boolean} [zoomReverse=false] If set to true, the zoom number used in tile
 * URLs will be reversed (`maxZoom - zoom` instead of `zoom`).
 * @property {boolean} [detectRetina=false] If `true` and user is on a retina display, it
 * will request four tiles of half the specified size and a bigger zoom level in place
 * of one to utilize the high resolution.
 * @property {boolean|string} [crossOrigin=false] Whether the crossOrigin attribute will
 * be added to the tiles. If a String is provided, all tiles will have their crossOrigin
 * attribute set to the String provided. This is needed if you want to access tile pixel
 * data. Refer to
 * [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
 * for valid String values.
 * @property {ReferrerPolicy} [referrerPolicy='strict-origin-when-cross-origin'] Sets the
 * tiles' `referrerPolicy` attribute set to the String provided. See
 * [`HTMLImageElement.referrerPolicy`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy)
 * for possible values.
 *
 * Tile providers might require you to use a specific referrer policy (e.g. to verify
 * API tokens or prevent abuse). Specifically, if you are using tiles from
 * `tile.openstreetmap.org` or `tile.osm.org`, you
 * [should not change this value](https://operations.osmfoundation.org/policies/tiles/).
 * @property {RequestInit|null} [fetchOptions=null] If set, the tiles are loaded with
 * [`fetch()`](https://developer.mozilla.org/docs/Web/API/Window/fetch) using these
 * options (see [`RequestInit`](https://developer.mozilla.org/docs/Web/API/RequestInit)),
 * e.g. `{headers: {Authorization: 'Bearer …'}}` for tile servers requiring custom HTTP
 * headers. Requests of tiles that are no longer needed (e.g. after panning or zooming
 * away) are aborted. Cross-origin tile servers have to allow such requests with
 * [CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS) headers.
 * @extends GridLayerOptions
 */

/**
 * Used to load and display tile layers on the map. Note that most tile servers require
 * attribution, which you can set under `Layer`. Extends `GridLayer`.
 *
 * ### URL template
 *
 * A string of the following form:
 *
 * ```
 * 'https://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
 * ```
 *
 * `{s}` means one of the available subdomains (used sequentially to help with browser
 * parallel requests per domain limitation; subdomain values are specified in options;
 * `a`, `b` or `c` by default, can be omitted), `{z}` — zoom level, `{x}` and `{y}` —
 * tile coordinates. `{r}` can be used to add "@2x" to the URL to load retina tiles.
 *
 * You can use custom keys in the template, which will be [evaluated](#util-template)
 * from TileLayer options, like this:
 *
 * ```
 * new TileLayer('https://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});
 * ```
 *
 * Layers extending `TileLayer` might reimplement the [`getTileUrl()`](#tilelayer-gettileurl)
 * method.
 *
 * @example
 * ```js
 * new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
 * ```
 *
 * @fires tileabort {TileEvent} Fired when a tile was loading but is now not wanted.
 */
export class TileLayer extends GridLayer {

	static defaultOptions = {
		minZoom: 0,
		maxZoom: 18,
		subdomains: 'abc',
		errorTileUrl: '',
		zoomOffset: 0,
		tms: false,
		zoomReverse: false,
		detectRetina: false,
		crossOrigin: false,
		referrerPolicy: 'strict-origin-when-cross-origin',
		fetchOptions: null

	};

	/**
	 * Instantiates a tile layer object given a [URL template](#tilelayer) and optionally an
	 * options object.
	 * @param {string} url The URL template.
	 * @param {TileLayerOptions & Record<string, unknown>} [options] The options, and the values
	 * of custom keys of the URL template.
	 */
	constructor(url, options) {
		super(options);

		this._url = url;

		options = Util.setOptions(this, options);

		// Set required OpenStreetMap attribution if it hasn't been specified; upgrade to HTTPS so the referrer policy works.
		const tileUrl = new URL(this._url, location.href);
		const urlHostname = tileUrl.hostname;
		const osmHosts = ['tile.openstreetmap.org', 'tile.osm.org'];
		if (osmHosts.some(host => urlHostname.endsWith(host))) {
			if (options.attribution === null) {
				options.attribution = `&copy; <a href="https://www.openstreetmap.org/copyright">${I18n.translate('OpenStreetMap contributors')}</a>`;
			}
			if (tileUrl.protocol === 'http:') {
				tileUrl.protocol = 'https:';
				this._url = tileUrl.toString();
			}
		}

		const {tileSize, zoomOffset, minZoom, maxZoom, minNativeZoom, maxNativeZoom} = this.options;
		this._nonRetinaOptions = {tileSize, zoomOffset, minZoom, maxZoom, minNativeZoom, maxNativeZoom};
		this._applyRetina();

		if (typeof this.options.subdomains === 'string') {
			this.options.subdomains = this.options.subdomains.split('');
		}

		this.on('tileunload', this._onTileRemove);

		this.callInitHooks(TileLayer);
	}

	// Detects retina displays (if `detectRetina` is set), adjusting tileSize and zoom levels.
	_applyRetina() {
		Object.assign(this.options, this._nonRetinaOptions);
		this._retina = Browser.retina;

		if (this.options.detectRetina && this._retina && this.options.maxZoom > 0) {

			this.options.tileSize = Math.floor(this.options.tileSize / 2);

			if (!this.options.zoomReverse) {
				this.options.zoomOffset++;
				this.options.maxZoom = Math.max(this.options.minZoom, this.options.maxZoom - 1);
				// do not request tiles beyond the native zoom levels
				if (this.options.maxNativeZoom !== undefined) {
					this.options.maxNativeZoom = Math.max(0, this.options.maxNativeZoom - 1);
				}
				if (this.options.minNativeZoom !== undefined) {
					this.options.minNativeZoom = Math.max(0, this.options.minNativeZoom - 1);
				}
			} else {
				this.options.zoomOffset--;
				this.options.minZoom = Math.min(this.options.maxZoom, this.options.minZoom + 1);
			}

			this.options.minZoom = Math.max(0, this.options.minZoom);
		} else if (!this.options.zoomReverse) {
			// make sure maxZoom is gte minZoom
			this.options.maxZoom = Math.max(this.options.minZoom, this.options.maxZoom);
		} else {
			// make sure minZoom is lte maxZoom
			this.options.minZoom = Math.min(this.options.maxZoom, this.options.minZoom);
		}
	}

	/**
	 * Returns the map events the layer listens to, see `Layer`.
	 * @returns {Record<string, Function>}
	 */
	getEvents() {
		const events = super.getEvents();
		events.pixelratiochange = this._onPixelRatioChange;
		return events;
	}

	// Loads the tiles for the new resolution, see the map's `pixelratiochange` event.
	_onPixelRatioChange() {
		if (Browser.retina === this._retina) { return; }
		const map = this._map;
		this._applyRetina();
		if (this.options.detectRetina) {
			map._removeZoomLimit(this);
			map._addZoomLimit(this);
			this._invalidateAll();
			this._resetView();
		} else if (this._url.includes('{r}')) {
			this.redraw();
		}
	}

	/**
	 * Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
	 * If the URL does not change, the layer will not be redrawn unless
	 * the noRedraw parameter is set to false.
	 * The current tiles stay visible until the new tiles have loaded, to avoid flickering.
	 * @param {string} url
	 * @param {boolean} [noRedraw]
	 * @returns {this}
	 */
	setUrl(url, noRedraw) {
		if (this._url === url && noRedraw === undefined) {
			noRedraw = true;
		}

		this._url = url;

		if (!noRedraw) {
			this._keepCurrentTiles();
			this.redraw();
		}
		return this;
	}

	/**
	 * Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
	 * to return an `<img>` HTML element with the appropriate image URL given `coords`. The
	 * `done` callback is called when the tile has been loaded.
	 * @param {Point} coords
	 * @param {TileDoneCallback} [done]
	 * @returns {HTMLImageElement}
	 */
	createTile(coords, done) {
		const tile = document.createElement('img');

		DomEvent.on(tile, 'load', this._tileOnLoad.bind(this, done, tile));
		DomEvent.on(tile, 'error', this._tileOnError.bind(this, done, tile));

		if (this.options.crossOrigin || this.options.crossOrigin === '') {
			tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
		}

		// for this new option we follow the documented behavior
		// more closely by only setting the property when string
		if (typeof this.options.referrerPolicy === 'string') {
			tile.referrerPolicy = this.options.referrerPolicy;
		}

		// The alt attribute is set to the empty string,
		// allowing screen readers to ignore the decorative image tiles.
		// https://www.w3.org/WAI/tutorials/images/decorative/
		// https://www.w3.org/TR/html-aria/#el-img-empty-alt
		tile.alt = '';

		const url = this.getTileUrl(coords);
		if (this.options.fetchOptions) {
			this._fetchTile(tile, url, done);
		} else {
			tile.src = url;
		}

		return tile;
	}

	// Loads the tile image with `fetch()`, see the `fetchOptions` option.
	_fetchTile(tile, url, done) {
		const controller = new AbortController(),
		options = {signal: controller.signal, ...this.options.fetchOptions};
		if (typeof this.options.referrerPolicy === 'string') {
			options.referrerPolicy ??= this.options.referrerPolicy;
		}

		this._tileFetches ??= new Map();
		this._tileFetches.set(tile, controller);

		fetch(url, options)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to load the tile ${url}: HTTP ${response.status}`);
				}
				return response.blob();
			})
			.then((blob) => {
				// revoked in `_tileOnLoad()`
				tile.src = URL.createObjectURL(blob);
			})
			.catch((error) => {
				if (!controller.signal.aborted) {
					this._tileOnError(done, tile, error);
				}
			})
			.finally(() => this._tileFetches.delete(tile));
	}

	// Aborts the request of a tile loaded with `fetch()`, returns whether there was one.
	_abortTileFetch(tile) {
		const controller = this._tileFetches?.get(tile);
		if (!controller) { return false; }
		controller.abort();
		this._tileFetches.delete(tile);
		return true;
	}

	/**
	 * Called only internally, returns the URL for a tile given its coordinates.
	 * Classes extending `TileLayer` can override this function to provide custom tile URL
	 * naming schemes.
	 * @group Extension methods
	 * @param {Point} coords
	 * @returns {string}
	 */
	getTileUrl(coords) {
		const data = Object.create(this.options);
		Object.assign(data, {
			r: Browser.retina ? '@2x' : '',
			s: this._getSubdomain(coords),
			x: coords.x,
			y: coords.y,
			z: this._getZoomForUrl()
		});
		if (this._map && !this._map.options.crs.infinite) {
			const invertedY = this._globalTileRange.max.y - coords.y;
			if (this.options.tms) {
				data['y'] = invertedY;
			}
			data['-y'] = invertedY;
		}

		return Util.template(this._url, data);
	}

	_tileOnLoad(done, tile) {
		if (tile.src.startsWith('blob:')) {
			// the image keeps its data, see `_fetchTile()`
			URL.revokeObjectURL(tile.src);
		}
		done(null, tile);
	}

	_tileOnError(done, tile, e) {
		const errorUrl = this.options.errorTileUrl;
		if (errorUrl && tile.getAttribute('src') !== errorUrl) {
			tile.src = errorUrl;
		}
		done(e, tile);
	}

	_onTileRemove(e) {
		e.tile.onload = null;
	}

	_getZoomForUrl() {
		let zoom = this._tileZoom;
		const maxZoom = this.options.maxZoom,
		zoomReverse = this.options.zoomReverse,
		zoomOffset = this.options.zoomOffset;

		if (zoomReverse) {
			zoom = maxZoom - zoom;
		}

		return zoom + zoomOffset;
	}

	_getSubdomain(tilePoint) {
		const index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
		return this.options.subdomains[index];
	}

	// stops loading all tiles in the background layer
	_abortLoading() {
		let i, tile;
		for (i of Object.keys(this._tiles)) {
			if (this._tiles[i].coords.z !== this._tileZoom) {
				tile = this._tiles[i].el;

				tile.onload = Util.falseFn;
				tile.onerror = Util.falseFn;

				if (this._abortTileFetch(tile) || !tile.complete) {
					tile.setAttribute('src', '');
					const coords = this._tiles[i].coords;
					tile.remove();
					delete this._tiles[i];
					this.fire('tileabort', {
						tile,
						coords
					});
				}
			}
		}
	}

	_removeTile(key) {
		const tile = this._tiles[key];
		if (!tile) { return; }

		// Cancels any pending http requests associated with the tile
		this._abortTileFetch(tile.el);
		tile.el.setAttribute('src', '');

		return super._removeTile(key);
	}

	_tileReady(coords, err, tile) {
		if (!this._map || (tile && tile.getAttribute('src') === '')) {
			return;
		}

		return super._tileReady(coords, err, tile);
	}

	_clampZoom(zoom) {
		return Math.round(super._clampZoom(zoom));
	}
}
