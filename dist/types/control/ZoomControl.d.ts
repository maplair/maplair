import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
 * Options of `ZoomControl`.
 * @typedef {object} ZoomControlOptions
 * @property {string} [position='topleft'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {string} [zoomInText] The HTML of the 'zoom in' button, a plus sign drawn
 * in SVG by default.
 * @property {string} [zoomOutText] The HTML of the 'zoom out' button, a minus sign
 * drawn in SVG by default.
 * @extends ControlOptions
 */
/**
 * Map options of `ZoomControl`.
 * @typedef {object} ZoomControlMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [zoomControl=true] Whether a [zoom control](#control-zoom) is
 * added to the map by default.
 */
/**
 * Properties of `MaplairMap` set by `ZoomControl`.
 * @typedef {object} ZoomControlMapProperties
 * @lends MaplairMap
 * @property {ZoomControl} zoomControl The default zoom control (only available if the
 * [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
 */
/**
 * A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by
 * default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`.
 */
export class ZoomControl extends Control {
    static defaultOptions: Partial<ZoomControlOptions>;
    /**
     * Creates a zoom control.
     * @param {...ZoomControlOptions} args The options.
     */
    constructor(options?: ZoomControlOptions);
    /**
     * Disables the zoom buttons.
     * @returns {this}
     */
    disable(): this;
    /**
     * Enables the zoom buttons (if the zoom level allows).
     * @returns {this}
     */
    enable(): this;
    /** The options of the ZoomControl, see [the options](#zoomcontroloptions). */
    options: ZoomControlOptions;
}
/**
 * Options of `ZoomControl`.
 */
export interface ZoomControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topleft'
     */
    position?: string;
    /**
     * The HTML of the 'zoom in' button, a plus sign drawn
     * in SVG by default.
     */
    zoomInText?: string;
    /**
     * The HTML of the 'zoom out' button, a minus sign
     * drawn in SVG by default.
     */
    zoomOutText?: string;
}
/**
 * Map options of `ZoomControl`.
 */
export interface ZoomControlMapOptions {
    /**
     * Whether a [zoom control](#control-zoom) is
     * added to the map by default.
     * @default true
     */
    zoomControl?: boolean;
}
/**
 * Properties of `MaplairMap` set by `ZoomControl`.
 */
export interface ZoomControlMapProperties {
    /**
     * The default zoom control (only available if the
     * [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
     */
    zoomControl: ZoomControl;
}
import { Control } from './Control.js';
declare module '../map/Map.js' {
    interface MaplairMapOptions extends ZoomControlMapOptions {
    }
}
declare module '../map/Map.js' {
    interface MaplairMap extends ZoomControlMapProperties {
    }
}
