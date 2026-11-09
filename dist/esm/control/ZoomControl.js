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
* @property {string} [zoomInText] The HTML of the 'zoom in' button, a plus sign drawn
* in SVG by default.
* @property {string} [zoomOutText] The HTML of the 'zoom out' button, a minus sign
* drawn in SVG by default.
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
		zoomInText: "<svg width=\"12\" height=\"12\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><path d=\"M0 6h12M6 0v12\"/></svg>",
		zoomOutText: "<svg width=\"12\" height=\"12\" stroke=\"currentColor\" stroke-width=\"2\" aria-hidden=\"true\"><path d=\"M0 6h12\"/></svg>"
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
	* @returns {HTMLElement}
	*/
	onAdd() {
		const zoomName = "maplair-control-zoom", container = create("div", `${zoomName} maplair-bar`), options = this.options;
		this._zoomInButton = this._createButton(options.zoomInText, I18n.translate("Zoom in"), `${zoomName}-in`, container, (e) => this._zoom(e, 1));
		this._zoomOutButton = this._createButton(options.zoomOutText, I18n.translate("Zoom out"), `${zoomName}-out`, container, (e) => this._zoom(e, -1));
		this._updateDisabled();
		return container;
	}
	/**
	* @internal
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		return {
			zoomend: this._updateDisabled,
			zoomlevelschange: this._updateDisabled
		};
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