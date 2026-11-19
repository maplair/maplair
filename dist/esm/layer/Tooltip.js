import { splitWords, stamp } from "../core/Util.js";
import { Point } from "../geometry/Point.js";
import { off, on } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Layer } from "./Layer.js";
import { FeatureGroup } from "./FeatureGroup.js";
import { DivOverlay } from "./DivOverlay.js";
// src/layer/Tooltip.js
const directions = {
	top: [.5, 1],
	bottom: [.5, 0],
	center: [.5, .5],
	right: [0, .5],
	left: [1, .5]
};
const tipSize = 6;
const autoPadding = 4;
function shiftInto(start, size, min, max) {
	return Math.max(0, min - start) - Math.max(0, start + size - max);
}
function clampTip(tipShift, size) {
	const max = Math.max(0, size / 2 - 12);
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
* @property {PointExpression} [offset=[0, 0]] Optional offset of the tooltip position, in
* pixels. Mirrored horizontally when an `auto` tooltip opens to the left.
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
		this._initOverlay(Tooltip, tooltip, latlng, options).openOn(this);
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
	* may contain untrusted input, sanitize it or pass an `HTMLElement` with safe
	* `textContent` instead. If a `Function` is passed
	* it will receive the layer as the first argument and should return a
	* `String`, `HTMLElement` or `DocumentFragment`.
	* @group Tooltip methods
	* @param {DivOverlayContent|Tooltip} content
	* @param {TooltipOptions} [options]
	* @returns {this}
	*/
	bindTooltip(content, options) {
		const old = this.isTooltipOpen() ? null : this._tooltip;
		if (this._tooltip) this.unbindTooltip();
		this._tooltip = this._initOverlay(Tooltip, old, content, options);
		this._initTooltipInteractions();
		if (this._tooltip.options.permanent && this._map?.hasLayer(this)) this.openTooltip();
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
		const { permanent, sticky } = this._tooltip.options, events = {
			remove: this.closeTooltip,
			move: this._moveTooltip
		};
		if (permanent) events.add = this._openTooltip;
		else {
			events.pointerover = this._openTooltip;
			events.pointerout = this.closeTooltip;
			events.click = this._openTooltip;
			events.add = this._toggleFocusListeners;
			if (this._map) this._toggleFocusListeners(!remove);
		}
		if (sticky) events.pointermove = this._moveTooltip;
		this[remove ? "off" : "on"](events);
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
			if (!(this instanceof FeatureGroup)) this._tooltip._source = this;
			if (this._tooltip._prepareOpen(latlng)) this._tooltip.openOn(this._map);
		}
		return this;
	},
	/**
	* Closes the tooltip bound to this layer if it is open.
	* @group Tooltip methods
	* @returns {this}
	*/
	closeTooltip() {
		this._tooltip?.close();
		return this;
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
		return this._tooltip?.isOpen() ?? false;
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
	_toggleFocusListeners(add) {
		if (this.getElement) this._addFocusListenersOnLayer(this, !add);
		else if (this.eachLayer) this.eachLayer((layer) => this._addFocusListenersOnLayer(layer, !add), this);
	},
	_addFocusListenersOnLayer(layer, remove) {
		const el = typeof layer.getElement === "function" && layer.getElement();
		if (el) {
			const toggle = remove ? off : on;
			if (!remove) {
				el._maplair_focus_handler && off(el, "focus", el._maplair_focus_handler, this);
				el._maplair_focus_handler = () => {
					if (this._tooltip && el.matches(":focus-visible")) {
						this._tooltip._source = layer;
						this.openTooltip();
					}
				};
			}
			el._maplair_focus_handler && toggle(el, "focus", el._maplair_focus_handler, this);
			toggle(el, "blur", this.closeTooltip, this);
			if (remove) delete el._maplair_focus_handler;
		}
	},
	_openTooltip(e) {
		if (!this._tooltip || !this._map) return;
		if (this._map.dragging?.moving()) {
			if (e.type === "add" && !this._moveEndOpensTooltip) {
				this._moveEndOpensTooltip = true;
				this._map.once("moveend", () => {
					this._moveEndOpensTooltip = false;
					this._openTooltip(e);
				});
			}
			return;
		}
		const source = this._tooltip._source = e.propagatedFrom ?? e.target;
		let latlng = this._tooltip.options.sticky ? e.latlng : void 0;
		if (!latlng && e.latlng && source.getCenter && !this._map.getBounds().contains(source.getCenter())) latlng = e.latlng;
		this.openTooltip(latlng);
	},
	_moveTooltip(e) {
		this._tooltip.setLatLng(this._tooltip.options.sticky && e.originalEvent ? this._map.pointerEventToLatLng(e.originalEvent) : e.latlng);
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
* it first, or build a DOM element using `textContent` to render it as plain text:
*
* ```js
* const el = document.createElement('div');
* el.textContent = untrustedString;
* marker.bindTooltip(el);
* ```
*
* Browsers with the [Sanitizer API](https://developer.mozilla.org/docs/Web/API/HTML_Sanitizer_API)
* can keep the safe markup of untrusted HTML instead:
*
* ```js
* const el = document.createElement('div');
* if ('setHTML' in el) {
* 	el.setHTML(untrustedHTML); // removes scripts, event handlers and other unsafe markup
* } else {
* 	el.textContent = untrustedHTML;
* }
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
var Tooltip = class Tooltip extends DivOverlay {
	static defaultOptions = {
		pane: "tooltipPane",
		offset: [0, 0],
		direction: "auto",
		permanent: false,
		sticky: false,
		opacity: .9
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
		map.fire("tooltipopen", { tooltip: this });
		if (this._source) {
			this.addEventParent(this._source);
			this._ariaSource = this._source.getElement?.();
			if (this._ariaSource) updateDescribedBy(this._ariaSource, this._container.id, true);
			if (!this.options.permanent) {
				this._onEscape ??= this._closeOnEscape.bind(this);
				document.addEventListener("keydown", this._onEscape, { capture: true });
			}
			this._source.fire("tooltipopen", { tooltip: this }, true);
		}
	}
	_closeOnEscape(e) {
		if (e.key !== "Escape" || e.defaultPrevented) return;
		this.close();
		e.preventDefault();
	}
	/**
	* Removes the tooltip from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		super.onRemove(map);
		map.fire("tooltipclose", { tooltip: this });
		if (this._onEscape) document.removeEventListener("keydown", this._onEscape, { capture: true });
		if (this._source) {
			this.removeEventParent(this._source);
			if (this._ariaSource) updateDescribedBy(this._ariaSource, this._container.id, false);
			this._ariaSource = null;
			this._source.fire("tooltipclose", { tooltip: this }, true);
		}
	}
	/**
	* Returns the map events the tooltip listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = super.getEvents();
		if (!this.options.permanent) events.preclick = this.close;
		return events;
	}
	_initLayout() {
		const className = `maplair-tooltip ${this.options.className || ""} maplair-zoom-animated`;
		this._contentNode = this._container = create("div", className);
		this._container.setAttribute("role", "tooltip");
		this._container.id = `maplair-tooltip-${stamp(this)}`;
	}
	_updateLayout() {}
	_adjustPan() {}
	/**
	* Updates the tooltip content, layout and position.
	* @returns {void}
	*/
	update() {
		this._autoDirection = void 0;
		super.update();
	}
	_setPosition(pos) {
		let direction = this.options.direction, shift = new Point(0, 0);
		const container = this._container, tooltipWidth = container.offsetWidth, tooltipHeight = container.offsetHeight, offset = new Point(this.options.offset);
		if (!(direction in directions)) {
			({direction, shift} = this._getAutoPlacement(pos, offset, tooltipWidth, tooltipHeight));
			if (direction === "left") offset.x = -offset.x;
		}
		const anchor = this._getAnchor(direction);
		const [fx, fy] = directions[direction];
		pos = pos.subtract(new Point(tooltipWidth * fx, tooltipHeight * fy, true)).add(offset).add(anchor).add(shift);
		for (const d in directions) container.classList.toggle(`maplair-tooltip-${d}`, d === direction);
		const tipShift = direction === "top" || direction === "bottom" ? clampTip(-shift.x, tooltipWidth) : clampTip(-shift.y, tooltipHeight);
		if (tipShift) container.style.setProperty("--maplair-tooltip-tip-shift", `${tipShift}px`);
		else container.style.removeProperty("--maplair-tooltip-tip-shift");
		this._setContainerPosition(pos);
	}
	_getAutoPlacement(pos, offset, width, height) {
		const area = this._getAutoArea(), point = this._map.layerPointToContainerPoint(pos), at = {};
		for (const d of [
			"right",
			"left",
			"top",
			"bottom"
		]) at[d] = point.add(this._getAnchor(d)).add(d === "left" ? [-offset.x, offset.y] : offset);
		const space = {
			right: area.max.x - at.right.x - width - tipSize,
			left: at.left.x - area.min.x - width - tipSize,
			top: at.top.y - area.min.y - height - tipSize,
			bottom: area.max.y - at.bottom.y - height - tipSize
		};
		if (!this._autoDirection) {
			const sides = point.x < (area.min.x + area.max.x) / 2 ? ["right", "left"] : ["left", "right"], fallback = space.right >= space.left ? "right" : "left";
			this._autoDirection = [
				...sides,
				"top",
				"bottom"
			].find((d) => space[d] >= 0 && (d === "right" || d === "left" || width <= area.max.x - area.min.x)) ?? fallback;
		}
		const direction = this._autoDirection, { x, y } = at[direction];
		return {
			direction,
			shift: direction === "top" || direction === "bottom" ? new Point(shiftInto(x - width / 2, width, area.min.x, area.max.x), 0) : new Point(0, shiftInto(y - height / 2, height, area.min.y, area.max.y))
		};
	}
	_getAutoArea() {
		const map = this._map;
		let min = new Point(0, 0), max = map.getSize();
		if (this.options.overflow) {
			const mapContainer = map._container, rect = mapContainer.getBoundingClientRect(), origin = new Point(rect.left + mapContainer.clientLeft, rect.top + mapContainer.clientTop), viewport = document.documentElement;
			min = min.subtract(origin);
			max = new Point(viewport.clientWidth, viewport.clientHeight).subtract(origin);
		}
		const padding = new Point(autoPadding, autoPadding);
		return {
			min: min.add(padding),
			max: max.subtract(padding)
		};
	}
	_updatePosition() {
		const pos = this._map._snapLayerPoint(this._map.latLngToLayerPoint(this._latlng));
		this._setPosition(pos);
	}
	/**
	* Sets the opacity of the tooltip.
	* @param {number} opacity
	* @returns {void}
	*/
	setOpacity(opacity) {
		this.options.opacity = opacity;
		if (this._container) this._container.style.opacity = `${opacity}`;
	}
	_animateZoom(e) {
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
		this._setPosition(pos);
	}
	_getAnchor(direction) {
		return new Point(this._source?._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor(direction) : [0, 0]);
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
};
function updateDescribedBy(el, id, add) {
	const ids = splitWords(el.getAttribute("aria-describedby") ?? "").filter((s) => s && s !== id);
	if (add) ids.push(id);
	if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
	else el.removeAttribute("aria-describedby");
}
export { Tooltip };

//# sourceMappingURL=Tooltip.js.map