import { disableClickPropagation } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
//#region src/control/AttributionControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
const mapleLeaf = "<span aria-hidden=\"true\" class=\"maplair-attribution-leaf\">&#x1F341;</span>";
/**
* Options of `AttributionControl`.
* @typedef {object} AttributionControlOptions
* @property {string} [position='bottomright'] The position of the control (one of the
* map corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string|false|null} [prefix=null] The HTML text shown before the
* attributions. Pass `false` to disable. By default (`null`), a link to Maplair.
* @extends ControlOptions
*/
/**
* Map options of `AttributionControl`.
* @typedef {object} AttributionControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [attributionControl=true] Whether a
* [attribution control](#control-attribution) is added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `AttributionControl`.
* @typedef {object} AttributionControlMapProperties
* @lends MaplairMap
* @property {AttributionControl} attributionControl The attribution control of the map,
* the default one (if the [`attributionControl` option](#map-attributioncontrol) was
* `true` when creating the map) or the one added last.
*/
/**
* The attribution control allows you to display attribution data in a small text box
* on a map. It is put on the map by default unless you set its
* [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches
* attribution texts from layers with the [`getAttribution` method](#layer-getattribution)
* automatically.
*/
var AttributionControl = class AttributionControl extends Control {
	static defaultOptions = {
		position: "bottomright",
		prefix: null
	};
	/**
	* Creates an attribution control.
	* @param {AttributionControlOptions} [options]
	*/
	constructor(options) {
		super(options);
		if (this.options.prefix === null) {
			const title = I18n.translate("A JavaScript library for interactive maps");
			this.options.prefix = `<a target="_blank" href="https://maplair.org" title="${title}">${mapleLeaf}Maplair</a>`;
		}
		this._attributions = {};
		this._orders = {};
		this._layerAttributions = /* @__PURE__ */ new Map();
		this.callInitHooks(AttributionControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		map.attributionControl = this;
		this._container = create("div", "maplair-control-attribution");
		disableClickPropagation(this._container);
		if (map._loaded) map.eachLayer((layer) => this._addLayer({ layer }));
		this._update();
		map.on({
			layeradd: this._addLayer,
			layerremove: this._removeLayer
		}, this);
		return this._container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off({
			layeradd: this._addLayer,
			layerremove: this._removeLayer
		}, this);
		for (const layer of this._layerAttributions.keys()) this._removeLayer({ layer });
	}
	_addLayer({ layer }) {
		const text = layer.getAttribution?.();
		if (!text || this._layerAttributions.has(layer)) return;
		this._layerAttributions.set(layer, text);
		this.addAttribution(text, layer.options?.attributionOrder);
	}
	_removeLayer({ layer }) {
		this.removeAttribution(this._layerAttributions.get(layer));
		this._layerAttributions.delete(layer);
	}
	/**
	* The HTML text shown before the attributions. Pass `false` to disable.
	* @param {string|false} prefix
	* @returns {this}
	*/
	setPrefix(prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	}
	/**
	* Adds an attribution text (e.g. `'© OpenStreetMap contributors'`). Attributions
	* are sorted by `order` (see the layer option `attributionOrder`), then by the order
	* of adding.
	* @param {string} text
	* @param {number} [order=0]
	* @returns {this}
	*/
	addAttribution(text, order = 0) {
		if (!text) return this;
		this._orders[text] = order;
		if (!this._attributions[text]) this._attributions[text] = 0;
		this._attributions[text]++;
		this._update();
		return this;
	}
	/**
	* Removes an attribution text.
	* @param {string} text
	* @returns {this}
	*/
	removeAttribution(text) {
		if (!text) return this;
		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}
		return this;
	}
	_update() {
		if (!this._map) return;
		const attribs = Object.keys(this._attributions).filter((i) => this._attributions[i]).sort((a, b) => this._orders[a] - this._orders[b]);
		const prefixAndAttribs = [];
		if (this.options.prefix) prefixAndAttribs.push(this.options.prefix);
		if (attribs.length) prefixAndAttribs.push(attribs.join(", "));
		this._container.innerHTML = prefixAndAttribs.join(" <span aria-hidden=\"true\">|</span> ");
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ attributionControl: true });
		MaplairMap.addInitHook(function() {
			if (this.options.attributionControl) new AttributionControl().addTo(this);
		});
	}
};
//#endregion
export { AttributionControl };

//# sourceMappingURL=AttributionControl.js.map