import type { Point } from '../../geometry/Point.js';
import type { IconOptions } from './Icon.js';
/** @import {IconOptions} from './Icon.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/**
 * Options of `DivIcon`.
 * @typedef {object} DivIconOptions
 * @property {PointExpression|number} [iconSize=[12, 12]] Size of the icon in pixels,
 * also can be set through CSS.
 * @property {string|HTMLElement|false} [html=false] Custom HTML code to put inside the
 * div element, empty by default. Alternatively, an instance of `HTMLElement`.
 * @property {PointExpression|null} [bgPos=null] Optional relative position of the
 * background, in pixels.
 * @property {string} [className='maplair-div-icon']
 * @extends IconOptions
 */
/**
 * Represents a lightweight icon for markers that uses a simple `<div>`
 * element instead of an image. Inherits from `Icon` but ignores the `iconUrl` and
 * shadow options.
 *
 * By default, it has a 'maplair-div-icon' CSS class and is styled as a little white
 * square with a shadow.
 *
 * @example
 * ```js
 * const myIcon = new DivIcon({className: 'my-div-icon'});
 * // you can set .my-div-icon styles in CSS
 *
 * new Marker([50.505, 30.57], {icon: myIcon}).addTo(map);
 * ```
 */
export class DivIcon extends Icon {
    /**
     * Creates a `DivIcon` instance with the given options.
     * @param {[options?: DivIconOptions]} args The options.
     */
    constructor(options?: DivIconOptions | undefined);
    /**
     * Returns `null`, a `DivIcon` has no shadow.
     * @returns {null}
     */
    createShadow(): null;
    /** The options of the DivIcon, see [the options](#diviconoptions). */
    options: DivIconOptions;
}
/**
 * Options of `DivIcon`.
 */
export interface DivIconOptions extends IconOptions {
    /**
     * Size of the icon in pixels,
     * also can be set through CSS.
     * @default [12, 12]
     */
    iconSize?: PointExpression|number;
    /**
     * Custom HTML code to put inside the
     * div element, empty by default. Alternatively, an instance of `HTMLElement`.
     * @default false
     */
    html?: string|HTMLElement|false;
    /**
     * Optional relative position of the
     * background, in pixels.
     * @default null
     */
    bgPos?: PointExpression|null;
    /**
     * @default 'maplair-div-icon'
     */
    className?: string;
}
import { Icon } from './Icon.js';
import type { PointExpression } from '../../geometry/Point.js';
