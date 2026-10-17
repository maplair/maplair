import type { LatLng } from '../LatLng.js';
import type { Bounds } from '../../geometry/Bounds.js';
import type { Point } from '../../geometry/Point.js';
/** @import {Projection} from './index.js' */
/**
 * Equirectangular, or Plate Carree projection — the most simple projection,
 * mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
 * latitude. Also suitable for flat worlds, e.g. game maps. Used by the
 * `EPSG4326` and `SimpleCRS` CRS.
 * @type {Projection}
 */
export const LonLat: Projection;
import type { Projection } from './index.js';
