import {ZoomControl} from '../control/ZoomControl.js';
import {ScaleControl} from '../control/ScaleControl.js';
import {AttributionControl} from '../control/AttributionControl.js';
import {LayersControl} from '../control/LayersControl.js';
import {FullscreenControl} from '../control/FullscreenControl.js';
import {MiniMapControl} from '../control/MiniMapControl.js';
import {SearchControl} from '../control/SearchControl.js';
import {LegendControl} from '../control/LegendControl.js';
import {TimeControl} from '../control/TimeControl.js';
import {SideBySideControl} from '../control/SideBySideControl.js';
import {TextControl} from '../control/TextControl.js';
import {ButtonControl} from '../control/ButtonControl.js';
import {ContextMenu} from '../control/ContextMenu.js';
import {Classification} from '../layer/Classification.js';
import {Path} from '../layer/vector/Path.js';
import {MaplairElement, camelCase, define, parseOption} from './MaplairElement.js';
import {MapElement} from './MapElement.js';
import {LayerElement, GeoJSONElement} from './layers.js';

const spacesRe = /\s+/;

/**
 * The base of the elements of controls, e.g. `<maplair-scale-control>`, children of
 * `<maplair-map>`. The attributes are the options of the control, e.g. `position`.
 */
export class ControlElement extends MaplairElement {
	/**
	 * The control.
	 * @type {any}
	 */
	get control() {
		return this._instance;
	}

	attach(parent) {
		if (parent instanceof MapElement) { this._instance.addTo(parent.map); }
	}

	detach() {
		this._instance.remove();
	}

	update(name, value) {
		if (name === 'position' && value) {
			this._instance.setPosition(value);
			return true;
		}
		return false;
	}
}

/** `<maplair-zoom-control>`: a [`ZoomControl`](#zoomcontrol), replacing the default one of the map. */
export class ZoomControlElement extends ControlElement {
	static Class = ZoomControl;

	attach(parent) {
		const map = parent?.map;
		if (map?.zoomControl) {
			map.zoomControl.remove();
			map.zoomControl = undefined;
		}
		super.attach(parent);
	}
}

/** `<maplair-scale-control>`: a [`ScaleControl`](#scalecontrol), e.g. `imperial="false"`. */
export class ScaleControlElement extends ControlElement {
	static Class = ScaleControl;
}

/** `<maplair-attribution-control>`: an [`AttributionControl`](#attributioncontrol), replacing the default one, e.g. with a `prefix`. */
export class AttributionControlElement extends ControlElement {
	static Class = AttributionControl;

	attach(parent) {
		parent?.map?.attributionControl?.remove();
		super.attach(parent);
		// the attributions of the layers already on the map
		parent?.map?.eachLayer(layer => this._instance.addAttribution(layer.getAttribution?.()));
	}
}

/**
 * `<maplair-layers-control>`: a [`LayersControl`](#layerscontrol) listing the layer elements
 * of the map with a `name`, the ones with `base` as base layers.
 */
export class LayersControlElement extends ControlElement {
	static Class = LayersControl;

	createInstance() {
		return new LayersControl({}, {}, this.getOptions());
	}

	attach(parent) {
		super.attach(parent);
		this._mapElement = parent;
		parent?._watch(this);
	}

	detach() {
		this._mapElement?._unwatch(this);
		super.detach();
	}

	onRegister(kind, el) {
		if (kind !== 'layers' || !this._instance) { return; }
		const name = el.getAttribute('name');
		if (el.hasAttribute('base')) {
			this._instance.addBaseLayer(el.layer, name);
		} else {
			this._instance.addOverlay(el.layer, name);
		}
	}

	onUnregister(kind, el) {
		if (kind === 'layers' && el.layer) { this._instance?.removeLayer(el.layer); }
	}
}

/** `<maplair-fullscreen-control>`: a [`FullscreenControl`](#fullscreencontrol). */
export class FullscreenControlElement extends ControlElement {
	static Class = FullscreenControl;
}

/**
 * `<maplair-minimap-control>`: a [`MiniMapControl`](#minimapcontrol) showing the layer of its
 * child layer element, e.g. a `<maplair-tile-layer>`.
 */
export class MiniMapControlElement extends ControlElement {
	static Class = MiniMapControl;

	createInstance() {
		// the control is created with the layer of the child element (see `attachChild()`)
		return {remove() {}};
	}

	attach() {}

	attachChild(child) {
		if (!(child instanceof LayerElement) || this._control) { return; }
		this._control = new MiniMapControl(child.layer, this.getOptions()).addTo(this._parent.map);
	}

	detachChild() {
		this._control?.remove();
		this._control = null;
	}

	get control() {
		return this._control ?? null;
	}

	destroy() {
		this.detachChild();
	}
}

