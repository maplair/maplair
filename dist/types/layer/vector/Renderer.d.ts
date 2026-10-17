import type { BlanketOverlayOptions } from '../BlanketOverlay.js';
import type { MaplairEvent } from '../../core/Events.js';
import type { MaplairMap } from '../../map/Map.js';
/** @import {BlanketOverlayOptions} from '../BlanketOverlay.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/**
 * Options of `Renderer`, `SVG` and `Canvas`. The `continuous` option inherited from
 * `BlanketOverlay` cannot be set to `true`.
 * @typedef {object} RendererOptions
 * @extends BlanketOverlayOptions
 */
/**
 * Base class for vector renderer implementations (`SVG`, `Canvas`). Handles the
 * DOM container of the renderer, its bounds, and its zoom animation.
 *
 * A `Renderer` works as an implicit layer group for all `Path`s - the renderer
 * itself can be added or removed to the map. All paths use a renderer, which can
 * be implicit (the map will decide the type of renderer and use it automatically)
 * or explicit (using the [`renderer`](#pathoptions-renderer) option of the path).
 *
 * Do not use this class directly, use `SVG` and `Canvas` instead.
 *
 * The `continuous` option inherited from `BlanketOverlay` cannot be set to `true`
 * (otherwise, renderers get out of place during a pinch-zoom operation).
 *
 * @fires update {MaplairEvent} Fired when the renderer updates its bounds, center and
 * zoom, for example when its map has moved.
 */
export class Renderer extends BlanketOverlay {
    /**
     * @param {RendererOptions} [options]
     */
    constructor(options?: RendererOptions);
    /**
     * Removes the container of the renderer from the map.
     */
    onRemove(): void;
    /** The options of the Renderer, see [the options](#rendereroptions). */
    options: RendererOptions;
}
/**
 * Options of `Renderer`, `SVG` and `Canvas`. The `continuous` option inherited from
 * `BlanketOverlay` cannot be set to `true`.
 */
export interface RendererOptions extends BlanketOverlayOptions {
}
import { BlanketOverlay } from '../BlanketOverlay.js';
