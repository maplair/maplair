/** @import {Feature, FeatureCollection, GeoJsonObject, Geometry} from 'geojson' */
/** @import {Layer} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/**
 * See `GeoJSON.latLngToCoords()`.
 * @param {LatLngExpression} latlng
 * @param {number|false} [precision]
 * @returns {number[]}
 */
export function latLngToCoords(latlng: LatLngExpression, precision?: number | false): number[];
/**
 * See `GeoJSON.latLngsToCoords()`.
 * @param {any[]} latlngs
 * @param {number} [levelsDeep]
 * @param {boolean} [close]
 * @param {number|false} [precision]
 * @returns {any[]}
 */
export function latLngsToCoords(latlngs: any[], levelsDeep?: number, close?: boolean, precision?: number | false): any[];
/**
 * See `GeoJSON.getFeature()`.
 * @param {Layer} layer
 * @param {Geometry} newGeometry
 * @returns {Feature}
 */
export function getFeature(layer: Layer, newGeometry: Geometry): Feature;
/**
 * See `GeoJSON.asFeature()`.
 * @param {GeoJsonObject} geojson
 * @returns {Feature|FeatureCollection}
 */
export function asFeature(geojson: GeoJsonObject): Feature | FeatureCollection;
/**
 * The GeoJSON `Point` Feature of a layer with `getLatLng()`, for its `toGeoJSON()`.
 * @param {Layer & {getLatLng(): LatLng}} layer
 * @param {number|false} [precision]
 * @returns {Feature}
 */
export function pointToGeoJSON(layer: Layer & {
    getLatLng(): LatLng;
}, precision?: number | false): Feature;
import type { LatLngExpression } from '../geo/LatLng.js';
import type { Layer } from './Layer.js';
import type { Geometry } from 'geojson';
import type { Feature } from 'geojson';
import type { GeoJsonObject } from 'geojson';
import type { FeatureCollection } from 'geojson';
import { LatLng } from '../geo/LatLng.js';
