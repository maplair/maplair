import type { BlanketOverlayOptions } from './BlanketOverlay.js';
/** @import {BlanketOverlayOptions} from './BlanketOverlay.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/**
 * Options of `HeatLayer`.
 * @typedef {object} HeatLayerOptions
 * @property {number} [radius=25] The radius of each point in pixels.
 * @property {number} [blur=15] The amount of blur in pixels.
 * @property {number} [max=1] The intensity with the strongest color.
 * @property {number} [maxZoom] The zoom level where the points reach the full
 * intensity; below it, the intensity is halved per zoom level. By default the
 * maximum zoom of the map.
 * @property {number} [minOpacity=0.05] The minimum opacity of the heat.
 * @property {Record<number, string>} [gradient={0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'}]
 * The colors for the intensities from `0` to `1`, any CSS colors.
 * @property {string} [pane='overlayPane'] The map pane of the layer.
 * @extends BlanketOverlayOptions
 */
/**
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
export class HeatLayer extends BlanketOverlay {
    static defaultOptions: Partial<HeatLayerOptions>;
    /**
     * Creates a heatmap of the given points: `LatLng`s or arrays
     * `[lat, lng, intensity]` (the intensity defaults to `1`).
     * @param {LatLngExpression[]} [latlngs]
     * @param {HeatLayerOptions} [options]
     */
    constructor(latlngs?: LatLngExpression[], options?: HeatLayerOptions);
    /**
     * Replaces the points of the heatmap.
     * @param {LatLngExpression[]} latlngs
     * @returns {this}
     */
    setLatLngs(latlngs: LatLngExpression[]): this;
    /**
     * Adds a point to the heatmap.
     * @param {LatLngExpression} latlng
     * @returns {this}
     */
    addLatLng(latlng: LatLngExpression): this;
    /**
     * Returns the points of the heatmap.
     * @returns {LatLngExpression[]}
     */
    getLatLngs(): LatLngExpression[];
    /**
     * Changes the options, e.g. the `radius` or the `gradient`.
     * @param {HeatLayerOptions} options
     * @returns {this}
     */
    setOptions(options: HeatLayerOptions): this;
    /**
     * Redraws the heatmap.
     * @returns {this}
     */
    redraw(): this;
    /** The options of the HeatLayer, see [the options](#heatlayeroptions). */
    options: HeatLayerOptions;
}
/**
 * Options of `HeatLayer`.
 */
export interface HeatLayerOptions extends BlanketOverlayOptions {
    /**
     * The radius of each point in pixels.
     * @default 25
     */
    radius?: number;
    /**
     * The amount of blur in pixels.
     * @default 15
     */
    blur?: number;
    /**
     * The intensity with the strongest color.
     * @default 1
     */
    max?: number;
    /**
     * The zoom level where the points reach the full
     * intensity; below it, the intensity is halved per zoom level. By default the
     * maximum zoom of the map.
     */
    maxZoom?: number;
    /**
     * The minimum opacity of the heat.
     * @default 0.05
     */
    minOpacity?: number;
    /**
     * The colors for the intensities from `0` to `1`, any CSS colors.
     * @default {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'}
     */
    gradient?: Record<number, string>;
    /**
     * The map pane of the layer.
     * @default 'overlayPane'
     */
    pane?: string;
}
import { BlanketOverlay } from './BlanketOverlay.js';
import type { LatLngExpression } from '../geo/LatLng.js';
