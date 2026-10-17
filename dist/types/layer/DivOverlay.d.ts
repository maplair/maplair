import type { FeatureGroup } from './FeatureGroup.js';
import type { Point } from '../geometry/Point.js';
import type { InteractiveLayerOptions } from './Layer.js';
import type { MaplairEvent } from '../core/Events.js';
/** @typedef {typeof layerDivOverlayMethods} LayerDivOverlayMethods */
/**
 * Base model for Popup and Tooltip. Inherit from it for custom overlays like plugins.
 *
 * @fires contentupdate {MaplairEvent} Fired when the content of the overlay is updated.
 */
export class DivOverlay extends Layer {
    /**
     * Instantiates an overlay given an optional `options` object that describes its
     * appearance and location and an optional `source` object that is used to tag the
     * overlay with a reference to the Layer to which it refers.
     * @overload
     * @param {DivOverlayOptions} [options]
     * @param {Layer} [source]
     */
    constructor(options?: DivOverlayOptions | undefined, source?: Layer | undefined);
    /**
     * Instantiates an overlay given `latlng` where the overlay will open and an
     * optional `options` object that describes its appearance and location.
     * @overload
     * @param {LatLngExpression} latlng
     * @param {DivOverlayOptions} [options]
     */
    constructor(latlng: LatLngExpression, options?: DivOverlayOptions | undefined);
    /**
     * Adds the overlay to the map.
     * Alternative to `map.openPopup(popup)`/`.openTooltip(tooltip)`.
     * @param {MaplairMap} map
     * @returns {this}
     */
    openOn(map: MaplairMap, ...args: any[]): this;
    /**
     * Closes the overlay.
     * Alternative to `map.closePopup(popup)`/`.closeTooltip(tooltip)`
     * and `layer.closePopup()`/`.closeTooltip()`.
     * @returns {this}
     */
    close(): this;
    /**
     * Opens or closes the overlay bound to layer depending on its current state.
     * Argument may be omitted only for overlay bound to layer.
     * Alternative to `layer.togglePopup()`/`.toggleTooltip()`.
     * @param {Layer} [layer]
     * @returns {this}
     */
    toggle(layer?: Layer, ...args: any[]): this;
    /**
     * Adds the overlay to the map.
     * @param {MaplairMap} map
     */
    onAdd(map: MaplairMap): void;
    /**
     * Removes the overlay from the map.
     * @param {MaplairMap} map
     */
    onRemove(map: MaplairMap): void;
    /**
     * Returns the geographical point of the overlay.
     * @returns {LatLng}
     */
    getLatLng(): LatLng;
    /**
     * Sets the geographical point where the overlay will open.
     * @param {LatLngExpression} latlng
     * @returns {this}
     */
    setLatLng(latlng: LatLngExpression): this;
    /**
     * Returns the content of the overlay.
     * @returns {DivOverlayContent}
     */
    getContent(): DivOverlayContent;
    /**
     * Sets the HTML content of the overlay. A `String` argument is rendered as
     * HTML; if it may contain untrusted input, sanitize it (e.g. with DOMPurify)
     * or pass an `HTMLElement` with safe `textContent` instead. If a function is
     * passed the source layer will be passed to the function. The function should
     * return a `String` or `HTMLElement` to be used in the overlay.
     * @param {DivOverlayContent} content
     * @returns {this}
     */
    setContent(content: DivOverlayContent): this;
    /**
     * Returns the HTML container of the overlay.
     * @returns {HTMLElement}
     */
    getElement(): HTMLElement;
    /**
     * Updates the overlay content, layout and position. Useful for updating the
     * overlay after something inside changed, e.g. image loaded.
     * @returns {void}
     */
    update(): void;
    /**
     * Returns the map events the overlay listens to.
     * @returns {Record<string, EventListener>}
     */
    getEvents(): Record<string, EventListener>;
    /**
     * Returns `true` when the overlay is visible on the map.
     * @returns {boolean}
     */
    isOpen(): boolean;
    /**
     * Brings this overlay in front of other overlays (in the same map pane).
     * @returns {this}
     */
    bringToFront(): this;
    /**
     * Brings this overlay to the back of other overlays (in the same map pane).
     * @returns {this}
     */
    bringToBack(): this;
    /** The options of the DivOverlay, see [the options](#divoverlayoptions). */
    options: DivOverlayOptions;
}
/**
 * The content of a `DivOverlay` (`Popup`, `Tooltip`): a string rendered as HTML, an
 * `HTMLElement`, or a function receiving the source layer and returning one of them.
 */
export type DivOverlayContent = string | HTMLElement | ((layer: Layer) => string | HTMLElement);
/**
 * Options of `DivOverlay`.
 */
export interface DivOverlayOptions extends InteractiveLayerOptions {
    /**
     * If true, the popup/tooltip will listen to the
     * pointer events.
     * @default false
     */
    interactive?: boolean;
    /**
     * The offset of the overlay position.
     * @default [0, 0]
     */
    offset?: PointExpression;
    /**
     * A custom CSS class name to assign to the overlay.
     * @default ''
     */
    className?: string;
    /**
     * `Map pane` where the overlay will be added.
     */
    pane?: string;
    /**
     * Whether the overlay may extend beyond the map
     * container, e.g. a tooltip of a marker near the edge of a small map. The overlay is
     * then shown as [popover](https://developer.mozilla.org/docs/Web/API/Popover_API) in
     * the top layer of the page, above all other content, while remaining in its map pane
     * in the DOM (for styling and events).
     * @default false
     */
    overflow?: boolean;
    /**
     * Sets the HTML content of the overlay while
     * initializing. If a function is passed the source layer will be passed to the
     * function. The function should return a `String` or `HTMLElement` to be used in the
     * overlay. String content is rendered as HTML; sanitize untrusted input or pass an
     * `HTMLElement` with safe `textContent` instead.
     * @default ''
     */
    content?: DivOverlayContent;
}
/**
 * Methods of `MaplairMap` for overlays.
 */
export interface MapDivOverlayMethods {
}
/**
 * Methods of `Layer` for overlays.
 */
export interface LayerDivOverlayMethods {
}
import { Layer } from './Layer.js';
import { LatLng } from '../geo/LatLng.js';
import type { MaplairMap } from '../map/Map.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import type { EventListener } from '../core/Events.js';
import type { PointExpression } from '../geometry/Point.js';
export {};
declare module '../map/Map.js' {
    interface MaplairMap extends MapDivOverlayMethods {
    }
}
declare module './Layer.js' {
    interface Layer extends LayerDivOverlayMethods {
    }
}
