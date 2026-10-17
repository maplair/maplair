import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {I18n} from '../core/I18n.js';
import {CircleMarker} from '../layer/vector/CircleMarker.js';

/*
 * @class LegendControl
 * @inherits Control
 *
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

const svgNS = 'http://www.w3.org/2000/svg';

// @namespace LegendControl
// @constructor LegendControl(options?: LegendControl options)
// Creates a legend control.
export class LegendControl extends Control {

	static {
		// @section
		// @aka LegendControl options
		this.setDefaultOptions({
			// @option position: String = 'bottomright'
			// The position of the control (one of the map corners). Possible values are `'topleft'`,
			// `'topright'`, `'bottomleft'` or `'bottomright'`
			position: 'bottomright',

			// @option collapsed: Boolean = false
			// If `true`, the legend starts collapsed to its title, which toggles it.
			collapsed: false,

			// @option featureCount: Boolean = false
			// If `true`, the number of features is shown per class and per classification.
			featureCount: false,

			// @option bar: Boolean = false
			// If `true`, the feature count of each classification is shown as a bar of the
			// class symbols, each as wide as its share.
			bar: false
		});
	}

	constructor(...args) {
		super(...args);
		this._classifications = [];
		this._legendLayers = new Set();
		this.callInitHooks(LegendControl);
	}

	onAdd(map) {
		const container = DomUtil.create('div', 'maplair-control-legend'),
		details = this._details = DomUtil.create('details', '', container),
		summary = DomUtil.create('summary', 'maplair-control-legend-title', details);
		summary.textContent = I18n.translate('Legend');
		details.open = !this.options.collapsed;
		this._list = DomUtil.create('div', 'maplair-control-legend-list', details);

		DomEvent.disableClickPropagation(container);
		DomEvent.disableScrollPropagation(container);
		this._container = container;

		map.on('layeradd layerremove', this._scheduleUpdate, this);
		this._update();
		return container;
	}

	onRemove(map) {
		map.off('layeradd layerremove', this._scheduleUpdate, this);
		cancelAnimationFrame(this._frame);
		this._frame = null;
		for (const layer of this._legendLayers) {
			layer.off('legendchange', this._scheduleUpdate, this);
		}
		this._legendLayers.clear();
	}

	// @method addClassification(layer: FeatureGroup, classification: Classification): this
	// Shows the classes of `classification` in the legend while `layer` is on the map,
	// with the feature count of the layers of `layer` (e.g. a `GeoJSON` layer styled
	// with [`classification.style`](#classification-style)), kept up to date when
	// layers are added and removed.
	addClassification(layer, classification) {
		this._classifications.push({layer, classification});
		layer.on('layeradd layerremove', this._scheduleUpdate, this);
		this._scheduleUpdate();
		return this;
	}

	// @method removeClassification(layer: FeatureGroup): this
	// Removes the classification of `layer` from the legend.
	removeClassification(layer) {
		this._classifications = this._classifications.filter(entry => entry.layer !== layer);
		layer.off('layeradd layerremove', this._scheduleUpdate, this);
		this._scheduleUpdate();
		return this;
	}

	// updates once per frame, e.g. once after adding all features of a GeoJSON
	_scheduleUpdate() {
		if (!this._map || this._frame) { return; }
		this._frame = requestAnimationFrame(() => {
			this._frame = null;
			this._update();
		});
	}

	_update() {
		const map = this._map;
		if (!map) { return; }

		const sections = this._classifications
			.filter(({layer}) => map.hasLayer(layer))
			.map(({layer, classification}) => this._renderClassification(layer, classification));

		const legendLayers = new Set(Object.values(map._layers).filter(layer => layer.getLegend));
		for (const layer of this._legendLayers) {
			if (!legendLayers.has(layer)) { layer.off('legendchange', this._scheduleUpdate, this); }
		}
		for (const layer of legendLayers) {
			if (!this._legendLayers.has(layer)) { layer.on('legendchange', this._scheduleUpdate, this); }
			const legend = layer.getLegend();
			if (legend) {
				const section = DomUtil.create('div', 'maplair-control-legend-section');
				if (typeof legend === 'string') {
					section.innerHTML = legend;
				} else {
					section.append(legend);
				}
				sections.push(section);
			}
		}
		this._legendLayers = legendLayers;

		this._list.replaceChildren(...sections);
		this._container.hidden = !sections.length;
	}

	_renderClassification(layer, classification) {
		const layers = layer.getLayers(),
		items = classification.featureCount(layers),
		{featureCount, bar} = this.options,
		section = DomUtil.create('div', 'maplair-control-legend-section'),
		{name} = classification.options,
		total = items.reduce((sum, item) => sum + (item.counted ? item.count : 0), 0);

		if (name) {
			DomUtil.create('div', 'maplair-control-legend-name', section).textContent = name;
		}
		if (featureCount) {
			DomUtil.create('div', 'maplair-control-legend-total', section).textContent =
				I18n.translate('{n} features', {n: total});
		}

		// a feature of each item, to draw its patch in the shape and style of the map
		const samples = new Map();
		for (const feature of layers) {
			const cls = classification.classify(feature),
			item = items.find(i => i.classes.includes(cls));
			if (item && !samples.has(item)) { samples.set(item, feature); }
			if (samples.size === items.length) { break; }
		}

		const list = DomUtil.create('ul', 'maplair-control-legend-items', section);
		for (const item of items) {
			const li = DomUtil.create('li', '', list);
			li.append(createPatch(samples.get(item) ?? layers[0], item.symbol, Boolean(samples.get(item))));
			DomUtil.create('span', 'maplair-control-legend-label', li).textContent = item.legend;
			if (featureCount && item.counted) {
				DomUtil.create('span', 'maplair-control-legend-count', li).textContent = formatCount(item);
			}
		}

		if (bar && total) {
			const barEl = DomUtil.create('div', 'maplair-control-legend-bar', section);
			barEl.setAttribute('role', 'img');
			barEl.setAttribute('aria-label', items.filter(item => item.counted && item.count)
				.map(item => `${item.legend}: ${formatCount(item)}`).join(', '));
			for (const item of items) {
				if (!item.counted || !item.count) { continue; }
				const part = DomUtil.create('div', '', barEl);
				part.style.flexGrow = item.count;
				part.style.backgroundColor = item.symbol.fillColor ?? item.symbol.color ?? '';
				part.title = `${item.legend}: ${formatCount(item)}`;
			}
		}

		return section;
	}
}

function formatCount({count, share}) {
	const percent = new Intl.NumberFormat(I18n.getLocale() ?? undefined, {style: 'percent', maximumFractionDigits: 1});
	return `${count} (${percent.format(share)})`;
}

// a small SVG in the shape of the layer (circle, square for polygons, line for
// polylines) with the style of the layer, or of the symbol over it if `styled` is false
// (e.g. for a class without features); a circle marker for other layers like markers.
// Duck-typed, so that the legend does not bundle the vector layers.
function createPatch(layer, symbol, styled) {
	while (layer?.getLayers) { layer = layer.getLayers()[0]; }
	if (!layer?.setStyle) { layer = undefined; }
	const base = layer?.options ?? CircleMarker.prototype.options,
	options = Object.assign(Object.create(base), layer && styled ? {} : symbol),
	svg = document.createElementNS(svgNS, 'svg');
	svg.setAttribute('class', 'maplair-control-legend-patch');
	svg.setAttribute('width', 16);
	svg.setAttribute('height', 16);
	svg.setAttribute('viewBox', '0 0 16 16');
	svg.setAttribute('aria-hidden', 'true');

	let shape;
	if (layer?.getLatLngs && options.fill) {
		shape = svgElement('rect', {x: 2, y: 2, width: 12, height: 12});
	} else if (layer?.getLatLngs) {
		shape = svgElement('line', {x1: 1, y1: 8, x2: 15, y2: 8});
	} else {
		shape = svgElement('circle', {cx: 8, cy: 8, r: 6});
	}

	shape.setAttribute('fill', options.fill ? options.fillColor ?? options.color : 'none');
	shape.setAttribute('fill-opacity', options.fillOpacity);
	shape.setAttribute('stroke', options.stroke ? options.color : 'none');
	shape.setAttribute('stroke-opacity', options.opacity);
	shape.setAttribute('stroke-width', Math.min(options.weight, 4));
	if (options.dashArray) { shape.setAttribute('stroke-dasharray', options.dashArray); }
	svg.append(shape);
	return svg;
}

function svgElement(name, attributes) {
	const el = document.createElementNS(svgNS, name);
	for (const [key, value] of Object.entries(attributes)) {
		el.setAttribute(key, value);
	}
	return el;
}
