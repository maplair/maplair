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
export class ButtonControl extends Control {
    static defaultOptions: Partial<ButtonControlOptions>;
    /**
     * Creates a button control.
     * @param {...ButtonControlOptions} args The options.
     */
    constructor(options?: ButtonControlOptions);
    /**
     * Switches to the state with the given `name`, see the `states` option.
     * @param {string} name
     * @returns {this}
     */
    setState(name: string): this;
    /**
     * Returns the name of the current state, see the `states` option.
     * @returns {string|undefined}
     */
    getState(): string | undefined;
    /**
     * Disables the button, so that clicking it does nothing.
     * @returns {this}
     */
    disable(): this;
    /**
     * Enables the button again.
     * @returns {this}
     */
    enable(): this;
    /**
     * Returns the button element.
     * @returns {HTMLElement}
     */
    getButton(): HTMLElement;
    /** The options of the ButtonControl, see [the options](#buttoncontroloptions). */
    options: ButtonControlOptions;
}
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
export class ButtonBarControl extends Control {
    /**
     * Creates a bar with the given buttons.
     * @param {ButtonControl[]} buttons
     * @param {ControlOptions} [options]
     */
    constructor(buttons: ButtonControl[], options?: ControlOptions);
    /**
     * Returns the buttons of the bar.
     * @returns {ButtonControl[]}
     */
    getButtons(): ButtonControl[];
}
/**
 * A state of a `ButtonControl`, see its `states` option.
 */
export interface ButtonControlState {
    /**
     * The name of the state, see `setState()`.
     */
    name: string;
    /**
     * The content of the button in this state.
     */
    content?: string|HTMLElement;
    /**
     * The title of the button in this state.
     */
    title?: string;
    /**
     * Called when clicking the button in this state.
     */
    onClick?: (this: ButtonControl, e: MouseEvent, button: ButtonControl, map: MaplairMap) => void;
}
/**
 * Options of `ButtonControl`.
 */
export interface ButtonControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topleft'
     */
    position?: string;
    /**
     * The content of the button: HTML (e.g. an
     * icon or a character) or an element. String content is rendered as HTML; do not pass
     * untrusted input.
     * @default ''
     */
    content?: string|HTMLElement;
    /**
     * The title (tooltip) and accessible name of the button.
     * @default ''
     */
    title?: string;
    /**
     * Called with the click event, the `ButtonControl` and the map when clicking the button.
     */
    onClick?: (this: ButtonControl, e: MouseEvent, button: ButtonControl, map: MaplairMap) => void;
    /**
     * Alternative states of the button, each an
     * object with `name` and with `content`, `title` and `onClick` like the options. The
     * first state is the initial one, `setState()` switches them.
     */
    states?: ButtonControlState[];
    /**
     * A custom CSS class name to assign to the button.
     * @default ''
     */
    className?: string;
    /**
     * A key to activate the button with the browser's
     * [access key](https://developer.mozilla.org/docs/Web/HTML/Reference/Global_attributes/accesskey)
     * modifiers (e.g. Alt+Shift+K), shown in the title.
     * @default ''
     */
    accessKey?: string;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
import type { ControlOptions } from './Control.js';
