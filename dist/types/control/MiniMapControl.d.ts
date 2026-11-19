import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMapOptions} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {PathOptions} from '../layer/vector/Path.js' */
/**
 * Options of `MiniMapControl`.
 * @typedef {object} MiniMapControlOptions
 * @property {string} [position='bottomright'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {number} [width=150] The width of the overview map in pixels.
 * @property {number} [height=150] The height of the overview map in pixels.
 * @property {number} [zoomOffset=-5] The zoom level of the overview map relative to the
 * map.
 * @property {boolean} [collapsed=false] Whether the overview map is collapsed initially.
 * @property {PathOptions} [rectangleOptions={color: '#ff7800', weight: 1, fillOpacity: 0.2}]
 * The style of the rectangle showing the view of the map.
 * @property {MaplairMapOptions} [mapOptions={}] Further options of the overview map.
 * @extends ControlOptions
 */
/**
 * An overview map in a corner of the map, showing the view of the map as a
 * rectangle (or rotated rectangle on a rotated map) at a smaller zoom level.
 * Dragging the overview map pans the map, clicking it centers the map there, and
 * a button collapses it.
 *
 * Inspired by the [Leaflet-MiniMap](https://github.com/Norkart/Leaflet-MiniMap) plugin.
 *
 * @example
 * ```js
 * // a layer of its own, a layer can only be on one map
 * const overviewLayer = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
 * new MiniMapControl(overviewLayer).addTo(map);
 * ```
 */
export class MiniMapControl extends Control {
    static defaultOptions: Partial<MiniMapControlOptions>;
    /**
     * Creates an overview map control showing `layer` (which must not be on another map).
     * @param {Layer} layer
     * @param {MiniMapControlOptions} [options]
     */
    constructor(layer: Layer, options?: MiniMapControlOptions);
    /**
     * Adds the control to the given map.
     * @param {MaplairMap} map
     * @returns {this}
     */
    addTo(map: MaplairMap): this;
    /**
     * Returns the overview map.
     * @returns {MaplairMap}
     */
    getMiniMap(): MaplairMap;
    /**
     * Collapses or expands the overview map.
     * @returns {this}
     */
    toggle(): this;
    /** The options of the MiniMapControl, see [the options](#minimapcontroloptions). */
    options: MiniMapControlOptions;
}
/**
 * Options of `MiniMapControl`.
 */
export interface MiniMapControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'bottomright'
     */
    position?: string;
    /**
     * The width of the overview map in pixels.
     * @default 150
     */
    width?: number;
    /**
     * The height of the overview map in pixels.
     * @default 150
     */
    height?: number;
    /**
     * The zoom level of the overview map relative to the
     * map.
     * @default -5
     */
    zoomOffset?: number;
    /**
     * Whether the overview map is collapsed initially.
     * @default false
     */
    collapsed?: boolean;
    /**
     * The style of the rectangle showing the view of the map.
     * @default {color: '#ff7800', weight: 1, fillOpacity: 0.2}
     */
    rectangleOptions?: PathOptions;
    /**
     * Further options of the overview map.
     * @default {}
     */
    mapOptions?: MaplairMapOptions;
}
import { Control } from './Control.js';
import type { Layer } from '../layer/Layer.js';
import { MaplairMap } from '../map/Map.js';
import { Polygon } from '../layer/vector/Polygon.js';
import type { PathOptions } from '../layer/vector/Path.js';
import type { MaplairMapOptions } from '../map/Map.js';
