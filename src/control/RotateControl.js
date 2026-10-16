import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {I18n} from '../core/I18n.js';

/*
 * @class RotateControl
 * @inherits Control
 *
 * A compass showing the rotation of the map (see `MaplairMap.setBearing()`); clicking it
 * rotates the map back to north up. It is put on the map if you set its
 * [`rotateControl` option](#map-rotatecontrol) to `true`. Extends `Control`.
 *
 * @example
 * ```js
 * new RotateControl({position: 'topright'}).addTo(map);
 * ```
 */

const compass = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M8 1 11 8H5z" fill="#d22"/><path d="M8 15 5 8h6z" fill="#999"/></svg>';

// @namespace RotateControl
// @constructor RotateControl(options?: RotateControl options)
// Creates a rotate control.
export class RotateControl extends Control {

	static {
		// @section
		// @aka RotateControl options
		this.setDefaultOptions({
			// @option position: String = 'topleft'
			// The position of the control (one of the map corners). Possible values are `'topleft'`,
			// `'topright'`, `'bottomleft'` or `'bottomright'`
			position: 'topleft'
		});
	}

	constructor(...args) {
		super(...args);
		this.callInitHooks(RotateControl);
	}

	onAdd(map) {
		const container = DomUtil.create('div', 'maplair-control-rotate maplair-bar'),
		button = this._button = DomUtil.create('button', 'maplair-control-rotate-button', container),
		title = I18n.translate('Reset north');
		button.type = 'button';
		button.title = title;
		button.setAttribute('aria-label', title);
		button.innerHTML = compass;

		DomEvent.disableClickPropagation(button);
		DomEvent.on(button, 'click', DomEvent.stop);
		DomEvent.on(button, 'click', this._resetNorth, this);
		DomEvent.on(button, 'click', this._refocusOnMap, this);

		this._update();
		map.on('rotate', this._update, this);

		return container;
	}

	onRemove(map) {
		map.off('rotate', this._update, this);
	}

	_resetNorth(e) {
		this._map._setUserEvent(e);
		this._map.setBearing(0, {animate: true});
	}

	_update() {
		// the needle points north
		this._button.firstChild.style.transform = `rotate(${-this._map.getBearing()}deg)`;
	}

	// Registers this default feature on the map class, called by `MaplairMap` itself.
	static register(MaplairMap) {
		// @namespace MaplairMap
		// @section Control options
		// @option rotateControl: Boolean = false
		// Whether a [rotate control](#rotatecontrol) is added to the map by default.
		MaplairMap.mergeOptions({
			rotateControl: false
		});

		MaplairMap.addInitHook(function () {
			if (this.options.rotateControl) {
				// @section Controls
				// @property rotateControl: RotateControl
				// The default rotate control (only available if the
				// [`rotateControl` option](#map-rotatecontrol) was `true` when creating the map).
				this.rotateControl = new RotateControl();
				this.addControl(this.rotateControl);
			}
		});
	}
}
