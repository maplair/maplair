import { disableClickPropagation, disableScrollPropagation } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
//#region src/control/TextControl.js
/** @import {ControlOptions} from './Control.js' */
/**
* Options of `TextControl`.
* @typedef {object} TextControlOptions
* @property {string} [position='topright'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string|HTMLElement} [content=''] The content of the control: HTML or an
* element. String content is rendered as HTML; do not pass untrusted input.
* @property {string} [className=''] A custom CSS class name to assign to the control.
* @extends ControlOptions
*/
/**
* A control showing a text or any content in a box, e.g. a title, a note on the
* data or a status. It is hidden while its content is empty.
*
* @example
* ```js
* const status = new TextControl({position: 'topright', content: 'Loading…'}).addTo(map);
* status.setContent(`Updated at ${new Date().toLocaleTimeString()}`);
* ```
*/
var TextControl = class TextControl extends Control {
	static defaultOptions = {
		position: "topright",
		content: "",
		className: ""
	};
	/**
	* Creates a text control.
	* @param {...TextControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(TextControl);
	}
	/**
	* @internal
	* @returns {HTMLElement}
	*/
	onAdd() {
		const container = create("div", `maplair-control-text ${this.options.className}`);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		this._container = container;
		this._update();
		return container;
	}
	/**
	* Changes the [content](#textcontrol-content) of the control.
	* @param {string|HTMLElement} content
	* @returns {this}
	*/
	setContent(content) {
		this.options.content = content;
		this._update();
		return this;
	}
	/**
	* Returns the content of the control.
	* @returns {string|HTMLElement}
	*/
	getContent() {
		return this.options.content;
	}
	_update() {
		const container = this._container, { content } = this.options;
		if (!container) return;
		if (typeof content === "string") container.innerHTML = content;
		else container.replaceChildren(content ?? "");
		container.hidden = !content;
	}
};
//#endregion
export { TextControl };

//# sourceMappingURL=TextControl.js.map