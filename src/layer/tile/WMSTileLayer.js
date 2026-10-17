import {TileLayer} from './TileLayer.js';
import Browser from '../../core/Browser.js';
import {EPSG4326} from '../../geo/crs/EPSG4326.js';
import {Bounds} from '../../geometry/Bounds.js';
/** @import {CRS} from '../../geo/crs/CRS.js' */
/** @import {Point} from '../../geometry/Point.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {TileLayerOptions} from './TileLayer.js' */

/**
 * Options of `WMSTileLayer`. If any custom options not documented here are used, they
 * will be sent to the WMS server as extra parameters in each request URL. This can be
 * useful for
 * [non-standard vendor WMS parameters](https://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
 * @typedef {object} WMSTileLayerOptions
 * @property {string} [layers=''] **(required)** Comma-separated list of WMS layers to
 * show.
 * @property {string} [styles=''] Comma-separated list of WMS styles.
 * @property {string} [format='image/jpeg'] WMS image format (use `'image/png'` for
 * layers with transparency).
 * @property {boolean} [transparent=false] If `true`, the WMS service will return images
 * with transparency.
 * @property {string} [version='1.1.1'] Version of the WMS service to use.
 * @property {CRS|null} [crs=null] Coordinate Reference System to use for the WMS
 * requests, defaults to map CRS. Don't change this if you're not sure what it means.
 * @property {boolean} [uppercase=false] If `true`, WMS request parameter keys will be
 * uppercase.
 * @extends TileLayerOptions
 */

/**
 * Used to display [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services as tile
 * layers on the map. Extends `TileLayer`.
 *
 * @example
 * ```js
 * const nexrad = new WMSTileLayer("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
 * 	layers: 'nexrad-n0r-900913',
 * 	format: 'image/png',
 * 	transparent: true,
 * 	attribution: "Weather data © 2012 IEM Nexrad"
 * });
 * ```
 */
export class WMSTileLayer extends TileLayer {

	static {
		// the WMS parameters among the options, see `WMSTileLayerOptions`
		this.prototype.defaultWmsParams = {
			service: 'WMS',
			request: 'GetMap',
			layers: '',
			styles: '',
			format: 'image/jpeg',
			transparent: false,
			version: '1.1.1'
		};

		this.setDefaultOptions({
			crs: null,
			uppercase: false
		});
	}

	/**
	 * Instantiates a WMS tile layer object given a base URL of the WMS service and a WMS
	 * parameters/options object.
	 * @param {string} url The base URL of the WMS service.
	 * @param {WMSTileLayerOptions & Record<string, unknown>} options The options and WMS
	 * parameters.
	 */
	constructor(url, options) {
		super(url, options);

		const wmsParams = {...this.defaultWmsParams};

		// Options that are unknown in the prototype chain are considered WMS params.
		for (const [key, value] of Object.entries(options)) {
			if (!(key in WMSTileLayer.prototype.options)) {
				wmsParams[key] = value;
			}
		}

		/**
		 * The parameters of the WMS requests, see `setParams()`.
		 * @type {Record<string, any>}
		 */
		this.wmsParams = wmsParams;
		this._updateWmsSize();

		this.callInitHooks(WMSTileLayer);
	}

	// The size of the requested images: the tile size, doubled on retina displays with `detectRetina`.
	_updateWmsSize() {
		const realRetina = this.options.detectRetina && Browser.retina ? 2 : 1;
		const tileSize = this.getTileSize();

		this.wmsParams.width = tileSize.x * realRetina;
		this.wmsParams.height = tileSize.y * realRetina;
	}

	_applyRetina() {
		super._applyRetina();
		if (this.wmsParams) {
			this._updateWmsSize();
		}
	}

	/**
	 * Uses the CRS of the map (unless the `crs` option is set) and loads the tiles.
	 * @param {MaplairMap} map
	 */
	onAdd(map) {
		this._updateCrs();
		super.onAdd(map);
	}

	_updateCrs() {
		this._crs = this.options.crs ?? this._map.options.crs;
		this._wmsVersion = parseFloat(this.wmsParams.version);

		const projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
		this.wmsParams[projectionKey] = this._crs.code;
	}

	/**
	 * Returns the map events the layer listens to, see `Layer`.
	 * @returns {Record<string, Function>}
	 */
	getEvents() {
		const events = super.getEvents();
		events.crschange = this._updateCrs;
		return events;
	}

	/**
	 * Called only internally, returns the URL of the `GetMap` request for a tile given its
	 * coordinates.
	 * @group Extension methods
	 * @param {Point} coords
	 * @returns {string}
	 */
	getTileUrl(coords) {

		const tileBounds = this._tileCoordsToNwSe(coords),
		crs = this._crs,
		bounds = new Bounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])),
		min = bounds.min,
		max = bounds.max,
		bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ?
			[min.y, min.x, max.y, max.x] :
			[min.x, min.y, max.x, max.y]).join(',');
		const url = new URL(super.getTileUrl(coords));
		for (const [k, v] of Object.entries({...this.wmsParams, bbox})) {
			url.searchParams.append(this.options.uppercase ? k.toUpperCase() : k, v);
		}
		return url.toString();
	}

	/**
	 * Returns the URL of the legend image (a `GetLegendGraphic` request) of the first
	 * of the `layers` (with its style, if any), with the version, format and `uppercase`
	 * option of the layer. `params` change or add parameters, e.g. `{layer: 'roads',
	 * width: 20, height: 20}` or vendor parameters like `legend_options`.
	 * @param {Record<string, any>} [params]
	 * @returns {string}
	 */
	getLegendUrl(params) {
		const {version, format, layers, styles} = this.wmsParams,
		url = new URL(this._url, document.baseURI);
		for (const [k, v] of Object.entries({
			service: 'WMS',
			request: 'GetLegendGraphic',
			version,
			format,
			layer: layers.split(',')[0],
			style: styles?.split(',')[0] || undefined,
			// required by the WMS 1.3 profile of SLD
			sld_version: parseFloat(version) >= 1.3 ? '1.1.0' : undefined,
			...params
		})) {
			if (v !== undefined) {
				url.searchParams.set(this.options.uppercase ? k.toUpperCase() : k, v);
			}
		}
		return url.toString();
	}

	/**
	 * Merges an object with the new parameters and re-requests tiles on the current screen
	 * (unless `noRedraw` was set to true).
	 * @param {Record<string, any>} params
	 * @param {boolean} [noRedraw]
	 * @returns {this}
	 */
	setParams(params, noRedraw) {

		Object.assign(this.wmsParams, params);

		if (!noRedraw) {
			this.redraw();
		}

		return this;
	}
}
