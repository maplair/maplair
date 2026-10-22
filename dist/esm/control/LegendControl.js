import { disableClickPropagation, disableScrollPropagation } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
import { CircleMarker } from "../layer/vector/CircleMarker.js";
//#region src/control/LegendControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {FeatureGroup} from '../layer/FeatureGroup.js' */
/** @import {Classification} from '../layer/Classification.js' */
/**
* Options of `LegendControl`.
* @typedef {object} LegendControlOptions
* @property {string} [position='bottomright'] The position of the control (one of the
* map corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {boolean} [collapsed=false] If `true`, the legend starts collapsed to its
* title, which toggles it.
* @property {boolean} [featureCount=false] If `true`, the number of features is shown
* per class and per classification.
* @property {boolean} [bar=false] If `true`, the feature count of each classification
* is shown as a bar of the class symbols, each as wide as its share.
* @extends ControlOptions
*/
/**
* A control showing the legend of the map: the classes of the layers added with
* [`addClassification()`](#legendcontrol-addclassification), each with a patch in the
* shape and symbol of its features and optionally the feature count, and the
* legends of all layers on the map implementing [`getLegend()`](#layer-getlegend),
* like the attribution control collects [`getAttribution()`](#layer-getattribution).
* The legend is updated when features are added to or removed from the classified
* layers (e.g. when reloading the data) and when a layer fires `legendchange`. It
* is collapsible and hidden while empty. Placed at the bottom right, it sits right
* above the attribution.
*
* Inspired by the legend of [QGIS](https://qgis.org/).
*
* @example
* ```js
* const legend = new LegendControl({featureCount: true, bar: true}).addTo(map);
* legend.addClassification(stations, temperature);
* ```
*/
const svgNS = "http://www.w3.org/2000/svg";
var LegendControl = class LegendControl extends Control {
	static defaultOptions = {
		position: "bottomright",
		collapsed: false,
		featureCount: false,
		bar: false
	};
	/**
	* Creates a legend control.
	* @param {...LegendControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this._classifications = [];
		this._legendLayers = /* @__PURE__ */ new Set();
		this.callInitHooks(LegendControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-control-legend"), details = this._details = create("details", "", container), summary = create("summary", "maplair-control-legend-title", details);
		summary.textContent = I18n.translate("Legend");
		details.open = !this.options.collapsed;
		this._list = create("div", "maplair-control-legend-list", details);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		this._container = container;
		map.on("layeradd layerremove", this._scheduleUpdate, this);
		this._update();
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("layeradd layerremove", this._scheduleUpdate, this);
		cancelAnimationFrame(this._frame);
		this._frame = null;
		for (const layer of this._legendLayers) layer.off("legendchange", this._scheduleUpdate, this);
		this._legendLayers.clear();
	}
	/**
	* Shows the classes of `classification` in the legend while `layer` is on the map,
	* with the feature count of the layers of `layer` (e.g. a `GeoJSON` layer styled
	* with [`classification.style`](#classification-style)), kept up to date when
	* layers are added and removed.
	* @param {FeatureGroup} layer
	* @param {Classification} classification
	* @returns {this}
	*/
	addClassification(layer, classification) {
		this._classifications.push({
			layer,
			classification
		});
		layer.on("layeradd layerremove", this._scheduleUpdate, this);
		this._scheduleUpdate();
		return this;
	}
	/**
	* Removes the classification of `layer` from the legend.
	* @param {FeatureGroup} layer
	* @returns {this}
	*/
	removeClassification(layer) {
		this._classifications = this._classifications.filter((entry) => entry.layer !== layer);
		layer.off("layeradd layerremove", this._scheduleUpdate, this);
		this._scheduleUpdate();
		return this;
	}
	_scheduleUpdate() {
		if (!this._map || this._frame) return;
		this._frame = requestAnimationFrame(() => {
			this._frame = null;
			this._update();
		});
	}
	_update() {
		const map = this._map;
		if (!map) return;
		const sections = this._classifications.filter(({ layer }) => map.hasLayer(layer)).map(({ layer, classification }) => this._renderClassification(layer, classification));
		const legendLayers = new Set(Object.values(map._layers).filter((layer) => layer.getLegend));
		for (const layer of this._legendLayers) if (!legendLayers.has(layer)) layer.off("legendchange", this._scheduleUpdate, this);
		for (const layer of legendLayers) {
			if (!this._legendLayers.has(layer)) layer.on("legendchange", this._scheduleUpdate, this);
			const legend = layer.getLegend();
			if (legend) {
				const section = create("div", "maplair-control-legend-section");
				if (typeof legend === "string") section.innerHTML = legend;
				else section.append(legend);
				sections.push(section);
			}
		}
		this._legendLayers = legendLayers;
		this._list.replaceChildren(...sections);
		this._container.hidden = !sections.length;
	}
	_renderClassification(layer, classification) {
		const layers = layer.getLayers(), items = classification.featureCount(layers), { featureCount, bar } = this.options, section = create("div", "maplair-control-legend-section"), { name } = classification.options, total = items.reduce((sum, item) => sum + (item.counted ? item.count : 0), 0);
		if (name) create("div", "maplair-control-legend-name", section).textContent = name;
		if (featureCount) create("div", "maplair-control-legend-total", section).textContent = I18n.translate("{n} features", { n: total });
		const samples = /* @__PURE__ */ new Map();
		for (const feature of layers) {
			const cls = classification.classify(feature), item = items.find((i) => i.classes.includes(cls));
			if (item && !samples.has(item)) samples.set(item, feature);
			if (samples.size === items.length) break;
		}
		const list = create("ul", "maplair-control-legend-items", section);
		for (const item of items) {
			const li = create("li", "", list);
			li.append(createPatch(samples.get(item) ?? layers[0], item.symbol, Boolean(samples.get(item))));
			create("span", "maplair-control-legend-label", li).textContent = item.legend;
			if (featureCount && item.counted) create("span", "maplair-control-legend-count", li).textContent = formatCount(item);
		}
		if (bar && total) {
			const barEl = create("div", "maplair-control-legend-bar", section);
			barEl.setAttribute("role", "img");
			barEl.setAttribute("aria-label", items.filter((item) => item.counted && item.count).map((item) => `${item.legend}: ${formatCount(item)}`).join(", "));
			for (const item of items) {
				if (!item.counted || !item.count) continue;
				const part = create("div", "", barEl);
				part.style.flexGrow = item.count;
				part.style.backgroundColor = item.symbol.fillColor ?? item.symbol.color ?? "";
				part.title = `${item.legend}: ${formatCount(item)}`;
			}
		}
		return section;
	}
};
function formatCount({ count, share }) {
	return `${count} (${new Intl.NumberFormat(I18n.getLocale() ?? void 0, {
		style: "percent",
		maximumFractionDigits: 1
	}).format(share)})`;
}
function createPatch(layer, symbol, styled) {
	while (layer?.getLayers) layer = layer.getLayers()[0];
	if (!layer?.setStyle) layer = void 0;
	const base = layer?.options ?? new CircleMarker([0, 0]).options, options = Object.assign(Object.create(base), layer && styled ? {} : symbol), svg = document.createElementNS(svgNS, "svg");
	svg.setAttribute("class", "maplair-control-legend-patch");
	svg.setAttribute("width", 16);
	svg.setAttribute("height", 16);
	svg.setAttribute("viewBox", "0 0 16 16");
	svg.setAttribute("aria-hidden", "true");
	let shape;
	if (layer?.getLatLngs && options.fill) shape = svgElement("rect", {
		x: 2,
		y: 2,
		width: 12,
		height: 12
	});
	else if (layer?.getLatLngs) shape = svgElement("line", {
		x1: 1,
		y1: 8,
		x2: 15,
		y2: 8
	});
	else shape = svgElement("circle", {
		cx: 8,
		cy: 8,
		r: 6
	});
	shape.setAttribute("fill", options.fill ? options.fillColor ?? options.color : "none");
	shape.setAttribute("fill-opacity", options.fillOpacity);
	shape.setAttribute("stroke", options.stroke ? options.color : "none");
	shape.setAttribute("stroke-opacity", options.opacity);
	shape.setAttribute("stroke-width", Math.min(options.weight, 4));
	if (options.dashArray) shape.setAttribute("stroke-dasharray", options.dashArray);
	svg.append(shape);
	return svg;
}
function svgElement(name, attributes) {
	const el = document.createElementNS(svgNS, name);
	for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
	return el;
}
//#endregion
export { LegendControl };

//# sourceMappingURL=LegendControl.js.map