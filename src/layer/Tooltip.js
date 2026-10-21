import {DivOverlay} from './DivOverlay.js';
import {Point} from '../geometry/Point.js';
import {Layer} from './Layer.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import * as Util from '../core/Util.js';
import {FeatureGroup} from './FeatureGroup.js';

const directions = ['top', 'bottom', 'center', 'right', 'left'];

// The size of the tooltip tip (see `.maplair-tooltip-top` etc. in maplair.css) and
// the minimum distance of an `auto` tooltip to the edge of the map.
const tipSize = 6,
autoPadding = 4;

// The shift moving a box from `start` with `size` into the range `[min, max]`.
function shiftInto(start, size, min, max) {
	return Math.max(0, min - start) - Math.max(0, start + size - max);
}

// Keeps the shifted tip off the rounded corners of the tooltip.
function clampTip(tipShift, size) {
	const max = Math.max(0, size / 2 - 2 * tipSize);
	return Math.round(Math.min(max, Math.max(-max, tipShift)));
}

/** @import {DivOverlayOptions, DivOverlayContent} from './DivOverlay.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, TooltipEvent} from '../core/Events.js' */

/**
 * Options of `Tooltip`.
 * @typedef {object} TooltipOptions
 * @property {string} [pane='tooltipPane'] `Map pane` where the tooltip will be added.
 * @property {PointExpression} [offset=[0, 0]] Optional offset of the tooltip position.
 * @property {'right'|'left'|'top'|'bottom'|'center'|'auto'} [direction='auto']
 * Direction where to open the tooltip. Possible values are: `right`, `left`, `top`,
 * `bottom`, `center`, `auto`. `auto` chooses the direction with enough space when
 * opening the tooltip: preferably the side towards the center of the map (`right` or
 * `left`), otherwise the opposite side, `top` or `bottom`. The tooltip is shifted
 * along that side to stay within the map (within the viewport if `overflow` is set),
 * its tip still pointing at the source.
 * @property {boolean} [permanent=false] Whether to open the tooltip permanently or only
 * on pointerover.
 * @property {boolean} [sticky=false] If true, the tooltip will follow the pointer
 * instead of being fixed at the feature center.
 * @property {number} [opacity=0.9] Tooltip container opacity.
 * @extends DivOverlayOptions
 */

/**
 * Methods of `MaplairMap` for tooltips.
 * @lends MaplairMap.prototype
 * @fires MaplairMap#tooltipopen {TooltipEvent} Fired when a tooltip is opened in the map.
 * @fires MaplairMap#tooltipclose {TooltipEvent} Fired when a tooltip in the map is closed.
 */
const mapTooltipMethods = {
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
	openTooltip(tooltip, latlng, options) {
		// eslint-disable-next-line no-use-before-define -- defined below, used when called
		this._initOverlay(Tooltip, tooltip, latlng, options)
			.openOn(this);

		return this;
	},

	/**
	 * Closes the tooltip given as parameter.
	 * @group Methods for layers and controls
	 * @param {Tooltip} tooltip
	 * @returns {this}
	 */
	closeTooltip(tooltip) {
		tooltip.close();
		return this;
	}
};
/** @typedef {typeof mapTooltipMethods} MapTooltipMethods */

/**
 * Methods of `Layer` for tooltips. All layers share a set of methods convenient for
 * binding tooltips to it.
 *
 * ```js
 * const layer = new Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
 * layer.openTooltip();
 * layer.closeTooltip();
 * ```
 *
 * @lends Layer.prototype
 * @fires Layer#tooltipopen {TooltipEvent} Fired when a tooltip bound to this layer is
 * opened.
 * @fires Layer#tooltipclose {TooltipEvent} Fired when a tooltip bound to this layer is
 * closed.
 */
