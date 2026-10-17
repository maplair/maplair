import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { Point } from "../geometry/Point.js";
import { off, on, preventDefault } from "./DomEvent.js";
//#region src/dom/DomUtil.js
var DomUtil_exports = /* @__PURE__ */ __exportAll({
	create: () => create,
	disableImageDrag: () => disableImageDrag,
	disableTextSelection: () => disableTextSelection,
	enableImageDrag: () => enableImageDrag,
	enableTextSelection: () => enableTextSelection,
	get: () => get,
	getPosition: () => getPosition,
	getScale: () => getScale,
	getSizedParentNode: () => getSizedParentNode,
	preventOutline: () => preventOutline,
	restoreOutline: () => restoreOutline,
	setPosition: () => setPosition,
	setTransform: () => setTransform,
	toBack: () => toBack,
	toFront: () => toFront
});
/**
* Returns an element given its DOM id, or returns the element itself
* if it was passed directly.
* @param {string|HTMLElement} id
* @returns {HTMLElement|null}
*/
function get(id) {
	return typeof id === "string" ? document.getElementById(id) : id;
}
/**
* Creates an HTML element with `tagName`, sets its class to `className`, and
* optionally appends it to `container` element.
* @param {string} tagName
* @param {string} [className]
* @param {HTMLElement} [container]
* @returns {HTMLElement}
*/
function create(tagName, className, container) {
	const el = document.createElement(tagName);
	el.className = className ?? "";
	container?.appendChild(el);
	return el;
}
/**
* Makes `el` the last child of its parent, so it renders in front of the other
* children.
* @param {Element} el
* @returns {void}
*/
function toFront(el) {
	const parent = el.parentNode;
	if (parent && parent.lastChild !== el) parent.appendChild(el);
}
/**
* Makes `el` the first child of its parent, so it renders behind the other children.
* @param {Element} el
* @returns {void}
*/
function toBack(el) {
	const parent = el.parentNode;
	if (parent && parent.firstChild !== el) parent.insertBefore(el, parent.firstChild);
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
function setTransform(el, offset, scale) {
	const pos = offset ?? new Point(0, 0);
	const transform = `translate3d(${pos.x}px, ${pos.y}px, 0px)${scale ? ` scale(${scale})` : ""}`;
	if (el.style.transform !== transform) el.style.transform = transform;
}
const positions = /* @__PURE__ */ new WeakMap();
/**
* Sets the position of `el` to coordinates specified by `point`,
* using CSS translate or top/left positioning depending on the browser
* (used by Maplair internally to position its layers).
* @param {HTMLElement|SVGElement} el
* @param {Point} point
* @returns {void}
*/
function setPosition(el, point) {
	positions.set(el, point);
	setTransform(el, point);
}
/**
* Returns the coordinates of an element previously positioned with setPosition.
* @param {HTMLElement|SVGElement} el
* @returns {Point}
*/
function getPosition(el) {
	return positions.get(el) ?? new Point(0, 0);
}
const documentStyle = typeof document === "undefined" ? {} : document.documentElement.style;
const userSelectProp = ["userSelect", "WebkitUserSelect"].find((prop) => prop in documentStyle);
let prevUserSelect;
/**
* Prevents the user from selecting text in the document. Used internally
* by Maplair to override the behaviour of any click-and-drag interaction on
* the map. Affects drag interactions on the whole document.
* @returns {void}
*/
function disableTextSelection() {
	const value = documentStyle[userSelectProp];
	if (value === "none") return;
	prevUserSelect = value;
	documentStyle[userSelectProp] = "none";
}
/**
* Cancels the effects of a previous
* [`DomUtil.disableTextSelection`](#domutil-disabletextselection).
* @returns {void}
*/
function enableTextSelection() {
	if (typeof prevUserSelect === "undefined") return;
	documentStyle[userSelectProp] = prevUserSelect;
	prevUserSelect = void 0;
}
/**
* Prevents the user from generating `dragstart` DOM events, usually generated when
* the user drags an image.
* @returns {void}
*/
function disableImageDrag() {
	on(window, "dragstart", preventDefault);
}
/**
* Cancels the effects of a previous
* [`DomUtil.disableImageDrag`](#domutil-disableimagedrag).
* @returns {void}
*/
function enableImageDrag() {
	off(window, "dragstart", preventDefault);
}
let _outlineElement;
let _outlineStyle;
/**
* Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
* of the element `element` invisible. Used internally by Maplair to prevent
* focusable elements from displaying an outline when the user performs a
* drag interaction on them.
* @param {HTMLElement} element
* @returns {void}
*/
function preventOutline(element) {
	while (element.tabIndex === -1) element = element.parentNode;
	if (!element.style) return;
	restoreOutline();
	_outlineElement = element;
	_outlineStyle = element.style.outlineStyle;
	element.style.outlineStyle = "none";
	on(window, "keydown", restoreOutline);
}
/**
* Cancels the effects of a previous
* [`DomUtil.preventOutline`](#domutil-preventoutline).
* @returns {void}
*/
function restoreOutline() {
	if (!_outlineElement) return;
	_outlineElement.style.outlineStyle = _outlineStyle;
	_outlineElement = void 0;
	_outlineStyle = void 0;
	off(window, "keydown", restoreOutline);
}
/**
* Finds the closest parent node which size (width and height) is not null.
* @param {HTMLElement} element
* @returns {HTMLElement}
*/
function getSizedParentNode(element) {
	do
		element = element.parentNode;
	while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
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
function getScale(element) {
	const rect = element.getBoundingClientRect();
	return {
		x: rect.width / element.offsetWidth || 1,
		y: rect.height / element.offsetHeight || 1,
		boundingClientRect: rect
	};
}
//#endregion
export { DomUtil_exports, create, disableImageDrag, disableTextSelection, enableImageDrag, enableTextSelection, get, getPosition, getScale, getSizedParentNode, preventOutline, restoreOutline, setPosition, setTransform, toBack, toFront };

//# sourceMappingURL=DomUtil.js.map