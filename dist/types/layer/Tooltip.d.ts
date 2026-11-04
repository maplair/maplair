import type { FeatureGroup } from './FeatureGroup.js';
import type { DivOverlayOptions } from './DivOverlay.js';
import type { MaplairMap } from '../map/Map.js';
import type { EventListener, TooltipEvent } from '../core/Events.js';
/** @typedef {typeof layerTooltipMethods} LayerTooltipMethods */
/**
 * Used to display small texts on top of map layers.
 *
 * @example
 * If you want to just bind a tooltip to marker:
 *
 * ```js
 * marker.bindTooltip("my tooltip text").openTooltip();
 * ```
 * Path overlays like polylines also have a `bindTooltip` method.
 *
 * A tooltip can be also standalone:
 *
 * ```js
 * const tooltip = new Tooltip()
 * 	.setLatLng(latlng)
 * 	.setContent('Hello world!<br />This is a nice tooltip.')
 * 	.addTo(map);
 * ```
 * or
 * ```js
 * const tooltip = new Tooltip(latlng, {content: 'Hello world!<br />This is a nice tooltip.'})
 * 	.addTo(map);
 * ```
 *
 * **Security note.** Tooltip string content is rendered as HTML. If your content
 * may include untrusted input (e.g. data from users or external APIs), sanitize
 * it with a library like [DOMPurify](https://github.com/cure53/DOMPurify), or
 * build a DOM element using `textContent` to render it as plain text:
 *
 * ```js
 * const el = document.createElement('div');
 * el.textContent = untrustedString;
 * marker.bindTooltip(el);
 * ```
 *
 * Note about tooltip offset. Maplair takes two options in consideration
 * for computing tooltip offsetting:
 * - the `offset` Tooltip option: it defaults to [0, 0], and it's specific to one tooltip.
 *   Add a positive x offset to move the tooltip to the right, and a positive y offset to
 *   move it to the bottom. Negatives will move to the left and top.
 * - the `tooltipAnchor` Icon option: this will only be considered for Marker. You
 *   should adapt this value if you use a custom icon.
 */
export class Tooltip extends DivOverlay {
    static defaultOptions: Partial<TooltipOptions>;
    /**
     * Instantiates a `Tooltip` object given an optional `options` object that describes
     * its appearance and location and an optional `source` object that is used to tag
     * the tooltip with a reference to the Layer to which it refers.
     * @overload
     * @param {TooltipOptions} [options]
     * @param {Layer} [source]
     */
    constructor(options?: TooltipOptions | undefined, source?: Layer | undefined);
    /**
     * Instantiates a `Tooltip` object given `latlng` where the tooltip will open and an
     * optional `options` object that describes its appearance and location.
     * @overload
     * @param {LatLngExpression} latlng
     * @param {TooltipOptions} [options]
     */
    constructor(latlng: LatLngExpression, options?: TooltipOptions | undefined);
    /**
     * Sets the opacity of the tooltip.
     * @param {number} opacity
     * @returns {void}
     */
    setOpacity(opacity: number): void;
    /** The options of the Tooltip, see [the options](#tooltipoptions). */
    options: TooltipOptions;
}
/**
 * Options of `Tooltip`.
 */
export interface TooltipOptions extends DivOverlayOptions {
    /**
     * `Map pane` where the tooltip will be added.
     * @default 'tooltipPane'
     */
    pane?: string;
    /**
     * Optional offset of the tooltip position.
     * @default [0, 0]
     */
    offset?: PointExpression;
    /**
     * Direction where to open the tooltip. Possible values are: `right`, `left`, `top`,
     * `bottom`, `center`, `auto`. `auto` chooses the direction with enough space when
     * opening the tooltip: preferably the side towards the center of the map (`right` or
     * `left`), otherwise the opposite side, `top` or `bottom`. The tooltip is shifted
     * along that side to stay within the map (within the viewport if `overflow` is set),
     * its tip still pointing at the source.
     * @default 'auto'
     */
    direction?: 'right'|'left'|'top'|'bottom'|'center'|'auto';
    /**
     * Whether to open the tooltip permanently or only
     * on pointerover.
     * @default false
     */
    permanent?: boolean;
    /**
     * If true, the tooltip will follow the pointer
     * instead of being fixed at the feature center.
     * @default false
     */
    sticky?: boolean;
    /**
     * Tooltip container opacity.
     * @default 0.9
     */
    opacity?: number;
}
/**
 * Methods of `MaplairMap` for tooltips.
 * @fires MaplairMap#tooltipopen {TooltipEvent} Fired when a tooltip is opened in the map.
 * @fires MaplairMap#tooltipclose {TooltipEvent} Fired when a tooltip in the map is closed.
 */
