import {Evented} from '../core/Events.js';
import * as Util from '../core/Util.js';
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {LayerGroup} from './LayerGroup.js' */
/** @import {EventListener, MaplairEvent, MaplairPointerEvent, LayerEvent} from '../core/Events.js' */

/**
 * Options of `Layer`, inherited by all layers.
 * @typedef {object} LayerOptions
 * @property {string} [pane='overlayPane'] By default the layer will be added to the
 * map's [overlay pane](#map-pane) (`overlayPane`). Overriding this option will cause the layer
 * to be placed on another pane by default. Not effective if the `renderer` option is
 * set (the `renderer` option will override the `pane` option).
 * @property {string|null} [attribution=null] String to be shown in the attribution
 * control, e.g. "© OpenStreetMap contributors". It describes the layer data and is
 * often a legal obligation towards copyright holders and tile providers.
 * @property {number} [attributionOrder=0] The position of the attribution in the
 * attribution control: attributions are sorted by it, then by the order of adding,
 * e.g. `1` keeps a legend last.
 */

/**
 * Options of interactive layers. Some layers can be made interactive - when the user
 * interacts with such a layer, pointer events like `click` and `pointerover` can be
 * handled. Use the [event handling methods](#evented-method) to handle these events.
 * @typedef {object} InteractiveLayerOptions
 * @property {boolean} [interactive=true] If `false`, the layer will not emit pointer
 * events and will act as a part of the underlying map.
 * @property {boolean} [bubblingPointerEvents=true] When `true`, a pointer event on this
 * layer will trigger the same event on the map (unless
 * [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
 * @extends LayerOptions
 * @fires Layer#click {MaplairPointerEvent} Fired when the user clicks (or taps) the
 * layer, if it is interactive.
 * @fires Layer#dblclick {MaplairPointerEvent} Fired when the user double-clicks (or
 * double-taps) the layer, if it is interactive.
 * @fires Layer#pointerdown {MaplairPointerEvent} Fired when the user pushes the pointer
 * on the layer, if it is interactive.
 * @fires Layer#pointerup {MaplairPointerEvent} Fired when the user releases the pointer
 * pushed on the layer, if it is interactive.
 * @fires Layer#pointerover {MaplairPointerEvent} Fired when the pointer enters the
 * layer, if it is interactive.
 * @fires Layer#pointerout {MaplairPointerEvent} Fired when the pointer leaves the layer,
 * if it is interactive.
 * @fires Layer#contextmenu {MaplairPointerEvent} Fired when the user right-clicks on
 * the layer, if it is interactive; prevents default browser context menu from showing
 * if there are listeners on this event. Also fired on mobile when the user holds a
 * single touch for a second (also called long press).
 */

/**
 * Methods of `MaplairMap` for layers.
 * @lends MaplairMap.prototype
 * @fires MaplairMap#layeradd {LayerEvent} Fired when a new layer is added to the map.
 * @fires MaplairMap#layerremove {LayerEvent} Fired when some layer is removed from the map.
 * @fires MaplairMap#zoomlevelschange {MaplairEvent} Fired when the number of zoomlevels
 * on the map is changed due to adding or removing a layer.
 */
