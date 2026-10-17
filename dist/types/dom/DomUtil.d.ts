/**
 * Returns an element given its DOM id, or returns the element itself
 * if it was passed directly.
 * @param {string|HTMLElement} id
 * @returns {HTMLElement|null}
 */
export function get(id: string | HTMLElement): HTMLElement | null;
/**
 * Creates an HTML element with `tagName`, sets its class to `className`, and
 * optionally appends it to `container` element.
 * @param {string} tagName
 * @param {string} [className]
 * @param {HTMLElement} [container]
 * @returns {HTMLElement}
 */
export function create(tagName: string, className?: string, container?: HTMLElement): HTMLElement;
/**
 * Makes `el` the last child of its parent, so it renders in front of the other
 * children.
 * @param {Element} el
 * @returns {void}
 */
export function toFront(el: Element): void;
/**
 * Makes `el` the first child of its parent, so it renders behind the other children.
 * @param {Element} el
 * @returns {void}
 */
export function toBack(el: Element): void;
/**
 * Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
 * and optionally scaled by `scale`. Does not have an effect if the
 * browser doesn't support 3D CSS transforms.
 * @param {HTMLElement|SVGElement} el
 * @param {Point} [offset]
 * @param {number} [scale]
 * @returns {void}
 */
export function setTransform(el: HTMLElement | SVGElement, offset?: Point, scale?: number): void;
/**
 * Sets the position of `el` to coordinates specified by `point`,
 * using CSS translate or top/left positioning depending on the browser
 * (used by Maplair internally to position its layers).
 * @param {HTMLElement|SVGElement} el
 * @param {Point} point
 * @returns {void}
 */
export function setPosition(el: HTMLElement | SVGElement, point: Point): void;
/**
 * Returns the coordinates of an element previously positioned with setPosition.
 * @param {HTMLElement|SVGElement} el
 * @returns {Point}
 */
export function getPosition(el: HTMLElement | SVGElement): Point;
/**
 * Prevents the user from selecting text in the document. Used internally
 * by Maplair to override the behaviour of any click-and-drag interaction on
 * the map. Affects drag interactions on the whole document.
 * @returns {void}
 */
export function disableTextSelection(): void;
/**
 * Cancels the effects of a previous
 * [`DomUtil.disableTextSelection`](#domutil-disabletextselection).
 * @returns {void}
 */
export function enableTextSelection(): void;
/**
 * Prevents the user from generating `dragstart` DOM events, usually generated when
 * the user drags an image.
 * @returns {void}
 */
export function disableImageDrag(): void;
/**
 * Cancels the effects of a previous
 * [`DomUtil.disableImageDrag`](#domutil-disableimagedrag).
 * @returns {void}
 */
export function enableImageDrag(): void;
/**
 * Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
 * of the element `element` invisible. Used internally by Maplair to prevent
 * focusable elements from displaying an outline when the user performs a
 * drag interaction on them.
 * @param {HTMLElement} element
 * @returns {void}
 */
export function preventOutline(element: HTMLElement): void;
/**
 * Cancels the effects of a previous
 * [`DomUtil.preventOutline`](#domutil-preventoutline).
 * @returns {void}
 */
export function restoreOutline(): void;
/**
 * Finds the closest parent node which size (width and height) is not null.
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
export function getSizedParentNode(element: HTMLElement): HTMLElement;
/**
 * Computes the CSS scale currently applied on the element.
 * Returns an object with `x` and `y` members as horizontal and vertical scales
 * respectively, and `boundingClientRect` as the result of
 * [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
 * @param {HTMLElement} element
 * @returns {{x: number, y: number, boundingClientRect: DOMRect}}
 */
export function getScale(element: HTMLElement): {
    x: number;
    y: number;
    boundingClientRect: DOMRect;
};
import { Point } from '../geometry/Point.js';
