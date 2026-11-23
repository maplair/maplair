import { Path } from "../layer/vector/Path.js";
import { CircleMarker } from "../layer/vector/CircleMarker.js";
import { LayerGroup } from "../layer/LayerGroup.js";
import { FeatureGroup } from "../layer/FeatureGroup.js";
import { Polyline } from "../layer/vector/Polyline.js";
import { Polygon } from "../layer/vector/Polygon.js";
import { Marker } from "../layer/marker/Marker.js";
import { GeoJSON } from "../layer/GeoJSON.js";
import { HeatLayer } from "../layer/HeatLayer.js";
import { ImageOverlay } from "../layer/ImageOverlay.js";
import { VideoOverlay } from "../layer/VideoOverlay.js";
import { SVGOverlay } from "../layer/SVGOverlay.js";
import { MarkerClusterGroup } from "../layer/marker/MarkerClusterGroup.js";
import { TileLayer } from "../layer/tile/TileLayer.js";
import { WMSTileLayer } from "../layer/tile/WMSTileLayer.js";
import { Circle } from "../layer/vector/Circle.js";
import { Rectangle } from "../layer/vector/Rectangle.js";
import { MaplairElement, camelCase, defaultsOf, define, kebabCase, parseOption } from "./MaplairElement.js";
import { MapElement } from "./MapElement.js";
// src/elements/layers.js
const layerEvents = [
	"click",
	"dblclick",
	"contextmenu",
	"pointerover",
	"pointerout",
	"popupopen",
	"popupclose",
	"tooltipopen",
	"tooltipclose",
	"add",
	"remove"
];
/**
* The base of the elements of layers, e.g. `<maplair-marker>`. Inside a `<maplair-map>`, the
* layer is added to the map, inside a group element (e.g. `<maplair-layer-group>`) to the
* group. Common attributes besides the options of the layer:
*
* * `name`: the label of the layer in `<maplair-layers-control>`,
* * `base`: a base layer (only one is shown at a time) instead of an overlay,
* * `hidden`: not shown, but listed in the layers control.
*/
var LayerElement = class extends MaplairElement {
	static events = layerEvents;
	/**
	* Setters applying changed attributes, by attribute name.
	* @type {Record<string, (layer: any, value: any, el: LayerElement) => void>}
	*/
	static setters = {
		opacity: (layer, value) => layer.setOpacity?.(value),
		"z-index": (layer, value) => layer.setZIndex?.(value)
	};
	static get observedAttributes() {
		return [
			...super.observedAttributes,
			"name",
			"base",
			"hidden"
		];
	}
	/**
	* The layer.
	* @type {any}
	*/
	get layer() {
		return this._instance;
	}
	/**
	* Options set in JavaScript, e.g. functions like `pointToLayer`, merged into the options
	* from the attributes; setting them recreates the layer.
	* @type {Object}
	*/
	get options() {
		return this._options ?? {};
	}
	set options(options) {
		this._options = options;
		this.recreate();
	}
	getOptions() {
		return {
			...super.getOptions(),
			...this._options
		};
	}
	attach(parent) {
		this._mapElement = this.closest("maplair-map");
		if (parent instanceof MapElement) this._addToMap();
		else parent?.attachChild(this);
		if (this.hasAttribute("name")) this._mapElement?._register("layers", this);
	}
	detach(parent) {
		this._mapElement?._unregister("layers", this);
		if (parent instanceof MapElement) this._instance.remove();
		else parent?.detachChild(this);
	}
	_addToMap() {
		const mapEl = this._mapElement, map = mapEl?.map;
		if (!map || this.hidden) return;
		if (this.hasAttribute("base")) {
			for (const el of mapEl._registry.layers) if (el !== this && el.hasAttribute("base") && map.hasLayer(el.layer)) return;
		}
		map.addLayer(this._instance);
	}
	update(name, value) {
		const layer = this._instance;
		if (name === "hidden" && this._parent instanceof MapElement) {
			if (value === null) this._addToMap();
			else layer.remove();
			return true;
		}
		if (name === "name" || name === "base" || name === "hidden") return false;
		const setter = this.constructor.setters[name];
		if (setter) {
			setter(layer, value === null ? void 0 : this.getArg(name), this);
			return true;
		}
		return false;
	}
};
const groupMethods = {
	attachChild(child) {
		if (child.layer && !child.hidden) this._instance.addLayer(child.layer);
	},
	detachChild(child) {
		if (child.layer) this._instance.removeLayer(child.layer);
	}
};
/**
* `<maplair-layer-group>`: a [`LayerGroup`](#layergroup) of its child layer elements, e.g.
* named for the layers control.
*/
var LayerGroupElement = class extends LayerElement {
	static Class = LayerGroup;
	createInstance() {
		return new LayerGroup([], this.getOptions());
	}
};
Object.assign(LayerGroupElement.prototype, groupMethods);
/**
* `<maplair-feature-group>`: a [`FeatureGroup`](#featuregroup) of its child layer elements;
* path style attributes (e.g. `color`) apply to all members.
*/
var FeatureGroupElement = class extends LayerElement {
	static Class = FeatureGroup;
	getOptions() {
		return getPathOptions.call(this);
	}
	createInstance() {
		return new FeatureGroup([], this.getOptions());
	}
};
Object.assign(FeatureGroupElement.prototype, groupMethods);
/**
* `<maplair-marker-cluster>`: a [`MarkerClusterGroup`](#markerclustergroup) clustering its
* child marker elements.
*/
var MarkerClusterElement = class extends LayerElement {
	static Class = MarkerClusterGroup;
	createInstance() {
		return new MarkerClusterGroup([], this.getOptions());
	}
};
Object.assign(MarkerClusterElement.prototype, groupMethods);
const providers = {
	osm: {
		url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
		maxZoom: 19
	},
	opentopomap: {
		url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
		maxZoom: 17,
		attribution: "Map data: &copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors, <a href=\"http://viewfinderpanoramas.org\">SRTM</a> | Map style: &copy; <a href=\"https://opentopomap.org\">OpenTopoMap</a> (<a href=\"https://creativecommons.org/licenses/by-sa/3.0/\">CC-BY-SA</a>)"
	}
};
/**
* `<maplair-tile-layer>`: a [`TileLayer`](#tilelayer) of `url`, or of `provider` (`osm` for
* OpenStreetMap, `opentopomap`).
*/
var TileLayerElement = class extends LayerElement {
	static Class = TileLayer;
	static args = ["url", "provider"];
	static events = [
		...layerEvents,
		"loading",
		"load",
		"tileerror"
	];
	static setters = {
		...LayerElement.setters,
		url: (layer, value) => layer.setUrl(value)
	};
	createInstance() {
		const { url, ...preset } = providers[this.getAttribute("provider")] ?? {};
		return new TileLayer(this.getAttribute("url") ?? url, {
			...preset,
			...this.getOptions()
		});
	}
};
/**
* `<maplair-wms-layer>`: a [`WMSTileLayer`](#wmstilelayer) of the service `url`; the WMS
* parameters are attributes too (`layers`, `styles`, `format`, `transparent`, `time`), and
* changing them requests new tiles.
*/
var WMSLayerElement = class extends TileLayerElement {
	static Class = WMSTileLayer;
	static args = ["url"];
	static get observedAttributes() {
		return [
			...super.observedAttributes,
			"layers",
			"styles",
			"format",
			"transparent",
			"version",
			"time"
		];
	}
	createInstance() {
		return new WMSTileLayer(this.getAttribute("url"), this.getOptions());
	}
	update(name, value) {
		const key = camelCase(name);
		if (!(name in this.constructor.setters) && !(key in defaultsOf(TileLayer))) {
			this._instance.setParams({ [key]: value === null ? void 0 : parseOption(key, value) });
			return true;
		}
		return super.update(name, value);
	}
};
/**
* `<maplair-marker>`: a [`Marker`](#marker) at `latlng`, with the icon of a child
* `<maplair-icon>`, `<maplair-div-icon>` or `<maplair-svg-icon>`.
*/
var MarkerElement = class extends LayerElement {
	static Class = Marker;
	static args = ["latlng"];
	static events = [
		...layerEvents,
		"dragstart",
		"drag",
		"dragend",
		"move"
	];
	static setters = {
		...LayerElement.setters,
		latlng: (layer, value) => layer.setLatLng(value),
		"z-index-offset": (layer, value) => layer.setZIndexOffset(value ?? 0),
		draggable: (layer, value) => value ? layer.dragging?.enable() : layer.dragging?.disable()
	};
	createInstance() {
		return new Marker(this.getArg("latlng"), this.getOptions());
	}
};
/**
* Returns the path options set by CSS custom properties on the element (or inherited from
* its ancestors), e.g. `--maplair-path-color: #c0392b` or `--maplair-path-fill-opacity: 0.5`.
* @param {Element} el
* @returns {Object}
*/
function cssPathStyle(el) {
	const style = getComputedStyle(el), options = {};
	for (const key of Object.keys(Path.defaultOptions)) {
		const value = style.getPropertyValue(`--maplair-path-${kebabCase(key)}`).trim();
		if (value) options[key] = parseOption(key, value, Path.defaultOptions[key]);
	}
	return options;
}
function getPathOptions() {
	return {
		...cssPathStyle(this),
		...LayerElement.prototype.getOptions.call(this)
	};
}
var PathElement = class extends LayerElement {
	getOptions() {
		return getPathOptions.call(this);
	}
	update(name, value) {
		const key = camelCase(name);
		if (key in Path.defaultOptions) {
			this._instance.setStyle({ [key]: value === null ? Path.defaultOptions[key] : this.getArg(name) });
			return true;
		}
		return super.update(name, value);
	}
};
/** `<maplair-circle-marker>`: a [`CircleMarker`](#circlemarker) at `latlng` with a `radius` in pixels. */
var CircleMarkerElement = class extends PathElement {
	static Class = CircleMarker;
	static args = ["latlng"];
	static setters = {
		...LayerElement.setters,
		latlng: (layer, value) => layer.setLatLng(value),
		radius: (layer, value) => layer.setRadius(value)
	};
	createInstance() {
		return new this.constructor.Class(this.getArg("latlng"), this.getOptions());
	}
};
/** `<maplair-circle>`: a [`Circle`](#circle) at `latlng` with a `radius` in meters. */
var CircleElement = class extends CircleMarkerElement {
	static Class = Circle;
};
/** `<maplair-polyline>`: a [`Polyline`](#polyline) through `latlngs` (`lat,lng` pairs separated by spaces). */
var PolylineElement = class extends PathElement {
	static Class = Polyline;
	static args = ["latlngs"];
	static setters = {
		...LayerElement.setters,
		latlngs: (layer, value) => layer.setLatLngs(value)
	};
	createInstance() {
		return new this.constructor.Class(this.getArg("latlngs") ?? [], this.getOptions());
	}
};
/** `<maplair-polygon>`: a [`Polygon`](#polygon) of `latlngs`, with holes separated by `|`. */
var PolygonElement = class extends PolylineElement {
	static Class = Polygon;
};
/** `<maplair-rectangle>`: a [`Rectangle`](#rectangle) of `bounds` (`south,west north,east`). */
var RectangleElement = class extends PathElement {
	static Class = Rectangle;
	static args = ["bounds"];
	static setters = {
		...LayerElement.setters,
		bounds: (layer, value) => layer.setBounds(value)
	};
	createInstance() {
		return new Rectangle(this.getArg("bounds"), this.getOptions());
	}
};
const templateRe = /\{\s*([^{}\s]+)\s*\}/g;
const spacesRe = /\s+/;
const htmlCharsRe = /[&<>"']/g;
function fillTemplate(template, properties, escape) {
	return template.replace(templateRe, (_, key) => {
		const value = key.split(".").reduce((obj, k) => obj?.[k], properties) ?? "";
		return escape ? escapeHTML(String(value)) : String(value);
	});
}
function escapeHTML(text) {
	return text.replace(htmlCharsRe, (c) => `&#${c.charCodeAt(0)};`);
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
var GeoJSONElement = class extends LayerElement {
	static Class = GeoJSON;
	static args = [
		"src",
		"tooltip",
		"popup"
	];
	static events = [
		...layerEvents,
		"loading",
		"load",
		"error"
	];
	getOptions() {
		return getPathOptions.call(this);
	}
	createInstance() {
		const options = this.getOptions(), src = this.getAttribute("src"), { onEachFeature } = options;
		const layer = new GeoJSON(null, {
			...options,
			url: src ?? void 0,
			onEachFeature: (feature, featureLayer) => {
				this._bindTemplates(feature, featureLayer);
				onEachFeature?.(feature, featureLayer);
			}
		});
		this._observeContent(() => this._syncData());
		this._syncData(layer);
		return layer;
	}
	destroy() {
		this._contentObserver?.disconnect();
		this._contentObserver = null;
	}
	update(name, value) {
		if (name === "src" && value) {
			this._instance.load(value);
			return true;
		}
		if (name === "tooltip" || name === "popup") {
			this._instance.eachLayer((l) => this._bindTemplates(l.feature, l));
			return true;
		}
		const key = camelCase(name);
		if (key in Path.defaultOptions) {
			this._instance.options[key] = this.getArg(name);
			this._instance.eachLayer((l) => this._instance.resetStyle(l));
			return true;
		}
		return super.update(name, value);
	}
	/**
	* Restyles the features, e.g. after changing the `style` of `options` or a classification.
	*/
	restyle() {
		this._instance?.eachLayer((l) => this._instance.resetStyle(l));
	}
	_syncData(layer = this._instance) {
		const script = this.querySelector(":scope > script[type=\"application/geo+json\"], :scope > script[type=\"application/json\"]");
		if (!layer || !script) return;
		const text = script.textContent.trim();
		if (!text || text === this._dataText) return;
		this._dataText = text;
		layer.clearLayers();
		layer.addData(JSON.parse(text));
	}
	_bindTemplates(feature, layer) {
		const properties = feature?.properties ?? {};
		for (const kind of ["tooltip", "popup"]) {
			const html = this.querySelector(`:scope > template[${kind}]`)?.innerHTML, text = this.getAttribute(kind), content = html !== void 0 ? fillTemplate(html, properties, true) : text !== null ? fillTemplate(text, properties, true) : null;
			const bind = kind === "tooltip" ? "bindTooltip" : "bindPopup", unbind = kind === "tooltip" ? "unbindTooltip" : "unbindPopup";
			if (content) layer[bind](content);
			else layer[unbind]?.();
		}
	}
};
/**
* `<maplair-heat-layer>`: a [`HeatLayer`](#heatlayer) of `latlngs`, each `lat,lng` or
* `lat,lng,intensity`, separated by spaces.
*/
var HeatLayerElement = class extends LayerElement {
	static Class = HeatLayer;
	static args = ["latlngs"];
	static setters = {
		...LayerElement.setters,
		latlngs: (layer, value, el) => layer.setLatLngs(el._latlngs())
	};
	createInstance() {
		return new HeatLayer(this._latlngs(), this.getOptions());
	}
	_latlngs() {
		return (this.getAttribute("latlngs") ?? "").trim().split(spacesRe).filter(Boolean).map((s) => s.split(",").map(Number));
	}
};
/** `<maplair-image-overlay>`: an [`ImageOverlay`](#imageoverlay) of the image at `url` over `bounds`. */
var ImageOverlayElement = class extends LayerElement {
	static Class = ImageOverlay;
	static args = ["url", "bounds"];
	static events = [
		...layerEvents,
		"load",
		"error"
	];
	static setters = {
		...LayerElement.setters,
		url: (layer, value) => layer.setUrl(value),
		bounds: (layer, value) => layer.setBounds(value)
	};
	createInstance() {
		return new this.constructor.Class(this.getAttribute("url"), this.getArg("bounds"), this.getOptions());
	}
};
/** `<maplair-video-overlay>`: a [`VideoOverlay`](#videooverlay) of the video at `url` (or several URLs separated by spaces) over `bounds`. */
var VideoOverlayElement = class extends ImageOverlayElement {
	/** @type {any} */
	static Class = VideoOverlay;
	createInstance() {
		const urls = this.getAttribute("url")?.trim().split(spacesRe) ?? [];
		return new VideoOverlay(urls.length > 1 ? urls : urls[0], this.getArg("bounds"), this.getOptions());
	}
};
/** `<maplair-svg-overlay>`: an [`SVGOverlay`](#svgoverlay) of its child `<svg>` over `bounds`. */
var SVGOverlayElement = class extends LayerElement {
	static Class = SVGOverlay;
	static args = ["bounds"];
	static setters = {
		...LayerElement.setters,
		bounds: (layer, value) => layer.setBounds(value)
	};
	createInstance() {
		const svg = this.querySelector(":scope > svg");
		if (!svg) return null;
		return new SVGOverlay(svg, this.getArg("bounds"), this.getOptions());
	}
	destroy() {
		const svg = this._instance.getElement();
		if (svg && svg.parentNode !== this) this.append(svg);
	}
};
define("maplair-tile-layer", TileLayerElement);
define("maplair-wms-layer", WMSLayerElement);
define("maplair-marker", MarkerElement);
define("maplair-circle-marker", CircleMarkerElement);
define("maplair-circle", CircleElement);
define("maplair-polyline", PolylineElement);
define("maplair-polygon", PolygonElement);
define("maplair-rectangle", RectangleElement);
define("maplair-layer-group", LayerGroupElement);
define("maplair-feature-group", FeatureGroupElement);
define("maplair-marker-cluster", MarkerClusterElement);
define("maplair-geojson", GeoJSONElement);
define("maplair-heat-layer", HeatLayerElement);
define("maplair-image-overlay", ImageOverlayElement);
define("maplair-video-overlay", VideoOverlayElement);
define("maplair-svg-overlay", SVGOverlayElement);
export { CircleElement, CircleMarkerElement, FeatureGroupElement, GeoJSONElement, HeatLayerElement, ImageOverlayElement, LayerElement, LayerGroupElement, MarkerClusterElement, MarkerElement, PolygonElement, PolylineElement, RectangleElement, SVGOverlayElement, TileLayerElement, VideoOverlayElement, WMSLayerElement, cssPathStyle };

//# sourceMappingURL=layers.js.map