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
 * @property {boolean|string} [ariaKeyShortcuts=false] Sets the `aria-keyshortcuts`
 * attribute of the map container. ARIA names keys by what they type on a given layout,
 * so `true` uses the names for a US English layout, which can be wrong for pages in
 * other languages; pass a string to set the value for your audience's layout instead.
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
	 * The [values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
	 * of the keys for panning and zooming the map, so zoom keys follow the keyboard
	 * layout and cover the numpad too; `=` and `_` keep the US `+` and `-` keys working
	 * both with and without Shift.
	 * @type {Record<'left'|'right'|'down'|'up'|'zoomIn'|'zoomOut', string[]>}
	 */
	static keys = {
		left: ['ArrowLeft'],
		right: ['ArrowRight'],
		down: ['ArrowDown'],
		up: ['ArrowUp'],
		zoomIn: ['+', '='],
		zoomOut: ['-', '_']
	};

	/**
	 * @param {MaplairMap} map
	 */
	constructor(map) {
		super(map);
		this.callInitHooks(KeyboardHandler);
	}

	/**
	 * Called when the handler is enabled, adds the event hooks.
	 */
	addHooks() {
		const container = this._map._container;

		// make the container focusable by tabbing
		if (container.tabIndex <= 0) {
			container.tabIndex = 0;
		}

		const shortcuts = this._map.options.ariaKeyShortcuts;
		if (shortcuts) {
			// ARIA names physical keys by their unshifted character, so the default is for a US layout
			container.ariaKeyShortcuts = shortcuts === true ?
				'ArrowLeft ArrowRight ArrowUp ArrowDown = Plus -' : shortcuts;
		}

		on(container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown,
			keydown: this._onContainerKeyDown
		}, this);
	}

	/**
	 * Called when the handler is disabled, removes the event hooks.
	 */
	removeHooks() {
		off(document, 'keydown', this._onKeyDown, this);

		if (this._map.options.ariaKeyShortcuts) {
			this._map._container.removeAttribute('aria-keyshortcuts');
		}

		off(this._map._container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown,
			keydown: this._onContainerKeyDown
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

		// script focus matches :focus-visible by default, which would show a focus ring on every click
		this._map._container.focus({preventScroll: true, focusVisible: false});
	}

	_onFocus() {
		this._focused = true;
		on(document, 'keydown', this._onKeyDown, this);
		this._map.fire('focus');
	}

	_onBlur() {
		this._focused = false;
		off(document, 'keydown', this._onKeyDown, this);
		this._map.fire('blur');
	}

	// on the container rather than the document, so that Escape also works when focus is on a marker or
	// inside the popup, which blurs the container and removes the document listener; controls are left
	// out so that e.g. Escape in a geocoder input doesn't close an unrelated popup
	_onContainerKeyDown(e) {
		const map = this._map,
		popup = map._popup;

		if (e.key !== 'Escape' || e.defaultPrevented || !popup?.options.closeOnEscapeKey ||
			map._controlContainer?.contains(e.target)) { return; }

		const inPopup = popup._container.contains(e.target),
		icon = popup._source?._icon;

		map.closePopup();
		e.preventDefault();

		// closing removes the focused element, which would send focus back to the start of the page
		if (inPopup) { (icon?.tabIndex >= 0 ? icon : map._container).focus(); }
	}

	_onKeyDown(e) {
		if (e.altKey || e.ctrlKey || e.metaKey) { return; }

		if (e.key === '?') {
			this._toggleHelp();
			stop(e);
			return;
		}

		const key = e.key,
		map = this._map,
		{left, right, down, up, zoomIn, zoomOut} = KeyboardHandler.keys,
		x = +right.includes(key) - +left.includes(key),
		y = +down.includes(key) - +up.includes(key),
		dz = +zoomIn.includes(key) - +zoomOut.includes(key),
		k = e.shiftKey ? 3 : 1;

		if (x || y) {
			if (!map._panAnim?._inProgress) {
				let offset = new Point(x, y).multiplyBy(k * map.options.keyboardPanDelta);
				if (map.options.maxBounds) {
					offset = map._limitOffset(offset, map.options.maxBounds);
				}

				map._setUserEvent(e);
				map.panBy(offset);
			}
		} else if (dz) {
			if (!map._zoomInputBlocked()) {
				map._setUserEvent(e);
				map.setZoom(map.getZoom() + k * dz * map.options.zoomDelta);
			}

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
			keyboardPanDelta: 80,
			ariaKeyShortcuts: false
		});

		MaplairMap.addInitHook('addHandler', 'keyboard', KeyboardHandler);
	}
}
