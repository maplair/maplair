import * as Util from '../core/Util.js';
import {Evented} from '../core/Events.js';
import {EPSG3857} from '../geo/crs/EPSG3857.js';
import {Point} from '../geometry/Point.js';
import {Bounds} from '../geometry/Bounds.js';
import {LatLng} from '../geo/LatLng.js';
import {LatLngBounds} from '../geo/LatLngBounds.js';
import Browser from '../core/Browser.js';
import * as DomEvent from '../dom/DomEvent.js';
import * as DomUtil from '../dom/DomUtil.js';
import {PosAnimation} from '../dom/PosAnimation.js';
import {I18n} from '../core/I18n.js';
import * as PointerEvents from '../dom/DomEvent.PointerEvents.js';
import {Control} from '../control/Control.js';
import {AttributionControl} from '../control/AttributionControl.js';
import {ZoomControl} from '../control/ZoomControl.js';
import {FullscreenControl} from '../control/FullscreenControl.js';
import {Layer} from '../layer/Layer.js';
import {DivOverlay} from '../layer/DivOverlay.js';
import {Popup} from '../layer/Popup.js';
import {Tooltip} from '../layer/Tooltip.js';
import * as RendererSupport from '../layer/vector/Renderer.getRenderer.js';
import {BoxZoomHandler} from './handler/BoxZoomHandler.js';
import {DoubleClickZoomHandler} from './handler/DoubleClickZoomHandler.js';
import {DragHandler} from './handler/DragHandler.js';
import {KeyboardHandler} from './handler/KeyboardHandler.js';
import {PinchZoomHandler} from './handler/PinchZoomHandler.js';
import {ScrollWheelZoomHandler} from './handler/ScrollWheelZoomHandler.js';
import {TapHoldHandler} from './handler/TapHoldHandler.js';
import {TapDragZoomHandler} from './handler/TapDragZoomHandler.js';

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

	static {
		this.setDefaultOptions({
			crs: EPSG3857,
			center: undefined,
			zoom: undefined,
			minZoom: undefined,
			maxZoom: undefined,
			layers: [],
			ariaLabel: undefined,
			maxBounds: undefined,
			renderer: undefined,

			zoomAnimation: !Browser.reducedMotion,
			zoomAnimationThreshold: 4,
			continuousZoom: false,
			fadeAnimation: !Browser.reducedMotion,
			markerZoomAnimation: true,
			markerCulling: false,
			transform3DLimit: 8388608, // Precision limit of a 32-bit float

			zoomSnap: 1,
			zoomDelta: 1,
			trackResize: true
		});
	}

	/**
	 * Instantiates a map object given the DOM ID of a `<div>` element or the element
	 * itself, and optionally an object literal with `MaplairMap` options.
	 * @param {string|HTMLElement} id The `<div>` element or its DOM ID.
	 * @param {MaplairMapOptions} [options]
	 */
	constructor(id, options) {
		super();
		options = Util.setOptions(this, options);

		// Make sure to assign internal flags at the beginning,
		// to avoid inconsistent state in some edge cases.
		this._handlers = [];
		this._layers = {};
		this._zoomBoundLayers = {};
		this._sizeChanged = true;

		this._initContainer(id);
		this._initLayout();

		this._initEvents();

		this._watchPixelRatio();

		this.on({
			movestart: this._onBusy,
			zoomstart: this._onBusy,
			moveend: this._onViewChanged,
			layerremove: this._scheduleIdleCheck
		}, this);

		if (options.maxBounds) {
			this.setMaxBounds(options.maxBounds);
		}

		if (options.zoom !== undefined) {
			this._zoom = this._limitZoom(options.zoom);
		}

		if (options.center && options.zoom !== undefined) {
			this.setView(LatLng.from(options.center), options.zoom, {reset: true});
		}

		this.callInitHooks(MaplairMap);

		this._zoomAnimated = this.options.zoomAnimation;

		// zoom transitions run with the same duration for all layers, so if one of transitionend events
		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
		if (this._zoomAnimated) {
			this._createAnimProxy();
		}

		this._addLayers(this.options.layers);
	}

	/**
	 * Sets the view of the map (geographical center and zoom) with the given
	 * animation options.
	 * @group Methods for modifying map state
	 * @param {LatLngExpression} center
	 * @param {number} [zoom]
	 * @param {ZoomPanOptions} [options]
	 * @returns {this}
	 */
	setView(center, zoom, options) {

		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(new LatLng(center), zoom, this.options.maxBounds);
		options ??= {};

		this._stop();

		if (this._loaded && !options.reset && options !== true) {

			if (options.animate !== undefined) {
				options.zoom = {animate: options.animate, ...options.zoom};
				options.pan = {animate: options.animate, duration: options.duration, ...options.pan};
			}

			// try animating pan or zoom
			const moved = (this._zoom !== zoom) ?
				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
				this._tryAnimatedPan(center, options.pan);

			if (moved) {
				// prevent resize handler call, the view will refresh after animation anyway
				clearTimeout(this._sizeTimer);
				return this;
			}
		}

		// animation didn't start, just reset the map view
		this._resetView(center, zoom, options.pan?.noMoveStart);

		return this;
	}

	/**
	 * Sets the zoom of the map.
	 * @group Methods for modifying map state
	 * @param {number} zoom
	 * @param {ZoomPanOptions} [options]
	 * @returns {this}
	 */
	setZoom(zoom, options) {
		if (!this._loaded) {
			this._zoom = zoom;
			return this;
		}
		return this.setView(this.getCenter(), zoom, {zoom: options});
	}

	/**
	 * Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
	 * @group Methods for modifying map state
	 * @param {number} [delta]
	 * @param {ZoomOptions} [options]
	 * @returns {this}
	 */
	zoomIn(delta, options) {
		delta ??= this.options.zoomDelta;
		return this.setZoom(this._zoom + delta, options);
	}

	/**
	 * Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
	 * @group Methods for modifying map state
	 * @param {number} [delta]
	 * @param {ZoomOptions} [options]
	 * @returns {this}
	 */
	zoomOut(delta, options) {
		delta ??= this.options.zoomDelta;
		return this.setZoom(this._zoom - delta, options);
	}

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
	setZoomAround(latlng, zoom, options) {
		const scale = this.getZoomScale(zoom),
		viewHalf = this.getSize().divideBy(2),
		containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng),

		centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
		newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

		return this.setView(newCenter, zoom, {zoom: options});
	}

	_getBoundsCenterZoom(bounds, options) {

		options ??= {};
		bounds = bounds.getBounds ? bounds.getBounds() : LatLngBounds.from(bounds);

		const paddingTL = Point.from(options.paddingTopLeft || options.padding || [0, 0]),
		paddingBR = Point.from(options.paddingBottomRight || options.padding || [0, 0]);

		let zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));

		zoom = (typeof options.maxZoom === 'number') ? Math.min(options.maxZoom, zoom) : zoom;

		if (zoom === Infinity) {
			return {
				center: bounds.getCenter(),
				zoom
			};
		}

		const paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

		swPoint = this.project(bounds.getSouthWest(), zoom),
		nePoint = this.project(bounds.getNorthEast(), zoom),
		center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

		return {
			center,
			zoom
		};
	}

	/**
	 * Sets a map view that contains the given geographical bounds with the
	 * maximum zoom level possible.
	 * @group Methods for modifying map state
	 * @param {LatLngBoundsExpression} bounds
	 * @param {FitBoundsOptions} [options]
	 * @returns {this}
	 */
	fitBounds(bounds, options) {

		bounds = LatLngBounds.from(bounds);

		if (!bounds.isValid()) {
			throw new Error('Bounds are not valid.');
		}

		const target = this._getBoundsCenterZoom(bounds, options);
		return this.setView(target.center, target.zoom, options);
	}

	/**
	 * Sets a map view that mostly contains the whole world with the maximum
	 * zoom level possible.
	 * @group Methods for modifying map state
	 * @param {FitBoundsOptions} [options]
	 * @returns {this}
	 */
	fitWorld(options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	}

	/**
	 * Pans the map to a given center.
	 * @group Methods for modifying map state
	 * @param {LatLngExpression} center
	 * @param {PanOptions} [options]
	 * @returns {this}
	 */
	panTo(center, options) {
		return this.setView(center, this._zoom, {pan: options});
	}

	/**
	 * Pans the map by a given number of pixels (animated).
	 * @group Methods for modifying map state
	 * @param {PointExpression} offset
	 * @param {PanOptions} [options]
	 * @returns {this}
	 */
	panBy(offset, options) {
		offset = Point.from(offset).round();
		options ??= {};

		if (!offset.x && !offset.y) {
			return this.fire('moveend');
		}
		// If we pan too far, Chrome gets issues with tiles
		// and makes them disappear or appear in the wrong place (slightly offset) #2602
		if (options.animate !== true && !this.getSize().contains(offset)) {
			this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
			return this;
		}

		if (!this._panAnim) {
			this._panAnim = new PosAnimation();

			this._panAnim.on({
				'step': this._onPanTransitionStep,
				'end': this._onPanTransitionEnd
			}, this);
		}

		// don't fire movestart if animating inertia
		if (!options.noMoveStart) {
			this.fire('movestart');
		}

		// animate pan unless browser prefers reduced motion or animate: false specified
		if (!Browser.reducedMotion && options.animate !== false) {
			this._mapPane.classList.add('maplair-pan-anim');

			const newPos = this._getMapPanePos().subtract(offset).round();
			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this.fire('move').fire('moveend');
		}

		return this;
	}

	/**
	 * Sets the view of the map (geographical center and zoom) performing a smooth
	 * pan-zoom animation.
	 * @group Methods for modifying map state
	 * @param {LatLngExpression} targetCenter
	 * @param {number} [targetZoom]
	 * @param {ZoomPanOptions} [options]
	 * @returns {this}
	 */
	flyTo(targetCenter, targetZoom, options) {

		options ??= {};
		if (Browser.reducedMotion || options.animate === false) {
			return this.setView(targetCenter, targetZoom, options);
		}

		this._stop();

		const from = this.project(this.getCenter()),
		to = this.project(targetCenter),
		size = this.getSize(),
		startZoom = this._zoom;

		targetCenter = new LatLng(targetCenter);
		targetZoom = targetZoom === undefined ? startZoom : this._limitZoom(targetZoom);

		const w0 = Math.max(size.x, size.y),
		w1 = w0 * this.getZoomScale(startZoom, targetZoom),
		u1 = (to.distanceTo(from)) || 1,
		rho = 1.42,
		rho2 = rho * rho;

		function r(i) {
			const s1 = i ? -1 : 1,
			s2 = i ? w1 : w0,
			t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
			b1 = 2 * s2 * rho2 * u1,
			b = t1 / b1,
			sq = Math.sqrt(b * b + 1) - b;

			// workaround for floating point precision bug when sq = 0, log = -Infinite,
			// thus triggering an infinite loop in flyTo
			const log = sq < 0.000000015 ? -18 : Math.log(sq);

			return log;
		}

		function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
		function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
		function tanh(n) { return sinh(n) / cosh(n); }

		const r0 = r(0);

		function w(s) { return w0 * (cosh(r0) / cosh(r0 + rho * s)); }
		function u(s) { return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2; }

		function easeOut(t) { return 1 - (1 - t) ** 1.5; }

		const start = Date.now(),
		S = (r(1) - r0) / rho,
		duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

		const frame = () => {
			const t = (Date.now() - start) / duration,
			s = easeOut(t) * S;

			if (t <= 1) {
				this._flyToFrame = requestAnimationFrame(frame);

				this._move(
					this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
					this.getScaleZoom(w0 / w(s), startZoom),
					{flyTo: true});

			} else {
				this
					._move(targetCenter, targetZoom)
					._moveEnd(true);
			}
		};

		this._moveStart(true, options.noMoveStart);

		frame(this);
		return this;
	}

	/**
	 * Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
	 * but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
	 * @group Methods for modifying map state
	 * @param {LatLngBoundsExpression} bounds
	 * @param {FitBoundsOptions} [options]
	 * @returns {this}
	 */
	flyToBounds(bounds, options) {
		const target = this._getBoundsCenterZoom(bounds, options);
		return this.flyTo(target.center, target.zoom, options);
	}

	/**
	 * Changes the [Coordinate Reference System](#crs) of the map, keeping its center
	 * and (as far as possible with the zoom levels and `zoomSnap`) its scale at the
	 * center. All layers are redrawn in the new CRS; note that tile layers only work
	 * with the CRS their tiles were made for.
	 * @group Methods for modifying map state
	 * @param {CRS} crs
	 * @returns {this}
	 */
	setCrs(crs) {
		const oldCrs = this.options.crs;
		if (crs === oldCrs) { return this; }

		if (!this._loaded) {
			this.options.crs = crs;
			this.fire('crschange', {oldCrs, crs});
			return this;
		}

		this._stop();
		const center = this.getCenter(),
		resolution = this._getResolution(center);

		this.options.crs = crs;

		// the zoom with the same distance per pixel at the center
		const zoom = this._limitZoom(crs.zoom(crs.scale(this._zoom) * this._getResolution(center) / resolution));

		this.fire('crschange', {oldCrs, crs});

		this._resetView(center, zoom);
		return this;
	}

	// The distance per pixel at `latlng` at the current zoom, in the units of the CRS.
	_getResolution(latlng) {
		const crs = this.options.crs,
		point = crs.latLngToPoint(latlng, this._zoom);
		return crs.distance(latlng, crs.pointToLatLng(point.add([1, 0]), this._zoom));
	}

	/**
	 * Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
	 * @group Methods for modifying map state
	 * @param {LatLngBoundsExpression} bounds
	 * @returns {this}
	 */
	setMaxBounds(bounds) {
		bounds = new LatLngBounds(bounds);

		if (this.listens('moveend', this._panInsideMaxBounds)) {
			this.off('moveend', this._panInsideMaxBounds);
		}

		if (!bounds.isValid()) {
			this.options.maxBounds = null;
			return this;
		}

		this.options.maxBounds = bounds;

		if (this._loaded) {
			this._panInsideMaxBounds();
		}

		return this.on('moveend', this._panInsideMaxBounds);
	}

	/**
	 * Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
	 * @group Methods for modifying map state
	 * @param {number} zoom
	 * @returns {this}
	 */
	setMinZoom(zoom) {
		const oldZoom = this.options.minZoom;
		this.options.minZoom = zoom;

		if (this._loaded && oldZoom !== zoom) {
			this.fire('zoomlevelschange');

			if (this.getZoom() < this.options.minZoom) {
				return this.setZoom(zoom);
			}
		}

		return this;
	}

	/**
	 * Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
	 * @group Methods for modifying map state
	 * @param {number} zoom
	 * @returns {this}
	 */
	setMaxZoom(zoom) {
		const oldZoom = this.options.maxZoom;
		this.options.maxZoom = zoom;

		if (this._loaded && oldZoom !== zoom) {
			this.fire('zoomlevelschange');

			if (this.getZoom() > this.options.maxZoom) {
				return this.setZoom(zoom);
			}
		}

		return this;
	}

	/**
	 * Pans the map to the closest view that would lie inside the given bounds (if
	 * it's not already), controlling the animation using the options specific, if any.
	 * @group Methods for modifying map state
	 * @param {LatLngBoundsExpression} bounds
	 * @param {PanOptions} [options]
	 * @returns {this}
	 */
	panInsideBounds(bounds, options) {
		this._enforcingBounds = true;
		const center = this.getCenter(),
		newCenter = this._limitCenter(center, this._zoom, LatLngBounds.from(bounds));

		if (!center.equals(newCenter)) {
			this.panTo(newCenter, options);
		}

		this._enforcingBounds = false;
		return this;
	}

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
	panInside(latlng, options) {
		options ??= {};

		const paddingTL = Point.from(options.paddingTopLeft || options.padding || [0, 0]),
		paddingBR = Point.from(options.paddingBottomRight || options.padding || [0, 0]),
		pixelCenter = this.project(this.getCenter()),
		pixelPoint = this.project(latlng),
		pixelBounds = this.getPixelBounds(),
		paddedBounds = new Bounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]),
		paddedSize = paddedBounds.getSize();

		if (!paddedBounds.contains(pixelPoint)) {
			this._enforcingBounds = true;
			const centerOffset = pixelPoint.subtract(paddedBounds.getCenter());
			const offset = paddedBounds.extend(pixelPoint).getSize().subtract(paddedSize);
			pixelCenter.x += centerOffset.x < 0 ? -offset.x : offset.x;
			pixelCenter.y += centerOffset.y < 0 ? -offset.y : offset.y;
			this.panTo(this.unproject(pixelCenter), options);
			this._enforcingBounds = false;
		}
		return this;
	}

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
	invalidateSize(options) {
		if (!this._loaded) { return this; }

		options = {
			animate: false,
			pan: true,
			...(options === true ? {animate: true} : options)
		};

		const oldSize = this.getSize();
		this._sizeChanged = true;
		this._lastCenter = null;

		const newSize = this.getSize(),
		oldCenter = oldSize.divideBy(2).round(),
		newCenter = newSize.divideBy(2).round(),
		offset = oldCenter.subtract(newCenter);

		if (!offset.x && !offset.y) { return this; }

		if (options.animate && options.pan) {
			this.panBy(offset);

		} else {
			if (options.pan) {
				this._rawPanBy(offset);
			}

			this.fire('move');

			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(this.fire.bind(this, 'moveend'), 200);
			} else {
				this.fire('moveend');
			}
		}

		return this.fire('resize', {
			oldSize,
			newSize
		});
	}

	/**
	 * Stops the currently running `panTo` or `flyTo` animation, if any.
	 * @group Methods for modifying map state
	 * @returns {this}
	 */
	stop() {
		this.setZoom(this._limitZoom(this._zoom));
		if (!this.options.zoomSnap) {
			this.fire('viewreset');
		}
		return this._stop();
	}

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
	locate(options) {

		options = this._locateOptions = {
			timeout: 10000,
			watch: false,
			// setView: false
			// maxZoom: <Number>
			// maximumAge: 0
			// enableHighAccuracy: false
			...options
		};

		if (!('geolocation' in navigator)) {
			this._handleGeolocationError({
				code: 0,
				message: 'Geolocation not supported.'
			});
			return this;
		}

		const onResponse = this._handleGeolocationResponse.bind(this),
		onError = this._handleGeolocationError.bind(this);

		if (options.watch) {
			if (this._locationWatchId !== undefined) {
				navigator.geolocation.clearWatch(this._locationWatchId);
			}
			this._locationWatchId = navigator.geolocation.watchPosition(onResponse, onError, options);
		} else {
			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		}
		return this;
	}

	/**
	 * Stops watching location previously initiated by `map.locate({watch: true})`
	 * and aborts resetting the map view if map.locate was called with
	 * `{setView: true}`.
	 * @group Geolocation methods
	 * @returns {this}
	 */
	stopLocate() {
		navigator.geolocation?.clearWatch?.(this._locationWatchId);
		if (this._locateOptions) {
			this._locateOptions.setView = false;
		}
		return this;
	}

	_handleGeolocationError(error) {
		if (!this._container._maplair_id) { return; }

		const c = error.code,
		message = error.message ||
		            (c === 1 ? 'permission denied' :
		            (c === 2 ? 'position unavailable' : 'timeout'));

		if (this._locateOptions.setView && !this._loaded) {
			this.fitWorld();
		}

		this.fire('locationerror', {
			code: c,
			message: `Geolocation error: ${message}.`
		});
	}

	_handleGeolocationResponse(pos) {
		if (!this._container._maplair_id) { return; }

		const lat = pos.coords.latitude,
		lng = pos.coords.longitude,
		latlng = new LatLng(lat, lng),
		bounds = latlng.toBounds(pos.coords.accuracy * 2),
		options = this._locateOptions;

		if (options.setView) {
			const zoom = this.getBoundsZoom(bounds);
			this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
		}

		const data = {
			latlng,
			bounds,
			timestamp: pos.timestamp
		};

		for (const i in pos.coords) { // do not use Object.keys here to access getters of GeolocationCoordinates
			if (typeof pos.coords[i] === 'number') {
				data[i] = pos.coords[i];
			}
		}

		this.fire('locationfound', data);
	}

	/**
	 * Adds a new `Handler` to the map, given its name and constructor function.
	 * @group Other methods
	 * @param {string} name
	 * @param {new (map: MaplairMap) => Handler} HandlerClass
	 * @returns {this}
	 */
	addHandler(name, HandlerClass) {
		if (!HandlerClass) { return this; }

		const handler = this[name] = new HandlerClass(this);

		this._handlers.push(handler);

		if (this.options[name]) {
			handler.enable();
		}

		return this;
	}

	/**
	 * Destroys the map and clears all related event listeners.
	 * @group Other methods
	 * @returns {this}
	 */
	remove() {

		this._initEvents(true);
		if (this.options.maxBounds) { this.off('moveend', this._panInsideMaxBounds); }

		if (this._containerId !== this._container._maplair_id) {
			throw new Error('Map container is being reused by another instance');
		}

		delete this._container._maplair_id;
		delete this._containerId;

		if (this._locationWatchId !== undefined) {
			this.stopLocate();
		}

		this._stop();

		PointerEvents.disablePointerDetection(this._container);
		this._mapPane.remove();
		for (const name of this._ariaAttributes) {
			this._container.removeAttribute(name);
		}

		if (this._clearControlPos) {
			this._clearControlPos();
		}
		if (this._resizeRequest) {
			cancelAnimationFrame(this._resizeRequest);
			this._resizeRequest = null;
		}
		cancelAnimationFrame(this._idleRequest);
		this._watchPixelRatio(true);

		this._clearHandlers();

		clearTimeout(this._transitionEndTimer);
		clearTimeout(this._sizeTimer);

		if (this._loaded) {
			this.fire('unload');
		}

		this._destroyAnimProxy();

		for (const layer of Object.values(this._layers)) {
			layer.remove();
		}
		for (const pane of Object.values(this._panes)) {
			pane.remove();
		}


		this._layers = {};
		this._panes = {};
		delete this._mapPane;
		delete this._renderer;

		return this;
	}

	/**
	 * Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
	 * then returns it. The pane is created as a child of `container`, or
	 * as a child of the main map pane if not set.
	 * @group Other methods
	 * @param {string} name
	 * @param {HTMLElement} [container]
	 * @returns {HTMLElement}
	 */
	createPane(name, container) {
		const className = `maplair-pane${name ? ` maplair-${name.replace('Pane', '')}-pane` : ''}`,
		pane = DomUtil.create('div', className, container || this._mapPane);

		if (name) {
			this._panes[name] = pane;
		}
		return pane;
	}

	/**
	 * Returns the geographical center of the map view.
	 * @group Methods for getting map state
	 * @returns {LatLng}
	 */
	getCenter() {
		this._checkIfLoaded();

		if (this._lastCenter && !this._moved()) {
			return new LatLng(this._lastCenter);
		}
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	}

	/**
	 * Returns the current zoom level of the map view.
	 * @group Methods for getting map state
	 * @returns {number}
	 */
	getZoom() {
		return this._zoom;
	}

	/**
	 * Returns the geographical bounds visible in the current map view.
	 * @group Methods for getting map state
	 * @returns {LatLngBounds}
	 */
	getBounds() {
		const bounds = this.getPixelBounds(),
		sw = this.unproject(bounds.getBottomLeft()),
		ne = this.unproject(bounds.getTopRight());

		return new LatLngBounds(sw, ne);
	}

	/**
	 * Returns the minimum zoom level of the map (if set in the `minZoom` option of the
	 * map or of any layers), or `0` by default.
	 * @group Methods for getting map state
	 * @returns {number}
	 */
	getMinZoom() {
		return this.options.minZoom ?? this._layersMinZoom ?? 0;
	}

	/**
	 * Returns the maximum zoom level of the map (if set in the `maxZoom` option of the
	 * map or of any layers).
	 * @group Methods for getting map state
	 * @returns {number}
	 */
	getMaxZoom() {
		return this.options.maxZoom ?? this._layersMaxZoom ?? Infinity;
	}

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
	getBoundsZoom(bounds, inside, padding) {
		bounds = LatLngBounds.from(bounds);
		padding = Point.from(padding ?? [0, 0]);

		let zoom = this.getZoom() ?? 0;
		const min = this.getMinZoom(),
		max = this.getMaxZoom(),
		nw = bounds.getNorthWest(),
		se = bounds.getSouthEast(),
		size = this.getSize().subtract(padding),
		boundsSize = new Bounds(this.project(se, zoom), this.project(nw, zoom)).getSize(),
		snap = this.options.zoomSnap,
		scalex = size.x / boundsSize.x,
		scaley = size.y / boundsSize.y,
		scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);

		zoom = this.getScaleZoom(scale, zoom);

		if (snap) {
			zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level
			zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
		}

		return Math.max(min, Math.min(max, zoom));
	}

	/**
	 * Returns the current size of the map container (in pixels).
	 * @group Methods for getting map state
	 * @returns {Point}
	 */
	getSize() {
		if (!this._size || this._sizeChanged) {
			this._size = new Point(
				this._container.clientWidth || 0,
				this._container.clientHeight || 0);

			this._sizeChanged = false;
		}
		return new Point(this._size);
	}

	/**
	 * Returns the bounds of the current map view in projected pixel
	 * coordinates (sometimes useful in layer and overlay implementations).
	 * If `center` and `zoom` is omitted, the map's current zoom level and center is used.
	 * @group Methods for getting map state
	 * @param {LatLngExpression} [center]
	 * @param {number} [zoom]
	 * @returns {Bounds}
	 */
	getPixelBounds(center, zoom) {
		const topLeftPoint = this._getTopLeftPoint(center, zoom);
		return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	}

	// TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
	// the map pane? "left point of the map layer" can be confusing, specially
	// since there can be negative offsets.
	/**
	 * Returns the projected pixel coordinates of the top left point of
	 * the map layer (useful in custom layer and overlay implementations).
	 * @group Methods for getting map state
	 * @returns {Point}
	 */
	getPixelOrigin() {
		this._checkIfLoaded();
		return this._pixelOrigin;
	}

	/**
	 * Returns the world's bounds in pixel coordinates for zoom level `zoom`.
	 * If `zoom` is omitted, the map's current zoom level is used.
	 * @group Methods for getting map state
	 * @param {number} [zoom]
	 * @returns {Bounds|null} `null` for CRSs with infinite bounds.
	 */
	getPixelWorldBounds(zoom) {
		return this.options.crs.getProjectedBounds(zoom ?? this.getZoom());
	}

	/**
	 * Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
	 * @group Other methods
	 * @param {string|HTMLElement} pane
	 * @returns {HTMLElement}
	 */
	getPane(pane) {
		return typeof pane === 'string' ? this._panes[pane] : pane;
	}

	/**
	 * Returns a plain object containing the names of all [panes](#map-pane) as keys and
	 * the panes as values.
	 * @group Other methods
	 * @returns {Record<string, HTMLElement>}
	 */
	getPanes() {
		return this._panes;
	}

	/**
	 * Returns the HTML element that contains the map.
	 * @group Other methods
	 * @returns {HTMLElement}
	 */
	getContainer() {
		return this._container;
	}


	/**
	 * Returns the scale factor to be applied to a map transition from zoom level
	 * `fromZoom` to `toZoom`. Used internally to help with zoom animations.
	 * @group Conversion methods
	 * @param {number} toZoom
	 * @param {number} [fromZoom]
	 * @returns {number}
	 */
	getZoomScale(toZoom, fromZoom) {
		// TODO replace with universal implementation after refactoring projections
		const crs = this.options.crs;
		fromZoom ??= this._zoom;
		return crs.scale(toZoom) / crs.scale(fromZoom);
	}

	/**
	 * Returns the zoom level that the map would end up at, if it is at `fromZoom`
	 * level and everything is scaled by a factor of `scale`. Inverse of
	 * [`getZoomScale`](#map-getZoomScale).
	 * @group Conversion methods
	 * @param {number} scale
	 * @param {number} [fromZoom]
	 * @returns {number}
	 */
	getScaleZoom(scale, fromZoom) {
		const crs = this.options.crs;
		fromZoom ??= this._zoom;
		const zoom = crs.zoom(scale * crs.scale(fromZoom));
		return isNaN(zoom) ? Infinity : zoom;
	}

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
	project(latlng, zoom) {
		zoom ??= this._zoom;
		return this.options.crs.latLngToPoint(LatLng.from(latlng), zoom);
	}

	/**
	 * Inverse of [`project`](#map-project).
	 * @group Conversion methods
	 * @param {PointExpression} point
	 * @param {number} [zoom]
	 * @returns {LatLng}
	 */
	unproject(point, zoom) {
		zoom ??= this._zoom;
		return this.options.crs.pointToLatLng(Point.from(point), zoom);
	}

	/**
	 * Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
	 * returns the corresponding geographical coordinate (for the current zoom level).
	 * @group Conversion methods
	 * @param {PointExpression} point
	 * @returns {LatLng}
	 */
	layerPointToLatLng(point) {
		const projectedPoint = Point.from(point).add(this.getPixelOrigin());
		return this.unproject(projectedPoint);
	}

	/**
	 * Given a geographical coordinate, returns the corresponding pixel coordinate
	 * relative to the [origin pixel](#map-getpixelorigin).
	 * @group Conversion methods
	 * @param {LatLngExpression} latlng
	 * @returns {Point}
	 */
	latLngToLayerPoint(latlng) {
		const projectedPoint = this.project(LatLng.from(latlng))._round();
		return projectedPoint._subtract(this.getPixelOrigin());
	}

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
	wrapLatLng(latlng) {
		return this.options.crs.wrapLatLng(LatLng.from(latlng));
	}

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
	wrapLatLngBounds(bounds) {
		return this.options.crs.wrapLatLngBounds(new LatLngBounds(bounds));
	}

	/**
	 * Returns the distance between two geographical coordinates according to
	 * the map's CRS. By default this measures distance in meters.
	 * @group Conversion methods
	 * @param {LatLngExpression} latlng1
	 * @param {LatLngExpression} latlng2
	 * @returns {number}
	 */
	distance(latlng1, latlng2) {
		return this.options.crs.distance(LatLng.from(latlng1), LatLng.from(latlng2));
	}

	/**
	 * Given a pixel coordinate relative to the map container, returns the corresponding
	 * pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
	 * @group Conversion methods
	 * @param {PointExpression} point
	 * @returns {Point}
	 */
	containerPointToLayerPoint(point) {
		return Point.from(point).subtract(this._getMapPanePos());
	}

	/**
	 * Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
	 * returns the corresponding pixel coordinate relative to the map container.
	 * @group Conversion methods
	 * @param {PointExpression} point
	 * @returns {Point}
	 */
	layerPointToContainerPoint(point) {
		return Point.from(point).add(this._getMapPanePos());
	}

	/**
	 * Given a pixel coordinate relative to the map container, returns
	 * the corresponding geographical coordinate (for the current zoom level).
	 * @group Conversion methods
	 * @param {PointExpression} point
	 * @returns {LatLng}
	 */
	containerPointToLatLng(point) {
		const layerPoint = this.containerPointToLayerPoint(Point.from(point));
		return this.layerPointToLatLng(layerPoint);
	}

	/**
	 * Given a geographical coordinate, returns the corresponding pixel coordinate
	 * relative to the map container.
	 * @group Conversion methods
	 * @param {LatLngExpression} latlng
	 * @returns {Point}
	 */
	latLngToContainerPoint(latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(LatLng.from(latlng)));
	}

	/**
	 * Given a PointerEvent object, returns the pixel coordinate relative to the
	 * map container where the event took place.
	 * @group Conversion methods
	 * @param {MouseEvent|PointerEvent} e
	 * @returns {Point}
	 */
	pointerEventToContainerPoint(e) {
		return DomEvent.getPointerPosition(e, this._container);
	}

	/**
	 * Given a PointerEvent object, returns the pixel coordinate relative to
	 * the [origin pixel](#map-getpixelorigin) where the event took place.
	 * @group Conversion methods
	 * @param {MouseEvent|PointerEvent} e
	 * @returns {Point}
	 */
	pointerEventToLayerPoint(e) {
		return this.containerPointToLayerPoint(this.pointerEventToContainerPoint(e));
	}

	/**
	 * Given a PointerEvent object, returns geographical coordinate where the
	 * event took place.
	 * @group Conversion methods
	 * @param {MouseEvent|PointerEvent} e
	 * @returns {LatLng}
	 */
	pointerEventToLatLng(e) {
		return this.layerPointToLatLng(this.pointerEventToLayerPoint(e));
	}


	// map initialization methods

	_initContainer(id) {
		const container = this._container = DomUtil.get(id);

		if (!container) {
			throw new Error('Map container not found.');
		} else if (container._maplair_id) {
			throw new Error('Map container is already initialized.');
		}

		PointerEvents.enablePointerDetection(container);
		DomEvent.on(container, 'scroll', this._onScroll, this);
		this._containerId = Util.stamp(container);

	}

	_initLayout() {
		const container = this._container;

		this._fadeAnimated = this.options.fadeAnimation;

		// maplair-touch and maplair-retina have no rules in maplair.css, but custom stylesheets may still target them
		const classes = ['maplair-container', 'maplair-touch'];

		if (Browser.retina) { classes.push('maplair-retina'); }
		if (Browser.safari) { classes.push('maplair-safari'); }
		if (this._fadeAnimated) { classes.push('maplair-fade-anim'); }

		container.classList.add(...classes);

		// an accessible name for the map, e.g. for the landmarks of screen readers
		this._ariaAttributes = [];
		if (!container.hasAttribute('role')) {
			container.setAttribute('role', 'region');
			this._ariaAttributes.push('role');
		}
		if (!container.hasAttribute('aria-label') && !container.hasAttribute('aria-labelledby')) {
			container.setAttribute('aria-label', this.options.ariaLabel ?? I18n.translate('Map'));
			this._ariaAttributes.push('aria-label');
		}

		const {position} = getComputedStyle(container);

		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed' && position !== 'sticky') {
			container.style.position = 'relative';
		}

		this._initPanes();

		if (this._initControlPos) {
			this._initControlPos();
		}
	}

	_initPanes() {
		const panes = this._panes = {};
		this._paneRenderers = {};

		// the default panes, see the class description
		this._mapPane = this.createPane('mapPane', this._container);
		DomUtil.setPosition(this._mapPane, new Point(0, 0));

		this.createPane('tilePane');
		this.createPane('overlayPane');
		this.createPane('shadowPane');
		this.createPane('markerPane');
		this.createPane('tooltipPane');
		this.createPane('popupPane');

		if (!this.options.markerZoomAnimation) {
			panes.markerPane.classList.add('maplair-zoom-hide');
			panes.shadowPane.classList.add('maplair-zoom-hide');
		}
	}


	// private methods that modify map state

	_resetView(center, zoom, noMoveStart) {
		DomUtil.setPosition(this._mapPane, new Point(0, 0));

		const loading = !this._loaded;
		this._loaded = true;
		zoom = this._limitZoom(zoom);

		this.fire('viewprereset');

		const zoomChanged = this._zoom !== zoom;
		this
			._moveStart(zoomChanged, noMoveStart)
			._move(center, zoom)
			._moveEnd(zoomChanged);

		this.fire('viewreset');

		if (loading) {
			this.fire('load');
		}
	}

	/**
	 * Fires an event of the specified type, see `Evented.fire()`. The map state change
	 * events caused by the user get an `originalEvent` property (see the class
	 * description).
	 * @param {string} type
	 * @param {object} [data]
	 * @param {boolean} [propagate]
	 * @returns {this}
	 */
	fire(type, data, propagate) {
		if (this._userEvent && MaplairMap._viewEvents.has(type)) {
			data = {originalEvent: this._userEvent, ...data};
			if (type === 'moveend') {
				this._userEvent = null;
			} else {
				this._userMoving = true;
			}
		}
		return super.fire(type, data, propagate);
	}

	static _viewEvents = new Set(['movestart', 'move', 'moveend', 'zoomstart', 'zoom', 'zoomend', 'zoomanim']);

	_watchPixelRatio(remove) {
		this._pixelRatioQuery?.removeEventListener('change', this._onPixelRatioChange);
		if (remove || typeof window === 'undefined' || !window.matchMedia) { return; }

		this._onPixelRatioChange ??= () => {
			this._watchPixelRatio();
			this.fire('pixelratiochange');
		};
		// matches until the ratio changes, then a new query is needed
		this._pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
		this._pixelRatioQuery.addEventListener('change', this._onPixelRatioChange);
	}

	_onBusy() {
		this._viewChanging = true;
		this._idle = false;
	}

	_onViewChanged() {
		this._viewChanging = false;
		this._scheduleIdleCheck();
	}

	// Called by layers when they start loading, see `GridLayer`.
	_onLayerLoading() {
		this._idle = false;
	}

	// Called by layers when they finished loading, see `GridLayer`.
	_scheduleIdleCheck() {
		cancelAnimationFrame(this._idleRequest);
		// After the current task, so that layers can start loading on the same `moveend`
		this._idleRequest = requestAnimationFrame(() => this._checkIdle());
	}

	_checkIdle() {
		if (this._idle || !this._loaded || this._viewChanging || this._animatingZoom) { return; }
		for (const layer of Object.values(this._layers)) {
			if (layer.isLoading?.()) { return; }
		}
		this._idle = true;
		this.fire('idle');
	}

	// Marks the following view change (until `moveend`) as caused by the DOM event `e`
	// of the user, see the map state change events. If no view change starts right
	// away, the mark is dropped.
	_setUserEvent(e) {
		this._userEvent = e;
		this._userMoving = false;
		queueMicrotask(() => {
			if (this._userEvent === e && !this._userMoving) {
				this._userEvent = null;
			}
		});
	}

	_moveStart(zoomChanged, noMoveStart) {
		if (zoomChanged) {
			this.fire('zoomstart');
		}
		if (!noMoveStart) {
			this.fire('movestart');
		}
		return this;
	}

	_move(center, zoom, data, suppressEvent) {
		if (zoom === undefined) {
			zoom = this._zoom;
		}
		const zoomChanged = this._zoom !== zoom;

		this._zoom = zoom;
		this._lastCenter = center;
		this._pixelOrigin = this._getNewPixelOrigin(center);

		if (!suppressEvent) {
			if (zoomChanged || (data?.pinch)) {	// Always fire 'zoom' if pinching because #3530
				this.fire('zoom', data);
			}

			this.fire('move', data);
		} else if (data?.pinch) {	// Always fire 'zoom' if pinching because #3530
			this.fire('zoom', data);
		}
		return this;
	}

	_moveEnd(zoomChanged) {
		if (zoomChanged) {
			this.fire('zoomend');
		}

		return this.fire('moveend');
	}

	_stop() {
		cancelAnimationFrame(this._flyToFrame);
		cancelAnimationFrame(this._zoomAnimFrame);
		this._panAnim?.stop();
		return this;
	}

	_rawPanBy(offset) {
		DomUtil.setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	}

	_getZoomSpan() {
		return this.getMaxZoom() - this.getMinZoom();
	}

	_panInsideMaxBounds() {
		if (!this._enforcingBounds) {
			this.panInsideBounds(this.options.maxBounds);
		}
	}

	_checkIfLoaded() {
		if (!this._loaded) {
			throw new Error('Set map center and zoom first.');
		}
	}

	// DOM event handling

	_initEvents(remove) {
		this._targets = {};
		this._targets[Util.stamp(this._container)] = this;

		const onOff = remove ? DomEvent.off : DomEvent.on;

		onOff(this._container, 'click dblclick pointerdown pointerup ' +
			'pointerover pointerout pointermove contextmenu keypress keydown keyup', this._handleDOMEvent, this);

		if (this.options.trackResize) {
			if (!remove) {
				if (!this._resizeObserver) {
					this._resizeObserver = new ResizeObserver(this._onResize.bind(this));
				}
				this._resizeObserver.observe(this._container);
			} else {
				this._resizeObserver.disconnect();
			}
		}

		if (this.options.transform3DLimit) {
			(remove ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
		}
	}

	_onResize() {
		cancelAnimationFrame(this._resizeRequest);
		this._resizeRequest = requestAnimationFrame(() => {
			// a hidden map keeps the view of its last visible state
			if (this._container.clientWidth || this._container.clientHeight) {
				this.invalidateSize({debounceMoveend: true});
			}
		});
	}

	_onScroll() {
		this._container.scrollTop  = 0;
		this._container.scrollLeft = 0;
	}

	_onMoveEnd() {
		const pos = this._getMapPanePos();
		if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
			// https://bugzilla.mozilla.org/show_bug.cgi?id=1203873 but Webkit also have
			// a pixel offset on very high values, see: https://jsfiddle.net/dg6r5hhb/
			this._resetView(this.getCenter(), this.getZoom());
		}
	}

	_findEventTargets(e, type) {
		let targets = [],
		target,
		src = e.target,
		dragging = false;
		const isHover = type === 'pointerout' || type === 'pointerover';

		while (src) {
			target = this._targets[Util.stamp(src)];
			if (target && (type === 'click' || type === 'preclick') && this._draggableMoved(target)) {
				// Prevent firing click after you just dragged an object.
				dragging = true;
				break;
			}
			if (target && target.listens(type, true)) {
				if (isHover && !DomEvent.isExternalTarget(src, e)) { break; }
				targets.push(target);
				if (isHover) { break; }
			}
			if (src === this._container) { break; }
			src = src.parentNode;
		}
		if (!targets.length && !dragging && !isHover && this.listens(type, true)) {
			targets = [this];
		}
		return targets;
	}

	_isClickDisabled(el) {
		while (el && el !== this._container) {
			if (el['_maplair_disable_click'] || !el.parentNode) { return true; }
			el = el.parentNode;
		}
	}

	_handleDOMEvent(e) {
		const el = e.target;
		if (!this._loaded || el['_maplair_disable_events'] || e.type === 'click' && this._isClickDisabled(el)) {
			return;
		}

		const type = e.type;

		if (type === 'pointerdown') {
			// prevents outline when clicking on keyboard-focusable element
			DomUtil.preventOutline(el);
		}

		this._fireDOMEvent(e, type);
	};

	static _pointerEvents = ['click', 'dblclick', 'pointerover', 'pointerout', 'contextmenu'];

	_fireDOMEvent(e, type, canvasTargets) {

		if (type === 'click') {
			// Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
			this._fireDOMEvent(e, 'preclick', canvasTargets);
		}

		// Find the layer the event is propagating from and its parents.
		let targets = this._findEventTargets(e, type);

		if (canvasTargets) {
			// pick only targets with listeners
			const filtered = canvasTargets.filter(t => t.listens(type, true));
			targets = [...filtered, ...targets];
		}

		if (!targets.length) { return; }

		if (type === 'contextmenu') {
			e.preventDefault();
		}

		const target = targets[0];
		const data = {
			originalEvent: e
		};

		if (e.type !== 'keypress' && e.type !== 'keydown' && e.type !== 'keyup') {
			const isMarker = target.getLatLng && (!target._pxRadius || target._pxRadius <= 10);
			data.containerPoint = isMarker ?
				this.latLngToContainerPoint(target.getLatLng()) : this.pointerEventToContainerPoint(e);
			data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
			data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
		}

		for (const t of targets) {
			t.fire(type, data, true);
			if (data.originalEvent._stopped ||
				(t.options.bubblingPointerEvents === false && MaplairMap._pointerEvents.includes(type))) { return; }
		}
	}

	_draggableMoved(obj) {
		obj = obj.dragging?.enabled() ? obj : this;
		return obj.dragging?.moved() || this.boxZoom?.moved();
	}

	_clearHandlers() {
		for (const handler of this._handlers) {
			handler.disable();
		}
	}


	/**
	 * Runs the given function `callback` when the map gets initialized with
	 * a view (center and zoom) and at least one layer, or immediately
	 * if it's already initialized, optionally passing a function context.
	 * @group Other methods
	 * @param {(event: {target: MaplairMap}) => void} callback
	 * @param {object} [context]
	 * @returns {this}
	 */
	whenReady(callback, context) {
		if (this._loaded) {
			callback.call(context || this, {target: this});
		} else {
			this.on('load', callback, context);
		}
		return this;
	}


	// private methods for getting map state

	_getMapPanePos() {
		return DomUtil.getPosition(this._mapPane);
	}

	_moved() {
		const pos = this._getMapPanePos();
		return pos && !pos.equals([0, 0]);
	}

	_getTopLeftPoint(center, zoom) {
		const pixelOrigin = center && zoom !== undefined ?
			this._getNewPixelOrigin(center, zoom) :
			this.getPixelOrigin();
		return pixelOrigin.subtract(this._getMapPanePos());
	}

	_getNewPixelOrigin(center, zoom) {
		const viewHalf = this.getSize()._divideBy(2);
		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
	}

	_latLngToNewLayerPoint(latlng, zoom, center) {
		const topLeft = this._getNewPixelOrigin(center, zoom);
		return this.project(latlng, zoom)._subtract(topLeft);
	}

	_latLngBoundsToNewLayerBounds(latLngBounds, zoom, center) {
		const topLeft = this._getNewPixelOrigin(center, zoom);
		return new Bounds([
			this.project(latLngBounds.getSouthWest(), zoom)._subtract(topLeft),
			this.project(latLngBounds.getNorthWest(), zoom)._subtract(topLeft),
			this.project(latLngBounds.getSouthEast(), zoom)._subtract(topLeft),
			this.project(latLngBounds.getNorthEast(), zoom)._subtract(topLeft)
		]);
	}

	// layer point of the current center
	_getCenterLayerPoint() {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	}

	// offset of the specified place to the current center in pixels
	_getCenterOffset(latlng) {
		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
	}

	// adjust center for view to get inside bounds
	_limitCenter(center, zoom, bounds) {

		if (!bounds) { return center; }

		const centerPoint = this.project(center, zoom),
		viewHalf = this.getSize().divideBy(2),
		viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
		offset = this._getBoundsOffset(viewBounds, bounds, zoom);

		// If offset is less than a pixel, ignore.
		// This prevents unstable projections from getting into
		// an infinite loop of tiny offsets.
		if (Math.abs(offset.x) <= 1 && Math.abs(offset.y) <= 1) {
			return center;
		}

		return this.unproject(centerPoint.add(offset), zoom);
	}

	// adjust offset for view to get inside bounds
	_limitOffset(offset, bounds) {
		if (!bounds) { return offset; }

		const viewBounds = this.getPixelBounds(),
		newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

		return offset.add(this._getBoundsOffset(newBounds, bounds));
	}

	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
	_getBoundsOffset(pxBounds, maxBounds, zoom) {
		const projectedMaxBounds = new Bounds(
			this.project(maxBounds.getNorthEast(), zoom),
			this.project(maxBounds.getSouthWest(), zoom)
		),
		minOffset = projectedMaxBounds.min.subtract(pxBounds.min),
		maxOffset = projectedMaxBounds.max.subtract(pxBounds.max),

		dx = this._rebound(minOffset.x, -maxOffset.x),
		dy = this._rebound(minOffset.y, -maxOffset.y);

		return new Point(dx, dy);
	}

	_rebound(left, right) {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	}

	_limitZoom(zoom) {
		const min = this.getMinZoom(),
		max = this.getMaxZoom(),
		snap = this.options.zoomSnap;
		if (snap) {
			zoom = Math.round(zoom / snap) * snap;
		}
		return Math.max(min, Math.min(max, zoom));
	}

	_onPanTransitionStep() {
		this.fire('move');
	}

	_onPanTransitionEnd() {
		this._mapPane.classList.remove('maplair-pan-anim');
		this.fire('moveend');
	}

	_tryAnimatedPan(center, options) {
		// difference between the new and current centers in pixels
		const offset = this._getCenterOffset(center)._trunc();

		// don't animate too far unless animate: true specified in options
		if (options?.animate !== true && !this.getSize().contains(offset)) { return false; }

		this.panBy(offset, options);

		return true;
	}

	_createAnimProxy() {
		this._proxy = DomUtil.create('div', 'maplair-proxy maplair-zoom-animated');
		this._panes.mapPane.appendChild(this._proxy);

		this.on('zoomanim', this._animateProxyZoom, this);
		this.on('load moveend', this._animMoveEnd, this);

		DomEvent.on(this._proxy, 'transitionend', this._catchTransitionEnd, this);
	}

	_animateProxyZoom(e) {
		const transform = this._proxy.style.transform;

		DomUtil.setTransform(
			this._proxy,
			this.project(e.center, e.zoom),
			this.getZoomScale(e.zoom, 1),
		);

		// workaround for case when transform is the same and so transitionend event is not fired
		if (transform === this._proxy.style.transform && this._animatingZoom) {
			this._onZoomTransitionEnd();
		}
	}

	_animMoveEnd() {
		const c = this.getCenter();
		const z = this.getZoom();



		DomUtil.setTransform(
			this._proxy,
			this.project(c, z),
			this.getZoomScale(z, 1),
		);
	}

	_destroyAnimProxy() {
		// Just make sure this method is safe to call from anywhere, without knowledge
		// of whether the animation proxy was created in the first place.
		if (this._proxy) {
			DomEvent.off(this._proxy, 'transitionend', this._catchTransitionEnd, this);

			this._proxy.remove();
			this.off('zoomanim', this._animateProxyZoom, this);
			this.off('load moveend', this._animMoveEnd, this);

			delete this._proxy;
		}
	}

	_catchTransitionEnd(e) {
		if (this._animatingZoom && e.propertyName.includes('transform')) {
			this._onZoomTransitionEnd();
		}
	}

	_nothingToAnimate() {
		return !this._container.getElementsByClassName('maplair-zoom-animated').length;
	}

	// Zooms to `center` and `zoom` frame by frame around the zoom origin at `offset`
	// from the center (as the CSS zoom animation does), see the `continuousZoom` option.
	_continuousZoom(center, zoom, offset, options) {
		const startZoom = this._zoom,
		originOffset = offset.multiplyBy(-1),
		origin = this.containerPointToLatLng(this.getSize()._divideBy(2).add(offset)),
		start = performance.now(),
		duration = 250;

		this._moveStart(true, options.noMoveStart ?? false);

		const frame = () => {
			const t = Math.min(1, (performance.now() - start) / duration);
			if (t < 1) {
				// ease out, like the CSS zoom transition
				const z = startZoom + (zoom - startZoom) * (1 - (1 - t) ** 2);
				this._move(this.unproject(this.project(origin, z).add(originOffset), z), z, {continuous: true});
				// cancelled by `_stop()`
				this._flyToFrame = requestAnimationFrame(frame);
			} else {
				this._move(center, zoom)._moveEnd(true);
			}
		};
		this._flyToFrame = requestAnimationFrame(frame);
	}

	_tryAnimatedZoom(center, zoom, options) {

		if (this._animatingZoom) { return true; }

		options ??= {};

		// don't animate if disabled, not supported or zoom difference is too large
		if (!this._zoomAnimated || options.animate === false ||
		        (this._nothingToAnimate() && !this.options.continuousZoom) ||
		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

		// offset is the pixel coords of the zoom origin relative to the current center
		const scale = this.getZoomScale(zoom),
		offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);

		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

		if (this.options.continuousZoom) {
			this._continuousZoom(center, zoom, offset, options);
			return true;
		}

		const userEvent = this._userEvent;
		this._zoomAnimFrame = requestAnimationFrame(() => {
			this._zoomAnimFrame = null;
			if (userEvent) {
				this._setUserEvent(userEvent);
			}
			this
				._moveStart(true, options.noMoveStart ?? false)
				._animateZoom(center, zoom, true);
		});

		return true;
	}

	_animateZoom(center, zoom, startAnim, noUpdate) {
		if (!this._mapPane) { return; }

		if (startAnim) {
			this._animatingZoom = true;

			// remember what center/zoom to set after animation
			this._animateToCenter = center;
			this._animateToZoom = zoom;

			this._mapPane.classList.add('maplair-zoom-anim');
		}

		this.fire('zoomanim', {
			center,
			zoom,
			noUpdate
		});

		if (!this._tempFireZoomEvent) {
			this._tempFireZoomEvent = this._zoom !== this._animateToZoom;
		}

		this._move(this._animateToCenter, this._animateToZoom, undefined, true);

		// Work around webkit not firing 'transitionend', see https://github.com/Leaflet/Leaflet/issues/3689, 2693
		this._transitionEndTimer = setTimeout(this._onZoomTransitionEnd.bind(this), 250);
	}

	_onZoomTransitionEnd() {
		if (!this._animatingZoom) { return; }

		this._mapPane?.classList.remove('maplair-zoom-anim');

		this._animatingZoom = false;

		this._move(this._animateToCenter, this._animateToZoom, undefined, true);

		if (this._tempFireZoomEvent) {
			this.fire('zoom');
		}
		delete this._tempFireZoomEvent;

		this.fire('move');

		this._moveEnd(true);
	}
}

