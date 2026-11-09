import { stamp } from "../../core/Util.js";
import { Bounds } from "../../geometry/Bounds.js";
import { Renderer } from "./Renderer.js";
// src/layer/vector/Canvas.js
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {EventListener} from '../../core/Events.js' */
/** @import {RendererOptions} from './Renderer.js' */
const DASH_SEPARATOR_RE = /[, ]+/;
/**
* Options of `Canvas`.
* @typedef {object} CanvasOptions
* @property {number} [tolerance=0] How much to extend the click tolerance around a
* path/object on the map.
* @extends RendererOptions
*/
/**
* Allows vector layers to be displayed with [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
* Inherits `Renderer`.
*
* @example
* Use Canvas by default for all paths in the map:
*
* ```js
* const map = new MaplairMap('map', {
* 	renderer: new Canvas()
* });
* ```
*
* Use a Canvas renderer with extra padding for specific vector geometries:
*
* ```js
* const map = new MaplairMap('map');
* const myRenderer = new Canvas({ padding: 0.5 });
* const line = new Polyline( coordinates, { renderer: myRenderer } );
* const circle =  new Circle( center, { renderer: myRenderer, radius: 100 } );
* ```
*/
var Canvas = class Canvas extends Renderer {
	static defaultOptions = { tolerance: 0 };
	/**
	* Creates a Canvas renderer with the given options.
	* @overload
	* @param {CanvasOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(Canvas);
	}
	/**
	* Returns the map events the renderer listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = super.getEvents();
		events.viewprereset = this._onViewPreReset;
		events.pixelratiochange = this._onPixelRatioChange;
		return events;
	}
	_onPixelRatioChange() {
		this._resizeContainer();
		this._update();
	}
	_onViewPreReset() {
		this._postponeUpdatePaths = true;
	}
	/**
	* Adds the canvas to the map and draws the paths.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		super.onAdd(map);
		const z = (r) => +getComputedStyle(r._container.parentNode).zIndex || 0;
		map._canvases.push(this);
		map._canvases.sort((a, b) => z(b) - z(a) || (a._container.compareDocumentPosition(b._container) & 2) - 1);
		this._draw();
	}
	_initContainer() {
		const container = this._container = document.createElement("canvas");
		this._ctx = container.getContext("2d");
	}
	/**
	* Removes the canvas from the map.
	*/
	onRemove() {
		this._map._canvases = this._map._canvases.filter((r) => r !== this);
		super.onRemove();
	}
	_destroyContainer() {
		cancelAnimationFrame(this._redrawRequest);
		this._redrawRequest = null;
		delete this._ctx;
		super._destroyContainer();
	}
	_resizeContainer() {
		const size = super._resizeContainer();
		const m = this._ctxScale = window.devicePixelRatio;
		this._container.width = m * size.x;
		this._container.height = m * size.y;
	}
	_updatePaths() {
		if (this._postponeUpdatePaths) return;
		this._redrawBounds = null;
		for (const layer of Object.values(this._layers)) layer._update();
		this._redraw();
	}
	_update() {
		if (this._map._animatingZoom && this._bounds) return;
		const b = this._bounds, s = this._ctxScale;
		this._ctx.setTransform(s, 0, 0, s, -b.min.x * s, -b.min.y * s);
		this.fire("update");
	}
	_reset() {
		super._reset();
		if (this._postponeUpdatePaths) {
			this._postponeUpdatePaths = false;
			this._updatePaths();
		}
	}
	_initPath(layer) {
		this._updateDashArray(layer);
		this._layers[stamp(layer)] = layer;
		this._append(layer._order = { layer });
	}
	_addPath(layer) {
		this._requestRedraw(layer);
	}
	_removePath(layer) {
		this._unlink(layer._order);
		delete layer._order;
		delete this._layers[stamp(layer)];
		this._requestRedraw(layer);
	}
	_updatePath(layer) {
		this._extendRedrawBounds(layer);
		layer._project();
		layer._update();
		this._requestRedraw(layer);
	}
	_updateStyle(layer) {
		this._updateDashArray(layer);
		this._requestRedraw(layer);
	}
	_updateDashArray(layer) {
		if (typeof layer.options.dashArray === "string") layer._dashArray = layer.options.dashArray.split(DASH_SEPARATOR_RE).map((n) => Number(n)).filter((n) => !isNaN(n));
		else layer._dashArray = layer.options.dashArray;
	}
	_requestRedraw(layer) {
		if (!this._map) return;
		this._extendRedrawBounds(layer);
		this._redrawRequest ??= requestAnimationFrame(this._redraw.bind(this));
	}
	_extendRedrawBounds(layer) {
		if (layer._pxBounds) {
			const padding = (+layer.options.weight || 0) + 1;
			this._redrawBounds ??= new Bounds();
			this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
			this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
		}
	}
	_redraw() {
		cancelAnimationFrame(this._redrawRequest);
		this._redrawRequest = null;
		if (this._redrawBounds) {
			this._redrawBounds.min._floor();
			this._redrawBounds.max._ceil();
		}
		this._clear();
		this._draw();
		this._redrawBounds = null;
	}
	_clear() {
		const bounds = this._redrawBounds;
		if (bounds) {
			const size = bounds.getSize();
			this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
		} else {
			this._ctx.save();
			this._ctx.setTransform(1, 0, 0, 1, 0, 0);
			this._ctx.clearRect(0, 0, this._container.width, this._container.height);
			this._ctx.restore();
		}
	}
	_draw() {
		let layer;
		const bounds = this._redrawBounds;
		this._ctx.save();
		if (bounds) {
			const size = bounds.getSize();
			this._ctx.beginPath();
			this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
			this._ctx.clip();
		}
		this._drawing = true;
		for (let order = this._drawFirst; order; order = order.next) {
			layer = order.layer;
			if (!bounds || layer._pxBounds?.intersects(bounds)) layer._updatePath();
		}
		this._drawing = false;
		this._ctx.restore();
	}
	_updatePoly(layer, closed) {
		if (!this._drawing) return;
		const parts = layer._parts, ctx = this._ctx;
		if (!parts.length) return;
		ctx.beginPath();
		parts.forEach((p0) => {
			p0.forEach((p, j) => {
				ctx[j ? "lineTo" : "moveTo"](p.x, p.y);
			});
			if (closed) ctx.closePath();
		});
		this._fillStroke(ctx, layer);
	}
	_updateCircle(layer) {
		if (!this._drawing || layer._empty()) return;
		const { x, y } = layer._point, ctx = this._ctx, r = Math.max(Math.round(layer._pxRadius), 1), ry = Math.max(Math.round(layer._pxRadiusY), 1) || r;
		ctx.beginPath();
		if (ry === r) ctx.arc(x, y, r, 0, Math.PI * 2);
		else ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
		this._fillStroke(ctx, layer);
	}
	_fillStroke(ctx, layer) {
		const options = layer.options;
		if (options.fill) {
			ctx.globalAlpha = options.fillOpacity;
			ctx.fillStyle = options.fillColor ?? options.color;
			ctx.fill(options.fillRule || "evenodd");
		}
		if (options.stroke && options.weight !== 0) {
			ctx.lineDashOffset = Number(options.dashOffset ?? 0);
			ctx.setLineDash(layer._dashArray ?? []);
			ctx.globalAlpha = options.opacity;
			ctx.lineWidth = options.weight;
			ctx.strokeStyle = options.color;
			ctx.lineCap = options.lineCap;
			ctx.lineJoin = options.lineJoin;
			ctx.stroke();
		}
	}
	_updateInteractive() {}
	/**
	* Returns the topmost interactive layer under the pointer.
	* @param {MouseEvent} e
	* @param {boolean} [click] Skip layers that were just dragged, so the drag doesn't end with a click.
	* @returns {Path|undefined}
	*/
	_layerAt(e, click) {
		const point = this._map.pointerEventToLayerPoint(e);
		for (let order = this._drawLast; order; order = order.prev) {
			const layer = order.layer;
			if (layer.options.interactive && layer._containsPoint(point) && !(click && this._map._draggableMoved(layer))) return layer;
		}
	}
	_bringToFront(layer) {
		const order = layer._order;
		if (order?.next) {
			this._unlink(order);
			this._append(order);
			this._requestRedraw(layer);
		}
	}
	_bringToBack(layer) {
		const order = layer._order;
		if (order?.prev) {
			this._unlink(order);
			order.prev = null;
			order.next = this._drawFirst;
			this._drawFirst.prev = order;
			this._drawFirst = order;
			this._requestRedraw(layer);
		}
	}
	_append(order) {
		order.prev = this._drawLast;
		order.next = null;
		if (this._drawLast) this._drawLast.next = order;
		this._drawLast = order;
		this._drawFirst ??= order;
	}
	_unlink({ prev, next }) {
		if (next) next.prev = prev;
		else this._drawLast = prev;
		if (prev) prev.next = next;
		else this._drawFirst = next;
	}
};
export { Canvas };

//# sourceMappingURL=Canvas.js.map