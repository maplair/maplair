import { splitWords, stamp } from "../../core/Util.js";
import { toBack, toFront } from "../../dom/DomUtil.js";
import { Renderer } from "./Renderer.js";
//#region src/layer/vector/SVG.js
/** @import {Point} from '../../geometry/Point.js' */
/** @import {RendererOptions} from './Renderer.js' */
/**
* Allows vector layers to be displayed with [SVG](https://developer.mozilla.org/docs/Web/SVG).
* Inherits `Renderer`.
*
* @example
* Use SVG by default for all paths in the map:
*
* ```js
* const map = new MaplairMap('map', {
* 	renderer: new SVG()
* });
* ```
*
* Use a SVG renderer with extra padding for specific vector geometries:
*
* ```js
* const map = new MaplairMap('map');
* const myRenderer = new SVG({ padding: 0.5 });
* const line = new Polyline( coordinates, { renderer: myRenderer } );
* const circle = new Circle( center, { renderer: myRenderer, radius: 100 } );
* ```
*/
var SVG = class SVG extends Renderer {
	/**
	* Creates a SVG renderer with the given options.
	* @overload
	* @param {RendererOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(SVG);
	}
	_initContainer() {
		this._container = SVG.create("svg");
		this._container.setAttribute("pointer-events", "none");
		this._rootGroup = SVG.create("g");
		this._container.appendChild(this._rootGroup);
	}
	_destroyContainer() {
		super._destroyContainer();
		delete this._rootGroup;
		delete this._svgSize;
	}
	_resizeContainer() {
		const size = super._resizeContainer();
		if (!this._svgSize || !this._svgSize.equals(size)) {
			this._svgSize = size;
			this._container.setAttribute("width", size.x);
			this._container.setAttribute("height", size.y);
		}
		const b = this._bounds;
		if (b) this._container.setAttribute("viewBox", [
			b.min.x,
			b.min.y,
			size.x,
			size.y
		].join(" "));
	}
	_update() {
		if (this._map._animatingZoom && this._bounds) return;
		const b = this._bounds, size = b.getSize();
		this._container.setAttribute("viewBox", [
			b.min.x,
			b.min.y,
			size.x,
			size.y
		].join(" "));
		this.fire("update");
	}
	_initPath(layer) {
		const path = layer._path = SVG.create("path");
		if (layer.options.className) path.classList.add(...splitWords(layer.options.className));
		if (layer.options.interactive) path.classList.add("maplair-interactive");
		this._updateStyle(layer);
		this._layers[stamp(layer)] = layer;
	}
	_updateInteractive(layer) {
		layer._path.classList.toggle("maplair-interactive", !!layer.options.interactive);
	}
	_addPath(layer) {
		if (!this._rootGroup) this._initContainer();
		this._rootGroup.appendChild(layer._path);
		layer.addInteractiveTarget(layer._path);
	}
	_removePath(layer) {
		layer._path.remove();
		layer.removeInteractiveTarget(layer._path);
		delete this._layers[stamp(layer)];
	}
	_updatePath(layer) {
		layer._project();
		layer._update();
	}
	_updateStyle(layer) {
		const path = layer._path, options = layer.options;
		if (!path) return;
		if (options.stroke) {
			path.setAttribute("stroke", options.color);
			path.setAttribute("stroke-opacity", options.opacity);
			path.setAttribute("stroke-width", options.weight);
			path.setAttribute("stroke-linecap", options.lineCap);
			path.setAttribute("stroke-linejoin", options.lineJoin);
			if (options.dashArray) path.setAttribute("stroke-dasharray", options.dashArray);
			else path.removeAttribute("stroke-dasharray");
			if (options.dashOffset) path.setAttribute("stroke-dashoffset", options.dashOffset);
			else path.removeAttribute("stroke-dashoffset");
		} else path.setAttribute("stroke", "none");
		if (options.fill) {
			path.setAttribute("fill", options.fillColor || options.color);
			path.setAttribute("fill-opacity", options.fillOpacity);
			path.setAttribute("fill-rule", options.fillRule || "evenodd");
		} else path.setAttribute("fill", "none");
	}
	_updatePoly(layer, closed) {
		this._setPath(layer, SVG.pointsToPath(layer._parts, closed));
	}
	_updateCircle(layer) {
		const p = layer._point, r = Math.max(Math.round(layer._pxRadius), 1), arc = `a${r},${Math.max(Math.round(layer._pxRadiusY), 1) || r} 0 1,0 `;
		const d = layer._empty() ? "M0 0" : `M${p.x - r},${p.y}${arc}${r * 2},0 ${arc}${-r * 2},0 `;
		this._setPath(layer, d);
	}
	_setPath(layer, path) {
		layer._path.setAttribute("d", path);
	}
	_bringToFront(layer) {
		toFront(layer._path);
	}
	_bringToBack(layer) {
		toBack(layer._path);
	}
	/**
	* Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
	* corresponding to the class name passed. For example, using 'line' will return
	* an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).
	* @param {string} name
	* @returns {SVGElement}
	*/
	static create(name) {
		return document.createElementNS("http://www.w3.org/2000/svg", name);
	}
	/**
	* Generates a SVG path string for multiple rings, with each ring turning
	* into "M..L..L.." instructions.
	* @param {Point[][]} rings
	* @param {boolean} [closed]
	* @returns {string}
	*/
	static pointsToPath(rings, closed) {
		return rings.flatMap((points) => [...points.map((p, j) => `${(j ? "L" : "M") + p.x} ${p.y}`), closed ? "z" : ""]).join("") || "M0 0";
	}
};
//#endregion
export { SVG };

//# sourceMappingURL=SVG.js.map