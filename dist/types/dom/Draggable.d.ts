import type { MaplairEvent, DragEndEvent } from '../core/Events.js';
/** @import {MaplairEvent, DragEndEvent} from '../core/Events.js' */
/**
 * Options of `Draggable`.
 * @typedef {object} DraggableOptions
 * @property {number} [clickTolerance=3] The max number of pixels a user can shift the
 * pointer during a click for it to be considered a valid click (as opposed to a
 * pointer drag).
 */
/**
 * The event object of `dragstart`, `predrag` and `drag` of `Draggable`.
 * @typedef {object} DraggableEvent
 * @property {PointerEvent} originalEvent The DOM event of the pointer which drags.
 * @extends MaplairEvent
 */
/**
 * A class for making DOM elements draggable.
 * Used internally for map and marker dragging. Works on any DOM element.
 *
 * @example
 * ```js
 * const draggable = new Draggable(elementToDrag);
 * draggable.enable();
 * ```
 *
 * @fires down {MaplairEvent} Fired when a drag is about to start.
 * @fires dragstart {DraggableEvent} Fired when a drag starts.
 * @fires predrag {DraggableEvent} Fired continuously during dragging *before* each
 * corresponding update of the element's position.
 * @fires drag {DraggableEvent} Fired continuously during dragging.
 * @fires dragend {DragEndEvent} Fired when the drag ends (with `noInertia: true` if
 * the drag was finished without inertia, e.g. by disabling the draggable).
 */
export class Draggable extends Evented {
    static defaultOptions: Partial<DraggableOptions>;
    /**
     * Creates a `Draggable` object for moving `element` when you start dragging the
     * `dragStartTarget` element (equals `element` itself by default).
     * @param {HTMLElement} element
     * @param {HTMLElement} [dragStartTarget]
     * @param {DraggableOptions} [options]
     */
    constructor(element: HTMLElement, dragStartTarget?: HTMLElement, options?: DraggableOptions);
    /**
     * Enables the dragging ability.
     * @returns {void}
     */
    enable(): void;
    /**
     * Disables the dragging ability.
     * @returns {void}
     */
    disable(): void;
    /** The options of the Draggable, see [the options](#draggableoptions). */
    options: DraggableOptions;
}
/**
 * Options of `Draggable`.
 */
export interface DraggableOptions {
    /**
     * The max number of pixels a user can shift the
     * pointer during a click for it to be considered a valid click (as opposed to a
     * pointer drag).
     * @default 3
     */
    clickTolerance?: number;
}
/**
 * The event object of `dragstart`, `predrag` and `drag` of `Draggable`.
 */
export interface DraggableEvent extends MaplairEvent {
    /**
     * The DOM event of the pointer which drags.
     */
    originalEvent: PointerEvent;
}
import { Evented } from '../core/Events.js';
import { Point } from '../geometry/Point.js';
