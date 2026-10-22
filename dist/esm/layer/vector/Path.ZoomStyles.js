import { Path } from "./Path.js";
import { CircleMarker } from "./CircleMarker.js";
//#region src/layer/vector/Path.ZoomStyles.js
/**
* A zoom-dependent style value, of the `weight` option of paths and the `radius` of
* circle markers: either a function of the zoom or an object of zoom stops
* `{zoom: value}`, using the value of the highest stop not above the zoom (or of the
* lowest stop). The styles are updated on `zoomend`.
*
* Zoom-dependent styles are an optional feature, like the zoom expressions of
* MapLibre: import this module to let the `weight` and `radius` options depend on the
* zoom.
*
* ```js
* import 'maplair/zoom-styles';
*
* new CircleMarker(latlng, {radius: {5: 3, 10: 6, 15: 10}}).addTo(map);
* new Polyline(latlngs, {weight: zoom => zoom / 2}).addTo(map);
* ```
* @typedef {number|Record<number, number>|((zoom: number) => number)} ZoomStyle
*/
const zoomStyleNames = ["weight", "radius"];
function evaluate(stops, zoom) {
	if (typeof stops === "function") return stops(zoom);
	const zooms = Object.keys(stops).map(Number).sort((a, b) => a - b);
	return stops[zooms.findLast((z) => z <= zoom) ?? zooms[0]];
}
const { beforeAdd, setStyle } = Path.prototype, { setRadius } = CircleMarker.prototype;
Path.include({
	getEvents() {
		return { zoomend: this._updateZoomStyles };
	},
	beforeAdd(map) {
		beforeAdd.call(this, map);
		this._applyZoomStyles(map.getZoom());
	},
	setStyle(style) {
		this._takeZoomStyles(style);
		const zoom = this._map?.getZoom();
		if (style && this._zoomStyles && zoom !== void 0) {
			style = { ...style };
			for (const [name, stops] of Object.entries(this._zoomStyles)) if (Object.hasOwn(style, name)) style[name] = evaluate(stops, zoom);
		}
		return setStyle.call(this, style);
	},
	_takeZoomStyles(style) {
		for (const name of zoomStyleNames) {
			if (!style || !Object.hasOwn(style, name)) continue;
			const value = style[name];
			if (value && (typeof value === "function" || typeof value === "object")) this._zoomStyles = {
				...this._zoomStyles,
				[name]: value
			};
			else if (this._zoomStyles) delete this._zoomStyles[name];
		}
	},
	_applyZoomStyles(zoom) {
		if (!this._zoomStyles) return;
		const values = {};
		for (const [name, stops] of Object.entries(this._zoomStyles)) values[name] = evaluate(stops, zoom);
		setStyle.call(this, values);
		if (values.radius !== void 0 && this.setRadius) setRadius.call(this, values.radius);
	},
	_updateZoomStyles() {
		this._applyZoomStyles(this._map.getZoom());
	}
});
CircleMarker.include({ setRadius(radius) {
	this._takeZoomStyles({ radius });
	return this._zoomStyles?.radius && this._map ? setRadius.call(this, evaluate(radius, this._map.getZoom())) : setRadius.call(this, radius);
} });
Path.addInitHook(function() {
	this._takeZoomStyles(this.options);
});
//#endregion

//# sourceMappingURL=Path.ZoomStyles.js.map