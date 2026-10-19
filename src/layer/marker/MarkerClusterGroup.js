import {FeatureGroup} from '../FeatureGroup.js';
import {Marker} from './Marker.js';
import {DivIcon} from './DivIcon.js';
import {Polyline} from '../vector/Polyline.js';
import {LatLng} from '../../geo/LatLng.js';
import {LatLngBounds} from '../../geo/LatLngBounds.js';
import {Point} from '../../geometry/Point.js';
import {I18n} from '../../core/I18n.js';
/** @import {Layer, LayerOptions} from '../Layer.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */

/**
 * A cluster of markers, see `MarkerClusterGroup`.
 * @typedef {object} MarkerCluster
 * @property {LatLng} latlng The position of the cluster marker: the mean of the
 * positions of its markers.
 * @property {LatLngBounds} bounds The bounds of its markers.
 * @property {Layer[]} markers Its markers.
 * @property {number} count The number of its markers.
 */

/**
 * The event object of `clusterclick`.
 * @typedef {object} ClusterClickEvent
 * @property {MarkerCluster} cluster The clicked cluster.
 * @property {Marker} layer The marker of the cluster.
 * @property {Event} originalEvent The DOM event of the click.
 * @extends MaplairEvent
 */

/**
 * Options of `MarkerClusterGroup`.
 * @typedef {object} MarkerClusterGroupOptions
 * @property {number} [maxClusterRadius=80] The maximum distance in pixels between the
 * first marker of a cluster and the other ones.
 * @property {number} [disableClusteringAtZoom] From this zoom level on, the markers are
 * shown without clustering.
 * @property {boolean} [zoomToBoundsOnClick=true] Whether a click on a cluster zooms to
 * the bounds of its markers.
 * @property {boolean} [spiderfyOnMaxZoom=true] Whether a click on a cluster which
 * zooming in doesn't split (e.g. markers at the same position, or at the maximum
 * zoom) spreads its markers in a circle around it ("spiderfies" them). Until the next
 * click on the map, change of the zoom or of the layers, their `getLatLng()` returns
 * the spread positions. Clusters can also be activated with the <kbd>Enter</kbd> key.
 * @property {(cluster: MarkerCluster) => DivIcon} [iconCreateFunction] Returns the icon
 * of a cluster, by default a circle with the count, sized and colored by the
 * `maplair-cluster-small`, `-medium` and `-large` CSS classes (for up to 9, 99 and
 * more markers).
 * @extends LayerOptions
 */

/**
 * A layer group clustering its markers: nearby markers are shown as one marker with
 * their count, which zooms in to them when clicked. The clusters are computed for
 * the zoom level of the map, and only the ones near the view are on the map, so
 * that tens of thousands of markers stay fast. Accepts all layers with a single
 * position (`getLatLng()`), e.g. markers and circle markers; other layers are shown
 * without clustering. Events of the markers (e.g. `click`) propagate to the group.
 *
 * Replaces the [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
 * plugin for the common use cases, with its option names; without animations and
 * cluster coverage polygons.
 *
 * @example
 * ```js
 * const clusters = new MarkerClusterGroup();
 * for (const [lat, lng, name] of places) {
 * 	clusters.addLayer(new Marker([lat, lng]).bindPopup(name));
 * }
 * map.addLayer(clusters);
 * ```
 *
 * @fires MarkerClusterGroup#clusterclick {ClusterClickEvent} Fired when a cluster is
 * clicked.
 */
export class MarkerClusterGroup extends FeatureGroup {

	static {
		this.setDefaultOptions({
			maxClusterRadius: 80,
			disableClusteringAtZoom: undefined,
			zoomToBoundsOnClick: true,
			spiderfyOnMaxZoom: true,
			iconCreateFunction: undefined
		});
	}

	/**
	 * Creates a cluster group with the given layers.
	 * @param {Layer[]} [layers]
	 * @param {MarkerClusterGroupOptions} [options]
	 */
	constructor(layers, options) {
		super(layers, options);
		// the layers on the map: cluster markers, and the markers not in a cluster
		this._shown = new Set();
		this.callInitHooks(MarkerClusterGroup);
	}

	/**
	 * Adds the given layer to the group.
	 * @param {Layer} layer
	 * @returns {this}
	 */
	addLayer(layer) {
		return this.addLayers([layer]);
	}

