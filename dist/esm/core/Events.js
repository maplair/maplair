import { falseFn, splitWords, stamp } from "./Util.js";
import { Class } from "./Class.js";
// src/core/Events.js
const warnedEvents = /* @__PURE__ */ new Set();
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {LatLngBounds} from '../geo/LatLngBounds.js' */
/** @import {Point} from '../geometry/Point.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {Popup} from '../layer/Popup.js' */
/** @import {Tooltip} from '../layer/Tooltip.js' */
/**
* The base event object, the argument of event listeners. All other event objects
* contain these properties too. Whenever a class inheriting from `Evented` fires an
* event, a listener function is called with an event object containing information
* about the event, which depends on the event type. For example:
*
* ```js
* map.on('click', function(ev) {
*     alert(ev.latlng); // ev is an event object (MaplairPointerEvent in this case)
* });
* ```
*
* @typedef {object} MaplairEvent
* @property {string} type The event type (e.g. `'click'`).
* @property {any} target The object that fired the event. For propagated events, the
* last object in the propagation chain that fired the event.
* @property {any} sourceTarget The object that originally fired the event. For
* non-propagated events, this will be the same as the `target`.
* @property {any} [propagatedFrom] For propagated events, the last object that
* propagated the event to its event parent.
*/
/**
* A listener of events, called with the event object, which has more properties
* depending on the event type (see the event objects below).
* @typedef {(event: MaplairEvent & Record<string, any>) => void} EventListener
*/
/**
* The event object of keyboard events.
* @typedef {object} MaplairKeyboardEvent
* @property {KeyboardEvent} originalEvent The original
* [DOM `KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
* that triggered this Maplair event.
* @extends MaplairEvent
*/
/**
* The event object of pointer events (`click`, `pointermove`, …).
* @typedef {object} MaplairPointerEvent
* @property {LatLng} latlng The geographical point where the pointer event occurred.
* @property {Point} layerPoint Pixel coordinates of the point where the pointer event
* occurred relative to the map layer.
* @property {Point} containerPoint Pixel coordinates of the point where the pointer
* event occurred relative to the map container.
* @property {MouseEvent|PointerEvent} originalEvent The original
* [DOM `MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) or
* [DOM `PointerEvent`](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
* that triggered this Maplair event.
* @extends MaplairEvent
*/
/**
* The event object of `locationfound`.
* @typedef {object} LocationEvent
* @property {LatLng} latlng Detected geographical location of the user.
* @property {LatLngBounds} bounds Geographical bounds of the area user is located in
* (with respect to the accuracy of location).
* @property {number} accuracy Accuracy of location in meters.
* @property {number} altitude Height of the position above the WGS84 ellipsoid in meters.
* @property {number} altitudeAccuracy Accuracy of altitude in meters.
* @property {number} heading The direction of travel in degrees counting clockwise from true North.
* @property {number} speed Current velocity in meters per second.
* @property {number} timestamp The time when the position was acquired.
* @extends MaplairEvent
*/
/**
* The event object of errors, e.g. `locationerror`.
* @typedef {object} MaplairErrorEvent
* @property {string} message Error message.
* @property {number} [code] Error code (if applicable).
* @extends MaplairEvent
*/
/**
* The event object of adding and removing layers.
* @typedef {object} LayerEvent
* @property {Layer} layer The layer that was added or removed.
* @extends MaplairEvent
*/
/**
* The event object of the layers control.
* @typedef {object} LayersControlEvent
* @property {Layer} layer The layer that was added or removed.
* @property {string} name The name of the layer that was added or removed.
* @property {Event} [originalEvent] The DOM event of the click on the entry in the
* layers control, `undefined` if the layer was added or removed by code.
* @extends MaplairEvent
*/
/**
* The event object of tile events.
* @typedef {object} TileEvent
* @property {HTMLElement} tile The tile element (image).
* @property {Point} coords Point object with the tile's `x`, `y`, and `z` (zoom level) coordinates.
* @extends MaplairEvent
*/
/**
* The event object of `tileerror`.
* @typedef {object} TileErrorEvent
* @property {any} error Error passed to the tile's `done()` callback.
* @extends TileEvent
*/
/**
* The event object of `resize`.
* @typedef {object} ResizeEvent
* @property {Point} oldSize The old size before resize event.
* @property {Point} newSize The new size after the resize event.
* @extends MaplairEvent
*/
/**
* The event object of `crschange`.
* @typedef {object} CrsChangeEvent
* @property {CRS} oldCrs The CRS of the map before the change.
* @property {CRS} crs The new CRS of the map.
* @extends MaplairEvent
*/
/**
* The event object of `worldcopyjump`.
* @typedef {object} WorldCopyJumpEvent
* @property {number} worlds The signed number of world widths by which the map pane moved.
* @extends MaplairEvent
*/
/**
* The event object of adding GeoJSON features.
* @typedef {object} GeoJSONEvent
* @property {Layer} layer The layer for the GeoJSON feature that is being added to the map.
* @property {object} properties GeoJSON properties of the feature.
* @property {string} geometryType GeoJSON geometry type of the feature.
* @property {string|number} [id] GeoJSON ID of the feature (if present).
* @extends MaplairEvent
*/
/**
* The event object of opening and closing popups.
* @typedef {object} PopupEvent
* @property {Popup} popup The popup that was opened or closed.
* @extends MaplairEvent
*/
/**
* The event object of opening and closing tooltips.
* @typedef {object} TooltipEvent
* @property {Tooltip} tooltip The tooltip that was opened or closed.
* @extends MaplairEvent
*/
/**
* The event object of `dragend`.
* @typedef {object} DragEndEvent
* @property {number} distance The distance in pixels the draggable element was moved by.
* @extends MaplairEvent
*/
/**
* The event object of `zoomanim`.
* @typedef {object} ZoomAnimEvent
* @property {LatLng} center The current center of the map.
* @property {number} zoom The current zoom level of the map.
* @property {boolean} [noUpdate] Whether layers should update their contents due to this event.
* @extends MaplairEvent
*/
/**
* A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
*
* @example
*
* ```js
* map.on('click', function(e) {
* 	alert(e.latlng);
* } );
* ```
*
* Maplair deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
*
* ```js
* function onClick(e) { ... }
*
* map.on('click', onClick);
* map.off('click', onClick);
* ```
*/
var Evented = class Evented extends Class {
	/**
	* Adds a listener function (`fn`) to a particular event type of the object. You can
	* optionally specify the context of the listener (object the this keyword will point
	* to). You can also pass several space-separated types (e.g. `'click dblclick'`).
	* Alternatively, adds a set of type/listener pairs, e.g.
	* `{click: onClick, pointermove: onPointerMove}`, with the context as second argument.
	* @param {string|Record<string, EventListener>} types
	* @param {EventListener|object} [fn]
	* @param {object} [context]
	* @returns {this}
	*/
	on(types, fn, context) {
		if (typeof types === "object") for (const [type, f] of Object.entries(types)) this._on(type, f, fn);
		else for (const type of splitWords(types)) this._on(type, fn, context);
		return this;
	}
	/**
	* Removes a previously added listener function. If no function is specified, it will
	* remove all the listeners of that particular event from the object. Note that if you
	* passed a custom context to `on`, you must pass the same context to `off` in order to
	* remove the listener. Alternatively, removes a set of type/listener pairs. Without
	* arguments, removes all listeners to all events on the object, including implicitly
	* attached events.
	* @param {string|Record<string, EventListener>} [types]
	* @param {EventListener|object} [fn]
	* @param {object} [context]
	* @returns {this}
	*/
	off(types, fn, context) {
		if (!arguments.length) {
			delete this._events;
			delete this._listenerIndex;
		} else if (typeof types === "object") for (const [type, f] of Object.entries(types)) this._off(type, f, fn);
		else {
			const removeAll = arguments.length === 1;
			for (const type of splitWords(types)) if (removeAll) this._off(type);
			else this._off(type, fn, context);
		}
		return this;
	}
	static __REMOVED_EVENTS = {
		mousedown: "pointerdown",
		mouseup: "pointerup",
		mouseover: "pointerover",
		mouseout: "pointerout",
		mousemove: "pointermove",
		keypress: "keydown"
	};
	_on(type, fn, context, _once) {
		if (Object.hasOwn(Evented.__REMOVED_EVENTS, type) && !warnedEvents.has(type)) {
			warnedEvents.add(type);
			console.error(`The event ${type} has been removed in Maplair. Use ${Evented.__REMOVED_EVENTS[type]} instead.`);
		}
		if (typeof fn !== "function") {
			console.warn(`wrong listener type: ${typeof fn}`);
			return;
		}
		if (context === this) context = void 0;
		const contexts = this._getListenerIndex(type).get(fn);
		if (contexts?.has(context)) return;
		const newListener = {
			fn,
			ctx: context
		};
		if (_once) newListener.once = true;
		this._events ??= {};
		this._events[type] ??= /* @__PURE__ */ new Set();
		this._events[type].add(newListener);
		if (contexts) contexts.set(context, newListener);
		else this._listenerIndex[type].set(fn, /* @__PURE__ */ new Map([[context, newListener]]));
	}
	_getListenerIndex(type) {
		this._listenerIndex ??= {};
		return this._listenerIndex[type] ??= /* @__PURE__ */ new Map();
	}
	_off(type, fn, context) {
		if (!this._events) return;
		let listeners = this._events[type];
		if (!listeners) return;
		if (arguments.length === 1) {
			if (this._firingCount) for (const listener of listeners) listener.fn = falseFn;
			delete this._events[type];
			delete this._listenerIndex?.[type];
			return;
		}
		if (typeof fn !== "function") {
			console.warn(`wrong listener type: ${typeof fn}`);
			return;
		}
		if (context === this) context = void 0;
		const contexts = this._listenerIndex?.[type]?.get(fn), listener = contexts?.get(context);
		if (listener) {
			contexts.delete(context);
			if (!contexts.size) this._listenerIndex[type].delete(fn);
			if (this._firingCount) {
				listener.fn = falseFn;
				this._events[type] = listeners = new Set(listeners);
			}
			listeners.delete(listener);
		}
	}
	/**
	* Fires an event of the specified type. You can optionally provide a data
	* object — the first argument of the listener function will contain its
	* properties. The event can optionally be propagated to event parents.
	* @param {string} type
	* @param {object} [data]
	* @param {boolean} [propagate]
	* @returns {this}
	*/
	fire(type, data, propagate) {
		if (!this.listens(type, propagate)) return this;
		const event = {
			...data,
			type,
			target: this,
			sourceTarget: data?.sourceTarget || this
		};
		if (this._events) {
			const listeners = this._events[type];
			if (listeners) {
				this._firingCount = this._firingCount + 1 || 1;
				for (const l of listeners) {
					const fn = l.fn;
					if (l.once) this.off(type, fn, l.ctx);
					fn.call(l.ctx || this, event);
				}
				this._firingCount--;
			}
		}
		if (propagate) this._propagateEvent(event);
		return this;
	}
	/**
	* Returns `true` if a particular event type has any listeners attached to it (or the
	* given listener function, with the given context). The verification can optionally
	* be propagated, it will return `true` if parents have the listener attached to it.
	* Called as `listens(type, propagate?)` or `listens(type, fn, context?, propagate?)`.
	* @param {string} type
	* @param {EventListener|boolean} [fn]
	* @param {object} [context]
	* @param {boolean} [propagate]
	* @returns {boolean}
	*/
	listens(type, fn, context, propagate) {
		if (typeof type !== "string") console.warn("\"string\" type argument expected");
		let _fn = fn;
		if (typeof fn !== "function") {
			propagate = !!fn;
			_fn = void 0;
			context = void 0;
		}
		if (this._events?.[type]?.size) {
			if (this._listens(type, _fn, context) !== false) return true;
		}
		if (propagate) {
			for (const p of Object.values(this._eventParents ?? {})) if (p.listens(type, fn, context, propagate)) return true;
		}
		return false;
	}
	_listens(type, fn, context) {
		if (!this._events) return false;
		const listeners = this._events[type];
		if (!fn) return !!listeners?.size;
		if (context === this) context = void 0;
		return !!this._listenerIndex?.[type]?.get(fn)?.has(context);
	}
	/**
	* Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
	* @param {string|Record<string, EventListener>} types
	* @param {EventListener|object} [fn]
	* @param {object} [context]
	* @returns {this}
	*/
	once(types, fn, context) {
		if (typeof types === "object") for (const [type, f] of Object.entries(types)) this._on(type, f, fn, true);
		else for (const type of splitWords(types)) this._on(type, fn, context, true);
		return this;
	}
	/**
	* Adds an event parent - an `Evented` that will receive propagated events.
	* @param {Evented} obj
	* @returns {this}
	*/
	addEventParent(obj) {
		this._eventParents ??= {};
		this._eventParents[stamp(obj)] = obj;
		return this;
	}
	/**
	* Removes an event parent, so it will stop receiving propagated events.
	* @param {Evented} obj
	* @returns {this}
	*/
	removeEventParent(obj) {
		if (this._eventParents) delete this._eventParents[stamp(obj)];
		return this;
	}
	_propagateEvent(e) {
		for (const p of Object.values(this._eventParents ?? {})) p.fire(e.type, {
			propagatedFrom: e.target,
			...e
		}, true);
	}
};
export { Evented };

//# sourceMappingURL=Events.js.map