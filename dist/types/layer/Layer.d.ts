import type { EventListener, MaplairEvent, MaplairPointerEvent, LayerEvent } from '../core/Events.js';
/** @typedef {typeof mapLayerMethods} MapLayerMethods */
/**
 * The methods which layers implement, see `Layer`.
 * @typedef {object} LayerExtensionMethods
 * @property {(map: MaplairMap) => void} [onAdd] Should contain code that creates DOM
 * elements for the layer, adds them to `map panes` where they should belong and puts
 * listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
 * @property {(map: MaplairMap) => void} [onRemove] Should contain all clean up code that
 * removes the layer's elements from the DOM and removes listeners previously added in
 * `onAdd`. Called on [`map.removeLayer(layer)`](#map-removelayer).
 * @property {() => Record<string, Function>} [getEvents] Should return an object
 * like `{ viewreset: this._reset }` for [`on`](#evented-on). The event handlers in this
 * object will be automatically added and removed from the map with your layer.
 * @property {() => HTMLElement|string} [getLegend] Should return an element (or a string
 * containing HTML) to be shown on the `LegendControl` whenever the layer is visible.
 * Fire `legendchange` on the layer when the legend changes.
 * @property {(map: MaplairMap) => void} [beforeAdd] Called on
 * [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before
 * events are initialized, without waiting until the map is in a usable state. Use for
 * early initialization only.
 * @lends Layer
 */
/**
 * The base class of all Maplair layers, with the methods they share.
 *
 * Every layer should extend from `Layer` and (re-)implement the following methods:
 *
 * * `onAdd(map: MaplairMap): this` should contain code that creates DOM elements for
 *   the layer, adds them to `map panes` where they should belong and puts listeners on
 *   relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
 * * `onRemove(map: MaplairMap): this` should contain all clean up code that removes the
 *   layer's elements from the DOM and removes listeners previously added in `onAdd`.
 *   Called on [`map.removeLayer(layer)`](#map-removelayer).
 * * `getEvents(): Object` (optional) should return an object like
 *   `{ viewreset: this._reset }` for [`on`](#evented-on). The event handlers in this
 *   object will be automatically added and removed from the map with your layer.
 * * `getAttribution(): String` (optional) should return a string containing HTML to be
 *   shown on the `Attribution control` whenever the layer is visible.
 * * `getLegend(): HTMLElement|String` (optional) should return an element (or a string
 *   containing HTML) to be shown on the `LegendControl` whenever the layer is visible.
 *   Fire `legendchange` on the layer when the legend changes.
 * * `beforeAdd(map: MaplairMap): this` (optional) is called on
 *   [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map,
 *   before events are initialized, without waiting until the map is in a usable state.
 *   Use for early initialization only.
 *
 * @example
 * ```js
 * const layer = new Marker(latlng).addTo(map);
 * layer.addTo(map);
 * layer.remove();
 * ```
 *
 * @fires add {MaplairEvent} Fired after the layer is added to a map.
 * @fires remove {MaplairEvent} Fired after the layer is removed from a map.
 */
export class Layer extends Evented {
    /**
     * Adds the layer to the given map or layer group.
     * @param {MaplairMap|LayerGroup} map
     * @returns {this}
     */
    addTo(map: MaplairMap | LayerGroup): this;
    /**
     * Removes the layer from the map it is currently active on.
     * @returns {this}
     */
    remove(): this;
    /**
     * Removes the layer from the given map or `LayerGroup`.
     * @param {MaplairMap|LayerGroup} obj
     * @returns {this}
     */
    removeFrom(obj: MaplairMap | LayerGroup): this;
    /**
     * Returns the `HTMLElement` representing the named pane on the map. If `name` is
     * omitted, returns the pane for this layer.
     * @param {string} [name]
     * @returns {HTMLElement}
     */
    getPane(name?: string): HTMLElement;
    /**
     * Changes the [`interactive`](#interactivelayeroptions-interactive) option of the
     * layer, e.g. to stop a layer from emitting pointer events while it is being edited.
     * @param {boolean} interactive
     * @returns {this}
     */
    setInteractive(interactive: boolean): this;
    /**
     * Used by the `attribution control`, returns the [attribution option](#layeroptions-attribution).
     * @returns {string|null}
     */
    getAttribution(): string | null;
    /**
     * Changes the [attribution option](#layeroptions-attribution), also in the
     * attribution control while the layer is on the map.
     * @param {string|null} attribution
     * @returns {this}
     */
    setAttribution(attribution: string | null): this;
    /** The options of the Layer, see [the options](#layeroptions). */
    options: LayerOptions;
}
/**
 * Options of `Layer`, inherited by all layers.
 */
