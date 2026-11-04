import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { Point } from "./Point.js";
import { LatLng } from "../geo/LatLng.js";
import { _getEdgeIntersection, _projectRing } from "./LineUtil.js";
// src/geometry/PolyUtil.js
var PolyUtil_exports = /* @__PURE__ */ __exportAll({
	centroid: () => centroid,
	clipPolygon: () => clipPolygon,
	polygonCenter: () => polygonCenter
});
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {Bounds} from './Bounds.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/**
* Clips the polygon geometry defined by the given `points` by the given bounds (using
* the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
* Used by Maplair to only show polygon points that are on the screen or near, increasing
* performance. Note that polygon points needs different algorithm for clipping
* than polyline, so there's a separate method for it.
* @param {Point[]} points
* @param {Bounds} bounds
* @param {boolean} [round]
* @returns {Point[]}
*/
function clipPolygon(points, bounds, round) {
	for (const edge of [
		1,
		4,
		2,
		8
	]) {
		if (!points.length) break;
		/** @type {Point[]} */
		const clippedPoints = [];
		let b = points[points.length - 1], bOut = isOutside(b, edge, bounds);
		for (const a of points) {
			const aOut = isOutside(a, edge, bounds);
			if (aOut !== bOut) clippedPoints.push(_getEdgeIntersection(b, a, edge, bounds, round));
			if (!aOut) clippedPoints.push(a);
			b = a;
			bOut = aOut;
		}
		points = clippedPoints;
	}
	return points;
}
function isOutside(p, edge, bounds) {
	return edge === 1 ? p.x < bounds.min.x : edge === 2 ? p.x > bounds.max.x : edge === 4 ? p.y < bounds.min.y : p.y > bounds.max.y;
}
/**
* Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the passed
* LatLngs (first ring) from a polygon.
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @param {typeof CRS} crs
* @returns {LatLng}
*/
function polygonCenter(latlngs, crs) {
	const points = _projectRing(latlngs, crs), origin = new Point(points[0]), len = points.length;
	for (const p of points) p._subtract(origin);
	let area = 0, x = 0, y = 0;
	for (let i = 0, j = len - 1; i < len; j = i++) {
		const p1 = points[i], p2 = points[j], f = p1.y * p2.x - p2.y * p1.x;
		x += (p1.x + p2.x) * f;
		y += (p1.y + p2.y) * f;
		area += f;
	}
	return crs.unproject(area === 0 ? origin : new Point(x / (3 * area), y / (3 * area))._add(origin));
}
/**
* Returns the 'center of mass' of the passed LatLngs.
* @param {LatLngExpression[]} coords
* @returns {LatLng}
*/
function centroid(coords) {
	let latSum = 0;
	let lngSum = 0;
	let len = 0;
	for (const coord of coords) {
		const latlng = LatLng.from(coord);
		latSum += latlng.lat;
		lngSum += latlng.lng;
		len++;
	}
	return new LatLng([latSum / len, lngSum / len]);
}
export { PolyUtil_exports, centroid, clipPolygon, polygonCenter };

//# sourceMappingURL=PolyUtil.js.map