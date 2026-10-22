import type { EPSG4326 } from '../../geo/crs/EPSG4326.js';
import type { Bounds } from '../../geometry/Bounds.js';
import type { Point } from '../../geometry/Point.js';
import type { MaplairMap } from '../../map/Map.js';
import type { TileLayerOptions } from './TileLayer.js';
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
    /**
     * The default WMS parameters, which the options override, see `WMSTileLayerOptions`.
     * @type {Record<string, any>}
     */
    static defaultWmsParams: Record<string, any>;
    static defaultOptions: Partial<WMSTileLayerOptions>;
    /**
     * Instantiates a WMS tile layer object given a base URL of the WMS service and a WMS
     * parameters/options object.
     * @param {string} url The base URL of the WMS service.
     * @param {WMSTileLayerOptions & Record<string, unknown>} options The options and WMS
     * parameters.
     */
    constructor(url: string, options: WMSTileLayerOptions & Record<string, unknown>);
    /**
     * The parameters of the WMS requests, see `setParams()`.
     * @type {Record<string, any>}
     */
    wmsParams: Record<string, any>;
    /**
     * Returns the URL of the legend image (a `GetLegendGraphic` request) of the first
     * of the `layers` (with its style, if any), with the version, format and `uppercase`
     * option of the layer. `params` change or add parameters, e.g. `{layer: 'roads',
     * width: 20, height: 20}` or vendor parameters like `legend_options`.
     * @param {Record<string, any>} [params]
     * @returns {string}
     */
    getLegendUrl(params?: Record<string, any>): string;
    /**
     * Merges an object with the new parameters and re-requests tiles on the current screen
     * (unless `noRedraw` was set to true). The current tiles stay visible until the new
     * tiles have loaded, to avoid flickering.
     * @param {Record<string, any>} params
     * @param {boolean} [noRedraw]
     * @returns {this}
     */
    setParams(params: Record<string, any>, noRedraw?: boolean): this;
    /** The options of the WMSTileLayer, see [the options](#wmstilelayeroptions). */
    options: WMSTileLayerOptions;
}
/**
 * Options of `WMSTileLayer`. If any custom options not documented here are used, they
 * will be sent to the WMS server as extra parameters in each request URL. This can be
 * useful for
 * [non-standard vendor WMS parameters](https://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
 */
export interface WMSTileLayerOptions extends TileLayerOptions {
    /**
     * **(required)** Comma-separated list of WMS layers to
     * show.
     * @default ''
     */
    layers?: string;
    /**
     * Comma-separated list of WMS styles.
     * @default ''
     */
    styles?: string;
    /**
     * WMS image format (use `'image/png'` for
     * layers with transparency).
     * @default 'image/jpeg'
     */
    format?: string;
    /**
     * If `true`, the WMS service will return images
     * with transparency.
     * @default false
     */
    transparent?: boolean;
    /**
     * Version of the WMS service to use.
     * @default '1.1.1'
     */
    version?: string;
    /**
     * Coordinate Reference System to use for the WMS
     * requests, defaults to map CRS. Don't change this if you're not sure what it means.
     * @default null
     */
    crs?: CRS|null;
    /**
     * If `true`, WMS request parameter keys will be
     * uppercase.
     * @default false
     */
    uppercase?: boolean;
}
import { TileLayer } from './TileLayer.js';
import type { CRS } from '../../geo/crs/CRS.js';
