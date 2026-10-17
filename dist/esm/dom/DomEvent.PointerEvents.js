import { __exportAll } from "../_virtual/_rolldown/runtime.js";
//#region src/dom/DomEvent.PointerEvents.js
var DomEvent_PointerEvents_exports = /* @__PURE__ */ __exportAll({
	cleanupPointers: () => cleanupPointers,
	disablePointerDetection: () => disablePointerDetection,
	enablePointerDetection: () => enablePointerDetection,
	getPointers: () => getPointers
});
const activePointers = /* @__PURE__ */ new Map();
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
	e.target.setPointerCapture(e.pointerId);
	activePointers.set(e.pointerId, e);
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
/**
* Clears the detected pointers on the document.
* Note: This function should be not necessary to call, as the pointers are
* automatically cleared with `pointerup`, `pointercancel` and `pointerout` events.
* @group Pointer detection
* @returns {void}
*/
function cleanupPointers() {
	for (const e of activePointers.values()) try {
		e.target.releasePointerCapture(e.pointerId);
	} catch {}
	activePointers.clear();
}
//#endregion
export { DomEvent_PointerEvents_exports, cleanupPointers, disablePointerDetection, enablePointerDetection, getPointers };

//# sourceMappingURL=DomEvent.PointerEvents.js.map