const mapLayerMethods = {
	/**
	 * Adds the given layer to the map.
	 * @group Methods for layers and controls
	 * @param {Layer} layer
	 * @returns {this}
	 */
	addLayer(layer) {
		if (!layer._layerAdd) {
			throw new Error('The provided object is not a Layer.');
		}

		const id = Util.stamp(layer);
		if (this._layers[id]) { return this; }
		this._layers[id] = layer;

		layer._mapToAdd = this;

		if (layer.beforeAdd) {
			layer.beforeAdd(this);
		}

		this.whenReady(layer._layerAdd, layer);

		return this;
	},

	/**
	 * Removes the given layer from the map.
	 * @group Methods for layers and controls
	 * @param {Layer} layer
	 * @returns {this}
	 */
	removeLayer(layer) {
		const id = Util.stamp(layer);

		if (!this._layers[id]) { return this; }

		if (this._loaded) {
			layer.onRemove(this);
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', {layer});
			layer.fire('remove');
		}

		layer._map = layer._mapToAdd = null;

		return this;
	},

	/**
	 * Returns `true` if the given layer is currently added to the map.
	 * @group Methods for layers and controls
	 * @param {Layer} layer
	 * @returns {boolean}
	 */
	hasLayer(layer) {
		return Util.stamp(layer) in this._layers;
	},

	/**
	 * Iterates over the layers of the map, optionally specifying context of the iterator function.
	 * ```js
	 * map.eachLayer(function(layer){
	 *     layer.bindPopup('Hello');
	 * });
	 * ```
	 * @group Methods for layers and controls
	 * @param {(layer: Layer) => void} method
	 * @param {object} [context]
	 * @returns {this}
	 */
	eachLayer(method, context) {
		for (const layer of Object.values(this._layers)) {
			method.call(context, layer);
		}
		return this;
	},

	_addLayers(layers) {
		layers = layers ? (Array.isArray(layers) ? layers : [layers]) : [];

		for (const layer of layers) {
			this.addLayer(layer);
		}
	},

	_addZoomLimit(layer) {
		if (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
			this._zoomBoundLayers[Util.stamp(layer)] = layer;
			this._updateZoomLevels();
		}
	},

	_removeZoomLimit(layer) {
		const id = Util.stamp(layer);

		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}
	},

	_updateZoomLevels() {
		let minZoom = Infinity,
		maxZoom = -Infinity;
		const oldZoomSpan = this._getZoomSpan();

		for (const l of Object.values(this._zoomBoundLayers)) {
			const options = l.options;
			minZoom = Math.min(minZoom, options.minZoom ?? Infinity);
			maxZoom = Math.max(maxZoom, options.maxZoom ?? -Infinity);
		}

		this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
		this._layersMinZoom = minZoom === Infinity ? undefined : minZoom;

		if (oldZoomSpan !== this._getZoomSpan()) {
			this.fire('zoomlevelschange');
		}

		if (this.options.maxZoom === undefined && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
			this.setZoom(this._layersMaxZoom);
		}
		if (this.options.minZoom === undefined && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
			this.setZoom(this._layersMinZoom);
		}
	}
};
/** @typedef {typeof mapLayerMethods} MapLayerMethods */

/**
 * The methods which layers implement, see `Layer`.
 * @typedef {object} LayerExtensionMethods
 * @property {(map: MaplairMap) => void} [onAdd] Should contain code that creates DOM
 * elements for the layer, adds them to `map panes` where they should belong and puts
 * listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
 * @property {(map: MaplairMap) => void} [onRemove] Should contain all clean up code that
 * removes the layer's elements from the DOM and removes listeners previously added in
 * `onAdd`. Called on [`map.removeLayer(layer)`](#map-removelayer).
 * @property {() => Record<string, Function>} [getEvents] Should return an object
 * like `{ viewreset: this._reset }` for [`on`](#evented-on). The event handlers in this
 * object will be automatically added and removed from the map with your layer.
 * @property {() => HTMLElement|string} [getLegend] Should return an element (or a string
 * containing HTML) to be shown on the `LegendControl` whenever the layer is visible.
 * Fire `legendchange` on the layer when the legend changes.
 * @property {(map: MaplairMap) => void} [beforeAdd] Called on
 * [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before
 * events are initialized, without waiting until the map is in a usable state. Use for
 * early initialization only.
 * @lends Layer
 */

/**
 * The base class of all Maplair layers, with the methods they share.
 *
 * Every layer should extend from `Layer` and (re-)implement the following methods:
 *
 * * `onAdd(map: MaplairMap): this` should contain code that creates DOM elements for
 *   the layer, adds them to `map panes` where they should belong and puts listeners on
 *   relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
 * * `onRemove(map: MaplairMap): this` should contain all clean up code that removes the
 *   layer's elements from the DOM and removes listeners previously added in `onAdd`.
 *   Called on [`map.removeLayer(layer)`](#map-removelayer).
 * * `getEvents(): Object` (optional) should return an object like
 *   `{ viewreset: this._reset }` for [`on`](#evented-on). The event handlers in this
 *   object will be automatically added and removed from the map with your layer.
 * * `getAttribution(): String` (optional) should return a string containing HTML to be
 *   shown on the `Attribution control` whenever the layer is visible.
 * * `getLegend(): HTMLElement|String` (optional) should return an element (or a string
 *   containing HTML) to be shown on the `LegendControl` whenever the layer is visible.
 *   Fire `legendchange` on the layer when the legend changes.
 * * `beforeAdd(map: MaplairMap): this` (optional) is called on
 *   [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map,
 *   before events are initialized, without waiting until the map is in a usable state.
 *   Use for early initialization only.
 *
 * @example
 * ```js
 * const layer = new Marker(latlng).addTo(map);
 * layer.addTo(map);
 * layer.remove();
 * ```
 *
 * @fires add {MaplairEvent} Fired after the layer is added to a map.
 * @fires remove {MaplairEvent} Fired after the layer is removed from a map.
 */
