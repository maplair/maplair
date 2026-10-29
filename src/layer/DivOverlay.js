import {Layer} from './Layer.js';
import {FeatureGroup} from './FeatureGroup.js';
import * as Util from '../core/Util.js';
import {LatLng} from '../geo/LatLng.js';
import {Point} from '../geometry/Point.js';
import * as DomUtil from '../dom/DomUtil.js';
/** @import {InteractiveLayerOptions} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, MaplairEvent} from '../core/Events.js' */

/**
 * The content of a `DivOverlay` (`Popup`, `Tooltip`): a string rendered as HTML, an
 * `HTMLElement`, or a function receiving the source layer and returning one of them.
 * @typedef {string|HTMLElement|((layer: Layer) => string|HTMLElement)} DivOverlayContent
 */

/**
 * Options of `DivOverlay`.
 * @typedef {object} DivOverlayOptions
 * @property {boolean} [interactive=false] If true, the popup/tooltip will listen to the
 * pointer events.
 * @property {PointExpression} [offset=[0, 0]] The offset of the overlay position.
 * @property {string} [className=''] A custom CSS class name to assign to the overlay.
 * @property {string} [pane] `Map pane` where the overlay will be added.
 * @property {boolean} [overflow=false] Whether the overlay may extend beyond the map
 * container, e.g. a tooltip of a marker near the edge of a small map. The overlay is
 * then shown as [popover](https://developer.mozilla.org/docs/Web/API/Popover_API) in
 * the top layer of the page, above all other content, while remaining in its map pane
 * in the DOM (for styling and events).
 * @property {DivOverlayContent} [content=''] Sets the HTML content of the overlay while
 * initializing. If a function is passed the source layer will be passed to the
 * function. The function should return a `String` or `HTMLElement` to be used in the
 * overlay. String content is rendered as HTML; sanitize untrusted input or pass an
 * `HTMLElement` with safe `textContent` instead.
 * @extends InteractiveLayerOptions
 */

/**
 * Methods of `MaplairMap` for overlays.
 * @lends MaplairMap.prototype
 */
const mapDivOverlayMethods = {
	_initOverlay(OverlayClass, content, latlng, options) {
		let overlay = content;
		if (!(overlay instanceof OverlayClass)) {
			overlay = new OverlayClass(options).setContent(content);
		}
		if (latlng) {
			overlay.setLatLng(latlng);
		}
		return overlay;
	}
};
/** @typedef {typeof mapDivOverlayMethods} MapDivOverlayMethods */

/**
 * Methods of `Layer` for overlays.
 * @lends Layer.prototype
 */
const layerDivOverlayMethods = {
	_initOverlay(OverlayClass, old, content, options) {
		let overlay = content;
		if (overlay instanceof OverlayClass) {
			Util.setOptions(overlay, options);
			overlay._source = this;
		} else {
			overlay = (old && !options) ? old : new OverlayClass(options, this);
			overlay.setContent(content);
		}
		return overlay;
	}
};
/** @typedef {typeof layerDivOverlayMethods} LayerDivOverlayMethods */

/**
 * Base model for Popup and Tooltip. Inherit from it for custom overlays like plugins.
 *
 * @fires contentupdate {MaplairEvent} Fired when the content of the overlay is updated.
 */
export class DivOverlay extends Layer {

	static defaultOptions = {
		interactive: false,
		offset: [0, 0],
		className: '',
		pane: undefined,
		overflow: false,
		content: ''
	};

	/**
	 * Instantiates an overlay given an optional `options` object that describes its
	 * appearance and location and an optional `source` object that is used to tag the
	 * overlay with a reference to the Layer to which it refers.
	 * @overload
	 * @param {DivOverlayOptions} [options]
	 * @param {Layer} [source]
	 */
	/**
	 * Instantiates an overlay given `latlng` where the overlay will open and an
	 * optional `options` object that describes its appearance and location.
	 * @overload
	 * @param {LatLngExpression} latlng
	 * @param {DivOverlayOptions} [options]
	 */
	/**
	 * @param {DivOverlayOptions|LatLngExpression} [options]
	 * @param {Layer|DivOverlayOptions} [source]
	 */
	constructor(options, source) {
		super();
		if (options instanceof LatLng || Array.isArray(options)) {
			this._latlng = new LatLng(options);
			Util.setOptions(this, source);
		} else {
			Util.setOptions(this, options);
			this._source = source;
		}
		if (this.options.content) {
			this._content = this.options.content;
		}

		this.callInitHooks(DivOverlay);
	}

