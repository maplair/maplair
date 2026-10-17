import type { EPSG3857 } from '../geo/crs/EPSG3857.js';
import type Browser from '../core/Browser.js';
import type { I18n } from '../core/I18n.js';
import type { Control } from '../control/Control.js';
import type { AttributionControl } from '../control/AttributionControl.js';
import type { ZoomControl } from '../control/ZoomControl.js';
import type { FullscreenControl } from '../control/FullscreenControl.js';
import type { DivOverlay } from '../layer/DivOverlay.js';
import type { Popup } from '../layer/Popup.js';
import type { Tooltip } from '../layer/Tooltip.js';
import type { BoxZoomHandler } from './handler/BoxZoomHandler.js';
import type { DoubleClickZoomHandler } from './handler/DoubleClickZoomHandler.js';
import type { DragHandler } from './handler/DragHandler.js';
import type { KeyboardHandler } from './handler/KeyboardHandler.js';
import type { PinchZoomHandler } from './handler/PinchZoomHandler.js';
import type { ScrollWheelZoomHandler } from './handler/ScrollWheelZoomHandler.js';
import type { TapHoldHandler } from './handler/TapHoldHandler.js';
import type { TapDragZoomHandler } from './handler/TapDragZoomHandler.js';
import type { MaplairEvent, MaplairPointerEvent, MaplairKeyboardEvent, MaplairErrorEvent, LocationEvent, ResizeEvent, CrsChangeEvent, ZoomAnimEvent } from '../core/Events.js';
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/** @import {Handler} from '../core/Handler.js' */
/** @import {Renderer} from '../layer/vector/Renderer.js' */
/** @import {MaplairEvent, MaplairPointerEvent, MaplairKeyboardEvent, MaplairErrorEvent, LocationEvent, ResizeEvent, CrsChangeEvent, ZoomAnimEvent} from '../core/Events.js' */
/**
 * Options of `MaplairMap`.
 * @typedef {object} MaplairMapOptions
 * @property {CRS} [crs=EPSG3857] The [Coordinate Reference System](#crs) to use.
 * Don't change this if you're not sure what it means.
 * @property {LatLngExpression} [center] Initial geographic center of the map.
 * @property {number} [zoom] Initial map zoom level.
 * @property {number} [minZoom] Minimum zoom level of the map. If not specified and at
 * least one `GridLayer` or `TileLayer` is in the map, the lowest of their `minZoom`
 * options will be used instead.
 * @property {number} [maxZoom] Maximum zoom level of the map. If not specified and at
 * least one `GridLayer` or `TileLayer` is in the map, the highest of their `maxZoom`
 * options will be used instead.
 * @property {Layer[]} [layers=[]] Array of layers that will be added to the map initially.
 * @property {string} [ariaLabel] The accessible name of the map, announced by screen
 * readers, `'Map'` by default. The map container gets the ARIA role `region` with this
 * label, unless it already has a role or label. The default is translated, see `I18n`.
 * @property {LatLngBoundsExpression} [maxBounds] When this option is set, the map
 * restricts the view to the given geographical bounds, bouncing the user back if the
 * user tries to pan outside the view. To set the restriction dynamically, use
 * [`setMaxBounds`](#map-setmaxbounds) method.
 * @property {Renderer} [renderer] The default method for drawing vector layers on the
 * map. `SVG` or `Canvas` by default depending on browser support.
 * @property {boolean} [zoomAnimation] Whether the map zoom animation is enabled.
 * Animations are enabled by default unless the user has configured their browser for
 * reduced [motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences).
 * @property {number} [zoomAnimationThreshold=4] Won't animate zoom if the zoom
 * difference exceeds this value.
 * @property {boolean} [continuousZoom=false] Whether zoom animations (e.g. of the zoom
 * control, double click and keyboard) change the view frame by frame through fractional
 * zoom levels, like `flyTo()` and pinch zoom, instead of scaling the map with a CSS
 * transition between two zoom levels. Also makes the scroll wheel zoom smoothly with
 * each wheel event (see `scrollWheelZoom`), snapping to `zoomSnap` when scrolling ends.
 * @property {boolean} [fadeAnimation] Whether the tile fade animation is enabled.
 * Animations are enabled by default unless the user has configured their browser for
 * reduced [motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences).
 * @property {boolean} [markerZoomAnimation=true] Whether markers animate their zoom
 * with the zoom animation, if disabled they will disappear for the length of the
 * animation.
 * @property {boolean} [markerCulling=false] Whether markers far outside of the map view
 * (more than half a view away) are taken off the page until the map is moved closer to
 * them. This reduces the browser's rendering work, and the work of repositioning
 * markers while zooming, when a map has many markers (e.g. several thousands) of which
 * only some are visible at a time.
 * @property {number} [transform3DLimit=8388608] Defines the maximum size of a CSS
 * translation transform (2^23). The default value should not be changed unless a web
 * browser positions layers in the wrong place after doing a large `panBy`.
 * @property {number} [zoomSnap=1] Forces the map's zoom level to always be a multiple
 * of this, particularly right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
 * By default, the zoom level snaps to the nearest integer; lower values (e.g. `0.5` or
 * `0.1`) allow for greater granularity. A value of `0` means the zoom level will not be
 * snapped after `fitBounds` or a pinch-zoom.
 * @property {number} [zoomDelta=1] Controls how much the map's zoom level will change
 * after a [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+` or `-`
 * on the keyboard, or using the [zoom controls](#control-zoom). Values smaller than `1`
 * (e.g. `0.5`) allow for greater granularity.
 * @property {boolean} [trackResize=true] Whether the map automatically handles browser
 * window resize to update itself. A hidden map (with the size 0, e.g. `display: none`
 * in an inactive tab) keeps its size, view and bounds until it is shown again.
 */