/**
 * `<maplair-search-control>`: a [`SearchControl`](#searchcontrol) searching places with
 * `provider="nominatim"` (which requires `accept-usage-policy`, see
 * [`SearchControl.nominatim()`](#searchcontrol-nominatim)), or the features of a layer element
 * with `layers` (its selector) by the feature property `property` (default `name`).
 */
export class SearchControlElement extends ControlElement {
	static Class = SearchControl;
	static args = ['provider', 'accept-usage-policy', 'layers', 'property'];

	createInstance() {
		const options = this.getOptions();
		if (this.getAttribute('provider') === 'nominatim') {
			options.geocoder = SearchControl.nominatim({acceptUsagePolicy: this.hasAttribute('accept-usage-policy')});
		}
		const layersSelector = this.getAttribute('layers');
		if (layersSelector) {
			const layer = document.querySelector(layersSelector)?.layer;
			// waits for the layer element
			if (!layer) {
				document.querySelector(layersSelector)?.whenReady?.().then(() => this.recreate());
				return null;
			}
			options.geocoder = SearchControl.layers(layer, {property: this.getAttribute('property') ?? 'name'});
		}
		return new SearchControl(options);
	}
}

/**
 * `<maplair-legend-control>`: a [`LegendControl`](#legendcontrol) with the classifications of
 * the map's `<maplair-classification>` elements.
 */
export class LegendControlElement extends ControlElement {
	static Class = LegendControl;

	attach(parent) {
		super.attach(parent);
		this._mapElement = parent;
		parent?._watch(this);
	}

	detach() {
		this._mapElement?._unwatch(this);
		super.detach();
	}

	onRegister(kind, el) {
		if (kind === 'classifications' && el.classification && el.geojson) {
			this._instance?.addClassification(el.geojson, el.classification);
		}
	}

	onUnregister(kind, el) {
		if (kind === 'classifications' && el.geojson) { this._instance?.removeClassification(el.geojson); }
	}
}

/**
 * `<maplair-time-control>`: a [`TimeControl`](#timecontrol) stepping through `times` (separated
 * by spaces) or the times of `interval`; its child layer elements (e.g. a
 * `<maplair-wms-layer>`) show the current time.
 */
export class TimeControlElement extends ControlElement {
	static Class = TimeControl;

	getOptions() {
		const options = super.getOptions(),
		times = this.getAttribute('times');
		if (times && !times.trim().startsWith('[')) { options.times = times.trim().split(spacesRe); }
		return options;
	}

	attachChild(child) {
		if (!(child instanceof LayerElement)) { return; }
		child._addToMap();
		this._instance.addLayer(child.layer);
	}

	detachChild(child) {
		if (!child.layer) { return; }
		this._instance.removeLayer(child.layer);
		child.layer.remove();
	}

	update(name, value) {
		if (name === 'times' && value) {
			this._instance.setTimes(this.getOptions().times);
			return true;
		}
		if (name === 'time' && value) {
			this._instance.setTime(value);
			return true;
		}
		return super.update(name, value);
	}
}

/**
 * `<maplair-side-by-side-control>`: a [`SideBySideControl`](#sidebysidecontrol) comparing the
 * layer elements of the selectors `left` and `right`.
 */
export class SideBySideControlElement extends ControlElement {
	static Class = SideBySideControl;
	static args = ['left', 'right'];

	createInstance() {
		const left = this._layers('left'),
		right = this._layers('right');
		if (!left || !right) { return null; }
		return new SideBySideControl(left, right, this.getOptions());
	}

	_layers(side) {
		const els = [...document.querySelectorAll(this.getAttribute(side) || ':not(*)')];
		if (els.some(el => !el.layer)) {
			// waits for the layer elements
			Promise.all(els.map(el => el.whenReady?.())).then(() => this._connect());
			return null;
		}
		return els.map(el => el.layer);
	}

	update(name, value) {
		if (name === 'left' || name === 'right') {
			const layers = this._layers(name);
			if (layers) { this._instance[name === 'left' ? 'setLeftLayers' : 'setRightLayers'](layers); }
			return !!layers;
		}
		return super.update(name, value);
	}
}

/** `<maplair-text-control>`: a [`TextControl`](#textcontrol) showing the content of the element. */
export class TextControlElement extends ControlElement {
	static Class = TextControl;

	createInstance() {
		const content = this._content ??= document.createElement('div');
		const move = () => { if (this.firstChild) { content.append(...this.childNodes); } };
		move();
		this._observeContent(move);
		return new TextControl({...this.getOptions(), content});
	}
}

/**
 * `<maplair-button-control>`: a [`ButtonControl`](#buttoncontrol) with the content of the
 * element; clicking it dispatches `maplair-click` on the element.
 */
export class ButtonControlElement extends ControlElement {
	static Class = ButtonControl;

