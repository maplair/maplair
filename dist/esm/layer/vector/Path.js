import { setOptions } from "../../core/Util.js";
import { Layer } from "../Layer.js";
import { SVG } from "./SVG.js";
// src/layer/vector/Path.js
/** @import {InteractiveLayerOptions} from '../Layer.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {Renderer} from './Renderer.js' */
/**
* Options of `Path`, shared by all vector layers.
* @typedef {object} PathOptions
* @property {boolean} [stroke=true] Whether to draw stroke along the path. Set it to
* `false` to disable borders on polygons or circles.
* @property {string} [color='#3388ff'] Stroke color.
* @property {number} [weight=3] Stroke width in pixels.
* @property {number} [opacity=1] Stroke opacity.
* @property {string} [lineCap='round'] A string that defines
* [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap)
* of the stroke.
* @property {string} [lineJoin='round'] A string that defines
* [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin)
* of the stroke.
* @property {string|null} [dashArray=null] A string that defines the stroke
* [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray).
* @property {string|null} [dashOffset=null] A string that defines the
* [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset).
* @property {boolean} [fill=false] Whether to fill the path with color. Set it to
* `false` to disable filling on polygons or circles. The default depends on the
* class: `true` for polygons and circles.
* @property {string|null} [fillColor=null] Fill color. Defaults to the value of the
* [`color`](#pathoptions-color) option.
* @property {number} [fillOpacity=0.2] Fill opacity.
* @property {string} [fillRule='evenodd'] A string that defines
* [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule)
* is determined.
* @property {string} [className] Custom class name set on an element. Only for SVG renderer.
* Applied when the element is created; [`setStyle`](#path-setstyle) does not update it
* afterwards.
* @property {Renderer} [renderer] Use this specific instance of `Renderer` for this
* path. If not set, the path uses the map's [renderer](#maplairmapoptions-renderer),
* which is `SVG` by default. If set, it overrides the `pane` option.
* @extends InteractiveLayerOptions
*/
/**
* An abstract class that contains options and constants shared between vector
* overlays (Polygon, Polyline, Circle). Do not use it directly. Extends `Layer`.
*/
var Path = class extends Layer {
	static defaultOptions = {
		stroke: true,
		color: "#3388ff",
		weight: 3,
		opacity: 1,
		lineCap: "round",
		lineJoin: "round",
		dashArray: null,
		dashOffset: null,
		fill: false,
		fillColor: null,
		fillOpacity: .2,
		fillRule: "evenodd",
		interactive: true,
		bubblingPointerEvents: true
	};
	/**
	* Gets the renderer of the path from the map, before it is added.
	* @param {MaplairMap} map
	*/
	beforeAdd(map) {
		this._renderer = map.getRenderer(this);
	}
	/**
	* Adds the path to its renderer.
	*/
	onAdd() {
		this._renderer._initPath(this);
		this._reset();
		this._renderer._addPath(this);
	}
	/**
	* Removes the path from its renderer.
	*/
	onRemove() {
		this._renderer._removePath(this);
	}
	/**
	* Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
	* @returns {this}
	*/
	redraw() {
		if (this._map) this._renderer._updatePath(this);
		return this;
	}
	_updateInteractive() {
		this._renderer._updateInteractive(this);
	}
	/**
	* Changes the appearance of a Path based on the options in the `PathOptions` object.
	* Note that [`className`](#pathoptions-classname) is an exception: it is applied only
	* when the path element is created, so passing it here updates the option but leaves
	* the element's class unchanged.
	* @param {PathOptions} style
	* @returns {this}
	*/
	setStyle(style) {
		setOptions(this, style);
		if (this._renderer) {
			this._renderer._updateStyle(this);
			if (this.options.stroke && style && Object.hasOwn(style, "weight")) this._updateBounds();
		}
		return this;
	}
	/**
	* Brings the layer to the top of all path layers.
	* @returns {this}
	*/
	bringToFront() {
		this._renderer?._bringToFront(this);
		return this;
	}
	/**
	* Brings the layer to the bottom of all path layers.
	* @returns {this}
	*/
	bringToBack() {
		this._renderer?._bringToBack(this);
		return this;
	}
	/**
	* Returns the SVG `path` element of the layer, if it is rendered by the `SVG` renderer.
	* @returns {SVGPathElement|undefined}
	*/
	getElement() {
		return this._path;
	}
	_createRenderer(options) {
		return new SVG(options);
	}
	_reset() {
		this._project();
		this._update();
	}
	_clickTolerance() {
		return (this.options.stroke ? this.options.weight / 2 : 0) + (this._renderer.options.tolerance || 0);
	}
};
export { Path };

//# sourceMappingURL=Path.js.map