import type { splitWords, stamp } from '../../core/Util.js';
import type { RendererOptions } from './Renderer.js';
/** @import {Point} from '../../geometry/Point.js' */
/** @import {RendererOptions} from './Renderer.js' */
/**
 * Allows vector layers to be displayed with [SVG](https://developer.mozilla.org/docs/Web/SVG).
 * Inherits `Renderer`.
 *
 * @example
 * Use SVG by default for all paths in the map:
 *
 * ```js
 * const map = new MaplairMap('map', {
 * 	renderer: new SVG()
 * });
 * ```
 *
 * Use a SVG renderer with extra padding for specific vector geometries:
 *
 * ```js
 * const map = new MaplairMap('map');
 * const myRenderer = new SVG({ padding: 0.5 });
 * const line = new Polyline( coordinates, { renderer: myRenderer } );
 * const circle = new Circle( center, { renderer: myRenderer, radius: 100 } );
 * ```
 */
export class SVG extends Renderer {
    /**
     * Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
     * corresponding to the class name passed. For example, using 'line' will return
     * an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).
     * @param {string} name
     * @returns {SVGElement}
     */
    static create(name: string): SVGElement;
    /**
     * Generates a SVG path string for multiple rings, with each ring turning
     * into "M..L..L.." instructions.
     * @param {Point[][]} rings
     * @param {boolean} [closed]
     * @returns {string}
     */
    static pointsToPath(rings: Point[][], closed?: boolean): string;
}
import { Renderer } from './Renderer.js';
import type { Point } from '../../geometry/Point.js';
