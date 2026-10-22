import type { LatLngBounds } from '../../geo/LatLngBounds.js';
import type { MaplairEvent, DragEndEvent } from '../../core/Events.js';
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent, DragEndEvent} from '../../core/Events.js' */
/**
 * Map options of `DragHandler`, the interaction options for dragging.
 * @typedef {object} DragHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [dragging=true] Whether the map is draggable with pointer or not.
 * @property {boolean} [inertia=true] If enabled, panning of the map will have an
 * inertia effect where the map builds momentum while dragging and continues moving in
 * the same direction for some time. Feels especially nice on touch devices.
 * @property {number} [inertiaDeceleration=3400] The rate with which the inertial
 * movement slows down, in pixels/second².
 * @property {number} [inertiaMaxSpeed=Infinity] Max speed of the inertial movement,
 * in pixels/second.
 * @property {number} [easeLinearity=0.2] The linearity of the easing of the inertial
 * movement.
 * @property {boolean} [worldCopyJump=false] With this option enabled, the map tracks
 * when you pan to another "copy" of the world and seamlessly jumps to the original one
 * so that all overlays like markers and vector layers are still visible. A map with an
 * infinite CRS, such as `SimpleCRS`, does not jump, as it has no copies of the world.
 * @property {number} [maxBoundsViscosity=0.0] If `maxBounds` is set, this option will
 * control how solid the bounds are when dragging the map around. The default value of
 * `0.0` allows the user to drag outside the bounds at normal speed, higher values will
 * slow down map dragging outside bounds, and `1.0` makes the bounds fully solid,
 * preventing the user from dragging outside the bounds.
 */
/**
 * Handler of `MaplairMap` for dragging.
 * @typedef {object} DragHandlerMapProperties
 * @lends MaplairMap
 * @property {DragHandler} dragging Map dragging handler.
 */
/**
 * Makes the map draggable (with panning inertia), enabled by default, see the map
 * option `dragging`.
 *
 * @fires MaplairMap#dragstart {MaplairEvent} Fired when the user starts dragging the map.
 * @fires MaplairMap#drag {MaplairEvent} Fired repeatedly while the user drags the map.
 * @fires MaplairMap#dragend {DragEndEvent} Fired when the user stops dragging the map.
 */
export class DragHandler extends Handler {
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
    /**
     * Returns `true` if the map has been moved by the current or last drag.
     * @returns {boolean}
     */
    moved(): boolean;
    /**
     * Returns `true` while the map is being dragged.
     * @returns {boolean}
     */
    moving(): boolean;
}
/**
 * Map options of `DragHandler`, the interaction options for dragging.
 */
export interface DragHandlerMapOptions {
    /**
     * Whether the map is draggable with pointer or not.
     * @default true
     */
    dragging?: boolean;
    /**
     * If enabled, panning of the map will have an
     * inertia effect where the map builds momentum while dragging and continues moving in
     * the same direction for some time. Feels especially nice on touch devices.
     * @default true
     */
    inertia?: boolean;
    /**
     * The rate with which the inertial
     * movement slows down, in pixels/second².
     * @default 3400
     */
    inertiaDeceleration?: number;
    /**
     * Max speed of the inertial movement,
     * in pixels/second.
     * @default Infinity
     */
    inertiaMaxSpeed?: number;
    /**
     * The linearity of the easing of the inertial
     * movement.
     * @default 0.2
     */
    easeLinearity?: number;
    /**
     * With this option enabled, the map tracks
     * when you pan to another "copy" of the world and seamlessly jumps to the original one
     * so that all overlays like markers and vector layers are still visible. A map with an
     * infinite CRS, such as `SimpleCRS`, does not jump, as it has no copies of the world.
     * @default false
     */
    worldCopyJump?: boolean;
    /**
     * If `maxBounds` is set, this option will
     * control how solid the bounds are when dragging the map around. The default value of
     * `0.0` allows the user to drag outside the bounds at normal speed, higher values will
     * slow down map dragging outside bounds, and `1.0` makes the bounds fully solid,
     * preventing the user from dragging outside the bounds.
     * @default 0.0
     */
    maxBoundsViscosity?: number;
}
/**
 * Handler of `MaplairMap` for dragging.
 */
export interface DragHandlerMapProperties {
    /**
     * Map dragging handler.
     */
    dragging: DragHandler;
}
import { Handler } from '../../core/Handler.js';
import { Draggable } from '../../dom/Draggable.js';
import { Bounds } from '../../geometry/Bounds.js';
import type { MaplairMap } from '../Map.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends DragHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends DragHandlerMapProperties {
    }
}
