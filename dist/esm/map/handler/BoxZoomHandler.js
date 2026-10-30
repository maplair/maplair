import { off, on, preventDefault, stop } from "../../dom/DomEvent.js";
import { create, setPosition } from "../../dom/DomUtil.js";
import { Bounds } from "../../geometry/Bounds.js";
import { LatLngBounds } from "../../geo/LatLngBounds.js";
import { Handler } from "../../core/Handler.js";
// src/map/handler/BoxZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/**
* The event object of `boxzoomend`.
* @typedef {object} BoxZoomEndEvent
* @property {LatLngBounds} boxZoomBounds The bounds of the box the map was zoomed to.
* @extends MaplairEvent
*/
/**
* Map options of `BoxZoomHandler`.
* @typedef {object} BoxZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean} [boxZoom=true] Whether the map can be zoomed to a rectangular
* area specified by dragging the pointer while pressing the shift key.
*/
/**
* Handler of `MaplairMap` for box zoom.
* @typedef {object} BoxZoomHandlerMapProperties
* @lends MaplairMap
* @property {BoxZoomHandler} boxZoom Box (shift-drag with pointer) zoom handler.
*/
/**
* Adds shift-drag zoom interaction to the map (zoom to a selected bounding box),
* enabled by default, see the map option `boxZoom`.
*
* @fires MaplairMap#boxzoomstart {MaplairEvent} Fired when the user starts drawing
* a box to zoom to.
* @fires MaplairMap#boxzoomend {BoxZoomEndEvent} Fired when the user has drawn a box
* and the map is zoomed to it.
*/
var BoxZoomHandler = class BoxZoomHandler extends Handler {
	/**
	* @param {MaplairMap} map
	*/
	constructor(map) {
		super(map);
		this.callInitHooks(BoxZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "pointerdown", this._onPointerDown, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "pointerdown", this._onPointerDown, this);
	}
	/**
	* Returns `true` if a box has been drawn by the current or last interaction.
	* @returns {boolean}
	*/
	moved() {
		return this._moved;
	}
	_resetState() {
		clearTimeout(this._resetStateTimeout);
		this._moved = false;
	}
	_toggleListeners(onOff) {
		onOff(this._map._container, {
			contextmenu: stop,
			pointermove: this._onPointerMove,
			pointerup: this._onPointerUp
		}, this);
		onOff(document, "keydown", this._onKeyDown, this);
	}
	_onPointerDown(e) {
		if (!e.shiftKey || e.button !== 0) return false;
		this._resetState();
		preventDefault(e);
		this._startPoint = this._map.pointerEventToContainerPoint(e);
		this._toggleListeners(on);
	}
	_onPointerMove(e) {
		const map = this._map;
		if (!this._moved) {
			this._moved = true;
			this._box = create("div", "maplair-zoom-box", map._container);
			map._container.classList.add("maplair-crosshair");
			map.fire("boxzoomstart");
		}
		this._point = map.pointerEventToContainerPoint(e);
		const bounds = new Bounds(this._point, this._startPoint), size = bounds.getSize();
		setPosition(this._box, bounds.min);
		this._box.style.width = `${size.x}px`;
		this._box.style.height = `${size.y}px`;
	}
	_finish() {
		if (this._moved) {
			this._box.remove();
			this._map._container.classList.remove("maplair-crosshair");
		}
		this._toggleListeners(off);
	}
	_onPointerUp(e) {
		if (e.button !== 0) return;
		this._finish();
		if (!this._moved) return;
		this._resetStateTimeout = setTimeout(() => this._resetState(), 0);
		const bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));
		this._map._setUserEvent(e);
		if (this._map.getBoundsZoom(bounds) !== Infinity) this._map.fitBounds(bounds);
		this._map.fire("boxzoomend", { boxZoomBounds: bounds });
	}
	_onKeyDown(e) {
		if (e.code === "Escape") {
			this._finish();
			this._resetState();
		}
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ boxZoom: true });
		MaplairMap.addInitHook("addHandler", "boxZoom", BoxZoomHandler);
	}
};
export { BoxZoomHandler };

//# sourceMappingURL=BoxZoomHandler.js.map