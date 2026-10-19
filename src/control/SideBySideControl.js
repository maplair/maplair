import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {I18n} from '../core/I18n.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {MaplairEvent} from '../core/Events.js' */

/**
 * Options of `SideBySideControl`.
 * @typedef {object} SideBySideControlOptions
 * @property {number} [ratio=0.5] The initial position of the divider, from `0` (left) to
 * `1` (right).
 * @extends ControlOptions
 */

/**
 * The event object of `dividermove`.
 * @typedef {object} DividerMoveEvent
 * @property {number} ratio The position of the divider, from `0` (left) to `1` (right).
 * @property {number} x The position of the divider in container pixels.
 * @extends MaplairEvent
 */

/**
 * Compares layers side by side: a vertical divider across the map shows the
 * "left" layers on its left and the "right" layers on its right side. The divider
 * can be dragged, or moved with the arrow keys. Works with layers having a
 * container or element of their own, e.g. tile layers and image overlays.
 *
 * Inspired by the [leaflet-side-by-side](https://github.com/digidem/leaflet-side-by-side) plugin.
 *
 * @example
 * ```js
 * const before = new TileLayer('https://…/2020/{z}/{x}/{y}.png').addTo(map);
 * const after = new TileLayer('https://…/2025/{z}/{x}/{y}.png').addTo(map);
 * new SideBySideControl(before, after).addTo(map);
 * ```
 *
 * @fires MaplairMap#dividermove {DividerMoveEvent} Fired when the divider of a
 * `SideBySideControl` moves.
 */
export class SideBySideControl extends Control {

	static defaultOptions = {
		ratio: 0.5
	};

	/**
	 * Creates a side-by-side control for the given layers (which have to be added to the
	 * map separately).
	 * @param {Layer|Layer[]} [leftLayers]
	 * @param {Layer|Layer[]} [rightLayers]
	 * @param {SideBySideControlOptions} [options]
	 */
	constructor(leftLayers, rightLayers, options) {
		super(options);
		this._leftLayers = [leftLayers ?? []].flat();
		this._rightLayers = [rightLayers ?? []].flat();
		this._ratio = this.options.ratio;
		this.callInitHooks(SideBySideControl);
	}

	/**
	 * Adds the control to the given map. The divider spans the map instead of being in
	 * a corner.
	 * @param {MaplairMap} map
	 * @returns {this}
	 */
	addTo(map) {
		this.remove();
		this._map = map;
		this._container = this.onAdd(map);
		map._container.appendChild(this._container);
		map.on('unload', this.remove, this);
		return this;
	}

	/**
	 * @internal
	 * @param {MaplairMap} map
	 * @returns {HTMLElement}
	 */
	onAdd(map) {
		const divider = DomUtil.create('div', 'maplair-sidebyside-divider'),
		label = I18n.translate('Divider between the compared layers');
		divider.tabIndex = 0;
		divider.setAttribute('role', 'slider');
		divider.setAttribute('aria-label', label);
		divider.setAttribute('aria-valuemin', 0);
		divider.setAttribute('aria-valuemax', 100);

		DomEvent.disableClickPropagation(divider);
		DomEvent.on(divider, 'pointerdown', this._onPointerDown, this);
		DomEvent.on(divider, 'keydown', this._onKeyDown, this);

		map.on('move zoom viewreset resize rotate layeradd', this._update, this);
		this._container = divider;
		this._update();
		return divider;
	}

	/**
	 * @internal
	 * @param {MaplairMap} map
	 */
	onRemove(map) {
		this._onPointerUp();
		map.off('move zoom viewreset resize rotate layeradd', this._update, this);
		for (const layer of [...this._leftLayers, ...this._rightLayers]) {
			const el = getElement(layer);
			if (el) {
				el.style.clipPath = '';
			}
		}
	}

	/**
	 * Sets the layers shown on the left side of the divider.
	 * @param {Layer|Layer[]} layers
	 * @returns {this}
	 */
	setLeftLayers(layers) {
		this._clear(this._leftLayers);
		this._leftLayers = [layers].flat();
		return this._update();
	}

	/**
	 * Sets the layers shown on the right side of the divider.
	 * @param {Layer|Layer[]} layers
	 * @returns {this}
	 */
	setRightLayers(layers) {
		this._clear(this._rightLayers);
		this._rightLayers = [layers].flat();
		return this._update();
	}

	/**
	 * Returns the position of the divider, from `0` (left) to `1` (right).
	 * @returns {number}
	 */
	getRatio() {
		return this._ratio;
	}

	/**
	 * Moves the divider, from `0` (left) to `1` (right).
	 * @param {number} ratio
	 * @returns {this}
	 */
	setRatio(ratio) {
		this._ratio = Math.min(1, Math.max(0, ratio));
		this._update();
		this._map?.fire('dividermove', {ratio: this._ratio, x: this._x});
		return this;
	}

	_clear(layers) {
		for (const layer of layers) {
			const el = getElement(layer);
			if (el) {
				el.style.clipPath = '';
			}
		}
	}

	_update() {
		const map = this._map;
		if (!map?._loaded || !this._container) { return this; }

		const size = map.getSize(),
		x = this._x = Math.round(size.x * this._ratio);
		this._container.style.left = `${x}px`;
		this._container.setAttribute('aria-valuenow', Math.round(this._ratio * 100));

		this._clip(this._leftLayers, 0, x, size.y);
		this._clip(this._rightLayers, x, size.x, size.y);
		return this;
	}

	// Clips the layers to the area from `x1` to `x2` (in container pixels)
	_clip(layers, x1, x2, height) {
		const map = this._map;
		for (const layer of layers) {
			const el = getElement(layer);
			if (!el || !map.hasLayer(layer)) { continue; }
			// relative to the element, which is positioned in layer pixels
			const offset = DomUtil.getPosition(el),
			corners = [[x1, 0], [x2, 0], [x2, height], [x1, height]].map((p) => {
				const point = map.containerPointToLayerPoint(p).subtract(offset);
				return `${point.x}px ${point.y}px`;
			});
			el.style.clipPath = `polygon(${corners.join(', ')})`;
		}
	}

	_onPointerDown(e) {
		DomEvent.stop(e);
		this._container.focus({preventScroll: true});
		// on the document, to follow the pointer outside of the divider
		DomEvent.on(document, 'pointermove', this._onPointerMove, this);
		DomEvent.on(document, 'pointerup pointercancel', this._onPointerUp, this);
	}

	_onPointerMove(e) {
		const rect = this._map._container.getBoundingClientRect();
		this.setRatio((e.clientX - rect.left) / rect.width);
	}

	_onPointerUp() {
		DomEvent.off(document, 'pointermove', this._onPointerMove, this);
		DomEvent.off(document, 'pointerup pointercancel', this._onPointerUp, this);
	}

	_onKeyDown(e) {
		const step = e.shiftKey ? 0.01 : 0.05;
		if (e.key === 'ArrowLeft') {
			this.setRatio(this._ratio - step);
		} else if (e.key === 'ArrowRight') {
			this.setRatio(this._ratio + step);
		} else {
			return;
		}
		// not panning the map
		DomEvent.stop(e);
	}
}

function getElement(layer) {
	return layer.getContainer?.() ?? layer.getElement?.();
}
