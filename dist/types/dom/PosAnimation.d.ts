import type { MaplairEvent } from '../core/Events.js';
/** @import {Point} from '../geometry/Point.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
 * Used internally for panning animations and utilizing CSS Transitions for modern
 * browsers.
 *
 * @example
 * ```js
 * const myPositionMarker = new Marker([48.864716, 2.294694]).addTo(map);
 *
 * myPositionMarker.on("click", function() {
 * 	const pos = map.latLngToLayerPoint(myPositionMarker.getLatLng());
 * 	pos.y -= 25;
 * 	const fx = new PosAnimation();
 *
 * 	fx.once('end',function() {
 * 		pos.y += 25;
 * 		fx.run(myPositionMarker._icon, pos, 0.8);
 * 	});
 *
 * 	fx.run(myPositionMarker._icon, pos, 0.3);
 * });
 *
 * ```
 *
 * @fires start {MaplairEvent} Fired when the animation starts.
 * @fires step {MaplairEvent} Fired continuously during the animation.
 * @fires end {MaplairEvent} Fired when the animation ends.
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
