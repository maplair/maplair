import type { Path } from './Path.js';
import type { SVG } from './SVG.js';
import type { Canvas } from './Canvas.js';
import type Browser from '../../core/Browser.js';

/**
 * Options of `Path` for the animation of dashes. The animation of dashes is an
 * optional feature: import this module to add the `dashSpeed` option to `Path`.
 *
 * ```js
 * import 'maplair/dash-animation';
 *
 * new Polyline(latlngs, {dashArray: '10, 10', dashSpeed: 20}).addTo(map);
 * ```
 *
 * Inspired by the [leaflet-ant-path](https://github.com/rubenspgcavalcante/leaflet-ant-path) plugin.
 */
export interface DashAnimationPathOptions {
    /**
     * Animates the dashes of the `dashArray` along the
     * path ("marching ants"), e.g. to show the direction of a flow: the speed in pixels per
     * second, negative for the opposite direction. Not animated with
     * [reduced motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion).
     * @default 0
     */
    dashSpeed?: number;
}
declare module './Path.js' {
    interface PathOptions extends DashAnimationPathOptions {
    }
}
