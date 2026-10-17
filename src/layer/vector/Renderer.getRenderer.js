import {Canvas} from './Canvas.js';
import {SVG} from './SVG.js';
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
		let renderer = layer.options.renderer ?? this._getPaneRenderer(layer.options.pane) ?? this.options.renderer ?? this._renderer;

		if (!renderer) {
			renderer = this._renderer = this._createRenderer();
		}

		if (!this.hasLayer(renderer)) {
			this.addLayer(renderer);
		}
		return renderer;
	},

	_getPaneRenderer(name) {
		if (name === 'overlayPane' || name === undefined) {
			return;
		}

		let renderer = this._paneRenderers[name];
		if (renderer === undefined) {
			renderer = this._createRenderer({pane: name});
			this._paneRenderers[name] = renderer;
		}
		return renderer;
	},

	_createRenderer(options) {
		return (this.options.preferCanvas && new Canvas(options)) || new SVG(options);
	}
};
/** @typedef {typeof mapRendererMethods} MapRendererMethods */

/**
 * Map options of the vector renderers.
 * @typedef {object} RendererMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [preferCanvas=false] Whether `Path`s should be rendered on a
 * `Canvas` renderer. By default, all `Path`s are rendered in a `SVG` renderer.
 * @property {Renderer} [renderer] The default method for drawing vector layers on the
 * map. `SVG` or `Canvas` by default depending on the `preferCanvas` option.
 */

/**
 * Registers `getRenderer()` and related methods on the given map class, called by
 * `MaplairMap` itself.
 * @internal
 * @param {typeof MaplairMap} MaplairMap
 */
export function register(MaplairMap) {
	MaplairMap.include(mapRendererMethods);
}
