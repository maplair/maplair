import { getPropagationPath } from "./DomEvent.js";
//#region src/dom/DomEvent.DoubleTap.js
function makeDblclick(ev) {
	let init = {
		bubbles: ev.bubbles,
		cancelable: ev.cancelable,
		composed: ev.composed,
		detail: 2,
		view: ev.view,
		screenX: ev.screenX,
		screenY: ev.screenY,
		clientX: ev.clientX,
		clientY: ev.clientY,
		ctrlKey: ev.ctrlKey,
		shiftKey: ev.shiftKey,
		altKey: ev.altKey,
		metaKey: ev.metaKey,
		button: ev.button,
		buttons: ev.buttons,
		relatedTarget: ev.relatedTarget,
		region: ev.region
	};
	let newEvent;
	if (ev instanceof PointerEvent) {
		init = {
			...init,
			pointerId: ev.pointerId,
			width: ev.width,
			height: ev.height,
			pressure: ev.pressure,
			tangentialPressure: ev.tangentialPressure,
			tiltX: ev.tiltX,
			tiltY: ev.tiltY,
			twist: ev.twist,
			pointerType: ev.pointerType,
			isPrimary: ev.isPrimary
		};
		newEvent = new PointerEvent("dblclick", init);
	} else newEvent = new MouseEvent("dblclick", init);
	return newEvent;
}
const delay = 200;
/**
* Adds a `dblclick` listener which also handles double taps (simulating `dblclick`
* on platforms which don't fire it for touch events).
* @param {EventTarget} obj
* @param {(ev: MouseEvent) => void} handler
* @returns {{dblclick: (ev: MouseEvent) => void, simDblclick: (ev: PointerEvent) => void}}
* The listeners to pass to `removeDoubleTapListener`.
*/
function addDoubleTapListener(obj, handler) {
	obj.addEventListener("dblclick", handler);
	let last = 0, detail;
	function simDblclick(ev) {
		if (ev.detail !== 1) {
			detail = ev.detail;
			return;
		}
		if (ev.pointerType === "mouse" || ev.sourceCapabilities && !ev.sourceCapabilities.firesTouchEvents) return;
		const path = getPropagationPath(ev);
		if (path.some((el) => el instanceof HTMLLabelElement && el.attributes.for) && !path.some((el) => el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) return;
		const now = Date.now();
		if (now - last <= delay) {
			detail++;
			if (detail === 2) ev.target.dispatchEvent(makeDblclick(ev));
		} else detail = 1;
		last = now;
	}
	obj.addEventListener("click", simDblclick);
	return {
		dblclick: handler,
		simDblclick
	};
}
/**
* Removes the listeners added by `addDoubleTapListener`.
* @param {EventTarget} obj
* @param {{dblclick: (ev: MouseEvent) => void, simDblclick: (ev: PointerEvent) => void}} handlers
* @returns {void}
*/
function removeDoubleTapListener(obj, handlers) {
	obj.removeEventListener("dblclick", handlers.dblclick);
	obj.removeEventListener("click", handlers.simDblclick);
}
//#endregion
export { addDoubleTapListener, removeDoubleTapListener };

//# sourceMappingURL=DomEvent.DoubleTap.js.map