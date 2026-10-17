import {BlanketOverlay} from './BlanketOverlay.js';
import * as Util from '../core/Util.js';

/*
 * @class HeatLayer
 * @inherits BlanketOverlay
 *
 * A heatmap of points, each with an optional intensity, drawn on a canvas: the
 * points are drawn as blurred circles adding up, and colored by a gradient.
 * Nearby points are merged into a grid for speed, so that tens of thousands of
 * points stay fast.
 *
 * Inspired by the [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) plugin
 * and its [simpleheat](https://github.com/mourner/simpleheat) algorithm.
 *
 * @example
 * ```js
 * new HeatLayer([
 * 	[47.27, 11.40, 0.5], // latitude, longitude, intensity
 * 	[47.28, 11.41],
 * 	new LatLng(47.26, 11.39)
 * ], {radius: 20}).addTo(map);
 * ```
 */

// @namespace HeatLayer
// @constructor HeatLayer(latlngs: Array, options?: HeatLayer options)
// Creates a heatmap of the given points: `LatLng`s or arrays `[lat, lng, intensity]`
// (the intensity defaults to `1`).
export class HeatLayer extends BlanketOverlay {

	static {
		// @section
		// @aka HeatLayer options
		this.setDefaultOptions({
			// @option radius: Number = 25
			// The radius of each point in pixels.
			radius: 25,

			// @option blur: Number = 15
			// The amount of blur in pixels.
			blur: 15,

			// @option max: Number = 1
			// The intensity with the strongest color.
			max: 1,

			// @option maxZoom: Number = undefined
			// The zoom level where the points reach the full intensity; below it, the
			// intensity is halved per zoom level. By default the maximum zoom of the map.
			maxZoom: undefined,

			// @option minOpacity: Number = 0.05
			// The minimum opacity of the heat.
			minOpacity: 0.05,

			// @option gradient: Object = {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'}
			// The colors for the intensities from `0` to `1`, any CSS colors.
			gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'},

			// @option pane: String = 'overlayPane'
			// The map pane of the layer.
			pane: 'overlayPane'
		});
	}

	constructor(latlngs, options) {
		super(options);
		this._latlngs = latlngs ?? [];
		this.callInitHooks(HeatLayer);
	}

	// @method setLatLngs(latlngs: Array): this
	// Replaces the points of the heatmap.
	setLatLngs(latlngs) {
		this._latlngs = latlngs;
		return this.redraw();
	}

	// @method addLatLng(latlng: LatLng|Array): this
	// Adds a point to the heatmap.
	addLatLng(latlng) {
		this._latlngs.push(latlng);
		return this.redraw();
	}

	// @method getLatLngs(): Array
	// Returns the points of the heatmap.
	getLatLngs() {
		return this._latlngs;
	}

	// @method setOptions(options: HeatLayer options): this
	// Changes the options, e.g. the `radius` or the `gradient`.
	setOptions(options) {
		Util.setOptions(this, options);
		this._circle = this._gradient = null;
		return this.redraw();
	}

	// @method redraw(): this
	// Redraws the heatmap.
	redraw() {
		if (this._map && this._bounds) {
			cancelAnimationFrame(this._frame);
			this._frame = requestAnimationFrame(() => this._draw());
		}
		return this;
	}

	_initContainer() {
		this._container = document.createElement('canvas');
		this._container.classList.add('maplair-heatmap-layer');
		this._ctx = this._container.getContext('2d');
	}

	_destroyContainer() {
		cancelAnimationFrame(this._frame);
		super._destroyContainer();
	}

	_resizeContainer() {
		const size = super._resizeContainer();
		this._container.width = size.x;
		this._container.height = size.y;
		return size;
	}

	_onSettled() {
		this._draw();
	}

	// A blurred circle, drawn for each point
	_getCircle() {
		if (this._circle) { return this._circle; }
		const {radius, blur} = this.options,
		r = radius + blur,
		circle = this._circle = document.createElement('canvas'),
		ctx = circle.getContext('2d');
		circle.width = circle.height = r * 2;
		// the shadow of a circle drawn outside of the canvas
		ctx.shadowOffsetX = ctx.shadowOffsetY = r * 2;
		ctx.shadowBlur = blur;
		ctx.shadowColor = 'black';
		ctx.beginPath();
		ctx.arc(-r, -r, radius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
		return circle;
	}

	// The colors of the alpha values 0–255 as RGBA values
	_getGradient() {
		if (this._gradient) { return this._gradient; }
		const canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		gradient = ctx.createLinearGradient(0, 0, 0, 256);
		canvas.width = 1;
		canvas.height = 256;
		for (const [stop, color] of Object.entries(this.options.gradient)) {
			gradient.addColorStop(Number(stop), color);
		}
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 1, 256);
		this._gradient = ctx.getImageData(0, 0, 1, 256).data;
		return this._gradient;
	}

	_draw() {
		const map = this._map;
		if (!map || !this._bounds) { return; }

		const ctx = this._ctx,
		{width, height} = this._container,
		offset = this._bounds.min,
		{radius, blur, max, minOpacity} = this.options,
		r = radius + blur,
		maxZoom = this.options.maxZoom ?? map.getMaxZoom(),
		// halve the intensity per zoom level below maxZoom (at most 12)
		zoomFactor = 1 / 2 ** Math.max(0, Math.min(maxZoom - map.getZoom(), 12)),
		cellSize = radius / 2,
		grid = new Map();

		// merge the points per grid cell, weighted by their intensity
		for (const latlng of this._latlngs) {
			const point = map.latLngToLayerPoint(latlng).subtract(offset);
			if (point.x < -r || point.y < -r || point.x > width + r || point.y > height + r) { continue; }
			const intensity = (latlng.alt ?? latlng[2] ?? 1) * zoomFactor,
			key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`,
			cell = grid.get(key);
			if (cell) {
				const sum = cell.intensity + intensity;
				cell.x = (cell.x * cell.intensity + point.x * intensity) / sum;
				cell.y = (cell.y * cell.intensity + point.y * intensity) / sum;
				cell.intensity = sum;
			} else {
				grid.set(key, {x: point.x, y: point.y, intensity});
			}
		}

		ctx.clearRect(0, 0, width, height);
		const circle = this._getCircle();
		for (const {x, y, intensity} of grid.values()) {
			ctx.globalAlpha = Math.min(Math.max(intensity / max, minOpacity), 1);
			ctx.drawImage(circle, x - r, y - r);
		}
		ctx.globalAlpha = 1;

		// colorize by the alpha values
		if (!grid.size) { return; }
		const image = ctx.getImageData(0, 0, width, height),
		pixels = image.data,
		gradient = this._getGradient();
		for (let i = 3; i < pixels.length; i += 4) {
			const j = pixels[i] * 4;
			if (j) {
				pixels[i - 3] = gradient[j];
				pixels[i - 2] = gradient[j + 1];
				pixels[i - 1] = gradient[j + 2];
			}
		}
		ctx.putImageData(image, 0, 0);
	}
}

