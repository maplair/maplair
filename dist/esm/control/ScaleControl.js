import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
//#region src/control/ScaleControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
* Options of `ScaleControl`.
* @typedef {object} ScaleControlOptions
* @property {string} [position='bottomleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {number} [maxWidth=100] Maximum width of the control in pixels. The width is
* set dynamically to show round values (e.g. 100, 200, 500).
* @property {boolean} [metric=true] Whether to show the metric scale line (m/km).
* @property {boolean} [imperial=true] Whether to show the imperial scale line (mi/ft).
* @property {boolean} [updateWhenIdle=false] If `true`, the control is updated on
* [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on
* [`move`](#map-move)).
* @extends ControlOptions
*/
/**
* A simple scale control that shows the scale of the current center of screen in metric
* (m/km) and imperial (mi/ft) systems.
*
* @example
*
* ```js
* new ScaleControl().addTo(map);
* ```
*/
var ScaleControl = class ScaleControl extends Control {
	static {
		this.setDefaultOptions({
			position: "bottomleft",
			maxWidth: 100,
			metric: true,
			imperial: true,
			updateWhenIdle: false
		});
	}
	/**
	* Creates a scale control with the given options.
	* @param {...ScaleControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(ScaleControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const className = "maplair-control-scale", container = create("div", className), options = this.options;
		this._addScales(options, `${className}-line`, container);
		map.on(options.updateWhenIdle ? "moveend" : "move", this._update, this);
		map.whenReady(this._update, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this);
	}
	_addScales(options, className, container) {
		if (options.metric) this._mScale = create("div", className, container);
		if (options.imperial) this._iScale = create("div", className, container);
	}
	_update() {
		const map = this._map, y = map.getSize().y / 2;
		const maxMeters = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([this.options.maxWidth, y]));
		this._updateScales(maxMeters);
	}
	_updateScales(maxMeters) {
		if (this.options.metric && maxMeters) this._updateMetric(maxMeters);
		if (this.options.imperial && maxMeters) this._updateImperial(maxMeters);
	}
	_updateMetric(maxMeters) {
		const meters = this._getRoundNum(maxMeters), label = meters < 1e3 ? I18n.translate("{meters} m", { meters }) : I18n.translate("{kilometers} km", { kilometers: meters / 1e3 });
		this._updateScale(this._mScale, label, meters / maxMeters);
	}
	_updateImperial(maxMeters) {
		const maxFeet = maxMeters * 3.2808399;
		let maxMiles, miles, feet;
		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);
			this._updateScale(this._iScale, I18n.translate("{miles} mi", { miles }), miles / maxMiles);
		} else {
			feet = this._getRoundNum(maxFeet);
			this._updateScale(this._iScale, I18n.translate("{feet} ft", { feet }), feet / maxFeet);
		}
	}
	_updateScale(scale, text, ratio) {
		scale.style.width = `${Math.round(this.options.maxWidth * ratio)}px`;
		scale.innerHTML = text;
	}
	_getRoundNum(num) {
		const pow10 = 10 ** (`${Math.floor(num)}`.length - 1);
		let d = num / pow10;
		d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
		return pow10 * d;
	}
};
//#endregion
export { ScaleControl };

//# sourceMappingURL=ScaleControl.js.map