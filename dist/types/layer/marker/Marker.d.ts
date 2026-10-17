import type { DefaultIcon } from './DefaultIcon.js';
import type { Point } from '../../geometry/Point.js';
import type { MaplairEvent } from '../../core/Events.js';
import type { InteractiveLayerOptions } from '../Layer.js';
/** @import {Icon} from './Icon.js' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {InteractiveLayerOptions} from '../Layer.js' */
/**
 * Options of `Marker`.
 * @typedef {object} MarkerOptions
 * @property {Icon} [icon=new DefaultIcon()] Icon instance to use for rendering the
 * marker. See [Icon documentation](#Icon) for details on how to customize the marker
 * icon. If not specified, a common instance of `DefaultIcon` is used.
 * @property {boolean} [keyboard=true] Whether the marker can be tabbed to with a keyboard
 * and clicked by pressing enter.
 * @property {string} [title=''] Text for the browser tooltip that appear on marker hover
 * (no tooltip by default).
 * [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
 * @property {string} [alt='Marker'] Text for the `alt` attribute of the icon image.
 * [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
 * @property {number} [zIndexOffset=0] By default, marker images zIndex is set
 * automatically based on its latitude. Use this option if you want to put the marker on
 * top of all others (or below), specifying a high value like `1000` (or high negative
 * value, respectively).
 * @property {number} [opacity=1] The opacity of the marker.
 * @property {boolean} [riseOnHover=false] If `true`, the marker will get on top of
 * others when you hover the pointer over it.
 * @property {number} [riseOffset=250] The z-index offset used for the `riseOnHover`
 * feature.
 * @property {string} [pane='markerPane'] `Map pane` where the markers icon will be added.
 * @property {string} [shadowPane='shadowPane'] `Map pane` where the markers shadow will
 * be added.
 * @property {boolean} [shadow=true] Whether to show the shadow of the marker's icon. Each
 * shadow is an additional element on the page, so disabling shadows noticeably reduces
 * the browser's rendering work when showing many markers (e.g. several thousands),
 * especially while panning and zooming. To disable shadows for all markers, use
 * `Marker.mergeOptions({shadow: false})`.
 * @property {boolean} [bubblingPointerEvents=false] When `true`, a pointer event on this
 * marker will trigger the same event on the map (unless
 * [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
 * @property {boolean} [autoPanOnFocus=true] When `true`, the map will pan whenever the
 * marker is focused (via e.g. pressing `tab` on the keyboard) to ensure the marker is
 * visible within the map's bounds.
 * @property {boolean} [draggable=false] Whether the marker is draggable with pointer or
 * not.
 * @property {boolean} [autoPan=false] Whether to pan the map when dragging this marker
 * near its edge or not.
 * @property {PointExpression} [autoPanPadding=[50, 50]] Distance (in pixels to the
 * left/right and to the top/bottom) of the map edge to start panning the map.
 * @property {number} [autoPanSpeed=10] Number of pixels the map should pan by.
 * @extends InteractiveLayerOptions
 */
/**
 * The event object of `move` and `drag` of markers.
 * @typedef {object} MarkerMoveEvent
 * @property {LatLng} latlng The new position of the marker.
 * @property {LatLng} [oldLatLng] The previous position of the marker.
 * @extends MaplairEvent
 */
/**
 * Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
 *
 * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and
 * [popup methods](#Popup) like `bindPopup()` you can also use the methods below.
 *
 * @example
 * ```js
 * new Marker([50.5, 30.5]).addTo(map);
 * ```
 *
 * @fires move {MarkerMoveEvent} Fired when the marker is moved via
 * [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new
 * coordinates are included in event arguments as `oldLatLng`, `latlng`.
 */
