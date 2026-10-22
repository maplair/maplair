import { stamp } from "../core/Util.js";
import { disableClickPropagation, disableScrollPropagation, off, on, preventDefault } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
//#region src/control/LayersControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {LayersControlEvent} from '../core/Events.js' */
/**
* An entry of `LayersControl`, as returned by `getLayers()`.
* @typedef {object} LayersControlEntry
* @property {Layer} layer The layer.
* @property {string} name The name of the layer, as given to the control.
* @property {boolean} overlay Whether the layer is an overlay (checkbox) or a base layer
* (radio button).
*/
/**
* The group of an entry of `LayersControl`, as returned by the option `groupBy`.
* @typedef {object} LayersControlGroup
* @property {string} group The name of the group, rendered as text.
* @property {string} label The label of the entry within the group, may contain HTML
* (like layer names).
*/
/**
* Options of `LayersControl`.
* @typedef {object} LayersControlOptions
* @property {boolean} [collapsed=true] If `true`, the control will be collapsed into an
* icon and expanded on pointer hover, touch, or keyboard activation. Ignored if `inline`
* is `true`.
* @property {boolean} [inline=false] If `true`, the control is laid out like the
* attribution control: it is always expanded (without toggle button) and all entries are
* placed next to each other, wrapping onto multiple lines if necessary.
* @property {(name: string, layer: Layer, overlay: boolean) => LayersControlGroup | undefined} [groupBy]
* A function to group the entries. For each entry, it returns the name of its group and
* its label within the group, or `undefined` for an ungrouped entry. Consecutive entries
* of the same group (base layers and overlays separately) are rendered within one
* `maplair-control-layers-group` container, starting with the group name in a
* `maplair-control-layers-group-name` element, and each entry shows only its label.
* Events like `baselayerchange` still carry the full `name`. When combined with
* `sortLayers`, the entries are sorted first and grouped afterwards.
* @property {string|HTMLElement} [toggleContent] The content of the toggle button of a
* collapsed control instead of the layers icon: HTML (e.g. an icon or a character) or an
* element. String content is rendered as HTML; do not pass untrusted input.
* @property {number} [collapseDelay=0] Collapse delay in milliseconds. If greater than 0,
* the control will remain open longer, making it easier to scroll through long layer
* lists.
* @property {string} [position='topright'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {boolean} [autoZIndex=true] If `true`, the control will assign zIndexes in
* increasing order to all of its layers so that the order is preserved when switching
* them on/off.
* @property {boolean} [hideSingleBase=false] If `true`, the base layers in the control
* will be hidden when there is only one.
* @property {boolean} [sortLayers=false] Whether to sort the layers. When `false`, layers
* will keep the order in which they were added to the control.
* @property {(layerA: Layer, layerB: Layer, nameA: string, nameB: string) => number} [sortFunction]
* A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
* that will be used for sorting the layers, when `sortLayers` is `true`. The function
* receives both the `Layer` instances and their names, as in
* `sortFunction(layerA, layerB, nameA, nameB)`. By default, it sorts layers
* alphabetically by their name.
* @extends ControlOptions
*/
/**
* The layers control gives users the ability to switch between different base layers
* and switch overlays on/off (check out the
* [detailed example](https://maplair.org/examples/layers-control/)).
*
* @example
* ```js
* const baseLayers = {
* 	"Mapbox": mapbox,
* 	"OpenStreetMap": osm
* };
*
* const overlays = {
* 	"Marker": marker,
* 	"Roads": roadsLayer
* };
*
* new LayersControl(baseLayers, overlays).addTo(map);
* ```
*
* The `baseLayers` and `overlays` parameters are object literals with layer names as keys and `Layer` objects as values:
*
* ```js
* {
*     "<someName1>": layer1,
*     "<someName2>": layer2
* }
* ```
*
* The layer names can contain HTML, which allows you to add additional styling to the items:
*
* ```js
* {"<img src='my-layer-icon' /> <span class='my-layer-item'>My Layer</span>": myLayer}
* ```
*
* Layers can be grouped using the option `groupBy`, for example layer names of the form
* `"Group (label)"`:
*
* ```js
* new LayersControl(baseLayers, overlays, {
* 	inline: true,
* 	groupBy(name) {
* 		const [, group, label] = /^([^<>()]+) \((.+)\)$/.exec(name) ?? [];
* 		return group ? {group: `${group}:`, label} : undefined;
* 	}
* }).addTo(map);
* ```
*
* @fires MaplairMap#baselayerchange {LayersControlEvent} Fired when the base layer is
* changed through the [layers control](#control-layers).
* @fires MaplairMap#overlayadd {LayersControlEvent} Fired when an overlay is selected
* through the [layers control](#control-layers).
* @fires MaplairMap#overlayremove {LayersControlEvent} Fired when an overlay is
* deselected through the [layers control](#control-layers).
*/
var LayersControl = class LayersControl extends Control {
	static defaultOptions = {
		collapsed: true,
		inline: false,
		groupBy: void 0,
		toggleContent: void 0,
		collapseDelay: 0,
		position: "topright",
		autoZIndex: true,
		hideSingleBase: false,
		sortLayers: false,
		sortFunction(layerA, layerB, nameA, nameB) {
			return nameA < nameB ? -1 : nameB < nameA ? 1 : 0;
		}
	};
	/**
	* Creates a layers control with the given layers. Base layers will be switched with
	* radio buttons, while overlays will be switched with checkboxes. Note that all base
	* layers should be passed in the base layers object, but only one should be added to
	* the map during map instantiation.
	* @param {Record<string, Layer>} [baseLayers]
	* @param {Record<string, Layer>} [overlays]
	* @param {LayersControlOptions} [options]
	*/
	constructor(baseLayers, overlays, options) {
		super(options);
		this._layerControlInputs = [];
		this._layers = [];
		this._lastZIndex = 0;
		this._handlingClick = false;
		this._preventClick = false;
		for (const [name, layer] of Object.entries(baseLayers ?? {})) this._addLayer(layer, name);
		for (const [name, layer] of Object.entries(overlays ?? {})) this._addLayer(layer, name, true);
		this.callInitHooks(LayersControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		this._initLayout();
		this._update();
		this._map = map;
		map.on("zoomend", this._checkDisabledLayers, this);
		for (const layer of this._layers) layer.layer.on("add remove", this._onLayerChange, this);
		if (!this._isCollapsible()) map.on("resize", this._expandIfNotCollapsed, this);
		return this._container;
	}
	/**
	* Adds the control to the given map.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	addTo(map) {
		super.addTo(map);
		return this._expandIfNotCollapsed();
	}
	/** @internal */
	onRemove() {
		this._map.off("zoomend", this._checkDisabledLayers, this);
		for (const layer of this._layers) layer.layer.off("add remove", this._onLayerChange, this);
		this._map.off("resize", this._expandIfNotCollapsed, this);
	}
	/**
	* Adds a base layer (radio button entry) with the given name to the control.
	* @param {Layer} layer
	* @param {string} name
	* @returns {this}
	*/
	addBaseLayer(layer, name) {
		this._addLayer(layer, name);
		return this._map ? this._update() : this;
	}
	/**
	* Adds an overlay (checkbox entry) with the given name to the control.
	* @param {Layer} layer
	* @param {string} name
	* @returns {this}
	*/
	addOverlay(layer, name) {
		this._addLayer(layer, name, true);
		return this._map ? this._update() : this;
	}
	/**
	* Remove the given layer from the control.
	* @param {Layer} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		layer.off("add remove", this._onLayerChange, this);
		const obj = this._getLayer(stamp(layer));
		if (obj) this._layers.splice(this._layers.indexOf(obj), 1);
		return this._map ? this._update() : this;
	}
	/**
	* Returns the entries of the control in the order they are displayed.
	* @returns {LayersControlEntry[]}
	*/
	getLayers() {
		return this._layers.map(({ layer, name, overlay }) => ({
			layer,
			name,
			overlay
		}));
	}
	/**
	* Selects the given layer of the control like a click on its entry: a base layer
	* replaces the current base layer, an overlay is added to the map. The events
	* `baselayerchange` and `overlayadd` are fired as for a click, but without
	* `originalEvent`. Has no effect if the control is not on a map or does not contain
	* the layer.
	* @param {Layer} layer
	* @returns {this}
	*/
	selectLayer(layer) {
		const input = this._layerControlInputs.find((input) => input.layerId === stamp(layer));
		if (input && !input.checked) {
			input.checked = true;
			this._onInputClick();
		}
		return this;
	}
	/**
	* Expand the control container if collapsed.
	* @returns {this}
	*/
	expand() {
		clearTimeout(this._collapseDelayTimeout);
		this._container.classList.add("maplair-control-layers-expanded");
		this._section.style.height = "";
		const acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
		if (acceptableHeight < this._section.clientHeight) {
			this._section.classList.add("maplair-control-layers-scrollbar");
			this._section.style.height = `${acceptableHeight}px`;
		} else this._section.classList.remove("maplair-control-layers-scrollbar");
		this._checkDisabledLayers();
		return this;
	}
	/**
	* Collapse the control container if expanded.
	* @param {Event} [ev] The event causing the collapse, if any (collapsing is skipped
	* for `pointerleave` and `pointerout` of touch).
	* @returns {this}
	*/
	collapse(ev) {
		if (this.options.inline) return this;
		if (!ev || !((ev.type === "pointerleave" || ev.type === "pointerout") && ev.pointerType === "touch")) {
			if (this.options.collapseDelay > 0) {
				this._collapseDelayTimeout = setTimeout(() => {
					this._container.classList.remove("maplair-control-layers-expanded");
				}, this.options.collapseDelay);
				return this;
			}
			this._container.classList.remove("maplair-control-layers-expanded");
		}
		return this;
	}
	_initLayout() {
		const className = "maplair-control-layers", container = this._container = create("div", className), collapsed = this._isCollapsible();
		if (this.options.inline) container.classList.add(`${className}-inline`);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		const section = this._section = create("fieldset", `${className}-list`);
		section.setAttribute("aria-label", I18n.translate("Layers"));
		if (collapsed) {
			this._map.on("click", this.collapse, this);
			on(container, {
				pointerenter: this._expandSafely,
				pointerleave: this.collapse
			}, this);
		}
		if (!this.options.inline) {
			const link = this._layersLink = create("button", `${className}-toggle`, container);
			link.type = "button";
			link.title = I18n.translate("Layers");
			link.setAttribute("aria-label", I18n.translate("Layers"));
			const { toggleContent } = this.options;
			if (typeof toggleContent === "string") link.innerHTML = toggleContent;
			else if (toggleContent) link.replaceChildren(toggleContent);
			on(link, {
				keydown(e) {
					if (e.code === "Enter") this._expandSafely();
				},
				click(e) {
					e.preventDefault();
					this._expandSafely();
				}
			}, this);
		}
		if (!collapsed) this.expand();
		this._baseLayersList = create("div", `${className}-base`, section);
		this._separator = create("div", `${className}-separator`, section);
		this._overlaysList = create("div", `${className}-overlays`, section);
		container.appendChild(section);
	}
	_getLayer(id) {
		for (const layer of this._layers) if (layer && stamp(layer.layer) === id) return layer;
	}
	_addLayer(layer, name, overlay) {
		if (this._map) layer.on("add remove", this._onLayerChange, this);
		this._layers.push({
			layer,
			name,
			overlay: !!overlay
		});
		if (this.options.sortLayers) this._layers.sort(((a, b) => this.options.sortFunction(a.layer, b.layer, a.name, b.name)));
		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
		this._expandIfNotCollapsed();
	}
	_update() {
		if (!this._container) return this;
		this._baseLayersList.replaceChildren();
		this._overlaysList.replaceChildren();
		this._layerControlInputs = [];
		this._groupCount = 0;
		let baseLayersPresent, overlaysPresent, baseLayersCount = 0;
		for (const obj of this._layers) {
			this._addItem(obj);
			overlaysPresent ||= obj.overlay;
			baseLayersPresent ||= !obj.overlay;
			baseLayersCount += !obj.overlay ? 1 : 0;
		}
		if (this.options.hideSingleBase) {
			baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
			this._baseLayersList.style.display = baseLayersPresent ? "" : "none";
		}
		this._separator.style.display = overlaysPresent && baseLayersPresent ? "" : "none";
		return this;
	}
	_onLayerChange(e) {
		if (!this._handlingClick) this._update();
		const obj = this._getLayer(stamp(e.target));
		const type = obj.overlay ? e.type === "add" ? "overlayadd" : "overlayremove" : e.type === "add" ? "baselayerchange" : null;
		if (type) this._map.fire(type, this._clickEvent ? {
			...obj,
			originalEvent: this._clickEvent
		} : obj);
	}
	_addItem(obj) {
		const label = document.createElement("label"), checked = this._map.hasLayer(obj.layer);
		const input = document.createElement("input");
		input.type = obj.overlay ? "checkbox" : "radio";
		input.className = "maplair-control-layers-selector";
		input.defaultChecked = checked;
		if (!obj.overlay) input.name = `maplair-base-layers_${stamp(this)}`;
		this._layerControlInputs.push(input);
		input.layerId = stamp(obj.layer);
		on(input, "click", this._onInputClick, this);
		const group = this.options.groupBy?.(obj.name, obj.layer, obj.overlay);
		const name = document.createElement("span");
		name.innerHTML = ` ${group ? group.label : obj.name}`;
		const holder = document.createElement("span");
		label.appendChild(holder);
		holder.appendChild(input);
		holder.appendChild(name);
		const list = obj.overlay ? this._overlaysList : this._baseLayersList;
		(group ? this._getGroupContainer(list, group.group) : list).appendChild(label);
		this._checkDisabledLayers();
		return label;
	}
	/**
	* Returns the container of the given group if it is the last element in `list`
	* (continuing the group), otherwise appends a new group container to `list`.
	* @param {HTMLElement} list
	* @param {string} group
	* @returns {HTMLElement}
	*/
	_getGroupContainer(list, group) {
		const last = list.lastElementChild;
		if (last?._maplairGroup === group) return last;
		const className = "maplair-control-layers-group", container = create("div", className, list), name = create("span", `${className}-name`, container);
		name.id = `${className}_${stamp(this)}_${++this._groupCount}`;
		name.textContent = group;
		container.setAttribute("role", "group");
		container.setAttribute("aria-labelledby", name.id);
		container._maplairGroup = group;
		return container;
	}
	_onInputClick(e) {
		if (this._preventClick) return;
		const inputs = this._layerControlInputs, addedLayers = [], removedLayers = [];
		this._handlingClick = true;
		this._clickEvent = e;
		for (const input of inputs) {
			const layer = this._getLayer(input.layerId).layer;
			if (input.checked) addedLayers.push(layer);
			else if (!input.checked) removedLayers.push(layer);
		}
		for (const layer of removedLayers) if (this._map.hasLayer(layer)) this._map.removeLayer(layer);
		for (const layer of addedLayers) if (!this._map.hasLayer(layer)) this._map.addLayer(layer);
		this._handlingClick = false;
		this._clickEvent = void 0;
		this._refocusOnMap(e);
	}
	_checkDisabledLayers() {
		const inputs = this._layerControlInputs, zoom = this._map.getZoom();
		for (const input of inputs) {
			const layer = this._getLayer(input.layerId).layer;
			input.disabled = layer.options.minZoom !== void 0 && zoom < layer.options.minZoom || layer.options.maxZoom !== void 0 && zoom > layer.options.maxZoom;
		}
	}
	_isCollapsible() {
		return this.options.collapsed && !this.options.inline;
	}
	_expandIfNotCollapsed() {
		if (this._map && !this._isCollapsible()) this.expand();
		return this;
	}
	_expandSafely() {
		const section = this._section;
		this._preventClick = true;
		on(section, "click", preventDefault);
		this.expand();
		setTimeout(() => {
			off(section, "click", preventDefault);
			this._preventClick = false;
		});
	}
};
//#endregion
export { LayersControl };

//# sourceMappingURL=LayersControl.js.map