import type Browser from '../../core/Browser.js';
import type { MaplairEvent, TileEvent, TileErrorEvent } from '../../core/Events.js';
import type { LayerOptions } from '../Layer.js';
/** @import {LatLngBoundsExpression} from '../../geo/LatLngBounds.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {MaplairEvent, TileEvent, TileErrorEvent} from '../../core/Events.js' */
/** @import {LayerOptions} from '../Layer.js' */
/**
 * Options of `GridLayer`.
 * @typedef {object} GridLayerOptions
 * @property {number|Point} [tileSize=256] Width and height of tiles in the grid. Use a
 * number if width and height are equal, or `Point(width, height)` otherwise.
 * @property {number} [opacity=1] Opacity of the tiles. Can be used in the `createTile()`
 * function.
 * @property {string|null} [placeholder=null] A CSS
 * [`background`](https://developer.mozilla.org/docs/Web/CSS/background) shown in place
 * of tiles while they are loading, e.g. `'#ddd'` or
 * `'url(loading.svg) center no-repeat #eee'`. Tiles with a placeholder appear without
 * fading in.
 * @property {boolean} [updateWhenIdle] Load new tiles only when panning ends. Defaults
 * to `false` (tiles are loaded _during_ panning) unless the browser is configured for
 * reduced motion.
 * @property {boolean} [updateWhenZooming=true] By default, a smooth zoom animation
 * (during a [pinch zoom](#map-pinchzoom) or a [`flyTo()`](#map-flyto)) will update grid
 * layers every integer zoom level. Setting this option to `false` will update the grid
 * layer only when the smooth animation ends.
 * @property {number} [updateInterval] Tiles will not update more than once every
 * `updateInterval` milliseconds when panning. Defaults to `200`, increased to five
 * seconds if the browser is configured for reduced motion.
 * @property {number} [zIndex=1] The explicit zIndex of the tile layer.
 * @property {LatLngBoundsExpression|null} [bounds=null] If set, tiles will only be
 * loaded inside the set `LatLngBounds`.
 * @property {number} [minZoom=0] The minimum zoom level down to which this layer will
 * be displayed (inclusive).
 * @property {number} [maxZoom] The maximum zoom level up to which this layer will be
 * displayed (inclusive).
 * @property {number} [maxNativeZoom] Maximum zoom number the tile source has available.
 * If it is specified, the tiles on all zoom levels higher than `maxNativeZoom` will be
 * loaded from `maxNativeZoom` level and auto-scaled.
 * @property {number} [minNativeZoom] Minimum zoom number the tile source has available.
 * If it is specified, the tiles on all zoom levels lower than `minNativeZoom` will be
 * loaded from `minNativeZoom` level and auto-scaled.
 * @property {boolean} [noWrap=false] Whether the layer is wrapped around the
 * antimeridian. If `true`, the GridLayer will only be displayed once at low zoom
 * levels. Has no effect when the [map CRS](#maplairmapoptions-crs) doesn't wrap around.
 * Can be used in combination with [`bounds`](#gridlayeroptions-bounds) to prevent
 * requesting tiles outside the CRS limits.
 * @property {string} [pane='tilePane'] `Map pane` where the grid layer will be added.
 * @property {string} [className=''] A custom class name to assign to the tile layer.
 * Empty by default.
 * @property {boolean} [pixelated=false] Whether to scale the tiles with
 * nearest-neighbour interpolation (`image-rendering: pixelated`) instead of smoothing
 * them, so that their pixels stay crisp, e.g. while zooming or beyond `maxNativeZoom`.
 * Useful for raster data, pixel art or scientific imagery.
 * @property {number} [keepBuffer=2] When panning the map, keep this many rows and
 * columns of tiles before unloading them.
 * @extends LayerOptions
 */
/**
 * The callback of asynchronous `createTile()`, to be called with an error (or `null`)
 * and the tile when the tile has finished loading and drawing.
 * @typedef {(error: any, tile: HTMLElement) => void} TileDoneCallback
 */
