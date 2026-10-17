/**
 * Displaces overlapping points in pixel space until they are at least
 * `minSeparation` apart. Iterative relaxation: every overlapping pair is pushed
 * apart by half of its overlap per pass. Neighbour lookup uses a grid (cell
 * size = separation) ⇒ O(n) per iteration.
 *
 * No point ends up further than `maxDisplacement` away from where it started.
 * Points which hit that limit stay overlapping – the limit wins over the
 * separation.
 *
 * @param {Point[]} points Pixel coordinates (modified in place)
 * @param {number} minSeparation Minimum distance between centers, in pixels
 * @param {{ iterations?: number, maxDisplacement?: number }} [options]
 * @returns {Point[]} the same (displaced) points
 */
export function displace(points: Point[], minSeparation: number, { iterations, maxDisplacement }?: {
    iterations?: number;
    maxDisplacement?: number;
}): Point[];
/**
 * Cartographic displacement of overlapping `CircleMarker`s: keeps all circle
 * markers created with `displace: true` free of overlap.
 *
 * Overlap is a screen space phenomenon: whether two markers cover each other
 * depends on their pixel radius and the current zoom level. The displacement is
 * therefore computed in projected pixel space and recomputed on every zoom. The
 * true position of each marker is kept by the handler, the displaced position is
 * applied via `setLatLng`. Since every run starts over from the true position,
 * markers never drift.
 *
 * `maxDistance` bounds how far a marker may be moved away from the truth, in
 * meters. It is worth noting what such a limit costs at low zoom levels: if a
 * marker is 11 km wide on the ground, separating two coincident ones moves each
 * of them by some 6 km, so a limit below that leaves them overlapping.
 *
 * Unlike the default handlers, it isn't added to every map, so that bundlers can
 * drop it from applications that don't use it. Add it to the map class (or to a
 * single map with `DisplaceHandler.addTo(map, 'displace')`), then enable it with
 * the map option `displace`, which is either `true` or an object overriding the
 * handler's options. It can be toggled at runtime via `map.displace.enable()` /
 * `map.displace.disable()`; disabling restores the true positions.
 *
 * @example
 * ```js
 * import { CircleMarker, DisplaceHandler, MaplairMap } from 'maplair';
 *
 * MaplairMap.addInitHook('addHandler', 'displace', DisplaceHandler);
 *
 * const map = new MaplairMap('map', {displace: { maxDistance: 10_000} });
 * new CircleMarker(latlng, { displace: true, radius: 6 }).addTo(map);
 * ```
 */
export class DisplaceHandler extends Handler {
    /**
     * @param {...MaplairMap} args The map.
     */
    constructor(map: MaplairMap);
    /**
     * Called when the handler is enabled, adds the event hooks.
     */
    addHooks(): void;
    /**
     * Called when the handler is disabled, removes the event hooks and restores the
     * true positions of the markers.
     */
    removeHooks(): void;
    /**
     * Requests a relayout in the next animation frame, at most one per frame.
     */
    schedule(): void;
    /**
     * Computes the displacement for all tracked markers in the pixel space of
     * the current zoom level and writes the displaced positions back.
     */
    relayout(): void;
    /** The options of the DisplaceHandler, see [the options](#displacehandleroptions). */
    options: DisplaceHandlerOptions;
}
/**
 * Options of `DisplaceHandler`.
 */
export interface DisplaceHandlerOptions {
    /**
     * Additional pixel distance between the outlines of two
     * markers.
     * @default 2
     */
    gap?: number;
    /**
     * Maximum number of relaxation passes per relayout.
     * @default 80
     */
    iterations?: number;
    /**
     * Maximum distance in meters a marker may be
     * moved away from its true position. Markers which would have to move further stay
     * overlapping. Meters rather than pixels, since the point of the limit is to bound the
     * geographic error. A limit in meters also scales itself: it only bites at the zoom
     * levels where a pixel is worth a lot of ground.
     * @default Infinity
     */
    maxDistance?: number;
}
/**
 * Map options of `DisplaceHandler`, the interaction options for displacement.
 */
export interface DisplaceHandlerMapOptions {
    /**
     * Whether to displace
     * overlapping `CircleMarker`s, either `true` or an object overriding the options of
     * `DisplaceHandler`. Needs the `DisplaceHandler` to be added to the map, see there.
     */
    displace?: boolean|DisplaceHandlerOptions;
}
/**
 * Handler of `MaplairMap` for displacement, if added to the map (see `DisplaceHandler`).
 */
export interface DisplaceHandlerMapProperties {
    /**
     * The displacement handler, if added with the
     * name `displace`.
     */
    displace?: DisplaceHandler;
}
/**
 * Options of `CircleMarker` for the displacement by `DisplaceHandler`.
 */
export interface DisplaceCircleMarkerOptions {
    /**
     * Whether to include this marker in the displacement of
     * the map, see `DisplaceHandler`.
     */
    displace?: boolean;
    /**
     * Stable identifier shared across marker instances that
     * represent the same thing on different layers, so that `DisplaceHandler` puts them at
     * the same displaced position.
     */
    displaceId?: string;
}
import { Point } from '../../geometry/Point.js';
import { Handler } from '../../core/Handler.js';
import { CircleMarker } from '../../layer/vector/CircleMarker.js';
import type { LatLng } from '../../geo/LatLng.js';
import type { LayerEvent } from '../../core/Events.js';
import type { Layer } from '../../layer/Layer.js';
import type { MaplairMap } from '../Map.js';
declare module '../Map.js' {
    interface MaplairMapOptions extends DisplaceHandlerMapOptions {
    }
}
declare module '../Map.js' {
    interface MaplairMap extends DisplaceHandlerMapProperties {
    }
}
declare module '../../layer/vector/CircleMarker.js' {
    interface CircleMarkerOptions extends DisplaceCircleMarkerOptions {
    }
}