export class Layer extends Evented {

	static {
		this.setDefaultOptions({
			pane: 'overlayPane',
			attribution: null,
			attributionOrder: 0,
			bubblingPointerEvents: true
		});
	}

	/**
	 * Adds the layer to the given map or layer group.
	 * @param {MaplairMap|LayerGroup} map
	 * @returns {this}
	 */
	addTo(map) {
		map.addLayer(this);
		return this;
	}

	/**
	 * Removes the layer from the map it is currently active on.
	 * @returns {this}
	 */
	remove() {
		return this.removeFrom(this._map || this._mapToAdd);
	}

	/**
	 * Removes the layer from the given map or `LayerGroup`.
	 * @param {MaplairMap|LayerGroup} obj
	 * @returns {this}
	 */
	removeFrom(obj) {
		obj?.removeLayer(this);
		return this;
	}

	/**
	 * Returns the `HTMLElement` representing the named pane on the map. If `name` is
	 * omitted, returns the pane for this layer.
	 * @param {string} [name]
	 * @returns {HTMLElement}
	 */
	getPane(name) {
		return this._map.getPane(name ? (this.options[name] || name) : this.options.pane);
	}

	/**
	 * Changes the [`interactive`](#interactivelayeroptions-interactive) option of the
	 * layer, e.g. to stop a layer from emitting pointer events while it is being edited.
	 * @param {boolean} interactive
	 * @returns {this}
	 */
	setInteractive(interactive) {
		interactive = !!interactive;
		if (this.options.interactive !== interactive) {
			Util.setOptions(this, {interactive});
			if (this._map) {
				this._updateInteractive();
			}
		}
		return this;
	}

	// Applies a changed `interactive` option to a layer on the map, see `setInteractive()`.
	_updateInteractive() {}

	/**
	 * Makes `targetEl` a target of pointer events of this layer.
	 * @internal
	 * @param {HTMLElement} targetEl
	 * @returns {this}
	 */
	addInteractiveTarget(targetEl) {
		this._map._targets[Util.stamp(targetEl)] = this;
		return this;
	}

	/**
	 * Stops `targetEl` from being a target of pointer events of this layer.
	 * @internal
	 * @param {HTMLElement} targetEl
	 * @returns {this}
	 */
	removeInteractiveTarget(targetEl) {
		delete this._map._targets[Util.stamp(targetEl)];
		return this;
	}

	/**
	 * Used by the `attribution control`, returns the [attribution option](#layeroptions-attribution).
	 * @returns {string|null}
	 */
	getAttribution() {
		return this.options.attribution;
	}

	/**
	 * Changes the [attribution option](#layeroptions-attribution), also in the
	 * attribution control while the layer is on the map.
	 * @param {string|null} attribution
	 * @returns {this}
	 */
	setAttribution(attribution) {
		const control = this._map?.attributionControl;
		control?.removeAttribution(this.getAttribution());
		Util.setOptions(this, {attribution});
		control?.addAttribution(this.getAttribution(), this.options.attributionOrder);
		return this;
	}

	_layerAdd(e) {
		const map = e.target;

		// check in case layer gets added and then removed before the map is ready
		if (!map.hasLayer(this)) { return; }

		this._map = map;
		this._zoomAnimated = map._zoomAnimated;

		if (this.getEvents) {
			const events = this.getEvents();
			map.on(events, this);
			this.once('remove', () => map.off(events, this));
		}

		this.onAdd(map);

		this.fire('add');
		map.fire('layeradd', {layer: this});
	}

	/**
	 * Registers this default feature on the map class, called by `MaplairMap` itself.
	 * @internal
	 * @param {typeof MaplairMap} MaplairMap
	 */
	static register(MaplairMap) {
		MaplairMap.include(mapLayerMethods);
	}
}
