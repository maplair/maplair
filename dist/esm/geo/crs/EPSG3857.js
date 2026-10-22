import { EarthCRS } from "./EarthCRS.js";
import { SphericalMercator } from "../projection/Projection.SphericalMercator.js";
import { Transformation } from "../../geometry/Transformation.js";
//#region src/geo/crs/EPSG3857.js
/** @import {Projection} from '../projection/index.js' */
/**
* The most common CRS for online maps, used by almost all free and commercial
* tile providers. Uses Spherical Mercator projection. Set in by default in
* Map's `crs` option.
*/
var EPSG3857 = class extends EarthCRS {
	/** @type {string} */
	static code = "EPSG:3857";
	/** @type {Projection} */
	static projection = SphericalMercator;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ (() => {
		const scale = .5 / (Math.PI * SphericalMercator.R);
		return new Transformation(scale, .5, -scale, .5);
	})();
};
/**
* The same as `EPSG3857`, with its former unofficial code `EPSG:900913`.
*/
var EPSG900913 = class extends EPSG3857 {
	/** @type {string} */
	static code = "EPSG:900913";
};
//#endregion
export { EPSG3857, EPSG900913 };

//# sourceMappingURL=EPSG3857.js.map