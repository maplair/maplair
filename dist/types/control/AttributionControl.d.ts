import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
/**
 * Options of `AttributionControl`.
 * @typedef {object} AttributionControlOptions
 * @property {string} [position='bottomright'] The position of the control (one of the
 * map corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {string|false|null} [prefix=null] The HTML text shown before the
 * attributions. Pass `false` to disable. By default (`null`), a link to Maplair.
 * @extends ControlOptions
 */
/**
 * Map options of `AttributionControl`.
 * @typedef {object} AttributionControlMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [attributionControl=true] Whether a
 * [attribution control](#control-attribution) is added to the map by default.
 */
/**
 * Properties of `MaplairMap` set by `AttributionControl`.
 * @typedef {object} AttributionControlMapProperties
 * @lends MaplairMap
 * @property {AttributionControl} attributionControl The attribution control of the map,
 * the default one (if the [`attributionControl` option](#map-attributioncontrol) was
 * `true` when creating the map) or the one added last.
 */
/**
 * The attribution control allows you to display attribution data in a small text box
 * on a map. It is put on the map by default unless you set its
 * [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches
 * attribution texts from layers with the [`getAttribution` method](#layer-getattribution)
 * automatically.
 */
export class AttributionControl extends Control {
    /**
     * Creates an attribution control.
     * @param {AttributionControlOptions} [options]
     */
    constructor(options?: AttributionControlOptions);
    /**
     * The HTML text shown before the attributions. Pass `false` to disable.
     * @param {string|false} prefix
     * @returns {this}
     */
    setPrefix(prefix: string | false): this;
    /**
     * Adds an attribution text (e.g. `'© OpenStreetMap contributors'`). Attributions
     * are sorted by `order` (see the layer option `attributionOrder`), then by the order
     * of adding.
     * @param {string} text
     * @param {number} [order=0]
     * @returns {this}
     */
    addAttribution(text: string, order?: number): this;
    /**
     * Removes an attribution text.
     * @param {string} text
     * @returns {this}
     */
    removeAttribution(text: string): this;
    /** The options of the AttributionControl, see [the options](#attributioncontroloptions). */
    options: AttributionControlOptions;
}
/**
 * Options of `AttributionControl`.
 */
export interface AttributionControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the
     * map corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'bottomright'
     */
    position?: string;
    /**
     * The HTML text shown before the
     * attributions. Pass `false` to disable. By default (`null`), a link to Maplair.
     * @default null
     */
    prefix?: string|false|null;
}
/**
 * Map options of `AttributionControl`.
 */
export interface AttributionControlMapOptions {
    /**
     * Whether a
     * [attribution control](#control-attribution) is added to the map by default.
     * @default true
     */
    attributionControl?: boolean;
}
/**
 * Properties of `MaplairMap` set by `AttributionControl`.
 */
export interface AttributionControlMapProperties {
    /**
     * The attribution control of the map,
     * the default one (if the [`attributionControl` option](#map-attributioncontrol) was
     * `true` when creating the map) or the one added last.
     */
    attributionControl: AttributionControl;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
declare module '../map/Map.js' {
    interface MaplairMapOptions extends AttributionControlMapOptions {
    }
}
declare module '../map/Map.js' {
    interface MaplairMap extends AttributionControlMapProperties {
    }
}
