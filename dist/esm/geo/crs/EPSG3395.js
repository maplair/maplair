import { EarthCRS } from "./EarthCRS.js";
import { Transformation } from "../../geometry/Transformation.js";
import { Mercator } from "../projection/Projection.Mercator.js";
// src/geo/crs/EPSG3395.js
/** @import {Projection} from '../projection/index.js' */
/**
* Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
*/
var EPSG3395 = class extends EarthCRS {
	/** @type {string} */
	static code = "EPSG:3395";
	/** @type {Projection} */
	static projection = Mercator;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ (() => {
		const scale = .5 / (Math.PI * Mercator.R);
		return new Transformation(scale, .5, -scale, .5);
	})();
};
export { EPSG3395 };

//# sourceMappingURL=EPSG3395.js.map