import * as DomEvent from './DomEvent.js';
import {Point} from '../geometry/Point.js';

// DomUtil: utility functions to work with the
// [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model)
// tree, used by Maplair internally.
//
// Most functions expecting or returning a `HTMLElement` also work for
// SVG elements. The only difference is that classes refer to CSS classes
// in HTML and SVG classes in SVG.

/**
 * Returns an element given its DOM id, or returns the element itself
 * if it was passed directly.
 * @param {string|HTMLElement} id
 * @returns {HTMLElement|null}
 */
export function get(id) {
	return typeof id === 'string' ? document.getElementById(id) : id;
}

/**
 * Creates an HTML element with `tagName`, sets its class to `className`, and
 * optionally appends it to `container` element.
 * @param {string} tagName
 * @param {string} [className]
 * @param {HTMLElement} [container]
 * @returns {HTMLElement}
 */
export function create(tagName, className, container) {
	const el = document.createElement(tagName);
	el.className = className ?? '';

	container?.appendChild(el);
	return el;
}

/**
 * Makes `el` the last child of its parent, so it renders in front of the other
 * children.
 * @param {Element} el
 * @returns {void}
 */
export function toFront(el) {
	const parent = el.parentNode;
	if (!parent || parent.lastChild === el) { return; }

	// re-inserting a hovered node (e.g. bringToFront in a pointerover handler) makes Chromium 144+ fire a repeated
	// pointerover and lose the next pointerout (#10129), so move the nodes after it instead
	if (el.matches(':hover')) {
		while (el.nextSibling) { parent.insertBefore(el.nextSibling, el); }
	} else {
		parent.appendChild(el);
	}
}

/**
 * Makes `el` the first child of its parent, so it renders behind the other children.
 * @param {Element} el
 * @returns {void}
 */
export function toBack(el) {
	const parent = el.parentNode;
	if (!parent || parent.firstChild === el) { return; }

	if (el.matches(':hover')) { // see toFront
		while (el.previousSibling) { parent.insertBefore(el.previousSibling, el.nextSibling); }
	} else {
		parent.insertBefore(el, parent.firstChild);
	}
}

/**
 * Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
 * and optionally scaled by `scale`. Does not have an effect if the
 * browser doesn't support 3D CSS transforms.
 * @param {HTMLElement|SVGElement} el
 * @param {Point} [offset]
 * @param {number} [scale]
 * @returns {void}
 */
export function setTransform(el, offset, scale) {
	const pos = offset ?? new Point(0, 0);

	// same format as browsers serialize it, so that unchanged positions can be skipped
	const transform = `translate3d(${pos.x}px, ${pos.y}px, 0px)${scale ? ` scale(${scale})` : ''}`;
	if (el.style.transform !== transform) {
		el.style.transform = transform;
	}
}

const positions = new WeakMap();

/**
 * Sets the position of `el` to coordinates specified by `point`,
 * using CSS translate or top/left positioning depending on the browser
 * (used by Maplair internally to position its layers).
 * @param {HTMLElement|SVGElement} el
 * @param {Point} point
 * @returns {void}
 */
export function setPosition(el, point) {
	positions.set(el, point);
	setTransform(el, point);
}

/**
 * Returns the coordinates of an element previously positioned with setPosition.
 * @param {HTMLElement|SVGElement} el
 * @returns {Point}
 */
export function getPosition(el) {
	// this method is only used for elements previously positioned using setPosition,
	// so it's safe to cache the position for performance
	return positions.get(el) ?? new Point(0, 0);
}

/**
 * Prevents the user from generating `dragstart` DOM events, usually generated when
 * the user drags an image.
 * @returns {void}
 */
export function disableImageDrag() {
	DomEvent.on(window, 'dragstart', DomEvent.preventDefault);
}

/**
 * Cancels the effects of a previous
 * [`DomUtil.disableImageDrag`](#domutil-disableimagedrag).
 * @returns {void}
 */
export function enableImageDrag() {
	DomEvent.off(window, 'dragstart', DomEvent.preventDefault);
}

/**
 * Finds the closest parent node which size (width and height) is not null.
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
export function getSizedParentNode(element) {
	do {
		element = element.parentNode;
	} while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
	return element;
}

/**
 * Computes the CSS scale currently applied on the element.
 * Returns an object with `x` and `y` members as horizontal and vertical scales
 * respectively, and `boundingClientRect` as the result of
 * [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
 * @param {HTMLElement} element
 * @returns {{x: number, y: number, boundingClientRect: DOMRect}}
 */
export function getScale(element) {
	const rect = element.getBoundingClientRect();

	return {
		x: rect.width / element.offsetWidth || 1,
		y: rect.height / element.offsetHeight || 1,
		boundingClientRect: rect
	};
}

/**
 * `true` if the user has
 * [configured their environment for reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences).
 * Determines whether animations should play or not.
 * @type {boolean}
 */
export const reducedMotion =
	typeof window === 'undefined' || /* @__PURE__ */ window.matchMedia('(prefers-reduced-motion: reduce)').matches;
