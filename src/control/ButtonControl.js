import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';

/*
 * @class ButtonControl
 * @inherits Control
 *
 * A control with a button, styled like the zoom control, calling a function when
 * clicked. It can have several states with their own content, title and function,
 * e.g. to toggle something. Several buttons can be grouped with `ButtonBarControl`.
 *
 * Inspired by the [Leaflet.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton) plugin.
 *
 * @example
 * ```js
 * new ButtonControl({
 * 	content: '⌂',
 * 	title: 'Home',
 * 	onClick: (e, button, map) => map.setView([47.27, 11.40], 13)
 * }).addTo(map);
 *
 * new ButtonControl({
 * 	states: [{
 * 		name: 'show',
 * 		content: '👁',
 * 		title: 'Show the markers',
 * 		onClick(e, button, map) { markers.addTo(map); button.setState('hide'); }
 * 	}, {
 * 		name: 'hide',
 * 		content: '🙈',
 * 		title: 'Hide the markers',
 * 		onClick(e, button) { markers.remove(); button.setState('show'); }
 * 	}]
 * }).addTo(map);
 * ```
 */

// @namespace ButtonControl
// @constructor ButtonControl(options: ButtonControl options)
// Creates a button control.
export class ButtonControl extends Control {

	static {
		// @section
		// @aka ButtonControl options
		this.setDefaultOptions({
			// @option position: String = 'topleft'
			// The position of the control (one of the map corners). Possible values are `'topleft'`,
			// `'topright'`, `'bottomleft'` or `'bottomright'`
			position: 'topleft',

			// @option content: String|HTMLElement = ''
			// The content of the button: HTML (e.g. an icon or a character) or an element.
			// String content is rendered as HTML; do not pass untrusted input.
			content: '',

			// @option title: String = ''
			// The title (tooltip) and accessible name of the button.
			title: '',

			// @option onClick: Function = undefined
			// Called with the click event, the `ButtonControl` and the map when clicking the button.
			onClick: undefined,

			// @option states: Object[] = undefined
			// Alternative states of the button, each an object with `name` and with
			// `content`, `title` and `onClick` like the options. The first state is the
			// initial one, `setState()` switches them.
			states: undefined,

			// @option className: String = ''
			// A custom CSS class name to assign to the button.
			className: '',

			// @option accessKey: String = ''
			// A key to activate the button with the browser's
			// [access key](https://developer.mozilla.org/docs/Web/HTML/Reference/Global_attributes/accesskey)
			// modifiers (e.g. Alt+Shift+K), shown in the title.
			accessKey: ''
		});
	}

	constructor(...args) {
		super(...args);
		this._state = this.options.states?.[0];
		this.callInitHooks(ButtonControl);
	}

	onAdd() {
		const container = DomUtil.create('div', 'maplair-bar maplair-control-button');
		this._createButton(container);
		return container;
	}

	// Creates the button element in `container`, see `ButtonBarControl`
	_createButton(container) {
		const button = this._button = DomUtil.create('button', `maplair-control-button-button ${this.options.className}`, container);
		button.type = 'button';
		button.accessKey = this.options.accessKey;

		DomEvent.disableClickPropagation(button);
		DomEvent.on(button, 'click', DomEvent.stop);
		DomEvent.on(button, 'click', this._onClick, this);
		DomEvent.on(button, 'click', this._refocusOnMap, this);

		this._update();
		return button;
	}

	_onClick(e) {
		if (this._disabled) { return; }
		(this._state ?? this.options).onClick?.call(this, e, this, this._map);
	}

	_update() {
		if (!this._button) { return; }
		const {content, title} = this._state ?? this.options,
		button = this._button;

		if (typeof content === 'string') {
			button.innerHTML = content;
		} else {
			button.replaceChildren(content);
		}
		const key = button.accessKeyLabel || this.options.accessKey.toUpperCase();
		button.title = [title, key && `[${key}]`].filter(Boolean).join(' ');
		button.setAttribute('aria-label', title ?? '');
		if (this._state) {
			button.dataset.state = this._state.name;
		}
		button.classList.toggle('maplair-disabled', !!this._disabled);
		button.setAttribute('aria-disabled', !!this._disabled);
	}

	// @method setState(name: String): this
	// Switches to the state with the given `name`, see the `states` option.
	setState(name) {
		const state = this.options.states?.find(s => s.name === name);
		if (!state) {
			throw new Error(`Unknown button state "${name}".`);
		}
		this._state = state;
		this._update();
		return this;
	}

	// @method getState(): String
	// Returns the name of the current state, see the `states` option.
	getState() {
		return this._state?.name;
	}

	// @method disable(): this
	// Disables the button, so that clicking it does nothing.
	disable() {
		this._disabled = true;
		this._update();
		return this;
	}

	// @method enable(): this
	// Enables the button again.
	enable() {
		this._disabled = false;
		this._update();
		return this;
	}

	// @method getButton(): HTMLElement
	// Returns the button element.
	getButton() {
		return this._button;
	}
}

/*
 * @class ButtonBarControl
 * @inherits Control
 *
 * Groups several `ButtonControl`s in one bar, like the buttons of the zoom control.
 *
 * Inspired by the [Leaflet.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton) plugin.
 *
 * @example
 * ```js
 * new ButtonBarControl([
 * 	new ButtonControl({content: 'A', title: 'First', onClick: () => {}}),
 * 	new ButtonControl({content: 'B', title: 'Second', onClick: () => {}})
 * ]).addTo(map);
 * ```
 */

// @namespace ButtonBarControl
// @constructor ButtonBarControl(buttons: ButtonControl[], options?: Control options)
// Creates a bar with the given buttons.
export class ButtonBarControl extends Control {
	constructor(buttons, options) {
		super(options);
		this._buttons = buttons;
		this.callInitHooks(ButtonBarControl);
	}

	onAdd(map) {
		const container = DomUtil.create('div', 'maplair-bar maplair-control-button-bar');
		for (const button of this._buttons) {
			button._map = map;
			button._createButton(container);
		}
		return container;
	}

	onRemove() {
		for (const button of this._buttons) {
			button._map = null;
		}
	}

	// @method getButtons(): ButtonControl[]
	// Returns the buttons of the bar.
	getButtons() {
		return this._buttons;
	}
}
