import * as Util from '../core/Util.js';
import {LatLng} from '../geo/LatLng.js';
import * as LineUtil from '../geometry/LineUtil.js';

/** @import {Feature, FeatureCollection, GeoJsonObject, Geometry} from 'geojson' */
/** @import {Layer} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */

// Shared by `GeoJSON` and the `toGeoJSON` methods of the layers it creates, which can't import `GeoJSON.js` without a cycle.

/**
 * See `GeoJSON.latLngToCoords()`.
 * @param {LatLngExpression} latlng
 * @param {number|false} [precision]
 * @returns {number[]}
 */
export function latLngToCoords(latlng, precision) {
	latlng = LatLng.from(latlng);
	return latlng.alt !== undefined ?
		[Util.formatNum(latlng.lng, precision), Util.formatNum(latlng.lat, precision), Util.formatNum(latlng.alt, precision)] :
		[Util.formatNum(latlng.lng, precision), Util.formatNum(latlng.lat, precision)];
}

/**
 * See `GeoJSON.latLngsToCoords()`.
 * @param {any[]} latlngs
 * @param {number} [levelsDeep]
 * @param {boolean} [close]
 * @param {number|false} [precision]
 * @returns {any[]}
 */
export function latLngsToCoords(latlngs, levelsDeep, close, precision) {
	// Check for flat arrays required to ensure unbalanced arrays are correctly converted in recursion
	const coords = latlngs.map(latlng => (levelsDeep ?
		latLngsToCoords(latlng, LineUtil.isFlat(latlng) ? 0 : levelsDeep - 1, close, precision) :
		latLngToCoords(latlng, precision)));

	if (!levelsDeep && close && coords.length > 0) {
		coords.push(coords[0].slice());
	}

	return coords;
}

/**
 * See `GeoJSON.getFeature()`.
 * @param {Layer} layer
 * @param {Geometry} newGeometry
 * @returns {Feature}
 */
export function getFeature(layer, newGeometry) {
	return layer.feature ?
		{...layer.feature, geometry: newGeometry} :
		asFeature(newGeometry);
}

/**
 * See `GeoJSON.asFeature()`.
 * @param {GeoJsonObject} geojson
 * @returns {Feature|FeatureCollection}
 */
export function asFeature(geojson) {
	if (geojson.type === 'Feature' || geojson.type === 'FeatureCollection') {
		return geojson;
	}

	return {
		type: 'Feature',
		properties: {},
		geometry: geojson
	};
}

/**
 * The GeoJSON `Point` Feature of a layer with `getLatLng()`, for its `toGeoJSON()`.
 * @param {Layer & {getLatLng(): LatLng}} layer
 * @param {number|false} [precision]
 * @returns {Feature}
 */
export function pointToGeoJSON(layer, precision) {
	return getFeature(layer, {
		type: 'Point',
		coordinates: latLngToCoords(layer.getLatLng(), precision)
	});
}
