import { EarthCRS } from "./EarthCRS.js";
import { Transformation } from "../../geometry/Transformation.js";
import { LonLat } from "../projection/Projection.LonLat.js";
//#region src/geo/crs/EPSG4326.js
/** @import {Projection} from '../projection/index.js' */
/**
* A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
*
* Maplair complies with the
* [TMS coordinate scheme for EPSG:4326](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic).
* If you are using a `TileLayer` with this CRS, ensure that there are two 256x256
* pixel tiles covering the whole earth at zoom level zero, and that the tile
* coordinate origin is (-180,+90), or (-180,-90) for `TileLayer`s with
* [the `tms` option](#tilelayer-tms) set.
*/
var EPSG4326 = class extends EarthCRS {
	/** @type {string} */
	static code = "EPSG:4326";
	/** @type {Projection} */
	static projection = LonLat;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ new Transformation(1 / 180, 1, -1 / 180, .5);
};
//#endregion
export { EPSG4326 };

//# sourceMappingURL=EPSG4326.js.map