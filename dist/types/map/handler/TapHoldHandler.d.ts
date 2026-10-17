import type Browser from '../../core/Browser.js';
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
export class TapHoldHandler extends Handler {
    /**
     * @param {...MaplairMap} args The map.
     */
    constructor(map: MaplairMap);
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
 * Map options of `TapHoldHandler`, touch interaction options.
 */
export interface TapHoldHandlerMapOptions {
    /**
     * Enables simulation of `contextmenu` event, default is
     * `true` for mobile Safari.
     */
    tapHold?: boolean;
    /**
     * The max number of pixels a user can shift his
     * finger during touch for it to be considered a valid tap.
     * @default 15
     */
    tapTolerance?: number;
}
/**
 * Handler of `MaplairMap` for long taps.
 */
export interface TapHoldHandlerMapProperties {
    /**
     * Long tap handler to simulate `contextmenu` event
     * (useful in mobile Safari).
     */
    tapHold: TapHoldHandler;
}
import { Handler } from '../../core/Handler.js';
import { Point } from '../../geometry/Point.js';
import type { MaplairMap } from '../Map.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends TapHoldHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends TapHoldHandlerMapProperties {
    }
}
