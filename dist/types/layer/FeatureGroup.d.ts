import type { InteractiveLayerOptions } from './Layer.js';
import type { LayerEvent } from '../core/Events.js';
/** @import {Layer, InteractiveLayerOptions} from './Layer.js' */
/** @import {LayerEvent} from '../core/Events.js' */
/** @import {PathOptions} from './vector/Path.js' */
/**
 * Extended `LayerGroup` that makes it easier to do the same thing to all its member layers:
 * * [`bindPopup`](#layer-bindpopup) binds a popup to all of the layers at once
 *   (likewise with [`bindTooltip`](#layer-bindtooltip))
 * * Events are propagated to the `FeatureGroup`, so if the group has an event
 *   handler, it will handle events from any of the layers. This includes pointer
 *   events and custom events.
 * * Has `layeradd` and `layerremove` events
 *
 * @example
 * ```js
 * new FeatureGroup([marker1, marker2, polyline])
 * 	.bindPopup('Hello world!')
 * 	.on('click', function() { alert('Clicked on a member of the group!'); })
 * 	.addTo(map);
 * ```
 *
 * @fires layeradd {LayerEvent} Fired when a layer is added to this `FeatureGroup`.
 * @fires layerremove {LayerEvent} Fired when a layer is removed from this `FeatureGroup`.
 */
export class FeatureGroup extends LayerGroup {
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
     * Sets the given path options to each layer of the group that has a `setStyle` method.
     * @param {PathOptions} style
     * @returns {this}
     */
    setStyle(style: PathOptions): this;
    /**
     * Changes the `interactive` option of each layer of the group.
     * @param {boolean} interactive
     * @returns {this}
     */
    setInteractive(interactive: boolean): this;
    /**
     * Brings the layer group to the top of all other layers.
     * @returns {this}
     */
    bringToFront(): this;
    /**
     * Brings the layer group to the back of all other layers.
     * @returns {this}
     */
    bringToBack(): this;
    /**
     * Returns the `LatLngBounds` of the feature group (created from bounds and
     * coordinates of its children, including the layers of nested layer groups).
     * @returns {LatLngBounds}
     */
    getBounds(): LatLngBounds;
}
import { LayerGroup } from './LayerGroup.js';
import type { Layer } from './Layer.js';
import type { PathOptions } from './vector/Path.js';
import { LatLngBounds } from '../geo/LatLngBounds.js';
