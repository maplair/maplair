import type { Polyline } from '../vector/Polyline.js';
import type { Point } from '../../geometry/Point.js';
import type { I18n } from '../../core/I18n.js';
import type { LayerOptions } from '../Layer.js';
import type { MaplairEvent } from '../../core/Events.js';
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
    static defaultOptions: Partial<MarkerClusterGroupOptions>;
    /**
     * Creates a cluster group with the given layers.
     * @param {Layer[]} [layers]
     * @param {MarkerClusterGroupOptions} [options]
     */
    constructor(layers?: Layer[], options?: MarkerClusterGroupOptions);
    /**
     * Adds the given layer to the group.
     * @param {Layer} layer
     * @returns {this}
     */
    addLayer(layer: Layer): this;
    /**
     * Adds the given layers to the group, clustering once instead of for each layer.
     * @param {Layer[]} layers
     * @returns {this}
     */
    addLayers(layers: Layer[]): this;
    /**
     * Removes the given layer from the group.
     * @param {Layer|number} layer The layer or its id.
     * @returns {this}
     */
    removeLayer(layer: Layer | number): this;
    /**
     * Removes all layers from the group.
     * @returns {this}
     */
    clearLayers(): this;
    /**
     * Computes the clusters again, e.g. after markers of the group were moved with
     * `setLatLng()`. Happens by itself when the zoom changes or layers are added or
     * removed.
     * @returns {this}
     */
    refreshClusters(): this;
    onAdd(): void;
    onRemove(map: any): void;
    getEvents(): {
        moveend: () => void;
        zoomstart: () => void;
        click: () => void;
    };
    /** The options of the MarkerClusterGroup, see [the options](#markerclustergroupoptions). */
    options: MarkerClusterGroupOptions;
}
/**
 * A cluster of markers, see `MarkerClusterGroup`.
 */
export interface MarkerCluster {
    /**
     * The position of the cluster marker: the mean of the
     * positions of its markers.
     */
    latlng: LatLng;
    /**
     * The bounds of its markers.
     */
    bounds: LatLngBounds;
    /**
     * Its markers.
     */
    markers: Layer[];
    /**
     * The number of its markers.
     */
    count: number;
}
/**
 * The event object of `clusterclick`.
 */
export interface ClusterClickEvent extends MaplairEvent {
    /**
     * The clicked cluster.
     */
    cluster: MarkerCluster;
    /**
     * The marker of the cluster.
     */
    layer: Marker;
    /**
     * The DOM event of the click.
     */
    originalEvent: Event;
}
/**
 * Options of `MarkerClusterGroup`.
 */
export interface MarkerClusterGroupOptions extends LayerOptions {
    /**
     * The maximum distance in pixels between the
     * first marker of a cluster and the other ones.
     * @default 80
     */
    maxClusterRadius?: number;
    /**
     * From this zoom level on, the markers are
     * shown without clustering.
     */
    disableClusteringAtZoom?: number;
    /**
     * Whether a click on a cluster zooms to
     * the bounds of its markers.
     * @default true
     */
    zoomToBoundsOnClick?: boolean;
    /**
     * Whether a click on a cluster which
     * zooming in doesn't split (e.g. markers at the same position, or at the maximum
     * zoom) spreads its markers in a circle around it ("spiderfies" them). Until the next
     * click on the map, change of the zoom or of the layers, their `getLatLng()` returns
     * the spread positions. Clusters can also be activated with the <kbd>Enter</kbd> key.
     * @default true
     */
    spiderfyOnMaxZoom?: boolean;
    /**
     * Returns the icon
     * of a cluster, by default a circle with the count, sized and colored by the
     * `maplair-cluster-small`, `-medium` and `-large` CSS classes (for up to 9, 99 and
     * more markers).
     */
    iconCreateFunction?: (cluster: MarkerCluster) => DivIcon;
}
import { FeatureGroup } from '../FeatureGroup.js';
import type { Layer } from '../Layer.js';
import { Marker } from './Marker.js';
import { DivIcon } from './DivIcon.js';
import { LatLng } from '../../geo/LatLng.js';
import { LatLngBounds } from '../../geo/LatLngBounds.js';