/**
 * Options of the geolocation methods of `MaplairMap`, e.g. `locate()`.
 * @typedef {object} LocateOptions
 * @property {boolean} [watch=false] If `true`, starts continuous watching of location
 * changes (instead of detecting it once) using W3C `watchPosition` method. You can
 * later stop watching using `map.stopLocate()` method.
 * @property {boolean} [setView=false] If `true`, automatically sets the map view to the
 * user location with respect to detection accuracy, or to world view if geolocation
 * failed.
 * @property {number} [maxZoom=Infinity] The maximum zoom for automatic view setting
 * when using `setView` option.
 * @property {number} [timeout=10000] Number of milliseconds to wait for a response from
 * geolocation before firing a `locationerror` event.
 * @property {number} [maximumAge=0] Maximum age of detected location. If less than this
 * amount of milliseconds passed since last geolocation response, `locate` will return
 * a cached location.
 * @property {boolean} [enableHighAccuracy=false] Enables high accuracy, see
 * [description in the W3C spec](https://w3c.github.io/geolocation-api/#enablehighaccuracy-member).
 */
/**
 * Options of the `MaplairMap` methods which modify the zoom level.
 * @typedef {object} ZoomOptions
 * @property {boolean} [animate] If not specified, zoom animation will happen if the
 * zoom origin is inside the current view. If `true`, the map will attempt animating
 * zoom disregarding where zoom origin is. Setting `false` will make it always reset the
 * view completely without animation.
 */
/**
 * Options of the `MaplairMap` methods which modify the center of the map.
 * @typedef {object} PanOptions
 * @property {boolean} [animate] If `true`, panning will always be animated if possible.
 * If `false`, it will not animate panning, either resetting the map view if panning
 * more than a screen away, or just setting a new offset for the map pane (except for
 * `panBy` which always does the latter).
 * @property {number} [duration=0.25] Duration of animated panning, in seconds.
 * @property {number} [easeLinearity=0.25] The curvature factor of panning animation
 * easing (third parameter of the [Cubic Bezier curve](https://cubic-bezier.com/)).
 * 1.0 means linear animation, and the smaller this number, the more bowed the curve.
 * @property {boolean} [noMoveStart=false] If `true`, panning won't fire `movestart`
 * event on start (used internally for panning inertia).
 */
/**
 * Options of the `MaplairMap` methods which modify the zoom level and the center.
 * @typedef {object} ZoomPanOptions
 * @extends ZoomOptions, PanOptions
 */
/**
 * Options of `MaplairMap.invalidateSize()`.
 * @typedef {object} InvalidateSizeOptions
 * @property {boolean} [pan=true] If `false`, panning will not occur.
 * @property {boolean} [debounceMoveend=false] If `true`, it will delay `moveend` event
 * so that it doesn't happen often even if the method is called many times in a row.
 * @extends ZoomPanOptions
 */
/**
 * Padding options of `MaplairMap` methods, e.g. `panInside()`.
 * @typedef {object} PaddingOptions
 * @property {PointExpression} [paddingTopLeft=[0, 0]] Sets the amount of padding in the
 * top left corner of a map container that shouldn't be accounted for when setting the
 * view to fit bounds. Useful if you have some control overlays on the map like a
 * sidebar and you don't want them to obscure objects you're zooming to.
 * @property {PointExpression} [paddingBottomRight=[0, 0]] The same for the bottom right
 * corner of the map.
 * @property {PointExpression} [padding=[0, 0]] Equivalent of setting both top left and
 * bottom right padding to the same value.
 */
/**
 * Options of `MaplairMap.fitBounds()` and similar methods.
 * @typedef {object} FitBoundsOptions
 * @property {number|null} [maxZoom=null] The maximum possible zoom to use.
 * @extends ZoomPanOptions, PaddingOptions
 */
