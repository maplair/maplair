import type { Path } from './Path.js';
import type { CircleMarker } from './CircleMarker.js';
/**
 * A zoom-dependent style value, of the `weight` option of paths and the `radius` of
 * circle markers: either a function of the zoom or an object of zoom stops
 * `{zoom: value}`, using the value of the highest stop not above the zoom (or of the
 * lowest stop). The styles are updated on `zoomend`.
 *
 * Zoom-dependent styles are an optional feature, like the zoom expressions of
 * MapLibre: import this module to let the `weight` and `radius` options depend on the
 * zoom.
 *
 * ```js
 * import 'maplair/zoom-styles';
 *
 * new CircleMarker(latlng, {radius: {5: 3, 10: 6, 15: 10}}).addTo(map);
 * new Polyline(latlngs, {weight: zoom => zoom / 2}).addTo(map);
 * ```
 */
export type ZoomStyle = number | Record<number, number> | ((zoom: number) => number);