	createInstance() {
		const content = document.createElement('span');
		const move = () => { if (this.firstChild) { content.append(...this.childNodes); } };
		move();
		this._observeContent(move);
		return new ButtonControl({
			...this.getOptions(),
			content,
			onClick: (originalEvent, button, map) => {
				this.dispatchEvent(new CustomEvent('maplair-click', {bubbles: true, detail: {originalEvent, button, map}}));
			}
		});
	}
}

/**
 * `<maplair-context-menu>`: a [`ContextMenu`](#contextmenu) of the map or of the layer of the
 * parent element, with its child `<button>` elements as items; choosing one dispatches
 * `maplair-select` on the button, with the `latlng` of the menu in `detail`.
 */
export class ContextMenuElement extends ControlElement {
	static Class = ContextMenu;

	createInstance() {
		const buttons = [...this.querySelectorAll(':scope > button')];
		if (!buttons.length) { return null; }
		const items = buttons.map(button => ({
			text: button.textContent.trim(),
			disabled: button.disabled,
			callback(e) {
				button.dispatchEvent(new CustomEvent('maplair-select', {bubbles: true, detail: e}));
			}
		}));
		this._observeContent(() => this.recreate());
		return new ContextMenu(items, this.getOptions());
	}

	attach(parent) {
		const target = parent instanceof MapElement ? parent.map : parent?.layer;
		if (target) { this._instance.addTo(target); }
	}
}

/**
 * `<maplair-classification>`: a [`Classification`](#classification) styling the features of
 * the parent `<maplair-geojson>` by the property `property`, with its child
 * `<maplair-class>` elements as the classes; `name` is the title in
 * `<maplair-legend-control>`.
 *
 * `<maplair-class>`: a class by `value` (a number, a string, `null` or a JSON array of values)
 * or by the range from `lower` (included) to `upper` (excluded), with the path style as
 * attributes (e.g. `fill-color`), a `legend` label, and `counted="false"` to leave it out of
 * the feature count.
 */
export class ClassificationElement extends MaplairElement {
	static args = ['property', 'name', 'normalize'];

	/**
	 * The classification.
	 * @type {Classification|null}
	 */
	get classification() {
		return this._instance;
	}

	/**
	 * The `GeoJSON` layer it styles.
	 * @type {any}
	 */
	get geojson() {
		return this._parent?.layer ?? null;
	}

	createInstance() {
		const classes = Array.from(this.querySelectorAll(':scope > maplair-class'), classOf);
		if (!classes.length) { return null; }
		this._observeContent(() => this.recreate());
		return new Classification(classes, {
			name: this.getAttribute('name') ?? '',
			value: this.getAttribute('property') ?? undefined,
			normalize: this.hasAttribute('normalize') ? (v => String(v).toLowerCase()) : undefined
		});
	}

	attach(parent) {
		if (!(parent instanceof GeoJSONElement)) { return; }
		const classification = this._instance;
		parent.layer.options.style = feature => classification.style(feature);
		parent.restyle();
		this._mapElement = this.closest('maplair-map');
		this._mapElement?._register('classifications', this);
	}

	detach(parent) {
		this._mapElement?._unregister('classifications', this);
		if (parent instanceof GeoJSONElement && parent.layer) {
			delete parent.layer.options.style;
			parent.restyle();
		}
	}
}

function classOf(el) {
	const cls = {symbol: {}};
	for (const {name, value} of el.attributes) {
		switch (name) {
		case 'value':
			cls.value = parseOption('value', value);
			break;
		case 'lower':
		case 'upper':
			cls[name] = Number(value);
			break;
		case 'legend':
			cls.legend = value;
			break;
		case 'counted':
			cls.counted = value !== 'false';
			break;
		default: {
			const key = camelCase(name);
			cls.symbol[key] = parseOption(key, value, Path.defaultOptions[key]);
		}
		}
	}
	return cls;
}

/** `<maplair-class>`: a class of the parent `<maplair-classification>`, see there. */
export class ClassElement extends (globalThis.HTMLElement ?? class {}) {}

define('maplair-zoom-control', ZoomControlElement);
define('maplair-scale-control', ScaleControlElement);
define('maplair-attribution-control', AttributionControlElement);
define('maplair-layers-control', LayersControlElement);
define('maplair-fullscreen-control', FullscreenControlElement);
define('maplair-minimap-control', MiniMapControlElement);
define('maplair-search-control', SearchControlElement);
define('maplair-legend-control', LegendControlElement);
define('maplair-time-control', TimeControlElement);
define('maplair-side-by-side-control', SideBySideControlElement);
define('maplair-text-control', TextControlElement);
define('maplair-button-control', ButtonControlElement);
define('maplair-context-menu', ContextMenuElement);
define('maplair-classification', ClassificationElement);
define('maplair-class', ClassElement);
