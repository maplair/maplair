import type { Bounds } from '../../geometry/Bounds.js';
import type { MaplairMap } from '../Map.js';
import type { MaplairEvent } from '../../core/Events.js';
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/**
 * The event object of `boxzoomend`.
 * @typedef {object} BoxZoomEndEvent
 * @property {LatLngBounds} boxZoomBounds The bounds of the box the map was zoomed to.
 * @extends MaplairEvent
 */
/**
 * Map options of `BoxZoomHandler`.
 * @typedef {object} BoxZoomHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [boxZoom=true] Whether the map can be zoomed to a rectangular
 * area specified by dragging the pointer while pressing the shift key.
 */
/**
 * Handler of `MaplairMap` for box zoom.
 * @typedef {object} BoxZoomHandlerMapProperties
 * @lends MaplairMap
 * @property {BoxZoomHandler} boxZoom Box (shift-drag with pointer) zoom handler.
 */
/**
 * Adds shift-drag zoom interaction to the map (zoom to a selected bounding box),
 * enabled by default, see the map option `boxZoom`.
 *
 * @fires MaplairMap#boxzoomstart {MaplairEvent} Fired when the user starts drawing
 * a box to zoom to.
 * @fires MaplairMap#boxzoomend {BoxZoomEndEvent} Fired when the user has drawn a box
 * and the map is zoomed to it.
 */
export class BoxZoomHandler extends Handler {
    /**
     * Called when the handler is enabled, adds the event hooks.
     */
    addHooks(): void;
    /**
     * Called when the handler is disabled, removes the event hooks.
     */
    removeHooks(): void;
    /**
     * Returns `true` if a box has been drawn by the current or last interaction.
     * @returns {boolean}
     */
    moved(): boolean;
}
/**
 * The event object of `boxzoomend`.
 */
export interface BoxZoomEndEvent extends MaplairEvent {
    /**
     * The bounds of the box the map was zoomed to.
     */
    boxZoomBounds: LatLngBounds;
}
/**
 * Map options of `BoxZoomHandler`.
 */
export interface BoxZoomHandlerMapOptions {
    /**
     * Whether the map can be zoomed to a rectangular
     * area specified by dragging the pointer while pressing the shift key.
     * @default true
     */
    boxZoom?: boolean;
}
/**
 * Handler of `MaplairMap` for box zoom.
 */
export interface BoxZoomHandlerMapProperties {
    /**
     * Box (shift-drag with pointer) zoom handler.
     */
    boxZoom: BoxZoomHandler;
}
import { Handler } from '../../core/Handler.js';
import { LatLngBounds } from '../../geo/LatLngBounds.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends BoxZoomHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends BoxZoomHandlerMapProperties {
    }
}
