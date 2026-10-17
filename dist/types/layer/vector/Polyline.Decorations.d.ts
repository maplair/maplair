import type { Polyline } from './Polyline.js';
import type { Path } from './Path.js';
import type { SVG } from './SVG.js';
import type { Canvas } from './Canvas.js';
import type { Point } from '../../geometry/Point.js';
import type { stamp } from '../../core/Util.js';

/**
 * Options of `Path` for arrowheads and text along lines (for `Polyline`s and
 * `Polygon`s). They are an optional feature: import this module to add the
 * `arrowheads` and `text` options to `Path`.
 *
 * ```js
 * import 'maplair/path-decorations';
 *
 * new Polyline(latlngs, {arrowheads: true, text: {content: 'Main Street', center: true}}).addTo(map);
 * ```
 *
 * Inspired by the [Leaflet.PolylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator)
 * and [Leaflet.TextPath](https://github.com/makinacorpus/Leaflet.TextPath) plugins.
 */
export interface PathDecorationsOptions {
    /**
     * Arrowheads along a polyline: `true` for one at the end of each line, or an object
     * with the `size` (in pixels, default `10`), `repeat` (an arrowhead every that many
     * pixels instead) and `color` (default: the `color` of the path).
     * @default false
     */
    arrowheads?: boolean|{size?: number, repeat?: number, color?: string};
    /**
     * Text along a polyline, e.g. a street name: the text, or an object with the
     * `content`, `repeat` (repeat the text along the whole line), `center` (center it on
     * the line), `offset` (in pixels, perpendicular to the line), `fontSize` (in pixels,
     * default `12`) and `color` (default: the `color` of the path).
     * @default null
     */
    text?: string|{content: string, repeat?: boolean, center?: boolean, offset?: number, fontSize?: number, color?: string}|null;
}
declare module './Path.js' {
    interface PathOptions extends PathDecorationsOptions {
    }
}
