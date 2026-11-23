import type { MaplairEvent } from '../core/Events.js';
/** @import {Point} from '../geometry/Point.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
 * Runs the map's pan animations: moves an element to a new position on an ease-out
 * curve, firing `start`, `step` and `end`.
 * @internal
 */
export class PosAnimation extends Evented {
    /**
     * Creates a `PosAnimation` object.
     * @param {...any} args
     */
    constructor(...args: any[]);
    /**
     * Run an animation of a given element to a new position, optionally setting
     * duration in seconds (`0.25` by default) and easing linearity factor (3rd
     * argument of the [cubic bezier curve](https://cubic-bezier.com/#0,0,.5,1),
     * `0.5` by default).
     * @param {HTMLElement} el
     * @param {Point} newPos
     * @param {number} [duration=0.25]
     * @param {number} [easeLinearity=0.5]
     * @returns {void}
     */
    run(el: HTMLElement, newPos: Point, duration?: number, easeLinearity?: number): void;
    /**
     * Stops the animation (if currently running).
     * @returns {void}
     */
    stop(): void;
}
import { Evented } from '../core/Events.js';
import type { Point } from '../geometry/Point.js';
