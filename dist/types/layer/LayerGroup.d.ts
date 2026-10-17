/** @import {InteractiveLayerOptions} from './Layer.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
 * Used to group several layers and handle them as one. If you add it to the map,
 * any layers added or removed from the group will be added/removed on the map as
 * well. Extends `Layer`.
 *
 * @example
 * ```js
 * new LayerGroup([marker1, marker2])
 * 	.addLayer(polyline)
 * 	.addTo(map);
 * ```
 */
export class LayerGroup extends Layer {
    /**
     * Creates a layer group, optionally given an initial set of layers and an
     * `options` object.
     * @param {Layer[]} [layers]
     * @param {InteractiveLayerOptions} [options]
     */
    constructor(layers?: Layer[], options?: InteractiveLayerOptions);
    /**
     * Adds the given layer to the group.
     * @param {Layer} layer
     * @returns {this}
     */
    addLayer(layer: Layer): this;
    /**
     * Removes the given layer, or the layer with the given internal ID, from the group.
     * @param {Layer|number} layer
     * @returns {this}
     */
    removeLayer(layer: Layer | number): this;
    /**
     * Returns `true` if the given layer, or the layer with the given internal ID, is
     * currently added to the group.
     * @param {Layer|number} layer
     * @returns {boolean}
     */
    hasLayer(layer: Layer | number): boolean;
    /**
     * Removes all the layers from the group.
     * @returns {this}
     */
    clearLayers(): this;
    /**
     * Adds the layers of the group to the map.
     * @param {MaplairMap} map
     */
    onAdd(map: MaplairMap): void;
    /**
     * Removes the layers of the group from the map.
     * @param {MaplairMap} map
     */
    onRemove(map: MaplairMap): void;
    /**
     * Iterates over the layers of the group, optionally specifying context of the
     * iterator function.
     * ```js
     * group.eachLayer(layer => layer.bindPopup('Hello'));
     * ```
     * @param {(layer: Layer) => void} method
     * @param {object} [context]
     * @returns {this}
     */
    eachLayer(method: (layer: Layer) => void, context?: object): this;
    /**
     * Returns the layer with the given internal ID.
     * @param {number} id
     * @returns {Layer|undefined}
     */
    getLayer(id: number): Layer | undefined;
    /**
     * Returns an array of all the layers added to the group.
     * @returns {Layer[]}
     */
    getLayers(): Layer[];
    /**
     * Calls `setZIndex` on every layer contained in this group, passing the z-index.
     * @param {number} zIndex
     * @returns {this}
     */
    setZIndex(zIndex: number): this;
    /**
     * Returns the internal ID for a layer.
     * @param {Layer} layer
     * @returns {number}
     */
    getLayerId(layer: Layer): number;
}
import { Layer } from './Layer.js';
import type { MaplairMap } from '../map/Map.js';
import type { InteractiveLayerOptions } from './Layer.js';
