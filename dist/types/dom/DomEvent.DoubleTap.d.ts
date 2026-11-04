/**
 * Adds a `dblclick` listener which also handles double taps (simulating `dblclick`
 * on platforms which don't fire it for touch events).
 * @param {EventTarget} obj
 * @param {(ev: MouseEvent) => void} handler
 * @returns {{dblclick: (ev: MouseEvent) => void, simDblclick: (ev: PointerEvent) => void}}
 * The listeners to pass to `removeDoubleTapListener`.
 */
export function addDoubleTapListener(obj: EventTarget, handler: (ev: MouseEvent) => void): {
    dblclick: (ev: MouseEvent) => void;
    simDblclick: (ev: PointerEvent) => void;
};
/**
 * Removes the listeners added by `addDoubleTapListener`.
 * @param {EventTarget} obj
 * @param {{dblclick: (ev: MouseEvent) => void, simDblclick: (ev: PointerEvent) => void}} handlers
 * @returns {void}
 */
export function removeDoubleTapListener(obj: EventTarget, handlers: {
    dblclick: (ev: MouseEvent) => void;
    simDblclick: (ev: PointerEvent) => void;
}): void;
