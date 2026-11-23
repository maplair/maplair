import {BlanketOverlay} from '../BlanketOverlay.js';
import * as Util from '../../core/Util.js';
/** @import {BlanketOverlayOptions} from '../BlanketOverlay.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {Point} from '../../geometry/Point.js' */

/**
 * Options of `Renderer`, `SVG` and `Canvas`. The `continuous` option inherited from
 * `BlanketOverlay` cannot be set to `true`.
 * @typedef {object} RendererOptions
 * @extends BlanketOverlayOptions
 */

/**
 * Base class for vector renderer implementations (`SVG`, `Canvas`). Handles the
 * DOM container of the renderer, its bounds, and its zoom animation.
 *
 * A `Renderer` works as an implicit layer group for all `Path`s - the renderer
 * itself can be added or removed to the map. All paths use a renderer, which can
 * be implicit (the map will decide the type of renderer and use it automatically)
 * or explicit (using the [`renderer`](#pathoptions-renderer) option of the path).
 *
 * Do not use this class directly, use `SVG` and `Canvas` instead.
 *
 * The `continuous` option inherited from `BlanketOverlay` cannot be set to `true`
 * (otherwise, renderers get out of place during a pinch-zoom operation).
 *
 * @fires update {MaplairEvent} Fired when the renderer updates its bounds, center and
 * zoom, for example when its map has moved.
 */
export class Renderer extends BlanketOverlay {

	/**
	 * @param {RendererOptions} [options]
	 */
	constructor(options) {
		super({...options, continuous: false});
		Util.stamp(this);
		this._layers ??= {};

		this.callInitHooks(Renderer);
	}

	/**
	 * Adds the container of the renderer to the map and starts updating the paths.
	 * @param {MaplairMap} map
	 */
	onAdd(map) {
		this._setPathView();
		super.onAdd(map);
		this.on('update', this._updatePaths, this);
	}

	/**
	 * Removes the container of the renderer from the map.
	 */
	onRemove() {
		super.onRemove();
		this.off('update', this._updatePaths, this);
		// removed during a view reset, it won't get the viewreset that ends the postponing
		this._postponeUpdatePaths = false;
	}

	getEvents() {
		const events = super.getEvents();
		events.viewprereset = this._onViewPreReset;
		return events;
	}

	// A view reset fires zoomend and moveend before viewreset, so leave projecting and updating paths to viewreset,
	// which does each once
	_onViewPreReset() {
		this._postponeUpdatePaths = true;
	}

	_onZoomEnd() {
		if (this._postponeUpdatePaths) { return; }
		this._setPathView();
		for (const layer of Object.values(this._layers)) {
			layer._project();
		}
	}

	// Paths are projected with the zoom and pixel origin the renderer was last drawn
	// at, which lag behind the map's during zoom animation and pinch, so that paths
	// changed or added meanwhile line up with the rest.
	_setPathView() {
		this._pathZoom = this._map.getZoom();
		this._pathOrigin = this._map.getPixelOrigin();
	}

	/**
	 * @param {LatLngExpression} latlng
	 * @returns {Point}
	 */
	_latLngToLayerPoint(latlng) {
		return this._map.project(latlng, this._pathZoom)._subtract(this._pathOrigin);
	}

	_updatePaths() {
		if (this._postponeUpdatePaths) { return; }
		for (const layer of Object.values(this._layers)) {
			layer._update();
		}
	}

	_reset() {
		super._reset();
		this._postponeUpdatePaths = false;
		this._updatePaths();
	}

	_onViewReset() {
		this._setPathView();
		for (const layer of Object.values(this._layers)) {
			layer._project();
		}
	}

	_onSettled() {
		this._update();
	}

	// Subclasses are responsible of implementing `_update()`. It should fire
	// the 'update' event whenever appropriate (before/after rendering).
	_update() {}

}
