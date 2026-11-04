import { disableClickPropagation, on, stop } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
// src/control/ZoomControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
* Options of `ZoomControl`.
* @typedef {object} ZoomControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string} [zoomInText='<span aria-hidden="true">+</span>'] The text set on
* the 'zoom in' button.
* @property {string} [zoomOutText='<span aria-hidden="true">&#x2212;</span>'] The text
* set on the 'zoom out' button.
* @extends ControlOptions
*/
/**
* Map options of `ZoomControl`.
* @typedef {object} ZoomControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [zoomControl=true] Whether a [zoom control](#control-zoom) is
* added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `ZoomControl`.
* @typedef {object} ZoomControlMapProperties
* @lends MaplairMap
* @property {ZoomControl} zoomControl The default zoom control (only available if the
* [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
*/
/**
* A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by
* default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`.
*/
var ZoomControl = class ZoomControl extends Control {
	static defaultOptions = {
		position: "topleft",
		zoomInText: "<span aria-hidden=\"true\">+</span>",
		zoomOutText: "<span aria-hidden=\"true\">&#x2212;</span>"
	};
	/**
	* Creates a zoom control.
	* @param {...ZoomControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(ZoomControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const zoomName = "maplair-control-zoom", container = create("div", `${zoomName} maplair-bar`), options = this.options;
		this._zoomInButton = this._createButton(options.zoomInText, I18n.translate("Zoom in"), `${zoomName}-in`, container, (e) => this._zoom(e, 1));
		this._zoomOutButton = this._createButton(options.zoomOutText, I18n.translate("Zoom out"), `${zoomName}-out`, container, (e) => this._zoom(e, -1));
		this._updateDisabled();
		map.on("zoomend zoomlevelschange", this._updateDisabled, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("zoomend zoomlevelschange", this._updateDisabled, this);
	}
	/**
	* Disables the zoom buttons.
	* @returns {this}
	*/
	disable() {
		this._disabled = true;
		this._updateDisabled();
		return this;
	}
	/**
	* Enables the zoom buttons (if the zoom level allows).
	* @returns {this}
	*/
	enable() {
		this._disabled = false;
		this._updateDisabled();
		return this;
	}
	_zoom(e, dir) {
		const map = this._map;
		if (!this._disabled && (dir > 0 ? map._zoom < map.getMaxZoom() : map._zoom > map.getMinZoom())) {
			map._setUserEvent(e);
			map.zoomIn(dir * map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
	}
	_createButton(html, title, className, container, fn) {
		const link = create("button", className, container);
		link.type = "button";
		link.innerHTML = html;
		link.title = title;
		link.setAttribute("aria-label", title);
		disableClickPropagation(link);
		on(link, "click", (e) => {
			stop(e);
			fn.call(this, e);
			this._refocusOnMap(e);
		});
		return link;
	}
	_updateDisabled() {
		const map = this._map;
		for (const [button, limit] of [[this._zoomInButton, map.getMaxZoom()], [this._zoomOutButton, map.getMinZoom()]]) {
			const disabled = this._disabled || map._zoom === limit;
			button.classList.toggle("maplair-disabled", disabled);
			button.setAttribute("aria-disabled", `${disabled}`);
		}
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ zoomControl: true });
		MaplairMap.addInitHook(function() {
			if (this.options.zoomControl) {
				this.zoomControl = new ZoomControl();
				this.addControl(this.zoomControl);
			}
		});
	}
};
export { ZoomControl };

//# sourceMappingURL=ZoomControl.js.map