/**
 * The central class of the API — it is used to create a map on a page and manipulate it.
 *
 * <h3 id="map-pane">Panes</h3>
 *
 * Panes are DOM elements used to control the ordering of layers on the map. You can
 * access panes with [`map.getPane`](#map-getpane) or [`map.getPanes`](#map-getpanes)
 * methods. New panes can be created with the [`map.createPane`](#map-createpane) method.
 *
 * Every map has the following default panes that differ only in zIndex.
 *
 * | Pane | zIndex | Description |
 * |---|---|---|
 * | `mapPane` | `'auto'` | Pane that contains all other map panes |
 * | `tilePane` | 200 | Pane for `GridLayer`s and `TileLayer`s |
 * | `overlayPane` | 400 | Pane for vectors (`Path`s, like `Polyline`s and `Polygon`s), `ImageOverlay`s and `VideoOverlay`s |
 * | `shadowPane` | 500 | Pane for overlay shadows (e.g. `Marker` shadows) |
 * | `markerPane` | 600 | Pane for `Icon`s of `Marker`s |
 * | `tooltipPane` | 650 | Pane for `Tooltip`s |
 * | `popupPane` | 700 | Pane for `Popup`s |
 *
 * **Map state change events**
 *
 * The map state change events `movestart`, `move`, `moveend`, `zoomstart`, `zoom`,
 * `zoomend` and `zoomanim` caused by the user (e.g. dragging, scrolling, pinching,
 * pressing a key or clicking a zoom button) have an `originalEvent` property with the
 * DOM event that started the change. It is `undefined` for changes made by code (e.g.
 * `setView()`), which allows to tell them apart, e.g. to avoid feedback loops when
 * synchronizing the view.
 *
 * @example
 * ```js
 * // initialize the map on the "map" div with a given center and zoom
 * const map = new MaplairMap('map', {
 * 	center: [51.505, -0.09],
 * 	zoom: 13
 * });
 * ```
 *
 * @fires resize {ResizeEvent} Fired when the map is resized.
 * @fires unload {MaplairEvent} Fired when the map is destroyed with [remove](#map-remove) method.
 * @fires viewprereset {MaplairEvent} Fired before the map resets its view (see `viewreset`).
 * @fires viewreset {MaplairEvent} Fired when the map needs to redraw its content (this
 * usually happens on map zoom or load). Very useful for creating custom overlays.
 * @fires load {MaplairEvent} Fired when the map is initialized (when its center and zoom
 * are set for the first time).
 * @fires zoomstart {MaplairEvent} Fired when the map zoom is about to change (e.g. before
 * zoom animation).
 * @fires movestart {MaplairEvent} Fired when the view of the map starts changing (e.g.
 * user starts dragging the map).
 * @fires zoom {MaplairEvent} Fired repeatedly during any change in zoom level, including
 * zoom and fly animations.
 * @fires move {MaplairEvent} Fired repeatedly during any movement of the map, including
 * pan and fly animations.
 * @fires zoomend {MaplairEvent} Fired when the map zoom changed, after any animations.
 * @fires moveend {MaplairEvent} Fired when the center of the map stops changing (e.g.
 * user stopped dragging the map or after non-centered zoom).
 * @fires idle {MaplairEvent} Fired when the map becomes idle: the view is not changing
 * (no dragging, panning or zooming, including their animations) and all layers have
 * finished loading (e.g. the tiles of tile layers, see `GridLayer.isLoading()`). Useful
 * e.g. for taking screenshots or for tests.
 * @fires locationerror {MaplairErrorEvent} Fired when geolocation (using the
 * [`locate`](#map-locate) method) failed.
 * @fires locationfound {LocationEvent} Fired when geolocation (using the
 * [`locate`](#map-locate) method) went successfully.
 * @fires click {MaplairPointerEvent} Fired when the user clicks (or taps) the map.
 * @fires dblclick {MaplairPointerEvent} Fired when the user double-clicks (or
 * double-taps) the map.
 * @fires pointerdown {MaplairPointerEvent} Fired when the user pushes the pointer on the map.
 * @fires pointerup {MaplairPointerEvent} Fired when the user releases the pointer on the map.
 * @fires pointerover {MaplairPointerEvent} Fired when the pointer enters the map.
 * @fires pointerout {MaplairPointerEvent} Fired when the pointer leaves the map.
 * @fires pointermove {MaplairPointerEvent} Fired while the pointer moves over the map.
 * @fires contextmenu {MaplairPointerEvent} Fired when the user pushes the right mouse
 * button on the map, prevents default browser context menu from showing if there are
 * listeners on this event. Also fired on mobile when the user holds a single touch for
 * a second (also called long press).
 * @fires preclick {MaplairPointerEvent} Fired before pointer click on the map (sometimes
 * useful when you want something to happen on click before any existing click handlers
 * start running).
 * @fires keypress {MaplairKeyboardEvent} Fired when the user presses a key from the
 * keyboard that produces a character value while the map is focused.
 * @fires keydown {MaplairKeyboardEvent} Fired when the user presses a key from the
 * keyboard while the map is focused. Unlike the `keypress` event, the `keydown` event is
 * fired for keys that produce a character value and for keys that do not produce a
 * character value.
 * @fires keyup {MaplairKeyboardEvent} Fired when the user releases a key from the
 * keyboard while the map is focused.
 * @fires crschange {CrsChangeEvent} Fired when the CRS of the map changes with
 * `setCrs()`, before the view is reset.
 * @fires pixelratiochange {MaplairEvent} Fired when the `devicePixelRatio` of the browser
 * changes, e.g. when moving the window to a screen with another resolution or when
 * zooming the page. Tile layers with `detectRetina` and canvas renderers adapt to it.
 * @fires zoomanim {ZoomAnimEvent} Fired at least once per zoom animation. For continuous
 * zoom, like pinch zooming, fired once per frame during zoom.
 */
