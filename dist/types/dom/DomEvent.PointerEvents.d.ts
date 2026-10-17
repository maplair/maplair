/**
 * Enables pointer detection and capture for the document.
 * @group Pointer detection
 * @param {EventTarget} el
 * @returns {void}
 */
export function enablePointerDetection(el: EventTarget): void;
/**
 * Disables pointer detection and capture for the document.
 * @group Pointer detection
 * @param {EventTarget} el
 * @returns {void}
 */
export function disablePointerDetection(el: EventTarget): void;
/**
 * Returns the active pointers on the document.
 * @group Pointer detection
 * @returns {PointerEvent[]}
 */
export function getPointers(): PointerEvent[];
/**
 * Clears the detected pointers on the document.
 * Note: This function should be not necessary to call, as the pointers are
 * automatically cleared with `pointerup`, `pointercancel` and `pointerout` events.
 * @group Pointer detection
 * @returns {void}
 */
export function cleanupPointers(): void;
