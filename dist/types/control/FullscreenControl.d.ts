import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
import type { MaplairEvent } from '../core/Events.js';
/** @typedef {typeof mapFullscreenMethods} MapFullscreenMethods */
/**
 * A control with a button to view the map in fullscreen and to exit it again. It is
 * put on the map if you set its [`fullscreenControl` option](#map-fullscreencontrol)
 * to `true`. Where the browser does not support the
 * [Fullscreen API](https://developer.mozilla.org/docs/Web/API/Fullscreen_API)
 * (e.g. Safari on iPhone) or refuses fullscreen (e.g. in an iframe without
 * `allow="fullscreen"`), the map is enlarged to the size of the window instead.
 *
 * @example
 * ```js
 * new FullscreenControl({position: 'topright'}).addTo(map);
 * ```
 */
export class FullscreenControl extends Control {
    /**
     * Creates a fullscreen control.
     * @param {...FullscreenControlOptions} args The options.
     */
    constructor(options?: FullscreenControlOptions);
    /** The options of the FullscreenControl, see [the options](#fullscreencontroloptions). */
    options: FullscreenControlOptions;
}
/**
 * Options of `FullscreenControl`.
 */
export interface FullscreenControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topleft'
     */
    position?: string;
    /**
     * The HTML content of the button while the map is not in
     * fullscreen, by default an expand icon.
     */
    enterText?: string;
    /**
     * The HTML content of the button while the map is in
     * fullscreen, by default a collapse icon.
     */
    exitText?: string;
}
/**
 * Map options of `FullscreenControl`.
 */
export interface FullscreenControlMapOptions {
    /**
     * Whether a
     * [fullscreen control](#fullscreencontrol) is added to the map by default.
     * @default false
     */
    fullscreenControl?: boolean;
}
/**
 * Properties of `MaplairMap` set by `FullscreenControl`.
 */
export interface FullscreenControlMapProperties {
    /**
     * The default fullscreen control (only
     * available if the [`fullscreenControl` option](#map-fullscreencontrol) was `true` when
     * creating the map).
     */
    fullscreenControl: FullscreenControl;
}
/**
 * Methods of `MaplairMap` for the fullscreen view.
 * @fires MaplairMap#enterfullscreen {MaplairEvent} Fired when the map enters fullscreen.
 * @fires MaplairMap#exitfullscreen {MaplairEvent} Fired when the map exits fullscreen.
 * @fires MaplairMap#fullscreenchange {MaplairEvent} Fired when the map enters or exits
 * fullscreen.
 */
export interface MapFullscreenMethods {
    /**
     * Enters or exits the fullscreen view of the map, see `FullscreenControl`.
     * Browsers allow entering fullscreen only in response to a user interaction,
     * e.g. a click.
     * @group Methods for modifying map state
     * @returns {this}
     */
    toggleFullscreen(): this;
    /**
     * Returns `true` if the map is viewed in fullscreen.
     * @group Other methods
     * @returns {boolean}
     */
    isFullscreen(): boolean;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
export {};
declare module '../map/Map.js' {
    interface MaplairMapOptions extends FullscreenControlMapOptions {
    }
}
declare module '../map/Map.js' {
    interface MaplairMap extends FullscreenControlMapProperties {
    }
}
declare module '../map/Map.js' {
    interface MaplairMap extends MapFullscreenMethods {
    }
}
