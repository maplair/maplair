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
export class Evented extends Class {
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
    on(types: string | Record<string, EventListener>, fn?: EventListener | object, context?: object): this;
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
    off(types?: string | Record<string, EventListener>, fn?: EventListener | object, context?: object, ...args: any[]): this;
    /**
     * Fires an event of the specified type. You can optionally provide a data
     * object — the first argument of the listener function will contain its
     * properties. The event can optionally be propagated to event parents.
     * @param {string} type
     * @param {object} [data]
     * @param {boolean} [propagate]
     * @returns {this}
     */
    fire(type: string, data?: object, propagate?: boolean): this;
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
    listens(type: string, fn?: EventListener | boolean, context?: object, propagate?: boolean): boolean;
    /**
     * Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
     * @param {string|Record<string, EventListener>} types
     * @param {EventListener|object} [fn]
     * @param {object} [context]
     * @returns {this}
     */
    once(types: string | Record<string, EventListener>, fn?: EventListener | object, context?: object): this;
    /**
     * Adds an event parent - an `Evented` that will receive propagated events.
     * @param {Evented} obj
     * @returns {this}
     */
    addEventParent(obj: Evented): this;
    /**
     * Removes an event parent, so it will stop receiving propagated events.
     * @param {Evented} obj
     * @returns {this}
     */
    removeEventParent(obj: Evented): this;
}
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
 */
export interface MaplairEvent {
    /**
     * The event type (e.g. `'click'`).
     */
    type: string;
    /**
     * The object that fired the event. For propagated events, the
     * last object in the propagation chain that fired the event.
     */
    target: any;
    /**
     * The object that originally fired the event. For
     * non-propagated events, this will be the same as the `target`.
     */
    sourceTarget: any;
    /**
     * For propagated events, the last object that
     * propagated the event to its event parent.
     */
    propagatedFrom?: any;
}
/**
 * A listener of events, called with the event object, which has more properties
 * depending on the event type (see the event objects below).
 */
export type EventListener = (event: MaplairEvent & Record<string, any>) => void;
/**
 * The event object of keyboard events.
 */
export interface MaplairKeyboardEvent extends MaplairEvent {
    /**
     * The original
     * [DOM `KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
     * that triggered this Maplair event.
     */
    originalEvent: KeyboardEvent;
}
/**
 * The event object of pointer events (`click`, `pointermove`, …).
 */
export interface MaplairPointerEvent extends MaplairEvent {
    /**
     * The geographical point where the pointer event occurred.
     */
    latlng: LatLng;
    /**
     * Pixel coordinates of the point where the pointer event
     * occurred relative to the map layer.
     */
    layerPoint: Point;
    /**
     * Pixel coordinates of the point where the pointer
     * event occurred relative to the map container.
     */
    containerPoint: Point;
    /**
     * The original
     * [DOM `MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) or
     * [DOM `PointerEvent`](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
     * that triggered this Maplair event.
     */
    originalEvent: MouseEvent|PointerEvent;
}
/**
 * The event object of `locationfound`.
 */
export interface LocationEvent extends MaplairEvent {
    /**
     * Detected geographical location of the user.
     */
    latlng: LatLng;
    /**
     * Geographical bounds of the area user is located in
     * (with respect to the accuracy of location).
     */
    bounds: LatLngBounds;
    /**
     * Accuracy of location in meters.
     */
    accuracy: number;
    /**
     * Height of the position above the WGS84 ellipsoid in meters.
     */
    altitude: number;
    /**
     * Accuracy of altitude in meters.
     */
    altitudeAccuracy: number;
    /**
     * The direction of travel in degrees counting clockwise from true North.
     */
    heading: number;
    /**
     * Current velocity in meters per second.
     */
    speed: number;
    /**
     * The time when the position was acquired.
     */
    timestamp: number;
}
/**
 * The event object of errors, e.g. `locationerror`.
 */
export interface MaplairErrorEvent extends MaplairEvent {
    /**
     * Error message.
     */
    message: string;
    /**
     * Error code (if applicable).
     */
    code?: number;
}
/**
 * The event object of adding and removing layers.
 */
export interface LayerEvent extends MaplairEvent {
    /**
     * The layer that was added or removed.
     */
    layer: Layer;
}
/**
 * The event object of the layers control.
 */
export interface LayersControlEvent extends MaplairEvent {
    /**
     * The layer that was added or removed.
     */
    layer: Layer;
    /**
     * The name of the layer that was added or removed.
     */
    name: string;
    /**
     * The DOM event of the click on the entry in the
     * layers control, `undefined` if the layer was added or removed by code.
     */
    originalEvent?: Event;
}
/**
 * The event object of tile events.
 */
export interface TileEvent extends MaplairEvent {
    /**
     * The tile element (image).
     */
    tile: HTMLElement;
    /**
     * Point object with the tile's `x`, `y`, and `z` (zoom level) coordinates.
     */
    coords: Point;
}
/**
 * The event object of `tileerror`.
 */
export interface TileErrorEvent extends TileEvent {
    /**
     * Error passed to the tile's `done()` callback.
     */
    error: any;
}
/**
 * The event object of `resize`.
 */
export interface ResizeEvent extends MaplairEvent {
    /**
     * The old size before resize event.
     */
    oldSize: Point;
    /**
     * The new size after the resize event.
     */
    newSize: Point;
}
/**
 * The event object of `crschange`.
 */
export interface CrsChangeEvent extends MaplairEvent {
    /**
     * The CRS of the map before the change.
     */
    oldCrs: CRS;
    /**
     * The new CRS of the map.
     */
    crs: CRS;
}
/**
 * The event object of `worldcopyjump`.
 */
export interface WorldCopyJumpEvent extends MaplairEvent {
    /**
     * The signed number of world widths by which the map pane moved.
     */
    worlds: number;
}
/**
 * The event object of adding GeoJSON features.
 */
export interface GeoJSONEvent extends MaplairEvent {
    /**
     * The layer for the GeoJSON feature that is being added to the map.
     */
    layer: Layer;
    /**
     * GeoJSON properties of the feature.
     */
    properties: object;
    /**
     * GeoJSON geometry type of the feature.
     */
    geometryType: string;
    /**
     * GeoJSON ID of the feature (if present).
     */
    id?: string|number;
}
/**
 * The event object of opening and closing popups.
 */
export interface PopupEvent extends MaplairEvent {
    /**
     * The popup that was opened or closed.
     */
    popup: Popup;
}
/**
 * The event object of opening and closing tooltips.
 */
export interface TooltipEvent extends MaplairEvent {
    /**
     * The tooltip that was opened or closed.
     */
    tooltip: Tooltip;
}
/**
 * The event object of `dragend`.
 */
export interface DragEndEvent extends MaplairEvent {
    /**
     * The distance in pixels the draggable element was moved by.
     */
    distance: number;
}
/**
 * The event object of `zoomanim`.
 */
export interface ZoomAnimEvent extends MaplairEvent {
    /**
     * The current center of the map.
     */
    center: LatLng;
    /**
     * The current zoom level of the map.
     */
    zoom: number;
    /**
     * Whether layers should update their contents due to this event.
     */
    noUpdate?: boolean;
}
import { Class } from './Class.js';
import type { LatLng } from '../geo/LatLng.js';
import type { Point } from '../geometry/Point.js';
import type { LatLngBounds } from '../geo/LatLngBounds.js';
import type { Layer } from '../layer/Layer.js';
import type { CRS } from '../geo/crs/CRS.js';
import type { Popup } from '../layer/Popup.js';
import type { Tooltip } from '../layer/Tooltip.js';
