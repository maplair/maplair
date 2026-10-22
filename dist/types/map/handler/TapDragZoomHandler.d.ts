import type { Draggable } from '../../dom/Draggable.js';
/**
 * Map options of `TapDragZoomHandler`, touch interaction options.
 * @typedef {object} TapDragZoomHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean|'center'} [tapDragZoom=true] Whether the map can be zoomed with
 * one finger by tapping once, then touching again and dragging down (zoom in) or up
 * (zoom out). If passed `'center'`, it will zoom to the center of the view regardless
 * of where the finger was.
 */
/**
 * Handler of `MaplairMap` for tap-drag zoom.
 * @typedef {object} TapDragZoomHandlerMapProperties
 * @lends MaplairMap
 * @property {TapDragZoomHandler} tapDragZoom Tap-drag zoom handler (double tap and
 * drag with one finger).
 */
/**
 * Zooms the map with one finger on touch devices: tap once, then touch again and drag
 * down to zoom in or up to zoom out (as known from MapLibre GL JS and Google Maps).
 * Enabled by default, see the map option `tapDragZoom`.
 */
export class TapDragZoomHandler extends Handler {
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
 * Map options of `TapDragZoomHandler`, touch interaction options.
 */
export interface TapDragZoomHandlerMapOptions {
    /**
     * Whether the map can be zoomed with
     * one finger by tapping once, then touching again and dragging down (zoom in) or up
     * (zoom out). If passed `'center'`, it will zoom to the center of the view regardless
     * of where the finger was.
     * @default true
     */
    tapDragZoom?: boolean|'center';
}
/**
 * Handler of `MaplairMap` for tap-drag zoom.
 */
export interface TapDragZoomHandlerMapProperties {
    /**
     * Tap-drag zoom handler (double tap and
     * drag with one finger).
     */
    tapDragZoom: TapDragZoomHandler;
}
import { Handler } from '../../core/Handler.js';
import { Point } from '../../geometry/Point.js';
import type { MaplairMap } from '../Map.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends TapDragZoomHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends TapDragZoomHandlerMapProperties {
    }
}
