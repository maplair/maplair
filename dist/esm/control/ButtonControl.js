import { disableClickPropagation, on, stop } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
//#region src/control/ButtonControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
* A state of a `ButtonControl`, see its `states` option.
* @typedef {object} ButtonControlState
* @property {string} name The name of the state, see `setState()`.
* @property {string|HTMLElement} [content] The content of the button in this state.
* @property {string} [title] The title of the button in this state.
* @property {(this: ButtonControl, e: MouseEvent, button: ButtonControl, map: MaplairMap) => void} [onClick]
* Called when clicking the button in this state.
*/
/**
* Options of `ButtonControl`.
* @typedef {object} ButtonControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string|HTMLElement} [content=''] The content of the button: HTML (e.g. an
* icon or a character) or an element. String content is rendered as HTML; do not pass
* untrusted input.
* @property {string} [title=''] The title (tooltip) and accessible name of the button.
* @property {(this: ButtonControl, e: MouseEvent, button: ButtonControl, map: MaplairMap) => void} [onClick]
* Called with the click event, the `ButtonControl` and the map when clicking the button.
* @property {ButtonControlState[]} [states] Alternative states of the button, each an
* object with `name` and with `content`, `title` and `onClick` like the options. The
* first state is the initial one, `setState()` switches them.
* @property {string} [className=''] A custom CSS class name to assign to the button.
* @property {string} [accessKey=''] A key to activate the button with the browser's
* [access key](https://developer.mozilla.org/docs/Web/HTML/Reference/Global_attributes/accesskey)
* modifiers (e.g. Alt+Shift+K), shown in the title.
* @extends ControlOptions
*/
/**
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
var ButtonControl = class ButtonControl extends Control {
	static defaultOptions = {
		position: "topleft",
		content: "",
		title: "",
		onClick: void 0,
		states: void 0,
		className: "",
		accessKey: ""
	};
	/**
	* Creates a button control.
	* @param {...ButtonControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this._state = this.options.states?.[0];
		this.callInitHooks(ButtonControl);
	}
	/**
	* @internal
	* @returns {HTMLElement}
	*/
	onAdd() {
		const container = create("div", "maplair-bar maplair-control-button");
		this._createButton(container);
		return container;
	}
	_createButton(container) {
		const button = this._button = create("button", `maplair-control-button-button ${this.options.className}`, container);
		button.type = "button";
		button.accessKey = this.options.accessKey;
		disableClickPropagation(button);
		on(button, "click", stop);
		on(button, "click", this._onClick, this);
		on(button, "click", this._refocusOnMap, this);
		this._update();
		return button;
	}
	_onClick(e) {
		if (this._disabled) return;
		(this._state ?? this.options).onClick?.call(this, e, this, this._map);
	}
	_update() {
		if (!this._button) return;
		const { content, title } = this._state ?? this.options, button = this._button;
		if (typeof content === "string") button.innerHTML = content;
		else button.replaceChildren(content);
		const key = button.accessKeyLabel || this.options.accessKey.toUpperCase();
		button.title = [title, key && `[${key}]`].filter(Boolean).join(" ");
		button.setAttribute("aria-label", title ?? "");
		if (this._state) button.dataset.state = this._state.name;
		button.classList.toggle("maplair-disabled", !!this._disabled);
		button.setAttribute("aria-disabled", !!this._disabled);
	}
	/**
	* Switches to the state with the given `name`, see the `states` option.
	* @param {string} name
	* @returns {this}
	*/
	setState(name) {
		const state = this.options.states?.find((s) => s.name === name);
		if (!state) throw new Error(`Unknown button state "${name}".`);
		this._state = state;
		this._update();
		return this;
	}
	/**
	* Returns the name of the current state, see the `states` option.
	* @returns {string|undefined}
	*/
	getState() {
		return this._state?.name;
	}
	/**
	* Disables the button, so that clicking it does nothing.
	* @returns {this}
	*/
	disable() {
		this._disabled = true;
		this._update();
		return this;
	}
	/**
	* Enables the button again.
	* @returns {this}
	*/
	enable() {
		this._disabled = false;
		this._update();
		return this;
	}
	/**
	* Returns the button element.
	* @returns {HTMLElement}
	*/
	getButton() {
		return this._button;
	}
};
/**
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
var ButtonBarControl = class ButtonBarControl extends Control {
	/**
	* Creates a bar with the given buttons.
	* @param {ButtonControl[]} buttons
	* @param {ControlOptions} [options]
	*/
	constructor(buttons, options) {
		super(options);
		this._buttons = buttons;
		this.callInitHooks(ButtonBarControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-bar maplair-control-button-bar");
		for (const button of this._buttons) {
			button._map = map;
			button._createButton(container);
		}
		return container;
	}
	/** @internal */
	onRemove() {
		for (const button of this._buttons) button._map = null;
	}
	/**
	* Returns the buttons of the bar.
	* @returns {ButtonControl[]}
	*/
	getButtons() {
		return this._buttons;
	}
};
//#endregion
export { ButtonBarControl, ButtonControl };

//# sourceMappingURL=ButtonControl.js.map