export class MaplairMap extends Evented {
    /**
     * Instantiates a map object given the DOM ID of a `<div>` element or the element
     * itself, and optionally an object literal with `MaplairMap` options.
     * @param {string|HTMLElement} id The `<div>` element or its DOM ID.
     * @param {MaplairMapOptions} [options]
     */
    constructor(id: string | HTMLElement, options?: MaplairMapOptions);
    /**
     * Sets the view of the map (geographical center and zoom) with the given
     * animation options.
     * @group Methods for modifying map state
     * @param {LatLngExpression} center
     * @param {number} [zoom]
     * @param {ZoomPanOptions} [options]
     * @returns {this}
     */
    setView(center: LatLngExpression, zoom?: number, options?: ZoomPanOptions): this;
    /**
     * Sets the zoom of the map.
     * @group Methods for modifying map state
     * @param {number} zoom
     * @param {ZoomPanOptions} [options]
     * @returns {this}
     */
    setZoom(zoom: number, options?: ZoomPanOptions): this;
    /**
     * Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
     * @group Methods for modifying map state
     * @param {number} [delta]
     * @param {ZoomOptions} [options]
     * @returns {this}
     */
    zoomIn(delta?: number, options?: ZoomOptions): this;
    /**
     * Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
     * @group Methods for modifying map state
     * @param {number} [delta]
     * @param {ZoomOptions} [options]
     * @returns {this}
     */
    zoomOut(delta?: number, options?: ZoomOptions): this;
    /**
     * Zooms the map while keeping a specified geographical point on the map
     * stationary (e.g. used internally for scroll zoom and double-click zoom). Given a
     * `Point`, it keeps the specified pixel on the map (relative to the top-left corner)
     * stationary instead.
     * @group Methods for modifying map state
     * @param {LatLngExpression|Point} latlng The geographical point or the pixel offset.
     * @param {number} zoom
     * @param {ZoomOptions} [options]
     * @returns {this}
     */
    setZoomAround(latlng: LatLngExpression | Point, zoom: number, options?: ZoomOptions): this;
    /**
     * Sets a map view that contains the given geographical bounds with the
     * maximum zoom level possible.
     * @group Methods for modifying map state
     * @param {LatLngBoundsExpression} bounds
     * @param {FitBoundsOptions} [options]
     * @returns {this}
     */
    fitBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
    /**
     * Sets a map view that mostly contains the whole world with the maximum
     * zoom level possible.
     * @group Methods for modifying map state
     * @param {FitBoundsOptions} [options]
     * @returns {this}
     */
    fitWorld(options?: FitBoundsOptions): this;
    /**
     * Pans the map to a given center.
     * @group Methods for modifying map state
     * @param {LatLngExpression} center
     * @param {PanOptions} [options]
     * @returns {this}
     */
    panTo(center: LatLngExpression, options?: PanOptions): this;
    /**
     * Pans the map by a given number of pixels (animated).
     * @group Methods for modifying map state
     * @param {PointExpression} offset
     * @param {PanOptions} [options]
     * @returns {this}
     */
    panBy(offset: PointExpression, options?: PanOptions): this;
    /**
     * Sets the view of the map (geographical center and zoom) performing a smooth
     * pan-zoom animation.
     * @group Methods for modifying map state
     * @param {LatLngExpression} targetCenter
     * @param {number} [targetZoom]
     * @param {ZoomPanOptions} [options]
     * @returns {this}
     */
    flyTo(targetCenter: LatLngExpression, targetZoom?: number, options?: ZoomPanOptions): this;
    /**
     * Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
     * but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
     * @group Methods for modifying map state
     * @param {LatLngBoundsExpression} bounds
     * @param {FitBoundsOptions} [options]
     * @returns {this}
     */
    flyToBounds(bounds: LatLngBoundsExpression, options?: FitBoundsOptions): this;
    /**
     * Changes the [Coordinate Reference System](#crs) of the map, keeping its center
     * and (as far as possible with the zoom levels and `zoomSnap`) its scale at the
     * center. All layers are redrawn in the new CRS; note that tile layers only work
     * with the CRS their tiles were made for.
     * @group Methods for modifying map state
     * @param {CRS} crs
     * @returns {this}
     */
    setCrs(crs: CRS): this;
    /**
     * Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
     * @group Methods for modifying map state
     * @param {LatLngBoundsExpression} bounds
     * @returns {this}
     */
    setMaxBounds(bounds: LatLngBoundsExpression): this;
    /**
     * Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
     * @group Methods for modifying map state
     * @param {number} zoom
     * @returns {this}
     */
    setMinZoom(zoom: number): this;
    /**
     * Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
     * @group Methods for modifying map state
     * @param {number} zoom
     * @returns {this}
     */
    setMaxZoom(zoom: number): this;
    /**
     * Pans the map to the closest view that would lie inside the given bounds (if
     * it's not already), controlling the animation using the options specific, if any.
     * @group Methods for modifying map state
     * @param {LatLngBoundsExpression} bounds
     * @param {PanOptions} [options]
     * @returns {this}
     */
    panInsideBounds(bounds: LatLngBoundsExpression, options?: PanOptions): this;
    /**
     * Pans the map the minimum amount to make the `latlng` visible. Use
     * padding options to fit the display to more restricted bounds.
     * If `latlng` is already within the (optionally padded) display bounds,
     * the map will not be panned.
     * @group Methods for modifying map state
     * @param {LatLngExpression} latlng
     * @param {PaddingOptions & PanOptions} [options]
     * @returns {this}
     */
    panInside(latlng: LatLngExpression, options?: PaddingOptions & PanOptions): this;
    /**
     * Checks if the map container size changed and updates the map if so —
     * call it after you've changed the map size dynamically, also animating
     * pan by default. If `options.pan` is `false`, panning will not occur.
     * If `options.debounceMoveend` is `true`, it will delay `moveend` event so
     * that it doesn't happen often even if the method is called many
     * times in a row. Passing `true` instead of options animates the panning.
     * @group Methods for modifying map state
     * @param {InvalidateSizeOptions|boolean} [options]
     * @returns {this}
     */
    invalidateSize(options?: InvalidateSizeOptions | boolean): this;
    /**
     * Stops the currently running `panTo` or `flyTo` animation, if any.
     * @group Methods for modifying map state
     * @returns {this}
     */
    stop(): this;
    /**
     * Tries to locate the user using the Geolocation API, firing a
     * [`locationfound`](#map-locationfound) event with location data on success or a
     * [`locationerror`](#map-locationerror) event on failure, and optionally sets the map
     * view to the user's location with respect to detection accuracy (or to the world view
     * if geolocation failed).
     * Note that, if your page doesn't use HTTPS, this method will fail in
     * modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
     * See `LocateOptions` for more details.
     * @group Geolocation methods
     * @param {LocateOptions} [options]
     * @returns {this}
     */
    locate(options?: LocateOptions): this;
    /**
     * Stops watching location previously initiated by `map.locate({watch: true})`
     * and aborts resetting the map view if map.locate was called with
     * `{setView: true}`.
     * @group Geolocation methods
     * @returns {this}
     */
    stopLocate(): this;
    /**
     * Adds a new `Handler` to the map, given its name and constructor function.
     * @group Other methods
     * @param {string} name
     * @param {new (map: MaplairMap) => Handler} HandlerClass
     * @returns {this}
     */
    addHandler(name: string, HandlerClass: new (map: MaplairMap) => Handler): this;
    /**
     * Destroys the map and clears all related event listeners.
     * @group Other methods
     * @returns {this}
     */
    remove(): this;
    /**
     * Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
     * then returns it. The pane is created as a child of `container`, or
     * as a child of the main map pane if not set.
     * @group Other methods
     * @param {string} name
     * @param {HTMLElement} [container]
     * @returns {HTMLElement}
     */
    createPane(name: string, container?: HTMLElement): HTMLElement;
    /**
     * Returns the geographical center of the map view.
     * @group Methods for getting map state
     * @returns {LatLng}
     */
    getCenter(): LatLng;
    /**
     * Returns the current zoom level of the map view.
     * @group Methods for getting map state
     * @returns {number}
     */
    getZoom(): number;
    /**
     * Returns the geographical bounds visible in the current map view.
     * @group Methods for getting map state
     * @returns {LatLngBounds}
     */
    getBounds(): LatLngBounds;
    /**
     * Returns the minimum zoom level of the map (if set in the `minZoom` option of the
     * map or of any layers), or `0` by default.
     * @group Methods for getting map state
     * @returns {number}
     */
    getMinZoom(): number;
    /**
     * Returns the maximum zoom level of the map (if set in the `maxZoom` option of the
     * map or of any layers).
     * @group Methods for getting map state
     * @returns {number}
     */
    getMaxZoom(): number;
    /**
     * Returns the maximum zoom level on which the given bounds fit to the map
     * view in its entirety. If `inside` (optional) is set to `true`, the method
     * instead returns the minimum zoom level on which the map view fits into
     * the given bounds in its entirety.
     * @group Methods for getting map state
     * @param {LatLngBoundsExpression} bounds
     * @param {boolean} [inside]
     * @param {PointExpression} [padding]
     * @returns {number}
     */
    getBoundsZoom(bounds: LatLngBoundsExpression, inside?: boolean, padding?: PointExpression): number;
    /**
     * Returns the current size of the map container (in pixels).
     * @group Methods for getting map state
     * @returns {Point}
     */
    getSize(): Point;
    /**
     * Returns the bounds of the current map view in projected pixel
     * coordinates (sometimes useful in layer and overlay implementations).
     * If `center` and `zoom` is omitted, the map's current zoom level and center is used.
     * @group Methods for getting map state
     * @param {LatLngExpression} [center]
     * @param {number} [zoom]
     * @returns {Bounds}
     */
    getPixelBounds(center?: LatLngExpression, zoom?: number): Bounds;
    /**
     * Returns the projected pixel coordinates of the top left point of
     * the map layer (useful in custom layer and overlay implementations).
     * @group Methods for getting map state
     * @returns {Point}
     */
    getPixelOrigin(): Point;
    /**
     * Returns the world's bounds in pixel coordinates for zoom level `zoom`.
     * If `zoom` is omitted, the map's current zoom level is used.
     * @group Methods for getting map state
     * @param {number} [zoom]
     * @returns {Bounds|null} `null` for CRSs with infinite bounds.
     */
    getPixelWorldBounds(zoom?: number): Bounds | null;
    /**
     * Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
     * @group Other methods
     * @param {string|HTMLElement} pane
     * @returns {HTMLElement}
     */
    getPane(pane: string | HTMLElement): HTMLElement;
    /**
     * Returns a plain object containing the names of all [panes](#map-pane) as keys and
     * the panes as values.
     * @group Other methods
     * @returns {Record<string, HTMLElement>}
     */
    getPanes(): Record<string, HTMLElement>;
    /**
     * Returns the HTML element that contains the map.
     * @group Other methods
     * @returns {HTMLElement}
     */
    getContainer(): HTMLElement;
    /**
     * Returns the scale factor to be applied to a map transition from zoom level
     * `fromZoom` to `toZoom`. Used internally to help with zoom animations.
     * @group Conversion methods
     * @param {number} toZoom
     * @param {number} [fromZoom]
     * @returns {number}
     */
    getZoomScale(toZoom: number, fromZoom?: number): number;
    /**
     * Returns the zoom level that the map would end up at, if it is at `fromZoom`
     * level and everything is scaled by a factor of `scale`. Inverse of
     * [`getZoomScale`](#map-getZoomScale).
     * @group Conversion methods
     * @param {number} scale
     * @param {number} [fromZoom]
     * @returns {number}
     */
    getScaleZoom(scale: number, fromZoom?: number): number;
    /**
     * Projects a geographical coordinate `LatLng` according to the projection
     * of the map's CRS, then scales it according to `zoom` and the CRS's
     * `Transformation`. The result is pixel coordinate relative to
     * the CRS origin.
     * @group Conversion methods
     * @param {LatLngExpression} latlng
     * @param {number} [zoom]
     * @returns {Point}
     */
    project(latlng: LatLngExpression, zoom?: number): Point;
    /**
     * Inverse of [`project`](#map-project).
     * @group Conversion methods
     * @param {PointExpression} point
     * @param {number} [zoom]
     * @returns {LatLng}
     */
    unproject(point: PointExpression, zoom?: number): LatLng;
    /**
     * Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
     * returns the corresponding geographical coordinate (for the current zoom level).
     * @group Conversion methods
     * @param {PointExpression} point
     * @returns {LatLng}
     */
    layerPointToLatLng(point: PointExpression): LatLng;
    /**
     * Given a geographical coordinate, returns the corresponding pixel coordinate
     * relative to the [origin pixel](#map-getpixelorigin).
     * @group Conversion methods
     * @param {LatLngExpression} latlng
     * @returns {Point}
     */
    latLngToLayerPoint(latlng: LatLngExpression): Point;
    /**
     * Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
     * map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
     * CRS's bounds.
     * By default this means longitude is wrapped around the dateline so its
     * value is between -180 and +180 degrees.
     * @group Conversion methods
     * @param {LatLngExpression} latlng
     * @returns {LatLng}
     */
    wrapLatLng(latlng: LatLngExpression): LatLng;
    /**
     * Returns a `LatLngBounds` with the same size as the given one, ensuring that
     * its center is within the CRS's bounds.
     * By default this means the center longitude is wrapped around the dateline so its
     * value is between -180 and +180 degrees, and the majority of the bounds
     * overlaps the CRS's bounds.
     * @group Conversion methods
     * @param {LatLngBoundsExpression} bounds
     * @returns {LatLngBounds}
     */
    wrapLatLngBounds(bounds: LatLngBoundsExpression): LatLngBounds;
    /**
     * Returns the distance between two geographical coordinates according to
     * the map's CRS. By default this measures distance in meters.
     * @group Conversion methods
     * @param {LatLngExpression} latlng1
     * @param {LatLngExpression} latlng2
     * @returns {number}
     */
    distance(latlng1: LatLngExpression, latlng2: LatLngExpression): number;
    /**
     * Given a pixel coordinate relative to the map container, returns the corresponding
     * pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
     * @group Conversion methods
     * @param {PointExpression} point
     * @returns {Point}
     */
    containerPointToLayerPoint(point: PointExpression): Point;
    /**
     * Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
     * returns the corresponding pixel coordinate relative to the map container.
     * @group Conversion methods
     * @param {PointExpression} point
     * @returns {Point}
     */
    layerPointToContainerPoint(point: PointExpression): Point;
    /**
     * Given a pixel coordinate relative to the map container, returns
     * the corresponding geographical coordinate (for the current zoom level).
     * @group Conversion methods
     * @param {PointExpression} point
     * @returns {LatLng}
     */
    containerPointToLatLng(point: PointExpression): LatLng;
    /**
     * Given a geographical coordinate, returns the corresponding pixel coordinate
     * relative to the map container.
     * @group Conversion methods
     * @param {LatLngExpression} latlng
     * @returns {Point}
     */
    latLngToContainerPoint(latlng: LatLngExpression): Point;
    /**
     * Given a PointerEvent object, returns the pixel coordinate relative to the
     * map container where the event took place.
     * @group Conversion methods
     * @param {MouseEvent|PointerEvent} e
     * @returns {Point}
     */
    pointerEventToContainerPoint(e: MouseEvent | PointerEvent): Point;
    /**
     * Given a PointerEvent object, returns the pixel coordinate relative to
     * the [origin pixel](#map-getpixelorigin) where the event took place.
     * @group Conversion methods
     * @param {MouseEvent|PointerEvent} e
     * @returns {Point}
     */
    pointerEventToLayerPoint(e: MouseEvent | PointerEvent): Point;
    /**
     * Given a PointerEvent object, returns geographical coordinate where the
     * event took place.
     * @group Conversion methods
     * @param {MouseEvent|PointerEvent} e
     * @returns {LatLng}
     */
    pointerEventToLatLng(e: MouseEvent | PointerEvent): LatLng;
    /**
     * Fires an event of the specified type, see `Evented.fire()`. The map state change
     * events caused by the user get an `originalEvent` property (see the class
     * description).
     * @param {string} type
     * @param {object} [data]
     * @param {boolean} [propagate]
     * @returns {this}
     */
    fire(type: string, data?: object, propagate?: boolean): this;
    /**
     * Runs the given function `callback` when the map gets initialized with
     * a view (center and zoom) and at least one layer, or immediately
     * if it's already initialized, optionally passing a function context.
     * @group Other methods
     * @param {(event: {target: MaplairMap}) => void} callback
     * @param {object} [context]
     * @returns {this}
     */
    whenReady(callback: (event: {
        target: MaplairMap;
    }) => void, context?: object): this;
    /** The options of the MaplairMap, see [the options](#maplairmapoptions). */
    options: MaplairMapOptions;
}
export const Map: typeof MaplairMap;
/**
 * Options of `MaplairMap`.
 */
