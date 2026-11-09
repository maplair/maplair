import type { Marker } from './marker/Marker.js';
import type { Polyline } from './vector/Polyline.js';
import type { Polygon } from './vector/Polygon.js';
import type { latLngToCoords, latLngsToCoords, getFeature, asFeature } from './GeoJSONUtil.js';
import type { InteractiveLayerOptions } from './Layer.js';
/** @import {Feature, FeatureCollection, GeoJSON as GeoJSONData, GeoJsonObject, Geometry} from 'geojson' */
/** @import {Layer, InteractiveLayerOptions} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PathOptions} from './vector/Path.js' */
/**
 * Options of `GeoJSON`.
 * @typedef {object} GeoJSONOptions
 * @property {(geoJsonPoint: Feature, latlng: LatLng) => Layer} [pointToLayer] A
 * `Function` defining how GeoJSON points spawn Maplair layers. It is internally
 * called when data is added, passing the GeoJSON point feature and its `LatLng`.
 * The default is to spawn a default `Marker`:
 * ```js
 * function(geoJsonPoint, latlng) {
 * 	return new Marker(latlng);
 * }
 * ```
 * @property {PathOptions|((geoJsonFeature: Feature) => PathOptions)} [style] A
 * `Function` defining the `Path options` for styling GeoJSON lines and polygons,
 * called internally when data is added.
 * The default value is to not override any defaults:
 * ```js
 * function (geoJsonFeature) {
 * 	return {}
 * }
 * ```
 * @property {(feature: Feature, layer: Layer) => void} [onEachFeature] A `Function`
 * that will be called once for each created `Feature`, after it has been created and
 * styled. Useful for attaching events and popups to features. It will receive the
 * `feature` as the first argument and its corresponding spawned `layer` from
 * [`asFeature`](#geojson-asFeature) as the second.
 * The default is to do nothing with the newly created layers:
 * ```js
 * function (feature, layer) {}
 * ```
 * @property {(geoJsonFeature: Feature) => boolean} [filter] A `Function` that will be
 * used to decide whether to include a feature or not.
 * The default is to include all features:
 * ```js
 * function (geoJsonFeature) {
 * 	return true;
 * }
 * ```
 * Note: dynamically changing the `filter` option will have effect only on newly
 * added data. It will _not_ re-evaluate already included features.
 * @property {(coords: number[]) => LatLng} [coordsToLatLng] A `Function` that will be
 * used for converting GeoJSON coordinates to `LatLng`s.
 * The default is the `coordsToLatLng` static method.
 * @property {boolean} [markersInheritOptions=false] Whether default Markers for "Point"
 * type Features inherit from group options.
 * @extends InteractiveLayerOptions
 */
/**
 * Properties of layers created from GeoJSON.
 * @typedef {object} GeoJSONLayerProperties
 * @lends Layer
 * @property {Feature} [feature] The GeoJSON feature the layer was created from (by
 * `GeoJSON`).
 */
/**
 * Represents a GeoJSON object or an array of GeoJSON objects. Allows you to parse
 * GeoJSON data and display it on the map. Extends `FeatureGroup`.
 *
 * There are several static functions which can be called without instantiating
 * `GeoJSON`.
 *
 * @example
 * ```js
 * new GeoJSON(data, {
 * 	style: function (feature) {
 * 		return {color: feature.properties.color};
 * 	}
 * }).bindPopup(function (layer) {
 * 	return layer.feature.properties.description;
 * }).addTo(map);
 * ```
 */
