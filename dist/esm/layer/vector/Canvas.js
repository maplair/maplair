import { stamp } from "../../core/Util.js";
import { on } from "../../dom/DomEvent.js";
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
		this._draw();
	}
	/**
	* Removes the canvas from the map.
	*/
	onRemove() {
		super.onRemove();
		clearTimeout(this._pointerHoverThrottleTimeout);
	}
	_initContainer() {
		const container = this._container = document.createElement("canvas");
		on(container, "pointermove", this._onPointerMove, this);
		on(container, "click dblclick pointerdown pointerup contextmenu", this._onClick, this);
		on(container, "pointerout", this._handlePointerOut, this);
		container["_maplair_disable_events"] = true;
		this._ctx = container.getContext("2d");
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
		const order = layer._order = {
			layer,
			prev: this._drawLast,
			next: null
		};
		if (this._drawLast) this._drawLast.next = order;
		this._drawLast = order;
		this._drawFirst ??= this._drawLast;
	}
	_addPath(layer) {
		this._requestRedraw(layer);
	}
	_removePath(layer) {
		const order = layer._order;
		const next = order.next;
		const prev = order.prev;
		if (next) next.prev = prev;
		else this._drawLast = prev;
		if (prev) prev.next = next;
		else this._drawFirst = next;
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
		if (typeof layer.options.dashArray === "string") {
			const parts = layer.options.dashArray.split(DASH_SEPARATOR_RE);
			layer.options._dashArray = parts.map((n) => Number(n)).filter((n) => !isNaN(n));
		} else layer.options._dashArray = layer.options.dashArray;
	}
	_requestRedraw(layer) {
		if (!this._map) return;
		this._extendRedrawBounds(layer);
		this._redrawRequest ??= requestAnimationFrame(this._redraw.bind(this));
	}
	_extendRedrawBounds(layer) {
		if (layer._pxBounds) {
			const padding = (layer.options.weight ?? 0) + 1;
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
			if (!bounds || layer._pxBounds && layer._pxBounds.intersects(bounds)) layer._updatePath();
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
			ctx.setLineDash(options._dashArray ?? []);
			ctx.globalAlpha = options.opacity;
			ctx.lineWidth = options.weight;
			ctx.strokeStyle = options.color;
			ctx.lineCap = options.lineCap;
			ctx.lineJoin = options.lineJoin;
			ctx.stroke();
		}
	}
	_updateInteractive() {}
	_onClick(e) {
		const point = this._map.pointerEventToLayerPoint(e);
		let layer, clickedLayer;
		for (let order = this._drawFirst; order; order = order.next) {
			layer = order.layer;
			if (layer.options.interactive && layer._containsPoint(point)) {
				if (!(e.type === "click" || e.type === "preclick") || !this._map._draggableMoved(layer)) clickedLayer = layer;
			}
		}
		this._fireEvent(clickedLayer ? [clickedLayer] : false, e);
	}
	_onPointerMove(e) {
		if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) return;
		const point = this._map.pointerEventToLayerPoint(e);
		this._handlePointerHover(e, point);
	}
	_handlePointerOut(e) {
		const layer = this._hoveredLayer;
		if (layer) {
			this._container.classList.remove("maplair-interactive");
			this._fireEvent([layer], e, "pointerout");
			this._hoveredLayer = null;
			this._pointerHoverThrottled = false;
		}
	}
	_handlePointerHover(e, point) {
		if (this._pointerHoverThrottled) return;
		let layer, candidateHoveredLayer;
		for (let order = this._drawFirst; order; order = order.next) {
			layer = order.layer;
			if (layer.options.interactive && layer._containsPoint(point)) candidateHoveredLayer = layer;
		}
		if (candidateHoveredLayer !== this._hoveredLayer) {
			this._handlePointerOut(e);
			if (candidateHoveredLayer) {
				this._container.classList.add("maplair-interactive");
				this._fireEvent([candidateHoveredLayer], e, "pointerover");
				this._hoveredLayer = candidateHoveredLayer;
			}
		}
		this._fireEvent(this._hoveredLayer ? [this._hoveredLayer] : false, e);
		this._pointerHoverThrottled = true;
		this._pointerHoverThrottleTimeout = setTimeout((() => {
			this._pointerHoverThrottled = false;
		}), 32);
	}
	_fireEvent(layers, e, type) {
		this._map._fireDOMEvent(e, type || e.type, layers);
	}
	_bringToFront(layer) {
		const order = layer._order;
		if (!order) return;
		const next = order.next;
		const prev = order.prev;
		if (next) next.prev = prev;
		else return;
		if (prev) prev.next = next;
		else if (next) this._drawFirst = next;
		order.prev = this._drawLast;
		this._drawLast.next = order;
		order.next = null;
		this._drawLast = order;
		this._requestRedraw(layer);
	}
	_bringToBack(layer) {
		const order = layer._order;
		if (!order) return;
		const next = order.next;
		const prev = order.prev;
		if (prev) prev.next = next;
		else return;
		if (next) next.prev = prev;
		else if (prev) this._drawLast = prev;
		order.prev = null;
		order.next = this._drawFirst;
		this._drawFirst.prev = order;
		this._drawFirst = order;
		this._requestRedraw(layer);
	}
};
export { Canvas };

//# sourceMappingURL=Canvas.js.map