import {Class} from './Class.js';
/** @import {MaplairMap} from '../map/Map.js' */

/**
 * Abstract class for map interaction handlers, the base class of the handlers that
 * are used internally to inject interaction features like dragging to classes like
 * `MaplairMap` and `Marker`.
 *
 * Classes inheriting from `Handler` must implement the two following extension methods:
 *
 * * `addHooks()` is called when the handler is enabled, should add event hooks.
 * * `removeHooks()` is called when the handler is disabled, should remove the event
 *   hooks added previously.
 */
export class Handler extends Class {
	/**
	 * @param {MaplairMap} map The map the handler belongs to.
	 */
	constructor(map) {
		super();
		this._map = map;

		this.callInitHooks(Handler);
	}

	/**
	 * Enables the handler.
	 * @returns {this}
	 */
	enable() {
		if (this._enabled) { return this; }

		this._enabled = true;
		this.addHooks();
		return this;
	}

	/**
	 * Disables the handler.
	 * @returns {this}
	 */
	disable() {
		if (!this._enabled) { return this; }

		this._enabled = false;
		this.removeHooks();
		return this;
	}

	/**
	 * Returns `true` if the handler is enabled.
	 * @returns {boolean}
	 */
	enabled() {
		return !!this._enabled;
	}

	/**
	 * Adds a new handler of this class to the given map with the given name, which is
	 * then available as the property of the map with this name.
	 * @template {typeof Handler} T
	 * @this {T}
	 * @param {MaplairMap} map
	 * @param {string} name
	 * @returns {T}
	 */
	static addTo(map, name) {
		map.addHandler(name, this);
		return this;
	}
}
