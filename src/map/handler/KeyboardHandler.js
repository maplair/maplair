import {Handler} from '../../core/Handler.js';
import {on, off, stop, disableClickPropagation, disableScrollPropagation} from '../../dom/DomEvent.js';
import * as DomUtil from '../../dom/DomUtil.js';
import {Point} from '../../geometry/Point.js';
import {I18n} from '../../core/I18n.js';
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */

/**
 * Map options of `KeyboardHandler`, the keyboard navigation options.
 * @typedef {object} KeyboardHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [keyboard=true] Makes the map focusable and allows users to
 * navigate the map with keyboard arrows and `+`/`-` keys.
 * @property {number} [keyboardPanDelta=80] Amount of pixels to pan when pressing an
 * arrow key.
 */

/**
 * Handler of `MaplairMap` for keyboard navigation.
 * @typedef {object} KeyboardHandlerMapProperties
 * @lends MaplairMap
 * @property {KeyboardHandler} keyboard Keyboard navigation handler.
 */

/**
 * Handles keyboard interaction with the map, enabled by default, see the map option
 * `keyboard`. The `?` key shows a list of the keyboard shortcuts.
 *
 * @fires MaplairMap#focus {MaplairEvent} Fired when the map gains focus.
 * @fires MaplairMap#blur {MaplairEvent} Fired when the map loses focus.
 */
export class KeyboardHandler extends Handler {

	/**
	 * The [codes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
	 * of the keys for panning and zooming the map.
	 * @type {Record<'left'|'right'|'down'|'up'|'zoomIn'|'zoomOut', string[]>}
	 */
	static keyCodes = {
		left: ['ArrowLeft'],
		right: ['ArrowRight'],
		down: ['ArrowDown'],
		up: ['ArrowUp'],
		zoomIn: ['Equal', 'NumpadAdd', 'BracketRight'],
		zoomOut: ['Minus', 'NumpadSubtract', 'Digit6', 'Slash']
	};

	/**
	 * @param {MaplairMap} map
	 */
	constructor(map) {
		super(map);

		this._setPanDelta(map.options.keyboardPanDelta);
		this._setZoomDelta(map.options.zoomDelta);

		this.callInitHooks(KeyboardHandler);
	}

	/**
	 * Called when the handler is enabled, adds the event hooks.
	 */
	addHooks() {
		const container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex <= 0) {
			container.tabIndex = '0';
		}

		// add aria-attribute for keyboard shortcuts to the container
		container.ariaKeyShortcuts = Object.values(KeyboardHandler.keyCodes).flat().join(' ');

		on(container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown
		}, this);

		this._map.on({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);
	}

	/**
	 * Called when the handler is disabled, removes the event hooks.
	 */
	removeHooks() {
		this._removeHooks();

		off(this._map._container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown
		}, this);

		this._map.off({
			focus: this._addHooks,
			blur: this._removeHooks
		}, this);

		this._help?.remove();
		this._help = null;
	}

	// Shows or hides a list of the keyboard shortcuts (on the `?` key), as popover
	// closed by pressing `Escape` or clicking outside of it.
	_toggleHelp() {
		this._help ??= this._createHelp();
		this._help.togglePopover();
	}

	_createHelp() {
		const help = DomUtil.create('div', 'maplair-keyboard-help', this._map._container),
		title = I18n.translate('Keyboard shortcuts');
		help.popover = 'auto';
		help.setAttribute('role', 'dialog');
		help.setAttribute('aria-label', title);

		DomUtil.create('h2', '', help).textContent = title;
		const list = DomUtil.create('dl', '', help);
		for (const [keys, description] of [
			[['←', '→', '↑', '↓'], I18n.translate('Pan the map')],
			[['+'], I18n.translate('Zoom in')],
			[['−'], I18n.translate('Zoom out')],
			[['Shift'], I18n.translate('Pan or zoom further, together with the keys above')],
			[['Esc'], I18n.translate('Close popup')],
			[['?'], I18n.translate('Show or hide the keyboard shortcuts')]
		]) {
			const row = DomUtil.create('div', '', list),
			dt = DomUtil.create('dt', '', row);
			for (const key of keys) {
				DomUtil.create('kbd', '', dt).textContent = key;
			}
			DomUtil.create('dd', '', row).textContent = description;
		}

		disableClickPropagation(help);
		disableScrollPropagation(help);
		return help;
	}

	//  acquire/lose focus #594, #1228, #1540
	_onPointerDown() {
		if (this._focused) { return; }

		const body = document.body,
		docEl = document.documentElement,
		top = body.scrollTop || docEl.scrollTop,
		left = body.scrollLeft || docEl.scrollLeft;

		this._map._container.focus();

		window.scrollTo(left, top);
	}

	_onFocus() {
		this._focused = true;
		this._map.fire('focus');
	}

	_onBlur() {
		this._focused = false;
		this._map.fire('blur');
	}

	_setPanDelta(panDelta) {
		const keys = this._panKeys = {},
		codes = KeyboardHandler.keyCodes;

		for (const code of codes.left) {
			keys[code] = [-1 * panDelta, 0];
		}
		for (const code of codes.right) {
			keys[code] = [panDelta, 0];
		}
		for (const code of codes.down) {
			keys[code] = [0, panDelta];
		}
		for (const code of codes.up) {
			keys[code] = [0, -1 * panDelta];
		}
	}

	_setZoomDelta(zoomDelta) {
		const keys = this._zoomKeys = {},
		codes = KeyboardHandler.keyCodes;

		for (const code of codes.zoomIn) {
			keys[code] = zoomDelta;
		}
		for (const code of codes.zoomOut) {
			keys[code] = -zoomDelta;
		}
	}

	_addHooks() {
		on(document, 'keydown', this._onKeyDown, this);
	}

	_removeHooks() {
		off(document, 'keydown', this._onKeyDown, this);
	}

	_onKeyDown(e) {
		if (e.altKey || e.ctrlKey || e.metaKey) { return; }

		if (e.key === '?') {
			this._toggleHelp();
			stop(e);
			return;
		}

		const key = e.code,
		map = this._map;
		let offset;

		if (key in this._panKeys) {
			if (!map._panAnim || !map._panAnim._inProgress) {
				offset = this._panKeys[key];
				if (e.shiftKey) {
					offset = Point.from(offset).multiplyBy(3);
				}

				if (map.options.maxBounds) {
					offset = map._limitOffset(Point.from(offset), map.options.maxBounds);
				}

				map._setUserEvent(e);
				if (map.options.worldCopyJump) {
					const newLatLng = map.wrapLatLng(map.unproject(map.project(map.getCenter()).add(offset)));
					map.panTo(newLatLng);
				} else {
					map.panBy(offset);
				}
			}
		} else if (key in this._zoomKeys) {
			map._setUserEvent(e);
			map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);

		} else if (key === 'Escape' && map._popup && map._popup.options.closeOnEscapeKey) {
			map.closePopup();

		} else {
			return;
		}

		stop(e);
	}

	/**
	 * Registers this default feature on the map class, called by `MaplairMap` itself.
	 * @internal
	 * @param {typeof MaplairMap} MaplairMap
	 */
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			keyboard: true,
			keyboardPanDelta: 80
		});

		MaplairMap.addInitHook('addHandler', 'keyboard', KeyboardHandler);
	}
}