	/**
	 * Adds the given layers to the group, clustering once instead of for each layer.
	 * @param {Layer[]} layers
	 * @returns {this}
	 */
	addLayers(layers) {
		for (const layer of layers) {
			if (!this.hasLayer(layer)) {
				layer.addEventParent(this).on('dragend', this._onDragEnd, this);
				this._layers[this.getLayerId(layer)] = layer;
				this.fire('layeradd', {layer});
			}
		}
		return this.refreshClusters();
	}

	/**
	 * Removes the given layer from the group.
	 * @param {Layer|number} layer The layer or its id.
	 * @returns {this}
	 */
	removeLayer(layer) {
		layer = typeof layer === 'number' ? this._layers[layer] : layer;
		if (!layer || !this.hasLayer(layer)) {
			return this;
		}
		this._unspiderfy();
		layer.removeEventParent(this).off('dragend', this._onDragEnd, this);
		delete this._layers[this.getLayerId(layer)];
		if (this._shown?.delete(layer)) {
			this._map.removeLayer(layer);
		}
		this.fire('layerremove', {layer});
		return this.refreshClusters();
	}

	/**
	 * Removes all layers from the group.
	 * @returns {this}
	 */
	clearLayers() {
		this._unspiderfy();
		for (const layer of this.getLayers()) {
			layer.removeEventParent(this).off('dragend', this._onDragEnd, this);
			this.fire('layerremove', {layer});
		}
		this._layers = {};
		return this.refreshClusters();
	}

	/**
	 * Computes the clusters again, e.g. after markers of the group were moved with
	 * `setLatLng()`. Happens by itself when the zoom changes or layers are added or
	 * removed.
	 * @returns {this}
	 */
	refreshClusters() {
		this._clusters = null;
		if (this._map) {
			this._update();
		}
		return this;
	}

	onAdd() {
		this._clusters = null;
		this._update();
	}

	onRemove(map) {
		this._unspiderfy();
		for (const layer of this._shown) {
			map.removeLayer(layer);
		}
		this._shown.clear();
	}

	getEvents() {
		return {
			moveend: this._update,
			zoomstart: this._unspiderfy,
			click: this._unspiderfy
		};
	}

	// A marker of the group was dragged: keep its new position, also if spiderfied
	_onDragEnd({target: marker}) {
		if (marker._clusterLatLng) {
			marker._clusterLatLng = marker.getLatLng();
		}
		this.refreshClusters();
	}

	// Shows the clusters and single layers near the view. The clusters are computed for
	// each zoom level and when the layers change, not when panning, which keeps the
	// cluster markers and spiderfied markers.
	_update() {
		const map = this._map,
		zoom = map.getZoom();
		if (!this._clusters || this._clustersZoom !== zoom) {
			this._unspiderfy();
			this._clusters = this._cluster();
			this._clustersZoom = zoom;
		}

		// the view and half of it around, in projected pixels
		const view = map.getPixelBounds().pad(0.5),
		shown = new Set();
		for (const cluster of this._clusters) {
			const {markers, point} = cluster;
			if (markers.length > 1) {
				if (view.contains(point)) {
					cluster.marker ??= this._createClusterMarker(cluster);
					shown.add(cluster.marker);
				}
			} else if (!markers[0].getLatLng || view.contains(point)) {
				shown.add(markers[0]);
			}
		}

		const spiderfied = this._spider?.clusterMarker;
		for (const layer of this._shown) {
			if (!shown.has(layer)) {
				map.removeLayer(layer);
			}
		}
		for (const layer of shown) {
			if (layer !== spiderfied) {
				map.addLayer(layer);
			}
		}
		this._shown = shown;
	}

