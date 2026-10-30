import type { Path } from './vector/Path.js';
import type { FeatureGroup } from './FeatureGroup.js';
import type { I18n } from '../core/I18n.js';
import type { DivOverlayOptions } from './DivOverlay.js';
import type { EventListener, MaplairEvent, PopupEvent } from '../core/Events.js';
/** @typedef {typeof layerPopupMethods} LayerPopupMethods */
/**
 * Used to open popups in certain places of the map. Use [Map.openPopup](#map-openpopup) to
 * open popups while making sure that only one popup is open at one time
 * (recommended for usability), or use [Map.addLayer](#map-addlayer) to open as many as you want.
 *
 * @example
 * If you want to just bind a popup to marker click and then open it, it's really easy:
 *
 * ```js
 * marker.bindPopup(popupContent).openPopup();
 * ```
 * Path overlays like polylines also have a `bindPopup` method.
 *
 * A popup can be also standalone:
 *
 * ```js
 * const popup = new Popup()
 * 	.setLatLng(latlng)
 * 	.setContent('<p>Hello world!<br />This is a nice popup.</p>')
 * 	.openOn(map);
 * ```
 * or
 * ```js
 * const popup = new Popup(latlng, {content: '<p>Hello world!<br />This is a nice popup.</p>'})
 * 	.openOn(map);
 * ```
 *
 * **Security note.** Popup string content is rendered as HTML. If your content
 * may include untrusted input (e.g. data from users or external APIs), sanitize
 * it with a library like [DOMPurify](https://github.com/cure53/DOMPurify), or
 * build a DOM element using `textContent` to render it as plain text:
 *
 * ```js
 * const el = document.createElement('div');
 * el.textContent = untrustedString;
 * marker.bindPopup(el);
 * ```
 */
export class Popup extends DivOverlay {
    static defaultOptions: Partial<PopupOptions>;
    /**
     * Instantiates a `Popup` object given an optional `options` object that describes
     * its appearance and location and an optional `source` object that is used to tag
     * the popup with a reference to the Layer to which it refers.
     * @overload
     * @param {PopupOptions} [options]
     * @param {Layer} [source]
     */
    constructor(options?: PopupOptions | undefined, source?: Layer | undefined);
    /**
     * Instantiates a `Popup` object given `latlng` where the popup will open and an
     * optional `options` object that describes its appearance and location.
     * @overload
     * @param {LatLngExpression} latlng
     * @param {PopupOptions} [options]
     */
    constructor(latlng: LatLngExpression, options?: PopupOptions | undefined);
    /**
     * Alternative to `map.openPopup(popup)`.
     * Adds the popup to the map and closes the previous one.
     * @param {MaplairMap} map
     * @returns {this}
     */
    openOn(map: MaplairMap, ...args: any[]): this;
    /** The options of the Popup, see [the options](#popupoptions). */
    options: PopupOptions;
}
/**
 * Options of `Popup`.
 */
export interface PopupOptions extends DivOverlayOptions {
    /**
     * `Map pane` where the popup will be added.
     * @default 'popupPane'
     */
    pane?: string;
    /**
     * The offset of the popup position.
     * @default [0, 7]
     */
    offset?: PointExpression;
    /**
     * Max width of the popup, in pixels.
     * @default 300
     */
    maxWidth?: number;
    /**
     * Min width of the popup, in pixels.
     * @default 50
     */
    minWidth?: number;
    /**
     * If set, creates a scrollable container of
     * the given height inside a popup if its content exceeds it. The scrollable container
     * can be styled using the `maplair-popup-scrolled` CSS class selector.
     * @default null
     */
    maxHeight?: number|null;
    /**
     * Set it to `false` if you don't want the map to do
     * panning animation to fit the opened popup.
     * @default true
     */
    autoPan?: boolean;
    /**
     * The margin between the
     * popup and the top left corner of the map view after autopanning was performed.
     * @default null
     */
    autoPanPaddingTopLeft?: PointExpression|null;
    /**
     * The margin between
     * the popup and the bottom right corner of the map view after autopanning was
     * performed.
     * @default null
     */
    autoPanPaddingBottomRight?: PointExpression|null;
    /**
     * Equivalent of setting both top
     * left and bottom right autopan padding to the same value.
     * @default [5, 5]
     */
    autoPanPadding?: PointExpression;
    /**
     * Set it to `true` if you want to prevent users
     * from panning the popup off of the screen while it is open.
     * @default false
     */
    keepInView?: boolean;
    /**
     * Controls the presence of a close button in
     * the popup.
     * @default true
     */
    closeButton?: boolean;
    /**
     * Set it to `false` if you want to override the
     * default behavior of the popup closing when another popup is opened.
     * @default true
     */
    autoClose?: boolean;
    /**
     * Set it to `false` if you want to
     * override the default behavior of the ESC key for closing of the popup.
     * @default true
     */
    closeOnEscapeKey?: boolean;
    /**
     * Set it if you want to override the default
     * behavior of the popup closing when user clicks on the map. Defaults to the map's
     * [`closePopupOnClick`](#map-closepopuponclick) option.
     */
    closeOnClick?: boolean;
    /**
     * A custom CSS class name to assign to the popup.
     * @default ''
     */
    className?: string;
    /**
     * Whether the popup shall react to changes in
     * the size of its contents (e.g. when an image inside the popup loads) and reposition
     * itself.
     * @default true
     */
    trackResize?: boolean;
}
/**
 * Map options of `Popup`.
 */
