import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
 * Options of `ScaleControl`.
 * @typedef {object} ScaleControlOptions
 * @property {string} [position='bottomleft'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {number} [maxWidth=100] Maximum width of the control in pixels. The width is
 * set dynamically to show round values (e.g. 100, 200, 500).
 * @property {boolean} [metric=true] Whether to show the metric scale line (m/km).
 * @property {boolean} [imperial=true] Whether to show the imperial scale line (mi/ft).
 * @property {boolean} [updateWhenIdle=false] If `true`, the control is updated on
 * [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on
 * [`move`](#map-move)).
 * @extends ControlOptions
 */
/**
 * A simple scale control that shows the scale of the current center of screen in metric
 * (m/km) and imperial (mi/ft) systems.
 *
 * @example
 *
 * ```js
 * new ScaleControl().addTo(map);
 * ```
 */
export class ScaleControl extends Control {
    /**
     * Creates a scale control with the given options.
     * @param {...ScaleControlOptions} args The options.
     */
    constructor(options?: ScaleControlOptions);
    /** The options of the ScaleControl, see [the options](#scalecontroloptions). */
    options: ScaleControlOptions;
}
/**
 * Options of `ScaleControl`.
 */
export interface ScaleControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'bottomleft'
     */
    position?: string;
    /**
     * Maximum width of the control in pixels. The width is
     * set dynamically to show round values (e.g. 100, 200, 500).
     * @default 100
     */
    maxWidth?: number;
    /**
     * Whether to show the metric scale line (m/km).
     * @default true
     */
    metric?: boolean;
    /**
     * Whether to show the imperial scale line (mi/ft).
     * @default true
     */
    imperial?: boolean;
    /**
     * If `true`, the control is updated on
     * [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on
     * [`move`](#map-move)).
     * @default false
     */
    updateWhenIdle?: boolean;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