// The default features (layers, popups, tooltips, vector renderers, controls
// and interaction handlers) come with every map: they are registered here
// rather than by the entry module, so that they are included whenever
// `MaplairMap` is, while bundlers can still drop other features (e.g. GeoJSON,
// the layers and scale controls) when an application doesn't use them.
//
// Possible tree-shaking optimization: popups, tooltips and the vector renderers
// (DivOverlay, Popup, Tooltip, RendererSupport; about 25 kB of a minimal map's
// 100 kB minified) could become optional by registering themselves when their
// module is imported (without importing this module, to avoid circular imports)
// instead of here. But then `layer.bindPopup()`/`bindTooltip()` and the map's
// popup/tooltip methods would only exist in production bundles of apps that
// actually use the `Popup`/`Tooltip` classes (bundlers drop an unused
// `import {Tooltip}`), while they would always work in development builds.
for (const feature of [
	AttributionControl,
	Control,
	DivOverlay,
	Layer,
	BoxZoomHandler,
	DoubleClickZoomHandler,
	DragHandler,
	KeyboardHandler,
	PinchZoomHandler,
	ScrollWheelZoomHandler,
	TapHoldHandler,
	TapDragZoomHandler,
	Popup,
	Tooltip,
	RendererSupport,
	ZoomControl,
	FullscreenControl
]) {
	feature.register(MaplairMap);
}

export const Map = MaplairMap;
