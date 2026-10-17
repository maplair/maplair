import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
/**
 * Options of `RotateControl`.
 * @typedef {object} RotateControlOptions
 * @property {string} [position='topleft'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @extends ControlOptions
 */
/**
 * Map options of `RotateControl`.
 * @typedef {object} RotateControlMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [rotateControl=false] Whether a [rotate control](#rotatecontrol)
 * is added to the map by default.
 */
/**
 * Properties of `MaplairMap` set by `RotateControl`.
 * @typedef {object} RotateControlMapProperties
 * @lends MaplairMap
 * @property {RotateControl} rotateControl The default rotate control (only available if
 * the [`rotateControl` option](#map-rotatecontrol) was `true` when creating the map).
 */
/**
 * A compass showing the rotation of the map (see `MaplairMap.setBearing()`); clicking it
 * rotates the map back to north up. It is put on the map if you set its
 * [`rotateControl` option](#map-rotatecontrol) to `true`.
 *
 * @example
 * ```js
 * new RotateControl({position: 'topright'}).addTo(map);
 * ```
 */
export class RotateControl extends Control {
    /**
     * Creates a rotate control.
     * @param {...RotateControlOptions} args The options.
     */
    constructor(options?: RotateControlOptions);
    /** The options of the RotateControl, see [the options](#rotatecontroloptions). */
    options: RotateControlOptions;
}
/**
 * Options of `RotateControl`.
 */
export interface RotateControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topleft'
     */
    position?: string;
}
/**
 * Map options of `RotateControl`.
 */
export interface RotateControlMapOptions {
    /**
     * Whether a [rotate control](#rotatecontrol)
     * is added to the map by default.
     * @default false
     */
    rotateControl?: boolean;
}
/**
 * Properties of `MaplairMap` set by `RotateControl`.
 */
export interface RotateControlMapProperties {
    /**
     * The default rotate control (only available if
     * the [`rotateControl` option](#map-rotatecontrol) was `true` when creating the map).
     */
    rotateControl: RotateControl;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
declare module '../map/Map.js' {
    interface MaplairMapOptions extends RotateControlMapOptions {
    }
}
declare module '../map/Map.js' {
    interface MaplairMap extends RotateControlMapProperties {
    }
}
