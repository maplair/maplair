import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { Point } from "./Point.js";
import { LatLng } from "../geo/LatLng.js";
import { _getBitCode, _getEdgeIntersection, _projectRing } from "./LineUtil.js";
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
	let clippedPoints, i, j, k, a, b, len, edge, p;
	const edges = [
		1,
		4,
		2,
		8
	];
	for (i = 0, len = points.length; i < len; i++) points[i]._code = _getBitCode(points[i], bounds);
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];
		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];
			if (!(a._code & edge)) {
				if (b._code & edge) {
					p = _getEdgeIntersection(b, a, edge, bounds, round);
					p._code = _getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);
			} else if (!(b._code & edge)) {
				p = _getEdgeIntersection(b, a, edge, bounds, round);
				p._code = _getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}
	return points;
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