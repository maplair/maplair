import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {I18n} from '../core/I18n.js';
import {MaplairMap} from '../map/Map.js';
import {Polygon} from '../layer/vector/Polygon.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMapOptions} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {PathOptions} from '../layer/vector/Path.js' */

/**
 * Options of `MiniMapControl`.
 * @typedef {object} MiniMapControlOptions
 * @property {string} [position='bottomright'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {number} [width=150] The width of the overview map in pixels.
 * @property {number} [height=150] The height of the overview map in pixels.
 * @property {number} [zoomOffset=-5] The zoom level of the overview map relative to the
 * map.
 * @property {boolean} [collapsed=false] Whether the overview map is collapsed initially.
 * @property {PathOptions} [rectangleOptions={color: '#ff7800', weight: 1, fillOpacity: 0.2}]
 * The style of the rectangle showing the view of the map.
 * @property {MaplairMapOptions} [mapOptions={}] Further options of the overview map.
 * @extends ControlOptions
 */

/**
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
export class MiniMapControl extends Control {

	static defaultOptions = {
		position: 'bottomright',
		width: 150,
		height: 150,
		zoomOffset: -5,
		collapsed: false,
		rectangleOptions: {color: '#ff7800', weight: 1, fillOpacity: 0.2},
		mapOptions: {}
	};

	/**
	 * Creates an overview map control showing `layer` (which must not be on another map).
	 * @param {Layer} layer
	 * @param {MiniMapControlOptions} [options]
	 */
	constructor(layer, options) {
		super(options);
		this._layer = layer;
		this.callInitHooks(MiniMapControl);
	}

	/**
	 * Adds the control to the given map.
	 * @param {MaplairMap} map
	 * @returns {this}
	 */
	addTo(map) {
		super.addTo(map);
		// the size of the overview map is known once it is on the page
		this._miniMap.invalidateSize({pan: false});
		this._update();
		return this;
	}

	/**
	 * @internal
	 * @param {MaplairMap} map
	 * @returns {HTMLElement}
	 */
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

	/**
	 * @internal
	 * @param {MaplairMap} map
	 */
	onRemove(map) {
		map.off('move zoom rotate resize', this._update, this);
		this._miniMap.remove();
		this._miniMap = null;
	}

	/**
	 * Returns the overview map.
	 * @returns {MaplairMap}
	 */
	getMiniMap() {
		return this._miniMap;
	}

	/**
	 * Collapses or expands the overview map.
	 * @returns {this}
	 */
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
