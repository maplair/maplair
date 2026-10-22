import type { I18n } from '../../core/I18n.js';
import type { GridLayerOptions } from './GridLayer.js';
import type { TileEvent } from '../../core/Events.js';
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
    static defaultOptions: Partial<TileLayerOptions>;
    /**
     * Instantiates a tile layer object given a [URL template](#tilelayer) and optionally an
     * options object.
     * @param {string} url The URL template.
     * @param {TileLayerOptions & Record<string, unknown>} [options] The options, and the values
     * of custom keys of the URL template.
     */
    constructor(url: string, options?: TileLayerOptions & Record<string, unknown>);
    /**
     * Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
     * If the URL does not change, the layer will not be redrawn unless
     * the noRedraw parameter is set to false.
     * The current tiles stay visible until the new tiles have loaded, to avoid flickering.
     * @param {string} url
     * @param {boolean} [noRedraw]
     * @returns {this}
     */
    setUrl(url: string, noRedraw?: boolean): this;
    /**
     * Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
     * to return an `<img>` HTML element with the appropriate image URL given `coords`. The
     * `done` callback is called when the tile has been loaded.
     * @param {Point} coords
     * @param {TileDoneCallback} [done]
     * @returns {HTMLImageElement}
     */
    createTile(coords: Point, done?: TileDoneCallback): HTMLImageElement;
    /**
     * Called only internally, returns the URL for a tile given its coordinates.
     * Classes extending `TileLayer` can override this function to provide custom tile URL
     * naming schemes.
     * @group Extension methods
     * @param {Point} coords
     * @returns {string}
     */
    getTileUrl(coords: Point): string;
    /** The options of the TileLayer, see [the options](#tilelayeroptions). */
    options: TileLayerOptions;
}
/**
 * Options of `TileLayer`.
 */
export interface TileLayerOptions extends GridLayerOptions {
    /**
     * The minimum zoom level down to which this layer will be
     * displayed (inclusive).
     * @default 0
     */
    minZoom?: number;
    /**
     * The maximum zoom level up to which this layer will be
     * displayed (inclusive).
     * @default 18
     */
    maxZoom?: number;
    /**
     * Subdomains of the tile service. Can be
     * passed in the form of one string (where each letter is a subdomain name) or an array
     * of strings.
     * @default 'abc'
     */
    subdomains?: string|string[];
    /**
     * URL to the tile image to show in place of the
     * tile that failed to load.
     * @default ''
     */
    errorTileUrl?: string;
    /**
     * The zoom number used in tile URLs will be offset
     * with this value.
     * @default 0
     */
    zoomOffset?: number;
    /**
     * If `true`, inverses Y axis numbering for tiles (turn
     * this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
     * @default false
     */
    tms?: boolean;
    /**
     * If set to true, the zoom number used in tile
     * URLs will be reversed (`maxZoom - zoom` instead of `zoom`).
     * @default false
     */
    zoomReverse?: boolean;
    /**
     * If `true` and user is on a retina display, it
     * will request four tiles of half the specified size and a bigger zoom level in place
     * of one to utilize the high resolution.
     * @default false
     */
    detectRetina?: boolean;
    /**
     * Whether the crossOrigin attribute will
     * be added to the tiles. If a String is provided, all tiles will have their crossOrigin
     * attribute set to the String provided. This is needed if you want to access tile pixel
     * data. Refer to
     * [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
     * for valid String values.
     * @default false
     */
    crossOrigin?: boolean|string;
    /**
     * Sets the
     * tiles' `referrerPolicy` attribute set to the String provided. See
     * [`HTMLImageElement.referrerPolicy`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy)
     * for possible values.
     *
     * Tile providers might require you to use a specific referrer policy (e.g. to verify
     * API tokens or prevent abuse). Specifically, if you are using tiles from
     * `tile.openstreetmap.org` or `tile.osm.org`, you
     * [should not change this value](https://operations.osmfoundation.org/policies/tiles/).
     * @default 'strict-origin-when-cross-origin'
     */
    referrerPolicy?: ReferrerPolicy;
    /**
     * If set, the tiles are loaded with
     * [`fetch()`](https://developer.mozilla.org/docs/Web/API/Window/fetch) using these
     * options (see [`RequestInit`](https://developer.mozilla.org/docs/Web/API/RequestInit)),
     * e.g. `{headers: {Authorization: 'Bearer …'}}` for tile servers requiring custom HTTP
     * headers. Requests of tiles that are no longer needed (e.g. after panning or zooming
     * away) are aborted. Cross-origin tile servers have to allow such requests with
     * [CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS) headers.
     * @default null
     */
    fetchOptions?: RequestInit|null;
}
import { GridLayer } from './GridLayer.js';
import type { Point } from '../../geometry/Point.js';
import type { TileDoneCallback } from './GridLayer.js';
