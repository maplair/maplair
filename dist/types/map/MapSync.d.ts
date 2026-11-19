/** @import {MaplairMap} from './Map.js' */
/**
 * Options of `MapSync`.
 * @typedef {object} MapSyncOptions
 * @property {boolean} [bearing=true] Whether to synchronize the bearing of rotated maps
 * (with the map rotation, see `MaplairMap.setBearing()`).
 * @property {boolean} [oneWay=false] Whether only the first map leads and the other
 * maps follow it, without moving the first map when they are moved.
 * @property {'center'|'bounds'} [fit='center'] How the maps follow: `'center'` with the
 * same center and zoom, or `'bounds'` with the same center, zoomed so that the bounds
 * of the leading map fit (like `fitBounds()`), for maps of different sizes.
 */
/**
 * Synchronizes the views (center, zoom and bearing) of several maps, e.g. to
 * compare different layers side by side: whenever one of the maps moves (by the
 * user or by code, including animations), the other maps follow.
 *
 * With the options `oneWay` and `fit: 'bounds'`, smaller maps can follow a main
 * map showing its bounds, e.g. thumbnails next to it.
 *
 * Inspired by the [Leaflet.Sync](https://github.com/jieter/Leaflet.Sync) plugin.
 *
 * @example
 * ```js
 * const sync = new MapSync([map1, map2]);
 * // later
 * sync.remove();
 *
 * // a thumbnail showing the bounds of the main map
 * new MapSync([map, thumbnail], {oneWay: true, fit: 'bounds'});
 * ```
 */
export class MapSync {
    /**
     * Synchronizes the views of the given maps, starting with the view of the first map.
     * @param {MaplairMap[]} maps
     * @param {MapSyncOptions} [options]
     */
    constructor(maps: MaplairMap[], options?: MapSyncOptions);
    /** @type {MapSyncOptions} */
    options: MapSyncOptions;
    /**
     * Stops synchronizing the maps.
     * @returns {this}
     */
    remove(): this;
}
/**
 * Options of `MapSync`.
 */
export interface MapSyncOptions {
    /**
     * Whether to synchronize the bearing of rotated maps
     * (with the map rotation, see `MaplairMap.setBearing()`).
     * @default true
     */
    bearing?: boolean;
    /**
     * Whether only the first map leads and the other
     * maps follow it, without moving the first map when they are moved.
     * @default false
     */
    oneWay?: boolean;
    /**
     * How the maps follow: `'center'` with the
     * same center and zoom, or `'bounds'` with the same center, zoomed so that the bounds
     * of the leading map fit (like `fitBounds()`), for maps of different sizes.
     * @default 'center'
     */
    fit?: 'center'|'bounds';
}
import type { MaplairMap } from './Map.js';
