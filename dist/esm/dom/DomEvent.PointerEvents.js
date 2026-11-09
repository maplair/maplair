import { __exportAll } from "../_virtual/_rolldown/runtime.js";
// src/dom/DomEvent.PointerEvents.js
var DomEvent_PointerEvents_exports = /* @__PURE__ */ __exportAll({
	disablePointerDetection: () => disablePointerDetection,
	enablePointerDetection: () => enablePointerDetection,
	getPointers: () => getPointers,
	simulateDblclick: () => simulateDblclick
});
const activePointers = /* @__PURE__ */ new Map();
let lastPointerType;
/**
* Enables pointer detection and capture for the document.
* @group Pointer detection
* @param {EventTarget} el
* @returns {void}
*/
function enablePointerDetection(el) {
	el.addEventListener("pointerdown", _onSet, { capture: true });
	el.addEventListener("pointermove", _onUpdate, { capture: true });
	el.addEventListener("pointerup", _onDelete, { capture: true });
	el.addEventListener("pointercancel", _onDelete, { capture: true });
	activePointers.clear();
}
/**
* Disables pointer detection and capture for the document.
* @group Pointer detection
* @param {EventTarget} el
* @returns {void}
*/
function disablePointerDetection(el) {
	el.removeEventListener("pointerdown", _onSet, { capture: true });
	el.removeEventListener("pointermove", _onUpdate, { capture: true });
	el.removeEventListener("pointerup", _onDelete, { capture: true });
	el.removeEventListener("pointercancel", _onDelete, { capture: true });
}
function _onSet(e) {
	if (e.isTrusted) e.target.setPointerCapture(e.pointerId);
	activePointers.set(e.pointerId, e);
	lastPointerType = e.pointerType;
}
function _onUpdate(e) {
	if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, e);
}
function _onDelete(e) {
	if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
	activePointers.delete(e.pointerId);
}
/**
* Returns the active pointers on the document.
* @group Pointer detection
* @returns {PointerEvent[]}
*/
function getPointers() {
	return [...activePointers.values()];
}
const dblclickProps = [
	"bubbles",
	"cancelable",
	"composed",
	"view",
	"screenX",
	"screenY",
	"clientX",
	"clientY",
	"ctrlKey",
	"shiftKey",
	"altKey",
	"metaKey",
	"button",
	"buttons",
	"relatedTarget"
];
let lastClickTime = 0;
let lastClick;
let lastClickMap;
let clickCount = 0;
/**
* Fires a `dblclick` on double tap where the browser doesn't (like iOS Safari),
* which is where it always reports `detail: 1` on clicks (see Leaflet#7012). The
* pointer type comes from `pointerdown`, because iOS Safari reports `mouse` on
* clicks from touch (WebKit bug 282988). Called by the map for clicks in it.
* @internal
* @param {MouseEvent} e
* @param {HTMLElement} mapContainer The container of the map, two taps make a double
* tap only in the same map.
* @returns {void}
*/
function simulateDblclick(e, mapContainer) {
	if (e === lastClick) return;
	lastClick = e;
	const target = e.target;
	if (e.detail !== 1 || lastPointerType === "mouse" || target.closest("label")) {
		clickCount = 0;
		return;
	}
	const now = Date.now();
	clickCount = now - lastClickTime <= 200 && mapContainer === lastClickMap ? clickCount + 1 : 1;
	lastClickTime = now;
	lastClickMap = mapContainer;
	if (clickCount === 2) {
		const init = { detail: 2 };
		for (const prop of dblclickProps) init[prop] = e[prop];
		target.dispatchEvent(new MouseEvent("dblclick", init));
	}
}
export { DomEvent_PointerEvents_exports, disablePointerDetection, enablePointerDetection, getPointers, simulateDblclick };

//# sourceMappingURL=DomEvent.PointerEvents.js.map