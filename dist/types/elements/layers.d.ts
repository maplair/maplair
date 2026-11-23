import type { Path } from '../layer/vector/Path.js';
import type { camelCase, defaultsOf, define, kebabCase, parseOption } from './MaplairElement.js';
import type { MapElement } from './MapElement.js';
/**
 * Returns the path options set by CSS custom properties on the element (or inherited from
 * its ancestors), e.g. `--maplair-path-color: #c0392b` or `--maplair-path-fill-opacity: 0.5`.
 * @param {Element} el
 * @returns {Object}
 */
export function cssPathStyle(el: Element): Object;
/**
 * The base of the elements of layers, e.g. `<maplair-marker>`. Inside a `<maplair-map>`, the
 * layer is added to the map, inside a group element (e.g. `<maplair-layer-group>`) to the
 * group. Common attributes besides the options of the layer:
 *
 * * `name`: the label of the layer in `<maplair-layers-control>`,
 * * `base`: a base layer (only one is shown at a time) instead of an overlay,
 * * `hidden`: not shown, but listed in the layers control.
 */
export class LayerElement extends MaplairElement {
    /**
     * Setters applying changed attributes, by attribute name.
     * @type {Record<string, (layer: any, value: any, el: LayerElement) => void>}
     */
    static setters: Record<string, (layer: any, value: any, el: LayerElement) => void>;
    /**
     * The layer.
     * @type {any}
     */
    get layer(): any;
    set options(options: Object);
    /**
     * Options set in JavaScript, e.g. functions like `pointToLayer`, merged into the options
     * from the attributes; setting them recreates the layer.
     * @type {Object}
     */
    get options(): Object;
    attach(parent: any): void;
    detach(parent: any): void;
    update(name: any, value: any): boolean;
}
/**
 * `<maplair-layer-group>`: a [`LayerGroup`](#layergroup) of its child layer elements, e.g.
 * named for the layers control.
 */
export class LayerGroupElement extends LayerElement {
    static Class: typeof LayerGroup;
    createInstance(): LayerGroup;
}
/**
 * `<maplair-feature-group>`: a [`FeatureGroup`](#featuregroup) of its child layer elements;
 * path style attributes (e.g. `color`) apply to all members.
 */
export class FeatureGroupElement extends LayerElement {
    static Class: typeof FeatureGroup;
    createInstance(): FeatureGroup;
}
/**
 * `<maplair-marker-cluster>`: a [`MarkerClusterGroup`](#markerclustergroup) clustering its
 * child marker elements.
 */
export class MarkerClusterElement extends LayerElement {
    static Class: typeof MarkerClusterGroup;
    createInstance(): MarkerClusterGroup;
}
/**
 * `<maplair-tile-layer>`: a [`TileLayer`](#tilelayer) of `url`, or of `provider` (`osm` for
 * OpenStreetMap, `opentopomap`).
 */
export class TileLayerElement extends LayerElement {
    static Class: typeof TileLayer;
    static setters: {
        url: (layer: any, value: any) => any;
    };
    createInstance(): TileLayer;
}
/**
 * `<maplair-wms-layer>`: a [`WMSTileLayer`](#wmstilelayer) of the service `url`; the WMS
 * parameters are attributes too (`layers`, `styles`, `format`, `transparent`, `time`), and
 * changing them requests new tiles.
 */
export class WMSLayerElement extends TileLayerElement {
    static Class: typeof WMSTileLayer;
    createInstance(): WMSTileLayer;
}
/**
 * `<maplair-marker>`: a [`Marker`](#marker) at `latlng`, with the icon of a child
 * `<maplair-icon>`, `<maplair-div-icon>` or `<maplair-svg-icon>`.
 */
