import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';

/*
 * @class TextControl
 * @inherits Control
 *
 * A control showing a text or any content in a box, e.g. a title, a note on the
 * data or a status. It is hidden while its content is empty.
 *
 * @example
 * ```js
 * const status = new TextControl({position: 'topright', content: 'Loading…'}).addTo(map);
 * status.setContent(`Updated at ${new Date().toLocaleTimeString()}`);
 * ```
 */

// @namespace TextControl
// @constructor TextControl(options: TextControl options)
// Creates a text control.
export class TextControl extends Control {

	static {
		// @section
		// @aka TextControl options
		this.setDefaultOptions({
			// @option position: String = 'topright'
			// The position of the control (one of the map corners). Possible values are `'topleft'`,
			// `'topright'`, `'bottomleft'` or `'bottomright'`
			position: 'topright',

			// @option content: String|HTMLElement = ''
			// The content of the control: HTML or an element. String content is rendered as
			// HTML; do not pass untrusted input.
			content: '',

			// @option className: String = ''
			// A custom CSS class name to assign to the control.
			className: ''
		});
	}

	constructor(...args) {
		super(...args);
		this.callInitHooks(TextControl);
	}

	onAdd() {
		const container = DomUtil.create('div', `maplair-control-text ${this.options.className}`);
		DomEvent.disableClickPropagation(container);
		DomEvent.disableScrollPropagation(container);
		this._container = container;
		this._update();
		return container;
	}

	// @method setContent(content: String|HTMLElement): this
	// Changes the [content](#textcontrol-content) of the control.
	setContent(content) {
		this.options.content = content;
		this._update();
		return this;
	}

	// @method getContent(): String|HTMLElement
	// Returns the content of the control.
	getContent() {
		return this.options.content;
	}

	_update() {
		const container = this._container,
		{content} = this.options;
		if (!container) { return; }

		if (typeof content === 'string') {
			container.innerHTML = content;
		} else {
			container.replaceChildren(content ?? '');
		}
		container.hidden = !content;
	}
}
