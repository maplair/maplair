/** @import {MaplairMap} from '../map/Map.js' */
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {Point} from '../geometry/Point.js' */
/**
 * Options of `ContextMenu`.
 * @typedef {object} ContextMenuOptions
 * @property {string} [className=''] A custom CSS class name to assign to the menu.
 */
/**
 * The argument of the `callback` of a `ContextMenu` item, with the location of the
 * `contextmenu` event.
 * @typedef {object} ContextMenuEvent
 * @property {LatLng} latlng The geographical point of the event.
 * @property {Point} containerPoint Pixel coordinates of the event relative to the map
 * container.
 * @property {Point} layerPoint Pixel coordinates of the event relative to the map layer.
 * @property {MouseEvent|PointerEvent} originalEvent The original DOM event.
 * @property {Layer} [relatedTarget] The layer, for menus of layers.
 */
/**
 * An item of a `ContextMenu`.
 * @typedef {object} ContextMenuItem
 * @property {string} text The text of the item.
 * @property {(this: ContextMenu, event: ContextMenuEvent) => void} [callback] Called
 * when the item is chosen.
 * @property {boolean} [disabled] Whether the item is disabled.
 */
/**
 * A menu opened with the `contextmenu` event (right click, or long tap on touch
 * screens) on the map or on a layer. Each item calls a function with the location
 * of the event. The menu is a [popover](https://developer.mozilla.org/docs/Web/API/Popover_API),
 * closed by clicking outside of it or pressing Escape, and can be used with the
 * keyboard (arrow keys, Enter).
 *
 * Inspired by the [Leaflet.contextmenu](https://github.com/aratcliffe/Leaflet.contextmenu) plugin.
 *
 * @example
 * ```js
 * new ContextMenu([
 * 	{text: 'Center the map here', callback: e => map.panTo(e.latlng)},
 * 	'-',
 * 	{text: 'Zoom in', callback: () => map.zoomIn()}
 * ]).addTo(map);
 *
 * new ContextMenu([
 * 	{text: 'Remove', callback: e => e.relatedTarget.remove()}
 * ]).addTo(marker);
 * ```
 */
export class ContextMenu extends Class {
    static defaultOptions: Partial<ContextMenuOptions>;
    /**
     * Creates a context menu. Each item is an object with `text`, `callback` and the
     * optional `disabled`, or `'-'` for a separator. The `callback` gets an event with
     * `latlng`, `containerPoint`, `layerPoint`, `originalEvent` and `relatedTarget`
     * (the layer, for menus of layers).
     * @param {(ContextMenuItem|'-')[]} items
     * @param {ContextMenuOptions} [options]
     */
    constructor(items: (ContextMenuItem | "-")[], options?: ContextMenuOptions);
    /**
     * Opens the menu on `contextmenu` events of the map or the layer.
     * @param {MaplairMap|Layer} target
     * @returns {this}
     */
    addTo(target: MaplairMap | Layer): this;
    /**
     * Removes the menu from its map or layer.
     * @returns {this}
     */
    remove(): this;
    /**
     * Closes the menu.
     * @returns {this}
     */
    close(): this;
    /**
     * Returns `true` if the menu is open.
     * @returns {boolean}
     */
    isOpen(): boolean;
    /** The options of the ContextMenu, see [the options](#contextmenuoptions). */
    options: ContextMenuOptions;
}
/**
 * Options of `ContextMenu`.
 */
export interface ContextMenuOptions {
    /**
     * A custom CSS class name to assign to the menu.
     * @default ''
     */
    className?: string;
}
/**
 * The argument of the `callback` of a `ContextMenu` item, with the location of the
 * `contextmenu` event.
 */
export interface ContextMenuEvent {
    /**
     * The geographical point of the event.
     */
    latlng: LatLng;
    /**
     * Pixel coordinates of the event relative to the map
     * container.
     */
    containerPoint: Point;
    /**
     * Pixel coordinates of the event relative to the map layer.
     */
    layerPoint: Point;
    /**
     * The original DOM event.
     */
    originalEvent: MouseEvent|PointerEvent;
    /**
     * The layer, for menus of layers.
     */
    relatedTarget?: Layer;
}
/**
 * An item of a `ContextMenu`.
 */
export interface ContextMenuItem {
    /**
     * The text of the item.
     */
    text: string;
    /**
     * Called
     * when the item is chosen.
     */
    callback?: (this: ContextMenu, event: ContextMenuEvent) => void;
    /**
     * Whether the item is disabled.
     */
    disabled?: boolean;
}
import { Class } from '../core/Class.js';
import type { MaplairMap } from '../map/Map.js';
import { Layer } from '../layer/Layer.js';
import type { LatLng } from '../geo/LatLng.js';
import type { Point } from '../geometry/Point.js';
