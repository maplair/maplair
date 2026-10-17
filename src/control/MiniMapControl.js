import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {I18n} from '../core/I18n.js';
import {MaplairMap} from '../map/Map.js';
import {Polygon} from '../layer/vector/Polygon.js';

/*
 * @class MiniMapControl
 * @inherits Control
 *
 * An overview map in a corner of the map, showing the view of the map as a
 * rectangle (or rotated rectangle on a rotated map) at a smaller zoom level.
 * Dragging the overview map pans the map, clicking it centers the map there, and
 * a button collapses it.
 *
 * Inspired by the [Leaflet-MiniMap](https://github.com/Norkart/Leaflet-MiniMap) plugin.
 *
 * @example
 * ```js
 * // a layer of its own, a layer can only be on one map
 * const overviewLayer = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
 * new MiniMapControl(overviewLayer).addTo(map);
 * ```
 */

// @namespace MiniMapControl
// @constructor MiniMapControl(layer: Layer, options?: MiniMapControl options)
// Creates an overview map control showing `layer` (which must not be on another map).
export class MiniMapControl extends Control {

	static {
		// @section
		// @aka MiniMapControl options
		this.setDefaultOptions({
			// @option position: String = 'bottomright'
			// The position of the control (one of the map corners).
			position: 'bottomright',

			// @option width: Number = 150
			// The width of the overview map in pixels.
			width: 150,

			// @option height: Number = 150
			// The height of the overview map in pixels.
			height: 150,

			// @option zoomOffset: Number = -5
			// The zoom level of the overview map relative to the map.
			zoomOffset: -5,

			// @option collapsed: Boolean = false
			// Whether the overview map is collapsed initially.
			collapsed: false,

			// @option rectangleOptions: Path options = {color: '#ff7800', weight: 1, fillOpacity: 0.2}
			// The style of the rectangle showing the view of the map.
			rectangleOptions: {color: '#ff7800', weight: 1, fillOpacity: 0.2},

			// @option mapOptions: MaplairMap options = {}
			// Further options of the overview map.
			mapOptions: {}
		});
	}

	constructor(layer, options) {
		super(options);
		this._layer = layer;
		this.callInitHooks(MiniMapControl);
	}

	addTo(map) {
		super.addTo(map);
		// the size of the overview map is known once it is on the page
		this._miniMap.invalidateSize({pan: false});
		this._update();
		return this;
	}

	onAdd(map) {
		const container = DomUtil.create('div', 'maplair-control-minimap'),
		mapContainer = DomUtil.create('div', 'maplair-control-minimap-map', container);
		container.style.width = `${this.options.width}px`;
		container.style.height = `${this.options.height}px`;

		const toggle = this._toggle = DomUtil.create('button', 'maplair-control-minimap-toggle', container);
		toggle.type = 'button';
		DomEvent.on(toggle, 'click', DomEvent.stop);
		DomEvent.on(toggle, 'click', this.toggle, this);

		DomEvent.disableClickPropagation(container);
		DomEvent.disableScrollPropagation(container);

		this._miniMap = new MaplairMap(mapContainer, {
			attributionControl: false,
			zoomControl: false,
			doubleClickZoom: false,
			scrollWheelZoom: false,
			boxZoom: false,
			keyboard: false,
			pinchZoom: false,
			tapDragZoom: false,
			ariaLabel: I18n.translate('Overview map'),
			...this.options.mapOptions,
			layers: [this._layer]
		});
		// not part of the keyboard navigation, the map has its own
		mapContainer.tabIndex = -1;

		this._rectangle = new Polygon([], {interactive: false, ...this.options.rectangleOptions});

		this._miniMap.on({
			moveend: this._onMiniMapMoveEnd,
			click: this._onMiniMapClick
		}, this);
		map.on('move zoom rotate resize', this._update, this);
		map.whenReady(this._update, this);

		this._setCollapsed(this.options.collapsed);
		return container;
	}

	onRemove(map) {
		map.off('move zoom rotate resize', this._update, this);
		this._miniMap.remove();
		this._miniMap = null;
	}

	// @method getMiniMap(): MaplairMap
	// Returns the overview map.
	getMiniMap() {
		return this._miniMap;
	}

	// @method toggle(): this
	// Collapses or expands the overview map.
	toggle() {
		return this._setCollapsed(!this._collapsed);
	}

	_setCollapsed(collapsed) {
		this._collapsed = collapsed;
		const container = this._container ?? this._toggle.parentNode,
		title = collapsed ? I18n.translate('Show the overview map') : I18n.translate('Hide the overview map');
		container.classList.toggle('maplair-control-minimap-collapsed', collapsed);
		this._toggle.title = title;
		this._toggle.setAttribute('aria-label', title);
		this._toggle.setAttribute('aria-expanded', !collapsed);
		if (!collapsed) {
			this._miniMap.invalidateSize();
			this._update();
		}
		return this;
	}

	// Follows the view of the map
	_update() {
		const map = this._map, miniMap = this._miniMap;
		if (!map?._loaded || !miniMap || this._collapsed) { return; }

		const zoom = Math.max(miniMap.getMinZoom(), Math.min(map.getZoom() + this.options.zoomOffset, miniMap.getMaxZoom()));
		miniMap.setView(map.getCenter(), zoom, {animate: false});

		const size = map.getSize();
		this._rectangle.setLatLngs([[0, 0], [size.x, 0], size, [0, size.y]].map(p => map.containerPointToLatLng(p)));
		if (!miniMap.hasLayer(this._rectangle)) {
			this._rectangle.addTo(miniMap);
		}
	}

	// Dragging the overview map pans the map (only when moved by the user)
	_onMiniMapMoveEnd(e) {
		if (e.originalEvent) {
			this._map.panTo(this._miniMap.getCenter());
		}
	}

	_onMiniMapClick(e) {
		if (!this._miniMap.dragging?.moved()) {
			this._map.panTo(e.latlng);
		}
	}
}