export interface PopupMapOptions {
    /**
     * Set it to `false` if you don't want
     * popups to close when user clicks the map.
     * @default true
     */
    closePopupOnClick?: boolean;
}
/**
 * Methods of `MaplairMap` for popups.
 * @fires MaplairMap#popupopen {PopupEvent} Fired when a popup is opened in the map.
 * @fires MaplairMap#popupclose {PopupEvent} Fired when a popup in the map is closed.
 * @fires MaplairMap#autopanstart {MaplairEvent} Fired when the map starts autopanning
 * when opening a popup.
 */
export interface MapPopupMethods {
    /**
     * Opens the specified popup while closing the previously opened (to make sure only
     * one is opened at one time for usability).
     *
     * Alternatively, creates a popup with the specified content and options and opens
     * it in the given point on a map. String content is rendered as HTML; sanitize
     * untrusted input or pass an `HTMLElement` with safe `textContent` instead.
     * @group Methods for layers and controls
     * @param {Popup|DivOverlayContent} popup The popup, or the content of a new popup.
     * @param {LatLngExpression} [latlng]
     * @param {PopupOptions} [options]
     * @returns {this}
     */
    openPopup(popup: Popup | DivOverlayContent, latlng?: LatLngExpression, options?: PopupOptions): this;
    /**
     * Closes the popup previously opened with [openPopup](#map-openpopup) (or the
     * given one).
     * @group Methods for layers and controls
     * @param {Popup} [popup]
     * @returns {this}
     */
    closePopup(popup?: Popup, ...args: any[]): this;
}
/**
 * Methods of `Layer` for popups. All layers share a set of methods convenient for
 * binding popups to it.
 *
 * ```js
 * const layer = new Polygon(latlngs).bindPopup('Hi There!').addTo(map);
 * layer.openPopup();
 * layer.closePopup();
 * ```
 *
 * Popups will also be automatically opened when the layer is clicked on and closed
 * when the layer is removed from the map or another popup is opened.
 * @fires Layer#popupopen {PopupEvent} Fired when a popup bound to this layer is opened.
 * @fires Layer#popupclose {PopupEvent} Fired when a popup bound to this layer is closed.
 */
export interface LayerPopupMethods {
    /**
     * Binds a popup to the layer with the passed `content` and sets up the
     * necessary event listeners. A `String` argument is rendered as HTML; if it
     * may contain untrusted input, sanitize it (e.g. with DOMPurify) or pass an
     * `HTMLElement` with safe `textContent` instead. If a `Function` is passed
     * it will receive the layer as the first argument and should return a
     * `String` or `HTMLElement`.
     * @group Popup methods
     * @param {DivOverlayContent|Popup} content
     * @param {PopupOptions} [options]
     * @returns {this}
     */
    bindPopup(content: DivOverlayContent | Popup, options?: PopupOptions): this;
    /**
     * Removes the popup previously bound with `bindPopup`.
     * @group Popup methods
     * @returns {this}
     */
    unbindPopup(): this;
    /**
     * Opens the bound popup at the specified `latlng` or at the default popup anchor
     * if no `latlng` is passed.
     * @group Popup methods
     * @param {LatLngExpression} [latlng]
     * @returns {this}
     */
    openPopup(latlng?: LatLngExpression): this;
    /**
     * Closes the popup bound to this layer if it is open.
     * @group Popup methods
     * @returns {this}
     */
    closePopup(): this;
    /**
     * Opens or closes the popup bound to this layer depending on its current state.
     * @group Popup methods
     * @returns {this}
     */
    togglePopup(): this;
    /**
     * Returns `true` if the popup bound to this layer is currently open.
     * @group Popup methods
     * @returns {boolean}
     */
    isPopupOpen(): boolean;
    /**
     * Sets the content of the popup bound to this layer. String content is rendered
     * as HTML; sanitize untrusted input or pass an `HTMLElement` with safe
     * `textContent` instead.
     * @group Popup methods
     * @param {DivOverlayContent} content
     * @returns {this}
     */
    setPopupContent(content: DivOverlayContent): this;
    /**
     * Returns the popup bound to this layer.
     * @group Popup methods
     * @returns {Popup|undefined}
     */
    getPopup(): Popup | undefined;
}
import { DivOverlay } from './DivOverlay.js';
import type { MaplairMap } from '../map/Map.js';
import { Point } from '../geometry/Point.js';
import { Layer } from './Layer.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import type { PointExpression } from '../geometry/Point.js';
import type { DivOverlayContent } from './DivOverlay.js';
export {};
declare module '../map/Map.js' {
    interface MaplairMapOptions extends PopupMapOptions {
    }
}
declare module '../map/Map.js' {
    interface MaplairMap extends MapPopupMethods {
    }
}
declare module './Layer.js' {
    interface Layer extends LayerPopupMethods {
    }
}
