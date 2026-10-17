import { off, on, stop } from "../../dom/DomEvent.js";
import { create, disableImageDrag, disableTextSelection, enableImageDrag, enableTextSelection, setPosition } from "../../dom/DomUtil.js";
import { Bounds } from "../../geometry/Bounds.js";
import { LatLngBounds } from "../../geo/LatLngBounds.js";
import { Handler } from "../../core/Handler.js";
//#region src/map/handler/BoxZoomHandler.js
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
		this._container = map._container;
		this._pane = map._panes.overlayPane;
		this._resetStateTimeout = 0;
		map.on("unload", this._destroy, this);
		this.callInitHooks(BoxZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._container, "pointerdown", this._onPointerDown, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._container, "pointerdown", this._onPointerDown, this);
	}
	/**
	* Returns `true` if a box has been drawn by the current or last interaction.
	* @returns {boolean}
	*/
	moved() {
		return this._moved;
	}
	_destroy() {
		this._pane.remove();
		delete this._pane;
	}
	_resetState() {
		this._resetStateTimeout = 0;
		this._moved = false;
	}
	_clearDeferredResetState() {
		if (this._resetStateTimeout !== 0) {
			clearTimeout(this._resetStateTimeout);
			this._resetStateTimeout = 0;
		}
	}
	_onPointerDown(e) {
		if (!e.shiftKey || e.button !== 0) return false;
		this._clearDeferredResetState();
		this._resetState();
		disableTextSelection();
		disableImageDrag();
		this._startPoint = this._map.pointerEventToContainerPoint(e);
		on(this._container, {
			contextmenu: stop,
			pointermove: this._onPointerMove,
			pointerup: this._onPointerUp,
			keydown: this._onKeyDown
		}, this);
		on(document, "keydown", this._onKeyDown, this);
	}
	_onPointerMove(e) {
		if (!this._moved) {
			this._moved = true;
			this._box = create("div", "maplair-zoom-box", this._container);
			this._container.classList.add("maplair-crosshair");
			this._map.fire("boxzoomstart");
		}
		this._point = this._map.pointerEventToContainerPoint(e);
		const bounds = new Bounds(this._point, this._startPoint), size = bounds.getSize();
		setPosition(this._box, bounds.min);
		this._box.style.width = `${size.x}px`;
		this._box.style.height = `${size.y}px`;
	}
	_finish() {
		if (this._moved) {
			this._box.remove();
			this._container.classList.remove("maplair-crosshair");
		}
		enableTextSelection();
		enableImageDrag();
		off(this._container, {
			contextmenu: stop,
			pointermove: this._onPointerMove,
			pointerup: this._onPointerUp
		}, this);
		off(document, "keydown", this._onKeyDown, this);
	}
	_onPointerUp(e) {
		if (e.button !== 0) return;
		this._finish();
		if (!this._moved) return;
		this._clearDeferredResetState();
		this._resetStateTimeout = setTimeout(this._resetState.bind(this), 0);
		const bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));
		this._map._setUserEvent(e);
		this._map.fitBounds(bounds).fire("boxzoomend", { boxZoomBounds: bounds });
	}
	_onKeyDown(e) {
		if (e.code === "Escape") {
			this._finish();
			this._clearDeferredResetState();
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
//#endregion
export { BoxZoomHandler };

//# sourceMappingURL=BoxZoomHandler.js.map