export class MarkerElement extends LayerElement {
    static Class: typeof Marker;
    static setters: {
        latlng: (layer: any, value: any) => any;
        'z-index-offset': (layer: any, value: any) => any;
        draggable: (layer: any, value: any) => any;
    };
    createInstance(): Marker;
}
/** `<maplair-circle-marker>`: a [`CircleMarker`](#circlemarker) at `latlng` with a `radius` in pixels. */
export class CircleMarkerElement extends PathElement {
    static Class: typeof CircleMarker;
    static setters: {
        latlng: (layer: any, value: any) => any;
        radius: (layer: any, value: any) => any;
    };
    createInstance(): any;
}
/** `<maplair-circle>`: a [`Circle`](#circle) at `latlng` with a `radius` in meters. */
export class CircleElement extends CircleMarkerElement {
    static Class: typeof Circle;
}
/** `<maplair-polyline>`: a [`Polyline`](#polyline) through `latlngs` (`lat,lng` pairs separated by spaces). */
export class PolylineElement extends PathElement {
    static Class: typeof Polyline;
    static setters: {
        latlngs: (layer: any, value: any) => any;
    };
    createInstance(): any;
}
/** `<maplair-polygon>`: a [`Polygon`](#polygon) of `latlngs`, with holes separated by `|`. */
export class PolygonElement extends PolylineElement {
    static Class: typeof Polygon;
}
/** `<maplair-rectangle>`: a [`Rectangle`](#rectangle) of `bounds` (`south,west north,east`). */
export class RectangleElement extends PathElement {
    static Class: typeof Rectangle;
    static setters: {
        bounds: (layer: any, value: any) => any;
    };
    createInstance(): Rectangle;
}
/**
 * `<maplair-geojson>`: a [`GeoJSON`](#geojson) layer of the data at `src` (loaded with
 * `fetch()`, see `fit-bounds`), or of a child `<script type="application/geo+json">`, kept in
 * sync with it. Path style attributes (e.g. `color`) style all features.
 *
 * * `tooltip` and `popup`: templates of the tooltips and popups of the features, with
 *   `{name}` replaced by the feature property `name` (escaped), e.g.
 *   `tooltip="{name} ({ele} m)"`; a child `<template tooltip>` or `<template popup>` is a
 *   template of HTML.
 * * a child `<maplair-classification>` styles the features by a property.
 *
 * Events: `maplair-load` (with `src`), `maplair-error` and the events of the features, e.g.
 * `maplair-click` with the clicked layer as `detail.sourceTarget`.
 */
export class GeoJSONElement extends LayerElement {
    static Class: typeof GeoJSON;
    createInstance(): GeoJSON;
    destroy(): void;
    /**
     * Restyles the features, e.g. after changing the `style` of `options` or a classification.
     */
    restyle(): void;
}
/**
 * `<maplair-heat-layer>`: a [`HeatLayer`](#heatlayer) of `latlngs`, each `lat,lng` or
 * `lat,lng,intensity`, separated by spaces.
 */
export class HeatLayerElement extends LayerElement {
    static Class: typeof HeatLayer;
    static setters: {
        latlngs: (layer: any, value: any, el: any) => any;
    };
    createInstance(): HeatLayer;
}
/** `<maplair-image-overlay>`: an [`ImageOverlay`](#imageoverlay) of the image at `url` over `bounds`. */
export class ImageOverlayElement extends LayerElement {
    static Class: typeof ImageOverlay;
    static setters: {
        url: (layer: any, value: any) => any;
        bounds: (layer: any, value: any) => any;
    };
    createInstance(): any;
}
/** `<maplair-video-overlay>`: a [`VideoOverlay`](#videooverlay) of the video at `url` (or several URLs separated by spaces) over `bounds`. */
export class VideoOverlayElement extends ImageOverlayElement {
    /** @type {any} */
    static Class: any;
    createInstance(): VideoOverlay;
}
/** `<maplair-svg-overlay>`: an [`SVGOverlay`](#svgoverlay) of its child `<svg>` over `bounds`. */
export class SVGOverlayElement extends LayerElement {
    static Class: typeof SVGOverlay;
    static setters: {
        bounds: (layer: any, value: any) => any;
    };
    createInstance(): SVGOverlay | null;
    destroy(): void;
}
import { MaplairElement } from './MaplairElement.js';
import { LayerGroup } from '../layer/LayerGroup.js';
import { FeatureGroup } from '../layer/FeatureGroup.js';
import { MarkerClusterGroup } from '../layer/marker/MarkerClusterGroup.js';
import { TileLayer } from '../layer/tile/TileLayer.js';
import { WMSTileLayer } from '../layer/tile/WMSTileLayer.js';
import { Marker } from '../layer/marker/Marker.js';
declare class PathElement extends LayerElement {
}
import { CircleMarker } from '../layer/vector/CircleMarker.js';
import { Circle } from '../layer/vector/Circle.js';
import { Polyline } from '../layer/vector/Polyline.js';
import { Polygon } from '../layer/vector/Polygon.js';
import { Rectangle } from '../layer/vector/Rectangle.js';
import { GeoJSON } from '../layer/GeoJSON.js';
import { HeatLayer } from '../layer/HeatLayer.js';
import { ImageOverlay } from '../layer/ImageOverlay.js';
import { VideoOverlay } from '../layer/VideoOverlay.js';
import { SVGOverlay } from '../layer/SVGOverlay.js';
export {};
