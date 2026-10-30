// The bundles (e.g. for script tags) contain all optional features, which the
// ES modules (see `src/Maplair.js`) only contain when imported separately.
export * from './Maplair.js';
export {RotateControl} from './map/Map.Rotation.js';
import './layer/marker/Marker.Move.js';
import './layer/vector/Path.DashAnimation.js';
import './layer/vector/Polyline.Decorations.js';
import './layer/GeoJSON.Load.js';
import './layer/vector/Path.ZoomStyles.js';