	// Greedy clustering on a grid with cells of the cluster radius: each marker joins the
	// nearest cluster whose first marker is within the radius, or starts a new one
	_cluster() {
		const map = this._map,
		zoom = map.getZoom(),
		radius = this.options.maxClusterRadius,
		noClustering = zoom >= (this.options.disableClusteringAtZoom ?? Infinity),
		grid = new Map(),
		clusters = [];

		for (const layer of Object.values(this._layers)) {
			if (!layer.getLatLng) {
				clusters.push({markers: [layer]});
				continue;
			}
			const point = map.project(layer.getLatLng(), zoom),
			x = Math.floor(point.x / radius),
			y = Math.floor(point.y / radius);
			let nearest, minDistance = radius;
			for (let i = x - 1; i <= x + 1; i++) {
				for (let j = y - 1; j <= y + 1; j++) {
					for (const cluster of noClustering ? [] : grid.get(`${i}:${j}`) ?? []) {
						const distance = cluster.point.distanceTo(point);
						if (distance <= minDistance) {
							nearest = cluster;
							minDistance = distance;
						}
					}
				}
			}
			if (nearest) {
				nearest.markers.push(layer);
			} else {
				const cluster = {point, markers: [layer]},
				key = `${x}:${y}`;
				if (!grid.has(key)) {
					grid.set(key, []);
				}
				grid.get(key).push(cluster);
				clusters.push(cluster);
			}
		}

		for (const cluster of clusters) {
			if (cluster.markers.length > 1) {
				const latlngs = cluster.markers.map(marker => marker.getLatLng());
				cluster.latlng = new LatLng(
					latlngs.reduce((sum, latlng) => sum + latlng.lat, 0) / latlngs.length,
					latlngs.reduce((sum, latlng) => sum + latlng.lng, 0) / latlngs.length);
				cluster.point = map.project(cluster.latlng, zoom);
			}
		}
		return clusters;
	}

	_createClusterMarker({latlng, markers}) {
		const cluster = {latlng, bounds: new LatLngBounds(markers.map(marker => marker.getLatLng())), markers, count: markers.length},
		icon = this.options.iconCreateFunction?.(cluster) ?? this._createIcon(cluster),
		marker = new Marker(latlng, {icon, title: I18n.translate('{count} markers', {count: cluster.count})});
		marker.on({
			click: e => this._onClusterClick(cluster, marker, e),
			// like a popup, for the keyboard
			keypress: e => e.originalEvent.code === 'Enter' && this._onClusterClick(cluster, marker, e)
		});
		return marker;
	}

	_createIcon({count}) {
		const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
		return new DivIcon({
			html: `<span>${count}</span>`,
			className: `maplair-cluster maplair-cluster-${size}`,
			iconSize: {small: 32, medium: 38, large: 44}[size]
		});
	}

	_onClusterClick(cluster, marker, e) {
		this.fire('clusterclick', {cluster, layer: marker, originalEvent: e.originalEvent});
		const map = this._map,
		maxZoom = map.getMaxZoom(),
		{bounds} = cluster,
		// zooming in splits the cluster if its markers are farther apart at the maximum zoom
		splittable = map.getZoom() < maxZoom && (this.options.disableClusteringAtZoom <= maxZoom ||
			map.project(bounds.getNorthEast(), maxZoom).distanceTo(map.project(bounds.getSouthWest(), maxZoom)) > this.options.maxClusterRadius);
		if (splittable) {
			if (this.options.zoomToBoundsOnClick) {
				map.fitBounds(bounds);
			}
		} else if (this.options.spiderfyOnMaxZoom) {
			this._spiderfy(cluster, marker);
		}
	}

	// Spreads the markers of the cluster in a circle around it, with legs to the center
	_spiderfy({markers}, clusterMarker) {
		this._unspiderfy();
		const map = this._map,
		center = map.latLngToLayerPoint(clusterMarker.getLatLng()),
		// about 30 pixels between the markers
		radius = Math.max(30, markers.length * 30 / (2 * Math.PI)),
		spider = this._spider = {markers, clusterMarker, legs: []};

		map.removeLayer(clusterMarker);
		markers.forEach((marker, i) => {
			const angle = 2 * Math.PI * i / markers.length,
			latlng = map.layerPointToLatLng(center.add(new Point(Math.cos(angle), Math.sin(angle)).multiplyBy(radius)));
			marker._clusterLatLng = marker.getLatLng();
			marker.setLatLng(latlng);
			const leg = new Polyline([clusterMarker.getLatLng(), latlng], {className: 'maplair-cluster-leg', interactive: false, weight: 1.5});
			spider.legs.push(leg);
			map.addLayer(leg);
			map.addLayer(marker);
		});
	}

	// Moves the spiderfied markers back and shows their cluster again
	_unspiderfy() {
		const spider = this._spider;
		if (!spider) { return; }
		this._spider = null;
		const map = this._map;
		for (const leg of spider.legs) {
			map?.removeLayer(leg);
		}
		for (const marker of spider.markers) {
			map?.removeLayer(marker);
			marker.setLatLng(marker._clusterLatLng);
			delete marker._clusterLatLng;
		}
		if (map && this._shown.has(spider.clusterMarker)) {
			map.addLayer(spider.clusterMarker);
		}
	}
}
