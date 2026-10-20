import {LatLng} from '../LatLng.js';
import {Bounds} from '../../geometry/Bounds.js';
import {Point} from '../../geometry/Point.js';

/** @import {Projection} from './index.js' */

const earthRadius = 6378137;

/**
 * Spherical Mercator projection — the most common projection for online maps,
 * used by almost all free and commercial tile providers. Assumes that Earth is
 * a sphere. Used by the `EPSG:3857` CRS.
 * @type {Projection & {R: number, MAX_LATITUDE: number}}
 */
export const SphericalMercator = {

	R: earthRadius,
	MAX_LATITUDE: 85.0511287798,

	project(latlng) {
		latlng = LatLng.from(latlng);
		const d = Math.PI / 180,
		max = this.MAX_LATITUDE,
		lat = Math.max(Math.min(max, latlng.lat), -max),
		sin = Math.sin(lat * d);

		return new Point(
			this.R * latlng.lng * d,
			this.R * Math.log((1 + sin) / (1 - sin)) / 2);
	},

	unproject(point) {
		point = Point.from(point);
		const d = 180 / Math.PI;

		return new LatLng(
			(2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
			point.x * d / this.R);
	},

	bounds: /* @__PURE__ */ (() => {
		const d = earthRadius * Math.PI;
		return new Bounds([-d, -d], [d, d]);
	})()
};
