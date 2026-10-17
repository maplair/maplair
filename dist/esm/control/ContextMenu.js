import { setOptions } from "../core/Util.js";
import { Class } from "../core/Class.js";
import { disableClickPropagation, disableScrollPropagation, on, stop } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Layer } from "../layer/Layer.js";
//#region src/control/ContextMenu.js
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {Point} from '../geometry/Point.js' */
/**
* Options of `ContextMenu`.
* @typedef {object} ContextMenuOptions
* @property {string} [className=''] A custom CSS class name to assign to the menu.
*/
/**
* The argument of the `callback` of a `ContextMenu` item, with the location of the
* `contextmenu` event.
* @typedef {object} ContextMenuEvent
* @property {LatLng} latlng The geographical point of the event.
* @property {Point} containerPoint Pixel coordinates of the event relative to the map
* container.
* @property {Point} layerPoint Pixel coordinates of the event relative to the map layer.
* @property {MouseEvent|PointerEvent} originalEvent The original DOM event.
* @property {Layer} [relatedTarget] The layer, for menus of layers.
*/
/**
* An item of a `ContextMenu`.
* @typedef {object} ContextMenuItem
* @property {string} text The text of the item.
* @property {(this: ContextMenu, event: ContextMenuEvent) => void} [callback] Called
* when the item is chosen.
* @property {boolean} [disabled] Whether the item is disabled.
*/
/**
* A menu opened with the `contextmenu` event (right click, or long tap on touch
* screens) on the map or on a layer. Each item calls a function with the location
* of the event. The menu is a [popover](https://developer.mozilla.org/docs/Web/API/Popover_API),
* closed by clicking outside of it or pressing Escape, and can be used with the
* keyboard (arrow keys, Enter).
*
* Inspired by the [Leaflet.contextmenu](https://github.com/aratcliffe/Leaflet.contextmenu) plugin.
*
* @example
* ```js
* new ContextMenu([
* 	{text: 'Center the map here', callback: e => map.panTo(e.latlng)},
* 	'-',
* 	{text: 'Zoom in', callback: () => map.zoomIn()}
* ]).addTo(map);
*
* new ContextMenu([
* 	{text: 'Remove', callback: e => e.relatedTarget.remove()}
* ]).addTo(marker);
* ```
*/
var ContextMenu = class ContextMenu extends Class {
	static {
		this.setDefaultOptions({ className: "" });
	}
	/**
	* Creates a context menu. Each item is an object with `text`, `callback` and the
	* optional `disabled`, or `'-'` for a separator. The `callback` gets an event with
	* `latlng`, `containerPoint`, `layerPoint`, `originalEvent` and `relatedTarget`
	* (the layer, for menus of layers).
	* @param {(ContextMenuItem|'-')[]} items
	* @param {ContextMenuOptions} [options]
	*/
	constructor(items, options) {
		super();
		setOptions(this, options);
		this._items = items;
		this.callInitHooks(ContextMenu);
	}
	/**
	* Opens the menu on `contextmenu` events of the map or the layer.
	* @param {MaplairMap|Layer} target
	* @returns {this}
	*/
	addTo(target) {
		this.remove();
		this._target = target;
		target.on("contextmenu", this._open, this);
		return this;
	}
	/**
	* Removes the menu from its map or layer.
	* @returns {this}
	*/
	remove() {
		this.close();
		this._target?.off("contextmenu", this._open, this);
		this._target = null;
		this._container?.remove();
		this._container = null;
		return this;
	}
	/**
	* Closes the menu.
	* @returns {this}
	*/
	close() {
		if (this._container?.matches(":popover-open")) this._container.hidePopover();
		return this;
	}
	/**
	* Returns `true` if the menu is open.
	* @returns {boolean}
	*/
	isOpen() {
		return !!this._container?.matches(":popover-open");
	}
	_open(e) {
		stop(e);
		const map = this._target instanceof Layer ? this._target._map : this._target;
		if (!map) return;
		this._map = map;
		this._event = {
			latlng: e.latlng,
			containerPoint: e.containerPoint,
			layerPoint: e.layerPoint,
			originalEvent: e.originalEvent,
			relatedTarget: this._target instanceof Layer ? this._target : void 0
		};
		const container = this._createMenu(map._container);
		if (!container.matches(":popover-open")) container.showPopover();
		this._position(e.originalEvent);
		container.querySelector("button:not([disabled])")?.focus({ preventScroll: true });
		map.once("movestart", this.close, this);
	}
	_createMenu(parent) {
		const container = this._container ??= create("div", `maplair-contextmenu ${this.options.className}`);
		if (container.parentNode !== parent) parent.appendChild(container);
		container.popover = "auto";
		container.setAttribute("role", "menu");
		container.replaceChildren();
		for (const item of this._items) {
			if (item === "-") {
				create("div", "maplair-contextmenu-separator", container).setAttribute("role", "separator");
				continue;
			}
			const button = create("button", "maplair-contextmenu-item", container);
			button.type = "button";
			button.setAttribute("role", "menuitem");
			button.textContent = item.text;
			button.disabled = !!item.disabled;
			on(button, "click", (ev) => {
				stop(ev);
				this.close();
				item.callback?.call(this, this._event);
			});
		}
		on(container, "keydown", this._onKeyDown, this);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		on(container, "contextmenu", stop);
		return container;
	}
	_position(e) {
		const container = this._container, viewport = document.documentElement, x = Math.min(e.clientX, viewport.clientWidth - container.offsetWidth), y = Math.min(e.clientY, viewport.clientHeight - container.offsetHeight);
		container.style.left = `${Math.max(0, x)}px`;
		container.style.top = `${Math.max(0, y)}px`;
	}
	_onKeyDown(e) {
		if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
		stop(e);
		const buttons = [...this._container.querySelectorAll("button:not([disabled])")], index = buttons.indexOf(document.activeElement), next = e.key === "ArrowDown" ? index + 1 : index - 1;
		buttons.at(next % buttons.length)?.focus();
	}
};
//#endregion
export { ContextMenu };

//# sourceMappingURL=ContextMenu.js.map