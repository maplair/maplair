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

// NOTE: pointers are captured unconditionally, which can become a problem for
// synthetic events. The prosthetic-hand library does handle pointer capture,
// but others don't.
// If this becomers an issue, replace with `e.isTrusted && e.target.setPointerCapture()`
function _onSet(e) {
	e.target.setPointerCapture(e.pointerId);
	activePointers.set(e.pointerId, e);
}

function _onUpdate(e) {
	if (activePointers.has(e.pointerId)) {
		activePointers.set(e.pointerId, e);
	}
}

// NOTE: idem as _onSet.
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

/**
 * Clears the detected pointers on the document.
 * Note: This function should be not necessary to call, as the pointers are
 * automatically cleared with `pointerup`, `pointercancel` and `pointerout` events.
 * @group Pointer detection
 * @returns {void}
 */
function cleanupPointers() {
	for (const e of activePointers.values()) {
		try {
			e.target.releasePointerCapture(e.pointerId);
		} catch {
			// target may already be detached; capture was on a dead node
		}
	}
	activePointers.clear();
}

export {
	enablePointerDetection,
	disablePointerDetection,
	getPointers,
	cleanupPointers
};

