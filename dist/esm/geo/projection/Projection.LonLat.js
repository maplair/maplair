import { Point } from "../../geometry/Point.js";
import { Bounds } from "../../geometry/Bounds.js";
import { LatLng } from "../LatLng.js";
// src/geo/projection/Projection.LonLat.js
/** @import {Projection} from './index.js' */
/**
* Equirectangular, or Plate Carree projection — the most simple projection,
* mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
* latitude. Also suitable for flat worlds, e.g. game maps. Used by the
* `EPSG4326` and `SimpleCRS` CRS.
* @type {Projection}
*/
const LonLat = {
	project(latlng) {
		latlng = LatLng.from(latlng);
		return new Point(latlng.lng, latlng.lat);
	},
	unproject(point) {
		point = Point.from(point);
		return new LatLng(point.y, point.x);
	},
	bounds: /* @__PURE__ */ new Bounds([-180, -90], [180, 90])
};
export { LonLat };

//# sourceMappingURL=Projection.LonLat.js.map