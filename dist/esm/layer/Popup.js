import { Point } from "../geometry/Point.js";
import { disableClickPropagation, disableScrollPropagation, on, stop, stopPropagation } from "../dom/DomEvent.js";
import { create, reducedMotion } from "../dom/DomUtil.js";
import { I18n } from "../core/I18n.js";
import { Layer } from "./Layer.js";
import { Path } from "./vector/Path.js";
import { FeatureGroup } from "./FeatureGroup.js";
import { DivOverlay } from "./DivOverlay.js";
//#region src/layer/Popup.js
/** @import {DivOverlayOptions, DivOverlayContent} from './DivOverlay.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, MaplairEvent, PopupEvent} from '../core/Events.js' */
/**
* Options of `Popup`.
* @typedef {object} PopupOptions
* @property {string} [pane='popupPane'] `Map pane` where the popup will be added.
* @property {PointExpression} [offset=[0, 7]] The offset of the popup position.
* @property {number} [maxWidth=300] Max width of the popup, in pixels.
* @property {number} [minWidth=50] Min width of the popup, in pixels.
* @property {number|null} [maxHeight=null] If set, creates a scrollable container of
* the given height inside a popup if its content exceeds it. The scrollable container
* can be styled using the `maplair-popup-scrolled` CSS class selector.
* @property {boolean} [autoPan] Set it to `false` if you don't want the map to do
* panning animation to fit the opened popup. Defaults to `true`, unless the user
* prefers reduced motion (`DomUtil.reducedMotion`).
* @property {PointExpression|null} [autoPanPaddingTopLeft=null] The margin between the
* popup and the top left corner of the map view after autopanning was performed.
* @property {PointExpression|null} [autoPanPaddingBottomRight=null] The margin between
* the popup and the bottom right corner of the map view after autopanning was
* performed.
* @property {PointExpression} [autoPanPadding=[5, 5]] Equivalent of setting both top
* left and bottom right autopan padding to the same value.
* @property {boolean} [keepInView=false] Set it to `true` if you want to prevent users
* from panning the popup off of the screen while it is open.
* @property {boolean} [closeButton=true] Controls the presence of a close button in
* the popup.
* @property {boolean} [autoClose=true] Set it to `false` if you want to override the
* default behavior of the popup closing when another popup is opened.
* @property {boolean} [closeOnEscapeKey=true] Set it to `false` if you want to
* override the default behavior of the ESC key for closing of the popup.
* @property {boolean} [closeOnClick] Set it if you want to override the default
* behavior of the popup closing when user clicks on the map. Defaults to the map's
* [`closePopupOnClick`](#map-closepopuponclick) option.
* @property {string} [className=''] A custom CSS class name to assign to the popup.
* @property {boolean} [trackResize=true] Whether the popup shall react to changes in
* the size of its contents (e.g. when an image inside the popup loads) and reposition
* itself.
* @extends DivOverlayOptions
*/
/**
* Map options of `Popup`.
* @typedef {object} PopupMapOptions
* @lends MaplairMapOptions
* @property {boolean} [closePopupOnClick=true] Set it to `false` if you don't want
* popups to close when user clicks the map.
*/
/**
* Methods of `MaplairMap` for popups.
* @lends MaplairMap.prototype
* @fires MaplairMap#popupopen {PopupEvent} Fired when a popup is opened in the map.
* @fires MaplairMap#popupclose {PopupEvent} Fired when a popup in the map is closed.
* @fires MaplairMap#autopanstart {MaplairEvent} Fired when the map starts autopanning
* when opening a popup.
*/
const mapPopupMethods = {
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
	openPopup(popup, latlng, options) {
		this._initOverlay(Popup, popup, latlng, options).openOn(this);
		return this;
	},
	/**
	* Closes the popup previously opened with [openPopup](#map-openpopup) (or the
	* given one).
	* @group Methods for layers and controls
	* @param {Popup} [popup]
	* @returns {this}
	*/
	closePopup(popup) {
		popup = arguments.length ? popup : this._popup;
		popup?.close();
		return this;
	}
};
/** @typedef {typeof mapPopupMethods} MapPopupMethods */
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
*
* @lends Layer.prototype
* @fires Layer#popupopen {PopupEvent} Fired when a popup bound to this layer is opened.
* @fires Layer#popupclose {PopupEvent} Fired when a popup bound to this layer is closed.
*/
const layerPopupMethods = {
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
	bindPopup(content, options) {
		this._popup = this._initOverlay(Popup, this._popup, content, options);
		this.on({
			click: this._openPopup,
			keypress: this._onKeyPress,
			remove: this.closePopup,
			move: this._movePopup
		});
		return this;
	},
	/**
	* Removes the popup previously bound with `bindPopup`.
	* @group Popup methods
	* @returns {this}
	*/
	unbindPopup() {
		if (this._popup) {
			this.off({
				click: this._openPopup,
				keypress: this._onKeyPress,
				remove: this.closePopup,
				move: this._movePopup
			});
			this._popup = null;
		}
		return this;
	},
	/**
	* Opens the bound popup at the specified `latlng` or at the default popup anchor
	* if no `latlng` is passed.
	* @group Popup methods
	* @param {LatLngExpression} [latlng]
	* @returns {this}
	*/
	openPopup(latlng) {
		if (this._popup) {
			if (!(this instanceof FeatureGroup)) this._popup._source = this;
			if (this._popup._prepareOpen(latlng || this._latlng)) this._popup.openOn(this._map);
		}
		return this;
	},
	/**
	* Closes the popup bound to this layer if it is open.
	* @group Popup methods
	* @returns {this}
	*/
	closePopup() {
		this._popup?.close();
		return this;
	},
	/**
	* Opens or closes the popup bound to this layer depending on its current state.
	* @group Popup methods
	* @returns {this}
	*/
	togglePopup() {
		this._popup?.toggle(this);
		return this;
	},
	/**
	* Returns `true` if the popup bound to this layer is currently open.
	* @group Popup methods
	* @returns {boolean}
	*/
	isPopupOpen() {
		return this._popup?.isOpen() ?? false;
	},
	/**
	* Sets the content of the popup bound to this layer. String content is rendered
	* as HTML; sanitize untrusted input or pass an `HTMLElement` with safe
	* `textContent` instead.
	* @group Popup methods
	* @param {DivOverlayContent} content
	* @returns {this}
	*/
	setPopupContent(content) {
		this._popup?.setContent(content);
		return this;
	},
	/**
	* Returns the popup bound to this layer.
	* @group Popup methods
	* @returns {Popup|undefined}
	*/
	getPopup() {
		return this._popup;
	},
	_openPopup(e) {
		if (!this._popup || !this._map) return;
		stop(e);
		const target = e.propagatedFrom ?? e.target;
		if (this._popup._source === target && !(target instanceof Path)) {
			if (this._map.hasLayer(this._popup)) this.closePopup();
			else this.openPopup(e.latlng);
			return;
		}
		this._popup._source = target;
		this.openPopup(e.latlng);
	},
	_movePopup(e) {
		this._popup.setLatLng(e.latlng);
	},
	_onKeyPress(e) {
		if (e.originalEvent.code === "Enter") {
			this._popup._openedByKeyboard = true;
			this._openPopup(e);
			this._popup._openedByKeyboard = false;
		}
	}
};
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
var Popup = class Popup extends DivOverlay {
	static defaultOptions = {
		pane: "popupPane",
		offset: [0, 7],
		maxWidth: 300,
		minWidth: 50,
		maxHeight: null,
		autoPan: !reducedMotion,
		autoPanPaddingTopLeft: null,
		autoPanPaddingBottomRight: null,
		autoPanPadding: [5, 5],
		keepInView: false,
		closeButton: true,
		autoClose: true,
		closeOnEscapeKey: true,
		className: "",
		trackResize: true
	};
	/**
	* Instantiates a `Popup` object given an optional `options` object that describes
	* its appearance and location and an optional `source` object that is used to tag
	* the popup with a reference to the Layer to which it refers.
	* @overload
	* @param {PopupOptions} [options]
	* @param {Layer} [source]
	*/
	/**
	* Instantiates a `Popup` object given `latlng` where the popup will open and an
	* optional `options` object that describes its appearance and location.
	* @overload
	* @param {LatLngExpression} latlng
	* @param {PopupOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(Popup);
	}
	/**
	* Alternative to `map.openPopup(popup)`.
	* Adds the popup to the map and closes the previous one.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	openOn(map) {
		map = arguments.length ? map : this._source._map;
		if (!map.hasLayer(this) && map._popup && map._popup.options.autoClose) map.removeLayer(map._popup);
		map._popup = this;
		return super.openOn(map);
	}
	/**
	* Adds the popup to the map.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		const active = document.activeElement;
		this._returnFocus = map._container.contains(active) && !this._container?.contains(active) ? active : null;
		super.onAdd(map);
		if (this._openedByKeyboard) {
			if (!this._closeButton) this._container.tabIndex = -1;
			(this._closeButton ?? this._container).focus({ preventScroll: true });
		}
		map.fire("popupopen", { popup: this });
		if (this._source) {
			this._source.fire("popupopen", { popup: this }, true);
			if (!(this._source instanceof Path)) this._source.on("preclick", stopPropagation);
		}
	}
	/**
	* Removes the popup from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		if (this._container.contains(document.activeElement) && this._returnFocus?.isConnected) this._returnFocus.focus({ preventScroll: true });
		this._returnFocus = null;
		super.onRemove(map);
		map.fire("popupclose", { popup: this });
		if (this._source) {
			this._source.fire("popupclose", { popup: this }, true);
			if (!(this._source instanceof Path)) this._source.off("preclick", stopPropagation);
		}
	}
	/**
	* Returns the map events the popup listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = super.getEvents();
		if (this.options.closeOnClick ?? this._map.options.closePopupOnClick) events.preclick = this.close;
		if (this.options.keepInView) events.moveend = this._adjustPan;
		return events;
	}
	_initLayout() {
		const prefix = "maplair-popup", container = this._container = create("div", `${prefix} ${this.options.className || ""} maplair-zoom-animated`);
		const wrapper = this._wrapper = create("div", `${prefix}-content-wrapper`, container);
		this._contentNode = create("div", `${prefix}-content`, wrapper);
		disableClickPropagation(container);
		on(container, "keydown", (e) => {
			if (e.key === "Escape" && this.options.closeOnEscapeKey) this.close();
		});
		disableScrollPropagation(this._contentNode);
		on(container, "contextmenu", stopPropagation);
		this._tipContainer = create("div", `${prefix}-tip-container`, container);
		this._tip = create("div", `${prefix}-tip`, this._tipContainer);
		if (this.options.closeButton) {
			const closeButton = this._closeButton = create("button", `${prefix}-close-button`, container);
			closeButton.type = "button";
			closeButton.setAttribute("aria-label", I18n.translate("Close popup"));
			closeButton.innerHTML = "<span aria-hidden=\"true\">&#215;</span>";
			on(closeButton, "click", (ev) => {
				ev.preventDefault();
				this.close();
			});
		}
		if (this.options.trackResize) {
			this._resizeObserver = new ResizeObserver(((entries) => {
				if (!this._map) return;
				this._containerWidth = entries[0]?.contentRect?.width;
				this._containerHeight = entries[0]?.contentRect?.height;
				this._updateLayout();
				this._updatePosition();
				this._adjustPan();
			}));
			this._resizeObserver.observe(this._contentNode);
		}
	}
	_updateLayout() {
		const container = this._contentNode, style = container.style;
		style.maxWidth = `${this.options.maxWidth}px`;
		style.minWidth = `${this.options.minWidth}px`;
		const maxHeight = this.options.maxHeight, scrolledClass = "maplair-popup-scrolled";
		if (maxHeight && (this._containerHeight ?? container.offsetHeight) > maxHeight) {
			style.height = `${maxHeight}px`;
			container.classList.add(scrolledClass);
		} else container.classList.remove(scrolledClass);
		this._containerWidth = this._container.offsetWidth;
		this._containerHeight = this._container.offsetHeight;
		this._containerMarginBottom = parseInt(getComputedStyle(this._container).marginBottom, 10) || 0;
	}
	_animateZoom(e) {
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center), anchor = this._getAnchor();
		this._setContainerPosition(pos.add(anchor));
	}
	_adjustPan() {
		if (!this.options.autoPan) return;
		this._map._panAnim?.stop();
		if (!this._map) return;
		if (this._autopanning) {
			this._autopanning = false;
			return;
		}
		const map = this._map, marginBottom = this._containerMarginBottom ?? (parseInt(getComputedStyle(this._container).marginBottom, 10) || 0), containerHeight = this._containerHeight + marginBottom, containerWidth = this._containerWidth, layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);
		layerPos._add(this._getContainerPosition());
		const containerPos = map.layerPointToContainerPoint(layerPos), padding = Point.from(this.options.autoPanPadding), paddingTL = Point.from(this.options.autoPanPaddingTopLeft ?? padding), paddingBR = Point.from(this.options.autoPanPaddingBottomRight ?? padding), size = map.getSize();
		let dx = 0, dy = 0;
		if (containerPos.x + containerWidth + paddingBR.x > size.x) dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		if (containerPos.x - dx - paddingTL.x < 0) dx = containerPos.x - paddingTL.x;
		if (containerPos.y + containerHeight + paddingBR.y > size.y) dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		if (containerPos.y - dy - paddingTL.y < 0) dy = containerPos.y - paddingTL.y;
		if (dx || dy) {
			if (this.options.keepInView) this._autopanning = true;
			map.fire("autopanstart").panBy([dx, dy]);
		}
	}
	_getAnchor() {
		return new Point(this._source?._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ closePopupOnClick: true });
		MaplairMap.include(mapPopupMethods);
		Layer.include(layerPopupMethods);
	}
};
//#endregion
export { Popup };

//# sourceMappingURL=Popup.js.map