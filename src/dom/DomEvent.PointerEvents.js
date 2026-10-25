// DomEvent.PointerEvents: detects the pointers that are currently active on the
// document.

const activePointers = new Map();

/**
 * Enables pointer detection and capture for the document.
 * @group Pointer detection
 * @param {EventTarget} el
 * @returns {void}
 */
function enablePointerDetection(el) {
	el.addEventListener('pointerdown', _onSet, {capture: true});
	el.addEventListener('pointermove', _onUpdate, {capture: true});
	el.addEventListener('pointerup', _onDelete, {capture: true});
	el.addEventListener('pointercancel', _onDelete, {capture: true});
	activePointers.clear();
}

/**
 * Disables pointer detection and capture for the document.
 * @group Pointer detection
 * @param {EventTarget} el
 * @returns {void}
 */
function disablePointerDetection(el) {
	el.removeEventListener('pointerdown', _onSet, {capture: true});
	el.removeEventListener('pointermove', _onUpdate, {capture: true});
	el.removeEventListener('pointerup', _onDelete, {capture: true});
	el.removeEventListener('pointercancel', _onDelete, {capture: true});
}

// capturing throws for synthetic pointers the browser doesn't know about, so only capture real ones
function _onSet(e) {
	if (e.isTrusted) { e.target.setPointerCapture(e.pointerId); }
	activePointers.set(e.pointerId, e);
}

function _onUpdate(e) {
	if (activePointers.has(e.pointerId)) {
		activePointers.set(e.pointerId, e);
	}
}

function _onDelete(e) {
	// released already if the document has nested maps (e.g. an overview map)
	if (e.target.hasPointerCapture(e.pointerId)) {
		e.target.releasePointerCapture(e.pointerId);
	}
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

export {
	enablePointerDetection,
	disablePointerDetection,
	getPointers
};

