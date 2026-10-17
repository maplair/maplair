import {LayerGroup} from './LayerGroup.js';
import {LatLngBounds} from '../geo/LatLngBounds.js';
import * as Util from '../core/Util.js';
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
	 * Creates a feature group, optionally given an initial set of layers and an
	 * `options` object.
	 * @overload
	 * @param {Layer[]} [layers]
	 * @param {InteractiveLayerOptions} [options]
	 */
	/**
	 * @param {...any} args
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(FeatureGroup);
	}

	/**
	 * Adds the given layer to the group.
	 * @param {Layer} layer
	 * @returns {this}
	 */
	addLayer(layer) {
		if (this.hasLayer(layer)) {
			return this;
		}

		layer.addEventParent(this);

		super.addLayer(layer);

		return this.fire('layeradd', {layer});
	}

	/**
	 * Removes the given layer, or the layer with the given internal ID, from the group.
	 * @param {Layer|number} layer
	 * @returns {this}
	 */
	removeLayer(layer) {
		if (!this.hasLayer(layer)) {
			return this;
		}
		if (layer in this._layers) {
			layer = this._layers[layer];
		}

		layer.removeEventParent(this);

		super.removeLayer(layer);

		return this.fire('layerremove', {layer});
	}

	/**
	 * Sets the given path options to each layer of the group that has a `setStyle` method.
	 * @param {PathOptions} style
	 * @returns {this}
	 */
	setStyle(style) {
		return this.eachLayer(l => l.setStyle?.(style));
	}

	/**
	 * Changes the `interactive` option of each layer of the group.
	 * @param {boolean} interactive
	 * @returns {this}
	 */
	setInteractive(interactive) {
		Util.setOptions(this, {interactive: !!interactive});
		return this.eachLayer(l => l.setInteractive?.(interactive));
	}

	/**
	 * Brings the layer group to the top of all other layers.
	 * @returns {this}
	 */
	bringToFront() {
		return this.eachLayer(l => l.bringToFront?.());
	}

	/**
	 * Brings the layer group to the back of all other layers.
	 * @returns {this}
	 */
	bringToBack() {
		return this.eachLayer(l => l.bringToBack?.());
	}

	/**
	 * Returns the `LatLngBounds` of the feature group (created from bounds and
	 * coordinates of its children).
	 * @returns {LatLngBounds}
	 */
	getBounds() {
		const bounds = new LatLngBounds();

		for (const layer of Object.values(this._layers)) {
			bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
		}
		return bounds;
	}
}