export interface MaplairMapOptions {
    /**
     * The [Coordinate Reference System](#crs) to use.
     * Don't change this if you're not sure what it means.
     * @default EPSG3857
     */
    crs?: CRS;
    /**
     * Initial geographic center of the map.
     */
    center?: LatLngExpression;
    /**
     * Initial map zoom level.
     */
    zoom?: number;
    /**
     * Minimum zoom level of the map. If not specified and at
     * least one `GridLayer` or `TileLayer` is in the map, the lowest of their `minZoom`
     * options will be used instead.
     */
    minZoom?: number;
    /**
     * Maximum zoom level of the map. If not specified and at
     * least one `GridLayer` or `TileLayer` is in the map, the highest of their `maxZoom`
     * options will be used instead.
     */
    maxZoom?: number;
    /**
     * Array of layers that will be added to the map initially.
     * @default []
     */
    layers?: Layer[];
    /**
     * The accessible name of the map, announced by screen
     * readers, `'Map'` by default. The map container gets the ARIA role `region` with this
     * label, unless it already has a role or label. The default is translated, see `I18n`.
     */
    ariaLabel?: string;
    /**
     * When this option is set, the map
     * restricts the view to the given geographical bounds, bouncing the user back if the
     * user tries to pan outside the view. To set the restriction dynamically, use
     * [`setMaxBounds`](#map-setmaxbounds) method.
     */
    maxBounds?: LatLngBoundsExpression;
    /**
     * The default method for drawing vector layers on the
     * map. `SVG` or `Canvas` by default depending on browser support.
     */
    renderer?: Renderer;
    /**
     * Whether the map zoom animation is enabled.
     * Animations are enabled by default unless the user has configured their browser for
     * reduced [motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences).
     */
    zoomAnimation?: boolean;
    /**
     * Won't animate zoom if the zoom
     * difference exceeds this value.
     * @default 4
     */
    zoomAnimationThreshold?: number;
    /**
     * Whether zoom animations (e.g. of the zoom
     * control, double click and keyboard) change the view frame by frame through fractional
     * zoom levels, like `flyTo()` and pinch zoom, instead of scaling the map with a CSS
     * transition between two zoom levels. Also makes the scroll wheel zoom smoothly with
     * each wheel event (see `scrollWheelZoom`), snapping to `zoomSnap` when scrolling ends.
     * @default false
     */
    continuousZoom?: boolean;
    /**
     * Whether the tile fade animation is enabled.
     * Animations are enabled by default unless the user has configured their browser for
     * reduced [motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences).
     */
    fadeAnimation?: boolean;
    /**
     * Whether markers animate their zoom
     * with the zoom animation, if disabled they will disappear for the length of the
     * animation.
     * @default true
     */
    markerZoomAnimation?: boolean;
    /**
     * Whether markers far outside of the map view
     * (more than half a view away) are taken off the page until the map is moved closer to
     * them. This reduces the browser's rendering work, and the work of repositioning
     * markers while zooming, when a map has many markers (e.g. several thousands) of which
     * only some are visible at a time.
     * @default false
     */
    markerCulling?: boolean;
    /**
     * Defines the maximum size of a CSS
     * translation transform (2^23). The default value should not be changed unless a web
     * browser positions layers in the wrong place after doing a large `panBy`.
     * @default 8388608
     */
    transform3DLimit?: number;
    /**
     * Forces the map's zoom level to always be a multiple
     * of this, particularly right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
     * By default, the zoom level snaps to the nearest integer; lower values (e.g. `0.5` or
     * `0.1`) allow for greater granularity. A value of `0` means the zoom level will not be
     * snapped after `fitBounds` or a pinch-zoom.
     * @default 1
     */
    zoomSnap?: number;
    /**
     * Controls how much the map's zoom level will change
     * after a [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+` or `-`
     * on the keyboard, or using the [zoom controls](#control-zoom). Values smaller than `1`
     * (e.g. `0.5`) allow for greater granularity.
     * @default 1
     */
    zoomDelta?: number;
    /**
     * Whether the map automatically handles browser
     * window resize to update itself. A hidden map (with the size 0, e.g. `display: none`
     * in an inactive tab) keeps its size, view and bounds until it is shown again.
     * @default true
     */
    trackResize?: boolean;
}
/**
 * Options of the geolocation methods of `MaplairMap`, e.g. `locate()`.
 */
