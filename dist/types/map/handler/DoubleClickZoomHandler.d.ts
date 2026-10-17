/** @import {MaplairMap} from '../Map.js' */
/**
 * Map options of `DoubleClickZoomHandler`.
 * @typedef {object} DoubleClickZoomHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean|'center'} [doubleClickZoom=true] Whether the map can be zoomed in
 * by double clicking on it and zoomed out by double clicking while holding shift. If
 * passed `'center'`, double-click zoom will zoom to the center of the view regardless
 * of where the pointer was.
 */
/**
 * Handler of `MaplairMap` for double-click zoom.
 *
 * Map properties include interaction handlers that allow you to control interaction
 * behavior in runtime, enabling or disabling certain features such as dragging or
 * touch zoom (see `Handler` methods). For example:
 *
 * ```js
 * map.doubleClickZoom.disable();
 * ```
 *
 * @typedef {object} DoubleClickZoomHandlerMapProperties
 * @lends MaplairMap
 * @property {DoubleClickZoomHandler} doubleClickZoom Double click zoom handler.
 */
/**
 * Handles double-click zoom on the map, enabled by default, see the map option
 * `doubleClickZoom`.
 */
export class DoubleClickZoomHandler extends Handler {
    /**
     * @param {...MaplairMap} args The map.
     */
    constructor(map: MaplairMap);
    /**
     * Called when the handler is enabled, adds the event hooks.
     */
    addHooks(): void;
    /**
     * Called when the handler is disabled, removes the event hooks.
     */
    removeHooks(): void;
}
/**
 * Map options of `DoubleClickZoomHandler`.
 */
export interface DoubleClickZoomHandlerMapOptions {
    /**
     * Whether the map can be zoomed in
     * by double clicking on it and zoomed out by double clicking while holding shift. If
     * passed `'center'`, double-click zoom will zoom to the center of the view regardless
     * of where the pointer was.
     * @default true
     */
    doubleClickZoom?: boolean|'center';
}
/**
 * Handler of `MaplairMap` for double-click zoom.
 *
 * Map properties include interaction handlers that allow you to control interaction
 * behavior in runtime, enabling or disabling certain features such as dragging or
 * touch zoom (see `Handler` methods). For example:
 *
 * ```js
 * map.doubleClickZoom.disable();
 * ```
 */
export interface DoubleClickZoomHandlerMapProperties {
    /**
     * Double click zoom handler.
     */
    doubleClickZoom: DoubleClickZoomHandler;
}
import { Handler } from '../../core/Handler.js';
import type { MaplairMap } from '../Map.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends DoubleClickZoomHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends DoubleClickZoomHandlerMapProperties {
    }
}
