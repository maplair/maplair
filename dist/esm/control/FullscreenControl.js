import { disableClickPropagation, off, on, stop } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
//#region src/control/FullscreenControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
const enterIcon = "<svg aria-hidden=\"true\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M2 2h5v2H4v3H2zm7 0h5v5h-2V4H9zM2 9h2v3h3v2H2zm10 0h2v5H9v-2h3z\"/></svg>";
const exitIcon = "<svg aria-hidden=\"true\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M5 2h2v5H2V5h3zm4 0h2v3h3v2H9zM2 9h5v5H5v-3H2zm7 0h5v2h-3v3H9z\"/></svg>";
/**
* Options of `FullscreenControl`.
* @typedef {object} FullscreenControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string} [enterText] The HTML content of the button while the map is not in
* fullscreen, by default an expand icon.
* @property {string} [exitText] The HTML content of the button while the map is in
* fullscreen, by default a collapse icon.
* @extends ControlOptions
*/
/**
* Map options of `FullscreenControl`.
* @typedef {object} FullscreenControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [fullscreenControl=false] Whether a
* [fullscreen control](#fullscreencontrol) is added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `FullscreenControl`.
* @typedef {object} FullscreenControlMapProperties
* @lends MaplairMap
* @property {FullscreenControl} fullscreenControl The default fullscreen control (only
* available if the [`fullscreenControl` option](#map-fullscreencontrol) was `true` when
* creating the map).
*/
/**
* Methods of `MaplairMap` for the fullscreen view.
* @lends MaplairMap.prototype
* @fires MaplairMap#enterfullscreen {MaplairEvent} Fired when the map enters fullscreen.
* @fires MaplairMap#exitfullscreen {MaplairEvent} Fired when the map exits fullscreen.
* @fires MaplairMap#fullscreenchange {MaplairEvent} Fired when the map enters or exits
* fullscreen.
*/
const mapFullscreenMethods = {
	/**
	* Enters or exits the fullscreen view of the map, see `FullscreenControl`.
	* Browsers allow entering fullscreen only in response to a user interaction,
	* e.g. a click.
	* @group Methods for modifying map state
	* @returns {this}
	*/
	toggleFullscreen() {
		const container = this._container;
		if (this._fullscreen === "pseudo") this._setFullscreen(false);
		else if (this._fullscreen) document.exitFullscreen();
		else if (document.fullscreenEnabled && container.requestFullscreen) {
			on(document, "fullscreenchange", this._onFullscreenChange, this);
			container.requestFullscreen().catch(() => {
				off(document, "fullscreenchange", this._onFullscreenChange, this);
				this._setFullscreen("pseudo");
			});
		} else this._setFullscreen("pseudo");
		return this;
	},
	/**
	* Returns `true` if the map is viewed in fullscreen.
	* @group Other methods
	* @returns {boolean}
	*/
	isFullscreen() {
		return !!this._fullscreen;
	},
	_onFullscreenChange() {
		const fullscreen = document.fullscreenElement === this._container;
		if (!fullscreen) off(document, "fullscreenchange", this._onFullscreenChange, this);
		if (fullscreen !== this.isFullscreen()) this._setFullscreen(fullscreen && "native");
	},
	_onFullscreenKeyDown(e) {
		if (e.key === "Escape") this._setFullscreen(false);
	},
	_setFullscreen(mode) {
		const container = this._container;
		this._fullscreen = mode;
		container.classList.toggle("maplair-fullscreen", !!mode);
		container.classList.toggle("maplair-pseudo-fullscreen", mode === "pseudo");
		if (mode === "pseudo") on(document, "keydown", this._onFullscreenKeyDown, this);
		else off(document, "keydown", this._onFullscreenKeyDown, this);
		this.invalidateSize();
		this.fire(mode ? "enterfullscreen" : "exitfullscreen");
		this.fire("fullscreenchange");
	}
};
/** @typedef {typeof mapFullscreenMethods} MapFullscreenMethods */
/**
* A control with a button to view the map in fullscreen and to exit it again. It is
* put on the map if you set its [`fullscreenControl` option](#map-fullscreencontrol)
* to `true`. Where the browser does not support the
* [Fullscreen API](https://developer.mozilla.org/docs/Web/API/Fullscreen_API)
* (e.g. Safari on iPhone) or refuses fullscreen (e.g. in an iframe without
* `allow="fullscreen"`), the map is enlarged to the size of the window instead.
*
* @example
* ```js
* new FullscreenControl({position: 'topright'}).addTo(map);
* ```
*/
var FullscreenControl = class FullscreenControl extends Control {
	static {
		this.setDefaultOptions({
			position: "topleft",
			enterText: enterIcon,
			exitText: exitIcon
		});
	}
	/**
	* Creates a fullscreen control.
	* @param {...FullscreenControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(FullscreenControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-control-fullscreen maplair-bar"), button = this._button = create("button", "maplair-control-fullscreen-button", container);
		button.type = "button";
		disableClickPropagation(button);
		on(button, "click", stop);
		on(button, "click", this._toggleFullscreen, this);
		on(button, "click", this._refocusOnMap, this);
		this._update();
		map.on("fullscreenchange", this._update, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("fullscreenchange", this._update, this);
	}
	_toggleFullscreen() {
		this._map.toggleFullscreen();
	}
	_update() {
		const fullscreen = this._map.isFullscreen(), title = fullscreen ? I18n.translate("Exit fullscreen") : I18n.translate("View fullscreen");
		this._button.innerHTML = fullscreen ? this.options.exitText : this.options.enterText;
		this._button.title = title;
		this._button.setAttribute("aria-label", title);
		this._button.setAttribute("aria-pressed", fullscreen);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ fullscreenControl: false });
		MaplairMap.include(mapFullscreenMethods);
		MaplairMap.addInitHook(function() {
			this.on("unload", function() {
				if (this._fullscreen === "native") {
					off(document, "fullscreenchange", this._onFullscreenChange, this);
					document.exitFullscreen();
				}
				this._container.classList.remove("maplair-fullscreen", "maplair-pseudo-fullscreen");
				off(document, "keydown", this._onFullscreenKeyDown, this);
				this._fullscreen = false;
			});
			if (this.options.fullscreenControl) {
				this.fullscreenControl = new FullscreenControl();
				this.addControl(this.fullscreenControl);
			}
		});
	}
};
//#endregion
export { FullscreenControl };

//# sourceMappingURL=FullscreenControl.js.map