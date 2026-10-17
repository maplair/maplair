import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
import type { MaplairEvent } from '../core/Events.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
 * Options of `SideBySideControl`.
 * @typedef {object} SideBySideControlOptions
 * @property {number} [ratio=0.5] The initial position of the divider, from `0` (left) to
 * `1` (right).
 * @extends ControlOptions
 */
/**
 * The event object of `dividermove`.
 * @typedef {object} DividerMoveEvent
 * @property {number} ratio The position of the divider, from `0` (left) to `1` (right).
 * @property {number} x The position of the divider in container pixels.
 * @extends MaplairEvent
 */
/**
 * Compares layers side by side: a vertical divider across the map shows the
 * "left" layers on its left and the "right" layers on its right side. The divider
 * can be dragged, or moved with the arrow keys. Works with layers having a
 * container or element of their own, e.g. tile layers and image overlays.
 *
 * Inspired by the [leaflet-side-by-side](https://github.com/digidem/leaflet-side-by-side) plugin.
 *
 * @example
 * ```js
 * const before = new TileLayer('https://…/2020/{z}/{x}/{y}.png').addTo(map);
 * const after = new TileLayer('https://…/2025/{z}/{x}/{y}.png').addTo(map);
 * new SideBySideControl(before, after).addTo(map);
 * ```
 *
 * @fires MaplairMap#dividermove {DividerMoveEvent} Fired when the divider of a
 * `SideBySideControl` moves.
 */
export class SideBySideControl extends Control {
    /**
     * Creates a side-by-side control for the given layers (which have to be added to the
     * map separately).
     * @param {Layer|Layer[]} [leftLayers]
     * @param {Layer|Layer[]} [rightLayers]
     * @param {SideBySideControlOptions} [options]
     */
    constructor(leftLayers?: Layer | Layer[], rightLayers?: Layer | Layer[], options?: SideBySideControlOptions);
    /**
     * Adds the control to the given map. The divider spans the map instead of being in
     * a corner.
     * @param {MaplairMap} map
     * @returns {this}
     */
    addTo(map: MaplairMap): this;
    /**
     * Sets the layers shown on the left side of the divider.
     * @param {Layer|Layer[]} layers
     * @returns {this}
     */
    setLeftLayers(layers: Layer | Layer[]): this;
    /**
     * Sets the layers shown on the right side of the divider.
     * @param {Layer|Layer[]} layers
     * @returns {this}
     */
    setRightLayers(layers: Layer | Layer[]): this;
    /**
     * Returns the position of the divider, from `0` (left) to `1` (right).
     * @returns {number}
     */
    getRatio(): number;
    /**
     * Moves the divider, from `0` (left) to `1` (right).
     * @param {number} ratio
     * @returns {this}
     */
    setRatio(ratio: number): this;
    /** The options of the SideBySideControl, see [the options](#sidebysidecontroloptions). */
    options: SideBySideControlOptions;
}
/**
 * Options of `SideBySideControl`.
 */
export interface SideBySideControlOptions extends ControlOptions {
    /**
     * The initial position of the divider, from `0` (left) to
     * `1` (right).
     * @default 0.5
     */
    ratio?: number;
}
/**
 * The event object of `dividermove`.
 */
export interface DividerMoveEvent extends MaplairEvent {
    /**
     * The position of the divider, from `0` (left) to `1` (right).
     */
    ratio: number;
    /**
     * The position of the divider in container pixels.
     */
    x: number;
}
import { Control } from './Control.js';
import type { Layer } from '../layer/Layer.js';
import type { MaplairMap } from '../map/Map.js';
