import type { Bounds } from '../../geometry/Bounds.js';
import type { MaplairMap } from '../../map/Map.js';
import type { EventListener } from '../../core/Events.js';
import type { RendererOptions } from './Renderer.js';
/**
 * Options of `Canvas`.
 * @typedef {object} CanvasOptions
 * @property {number} [tolerance=0] How much to extend the click tolerance around a
 * path/object on the map.
 * @extends RendererOptions
 */
/**
 * Allows vector layers to be displayed with [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
 * Inherits `Renderer`.
 *
 * @example
 * Use Canvas by default for all paths in the map:
 *
 * ```js
 * const map = new MaplairMap('map', {
 * 	renderer: new Canvas()
 * });
 * ```
 *
 * Use a Canvas renderer with extra padding for specific vector geometries:
 *
 * ```js
 * const map = new MaplairMap('map');
 * const myRenderer = new Canvas({ padding: 0.5 });
 * const line = new Polyline( coordinates, { renderer: myRenderer } );
 * const circle =  new Circle( center, { renderer: myRenderer, radius: 100 } );
 * ```
 */
export class Canvas extends Renderer {
    static defaultOptions: Partial<CanvasOptions>;
    /**
     * Creates a Canvas renderer with the given options.
     * @overload
     * @param {CanvasOptions} [options]
     */
    constructor(options?: CanvasOptions | undefined);
    /** The options of the Canvas, see [the options](#canvasoptions). */
    options: CanvasOptions;
}
/**
 * Options of `Canvas`.
 */
export interface CanvasOptions extends RendererOptions {
    /**
     * How much to extend the click tolerance around a
     * path/object on the map.
     * @default 0
     */
    tolerance?: number;
}
import { Renderer } from './Renderer.js';