	/**
	 * Adds the overlay to the map.
	 * Alternative to `map.openPopup(popup)`/`.openTooltip(tooltip)`.
	 * @param {MaplairMap} map
	 * @returns {this}
	 */
	openOn(map) {
		map = arguments.length ? map : this._source._map; // experimental, not the part of public api
		if (!map.hasLayer(this)) {
			map.addLayer(this);
		}
		return this;
	}

	/**
	 * Closes the overlay.
	 * Alternative to `map.closePopup(popup)`/`.closeTooltip(tooltip)`
	 * and `layer.closePopup()`/`.closeTooltip()`.
	 * @returns {this}
	 */
	close() {
		this._map?.removeLayer(this);
		return this;
	}

	/**
	 * Opens or closes the overlay bound to layer depending on its current state.
	 * Argument may be omitted only for overlay bound to layer.
	 * Alternative to `layer.togglePopup()`/`.toggleTooltip()`.
	 * @param {Layer} [layer]
	 * @returns {this}
	 */
	toggle(layer) {
		if (this._map) {
			this.close();
		} else {
			if (arguments.length) {
				this._source = layer;
			} else {
				layer = this._source;
			}
			this._prepareOpen();

			// open the overlay on the map
			this.openOn(layer._map);
		}
		return this;
	}

	/**
	 * Adds the overlay to the map.
	 * @param {MaplairMap} map
	 */
	onAdd(map) {
		if (!this._container) {
			this._initLayout();
		}

		if (map._fadeAnimated) {
			this._container.style.opacity = '0';
		}

		clearTimeout(this._removeTimeout);
		this.getPane().appendChild(this._container);
		if (this.options.overflow) {
			this._container.classList.add('maplair-overflow');
			this._container.popover = 'manual';
			this._container.showPopover();
			// The map pane does not carry the overlay, it has to follow the page and the map
			this._onPageChange ??= () => this._updatePosition();
			document.addEventListener('scroll', this._onPageChange, {capture: true, passive: true});
			window.addEventListener('resize', this._onPageChange, {passive: true});
		}
		this.update();

		if (map._fadeAnimated) {
			this._container.style.opacity = '1';
		}

		// A popover is shown on top already, re-showing it would skip the fade animation
		if (!this.options.overflow) {
			this.bringToFront();
		}

		if (this.options.interactive) {
			this._container.classList.add('maplair-interactive');
			this.addInteractiveTarget(this._container);
		}
	}

	/**
	 * Removes the overlay from the map.
	 * @param {MaplairMap} map
	 */
	onRemove(map) {
		if (this.options.overflow) {
			document.removeEventListener('scroll', this._onPageChange, {capture: true});
			window.removeEventListener('resize', this._onPageChange);
		}

		if (map._fadeAnimated) {
			this._container.style.opacity = '0';
			this._removeTimeout = setTimeout(() => this._container.remove(), 200);
		} else {
			this._container.remove();
		}

		if (this.options.interactive) {
			this._container.classList.remove('maplair-interactive');
			this.removeInteractiveTarget(this._container);
		}
	}

	_updateInteractive() {
		this._container.classList.toggle('maplair-interactive', this.options.interactive);
		if (this.options.interactive) {
			this.addInteractiveTarget(this._container);
		} else {
			this.removeInteractiveTarget(this._container);
		}
	}

	/**
	 * Returns the geographical point of the overlay.
	 * @returns {LatLng}
	 */
	getLatLng() {
		return this._latlng;
	}

	/**
	 * Sets the geographical point where the overlay will open.
	 * @param {LatLngExpression} latlng
	 * @returns {this}
	 */
	setLatLng(latlng) {
		this._latlng = new LatLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	}

	/**
	 * Returns the content of the overlay.
	 * @returns {DivOverlayContent}
	 */
	getContent() {
		return this._content;
	}

	/**
	 * Sets the HTML content of the overlay. A `String` argument is rendered as
	 * HTML; if it may contain untrusted input, sanitize it (e.g. with DOMPurify)
	 * or pass an `HTMLElement` with safe `textContent` instead. If a function is
	 * passed the source layer will be passed to the function. The function should
	 * return a `String` or `HTMLElement` to be used in the overlay.
	 * @param {DivOverlayContent} content
	 * @returns {this}
	 */
	setContent(content) {
		this._content = content;
		this.update();
		return this;
	}

	/**
	 * Returns the HTML container of the overlay.
	 * @returns {HTMLElement}
	 */
	getElement() {
		return this._container;
	}

	/**
	 * Updates the overlay content, layout and position. Useful for updating the
	 * overlay after something inside changed, e.g. image loaded.
	 * @returns {void}
	 */
	update() {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	}