export class GeoJSON extends FeatureGroup {
    /**
     * Creates a `Layer` from a given GeoJSON feature. Can use a custom
     * [`pointToLayer`](#geojson-pointtolayer) and/or [`coordsToLatLng`](#geojson-coordstolatlng)
     * functions if provided as options.
     * @param {GeoJsonObject} geojson
     * @param {GeoJSONOptions} [options]
     * @returns {Layer|null}
     */
    static geometryToLayer(geojson: GeoJsonObject, options?: GeoJSONOptions): Layer | null;
    /**
     * Creates a `LatLng` object from an array of 2 numbers (longitude, latitude)
     * or 3 numbers (longitude, latitude, altitude) used in GeoJSON for points.
     * @param {number[]} coords
     * @returns {LatLng}
     */
    static coordsToLatLng(coords: number[]): LatLng;
    /**
     * Creates a multidimensional array of `LatLng`s from a GeoJSON coordinates array.
     * `levelsDeep` specifies the nesting level (0 is for an array of points, 1 for an
     * array of arrays of points, etc., 0 by default).
     * Can use a custom [`coordsToLatLng`](#geojson-coordstolatlng) function.
     * @param {any[]} coords
     * @param {number} [levelsDeep]
     * @param {(coords: number[]) => LatLng} [_coordsToLatLng]
     * @returns {any[]}
     */
    static coordsToLatLngs(coords: any[], levelsDeep?: number, _coordsToLatLng?: (coords: number[]) => LatLng): any[];
    /**
     * Reverse of [`coordsToLatLng`](#geojson-coordstolatlng).
     * Coordinates values are rounded with [`formatNum`](#util-formatnum) function.
     * @param {LatLngExpression} latlng
     * @param {number|false} [precision]
     * @returns {number[]}
     */
    static latLngToCoords(latlng: LatLngExpression, precision?: number | false): number[];
    /**
     * Reverse of [`coordsToLatLngs`](#geojson-coordstolatlngs).
     * `close` determines whether the first point should be appended to the end of the
     * array to close the feature, only used when `levelsDeep` is 0. False by default.
     * Coordinates values are rounded with [`formatNum`](#util-formatnum) function.
     * @param {any[]} latlngs
     * @param {number} [levelsDeep]
     * @param {boolean} [close]
     * @param {number|false} [precision]
     * @returns {any[]}
     */
    static latLngsToCoords(latlngs: any[], levelsDeep?: number, close?: boolean, precision?: number | false): any[];
    /**
     * Returns GeoJSON geometries/features of layer with new GeoJSON geometry.
     * @param {Layer} layer
     * @param {Geometry} newGeometry
     * @returns {Feature}
     */
    static getFeature(layer: Layer, newGeometry: Geometry): Feature;
    /**
     * Normalize GeoJSON geometries/features into GeoJSON features.
     * @param {GeoJsonObject} geojson
     * @returns {Feature|FeatureCollection}
     */
    static asFeature(geojson: GeoJsonObject): Feature | FeatureCollection;
    /**
     * Creates a GeoJSON layer. Optionally accepts an object in
     * [GeoJSON format](https://tools.ietf.org/html/rfc7946) to display on the map
     * (you can alternatively add it later with `addData` method) and an `options` object.
     * @param {GeoJSONData|GeoJSONData[]|null} [geojson]
     * @param {GeoJSONOptions} [options]
     */
    constructor(geojson?: GeoJSONData | GeoJSONData[] | null, options?: GeoJSONOptions);
    /**
     * Adds a GeoJSON object to the layer.
     * @param {GeoJSONData|GeoJSONData[]} geojson
     * @returns {this}
     */
    addData(geojson: GeoJSONData | GeoJSONData[]): this;
    /**
     * Resets the given vector layer's style to the original GeoJSON style, useful for
     * resetting style after hover events. If `layer` is omitted, the style of all
     * features in the current layer is reset.
     * @param {Layer} [layer]
     * @returns {this}
     */
    resetStyle(layer?: Layer): this;
    /**
     * Changes styles of GeoJSON vector layers with the given style function.
     * @param {PathOptions|((geoJsonFeature: Feature) => PathOptions)} style
     * @returns {this}
     */
    setStyle(style: PathOptions | ((geoJsonFeature: Feature) => PathOptions)): this;
    /** The options of the GeoJSON, see [the options](#geojsonoptions). */
    options: GeoJSONOptions;
}
/**
 * Options of `GeoJSON`.
 */
export interface GeoJSONOptions extends InteractiveLayerOptions {
    /**
     * A
     * `Function` defining how GeoJSON points spawn Maplair layers. It is internally
     * called when data is added, passing the GeoJSON point feature and its `LatLng`.
     * The default is to spawn a default `Marker`:
     * ```js
     * function(geoJsonPoint, latlng) {
     * return new Marker(latlng);
     * }
     * ```
     */
    pointToLayer?: (geoJsonPoint: Feature, latlng: LatLng) => Layer;
    /**
     * A
     * `Function` defining the `Path options` for styling GeoJSON lines and polygons,
     * called internally when data is added.
     * The default value is to not override any defaults:
     * ```js
     * function (geoJsonFeature) {
     * return {}
     * }
     * ```
     */
    style?: PathOptions|((geoJsonFeature: Feature) => PathOptions);
    /**
     * A `Function`
     * that will be called once for each created `Feature`, after it has been created and
     * styled. Useful for attaching events and popups to features. It will receive the
     * `feature` as the first argument and its corresponding spawned `layer` from
     * [`asFeature`](#geojson-asFeature) as the second.
     * The default is to do nothing with the newly created layers:
     * ```js
     * function (feature, layer) {}
     * ```
     */
    onEachFeature?: (feature: Feature, layer: Layer) => void;
    /**
     * A `Function` that will be
     * used to decide whether to include a feature or not.
     * The default is to include all features:
     * ```js
     * function (geoJsonFeature) {
     * return true;
     * }
     * ```
     * Note: dynamically changing the `filter` option will have effect only on newly
     * added data. It will _not_ re-evaluate already included features.
     */
    filter?: (geoJsonFeature: Feature) => boolean;
    /**
     * A `Function` that will be
     * used for converting GeoJSON coordinates to `LatLng`s.
     * The default is the `coordsToLatLng` static method.
     */
    coordsToLatLng?: (coords: number[]) => LatLng;
    /**
     * Whether default Markers for "Point"
     * type Features inherit from group options.
     * @default false
     */
    markersInheritOptions?: boolean;
}
/**
 * Properties of layers created from GeoJSON.
 */
export interface GeoJSONLayerProperties {
    /**
     * The GeoJSON feature the layer was created from (by
     * `GeoJSON`).
     */
    feature?: Feature;
}
import { FeatureGroup } from './FeatureGroup.js';
import type { GeoJSON as GeoJSONData } from 'geojson';
import type { Layer } from './Layer.js';
import type { PathOptions } from './vector/Path.js';
import type { Feature } from 'geojson';
import type { GeoJsonObject } from 'geojson';
import { LatLng } from '../geo/LatLng.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import type { Geometry } from 'geojson';
import type { FeatureCollection } from 'geojson';
declare module './Layer.js' {
    interface Layer extends GeoJSONLayerProperties {
    }
}
