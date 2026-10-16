import {Layer} from './Layer.js';
import {FeatureGroup} from './FeatureGroup.js';
import * as Util from '../core/Util.js';
import {LatLng} from '../geo/LatLng.js';
import {Point} from '../geometry/Point.js';
import * as DomUtil from '../dom/DomUtil.js';

/*
 * @class DivOverlay
 * @inherits Interactive layer
 * Base model for Popup and Tooltip. Inherit from it for custom overlays like plugins.
 */

// @namespace DivOverlay
export class DivOverlay extends Layer {

	static {
		// @section
		// @aka DivOverlay options
		this.setDefaultOptions({
			// @option interactive: Boolean = false
			// If true, the popup/tooltip will listen to the pointer events.
			interactive: false,

			// @option offset: Point = Point(0, 0)
			// The offset of the overlay position.
			offset: [0, 0],

			// @option className: String = ''
			// A custom CSS class name to assign to the overlay.
			className: '',

			// @option pane: String = undefined
			// `Map pane` where the overlay will be added.
			pane: undefined,

			// @option overflow: Boolean = false
			// Whether the overlay may extend beyond the map container, e.g. a tooltip
			// of a marker near the edge of a small map. The overlay is then shown as
			// [popover](https://developer.mozilla.org/docs/Web/API/Popover_API) in the
			// top layer of the page, above all other content, while remaining in its
			// map pane in the DOM (for styling and events).
			overflow: false,

			// @option content: String|HTMLElement|Function = ''
			// Sets the HTML content of the overlay while initializing. If a function is passed the source layer will be
			// passed to the function. The function should return a `String` or `HTMLElement` to be used in the overlay.
			// String content is rendered as HTML; sanitize untrusted input or pass an `HTMLElement` with safe `textContent` instead.
			content: ''
		});
	}

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

	// @method openOn(map: MaplairMap): this
	// Adds the overlay to the map.
	// Alternative to `map.openPopup(popup)`/`.openTooltip(tooltip)`.
	openOn(map) {
		map = arguments.length ? map : this._source._map; // experimental, not the part of public api
		if (!map.hasLayer(this)) {
			map.addLayer(this);
		}
		return this;
	}

	// @method close(): this
	// Closes the overlay.
	// Alternative to `map.closePopup(popup)`/`.closeTooltip(tooltip)`
	// and `layer.closePopup()`/`.closeTooltip()`.
	close() {
		this._map?.removeLayer(this);
		return this;
	}

	// @method toggle(layer?: Layer): this
	// Opens or closes the overlay bound to layer depending on its current state.
	// Argument may be omitted only for overlay bound to layer.
	// Alternative to `layer.togglePopup()`/`.toggleTooltip()`.
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

	onAdd(map) {
		this._zoomAnimated = map._zoomAnimated;

		if (!this._container) {
			this._initLayout();
		}

		if (map._fadeAnimated) {
			this._container.style.opacity = 0;
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
			this._container.style.opacity = 1;
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

	onRemove(map) {
		if (this.options.overflow) {
			document.removeEventListener('scroll', this._onPageChange, {capture: true});
			window.removeEventListener('resize', this._onPageChange);
		}

		if (map._fadeAnimated) {
			this._container.style.opacity = 0;
			this._removeTimeout = setTimeout(() => this._container.remove(), 200);
		} else {
			this._container.remove();
		}

		if (this.options.interactive) {
			this._container.classList.remove('maplair-interactive');
			this.removeInteractiveTarget(this._container);
		}
	}

	// @namespace DivOverlay
	// @method getLatLng: LatLng
	// Returns the geographical point of the overlay.
	getLatLng() {
		return this._latlng;
	}

	// @method setLatLng(latlng: LatLng): this
	// Sets the geographical point where the overlay will open.
	setLatLng(latlng) {
		this._latlng = new LatLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	}

	// @method getContent: String|HTMLElement|Function)
	// Returns the content of the overlay.
	getContent() {
		return this._content;
	}

	// @method setContent(htmlContent: String|HTMLElement|Function): this
	// Sets the HTML content of the overlay. A `String` argument is rendered as
	// HTML; if it may contain untrusted input, sanitize it (e.g. with DOMPurify)
	// or pass an `HTMLElement` with safe `textContent` instead. If a function is
	// passed the source layer will be passed to the function. The function should
	// return a `String` or `HTMLElement` to be used in the overlay.
	setContent(content) {
		this._content = content;
		this.update();
		return this;
	}

	// @method getElement: HTMLElement
	// Returns the HTML container of the overlay.
	getElement() {
		return this._container;
	}

	// @method update: null
	// Updates the overlay content, layout and position. Useful for updating the overlay after something inside changed, e.g. image loaded.
	update() {
		if (!this._map) { return; }

		this._container.style.visibility = 'hidden';

		this._updateContent();
		this._updateLayout();
		this._updatePosition();

		this._container.style.visibility = '';

		this._adjustPan();
	}

	getEvents() {
		const events = {
			zoom: this._updatePosition,
			viewreset: this._updatePosition
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}
		if (this.options.overflow) {
			events.move = this._updatePosition;
		}
		return events;
	}

	// @method isOpen: Boolean
	// Returns `true` when the overlay is visible on the map.
	isOpen() {
		return !!this._map && this._map.hasLayer(this);
	}

	// @method bringToFront: this
	// Brings this overlay in front of other overlays (in the same map pane).
	bringToFront() {
		if (this._map) {
			DomUtil.toFront(this._container);
			this._restackPopovers();
		}
		return this;
	}

	// @method bringToBack: this
	// Brings this overlay to the back of other overlays (in the same map pane).
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

		// @namespace DivOverlay
		// @section DivOverlay events
		// @event contentupdate: Event
		// Fired when the content of the overlay is updated
		this.fire('contentupdate');
	}

	_updatePosition() {
		if (!this._map) { return; }

		const pos = this._map.latLngToLayerPoint(this._latlng),
		anchor = this._getAnchor();
		let offset = new Point(this.options.offset);

		if (this._zoomAnimated || this.options.overflow) {
			this._setContainerPosition(pos.add(anchor));
		} else {
			offset = offset.add(pos).add(anchor);
		}

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

	// Registers this default feature on the map class, called by `MaplairMap` itself.
	static register(MaplairMap) {
		MaplairMap.include({
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
		});

		Layer.include({
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
		});
	}
}