export interface LocateOptions {
    /**
     * If `true`, starts continuous watching of location
     * changes (instead of detecting it once) using W3C `watchPosition` method. You can
     * later stop watching using `map.stopLocate()` method.
     * @default false
     */
    watch?: boolean;
    /**
     * If `true`, automatically sets the map view to the
     * user location with respect to detection accuracy, or to world view if geolocation
     * failed.
     * @default false
     */
    setView?: boolean;
    /**
     * The maximum zoom for automatic view setting
     * when using `setView` option.
     * @default Infinity
     */
    maxZoom?: number;
    /**
     * Number of milliseconds to wait for a response from
     * geolocation before firing a `locationerror` event.
     * @default 10000
     */
    timeout?: number;
    /**
     * Maximum age of detected location. If less than this
     * amount of milliseconds passed since last geolocation response, `locate` will return
     * a cached location.
     * @default 0
     */
    maximumAge?: number;
    /**
     * Enables high accuracy, see
     * [description in the W3C spec](https://w3c.github.io/geolocation-api/#enablehighaccuracy-member).
     * @default false
     */
    enableHighAccuracy?: boolean;
}
/**
 * Options of the `MaplairMap` methods which modify the zoom level.
 */
export interface ZoomOptions {
    /**
     * If not specified, zoom animation will happen if the
     * zoom origin is inside the current view. If `true`, the map will attempt animating
     * zoom disregarding where zoom origin is. Setting `false` will make it always reset the
     * view completely without animation.
     */
    animate?: boolean;
}
/**
 * Options of the `MaplairMap` methods which modify the center of the map.
 */
