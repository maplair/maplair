/** @import {MaplairMap} from '../Map.js' */
/**
 * Map options of `PinchZoomHandler`, touch interaction options.
 * @typedef {object} PinchZoomHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean|'center'} [pinchZoom=true] Whether the map can be zoomed by
 * touch-dragging with two fingers. If passed `'center'`, it will zoom to the center of
 * the view regardless of where the touch events (fingers) were. Enabled for
 * touch-capable web browsers.
 * @property {boolean} [bounceAtZoomLimits=true] Set it to false if you don't want the
 * map to zoom beyond min/max zoom and then bounce back when pinch-zooming.
 * @property {boolean|'center'} [touchZoom] Deprecated, use `pinchZoom` instead.
 */
/**
 * Handler of `MaplairMap` for pinch zoom.
 * @typedef {object} PinchZoomHandlerMapProperties
 * @lends MaplairMap
 * @property {PinchZoomHandler} pinchZoom Pinch zoom handler.
 * @property {PinchZoomHandler} touchZoom Deprecated, the same as `pinchZoom`.
 */
/**
 * Adds pinch zoom to the map on supported mobile browsers, enabled by default, see the
 * map option `pinchZoom`.
 */
export class PinchZoomHandler extends Handler {
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
 * Map options of `PinchZoomHandler`, touch interaction options.
 */
export interface PinchZoomHandlerMapOptions {
    /**
     * Whether the map can be zoomed by
     * touch-dragging with two fingers. If passed `'center'`, it will zoom to the center of
     * the view regardless of where the touch events (fingers) were. Enabled for
     * touch-capable web browsers.
     * @default true
     */
    pinchZoom?: boolean|'center';
    /**
     * Set it to false if you don't want the
     * map to zoom beyond min/max zoom and then bounce back when pinch-zooming.
     * @default true
     */
    bounceAtZoomLimits?: boolean;
    /**
     * Deprecated, use `pinchZoom` instead.
     */
    touchZoom?: boolean|'center';
}
/**
 * Handler of `MaplairMap` for pinch zoom.
 */
export interface PinchZoomHandlerMapProperties {
    /**
     * Pinch zoom handler.
     */
    pinchZoom: PinchZoomHandler;
    /**
     * Deprecated, the same as `pinchZoom`.
     */
    touchZoom: PinchZoomHandler;
}
import { Handler } from '../../core/Handler.js';
import type { MaplairMap } from '../Map.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends PinchZoomHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends PinchZoomHandlerMapProperties {
    }
}
