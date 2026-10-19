import {Point} from '../geometry/Point.js';
import * as Util from '../core/Util.js';
import Browser from '../core/Browser.js';
import {addDoubleTapListener, removeDoubleTapListener} from './DomEvent.DoubleTap.js';
import {getScale} from './DomUtil.js';

import * as PointerEvents from './DomEvent.PointerEvents.js';
export {PointerEvents};

// DomEvent: utility functions to work with the
// [DOM events](https://developer.mozilla.org/docs/Web/API/Event), used by Maplair
// internally. The functions return the `DomEvent` namespace for chaining.

// Inspired by John Resig, Dean Edwards and YUI addEvent implementations.

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
export function on(obj, types, fn, context) {

	if (types && typeof types === 'object') {
		for (const [type, listener] of Object.entries(types)) {
			addOne(obj, type, listener, fn);
		}
	} else {
		for (const type of Util.splitWords(types)) {
			addOne(obj, type, fn, context);
		}
	}

	return this;
}

const eventsKey = '_maplair_events';

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
export function off(obj, types, fn, context) {

	if (arguments.length === 1) {
		batchRemove(obj);
		delete obj[eventsKey];

	} else if (types && typeof types === 'object') {
		for (const [type, listener] of Object.entries(types)) {
			removeOne(obj, type, listener, fn);
		}

	} else {
		types = Util.splitWords(types);

		if (arguments.length === 2) {
			batchRemove(obj, type => types.includes(type));
		} else {
			for (const type of types) {
				removeOne(obj, type, fn, context);
			}
		}
	}

	return this;
}

const DIGIT_RE = /\d/;

function batchRemove(obj, filterFn) {
	for (const id of Object.keys(obj[eventsKey] ?? {})) {
		const type = id.split(DIGIT_RE)[0];
		if (!filterFn || filterFn(type)) {
			removeOne(obj, type, null, null, id);
		}
	}
}

function addOne(obj, type, fn, context) {
	const id = type + Util.stamp(fn) + (context ? `_${Util.stamp(context)}` : '');

	if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

	let handler = function (e) {
		return fn.call(context || obj, e);
	};

	if (Browser.touch && (type === 'dblclick')) {
		handler = addDoubleTapListener(obj, handler);
	} else {
		obj.addEventListener(type, handler, type === 'wheel' ? {passive: false} : false);
	}

	obj[eventsKey] ??= {};
	obj[eventsKey][id] = handler;
}

function removeOne(obj, type, fn, context, id) {
	id ??= type + Util.stamp(fn) + (context ? `_${Util.stamp(context)}` : '');
	const handler = obj[eventsKey] && obj[eventsKey][id];

	if (!handler) { return this; }

	if (Browser.touch && (type === 'dblclick')) {
		removeDoubleTapListener(obj, handler);
	} else {
		obj.removeEventListener(type, handler, false);
	}

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
export function stopPropagation(e) {

	// feature detection rather than `instanceof Event`, which fails for events from other windows (e.g. iframes)
	if (e.stopPropagation) {
		e.stopPropagation();
	} else if (e.originalEvent) {  // In case of Maplair event.
		e.originalEvent._stopped = true;
	} else {
		// custom Maplair event
		console.debug('Unsupported event', e);
	}

	return this;
}

/**
 * Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).
 * @param {HTMLElement} el
 * @returns {typeof import('./DomEvent.js')}
 */
export function disableScrollPropagation(el) {
	addOne(el, 'wheel', stopPropagation);
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
export function disableClickPropagation(el) {
	on(el, 'pointerdown dblclick contextmenu', stopPropagation);
	el['_maplair_disable_click'] = true;
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
export function preventDefault(e) {
	e.preventDefault?.();
	return this;
}

/**
 * Does `stopPropagation` and `preventDefault` at the same time.
 * @param {Event} e
 * @returns {typeof import('./DomEvent.js')}
 */
export function stop(e) {
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
export function getPointerPosition(e, container) {
	if (!container) {
		return new Point(e.clientX, e.clientY);
	}

	const scale = getScale(container),
	offset = scale.boundingClientRect; // left and top  values are in page scale (like the event clientX/Y)

	return new Point(
		// offset.left/top values are in page scale (like clientX/Y),
		// whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
		(e.clientX - offset.left) / scale.x - container.clientLeft,
		(e.clientY - offset.top) / scale.y - container.clientTop
	);
}

/**
 * Gets the wheel pixel factor based on the devicePixelRatio.
 * @returns {number}
 */
export function getWheelPxFactor() {
	// We need double the scroll pixels (see #7403 and #4538) for all Browsers
	// except OSX (Mac) -> 3x, Chrome running on Linux 1x
	const ratio = window.devicePixelRatio;
	return Browser.linux && Browser.chrome ? ratio :
		Browser.mac ? ratio * 3 :
		ratio > 0 ? 2 * ratio : 1;
}

/**
 * Gets normalized wheel delta from a wheel DOM event, in vertical
 * pixels scrolled (negative if scrolling down).
 * Events from pointing devices without precise scrolling are mapped to
 * a best guess of 60 pixels.
 * @param {WheelEvent} e
 * @returns {number}
 */
export function getWheelDelta(e) {
	return (e.deltaY && e.deltaMode === 0) ? -e.deltaY / getWheelPxFactor() : // Pixels
		(e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
		(e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
		(e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
		0;
}

/**
 * Checks if the pointer really left/entered the element `el` (for
 * `pointerover`/`pointerout`).
 * @internal
 * @param {Node} el
 * @param {MouseEvent} e
 * @returns {boolean}
 */
export function isExternalTarget(el, e) {
	return !el.contains(e.relatedTarget);
}