export interface PanOptions {
    /**
     * If `true`, panning will always be animated if possible.
     * If `false`, it will not animate panning, either resetting the map view if panning
     * more than a screen away, or just setting a new offset for the map pane (except for
     * `panBy` which always does the latter).
     */
    animate?: boolean;
    /**
     * Duration of animated panning, in seconds.
     * @default 0.25
     */
    duration?: number;
    /**
     * The curvature factor of panning animation
     * easing (third parameter of the [Cubic Bezier curve](https://cubic-bezier.com/)).
     * 1.0 means linear animation, and the smaller this number, the more bowed the curve.
     * @default 0.25
     */
    easeLinearity?: number;
    /**
     * If `true`, panning won't fire `movestart`
     * event on start (used internally for panning inertia).
     * @default false
     */
    noMoveStart?: boolean;
}
/**
 * Options of the `MaplairMap` methods which modify the zoom level and the center.
 */
export interface ZoomPanOptions extends ZoomOptions, PanOptions {
}
/**
 * Options of `MaplairMap.invalidateSize()`.
 */
export interface InvalidateSizeOptions extends ZoomPanOptions {
    /**
     * If `false`, panning will not occur.
     * @default true
     */
    pan?: boolean;
    /**
     * If `true`, it will delay `moveend` event
     * so that it doesn't happen often even if the method is called many times in a row.
     * @default false
     */
    debounceMoveend?: boolean;
}
/**
 * Padding options of `MaplairMap` methods, e.g. `panInside()`.
 */
