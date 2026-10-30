import type { on, off, stop, disableClickPropagation, disableScrollPropagation } from '../../dom/DomEvent.js';
import type { Point } from '../../geometry/Point.js';
import type { I18n } from '../../core/I18n.js';
import type { MaplairMap } from '../Map.js';
import type { MaplairEvent } from '../../core/Events.js';
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/**
 * Map options of `KeyboardHandler`, the keyboard navigation options.
 * @typedef {object} KeyboardHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [keyboard=true] Makes the map focusable and allows users to
 * navigate the map with keyboard arrows and `+`/`-` keys.
 * @property {number} [keyboardPanDelta=80] Amount of pixels to pan when pressing an
 * arrow key.
 * @property {boolean|string} [ariaKeyShortcuts=false] Sets the `aria-keyshortcuts`
 * attribute of the map container. ARIA names keys by what they type on a given layout,
 * so `true` uses the names for a US English layout, which can be wrong for pages in
 * other languages; pass a string to set the value for your audience's layout instead.
 */
/**
 * Handler of `MaplairMap` for keyboard navigation.
 * @typedef {object} KeyboardHandlerMapProperties
 * @lends MaplairMap
 * @property {KeyboardHandler} keyboard Keyboard navigation handler.
 */
/**
 * Handles keyboard interaction with the map, enabled by default, see the map option
 * `keyboard`. The `?` key shows a list of the keyboard shortcuts.
 *
 * @fires MaplairMap#focus {MaplairEvent} Fired when the map gains focus.
 * @fires MaplairMap#blur {MaplairEvent} Fired when the map loses focus.
 */
export class KeyboardHandler extends Handler {
    /**
     * The [values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
     * of the keys for panning and zooming the map, so zoom keys follow the keyboard
     * layout and cover the numpad too; `=` and `_` keep the US `+` and `-` keys working
     * both with and without Shift.
     * @type {Record<'left'|'right'|'down'|'up'|'zoomIn'|'zoomOut', string[]>}
     */
    static keys: Record<"left" | "right" | "down" | "up" | "zoomIn" | "zoomOut", string[]>;
    /**
     * Called when the handler is enabled, adds the event hooks.
     */
    addHooks(): void;
    /**
     * Called when the handler is disabled, removes the event hooks.
     */
    removeHooks(): void;
}
/**
 * Map options of `KeyboardHandler`, the keyboard navigation options.
 */
export interface KeyboardHandlerMapOptions {
    /**
     * Makes the map focusable and allows users to
     * navigate the map with keyboard arrows and `+`/`-` keys.
     * @default true
     */
    keyboard?: boolean;
    /**
     * Amount of pixels to pan when pressing an
     * arrow key.
     * @default 80
     */
    keyboardPanDelta?: number;
    /**
     * Sets the `aria-keyshortcuts`
     * attribute of the map container. ARIA names keys by what they type on a given layout,
     * so `true` uses the names for a US English layout, which can be wrong for pages in
     * other languages; pass a string to set the value for your audience's layout instead.
     * @default false
     */
    ariaKeyShortcuts?: boolean|string;
}
/**
 * Handler of `MaplairMap` for keyboard navigation.
 */
export interface KeyboardHandlerMapProperties {
    /**
     * Keyboard navigation handler.
     */
    keyboard: KeyboardHandler;
}
import { Handler } from '../../core/Handler.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends KeyboardHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends KeyboardHandlerMapProperties {
    }
}
