/**
 * Map options of `ScrollWheelZoomHandler`, the mouse wheel options.
 * @typedef {object} ScrollWheelZoomHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean|'center'|'trackpad'} [scrollWheelZoom=true] Whether the map can
 * be zoomed by using the mouse wheel and by pinching on a touchpad (or using the mouse
 * wheel with the Ctrl key). If passed `'center'`, it will zoom to the center of the
 * view regardless of where the pointer was. If passed `'trackpad'`, scrolling (e.g.
 * with two fingers on a touchpad) pans the map instead, while pinching still zooms.
 * @property {number} [wheelDebounceTime=40] Limits the rate at which a wheel can fire
 * (in milliseconds). By default, the user can't zoom via wheel more often than once
 * per 40 ms.
 * @property {number} [wheelPxPerZoomLevel=60] How many scroll pixels (as reported by
 * [DomEvent.getWheelDelta](#domevent-getwheeldelta)) mean a change of one full zoom
 * level. Smaller values will make wheel-zooming faster (and vice versa).
 */
/**
 * Handler of `MaplairMap` for scroll wheel zoom.
 * @typedef {object} ScrollWheelZoomHandlerMapProperties
 * @lends MaplairMap
 * @property {ScrollWheelZoomHandler} scrollWheelZoom Scroll wheel zoom handler.
 */
/**
 * Enables mouse scroll wheel zoom on the map, as well as touchpad gestures: pinching
 * zooms, and with `scrollWheelZoom: 'trackpad'` scrolling with two fingers pans.
 * Enabled by default, see the map option `scrollWheelZoom`.
 */
export class ScrollWheelZoomHandler extends Handler {
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
 * Map options of `ScrollWheelZoomHandler`, the mouse wheel options.
 */
export interface ScrollWheelZoomHandlerMapOptions {
    /**
     * Whether the map can
     * be zoomed by using the mouse wheel and by pinching on a touchpad (or using the mouse
     * wheel with the Ctrl key). If passed `'center'`, it will zoom to the center of the
     * view regardless of where the pointer was. If passed `'trackpad'`, scrolling (e.g.
     * with two fingers on a touchpad) pans the map instead, while pinching still zooms.
     * @default true
     */
    scrollWheelZoom?: boolean|'center'|'trackpad';
    /**
     * Limits the rate at which a wheel can fire
     * (in milliseconds). By default, the user can't zoom via wheel more often than once
     * per 40 ms.
     * @default 40
     */
    wheelDebounceTime?: number;
    /**
     * How many scroll pixels (as reported by
     * [DomEvent.getWheelDelta](#domevent-getwheeldelta)) mean a change of one full zoom
     * level. Smaller values will make wheel-zooming faster (and vice versa).
     * @default 60
     */
    wheelPxPerZoomLevel?: number;
}
/**
 * Handler of `MaplairMap` for scroll wheel zoom.
 */
export interface ScrollWheelZoomHandlerMapProperties {
    /**
     * Scroll wheel zoom handler.
     */
    scrollWheelZoom: ScrollWheelZoomHandler;
}
import { Handler } from '../../core/Handler.js';
import { Point } from '../../geometry/Point.js';
import type { MaplairMap } from '../Map.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends ScrollWheelZoomHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends ScrollWheelZoomHandlerMapProperties {
    }
}
