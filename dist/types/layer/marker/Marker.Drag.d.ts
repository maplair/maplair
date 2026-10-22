import type { Bounds } from '../../geometry/Bounds.js';
import type { Point } from '../../geometry/Point.js';
import type { MarkerMoveEvent } from './Marker.js';
import type { MaplairEvent, DragEndEvent } from '../../core/Events.js';
/** @import {Marker, MarkerMoveEvent} from './Marker.js' */
/** @import {MaplairEvent, DragEndEvent} from '../../core/Events.js' */
/**
 * The handler of `Marker` which makes the markers draggable, see the
 * [`dragging`](#marker-dragging) property of markers and its `draggable` option.
 *
 * @fires Marker#dragstart {MaplairEvent} Fired when the user starts dragging the marker.
 * @fires Marker#movestart {MaplairEvent} Fired when the marker starts moving (because of
 * dragging).
 * @fires Marker#drag {MarkerMoveEvent} Fired repeatedly while the user drags the marker.
 * @fires Marker#dragend {DragEndEvent} Fired when the user stops dragging the marker.
 * @fires Marker#moveend {MaplairEvent} Fired when the marker stops moving (because of
 * dragging).
 */
export class MarkerDrag extends Handler {
    /**
     * Creates the dragging handler of the given marker.
     * @param {Marker} marker
     */
    constructor(marker: Marker);
    /**
     * Makes the icon of the marker draggable, called by `enable()`.
     */
    addHooks(): void;
    /**
     * Makes the icon of the marker undraggable, called by `disable()`.
     */
    removeHooks(): void;
    /**
     * Returns `true` if the marker has been moved by the current or last drag.
     * @returns {boolean}
     */
    moved(): boolean;
}
import { Handler } from '../../core/Handler.js';
import type { Marker } from './Marker.js';
import { Draggable } from '../../dom/Draggable.js';