	/**
	 * Returns the map events the overlay listens to.
	 * @returns {Record<string, EventListener>}
	 */
	getEvents() {
		const events = {
			zoom: this._updatePosition,
			viewreset: this._updatePosition,
			zoomanim: this._animateZoom
		};

		if (this.options.overflow) {
			events.move = this._updatePosition;
		}
		return events;
	}

	/**
	 * Returns `true` when the overlay is visible on the map.
	 * @returns {boolean}
	 */
	isOpen() {
		return !!this._map && this._map.hasLayer(this);
	}

	/**
	 * Brings this overlay in front of other overlays (in the same map pane).
	 * @returns {this}
	 */
	bringToFront() {
		if (this._map) {
			DomUtil.toFront(this._container);
			this._restackPopovers();
		}
		return this;
	}

	/**
	 * Brings this overlay to the back of other overlays (in the same map pane).
	 * @returns {this}
	 */
	bringToBack() {
		if (this._map) {
			DomUtil.toBack(this._container);
			this._restackPopovers();
		}
		return this;
	}

	// Popovers are stacked in the order they are shown, not in DOM order. Moving
	// a popover in the DOM hides it, so (re-)show the overflowing overlays of
	// the pane in DOM order.
	_restackPopovers() {
		if (!this.options.overflow) { return; }
		for (const el of this.getPane().children) {
			if (!el.classList.contains('maplair-overflow')) { continue; }
			if (el.matches(':popover-open')) {
				el.hidePopover();
			}
			el.showPopover();
		}
	}

	// prepare bound overlay to open: update latlng pos / content source (for FeatureGroup)
	_prepareOpen(latlng) {
		let source = this._source;
		if (!source._map) { return false; }

		if (source instanceof FeatureGroup) {
			source = null;
			for (const layer of Object.values(this._source._layers)) {
				if (layer._map) {
					source = layer;
					break;
				}
			}
			if (!source) { return false; } // Unable to get source layer.

			// set overlay source to this layer
			this._source = source;
		}

		if (!latlng) {
			if (source.getCenter) {
				latlng = source.getCenter();
			} else if (source.getLatLng) {
				latlng = source.getLatLng();
			} else if (source.getBounds) {
				latlng = source.getBounds().getCenter();
			} else {
				throw new Error('Unable to get source layer LatLng.');
			}
		}
		this.setLatLng(latlng);

		if (this._map) {
			// update the overlay (content, layout, etc...)
			this.update();
		}

		return true;
	}

	_updateContent() {
		if (!this._content) { return; }

		const node = this._contentNode;
		const content = (typeof this._content === 'function') ? this._content(this._source ?? this) : this._content;

		if (typeof content === 'string') {
			node.innerHTML = content;
		} else {
			while (node.hasChildNodes()) {
				node.removeChild(node.firstChild);
			}
			node.appendChild(content);
		}

		this.fire('contentupdate');
	}

	_updatePosition() {
		if (!this._map) { return; }

		const pos = this._map.latLngToLayerPoint(this._latlng)._round(),
		offset = Point.from(this.options.offset);

		this._setContainerPosition(pos.add(this._getAnchor()));

		const bottom = this._containerBottom = -offset.y,
		left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

		// bottom position the overlay in case the height of the overlay changes (images loading etc)
		if (this.options.overflow) {
			// relative to the top of the viewport instead of the pane origin
			this._container.style.top = 'auto';
			this._container.style.bottom = `calc(100% + ${bottom}px)`;
		} else {
			this._container.style.bottom = `${bottom}px`;
		}
		this._container.style.left = `${left}px`;
	}

	// Positions the container at the given layer point. An overflowing overlay
	// lives in the top layer of the page, so it is positioned in viewport coordinates.
	_setContainerPosition(pos) {
		this._containerPos = pos;
		if (this.options.overflow) {
			const mapContainer = this._map._container,
			rect = mapContainer.getBoundingClientRect();
			pos = this._map.layerPointToContainerPoint(pos)
				._add(new Point(rect.left + mapContainer.clientLeft, rect.top + mapContainer.clientTop));
		}
		DomUtil.setPosition(this._container, pos);
	}

	// Returns the layer point the container was positioned at, see `_setContainerPosition`.
	_getContainerPosition() {
		return this._containerPos ?? new Point(0, 0);
	}

	_getAnchor() {
		return [0, 0];
	}

	/**
	 * Registers this default feature on the map class, called by `MaplairMap` itself.
	 * @internal
	 * @param {typeof MaplairMap} MaplairMap
	 */
	static register(MaplairMap) {
		MaplairMap.include(mapDivOverlayMethods);

		Layer.include(layerDivOverlayMethods);
	}
}
