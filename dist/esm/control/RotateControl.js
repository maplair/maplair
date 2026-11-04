import { disableClickPropagation, on, stop } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
// src/control/RotateControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
const compass = "<svg aria-hidden=\"true\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><path d=\"M8 1 11 8H5z\" fill=\"#d22\"/><path d=\"M8 15 5 8h6z\" fill=\"#999\"/></svg>";
/**
* Options of `RotateControl`.
* @typedef {object} RotateControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @extends ControlOptions
*/
/**
* Map options of `RotateControl`.
* @typedef {object} RotateControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [rotateControl=false] Whether a [rotate control](#rotatecontrol)
* is added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `RotateControl`.
* @typedef {object} RotateControlMapProperties
* @lends MaplairMap
* @property {RotateControl} rotateControl The default rotate control (only available if
* the [`rotateControl` option](#map-rotatecontrol) was `true` when creating the map).
*/
/**
* A compass showing the rotation of the map (see `MaplairMap.setBearing()`); clicking it
* rotates the map back to north up. It is put on the map if you set its
* [`rotateControl` option](#map-rotatecontrol) to `true`.
*
* @example
* ```js
* new RotateControl({position: 'topright'}).addTo(map);
* ```
*/
var RotateControl = class RotateControl extends Control {
	static defaultOptions = { position: "topleft" };
	/**
	* Creates a rotate control.
	* @param {...RotateControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(RotateControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-control-rotate maplair-bar"), button = this._button = create("button", "maplair-control-rotate-button", container), title = I18n.translate("Reset north");
		button.type = "button";
		button.title = title;
		button.setAttribute("aria-label", title);
		button.innerHTML = compass;
		disableClickPropagation(button);
		on(button, "click", stop);
		on(button, "click", this._resetNorth, this);
		on(button, "click", this._refocusOnMap, this);
		this._update();
		map.on("rotate", this._update, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("rotate", this._update, this);
	}
	_resetNorth(e) {
		this._map._setUserEvent(e);
		this._map.setBearing(0, { animate: true });
	}
	_update() {
		this._button.firstChild.style.transform = `rotate(${-this._map.getBearing()}deg)`;
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ rotateControl: false });
		MaplairMap.addInitHook(function() {
			if (this.options.rotateControl) {
				this.rotateControl = new RotateControl();
				this.addControl(this.rotateControl);
			}
		});
	}
};
export { RotateControl };

//# sourceMappingURL=RotateControl.js.map