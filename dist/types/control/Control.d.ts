/**
 * Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 *
 * Every control should extend from `Control` and (re-)implement the following methods:
 *
 * * `onAdd(map: MaplairMap): HTMLElement` should return the container DOM element for
 *   the control and add listeners on relevant map events. Called on
 *   [`control.addTo(map)`](#control-addTo).
 * * `onRemove(map: MaplairMap)` (optional) should contain all clean up code that removes
 *   the listeners previously added in [`onAdd`](#control-onadd). Called on
 *   [`control.remove()`](#control-remove).
 */
export class Control extends Class {
    static defaultOptions: Partial<ControlOptions>;
    /**
     * @param {ControlOptions} [options]
     */
    constructor(options?: ControlOptions);
    /**
     * Returns the position of the control.
     * @returns {string}
     */
    getPosition(): string;
    /**
     * Sets the position of the control.
     * @param {string} position
     * @returns {this}
     */
    setPosition(position: string): this;
    /**
     * Returns the HTMLElement that contains the control.
     * @returns {HTMLElement}
     */
    getContainer(): HTMLElement;
    /**
     * Adds the control to the given map.
     * @param {MaplairMap} map
     * @returns {this}
     */
    addTo(map: MaplairMap): this;
    /**
     * Removes the control from the map it is currently active on.
     * @returns {this}
     */
    remove(): this;
    /** The options of the Control, see [the options](#controloptions). */
    options: ControlOptions;
}
/**
 * Options of `Control`, inherited by all controls.
 */
export interface ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topright'
     */
    position?: string;
    /**
     * The position of the control within its corner: controls
     * with a lower order are closer to the corner of the map, those with the same order in
     * the order of adding.
     * @default 0
     */
    order?: number;
}
/**
 * Methods of `MaplairMap` for controls.
 */
export interface MapControlMethods {
    /**
     * Adds the given control to the map.
     * @group Methods for layers and controls
     * @param {Control} control
     * @returns {this}
     */
    addControl(control: Control): this;
    /**
     * Removes the given control from the map.
     * @group Methods for layers and controls
     * @param {Control} control
     * @returns {this}
     */
    removeControl(control: Control): this;
}
/**
 * The methods which controls implement, see `Control`.
 */
export interface ControlExtensionMethods {
    /**
     * Should return the container DOM
     * element for the control and add listeners on relevant map events. Called on
     * [`control.addTo(map)`](#control-addto).
     */
    onAdd?(map: MaplairMap): HTMLElement;
    /**
     * Should contain all clean up code that
     * removes the listeners previously added in `onAdd`. Called on
     * [`control.remove()`](#control-remove).
     */
    onRemove?(map: MaplairMap): void;
}
import { Class } from '../core/Class.js';
import type { MaplairMap } from '../map/Map.js';
export {};
declare module '../map/Map.js' {
    interface MaplairMap extends MapControlMethods {
    }
}
export interface Control extends ControlExtensionMethods {
}
