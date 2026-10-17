import {Path} from './Path.js';
import {CircleMarker} from './CircleMarker.js';

/*
 * @namespace Path
 * @section Zoom-dependent styles
 *
 * Zoom-dependent styles are an optional feature: import this module to let the
 * `weight` option of paths and the `radius` of circle markers depend on the zoom,
 * like the zoom expressions of MapLibre. The value is either a function of the
 * zoom or an object of zoom stops `{zoom: value}`, using the value of the highest
 * stop not above the zoom (or of the lowest stop); `Path.interpolate()`
 * interpolates between stops instead. The styles are updated on `zoomend`.
 *
 * ```js
 * import 'maplair/zoom-styles';
 *
 * new CircleMarker(latlng, {radius: {5: 3, 10: 6, 15: 10}}).addTo(map);
 * new Polyline(latlngs, {weight: Path.interpolate({5: 1, 15: 8})}).addTo(map);
 * ```
 */

const zoomStyleNames = ['weight', 'radius'];

// The value of `stops` (a function or an object of zoom stops) at `zoom`
function evaluate(stops, zoom) {
	if (typeof stops === 'function') { return stops(zoom); }
	const zooms = Object.keys(stops).map(Number).sort((a, b) => a - b);
	return stops[zooms.findLast(z => z <= zoom) ?? zooms[0]];
}

const {beforeAdd, setStyle} = Path.prototype,
{setRadius} = CircleMarker.prototype;

Path.include({
	getEvents() {
		// also for zoom-dependent styles set later with `setStyle()`
		return {zoomend: this._updateZoomStyles};
	},

	beforeAdd(map) {
		beforeAdd.call(this, map);
		// before the path is drawn
		this._applyZoomStyles(map.getZoom());
	},

	setStyle(style) {
		this._takeZoomStyles(style);
		const zoom = this._map?.getZoom();
		if (style && this._zoomStyles && zoom !== undefined) {
			style = {...style};
			for (const [name, stops] of Object.entries(this._zoomStyles)) {
				if (Object.hasOwn(style, name)) {
					style[name] = evaluate(stops, zoom);
				}
			}
		}
		return setStyle.call(this, style);
	},

	// Keeps the zoom-dependent values of `style` (functions and objects) in
	// `_zoomStyles`, numbers replace them
	_takeZoomStyles(style) {
		for (const name of zoomStyleNames) {
			if (!style || !Object.hasOwn(style, name)) { continue; }
			const value = style[name];
			if (value && (typeof value === 'function' || typeof value === 'object')) {
				this._zoomStyles = {...this._zoomStyles, [name]: value};
			} else if (this._zoomStyles) {
				delete this._zoomStyles[name];
			}
		}
	},

	_applyZoomStyles(zoom) {
		if (!this._zoomStyles) { return; }
		const values = {};
		for (const [name, stops] of Object.entries(this._zoomStyles)) {
			values[name] = evaluate(stops, zoom);
		}
		setStyle.call(this, values);
		if (values.radius !== undefined && this.setRadius) {
			setRadius.call(this, values.radius);
		}
	},

	_updateZoomStyles() {
		this._applyZoomStyles(this._map.getZoom());
	}
});

CircleMarker.include({
	setRadius(radius) {
		this._takeZoomStyles({radius});
		return this._zoomStyles?.radius && this._map ?
			setRadius.call(this, evaluate(radius, this._map.getZoom())) :
			setRadius.call(this, radius);
	}
});

Path.addInitHook(function () {
	this._takeZoomStyles(this.options);
});

// @function interpolate(stops: Object): Function
// Returns a function of the zoom interpolating linearly between the given zoom
// stops `{zoom: value}`, e.g. for the [zoom-dependent styles](#path-zoom-dependent-styles).
Path.interpolate = function (stops) {
	const zooms = Object.keys(stops).map(Number).sort((a, b) => a - b);
	return function (zoom) {
		const i = zooms.findIndex(z => z > zoom);
		if (i === 0) { return stops[zooms[0]]; }
		if (i === -1) { return stops[zooms.at(-1)]; }
		const z0 = zooms[i - 1], z1 = zooms[i];
		return stops[z0] + (stops[z1] - stops[z0]) * (zoom - z0) / (z1 - z0);
	};
};