export interface LayerOptions {
    /**
     * By default the layer will be added to the
     * map's [overlay pane](#map-pane) (`overlayPane`). Overriding this option will cause the layer
     * to be placed on another pane by default. Not effective if the `renderer` option is
     * set (the `renderer` option will override the `pane` option).
     * @default 'overlayPane'
     */
    pane?: string;
    /**
     * String to be shown in the attribution
     * control, e.g. "© OpenStreetMap contributors". It describes the layer data and is
     * often a legal obligation towards copyright holders and tile providers.
     * @default null
     */
    attribution?: string|null;
    /**
     * The position of the attribution in the
     * attribution control: attributions are sorted by it, then by the order of adding,
     * e.g. `1` keeps a legend last.
     * @default 0
     */
    attributionOrder?: number;
}
/**
 * Options of interactive layers. Some layers can be made interactive - when the user
 * interacts with such a layer, pointer events like `click` and `pointerover` can be
 * handled. Use the [event handling methods](#evented-method) to handle these events.
 * @fires Layer#click {MaplairPointerEvent} Fired when the user clicks (or taps) the
 * layer, if it is interactive.
 * @fires Layer#dblclick {MaplairPointerEvent} Fired when the user double-clicks (or
 * double-taps) the layer, if it is interactive.
 * @fires Layer#pointerdown {MaplairPointerEvent} Fired when the user pushes the pointer
 * on the layer, if it is interactive.
 * @fires Layer#pointerup {MaplairPointerEvent} Fired when the user releases the pointer
 * pushed on the layer, if it is interactive.
 * @fires Layer#pointerover {MaplairPointerEvent} Fired when the pointer enters the
 * layer, if it is interactive.
 * @fires Layer#pointerout {MaplairPointerEvent} Fired when the pointer leaves the layer,
 * if it is interactive.
 * @fires Layer#contextmenu {MaplairPointerEvent} Fired when the user right-clicks on
 * the layer, if it is interactive; prevents default browser context menu from showing
 * if there are listeners on this event. Also fired on mobile when the user holds a
 * single touch for a second (also called long press).
 */
export interface InteractiveLayerOptions extends LayerOptions {
    /**
     * If `false`, the layer will not emit pointer
     * events and will act as a part of the underlying map.
     * @default true
     */
    interactive?: boolean;
    /**
     * When `true`, a pointer event on this
     * layer will trigger the same event on the map (unless
     * [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
     * @default true
     */
    bubblingPointerEvents?: boolean;
}
/**
 * Methods of `MaplairMap` for layers.
 * @fires MaplairMap#layeradd {LayerEvent} Fired when a new layer is added to the map.
 * @fires MaplairMap#layerremove {LayerEvent} Fired when some layer is removed from the map.
 * @fires MaplairMap#zoomlevelschange {MaplairEvent} Fired when the number of zoomlevels
 * on the map is changed due to adding or removing a layer.
 */
export interface MapLayerMethods {
    /**
     * Adds the given layer to the map.
     * @group Methods for layers and controls
     * @param {Layer} layer
     * @returns {this}
     */
    addLayer(layer: Layer): this;
    /**
     * Removes the given layer from the map.
     * @group Methods for layers and controls
     * @param {Layer} layer
     * @returns {this}
     */
    removeLayer(layer: Layer): this;
    /**
     * Returns `true` if the given layer is currently added to the map.
     * @group Methods for layers and controls
     * @param {Layer} layer
     * @returns {boolean}
     */
    hasLayer(layer: Layer): boolean;
    /**
     * Iterates over the layers of the map, optionally specifying context of the iterator function.
     * ```js
     * map.eachLayer(function(layer){
     *     layer.bindPopup('Hello');
     * });
     * ```
     * @group Methods for layers and controls
     * @param {(layer: Layer) => void} method
     * @param {object} [context]
     * @returns {this}
     */
    eachLayer(method: (layer: Layer) => void, context?: object): this;
}
/**
 * The methods which layers implement, see `Layer`.
 */
export interface LayerExtensionMethods {
    /**
     * Should contain code that creates DOM
     * elements for the layer, adds them to `map panes` where they should belong and puts
     * listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
     */
    onAdd?(map: MaplairMap): void;
    /**
     * Should contain all clean up code that
     * removes the layer's elements from the DOM and removes listeners previously added in
     * `onAdd`. Called on [`map.removeLayer(layer)`](#map-removelayer).
     */
    onRemove?(map: MaplairMap): void;
    /**
     * Should return an object
     * like `{ viewreset: this._reset }` for [`on`](#evented-on). The event handlers in this
     * object will be automatically added and removed from the map with your layer.
     */
    getEvents?(): Record<string, Function>;
    /**
     * Should return an element (or a string
     * containing HTML) to be shown on the `LegendControl` whenever the layer is visible.
     * Fire `legendchange` on the layer when the legend changes.
     */
    getLegend?(): HTMLElement|string;
    /**
     * Called on
     * [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before
     * events are initialized, without waiting until the map is in a usable state. Use for
     * early initialization only.
     */
    beforeAdd?(map: MaplairMap): void;
}
import { Evented } from '../core/Events.js';
import type { MaplairMap } from '../map/Map.js';
import type { LayerGroup } from './LayerGroup.js';
export {};
declare module '../map/Map.js' {
    interface MaplairMap extends MapLayerMethods {
    }
}
export interface Layer extends LayerExtensionMethods {
}
