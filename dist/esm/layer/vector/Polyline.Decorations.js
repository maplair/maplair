import { stamp } from "../../core/Util.js";
import { Point } from "../../geometry/Point.js";
import { SVG } from "./SVG.js";
import { Path } from "./Path.js";
import { Polyline } from "./Polyline.js";
import { Canvas } from "./Canvas.js";
//#region src/layer/vector/Polyline.Decorations.js
/**
* Options of `Path` for arrowheads and text along lines (for `Polyline`s and
* `Polygon`s). They are an optional feature: import this module to add the
* `arrowheads` and `text` options to `Path`.
*
* ```js
* import 'maplair/path-decorations';
*
* new Polyline(latlngs, {arrowheads: true, text: {content: 'Main Street', center: true}}).addTo(map);
* ```
*
* Inspired by the [Leaflet.PolylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator)
* and [Leaflet.TextPath](https://github.com/makinacorpus/Leaflet.TextPath) plugins.
* @typedef {object} PathDecorationsOptions
* @lends PathOptions
* @property {boolean|{size?: number, repeat?: number, color?: string}} [arrowheads=false]
* Arrowheads along a polyline: `true` for one at the end of each line, or an object
* with the `size` (in pixels, default `10`), `repeat` (an arrowhead every that many
* pixels instead) and `color` (default: the `color` of the path).
* @property {string|{content: string, repeat?: boolean, center?: boolean, offset?: number, fontSize?: number, color?: string}|null} [text=null]
* Text along a polyline, e.g. a street name: the text, or an object with the
* `content`, `repeat` (repeat the text along the whole line), `center` (center it on
* the line), `offset` (in pixels, perpendicular to the line), `fontSize` (in pixels,
* default `12`) and `color` (default: the `color` of the path).
*/
function pointAlong(ring, distance) {
	for (let i = 1; i < ring.length; i++) {
		const a = ring[i - 1], b = ring[i], length = a.distanceTo(b);
		if (distance <= length || i === ring.length - 1) {
			const t = length ? Math.min(1, distance / length) : 0;
			return {
				point: new Point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t),
				angle: Math.atan2(b.y - a.y, b.x - a.x)
			};
		}
		distance -= length;
	}
	return {
		point: ring[0],
		angle: 0
	};
}
function ringLength(ring) {
	let length = 0;
	for (let i = 1; i < ring.length; i++) length += ring[i - 1].distanceTo(ring[i]);
	return length;
}
const { _setPath: setSvgPath, _updateStyle: updateSvgStyle, _addPath: addSvgPath, _removePath: removeSvgPath, _bringToFront: bringSvgToFront, _bringToBack: bringSvgToBack } = SVG.prototype, { _updatePoly: updateCanvasPoly, _extendRedrawBounds: extendCanvasRedrawBounds } = Canvas.prototype;
Path.include({ options: {
	arrowheads: false,
	text: null
} });
Polyline.include({
	_getArrowheadOptions() {
		const arrowheads = this.options.arrowheads;
		return arrowheads ? {
			size: 10,
			repeat: 0,
			...arrowheads === true ? {} : arrowheads
		} : null;
	},
	_getTextOptions() {
		const text = this.options.text;
		return text ? {
			repeat: false,
			center: false,
			offset: 0,
			fontSize: 12,
			...typeof text === "string" ? { content: text } : text
		} : null;
	},
	_getDecorationPadding() {
		const text = this._getTextOptions();
		return (this._getArrowheadOptions()?.size ?? 0) + (text ? text.fontSize + Math.abs(text.offset) : 0);
	},
	_getArrowheads() {
		const { size, repeat } = this._getArrowheadOptions(), triangles = [];
		for (const ring of this._rings) {
			if (ring.length < 2) continue;
			const length = ringLength(ring), distances = [];
			if (repeat > 0) for (let d = repeat; d <= length; d += repeat) distances.push(d);
			else distances.push(length);
			for (const distance of distances) {
				const { point, angle } = pointAlong(ring, distance), dx = Math.cos(angle), dy = Math.sin(angle), base = new Point(point.x - dx * size, point.y - dy * size), half = size / 2;
				triangles.push([
					point,
					new Point(base.x - dy * half, base.y + dx * half),
					new Point(base.x + dy * half, base.y - dx * half)
				]);
			}
		}
		return triangles;
	},
	_getTextPlacements(measure) {
		const text = this._getTextOptions(), placements = [];
		if (!text) return placements;
		const width = measure(text.content);
		for (const ring of this._parts) {
			const length = ringLength(ring);
			if (!width || width > length) continue;
			let start = text.center ? (length - width) / 2 : 0;
			const end = text.repeat ? length - width : start;
			for (; start <= end + 1e-9; start += width) {
				let distance = start;
				for (const char of text.content) {
					const charWidth = measure(char);
					placements.push({
						char,
						width: charWidth,
						...pointAlong(ring, distance + charWidth / 2)
					});
					distance += charWidth;
				}
			}
		}
		return placements;
	}
});
SVG.include({
	_setPath(layer, path) {
		setSvgPath.call(this, layer, path);
		this._updateDecorations(layer);
	},
	_updateStyle(layer) {
		updateSvgStyle.call(this, layer);
		if (layer._rings) this._updateDecorations(layer);
	},
	_addPath(layer) {
		addSvgPath.call(this, layer);
		this._updateDecorations(layer);
	},
	_removePath(layer) {
		removeSvgPath.call(this, layer);
		layer._arrowheads?.remove();
		layer._text?.remove();
	},
	_bringToFront(layer) {
		bringSvgToFront.call(this, layer);
		this._placeDecorations(layer);
	},
	_bringToBack(layer) {
		bringSvgToBack.call(this, layer);
		this._placeDecorations(layer);
	},
	_updateDecorations(layer) {
		const path = layer._path, options = layer.options, arrowheads = layer._getArrowheadOptions?.(), text = layer._getTextOptions?.();
		if (!path) return;
		if (arrowheads) {
			const el = layer._arrowheads ??= SVG.create("path");
			el.setAttribute("class", "maplair-path-arrowheads");
			el.setAttribute("d", layer._getArrowheads().map(([a, b, c]) => `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}z`).join("") || "M0 0");
			el.setAttribute("fill", arrowheads.color ?? options.color);
			el.setAttribute("fill-opacity", options.opacity);
		} else {
			layer._arrowheads?.remove();
			layer._arrowheads = null;
		}
		if (text) {
			path.id ||= `maplair-path-${stamp(layer)}`;
			const el = layer._text ??= SVG.create("text"), textPath = el.firstChild ?? el.appendChild(SVG.create("textPath"));
			el.setAttribute("class", "maplair-path-text");
			el.setAttribute("fill", text.color ?? options.color);
			el.setAttribute("font-size", text.fontSize);
			el.setAttribute("dy", text.offset);
			textPath.setAttribute("href", `#${path.id}`);
			if (text.center) {
				textPath.setAttribute("startOffset", "50%");
				textPath.setAttribute("text-anchor", "middle");
			} else {
				textPath.removeAttribute("startOffset");
				textPath.removeAttribute("text-anchor");
			}
			textPath.textContent = text.content;
			this._placeDecorations(layer);
			if (text.repeat && path.isConnected) {
				const single = el.getComputedTextLength();
				textPath.textContent = text.content + text.content;
				const textLength = el.getComputedTextLength() - single, count = textLength > 0 ? Math.floor((path.getTotalLength() - single + textLength) / textLength) : 1;
				textPath.textContent = Array(Math.max(1, count)).fill(text.content).join("");
			}
		} else {
			layer._text?.remove();
			layer._text = null;
		}
		this._placeDecorations(layer);
	},
	_placeDecorations(layer) {
		const decorations = [layer._arrowheads, layer._text].filter(Boolean);
		if (decorations.length && layer._path.parentNode) layer._path.after(...decorations);
	}
});
Canvas.include({
	_updatePoly(layer, closed) {
		updateCanvasPoly.call(this, layer, closed);
		if (this._drawing && layer._parts.length) this._drawDecorations(this._ctx, layer);
	},
	_extendRedrawBounds(layer) {
		extendCanvasRedrawBounds.call(this, layer);
		const padding = layer._getDecorationPadding?.();
		if (padding && layer._pxBounds) {
			const extent = (layer.options.weight ?? 0) + 1 + padding;
			this._redrawBounds.extend(layer._pxBounds.min.subtract([extent, extent]));
			this._redrawBounds.extend(layer._pxBounds.max.add([extent, extent]));
		}
	},
	_drawDecorations(ctx, layer) {
		const options = layer.options, arrowheads = layer._getArrowheadOptions?.(), text = layer._getTextOptions?.();
		if (arrowheads) {
			ctx.beginPath();
			for (const [a, b, c] of layer._getArrowheads()) {
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.lineTo(c.x, c.y);
				ctx.closePath();
			}
			ctx.globalAlpha = options.opacity;
			ctx.fillStyle = arrowheads.color ?? options.color;
			ctx.fill();
		}
		if (text) {
			ctx.globalAlpha = 1;
			ctx.fillStyle = text.color ?? options.color;
			ctx.font = `${text.fontSize}px sans-serif`;
			ctx.textBaseline = "alphabetic";
			for (const { char, width, point, angle } of layer._getTextPlacements((t) => ctx.measureText(t).width)) {
				ctx.save();
				ctx.translate(point.x, point.y);
				ctx.rotate(angle);
				ctx.fillText(char, -width / 2, text.offset);
				ctx.restore();
			}
		}
	}
});
//#endregion

//# sourceMappingURL=Polyline.Decorations.js.map