export class Marker extends Layer {
    /**
     * Instantiates a Marker object given a geographical point and optionally an options
     * object.
     * @param {LatLngExpression} latlng
     * @param {MarkerOptions} [options]
     */
    constructor(latlng: LatLngExpression, options?: MarkerOptions);
    /**
     * Adds the icon (and shadow) of the marker to the map.
     * @param {MaplairMap} map
     */
    onAdd(map: MaplairMap): void;
    /**
     * Removes the icon (and shadow) of the marker from the map.
     * @param {MaplairMap} map
     */
    onRemove(map: MaplairMap): void;
    /**
     * Returns the map events the marker listens to, see `Layer`.
     * @returns {Record<string, Function>}
     */
    getEvents(): Record<string, Function>;
    /**
     * Returns the current geographical position of the marker.
     * @returns {LatLng}
     */
    getLatLng(): LatLng;
    /**
     * Changes the marker position to the given point.
     * @param {LatLngExpression} latlng
     * @returns {this}
     */
    setLatLng(latlng: LatLngExpression): this;
    /**
     * Changes the [zIndex offset](#markeroptions-zindexoffset) of the marker.
     * @param {number} offset
     * @returns {this}
     */
    setZIndexOffset(offset: number): this;
    /**
     * Returns the current icon used by the marker.
     * @returns {Icon}
     */
    getIcon(): Icon;
    /**
     * Changes the marker icon.
     * @param {Icon} icon
     * @returns {this}
     */
    setIcon(icon: Icon): this;
    /**
     * Returns the instance of [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)
     * used by Marker layer.
     * @returns {HTMLElement}
     */
    getElement(): HTMLElement;
    /**
     * Updates the position of the marker on the map, e.g. after a change of its options.
     * @returns {this}
     */
    update(): this;
    /**
     * Marker dragging handler, see `Handler`. Only valid when the marker is on the
     * map (otherwise set [`marker.options.draggable`](#markeroptions-draggable)).
     *
     * Interaction handlers are properties of a marker instance that allow you to
     * control interaction behavior in runtime, enabling or disabling certain
     * features such as dragging (see `Handler` methods). Example:
     *
     * ```js
     * marker.dragging.disable();
     * ```
     * @group Interaction handlers
     * @type {MarkerDrag}
     */
    dragging: MarkerDrag | undefined;
    /**
     * Changes the opacity of the marker.
     * @param {number} opacity
     * @returns {this}
     */
    setOpacity(opacity: number): this;
    /** The options of the Marker, see [the options](#markeroptions). */
    options: MarkerOptions;
}
/**
 * Options of `Marker`.
 */
export interface MarkerOptions extends InteractiveLayerOptions {
    /**
     * Icon instance to use for rendering the
     * marker. See [Icon documentation](#Icon) for details on how to customize the marker
     * icon. If not specified, a common instance of `DefaultIcon` is used.
     * @default new DefaultIcon()
     */
    icon?: Icon;
    /**
     * Whether the marker can be tabbed to with a keyboard
     * and clicked by pressing enter.
     * @default true
     */
    keyboard?: boolean;
    /**
     * Text for the browser tooltip that appear on marker hover
     * (no tooltip by default).
     * [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
     * @default ''
     */
    title?: string;
    /**
     * Text for the `alt` attribute of the icon image.
     * [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
     * @default 'Marker'
     */
    alt?: string;
    /**
     * By default, marker images zIndex is set
     * automatically based on its latitude. Use this option if you want to put the marker on
     * top of all others (or below), specifying a high value like `1000` (or high negative
     * value, respectively).
     * @default 0
     */
    zIndexOffset?: number;
    /**
     * The opacity of the marker.
     * @default 1
     */
    opacity?: number;
    /**
     * If `true`, the marker will get on top of
     * others when you hover the pointer over it.
     * @default false
     */
    riseOnHover?: boolean;
    /**
     * The z-index offset used for the `riseOnHover`
     * feature.
     * @default 250
     */
    riseOffset?: number;
    /**
     * `Map pane` where the markers icon will be added.
     * @default 'markerPane'
     */
    pane?: string;
    /**
     * `Map pane` where the markers shadow will
     * be added.
     * @default 'shadowPane'
     */
    shadowPane?: string;
    /**
     * Whether to show the shadow of the marker's icon. Each
     * shadow is an additional element on the page, so disabling shadows noticeably reduces
     * the browser's rendering work when showing many markers (e.g. several thousands),
     * especially while panning and zooming. To disable shadows for all markers, use
     * `Marker.mergeOptions({shadow: false})`.
     * @default true
     */
    shadow?: boolean;
    /**
     * When `true`, a pointer event on this
     * marker will trigger the same event on the map (unless
     * [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
     * @default false
     */
    bubblingPointerEvents?: boolean;
    /**
     * When `true`, the map will pan whenever the
     * marker is focused (via e.g. pressing `tab` on the keyboard) to ensure the marker is
     * visible within the map's bounds.
     * @default true
     */
    autoPanOnFocus?: boolean;
    /**
     * Whether the marker is draggable with pointer or
     * not.
     * @default false
     */
    draggable?: boolean;
    /**
     * Whether to pan the map when dragging this marker
     * near its edge or not.
     * @default false
     */
    autoPan?: boolean;
    /**
     * Distance (in pixels to the
     * left/right and to the top/bottom) of the map edge to start panning the map.
     * @default [50, 50]
     */
    autoPanPadding?: PointExpression;
    /**
     * Number of pixels the map should pan by.
     * @default 10
     */
    autoPanSpeed?: number;
}
/**
 * The event object of `move` and `drag` of markers.
 */
export interface MarkerMoveEvent extends MaplairEvent {
    /**
     * The new position of the marker.
     */
    latlng: LatLng;
    /**
     * The previous position of the marker.
     */
    oldLatLng?: LatLng;
}
import { Layer } from '../Layer.js';
import { LatLng } from '../../geo/LatLng.js';
import type { MaplairMap } from '../../map/Map.js';
import type { LatLngExpression } from '../../geo/LatLng.js';
import type { Icon } from './Icon.js';
import { MarkerDrag } from './Marker.Drag.js';
import type { PointExpression } from '../../geometry/Point.js';
