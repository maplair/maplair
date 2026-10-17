import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { Point } from "./Point.js";
import { LatLngBounds } from "../geo/LatLngBounds.js";
import { LatLng } from "../geo/LatLng.js";
import { _getBitCode, _getEdgeIntersection, isFlat } from "./LineUtil.js";
//#region src/geometry/PolyUtil.js
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
	let i, j, p1, p2, f, area, x, y, center;
	if (!latlngs || latlngs.length === 0) throw new Error("latlngs not passed");
	if (!isFlat(latlngs)) {
		console.warn("latlngs are not flat! Only the first ring will be used");
		latlngs = latlngs[0];
	}
	let centroidLatLng = new LatLng([0, 0]);
	const bounds = new LatLngBounds(latlngs);
	if (bounds.getNorthWest().distanceTo(bounds.getSouthWest()) * bounds.getNorthEast().distanceTo(bounds.getNorthWest()) < 1700) centroidLatLng = centroid(latlngs);
	const len = latlngs.length;
	const points = [];
	for (i = 0; i < len; i++) {
		const latlng = new LatLng(latlngs[i]);
		points.push(crs.project(new LatLng([latlng.lat - centroidLatLng.lat, latlng.lng - centroidLatLng.lng])));
	}
	area = x = y = 0;
	for (i = 0, j = len - 1; i < len; j = i++) {
		p1 = points[i];
		p2 = points[j];
		f = p1.y * p2.x - p2.y * p1.x;
		x += (p1.x + p2.x) * f;
		y += (p1.y + p2.y) * f;
		area += f * 3;
	}
	if (area === 0) center = points[0];
	else center = [x / area, y / area];
	const latlngCenter = crs.unproject(new Point(center));
	return new LatLng([latlngCenter.lat + centroidLatLng.lat, latlngCenter.lng + centroidLatLng.lng]);
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
		const latlng = new LatLng(coord);
		latSum += latlng.lat;
		lngSum += latlng.lng;
		len++;
	}
	return new LatLng([latSum / len, lngSum / len]);
}
//#endregion
export { PolyUtil_exports, centroid, clipPolygon, polygonCenter };

//# sourceMappingURL=PolyUtil.js.map