import type { ControlOptions } from './Control.js';
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
export class TextControl extends Control {
    static defaultOptions: Partial<TextControlOptions>;
    /**
     * Creates a text control.
     * @param {...TextControlOptions} args The options.
     */
    constructor(options?: TextControlOptions);
    /**
     * Changes the [content](#textcontrol-content) of the control.
     * @param {string|HTMLElement} content
     * @returns {this}
     */
    setContent(content: string | HTMLElement): this;
    /**
     * Returns the content of the control.
     * @returns {string|HTMLElement}
     */
    getContent(): string | HTMLElement;
    /** The options of the TextControl, see [the options](#textcontroloptions). */
    options: TextControlOptions;
}
/**
 * Options of `TextControl`.
 */
export interface TextControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topright'
     */
    position?: string;
    /**
     * The content of the control: HTML or an
     * element. String content is rendered as HTML; do not pass untrusted input.
     * @default ''
     */
    content?: string|HTMLElement;
    /**
     * A custom CSS class name to assign to the control.
     * @default ''
     */
    className?: string;
}
import { Control } from './Control.js';
