import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { Point } from "./Point.js";
import { LatLng } from "../geo/LatLng.js";
// src/geometry/LineUtil.js
var LineUtil_exports = /* @__PURE__ */ __exportAll({
	_getBitCode: () => _getBitCode,
	_getEdgeIntersection: () => _getEdgeIntersection,
	_projectRing: () => _projectRing,
	_sqClosestPointOnSegment: () => _sqClosestPointOnSegment,
	clipSegment: () => clipSegment,
	closestPointOnSegment: () => closestPointOnSegment,
	isFlat: () => isFlat,
	pointToSegmentDistance: () => pointToSegmentDistance,
	polylineCenter: () => polylineCenter,
	simplify: () => simplify
});
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {Bounds} from './Bounds.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/**
* Dramatically reduces the number of points in a polyline while retaining
* its shape and returns a new array of simplified points, using the
* [Ramer-Douglas-Peucker algorithm](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm).
* Used for a huge performance boost when processing/displaying Maplair polylines for
* each zoom level and also reducing visual noise. tolerance affects the amount of
* simplification (lesser value means higher quality but slower and with more points).
* Also released as a separated micro-library
* [Simplify.js](https://mourner.github.io/simplify-js/).
* @param {Point[]} points
* @param {number} tolerance
* @returns {Point[]}
*/
function simplify(points, tolerance) {
	if (!tolerance || !points.length) return points.slice();
	const sqTolerance = tolerance * tolerance;
	points = _reducePoints(points, sqTolerance);
	points = _simplifyDP(points, sqTolerance);
	return points;
}
/**
* Returns the distance between point `p` and segment `p1` to `p2`.
* @param {Point} p
* @param {Point} p1
* @param {Point} p2
* @returns {number}
*/
function pointToSegmentDistance(p, p1, p2) {
	return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
}
/**
* Returns the closest point from a point `p` on a segment `p1` to `p2`.
* @param {Point} p
* @param {Point} p1
* @param {Point} p2
* @returns {Point}
*/
function closestPointOnSegment(p, p1, p2) {
	return _sqClosestPointOnSegment(p, p1, p2);
}
function _simplifyDP(points, sqTolerance) {
	const len = points.length, markers = new Uint8Array(len);
	markers[0] = markers[len - 1] = 1;
	_simplifyDPStep(points, markers, sqTolerance, 0, len - 1);
	let i;
	const newPoints = [];
	for (i = 0; i < len; i++) if (markers[i]) newPoints.push(points[i]);
	return newPoints;
}
function _simplifyDPStep(points, markers, sqTolerance, first, last) {
	let maxSqDist = 0, index, i, sqDist;
	for (i = first + 1; i <= last - 1; i++) {
		sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);
		if (sqDist > maxSqDist) {
			index = i;
			maxSqDist = sqDist;
		}
	}
	if (maxSqDist > sqTolerance) {
		markers[index] = 1;
		_simplifyDPStep(points, markers, sqTolerance, first, index);
		_simplifyDPStep(points, markers, sqTolerance, index, last);
	}
}
function _reducePoints(points, sqTolerance) {
	const reducedPoints = [points[0]];
	let prev = 0;
	for (let i = 1; i < points.length; i++) if (_sqDist(points[i], points[prev]) > sqTolerance) {
		reducedPoints.push(points[i]);
		prev = i;
	}
	if (prev < points.length - 1) reducedPoints.push(points[points.length - 1]);
	return reducedPoints;
}
let _lastCode;
/**
* Clips the segment a to b by rectangular bounds with the
* [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
* (modifying the segment points directly!). Used by Maplair to only show polyline
* points that are on the screen or near, increasing performance. Returns `false` if
* the segment is outside of the bounds.
* @param {Point} a
* @param {Point} b
* @param {Bounds} bounds
* @param {boolean} [useLastCode]
* @param {boolean} [round]
* @returns {[Point, Point]|false}
*/
function clipSegment(a, b, bounds, useLastCode, round) {
	const a0 = a, b0 = b;
	let codeA = useLastCode ? _lastCode : _getBitCode(a, bounds), codeB = _getBitCode(b, bounds), codeOut, p, newCode;
	_lastCode = codeB;
	while (true) {
		if (!(codeA | codeB)) {
			if (round) {
				if (a !== a0) a = a.round();
				if (b !== b0) b = b.round();
			}
			return [a, b];
		}
		if (codeA & codeB) return false;
		codeOut = codeA || codeB;
		p = _getEdgeIntersection(a, b, codeOut, bounds);
		newCode = _getBitCode(p, bounds);
		if (codeOut === codeA) {
			a = p;
			codeA = newCode;
		} else {
			b = p;
			codeB = newCode;
		}
	}
}
function _getEdgeIntersection(a, b, code, bounds, round) {
	const dx = b.x - a.x, dy = b.y - a.y, min = bounds.min, max = bounds.max;
	let x, y;
	if (code & 8) {
		x = a.x + dx * (max.y - a.y) / dy;
		y = max.y;
	} else if (code & 4) {
		x = a.x + dx * (min.y - a.y) / dy;
		y = min.y;
	} else if (code & 2) {
		x = max.x;
		y = a.y + dy * (max.x - a.x) / dx;
	} else if (code & 1) {
		x = min.x;
		y = a.y + dy * (min.x - a.x) / dx;
	}
	return new Point(x, y, round);
}
function _getBitCode(p, bounds) {
	let code = 0;
	if (p.x < bounds.min.x) code |= 1;
	else if (p.x > bounds.max.x) code |= 2;
	if (p.y < bounds.min.y) code |= 4;
	else if (p.y > bounds.max.y) code |= 8;
	return code;
}
function _sqDist(p1, p2) {
	const dx = p2.x - p1.x, dy = p2.y - p1.y;
	return dx * dx + dy * dy;
}
function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
	let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y, t;
	const dot = dx * dx + dy * dy;
	if (dot > 0) {
		t = ((p.x - x) * dx + (p.y - y) * dy) / dot;
		if (t > 1) {
			x = p2.x;
			y = p2.y;
		} else if (t > 0) {
			x += dx * t;
			y += dy * t;
		}
	}
	dx = p.x - x;
	dy = p.y - y;
	return sqDist ? dx * dx + dy * dy : new Point(x, y);
}
/**
* Returns true if `latlngs` is a flat array, false is nested.
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @returns {boolean}
*/
function isFlat(latlngs) {
	return !Array.isArray(latlngs[0]) || typeof latlngs[0][0] !== "object" && typeof latlngs[0][0] !== "undefined";
}
/**
* Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the passed
* LatLngs (first ring) from a polyline.
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @param {typeof CRS} crs
* @returns {LatLng}
*/
function polylineCenter(latlngs, crs) {
	const points = _projectRing(latlngs, crs), len = points.length;
	let halfDist = 0;
	for (let i = 1; i < len; i++) halfDist += points[i - 1].distanceTo(points[i]);
	halfDist /= 2;
	let center = points[0];
	for (let i = 1, dist = 0; i < len; i++) {
		const p1 = points[i - 1], p2 = points[i], segDist = p1.distanceTo(p2);
		dist += segDist;
		if (dist > halfDist) {
			const ratio = (dist - halfDist) / segDist;
			center = new Point(p2.x - ratio * (p2.x - p1.x), p2.y - ratio * (p2.y - p1.y));
			break;
		}
	}
	return crs.unproject(center);
}
/**
* Projects the first ring of the given latlngs.
* @internal
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @param {typeof CRS} crs
* @returns {Point[]}
*/
function _projectRing(latlngs, crs) {
	if (!latlngs || latlngs.length === 0) throw new Error("latlngs not passed");
	if (!isFlat(latlngs)) {
		console.warn("latlngs are not flat! Only the first ring will be used");
		latlngs = latlngs[0];
	}
	return latlngs.map((latlng) => crs.project(LatLng.from(latlng)));
}
export { LineUtil_exports, _getBitCode, _getEdgeIntersection, _projectRing, _sqClosestPointOnSegment, clipSegment, closestPointOnSegment, isFlat, pointToSegmentDistance, polylineCenter, simplify };

//# sourceMappingURL=LineUtil.js.map