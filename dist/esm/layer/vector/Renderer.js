import { stamp } from "../../core/Util.js";
import { BlanketOverlay } from "../BlanketOverlay.js";
// src/layer/vector/Renderer.js
/** @import {BlanketOverlayOptions} from '../BlanketOverlay.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
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
var Renderer = class Renderer extends BlanketOverlay {
	/**
	* @param {RendererOptions} [options]
	*/
	constructor(options) {
		super({
			...options,
			continuous: false
		});
		stamp(this);
		this._layers ??= {};
		this.callInitHooks(Renderer);
	}
	/**
	* Adds the container of the renderer to the map and starts updating the paths.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		super.onAdd(map);
		this.on("update", this._updatePaths, this);
	}
	/**
	* Removes the container of the renderer from the map.
	*/
	onRemove() {
		super.onRemove();
		this.off("update", this._updatePaths, this);
	}
	_onZoomEnd() {
		for (const layer of Object.values(this._layers)) layer._project();
	}
	_updatePaths() {
		for (const layer of Object.values(this._layers)) layer._update();
	}
	_onViewReset() {
		for (const layer of Object.values(this._layers)) layer._reset();
	}
	_onSettled() {
		this._update();
	}
	_update() {}
};
export { Renderer };

//# sourceMappingURL=Renderer.js.map