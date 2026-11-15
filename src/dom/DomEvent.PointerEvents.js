// DomEvent.PointerEvents: detects the pointers that are currently active on the
// document.

const activePointers = new Map();

let lastPointerType;

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

/**
 * Whether `el` is inside an element that `DomEvent.disableClickPropagation` was called
 * on (before reaching `container`), or detached from the DOM.
 * @internal
 * @param {Node|null} el
 * @param {EventTarget|null} container
 * @returns {boolean}
 */
function isClickDisabled(el, container) {
	while (el && el !== container) {
		if (el['_maplair_disable_click'] || !el.parentNode) { return true; }
		el = el.parentNode;
	}
	return false;
}

function _onSet(e) {
	lastPointerType = e.pointerType;
	// pointers in controls and popups can't start map interactions, and capturing them breaks native widgets there
	// (like the clear button of a search input), so leave them to the browser
	if (isClickDisabled(e.target, e.currentTarget)) { return; }
	// capturing throws for synthetic pointers the browser doesn't know about, so only capture real ones
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

const dblclickProps = ['bubbles', 'cancelable', 'composed', 'view', 'screenX', 'screenY', 'clientX', 'clientY',
	'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'button', 'buttons', 'relatedTarget'];

let lastClickTime = 0,
lastClick,
lastClickMap,
clickCount = 0;

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
	// a click in a nested map (e.g. an overview map) counts for the innermost one only
	if (e === lastClick) { return; }
	lastClick = e;
	const target = e.target;

	// a click on a label is followed by a click on its input, so it would count as a double tap
	if (e.detail !== 1 || lastPointerType === 'mouse' || target.closest('label')) {
		clickCount = 0;
		return;
	}
	const now = Date.now();
	clickCount = now - lastClickTime <= 200 && mapContainer === lastClickMap ? clickCount + 1 : 1;
	lastClickTime = now;
	lastClickMap = mapContainer;

	if (clickCount === 2) {
		const init = {detail: 2};
		for (const prop of dblclickProps) { init[prop] = e[prop]; }
		target.dispatchEvent(new MouseEvent('dblclick', init));
	}
}

export {
	enablePointerDetection,
	disablePointerDetection,
	getPointers,
	isClickDisabled,
	simulateDblclick
};

