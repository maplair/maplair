import { setOptions, stamp } from "../core/Util.js";
import { Layer } from "./Layer.js";
import { asFeature, getFeature } from "./GeoJSONUtil.js";
//#region src/layer/LayerGroup.js
/** @import {Feature, FeatureCollection} from 'geojson' */
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
var LayerGroup = class LayerGroup extends Layer {
	/**
	* Creates a layer group, optionally given an initial set of layers and an
	* `options` object.
	* @param {Layer[]} [layers]
	* @param {InteractiveLayerOptions} [options]
	*/
	constructor(layers, options) {
		super();
		setOptions(this, options);
		this._layers = {};
		for (const layer of layers ?? []) this.addLayer(layer);
		this.callInitHooks(LayerGroup);
	}
	/**
	* Adds the given layer to the group.
	* @param {Layer} layer
	* @returns {this}
	*/
	addLayer(layer) {
		const id = this.getLayerId(layer);
		this._layers[id] = layer;
		this._map?.addLayer(layer);
		return this;
	}
	/**
	* Removes the given layer, or the layer with the given internal ID, from the group.
	* @param {Layer|number} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		const id = layer in this._layers ? layer : this.getLayerId(layer);
		if (this._map && this._layers[id]) this._map.removeLayer(this._layers[id]);
		delete this._layers[id];
		return this;
	}
	/**
	* Returns `true` if the given layer, or the layer with the given internal ID, is
	* currently added to the group.
	* @param {Layer|number} layer
	* @returns {boolean}
	*/
	hasLayer(layer) {
		return (typeof layer === "number" ? layer : this.getLayerId(layer)) in this._layers;
	}
	/**
	* Removes all the layers from the group.
	* @returns {this}
	*/
	clearLayers() {
		return this.eachLayer(this.removeLayer, this);
	}
	/**
	* Adds the layers of the group to the map.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		this.eachLayer(map.addLayer, map);
	}
	/**
	* Removes the layers of the group from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		this.eachLayer(map.removeLayer, map);
	}
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
	eachLayer(method, context) {
		for (const layer of Object.values(this._layers)) method.call(context, layer);
		return this;
	}
	/**
	* Returns the layer with the given internal ID.
	* @param {number} id
	* @returns {Layer|undefined}
	*/
	getLayer(id) {
		return this._layers[id];
	}
	/**
	* Returns an array of all the layers added to the group.
	* @returns {Layer[]}
	*/
	getLayers() {
		const layers = [];
		this.eachLayer(layers.push, layers);
		return layers;
	}
	/**
	* Calls `setZIndex` on every layer contained in this group, passing the z-index.
	* @param {number} zIndex
	* @returns {this}
	*/
	setZIndex(zIndex) {
		return this.eachLayer((l) => l.setZIndex?.(zIndex));
	}
	/**
	* Returns the internal ID for a layer.
	* @param {Layer} layer
	* @returns {number}
	*/
	getLayerId(layer) {
		return stamp(layer);
	}
	/**
	* Returns a GeoJSON `MultiPoint` Feature of the points of the group, used by
	* `toGeoJSON()`.
	* @internal
	* @param {number|false} [precision]
	* @returns {Feature}
	*/
	toMultiPoint(precision) {
		const coords = [];
		this.eachLayer((layer) => {
			coords.push(layer.toGeoJSON(precision).geometry.coordinates);
		});
		return getFeature(this, {
			type: "MultiPoint",
			coordinates: coords
		});
	}
	/**
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
	* given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
	* representation of the layer group (as a GeoJSON `FeatureCollection`,
	* `GeometryCollection`, or `MultiPoint`).
	* @param {number|false} [precision]
	* @returns {Feature|FeatureCollection}
	*/
	toGeoJSON(precision) {
		const type = this.feature?.geometry?.type;
		if (type === "MultiPoint") return this.toMultiPoint(precision);
		const isGeometryCollection = type === "GeometryCollection", jsons = [];
		this.eachLayer((layer) => {
			if (layer.toGeoJSON) {
				const json = layer.toGeoJSON(precision);
				if (isGeometryCollection) jsons.push(json.geometry);
				else {
					const feature = asFeature(json);
					if (feature.type === "FeatureCollection") jsons.push(...feature.features);
					else jsons.push(feature);
				}
			}
		});
		if (isGeometryCollection) return getFeature(this, {
			geometries: jsons,
			type: "GeometryCollection"
		});
		return {
			type: "FeatureCollection",
			features: jsons
		};
	}
};
//#endregion
export { LayerGroup };

//# sourceMappingURL=LayerGroup.js.map