import type { LayerOptions } from './Layer.js';
/** @import {LayerOptions} from './Layer.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener} from '../core/Events.js' */
/**
 * Options of `BlanketOverlay`.
 * @typedef {object} BlanketOverlayOptions
 * @property {number} [padding=0.1] How much to extend the clip area around the map
 * view (relative to its size) e.g. 0.1 would be 10% of map view in each direction.
 * @property {boolean} [continuous=false] When `false`, the blanket will update its
 * position only when the map state settles (*after* a pan/zoom animation). When
 * `true`, it will update when the map state changes (*during* pan/zoom animations).
 * @extends LayerOptions
 */
/**
 * Represents an HTML element that covers ("blankets") the entire surface
 * of the map.
 *
 * Do not use this class directly. It's meant for `Renderer`, and for plugins
 * that rely on one single HTML element.
 *
 * Subclasses must define the following methods:
 *
 * * `_initContainer()` must initialize the HTML element to use as blanket, and store
 *   it as `this._container`. The base implementation creates a blank `<div>`.
 * * `_destroyContainer()` must destroy the HTML element in `this._container` and free
 *   any other resources. The base implementation destroys the element and removes
 *   any event handlers attached to it.
 * * `_resizeContainer(): Point`: the base implementation resizes the container
 *   (based on the map's size and taking into account the padding), returning the new
 *   size in CSS pixels. Subclass implementations shall reset container parameters and
 *   data structures as needed.
 * * `_onZoomEnd(ev?: PointerEvent)` (optional) runs on the map's `zoomend` event.
 * * `_onViewReset(ev?: PointerEvent)` (optional) runs on the map's `viewreset` event.
 * * `_onSettled()` runs whenever the map state settles after changing (at the end of
 *   pan/zoom animations, etc). This should trigger the bulk of any rendering logic.
 *   If the `continuous` option is set to `true`, then this also runs on any map
 *   state change (including *during* pan/zoom animations).
 */
export class BlanketOverlay extends Layer {
    /**
     * @param {BlanketOverlayOptions} [options]
     */
    constructor(options?: BlanketOverlayOptions);
    onAdd(map: MaplairMap): void;
    onRemove(map: MaplairMap): void;
    /**
     * Returns the map events the blanket listens to.
     * @returns {Record<string, EventListener>}
     */
    getEvents(): Record<string, EventListener>;
    /** The options of the BlanketOverlay, see [the options](#blanketoverlayoptions). */
    options: BlanketOverlayOptions;
}
/**
 * Options of `BlanketOverlay`.
 */
export interface BlanketOverlayOptions extends LayerOptions {
    /**
     * How much to extend the clip area around the map
     * view (relative to its size) e.g. 0.1 would be 10% of map view in each direction.
     * @default 0.1
     */
    padding?: number;
    /**
     * When `false`, the blanket will update its
     * position only when the map state settles (*after* a pan/zoom animation). When
     * `true`, it will update when the map state changes (*during* pan/zoom animations).
     * @default false
     */
    continuous?: boolean;
}
import { Layer } from './Layer.js';
import type { MaplairMap } from '../map/Map.js';
import type { EventListener } from '../core/Events.js';
import { Bounds } from '../geometry/Bounds.js';
