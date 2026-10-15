// Runs Leaflet.markercluster's test suite against Maplair: provides the globals of
// its original Karma setup (`L`, expect.js and sinon), with the Leaflet 1 style
// factories and class names used by the specs.
import * as Maplair from 'maplair';
import * as MarkerClusters from '../src/index.js';
import expectSource from './expect.js?raw';
import sinonSource from './sinon.js?raw';
import '../dist/MarkerCluster.css';
import '../dist/MarkerCluster.Default.css';

// global scripts, like in the original setup
for (const source of [expectSource, sinonSource]) {
	const script = document.createElement('script');
	script.textContent = source;
	document.head.append(script);
}

// The specs drive (zoom) animations with sinon's fake clock, which doesn't cover
// requestAnimationFrame. They were written for PhantomJS, where Leaflet fell back
// to setTimeout for animation frames, so do the same here.
window.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 16);
window.cancelAnimationFrame = id => clearTimeout(id);

const L = {...Maplair, ...MarkerClusters};

const factories = {
	map: Maplair.MaplairMap,
	marker: Maplair.Marker,
	markerClusterGroup: MarkerClusters.MarkerClusterGroup,
	latLng: Maplair.LatLng,
	latLngBounds: Maplair.LatLngBounds,
	point: Maplair.Point,
	layerGroup: Maplair.LayerGroup,
	featureGroup: Maplair.FeatureGroup,
	circle: Maplair.Circle,
	circleMarker: Maplair.CircleMarker,
	polygon: Maplair.Polygon,
	polyline: Maplair.Polyline,
	divIcon: Maplair.DivIcon,
	icon: Maplair.Icon,
	tileLayer: Maplair.TileLayer
};
for (const [name, Cls] of Object.entries(factories)) {
	L[name] = (...args) => new Cls(...args);
}

L.Map = Maplair.MaplairMap;
L.CRS = {
	EPSG3857: Maplair.EPSG3857,
	EPSG4326: Maplair.EPSG4326,
	Simple: Maplair.SimpleCRS
};

window.L = L;
