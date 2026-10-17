import { falseFn, setOptions, throttle, wrapNum } from "../../core/Util.js";
import { Point } from "../../geometry/Point.js";
import Browser_default from "../../core/Browser.js";
import { create, setPosition, setTransform, toBack, toFront } from "../../dom/DomUtil.js";
import { Layer } from "../Layer.js";
import { Bounds } from "../../geometry/Bounds.js";
import { LatLngBounds } from "../../geo/LatLngBounds.js";
//#region src/layer/tile/GridLayer.js
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
var GridLayer = class GridLayer extends Layer {
	static {
		this.setDefaultOptions({
			tileSize: 256,
			opacity: 1,
			placeholder: null,
			updateWhenIdle: !Browser_default.reducedMotion,
			updateWhenZooming: true,
			updateInterval: Browser_default.reducedMotion ? 5e3 : 200,
			zIndex: 1,
			bounds: null,
			minZoom: 0,
			maxZoom: void 0,
			maxNativeZoom: void 0,
			minNativeZoom: void 0,
			noWrap: false,
			pane: "tilePane",
			className: "",
			pixelated: false,
			keepBuffer: 2
		});
	}
	/**
	* Creates a new instance of GridLayer with the supplied options.
	* @param {GridLayerOptions} [options]
	*/
	constructor(options) {
		super();
		setOptions(this, options);
		this.callInitHooks(GridLayer);
	}
	/**
	* Creates the container of the tiles and loads the tiles.
	* @overload
	* @param {MaplairMap} map
	* @returns {void}
	*/
	onAdd() {
		this._initContainer();
		this._levels = {};
		this._tiles = {};
		this._resetView();
	}
	/**
	* Registers the zoom limits of the layer on the map.
	* @param {MaplairMap} map
	*/
	beforeAdd(map) {
		map._addZoomLimit(this);
	}
	/**
	* Removes the tiles from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		this._removeKeptLevel();
		this._removeAllTiles();
		this._container.remove();
		map._removeZoomLimit(this);
		this._container = null;
		this._tileZoom = void 0;
		clearTimeout(this._pruneTimeout);
	}
	/**
	* Brings the tile layer to the top of all tile layers.
	* @returns {this}
	*/
	bringToFront() {
		if (this._map) {
			toFront(this._container);
			this._setAutoZIndex(Math.max);
		}
		return this;
	}
	/**
	* Brings the tile layer to the bottom of all tile layers.
	* @returns {this}
	*/
	bringToBack() {
		if (this._map) {
			toBack(this._container);
			this._setAutoZIndex(Math.min);
		}
		return this;
	}
	/**
	* Returns the HTML element that contains the tiles for this layer.
	* @returns {HTMLElement}
	*/
	getContainer() {
		return this._container;
	}
	/**
	* Changes the [opacity](#gridlayeroptions-opacity) of the grid layer.
	* @param {number} opacity
	* @returns {this}
	*/
	setOpacity(opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	}
	/**
	* Changes the [zIndex](#gridlayeroptions-zindex) of the grid layer.
	* @param {number} zIndex
	* @returns {this}
	*/
	setZIndex(zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();
		return this;
	}
	/**
	* Returns `true` if any tile in the grid layer has not finished loading.
	* @returns {boolean}
	*/
	isLoading() {
		return this._loading;
	}
	/**
	* Causes the layer to clear all the tiles and request them again.
	* @returns {this}
	*/
	redraw() {
		if (this._map) {
			this._removeAllTiles();
			const tileZoom = this._clampZoom(this._map.getZoom());
			if (tileZoom !== this._tileZoom) {
				this._tileZoom = tileZoom;
				this._updateLevels();
			}
			this._update();
		}
		return this;
	}
	/**
	* Returns the map events the layer listens to, see `Layer`.
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		const events = {
			viewprereset: this._invalidateAll,
			viewreset: this._resetView,
			zoom: this._resetView,
			moveend: this._onMoveEnd
		};
		if (!this.options.updateWhenIdle) {
			if (!this._onMove) this._onMove = throttle(this._onMoveEnd, this.options.updateInterval, this);
			events.move = this._onMove;
		}
		if (this._zoomAnimated) events.zoomanim = this._animateZoom;
		return events;
	}
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
	createTile() {
		return document.createElement("div");
	}
	/**
	* Normalizes the [tileSize option](#gridlayeroptions-tilesize) into a point. Used by
	* the `createTile()` method.
	* @returns {Point}
	*/
	getTileSize() {
		const s = this.options.tileSize;
		return s instanceof Point ? s : new Point(s, s);
	}
	_updateZIndex() {
		if (this._container && this.options.zIndex !== void 0 && this.options.zIndex !== null) this._container.style.zIndex = this.options.zIndex;
	}
	_setAutoZIndex(compare) {
		const layers = this.getPane().children;
		let edgeZIndex = -compare(-Infinity, Infinity);
		for (const layer of layers) {
			const zIndex = layer.style.zIndex;
			if (layer !== this._container && zIndex) edgeZIndex = compare(edgeZIndex, +zIndex);
		}
		if (isFinite(edgeZIndex)) {
			this.options.zIndex = edgeZIndex + compare(-1, 1);
			this._updateZIndex();
		}
	}
	_updateOpacity() {
		if (!this._map) return;
		this._container.style.opacity = this.options.opacity;
		const now = Date.now();
		let nextFrame = false, willPrune = false;
		for (const tile of Object.values(this._tiles ?? {})) {
			if (!tile.current || !tile.loaded) continue;
			const fade = tile.noFade ? 1 : Math.min(1, (now - tile.loaded) / 200);
			tile.el.style.opacity = fade;
			if (fade < 1) nextFrame = true;
			else {
				if (tile.active) willPrune = true;
				else this._onOpaqueTile(tile);
				tile.active = true;
			}
		}
		if (willPrune && !this._noPrune) this._pruneTiles();
		if (nextFrame) {
			cancelAnimationFrame(this._fadeFrame);
			this._fadeFrame = requestAnimationFrame(this._updateOpacity.bind(this));
		}
	}
	_onOpaqueTile() {}
	_initContainer() {
		if (this._container) return;
		this._container = create("div", `maplair-layer ${this.options.className ?? ""}`);
		this._container.classList.toggle("maplair-pixelated", !!this.options.pixelated);
		this._updateZIndex();
		if (this.options.opacity < 1) this._updateOpacity();
		this.getPane().appendChild(this._container);
	}
	_keepCurrentTiles() {
		const zoom = this._tileZoom, level = this._levels?.[zoom];
		if (!this._map || !level || this._keptLevel) return;
		const tiles = [];
		for (const [key, tile] of Object.entries(this._tiles)) if (tile.coords.z === zoom && tile.loaded) {
			tiles.push(tile);
			delete this._tiles[key];
		}
		delete this._levels[zoom];
		level.el.style.zIndex = -1;
		this._keptLevel = {
			level,
			tiles
		};
		this._updateLevels();
		this.on("load", this._onLoadKeptLevel, this);
		this._map.on("zoomstart viewprereset", this._removeKeptLevel, this);
	}
	_onLoadKeptLevel() {
		if (this._map._fadeAnimated) {
			clearTimeout(this._keptLevelTimeout);
			this._keptLevelTimeout = setTimeout(this._removeKeptLevel.bind(this), 250);
		} else this._removeKeptLevel();
	}
	_removeKeptLevel() {
		if (!this._keptLevel) return;
		const { level, tiles } = this._keptLevel;
		this._keptLevel = null;
		clearTimeout(this._keptLevelTimeout);
		this.off("load", this._onLoadKeptLevel, this);
		this._map.off("zoomstart viewprereset", this._removeKeptLevel, this);
		level.el.remove();
		for (const tile of tiles) this.fire("tileunload", {
			tile: tile.el,
			coords: tile.coords
		});
	}
	_updateLevels() {
		const zoom = this._tileZoom, maxZoom = this.options.maxZoom;
		if (zoom === void 0) return;
		for (let z of Object.keys(this._levels)) {
			z = Number(z);
			if (this._levels[z].el.children.length || z === zoom) {
				this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
				this._onUpdateLevel(z);
			} else {
				this._levels[z].el.remove();
				this._removeTilesAtZoom(z);
				this._onRemoveLevel(z);
				delete this._levels[z];
			}
		}
		let level = this._levels[zoom];
		const map = this._map;
		if (!level) {
			level = this._levels[zoom] = {};
			level.el = create("div", "maplair-tile-container maplair-zoom-animated", this._container);
			level.el.style.zIndex = maxZoom;
			level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
			level.zoom = zoom;
			this._setZoomTransform(level, map.getCenter(), map.getZoom());
			falseFn(level.el.offsetWidth);
			this._onCreateLevel(level);
		}
		this._level = level;
		return level;
	}
	_onUpdateLevel() {}
	_onRemoveLevel() {}
	_onCreateLevel() {}
	_pruneTiles() {
		if (!this._map) return;
		const zoom = this._map.getZoom();
		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			this._removeAllTiles();
			return;
		}
		for (const tile of Object.values(this._tiles)) tile.retain = tile.current;
		for (const tile of Object.values(this._tiles)) if (tile.current && !tile.active) {
			const coords = tile.coords;
			if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
		}
		for (const [key, tile] of Object.entries(this._tiles)) if (!tile.retain) this._removeTile(key);
	}
	_removeTilesAtZoom(zoom) {
		for (const [key, tile] of Object.entries(this._tiles)) if (tile.coords.z === zoom) this._removeTile(key);
	}
	_removeAllTiles() {
		for (const key of Object.keys(this._tiles)) this._removeTile(key);
	}
	_invalidateAll() {
		for (const z of Object.keys(this._levels)) {
			this._levels[z].el.remove();
			this._onRemoveLevel(Number(z));
			delete this._levels[z];
		}
		this._removeAllTiles();
		this._tileZoom = void 0;
	}
	_retainParent(x, y, z, minZoom) {
		const x2 = Math.floor(x / 2), y2 = Math.floor(y / 2), z2 = z - 1, coords2 = new Point(+x2, +y2);
		coords2.z = +z2;
		const key = this._tileCoordsToKey(coords2), tile = this._tiles[key];
		if (tile?.active) {
			tile.retain = true;
			return true;
		} else if (tile?.loaded) tile.retain = true;
		if (z2 > minZoom) return this._retainParent(x2, y2, z2, minZoom);
		return false;
	}
	_retainChildren(x, y, z, maxZoom) {
		for (let i = 2 * x; i < 2 * x + 2; i++) for (let j = 2 * y; j < 2 * y + 2; j++) {
			const coords = new Point(i, j);
			coords.z = z + 1;
			const key = this._tileCoordsToKey(coords), tile = this._tiles[key];
			if (tile?.active) {
				tile.retain = true;
				continue;
			} else if (tile?.loaded) tile.retain = true;
			if (z + 1 < maxZoom) this._retainChildren(i, j, z + 1, maxZoom);
		}
	}
	_resetView(e) {
		const animating = e && (e.pinch || e.flyTo || e.continuous);
		this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
	}
	_animateZoom(e) {
		this._setView(e.center, e.zoom, true, e.noUpdate);
	}
	_clampZoom(zoom) {
		const options = this.options;
		if (void 0 !== options.minNativeZoom && zoom < options.minNativeZoom) return options.minNativeZoom;
		if (void 0 !== options.maxNativeZoom && options.maxNativeZoom < zoom) return options.maxNativeZoom;
		return zoom;
	}
	_setView(center, zoom, noPrune, noUpdate) {
		let tileZoom = Math.round(zoom);
		if (this.options.maxZoom !== void 0 && tileZoom > this.options.maxZoom || this.options.minZoom !== void 0 && tileZoom < this.options.minZoom) tileZoom = void 0;
		else tileZoom = this._clampZoom(tileZoom);
		const tileZoomChanged = this.options.updateWhenZooming && tileZoom !== this._tileZoom;
		if (!noUpdate || tileZoomChanged) {
			this._tileZoom = tileZoom;
			if (this._abortLoading) this._abortLoading();
			this._updateLevels();
			this._resetGrid();
			if (tileZoom !== void 0) this._update(center);
			if (!noPrune) this._pruneTiles();
			this._noPrune = !!noPrune;
		}
		this._setZoomTransforms(center, zoom);
	}
	_setZoomTransforms(center, zoom) {
		for (const level of Object.values(this._levels)) this._setZoomTransform(level, center, zoom);
	}
	_setZoomTransform(level, center, zoom) {
		const scale = this._map.getZoomScale(zoom, level.zoom), translate = level.origin.multiplyBy(scale).subtract(this._map._getNewPixelOrigin(center, zoom)).round();
		setTransform(level.el, translate, scale);
	}
	_resetGrid() {
		const map = this._map, crs = map.options.crs, tileSize = this._tileSize = this.getTileSize(), tileZoom = this._tileZoom;
		const bounds = this._map.getPixelWorldBounds(this._tileZoom);
		if (bounds) this._globalTileRange = this._pxBoundsToTileRange(bounds);
		this._wrapX = crs.wrapLng && !this.options.noWrap && [Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x), Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)];
		this._wrapY = crs.wrapLat && !this.options.noWrap && [Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x), Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)];
	}
	_onMoveEnd() {
		if (!this._map || this._map._animatingZoom) return;
		this._update();
	}
	_getTiledPixelBounds(center) {
		const map = this._map, mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(), scale = map.getZoomScale(mapZoom, this._tileZoom), pixelCenter = map.project(center, this._tileZoom).floor(), halfSize = map.getSize().divideBy(scale * 2);
		return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
	}
	_update(center) {
		const map = this._map;
		if (!map) return;
		const zoom = this._clampZoom(map.getZoom());
		if (center === void 0) center = map.getCenter();
		if (this._tileZoom === void 0) return;
		const pixelBounds = this._getTiledPixelBounds(center), tileRange = this._pxBoundsToTileRange(pixelBounds), tileCenter = tileRange.getCenter(), queue = [], margin = this.options.keepBuffer, noPruneRange = new Bounds(tileRange.getBottomLeft().subtract([margin, -margin]), tileRange.getTopRight().add([margin, -margin]));
		if (!(isFinite(tileRange.min.x) && isFinite(tileRange.min.y) && isFinite(tileRange.max.x) && isFinite(tileRange.max.y))) throw new Error("Attempted to load an infinite number of tiles");
		for (const tile of Object.values(this._tiles)) {
			const c = tile.coords;
			if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) tile.current = false;
		}
		if (Math.abs(zoom - this._tileZoom) > 1) {
			this._setView(center, zoom);
			return;
		}
		for (let j = tileRange.min.y; j <= tileRange.max.y; j++) for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
			const coords = new Point(i, j);
			coords.z = this._tileZoom;
			if (!this._isValidTile(coords)) continue;
			const tile = this._tiles[this._tileCoordsToKey(coords)];
			if (tile) tile.current = true;
			else queue.push(coords);
		}
		queue.sort((a, b) => a.distanceTo(tileCenter) - b.distanceTo(tileCenter));
		if (queue.length !== 0) {
			if (!this._loading) {
				this._loading = true;
				this.fire("loading");
				this._map._onLayerLoading();
			}
			const fragment = document.createDocumentFragment();
			for (const q of queue) this._addTile(q, fragment);
			this._level.el.appendChild(fragment);
		}
	}
	_isValidTile(coords) {
		const crs = this._map.options.crs;
		if (!crs.infinite) {
			const bounds = this._globalTileRange;
			if (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x) || !crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y)) return false;
		}
		if (!this.options.bounds) return true;
		const tileBounds = this._tileCoordsToBounds(coords);
		return new LatLngBounds(this.options.bounds).overlaps(tileBounds);
	}
	_keyToBounds(key) {
		return this._tileCoordsToBounds(this._keyToTileCoords(key));
	}
	_tileCoordsToNwSe(coords) {
		const map = this._map, tileSize = this.getTileSize(), nwPoint = coords.scaleBy(tileSize), sePoint = nwPoint.add(tileSize);
		return [map.unproject(nwPoint, coords.z), map.unproject(sePoint, coords.z)];
	}
	_tileCoordsToBounds(coords) {
		const bp = this._tileCoordsToNwSe(coords);
		let bounds = new LatLngBounds(bp[0], bp[1]);
		if (!this.options.noWrap) bounds = this._map.wrapLatLngBounds(bounds);
		return bounds;
	}
	_tileCoordsToKey(coords) {
		return `${coords.x}:${coords.y}:${coords.z}`;
	}
	_keyToTileCoords(key) {
		const k = key.split(":"), coords = new Point(+k[0], +k[1]);
		coords.z = +k[2];
		return coords;
	}
	_removeTile(key) {
		const tile = this._tiles[key];
		if (!tile) return;
		tile.el.remove();
		delete this._tiles[key];
		this.fire("tileunload", {
			tile: tile.el,
			coords: this._keyToTileCoords(key)
		});
	}
	_initTile(tile) {
		tile.classList.add("maplair-tile");
		const tileSize = this.getTileSize();
		tile.style.width = `${tileSize.x}px`;
		tile.style.height = `${tileSize.y}px`;
		tile.onselectstart = falseFn;
		tile.onpointermove = falseFn;
		if (this.options.placeholder) tile.style.background = this.options.placeholder;
	}
	_addTile(coords, container) {
		const tilePos = this._getTilePos(coords), key = this._tileCoordsToKey(coords);
		const tile = this.createTile(this._wrapCoords(coords), this._tileReady.bind(this, coords));
		this._initTile(tile);
		if (this.createTile.length < 2) requestAnimationFrame(this._tileReady.bind(this, coords, null, tile));
		setPosition(tile, tilePos);
		this._tiles[key] = {
			el: tile,
			coords,
			current: true
		};
		container.appendChild(tile);
		this.fire("tileloadstart", {
			tile,
			coords
		});
	}
	_tileReady(coords, err, tile) {
		if (err) this.fire("tileerror", {
			error: err,
			tile,
			coords
		});
		const key = this._tileCoordsToKey(coords);
		tile = this._tiles[key];
		if (!tile) return;
		tile.loaded = Date.now();
		if (this.options.placeholder) {
			tile.noFade = true;
			tile.el.style.background = "";
		}
		if (this._map._fadeAnimated && !tile.noFade) {
			tile.el.style.opacity = 0;
			cancelAnimationFrame(this._fadeFrame);
			this._fadeFrame = requestAnimationFrame(this._updateOpacity.bind(this));
		} else {
			tile.active = true;
			this._pruneTiles();
		}
		if (!err) {
			tile.el.classList.add("maplair-tile-loaded");
			this.fire("tileload", {
				tile: tile.el,
				coords
			});
		}
		if (this._noTilesToLoad()) {
			this._loading = false;
			this.fire("load");
			this._map._scheduleIdleCheck();
			if (!this._map._fadeAnimated) requestAnimationFrame(this._pruneTiles.bind(this));
			else this._pruneTimeout = setTimeout(this._pruneTiles.bind(this), 250);
		}
	}
	_getTilePos(coords) {
		return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
	}
	_wrapCoords(coords) {
		const newCoords = new Point(this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x, this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y);
		newCoords.z = coords.z;
		return newCoords;
	}
	_pxBoundsToTileRange(bounds) {
		const tileSize = this.getTileSize();
		return new Bounds(bounds.min.unscaleBy(tileSize).floor(), bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
	}
	_noTilesToLoad() {
		return Object.values(this._tiles).every((t) => t.loaded);
	}
};
//#endregion
export { GridLayer };

//# sourceMappingURL=GridLayer.js.map