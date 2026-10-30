import type { addDoubleTapListener, removeDoubleTapListener } from './DomEvent.DoubleTap.js';
import type { getScale } from './DomUtil.js';
/**
 * Adds a listener function (`fn`) to a particular DOM event type of the
 * element `obj`. You can optionally specify the context of the listener
 * (object the `this` keyword will point to). You can also pass several
 * space-separated types (e.g. `'click dblclick'`). Alternatively, adds a set of
 * type/listener pairs, e.g. `{click: onClick, pointermove: onPointerMove}`, with the
 * context as third argument.
 * @param {EventTarget} obj
 * @param {string|Record<string, (ev: any) => void>} types
 * @param {((ev: any) => void)|object} [fn]
 * @param {object} [context]
 * @returns {typeof import('./DomEvent.js')}
 */
export function on(obj: EventTarget, types: string | Record<string, (ev: any) => void>, fn?: ((ev: any) => void) | object, context?: object): typeof import("./DomEvent.js");
/**
 * Removes a previously added listener function.
 * Note that if you passed a custom context to on, you must pass the same
 * context to `off` in order to remove the listener. Alternatively, removes a set of
 * type/listener pairs, e.g. `{click: onClick, pointermove: onPointerMove}`; with
 * `types` only, removes all previously added listeners of given types; with the
 * element only, removes all previously added listeners from the given element.
 * @param {EventTarget} obj
 * @param {string|Record<string, (ev: any) => void>} [types]
 * @param {((ev: any) => void)|object} [fn]
 * @param {object} [context]
 * @returns {typeof import('./DomEvent.js')}
 */
export function off(obj: EventTarget, types?: string | Record<string, (ev: any) => void>, fn?: ((ev: any) => void) | object, context?: object, ...args: any[]): typeof import("./DomEvent.js");
/**
 * Stop the given event from propagation to parent elements. Used inside the listener
 * functions:
 * ```js
 * DomEvent.on(div, 'click', DomEvent.stopPropagation);
 * ```
 * Also accepts a Maplair event with an `originalEvent`.
 * @param {Event|{originalEvent: Event}} e
 * @returns {typeof import('./DomEvent.js')}
 */
export function stopPropagation(e: Event | {
    originalEvent: Event;
}): typeof import("./DomEvent.js");
/**
 * Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).
 * @param {HTMLElement} el
 * @returns {typeof import('./DomEvent.js')}
 */
export function disableScrollPropagation(el: HTMLElement): typeof import("./DomEvent.js");
/**
 * Adds `stopPropagation` to the element's `'dblclick'`, `'contextmenu'`
 * and `'pointerdown'` events (plus browser variants).
 * For `'click'` events, prevents the map from handling the click
 * while still allowing the native DOM click event to propagate normally.
 * @param {HTMLElement} el
 * @returns {typeof import('./DomEvent.js')}
 */
export function disableClickPropagation(el: HTMLElement): typeof import("./DomEvent.js");
/**
 * Prevents the default action of the DOM Event `e` from happening (such as
 * following a link in the href of the a element, or doing a POST request
 * with page reload when a `<form>` is submitted).
 * Use it inside listener functions.
 * @param {Event} e
 * @returns {typeof import('./DomEvent.js')}
 */
export function preventDefault(e: Event): typeof import("./DomEvent.js");
/**
 * Does `stopPropagation` and `preventDefault` at the same time.
 * @param {Event} e
 * @returns {typeof import('./DomEvent.js')}
 */
export function stop(e: Event): typeof import("./DomEvent.js");
/**
 * Gets normalized pointer position from a DOM event relative to the
 * `container` (border excluded) or to the whole page if not specified.
 * @param {MouseEvent|Touch} e
 * @param {HTMLElement} [container]
 * @returns {Point}
 */
export function getPointerPosition(e: MouseEvent | Touch, container?: HTMLElement): Point;
/**
 * Gets the wheel pixel factor based on the devicePixelRatio.
 * @returns {number}
 */
export function getWheelPxFactor(): number;
/**
 * Gets normalized wheel delta from a wheel DOM event, in vertical
 * pixels scrolled (negative if scrolling down).
 * Events from pointing devices without precise scrolling are mapped to
 * a best guess of 60 pixels.
 * @param {WheelEvent} e
 * @returns {number}
 */
export function getWheelDelta(e: WheelEvent): number;
export { PointerEvents };
import { Point } from '../geometry/Point.js';
import * as PointerEvents from './DomEvent.PointerEvents.js';