/**
 * Generic class for handling a tiled grid of HTML elements. This is the base class for
 * all tile layers and replaces `TileLayer.Canvas`. GridLayer can be extended to create
 * a tiled grid of HTML elements like `<canvas>`, `<img>` or `<div>`. GridLayer will
 * handle creating and animating these DOM elements for you.
 *
 * Layers extending `GridLayer` shall reimplement the [`createTile()`](#gridlayer-createtile)
 * method.
 *
 * @example
 * ### Synchronous usage
 *
 * To create a custom layer, extend GridLayer and implement the `createTile()` method,
 * which will be passed a `Point` object with the `x`, `y`, and `z` (zoom level)
 * coordinates to draw your tile.
 *
 * ```js
 * class CanvasLayer extends GridLayer {
 *     createTile(coords) {
 *         // create a <canvas> element for drawing
 *         const tile = DomUtil.create('canvas', 'maplair-tile');
 *
 *         // setup tile width and height according to the options
 *         const size = this.getTileSize();
 *         tile.width = size.x;
 *         tile.height = size.y;
 *
 *         // get a canvas context and draw something on it using coords.x, coords.y and coords.z
 *         const ctx = tile.getContext('2d');
 *
 *         // return the tile so it can be rendered on screen
 *         return tile;
 *     }
 * }
 * ```
 *
 * @example
 * ### Asynchronous usage
 *
 * Tile creation can also be asynchronous, this is useful when using a third-party
 * drawing library. Once the tile is finished drawing it can be passed to the `done()`
 * callback.
 *
 * ```js
 * class CanvasLayer extends GridLayer {
 *     createTile(coords, done) {
 *         const error;
 *
 *         // create a <canvas> element for drawing
 *         const tile = DomUtil.create('canvas', 'maplair-tile');
 *
 *         // setup tile width and height according to the options
 *         const size = this.getTileSize();
 *         tile.width = size.x;
 *         tile.height = size.y;
 *
 *         // draw something asynchronously and pass the tile to the done() callback
 *         setTimeout(function() {
 *             done(error, tile);
 *         }, 1000);
 *
 *         return tile;
 *     }
 * }
 * ```
 *
 * @fires loading {MaplairEvent} Fired when the grid layer starts loading tiles.
 * @fires tileunload {TileEvent} Fired when a tile is removed (e.g. when a tile goes off
 * the screen).
 * @fires tileloadstart {TileEvent} Fired when a tile is requested and starts loading.
 * @fires tileerror {TileErrorEvent} Fired when there is an error loading a tile.
 * @fires tileload {TileEvent} Fired when a tile loads.
 * @fires load {MaplairEvent} Fired when the grid layer loaded all visible tiles.
 */
export class GridLayer extends Layer {
    /**
     * Creates a new instance of GridLayer with the supplied options.
     * @param {GridLayerOptions} [options]
     */
    constructor(options?: GridLayerOptions);
    /**
     * Creates the container of the tiles and loads the tiles.
     * @overload
     * @param {MaplairMap} map
     * @returns {void}
     */
    onAdd(map: MaplairMap): void;
    /**
     * Registers the zoom limits of the layer on the map.
     * @param {MaplairMap} map
     */
    beforeAdd(map: MaplairMap): void;
    /**
     * Removes the tiles from the map.
     * @param {MaplairMap} map
     */
    onRemove(map: MaplairMap): void;
    /**
     * Brings the tile layer to the top of all tile layers.
     * @returns {this}
     */
    bringToFront(): this;
    /**
     * Brings the tile layer to the bottom of all tile layers.
     * @returns {this}
     */
    bringToBack(): this;
    /**
     * Returns the HTML element that contains the tiles for this layer.
     * @returns {HTMLElement}
     */
    getContainer(): HTMLElement;
    /**
     * Changes the [opacity](#gridlayeroptions-opacity) of the grid layer.
     * @param {number} opacity
     * @returns {this}
     */
    setOpacity(opacity: number): this;
    /**
     * Changes the [zIndex](#gridlayeroptions-zindex) of the grid layer.
     * @param {number} zIndex
     * @returns {this}
     */
    setZIndex(zIndex: number): this;
    /**
     * Returns `true` if any tile in the grid layer has not finished loading.
     * @returns {boolean}
     */
    isLoading(): boolean;
    /**
     * Causes the layer to clear all the tiles and request them again.
     * @returns {this}
     */
    redraw(): this;
    /**
     * Returns the map events the layer listens to, see `Layer`.
     * @returns {Record<string, Function>}
     */
    getEvents(): Record<string, Function>;
    /**
     * Called only internally, must be overridden by classes extending `GridLayer`.
     * Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
     * is specified, it must be called when the tile has finished loading and drawing.
     * @group Extension methods
     * @overload
     * @param {Point} coords The `x`, `y` and `z` (zoom level) coordinates of the tile.
     * @param {TileDoneCallback} [done]
     * @returns {HTMLElement}
     */
    createTile(coords: Point, done?: TileDoneCallback | undefined): HTMLElement;
    /**
     * Normalizes the [tileSize option](#gridlayeroptions-tilesize) into a point. Used by
     * the `createTile()` method.
     * @returns {Point}
     */
    getTileSize(): Point;
    /** The options of the GridLayer, see [the options](#gridlayeroptions). */
    options: GridLayerOptions;
}
/**
 * Options of `GridLayer`.
 */
