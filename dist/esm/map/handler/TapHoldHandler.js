import { Point } from "../../geometry/Point.js";
import Browser_default from "../../core/Browser.js";
import { getPointers } from "../../dom/DomEvent.PointerEvents.js";
import { off, on, preventDefault } from "../../dom/DomEvent.js";
import { Handler } from "../../core/Handler.js";
//#region src/map/handler/TapHoldHandler.js
/** @import {MaplairMap} from '../Map.js' */
const tapHoldDelay = 600;
/**
* Map options of `TapHoldHandler`, touch interaction options.
* @typedef {object} TapHoldHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean} [tapHold] Enables simulation of `contextmenu` event, default is
* `true` for mobile Safari.
* @property {number} [tapTolerance=15] The max number of pixels a user can shift his
* finger during touch for it to be considered a valid tap.
*/
/**
* Handler of `MaplairMap` for long taps.
* @typedef {object} TapHoldHandlerMapProperties
* @lends MaplairMap
* @property {TapHoldHandler} tapHold Long tap handler to simulate `contextmenu` event
* (useful in mobile Safari).
*/
/**
* Simulates the `contextmenu` event on long hold, which otherwise is not fired by
* mobile Safari, see the map option `tapHold`.
*/
var TapHoldHandler = class TapHoldHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(TapHoldHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "pointerdown", this._onDown, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "pointerdown", this._onDown, this);
		this._cancel();
		this._cancelClickPrevent();
	}
	_onDown(e) {
		clearTimeout(this._holdTimeout);
		if (getPointers().length !== 1 || e.pointerType === "mouse") return;
		const el = this._map._container;
		this._startPos = this._newPos = new Point(e.clientX, e.clientY);
		this._holdTimeout = setTimeout((() => {
			this._cancel();
			if (!this._isTapValid()) return;
			on(el, "pointerup", preventDefault);
			on(el, "pointerup pointercancel", this._cancelClickPrevent, this);
			this._simulateEvent("contextmenu", e);
		}), tapHoldDelay);
		on(el, "pointerup pointercancel contextmenu", this._cancel, this);
		on(el, "pointermove", this._onMove, this);
	}
	_cancelClickPrevent() {
		const el = this._map._container;
		off(el, "pointerup", preventDefault);
		off(el, "pointerup pointercancel", this._cancelClickPrevent, this);
	}
	_cancel() {
		clearTimeout(this._holdTimeout);
		const el = this._map._container;
		off(el, "pointerup pointercancel contextmenu", this._cancel, this);
		off(el, "pointermove", this._onMove, this);
	}
	_onMove(e) {
		this._newPos = new Point(e.clientX, e.clientY);
	}
	_isTapValid() {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	}
	_simulateEvent(type, e) {
		const simulatedEvent = new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			view: window,
			screenX: e.screenX,
			screenY: e.screenY,
			clientX: e.clientX,
			clientY: e.clientY
		});
		simulatedEvent._simulated = true;
		e.target.dispatchEvent(simulatedEvent);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			tapHold: Browser_default.safari && Browser_default.mobile,
			tapTolerance: 15
		});
		MaplairMap.addInitHook("addHandler", "tapHold", TapHoldHandler);
	}
};
//#endregion
export { TapHoldHandler };

//# sourceMappingURL=TapHoldHandler.js.map