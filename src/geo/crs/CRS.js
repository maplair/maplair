
import {Bounds} from '../../geometry/Bounds.js';
import {LatLng} from '../LatLng.js';
import {LatLngBounds} from '../LatLngBounds.js';
import * as Util from '../../core/Util.js';
/** @import {LatLngExpression} from '../LatLng.js' */
/** @import {LatLngBoundsExpression} from '../LatLngBounds.js' */
/** @import {Point} from '../../geometry/Point.js' */
/** @import {Transformation} from '../../geometry/Transformation.js' */
/** @import {Projection} from '../projection/index.js' */

/**
 * Object that defines coordinate reference systems for projecting
 * geographical points into pixel (screen) coordinates and back (and to
 * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service)
 * services). See
 * [spatial reference system](https://en.wikipedia.org/wiki/Spatial_reference_system).
 *
 * Maplair defines the most usual CRSs by default. If you want to use a
 * CRS not defined by default, take a look at the
 * [Proj4Maplair](https://github.com/kartena/Proj4Leaflet) plugin.
 *
 * The CRSs are classes with static properties and methods only; they are not
 * instantiated, the class itself is passed as the CRS, e.g. to the `crs` option of the
 * map. Maplair's CRSs extend `CRS` (`EarthCRS` for the global ones).
 *
 * Besides the properties and methods below, a CRS may define:
 *
 * * `code: string`: Standard code name of the CRS passed into WMS services (e.g.
 *   `'EPSG:3857'`).
 * * `wrapLng: [number, number]`: An array of two numbers defining whether the longitude
 *   (horizontal) coordinate axis wraps around a given range and how. Defaults to
 *   `[-180, 180]` in most geographical CRSs. If `undefined`, the longitude axis does
 *   not wrap around.
 * * `wrapLat: [number, number]`: Like `wrapLng`, but for the latitude (vertical) axis.
 * * `distance(latlng1: LatLng, latlng2: LatLng): number`: Returns the distance between
 *   two geographical coordinates.
 */
export class CRS {
	/**
	 * The projection of the CRS.
	 * @type {Projection|undefined}
	 */
	static projection = undefined;
	/**
	 * The transformation of projected coordinates into pixel coordinates at zoom 0.
	 * @type {Transformation|undefined}
	 */
	static transformation = undefined;

	/**
	 * Projects geographical coordinates into pixel coordinates for a given zoom.
	 * @param {LatLngExpression} latlng
	 * @param {number} zoom
	 * @returns {Point}
	 */
	static latLngToPoint(latlng, zoom) {
		const projectedPoint = this.projection.project(latlng),
		scale = this.scale(zoom);

		return this.transformation._transform(projectedPoint, scale);
	}

	/**
	 * The inverse of `latLngToPoint`. Projects pixel coordinates on a given
	 * zoom into geographical coordinates.
	 * @param {Point} point
	 * @param {number} zoom
	 * @returns {LatLng}
	 */
	static pointToLatLng(point, zoom) {
		const scale = this.scale(zoom),
		untransformedPoint = this.transformation.untransform(point, scale);

		return this.projection.unproject(untransformedPoint);
	}

	/**
	 * Projects geographical coordinates into coordinates in units accepted for
	 * this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
	 * @param {LatLngExpression} latlng
	 * @returns {Point}
	 */
	static project(latlng) {
		return this.projection.project(latlng);
	}

	/**
	 * Given a projected coordinate returns the corresponding LatLng.
	 * The inverse of `project`.
	 * @param {Point} point
	 * @returns {LatLng}
	 */
	static unproject(point) {
		return this.projection.unproject(point);
	}

	/**
	 * Returns the scale used when transforming projected coordinates into
	 * pixel coordinates for a particular zoom. For example, it returns
	 * `256 * 2^zoom` for Mercator-based CRS.
	 * @param {number} zoom
	 * @returns {number}
	 */
	static scale(zoom) {
		return 256 * 2 ** zoom;
	}

	/**
	 * Inverse of `scale()`, returns the zoom level corresponding to a scale
	 * factor of `scale`.
	 * @param {number} scale
	 * @returns {number}
	 */
	static zoom(scale) {
		return Math.log(scale / 256) / Math.LN2;
	}

	/**
	 * Returns the projection's bounds scaled and transformed for the provided `zoom`
	 * (`null` if the CRS is `infinite`).
	 * @param {number} zoom
	 * @returns {Bounds|null}
	 */
	static getProjectedBounds(zoom) {
		if (this.infinite) { return null; }

		const b = this.projection.bounds,
		s = this.scale(zoom),
		min = this.transformation.transform(b.min, s),
		max = this.transformation.transform(b.max, s);

		return new Bounds(min, max);
	}

	/**
	 * If true, the coordinate space will be unbounded (infinite in both axes).
	 * @type {boolean}
	 */
	static infinite = false;

	/**
	 * Returns a `LatLng` where lat and lng has been wrapped according to the
	 * CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
	 * @param {LatLngExpression} latlng
	 * @returns {LatLng}
	 */
	static wrapLatLng(latlng) {
		latlng = new LatLng(latlng);
		const lng = this.wrapLng ? Util.wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
		lat = this.wrapLat ? Util.wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
		alt = latlng.alt;

		return new LatLng(lat, lng, alt);
	}

	/**
	 * Returns a `LatLngBounds` with the same size as the given one, ensuring
	 * that its center is within the CRS's bounds.
	 * @param {LatLngBoundsExpression} bounds
	 * @returns {LatLngBounds}
	 */
	static wrapLatLngBounds(bounds) {
		bounds = new LatLngBounds(bounds);
		const center = bounds.getCenter(),
		newCenter = this.wrapLatLng(center),
		latShift = center.lat - newCenter.lat,
		lngShift = center.lng - newCenter.lng;

		if (latShift === 0 && lngShift === 0) {
			return bounds;
		}

		const sw = bounds.getSouthWest(),
		ne = bounds.getNorthEast(),
		newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift),
		newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);

		return new LatLngBounds(newSw, newNe);
	}
}
