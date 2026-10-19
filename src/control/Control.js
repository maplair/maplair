import {Class} from '../core/Class.js';
import * as Util from '../core/Util.js';
import * as DomUtil from '../dom/DomUtil.js';
/** @import {MaplairMap} from '../map/Map.js' */

/**
 * Options of `Control`, inherited by all controls.
 * @typedef {object} ControlOptions
 * @property {string} [position='topright'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {number} [order=0] The position of the control within its corner: controls
 * with a lower order are closer to the corner of the map, those with the same order in
 * the order of adding.
 */

/**
 * Methods of `MaplairMap` for controls.
 * @lends MaplairMap.prototype
 */
const mapControlMethods = {
	/**
	 * Adds the given control to the map.
	 * @group Methods for layers and controls
	 * @param {Control} control
	 * @returns {this}
	 */
	addControl(control) {
		control.addTo(this);
		return this;
	},

	/**
	 * Removes the given control from the map.
	 * @group Methods for layers and controls
	 * @param {Control} control
	 * @returns {this}
	 */
	removeControl(control) {
		control.remove();
		return this;
	},

	_initControlPos() {
		const corners = this._controlCorners = {},
		l = 'maplair-',
		container = this._controlContainer = DomUtil.create('div', `${l}control-container`, this._container);

		function createCorner(vSide, hSide) {
			const className = `${l + vSide} ${l}${hSide}`;

			corners[vSide + hSide] = DomUtil.create('div', className, container);
		}

		createCorner('top', 'left');
		createCorner('top', 'right');
		createCorner('bottom', 'left');
		createCorner('bottom', 'right');
	},

	_clearControlPos() {
		for (const c of Object.values(this._controlCorners)) {
			c.remove();
		}
		this._controlContainer.remove();
		delete this._controlCorners;
		delete this._controlContainer;
	}
};
/** @typedef {typeof mapControlMethods} MapControlMethods */

/**
 * The methods which controls implement, see `Control`.
 * @typedef {object} ControlExtensionMethods
 * @property {(map: MaplairMap) => HTMLElement} [onAdd] Should return the container DOM
 * element for the control and add listeners on relevant map events. Called on
 * [`control.addTo(map)`](#control-addto).
 * @property {(map: MaplairMap) => void} [onRemove] Should contain all clean up code that
 * removes the listeners previously added in `onAdd`. Called on
 * [`control.remove()`](#control-remove).
 * @lends Control
 */

// The `order` option of the containers of added controls
const controlOrders = new WeakMap();

/**
 * Control is a base class for implementing map controls. Handles positioning.
 * All other controls extend from this class.
 *
 * Every control should extend from `Control` and (re-)implement the following methods:
 *
 * * `onAdd(map: MaplairMap): HTMLElement` should return the container DOM element for
 *   the control and add listeners on relevant map events. Called on
 *   [`control.addTo(map)`](#control-addTo).
 * * `onRemove(map: MaplairMap)` (optional) should contain all clean up code that removes
 *   the listeners previously added in [`onAdd`](#control-onadd). Called on
 *   [`control.remove()`](#control-remove).
 */
export class Control extends Class {

	static defaultOptions = {
		position: 'topright',
		order: 0
	};

	/**
	 * @param {ControlOptions} [options]
	 */
	constructor(options) {
		super();
		Util.setOptions(this, options);

		this.callInitHooks(Control);
	}

	/**
	 * Returns the position of the control.
	 * @returns {string}
	 */
	getPosition() {
		return this.options.position;
	}

	/**
	 * Sets the position of the control.
	 * @param {string} position
	 * @returns {this}
	 */
	setPosition(position) {
		const map = this._map;

		map?.removeControl(this);

		this.options.position = position;

		map?.addControl(this);

		return this;
	}

	/**
	 * Returns the HTMLElement that contains the control.
	 * @returns {HTMLElement}
	 */
	getContainer() {
		return this._container;
	}

	/**
	 * Adds the control to the given map.
	 * @param {MaplairMap} map
	 * @returns {this}
	 */
	addTo(map) {
		this.remove();
		this._map = map;

		const container = this._container = this.onAdd(map),
		pos = this.getPosition(),
		corner = map._controlCorners[pos];

		container.classList.add('maplair-control');

		// sorted by order from the corner of the map (bottom corners are filled upwards),
		// farther than the controls with the same order
		const order = this.options.order ?? 0,
		bottom = pos.includes('bottom'),
		children = [...corner.children];
		controlOrders.set(container, order);
		corner.insertBefore(container, children.find(el => bottom ?
			(controlOrders.get(el) ?? 0) <= order :
			(controlOrders.get(el) ?? 0) > order) ?? null);

		this._map.on('unload', this.remove, this);

		return this;
	}

	/**
	 * Removes the control from the map it is currently active on.
	 * @returns {this}
	 */
	remove() {
		if (!this._map) {
			return this;
		}

		this._container.remove();

		if (this.onRemove) {
			this.onRemove(this._map);
		}

		this._map.off('unload', this.remove, this);
		this._map = null;

		return this;
	}

	_refocusOnMap(e) {
		// We exclude keyboard-click event to keep the focus on the control for accessibility.
		// The position of keyboard-click events are x=0 and y=0.
		if (this._map && e && !(e.screenX === 0 && e.screenY === 0)) {
			this._map.getContainer().focus();
		}
	}

	/**
	 * Registers this default feature on the map class, called by `MaplairMap` itself.
	 * @internal
	 * @param {typeof MaplairMap} MaplairMap
	 */
	static register(MaplairMap) {
		MaplairMap.include(mapControlMethods);
	}
}