export interface MapTooltipMethods {
    /**
     * Opens the specified tooltip.
     *
     * Alternatively, creates a tooltip with the specified content and options and
     * opens it. String content is rendered as HTML; sanitize untrusted input or pass
     * an `HTMLElement` with safe `textContent` instead.
     * @group Methods for layers and controls
     * @param {Tooltip|DivOverlayContent} tooltip The tooltip, or the content of a new
     * tooltip.
     * @param {LatLngExpression} [latlng]
     * @param {TooltipOptions} [options]
     * @returns {this}
     */
    openTooltip(tooltip: Tooltip | DivOverlayContent, latlng?: LatLngExpression, options?: TooltipOptions): this;
    /**
     * Closes the tooltip given as parameter.
     * @group Methods for layers and controls
     * @param {Tooltip} tooltip
     * @returns {this}
     */
    closeTooltip(tooltip: Tooltip): this;
}
/**
 * Methods of `Layer` for tooltips. All layers share a set of methods convenient for
 * binding tooltips to it.
 *
 * ```js
 * const layer = new Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
 * layer.openTooltip();
 * layer.closeTooltip();
 * ```
 * @fires Layer#tooltipopen {TooltipEvent} Fired when a tooltip bound to this layer is
 * opened.
 * @fires Layer#tooltipclose {TooltipEvent} Fired when a tooltip bound to this layer is
 * closed.
 */
export interface LayerTooltipMethods {
    /**
     * Binds a tooltip to the layer with the passed `content` and sets up the
     * necessary event listeners. A `String` argument is rendered as HTML; if it
     * may contain untrusted input, sanitize it (e.g. with DOMPurify) or pass an
     * `HTMLElement` with safe `textContent` instead. If a `Function` is passed
     * it will receive the layer as the first argument and should return a
     * `String` or `HTMLElement`.
     * @group Tooltip methods
     * @param {DivOverlayContent|Tooltip} content
     * @param {TooltipOptions} [options]
     * @returns {this}
     */
    bindTooltip(content: DivOverlayContent | Tooltip, options?: TooltipOptions): this;
    /**
     * Removes the tooltip previously bound with `bindTooltip`.
     * @group Tooltip methods
     * @returns {this}
     */
    unbindTooltip(): this;
    /**
     * Opens the bound tooltip at the specified `latlng` or at the default tooltip
     * anchor if no `latlng` is passed.
     * @group Tooltip methods
     * @param {LatLngExpression} [latlng]
     * @returns {this}
     */
    openTooltip(latlng?: LatLngExpression): this;
    /**
     * Closes the tooltip bound to this layer if it is open.
     * @group Tooltip methods
     * @returns {this}
     */
    closeTooltip(): this;
    /**
     * Opens or closes the tooltip bound to this layer depending on its current state.
     * @group Tooltip methods
     * @returns {this}
     */
    toggleTooltip(): this;
    /**
     * Returns `true` if the tooltip bound to this layer is currently open.
     * @group Tooltip methods
     * @returns {boolean}
     */
    isTooltipOpen(): boolean;
    /**
     * Sets the content of the tooltip bound to this layer. String content is rendered
     * as HTML; sanitize untrusted input or pass an `HTMLElement` with safe
     * `textContent` instead.
     * @group Tooltip methods
     * @param {DivOverlayContent} content
     * @returns {this}
     */
    setTooltipContent(content: DivOverlayContent): this;
    /**
     * Returns the tooltip bound to this layer.
     * @group Tooltip methods
     * @returns {Tooltip|undefined}
     */
    getTooltip(): Tooltip | undefined;
}
import { DivOverlay } from './DivOverlay.js';
import { Point } from '../geometry/Point.js';
import { Layer } from './Layer.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import type { PointExpression } from '../geometry/Point.js';
import type { DivOverlayContent } from './DivOverlay.js';
export {};
declare module '../map/Map.js' {
    interface MaplairMap extends MapTooltipMethods {
    }
}
declare module './Layer.js' {
    interface Layer extends LayerTooltipMethods {
    }
}