export interface GridLayerOptions extends LayerOptions {
    /**
     * Width and height of tiles in the grid. Use a
     * number if width and height are equal, or `Point(width, height)` otherwise.
     * @default 256
     */
    tileSize?: number|Point;
    /**
     * Opacity of the tiles. Can be used in the `createTile()`
     * function.
     * @default 1
     */
    opacity?: number;
    /**
     * A CSS
     * [`background`](https://developer.mozilla.org/docs/Web/CSS/background) shown in place
     * of tiles while they are loading, e.g. `'#ddd'` or
     * `'url(loading.svg) center no-repeat #eee'`. Tiles with a placeholder appear without
     * fading in.
     * @default null
     */
    placeholder?: string|null;
    /**
     * Load new tiles only when panning ends. Defaults
     * to `false` (tiles are loaded _during_ panning) unless the browser is configured for
     * reduced motion.
     */
    updateWhenIdle?: boolean;
    /**
     * By default, a smooth zoom animation
     * (during a [pinch zoom](#map-pinchzoom) or a [`flyTo()`](#map-flyto)) will update grid
     * layers every integer zoom level. Setting this option to `false` will update the grid
     * layer only when the smooth animation ends.
     * @default true
     */
    updateWhenZooming?: boolean;
    /**
     * Tiles will not update more than once every
     * `updateInterval` milliseconds when panning. Defaults to `200`, increased to five
     * seconds if the browser is configured for reduced motion.
     */
    updateInterval?: number;
    /**
     * The explicit zIndex of the tile layer.
     * @default 1
     */
    zIndex?: number;
    /**
     * If set, tiles will only be
     * loaded inside the set `LatLngBounds`.
     * @default null
     */
    bounds?: LatLngBoundsExpression|null;
    /**
     * The minimum zoom level down to which this layer will
     * be displayed (inclusive).
     * @default 0
     */
    minZoom?: number;
    /**
     * The maximum zoom level up to which this layer will be
     * displayed (inclusive).
     */
    maxZoom?: number;
    /**
     * Maximum zoom number the tile source has available.
     * If it is specified, the tiles on all zoom levels higher than `maxNativeZoom` will be
     * loaded from `maxNativeZoom` level and auto-scaled.
     */
    maxNativeZoom?: number;
    /**
     * Minimum zoom number the tile source has available.
     * If it is specified, the tiles on all zoom levels lower than `minNativeZoom` will be
     * loaded from `minNativeZoom` level and auto-scaled.
     */
    minNativeZoom?: number;
    /**
     * Whether the layer is wrapped around the
     * antimeridian. If `true`, the GridLayer will only be displayed once at low zoom
     * levels. Has no effect when the [map CRS](#maplairmapoptions-crs) doesn't wrap around.
     * Can be used in combination with [`bounds`](#gridlayeroptions-bounds) to prevent
     * requesting tiles outside the CRS limits.
     * @default false
     */
    noWrap?: boolean;
    /**
     * `Map pane` where the grid layer will be added.
     * @default 'tilePane'
     */
    pane?: string;
    /**
     * A custom class name to assign to the tile layer.
     * Empty by default.
     * @default ''
     */
    className?: string;
    /**
     * Whether to scale the tiles with
     * nearest-neighbour interpolation (`image-rendering: pixelated`) instead of smoothing
     * them, so that their pixels stay crisp, e.g. while zooming or beyond `maxNativeZoom`.
     * Useful for raster data, pixel art or scientific imagery.
     * @default false
     */
    pixelated?: boolean;
    /**
     * When panning the map, keep this many rows and
     * columns of tiles before unloading them.
     * @default 2
     */
    keepBuffer?: number;
}
/**
 * The callback of asynchronous `createTile()`, to be called with an error (or `null`)
 * and the tile when the tile has finished loading and drawing.
 */
export type TileDoneCallback = (error: any, tile: HTMLElement) => void;
import { Layer } from '../Layer.js';
import type { MaplairMap } from '../../map/Map.js';
import { Point } from '../../geometry/Point.js';
import { Bounds } from '../../geometry/Bounds.js';
import { LatLngBounds } from '../../geo/LatLngBounds.js';
import type { LatLngBoundsExpression } from '../../geo/LatLngBounds.js';
