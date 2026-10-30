import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { splitWords, stamp } from "../core/Util.js";
import { Point } from "../geometry/Point.js";
import { addDoubleTapListener, removeDoubleTapListener } from "./DomEvent.DoubleTap.js";
import { DomEvent_PointerEvents_exports } from "./DomEvent.PointerEvents.js";
import { getScale } from "./DomUtil.js";
// src/dom/DomEvent.js
var DomEvent_exports = /* @__PURE__ */ __exportAll({
	PointerEvents: () => DomEvent_PointerEvents_exports,
	disableClickPropagation: () => disableClickPropagation,
	disableScrollPropagation: () => disableScrollPropagation,
	getPointerPosition: () => getPointerPosition,
	getWheelDelta: () => getWheelDelta,
	getWheelPxFactor: () => getWheelPxFactor,
	isExternalTarget: () => isExternalTarget,
	off: () => off,
	on: () => on,
	preventDefault: () => preventDefault,
	stop: () => stop,
	stopPropagation: () => stopPropagation
});
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
function on(obj, types, fn, context) {
	if (types && typeof types === "object") for (const [type, listener] of Object.entries(types)) addOne(obj, type, listener, fn);
	else for (const type of splitWords(types)) addOne(obj, type, fn, context);
	return this;
}
const eventsKey = "_maplair_events";
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
function off(obj, types, fn, context) {
	if (arguments.length === 1) {
		batchRemove(obj);
		delete obj[eventsKey];
	} else if (types && typeof types === "object") for (const [type, listener] of Object.entries(types)) removeOne(obj, type, listener, fn);
	else {
		types = splitWords(types);
		if (arguments.length === 2) batchRemove(obj, (type) => types.includes(type));
		else for (const type of types) removeOne(obj, type, fn, context);
	}
	return this;
}
const DIGIT_RE = /\d/;
function batchRemove(obj, filterFn) {
	for (const id of Object.keys(obj[eventsKey] ?? {})) {
		const type = id.split(DIGIT_RE)[0];
		if (!filterFn || filterFn(type)) removeOne(obj, type, null, null, id);
	}
}
function addOne(obj, type, fn, context) {
	const id = type + stamp(fn) + (context ? `_${stamp(context)}` : "");
	if (obj[eventsKey] && obj[eventsKey][id]) return this;
	let handler = function(e) {
		return fn.call(context || obj, e);
	};
	if (type === "dblclick") handler = addDoubleTapListener(obj, handler);
	else obj.addEventListener(type, handler, type === "wheel" ? { passive: false } : false);
	obj[eventsKey] ??= {};
	obj[eventsKey][id] = handler;
}
function removeOne(obj, type, fn, context, id) {
	id ??= type + stamp(fn) + (context ? `_${stamp(context)}` : "");
	const handler = obj[eventsKey] && obj[eventsKey][id];
	if (!handler) return this;
	if (type === "dblclick") removeDoubleTapListener(obj, handler);
	else obj.removeEventListener(type, handler, false);
	obj[eventsKey][id] = null;
}
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
function stopPropagation(e) {
	if (e.stopPropagation) e.stopPropagation();
	else if (e.originalEvent) e.originalEvent._stopped = true;
	else console.debug("Unsupported event", e);
	return this;
}
/**
* Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).
* @param {HTMLElement} el
* @returns {typeof import('./DomEvent.js')}
*/
function disableScrollPropagation(el) {
	addOne(el, "wheel", stopPropagation);
	return this;
}
/**
* Adds `stopPropagation` to the element's `'dblclick'`, `'contextmenu'`
* and `'pointerdown'` events (plus browser variants).
* For `'click'` events, prevents the map from handling the click
* while still allowing the native DOM click event to propagate normally.
* @param {HTMLElement} el
* @returns {typeof import('./DomEvent.js')}
*/
function disableClickPropagation(el) {
	on(el, "pointerdown dblclick contextmenu", stopPropagation);
	el["_maplair_disable_click"] = true;
	return this;
}
/**
* Prevents the default action of the DOM Event `e` from happening (such as
* following a link in the href of the a element, or doing a POST request
* with page reload when a `<form>` is submitted).
* Use it inside listener functions.
* @param {Event} e
* @returns {typeof import('./DomEvent.js')}
*/
function preventDefault(e) {
	e.preventDefault?.();
	return this;
}
/**
* Does `stopPropagation` and `preventDefault` at the same time.
* @param {Event} e
* @returns {typeof import('./DomEvent.js')}
*/
function stop(e) {
	preventDefault(e);
	stopPropagation(e);
	return this;
}
/**
* Gets normalized pointer position from a DOM event relative to the
* `container` (border excluded) or to the whole page if not specified.
* @param {MouseEvent|Touch} e
* @param {HTMLElement} [container]
* @returns {Point}
*/
function getPointerPosition(e, container) {
	if (!container) return new Point(e.clientX, e.clientY);
	const scale = getScale(container), offset = scale.boundingClientRect;
	return new Point((e.clientX - offset.left) / scale.x - container.clientLeft, (e.clientY - offset.top) / scale.y - container.clientTop);
}
/**
* Gets the wheel pixel factor based on the devicePixelRatio.
* @returns {number}
*/
function getWheelPxFactor() {
	return window.devicePixelRatio * 2;
}
/**
* Gets normalized wheel delta from a wheel DOM event, in vertical
* pixels scrolled (negative if scrolling down).
* Events from pointing devices without precise scrolling are mapped to
* a best guess of 60 pixels.
* @param {WheelEvent} e
* @returns {number}
*/
function getWheelDelta(e) {
	return e.deltaY && e.deltaMode === 0 ? -e.deltaY / getWheelPxFactor() : e.deltaY && e.deltaMode === 1 ? -e.deltaY * 20 : e.deltaY && e.deltaMode === 2 ? -e.deltaY * 60 : e.deltaX || e.deltaZ ? 0 : 0;
}
/**
* Checks if the pointer really left/entered the element `el` (for
* `pointerover`/`pointerout`).
* @internal
* @param {Node} el
* @param {MouseEvent} e
* @returns {boolean}
*/
function isExternalTarget(el, e) {
	return !el.contains(e.relatedTarget);
}
export { DomEvent_exports, DomEvent_PointerEvents_exports as PointerEvents, disableClickPropagation, disableScrollPropagation, getPointerPosition, getWheelDelta, getWheelPxFactor, isExternalTarget, off, on, preventDefault, stop, stopPropagation };

//# sourceMappingURL=DomEvent.js.map