const layerTooltipMethods = {
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
	bindTooltip(content, options) {

		if (this._tooltip && this.isTooltipOpen()) {
			this.unbindTooltip();
		}

		// eslint-disable-next-line no-use-before-define -- defined below, used when called
		this._tooltip = this._initOverlay(Tooltip, this._tooltip, content, options);
		this._initTooltipInteractions();

		if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
			this.openTooltip();
		}

		return this;
	},

	/**
	 * Removes the tooltip previously bound with `bindTooltip`.
	 * @group Tooltip methods
	 * @returns {this}
	 */
	unbindTooltip() {
		if (this._tooltip) {
			this._initTooltipInteractions(true);
			this.closeTooltip();
			this._tooltip = null;
		}
		return this;
	},

	_initTooltipInteractions(remove) {
		if (!remove && this._tooltipHandlersAdded) { return; }
		const onOff = remove ? 'off' : 'on',
		events = {
			remove: this.closeTooltip,
			move: this._moveTooltip
		};
		if (!this._tooltip.options.permanent) {
			events.pointerover = this._openTooltip;
			events.pointerout = this.closeTooltip;
			events.click = this._openTooltip;
			if (this._map) {
				this._addFocusListeners(remove);
			} else {
				events.add = () => this._addFocusListeners(remove);
			}
		} else {
			events.add = this._openTooltip;
		}
		if (this._tooltip.options.sticky) {
			events.pointermove = this._moveTooltip;
		}
		this[onOff](events);
		this._tooltipHandlersAdded = !remove;
	},

	/**
	 * Opens the bound tooltip at the specified `latlng` or at the default tooltip
	 * anchor if no `latlng` is passed.
	 * @group Tooltip methods
	 * @param {LatLngExpression} [latlng]
	 * @returns {this}
	 */
	openTooltip(latlng) {
		if (this._tooltip) {
			if (!(this instanceof FeatureGroup)) {
				this._tooltip._source = this;
			}
			if (this._tooltip._prepareOpen(latlng)) {
				// open the tooltip on the map
				this._tooltip.openOn(this._map);

				if (this.getElement) {
					this._setAriaDescribedByOnLayer(this);
				} else if (this.eachLayer) {
					this.eachLayer(this._setAriaDescribedByOnLayer, this);
				}
			}
		}
		return this;
	},

	/**
	 * Closes the tooltip bound to this layer if it is open. Returns the bound tooltip
	 * (not the layer), or `undefined` without one.
	 * @group Tooltip methods
	 * @returns {Tooltip|undefined}
	 */
	closeTooltip() {
		if (this._tooltip) {
			return this._tooltip.close();
		}
	},

	/**
	 * Opens or closes the tooltip bound to this layer depending on its current state.
	 * @group Tooltip methods
	 * @returns {this}
	 */
	toggleTooltip() {
		this._tooltip?.toggle(this);
		return this;
	},

	/**
	 * Returns `true` if the tooltip bound to this layer is currently open.
	 * @group Tooltip methods
	 * @returns {boolean}
	 */
	isTooltipOpen() {
		return this._tooltip.isOpen();
	},

	/**
	 * Sets the content of the tooltip bound to this layer. String content is rendered
	 * as HTML; sanitize untrusted input or pass an `HTMLElement` with safe
	 * `textContent` instead.
	 * @group Tooltip methods
	 * @param {DivOverlayContent} content
	 * @returns {this}
	 */
	setTooltipContent(content) {
		this._tooltip?.setContent(content);
		return this;
	},

	/**
	 * Returns the tooltip bound to this layer.
	 * @group Tooltip methods
	 * @returns {Tooltip|undefined}
	 */
	getTooltip() {
		return this._tooltip;
	},

	_addFocusListeners(remove) {
		if (this.getElement) {
			this._addFocusListenersOnLayer(this, remove);
		} else if (this.eachLayer) {
			this.eachLayer(layer => this._addFocusListenersOnLayer(layer, remove), this);
		}
	},

	_addFocusListenersOnLayer(layer, remove) {
		const el = typeof layer.getElement === 'function' && layer.getElement();
		if (el) {
			const toggle = remove ? DomEvent.off : DomEvent.on;
			if (!remove) {
				// Remove focus listener, if already existing
				el._maplair_focus_handler && DomEvent.off(el, 'focus', el._maplair_focus_handler, this);

				el._maplair_focus_handler = () => {
					if (this._tooltip) {
						this._tooltip._source = layer;
						this.openTooltip();
					}
				};
			}

			el._maplair_focus_handler && toggle(el, 'focus', el._maplair_focus_handler, this);
			toggle(el, 'blur', this.closeTooltip, this);

			if (remove) {
				delete el._maplair_focus_handler;
			}
		}
	},

	_setAriaDescribedByOnLayer(layer) {
		const el = typeof layer.getElement === 'function' && layer.getElement();
		el?.setAttribute?.('aria-describedby', this._tooltip._container.id);
	},

	_openTooltip(e) {
		if (!this._tooltip || !this._map) {
			return;
		}

		// If the map is moving, we will show the tooltip after it's done.
		if (this._map.dragging?.moving()) {
			if (e.type === 'add' && !this._moveEndOpensTooltip) {
				this._moveEndOpensTooltip = true;
				this._map.once('moveend', () => {
					this._moveEndOpensTooltip = false;
					this._openTooltip(e);
				});
			}
			return;
		}

		this._tooltip._source = e.propagatedFrom ?? e.target;

		this.openTooltip(this._tooltip.options.sticky ? e.latlng : undefined);
	},

	_moveTooltip(e) {
		let latlng = e.latlng, containerPoint, layerPoint;
		if (this._tooltip.options.sticky && e.originalEvent) {
			containerPoint = this._map.pointerEventToContainerPoint(e.originalEvent);
			layerPoint = this._map.containerPointToLayerPoint(containerPoint);
			latlng = this._map.layerPointToLatLng(layerPoint);
		}
		this._tooltip.setLatLng(latlng);
	}
};
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

	static defaultOptions = {
		pane: 'tooltipPane',
		offset: [0, 0],
		direction: 'auto',
		permanent: false,
		sticky: false,
		opacity: 0.9
	};

	/**
	 * Instantiates a `Tooltip` object given an optional `options` object that describes
	 * its appearance and location and an optional `source` object that is used to tag
	 * the tooltip with a reference to the Layer to which it refers.
	 * @overload
	 * @param {TooltipOptions} [options]
	 * @param {Layer} [source]
	 */
	/**
	 * Instantiates a `Tooltip` object given `latlng` where the tooltip will open and an
	 * optional `options` object that describes its appearance and location.
	 * @overload
	 * @param {LatLngExpression} latlng
	 * @param {TooltipOptions} [options]
	 */
	/**
	 * @param {...any} args
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(Tooltip);
	}

	/**
	 * Adds the tooltip to the map.
	 * @param {MaplairMap} map
	 */
	onAdd(map) {
		super.onAdd(map);
		this.setOpacity(this.options.opacity);

		map.fire('tooltipopen', {tooltip: this});

		if (this._source) {
			this.addEventParent(this._source);

			this._source.fire('tooltipopen', {tooltip: this}, true);
		}
	}

	/**
	 * Removes the tooltip from the map.
	 * @param {MaplairMap} map
	 */
	onRemove(map) {
		super.onRemove(map);

		map.fire('tooltipclose', {tooltip: this});

		if (this._source) {
			this.removeEventParent(this._source);

			this._source.fire('tooltipclose', {tooltip: this}, true);
		}
	}

	/**
	 * Returns the map events the tooltip listens to.
	 * @returns {Record<string, EventListener>}
	 */
	getEvents() {
		const events = super.getEvents();

		if (!this.options.permanent) {
			events.preclick = this.close;
		}

		return events;
	}

	_initLayout() {
		const prefix = 'maplair-tooltip',
		className = `${prefix} ${this.options.className || ''} maplair-zoom-animated`;

		this._contentNode = this._container = DomUtil.create('div', className);

		this._container.setAttribute('role', 'tooltip');
		this._container.setAttribute('id', `maplair-tooltip-${Util.stamp(this)}`);
	}

	_updateLayout() {}

	_adjustPan() {}

	/**
	 * Updates the tooltip content, layout and position.
	 * @returns {void}
	 */
	update() {
		// The automatic direction is chosen once per opening and content, so that
		// the tooltip does not flip sides while the map or the pointer moves.
		this._autoDirection = undefined;
		super.update();
	}

	_setPosition(pos) {
		let direction = this.options.direction,
		shift = new Point(0, 0);
		const container = this._container,
		tooltipWidth = container.offsetWidth,
		tooltipHeight = container.offsetHeight,
		offset = new Point(this.options.offset),
		anchor = this._getAnchor();

		if (!directions.includes(direction)) {
			({direction, shift} = this._getAutoPlacement(pos, offset, anchor, tooltipWidth, tooltipHeight));
			if (direction === 'left') {
				// mirror the offset and anchor, which are meant for the right side
				offset.x = -offset.x;
				anchor.x = -anchor.x;
			}
		}

		let subX = tooltipWidth / 2,
		subY = tooltipHeight / 2;
		if (direction === 'top') {
			subY = tooltipHeight;
		} else if (direction === 'bottom') {
			subY = 0;
		} else if (direction === 'right') {
			subX = 0;
		} else if (direction === 'left') {
			subX = tooltipWidth;
		}

		pos = pos.subtract(new Point(subX, subY, true)).add(offset).add(anchor).add(shift);

		container.classList.remove(
			'maplair-tooltip-right',
			'maplair-tooltip-left',
			'maplair-tooltip-top',
			'maplair-tooltip-bottom'
		);
		container.classList.add(`maplair-tooltip-${direction}`);

		// Let the tip point at the source despite the shift
		const tipShift = direction === 'top' || direction === 'bottom' ?
			clampTip(-shift.x, tooltipWidth) :
			clampTip(-shift.y, tooltipHeight);
		if (tipShift) {
			container.style.setProperty('--maplair-tooltip-tip-shift', `${tipShift}px`);
		} else {
			container.style.removeProperty('--maplair-tooltip-tip-shift');
		}

		this._setContainerPosition(pos);
	}

	// Chooses the direction of an `auto` tooltip by the available space:
	// preferably the side towards the center, otherwise the opposite side,
	// above or below. The tooltip is shifted along that side to stay in view.
	_getAutoPlacement(pos, offset, anchor, width, height) {
		const area = this._getAutoArea(),
		point = this._map.layerPointToContainerPoint(pos),
		x = point.x + offset.x + anchor.x,
		y = point.y + offset.y + anchor.y,
		// the space for each direction, see `direction` for the mirrored left side
		space = {
			right: area.max.x - x - width - tipSize,
			left: point.x - offset.x - anchor.x - area.min.x - width - tipSize,
			top: y - area.min.y - height - tipSize,
			bottom: area.max.y - y - height - tipSize
		};

		if (!this._autoDirection) {
			const sides = point.x < (area.min.x + area.max.x) / 2 ? ['right', 'left'] : ['left', 'right'],
			fallback = space.right >= space.left ? 'right' : 'left';
			this._autoDirection = [...sides, 'top', 'bottom'].find(d => space[d] >= 0 &&
				// above or below, the tooltip has to fit horizontally
				(d === 'right' || d === 'left' || width <= area.max.x - area.min.x)) ?? fallback;
		}

		const direction = this._autoDirection,
		shift = direction === 'top' || direction === 'bottom' ?
			new Point(shiftInto(x - width / 2, width, area.min.x, area.max.x), 0) :
			new Point(0, shiftInto(y - height / 2, height, area.min.y, area.max.y));

		return {direction, shift};
	}

	// The area in container points an `auto` tooltip should stay within:
	// the map, or the viewport for an overflowing tooltip.
	_getAutoArea() {
		const map = this._map;
		let min = new Point(0, 0),
		max = map.getSize();
		if (this.options.overflow) {
			const mapContainer = map._container,
			rect = mapContainer.getBoundingClientRect(),
			origin = new Point(rect.left + mapContainer.clientLeft, rect.top + mapContainer.clientTop),
			viewport = document.documentElement;
			min = min.subtract(origin);
			max = new Point(viewport.clientWidth, viewport.clientHeight).subtract(origin);
		}
		const padding = new Point(autoPadding, autoPadding);
		return {min: min.add(padding), max: max.subtract(padding)};
	}

	_updatePosition() {
		const pos = this._map.latLngToLayerPoint(this._latlng);
		this._setPosition(pos);
	}

	/**
	 * Sets the opacity of the tooltip.
	 * @param {number} opacity
	 * @returns {void}
	 */
	setOpacity(opacity) {
		this.options.opacity = opacity;

		if (this._container) {
			this._container.style.opacity = opacity;
		}
	}

	_animateZoom(e) {
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
		this._setPosition(pos);
	}

	_getAnchor() {
		// Where should we anchor the tooltip on the source layer?
		return new Point(this._source?._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
	}

	/**
	 * Registers this default feature on the map class, called by `MaplairMap` itself.
	 * @internal
	 * @param {typeof MaplairMap} MaplairMap
	 */
	static register(MaplairMap) {
		MaplairMap.include(mapTooltipMethods);

		Layer.include(layerTooltipMethods);
	}
}
