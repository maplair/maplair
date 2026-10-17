import {Class} from '../core/Class.js';
import * as Util from '../core/Util.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {Layer} from '../layer/Layer.js';

/*
 * @class ContextMenu
 * @inherits Class
 *
 * A menu opened with the `contextmenu` event (right click, or long tap on touch
 * screens) on the map or on a layer. Each item calls a function with the location
 * of the event. The menu is a [popover](https://developer.mozilla.org/docs/Web/API/Popover_API),
 * closed by clicking outside of it or pressing Escape, and can be used with the
 * keyboard (arrow keys, Enter).
 *
 * Inspired by the [Leaflet.contextmenu](https://github.com/aratcliffe/Leaflet.contextmenu) plugin.
 *
 * @example
 * ```js
 * new ContextMenu([
 * 	{text: 'Center the map here', callback: e => map.panTo(e.latlng)},
 * 	'-',
 * 	{text: 'Zoom in', callback: () => map.zoomIn()}
 * ]).addTo(map);
 *
 * new ContextMenu([
 * 	{text: 'Remove', callback: e => e.relatedTarget.remove()}
 * ]).addTo(marker);
 * ```
 */

// @namespace ContextMenu
// @constructor ContextMenu(items: Object[], options?: ContextMenu options)
// Creates a context menu. Each item is an object with `text`, `callback` and the
// optional `disabled`, or `'-'` for a separator. The `callback` gets an event with
// `latlng`, `containerPoint`, `layerPoint`, `originalEvent` and `relatedTarget`
// (the layer, for menus of layers).
export class ContextMenu extends Class {

	static {
		// @section
		// @aka ContextMenu options
		this.setDefaultOptions({
			// @option className: String = ''
			// A custom CSS class name to assign to the menu.
			className: ''
		});
	}

	constructor(items, options) {
		super();
		Util.setOptions(this, options);
		this._items = items;
		this.callInitHooks(ContextMenu);
	}

	// @method addTo(target: MaplairMap|Layer): this
	// Opens the menu on `contextmenu` events of the map or the layer.
	addTo(target) {
		this.remove();
		this._target = target;
		target.on('contextmenu', this._open, this);
		return this;
	}

	// @method remove(): this
	// Removes the menu from its map or layer.
	remove() {
		this.close();
		this._target?.off('contextmenu', this._open, this);
		this._target = null;
		this._container?.remove();
		this._container = null;
		return this;
	}

	// @method close(): this
	// Closes the menu.
	close() {
		if (this._container?.matches(':popover-open')) {
			this._container.hidePopover();
		}
		return this;
	}

	// @method isOpen(): Boolean
	// Returns `true` if the menu is open.
	isOpen() {
		return !!this._container?.matches(':popover-open');
	}

	_open(e) {
		// a menu of a layer replaces the one of the map
		DomEvent.stop(e);
		const map = this._target instanceof Layer ? this._target._map : this._target;
		if (!map) { return; }

		this._map = map;
		this._event = {
			latlng: e.latlng,
			containerPoint: e.containerPoint,
			layerPoint: e.layerPoint,
			originalEvent: e.originalEvent,
			relatedTarget: this._target instanceof Layer ? this._target : undefined
		};

		const container = this._createMenu(map._container);
		if (!container.matches(':popover-open')) {
			container.showPopover();
		}
		this._position(e.originalEvent);
		container.querySelector('button:not([disabled])')?.focus({preventScroll: true});
		map.once('movestart', this.close, this);
	}

	_createMenu(parent) {
		const container = this._container ??= DomUtil.create('div', `maplair-contextmenu ${this.options.className}`);
		if (container.parentNode !== parent) {
			parent.appendChild(container);
		}
		container.popover = 'auto';
		container.setAttribute('role', 'menu');
		container.replaceChildren();

		for (const item of this._items) {
			if (item === '-') {
				DomUtil.create('div', 'maplair-contextmenu-separator', container).setAttribute('role', 'separator');
				continue;
			}
			const button = DomUtil.create('button', 'maplair-contextmenu-item', container);
			button.type = 'button';
			button.setAttribute('role', 'menuitem');
			button.textContent = item.text;
			button.disabled = !!item.disabled;
			DomEvent.on(button, 'click', (ev) => {
				DomEvent.stop(ev);
				this.close();
				item.callback?.call(this, this._event);
			});
		}

		DomEvent.on(container, 'keydown', this._onKeyDown, this);
		DomEvent.disableClickPropagation(container);
		DomEvent.disableScrollPropagation(container);
		DomEvent.on(container, 'contextmenu', DomEvent.stop);
		return container;
	}

	// At the pointer, within the viewport
	_position(e) {
		const container = this._container,
		viewport = document.documentElement,
		x = Math.min(e.clientX, viewport.clientWidth - container.offsetWidth),
		y = Math.min(e.clientY, viewport.clientHeight - container.offsetHeight);
		container.style.left = `${Math.max(0, x)}px`;
		container.style.top = `${Math.max(0, y)}px`;
	}

	_onKeyDown(e) {
		if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') { return; }
		DomEvent.stop(e);
		const buttons = [...this._container.querySelectorAll('button:not([disabled])')],
		index = buttons.indexOf(document.activeElement),
		next = e.key === 'ArrowDown' ? index + 1 : index - 1;
		buttons.at(next % buttons.length)?.focus();
	}
}
