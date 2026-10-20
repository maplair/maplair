/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {Path} from './Path.js' */
/** @import {Renderer} from './Renderer.js' */

/**
 * Methods of `MaplairMap` for the renderers of vector layers.
 * @lends MaplairMap.prototype
 */
const mapRendererMethods = {
	/**
	 * Returns the instance of `Renderer` that should be used to render the given
	 * `Path`. It will ensure that the `renderer` options of the map and paths
	 * are respected, and that the renderers do exist on the map.
	 * @internal
	 * @param {Path} layer
	 * @returns {Renderer}
	 */
	getRenderer(layer) {
		const renderer = layer.options.renderer ?? this._getPaneRenderer(layer) ?? this.options.renderer ??
			(this._renderer ??= layer._createRenderer());

		if (!this.hasLayer(renderer)) {
			this.addLayer(renderer);
		}
		return renderer;
	},

	_getPaneRenderer(layer) {
		const name = layer.options.pane;
		if (name === 'overlayPane' || name === undefined) {
			return;
		}

		let renderer = this._paneRenderers[name];
		if (!renderer) {
			// custom panes get a renderer of the same kind as the map's default one, so Canvas maps stay Canvas
			const Renderer = this.options.renderer?.constructor;
			renderer = Renderer ?
				new Renderer({...this.options.renderer.options, pane: name}) :
				layer._createRenderer({pane: name});
			this._paneRenderers[name] = renderer;
		}
		return renderer;
	}
};
/** @typedef {typeof mapRendererMethods} MapRendererMethods */

/**
 * Map options of the vector renderers.
 * @typedef {object} RendererMapOptions
 * @lends MaplairMapOptions
 * @property {Renderer} [renderer] The default method for drawing vector layers on the
 * map. A new `SVG` renderer by default; pass `new Canvas()` to draw them on a canvas
 * instead.
 */

/**
 * Registers `getRenderer()` and related methods on the given map class, called by
 * `MaplairMap` itself.
 * @internal
 * @param {typeof MaplairMap} MaplairMap
 */
export function register(MaplairMap) {
	MaplairMap.include(mapRendererMethods);
	MaplairMap.addInitHook(function () {
		if (this.options.preferCanvas !== undefined) {
			console.error('MaplairMap: preferCanvas option has been removed. Use renderer: new Canvas() instead.');
		}
	});
}