export interface PaddingOptions {
    /**
     * Sets the amount of padding in the
     * top left corner of a map container that shouldn't be accounted for when setting the
     * view to fit bounds. Useful if you have some control overlays on the map like a
     * sidebar and you don't want them to obscure objects you're zooming to.
     * @default [0, 0]
     */
    paddingTopLeft?: PointExpression;
    /**
     * The same for the bottom right
     * corner of the map.
     * @default [0, 0]
     */
    paddingBottomRight?: PointExpression;
    /**
     * Equivalent of setting both top left and
     * bottom right padding to the same value.
     * @default [0, 0]
     */
    padding?: PointExpression;
}
/**
 * Options of `MaplairMap.fitBounds()` and similar methods.
 */
export interface FitBoundsOptions extends ZoomPanOptions, PaddingOptions {
    /**
     * The maximum possible zoom to use.
     * @default null
     */
    maxZoom?: number|null;
}
import { Evented } from '../core/Events.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import { Point } from '../geometry/Point.js';
import type { LatLngBoundsExpression } from '../geo/LatLngBounds.js';
import type { PointExpression } from '../geometry/Point.js';
import { PosAnimation } from '../dom/PosAnimation.js';
import type { CRS } from '../geo/crs/CRS.js';
import type { Handler } from '../core/Handler.js';
import { LatLng } from '../geo/LatLng.js';
import { LatLngBounds } from '../geo/LatLngBounds.js';
import { Bounds } from '../geometry/Bounds.js';
import { Layer } from '../layer/Layer.js';
import type { Renderer } from '../layer/vector/Renderer.js';
