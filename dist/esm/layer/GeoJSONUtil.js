import { formatNum } from "../core/Util.js";
import { LatLng } from "../geo/LatLng.js";
import { isFlat } from "../geometry/LineUtil.js";
// src/layer/GeoJSONUtil.js
/** @import {Feature, FeatureCollection, GeoJsonObject, Geometry} from 'geojson' */
/** @import {Layer} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/**
* See `GeoJSON.latLngToCoords()`.
* @param {LatLngExpression} latlng
* @param {number|false} [precision]
* @returns {number[]}
*/
function latLngToCoords(latlng, precision) {
	latlng = LatLng.from(latlng);
	return latlng.alt !== void 0 ? [
		formatNum(latlng.lng, precision),
		formatNum(latlng.lat, precision),
		formatNum(latlng.alt, precision)
	] : [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision)];
}
/**
* See `GeoJSON.latLngsToCoords()`.
* @param {any[]} latlngs
* @param {number} [levelsDeep]
* @param {boolean} [close]
* @param {number|false} [precision]
* @returns {any[]}
*/
function latLngsToCoords(latlngs, levelsDeep, close, precision) {
	const coords = latlngs.map((latlng) => levelsDeep ? latLngsToCoords(latlng, isFlat(latlng) ? 0 : levelsDeep - 1, close, precision) : latLngToCoords(latlng, precision));
	if (!levelsDeep && close && coords.length > 0) coords.push(coords[0].slice());
	return coords;
}
/**
* See `GeoJSON.getFeature()`.
* @param {Layer} layer
* @param {Geometry} newGeometry
* @returns {Feature}
*/
function getFeature(layer, newGeometry) {
	return layer.feature ? {
		...layer.feature,
		geometry: newGeometry
	} : asFeature(newGeometry);
}
/**
* See `GeoJSON.asFeature()`.
* @param {GeoJsonObject} geojson
* @returns {Feature|FeatureCollection}
*/
function asFeature(geojson) {
	if (geojson.type === "Feature" || geojson.type === "FeatureCollection") return geojson;
	return {
		type: "Feature",
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
function pointToGeoJSON(layer, precision) {
	return getFeature(layer, {
		type: "Point",
		coordinates: latLngToCoords(layer.getLatLng(), precision)
	});
}
export { asFeature, getFeature, latLngToCoords, latLngsToCoords, pointToGeoJSON };

//# sourceMappingURL=GeoJSONUtil.js.map