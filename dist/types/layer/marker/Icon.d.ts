import type { setOptions } from '../../core/Util.js';
import type { Point } from '../../geometry/Point.js';
/** @import {PointExpression} from '../../geometry/Point.js' */
/**
 * Options of `Icon`.
 * @typedef {object} IconOptions
 * @property {string} [iconUrl] **(required)** The URL to the icon image (absolute or
 * relative to your script path).
 * @property {string} [iconRetinaUrl] The URL to a retina sized version of the icon
 * image (absolute or relative to your script path). Used for Retina screen devices.
 * @property {PointExpression|number} [iconSize] Size of the icon image in pixels (a
 * number for square icons).
 * @property {PointExpression} [iconAnchor] The coordinates of the "tip" of the icon
 * (relative to its top left corner). The icon will be aligned so that this point is at
 * the marker's geographical location. Centered by default if size is specified, also
 * can be set in CSS with negative margins.
 * @property {PointExpression} [popupAnchor=[0, 0]] The coordinates of the point from
 * which popups will "open", relative to the icon anchor.
 * @property {PointExpression} [tooltipAnchor=[0, 0]] The coordinates of the point from
 * which tooltips will "open", relative to the icon anchor.
 * @property {string} [shadowUrl] The URL to the icon shadow image. If not specified, no
 * shadow image will be created.
 * @property {string} [shadowRetinaUrl] The URL to a retina sized version of the shadow
 * image. Used for Retina screen devices.
 * @property {PointExpression|number} [shadowSize] Size of the shadow image in pixels.
 * @property {PointExpression} [shadowAnchor] The coordinates of the "tip" of the shadow
 * (relative to its top left corner) (the same as iconAnchor if not specified).
 * @property {string} [className] A custom class name to assign to both icon and shadow
 * images. Empty by default.
 * @property {boolean|string} [crossOrigin=false] Whether the crossOrigin attribute will
 * be added to the icon images. If a String is provided, all images will have their
 * crossOrigin attribute set to the String provided. This is needed if you want to
 * access image pixel data. Refer to
 * [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
 * for valid String values.
 */
/**
 * Represents an icon to provide when creating a marker.
 *
 * `DefaultIcon` extends `Icon` and is the blue icon Maplair uses for markers by default.
 *
 * @example
 * ```js
 * const myIcon = new Icon({
 *     iconUrl: 'my-icon.png',
 *     iconRetinaUrl: 'my-icon@2x.png',
 *     iconSize: [38, 95],
 *     iconAnchor: [22, 94],
 *     popupAnchor: [-3, -76],
 *     shadowUrl: 'my-icon-shadow.png',
 *     shadowRetinaUrl: 'my-icon-shadow@2x.png',
 *     shadowSize: [68, 95],
 *     shadowAnchor: [22, 94]
 * });
 *
 * new Marker([50.505, 30.57], {icon: myIcon}).addTo(map);
 * ```
 */
export class Icon extends Class {
    static defaultOptions: Partial<IconOptions>;
    /**
     * Creates an icon instance with the given options.
     * @param {IconOptions} [options]
     */
    constructor(options?: IconOptions);
    /**
     * Called internally when the icon has to be shown, returns a `<img>` HTML element
     * styled according to the options.
     * @param {HTMLElement} [oldIcon] The current element of the icon, to be reused if possible.
     * @returns {HTMLElement}
     */
    createIcon(oldIcon?: HTMLElement): HTMLElement;
    /**
     * As `createIcon`, but for the shadow beneath it. Returns `null` without a shadow.
     * @param {HTMLElement} [oldIcon] The current element of the shadow, to be reused if possible.
     * @returns {HTMLElement|null}
     */
    createShadow(oldIcon?: HTMLElement): HTMLElement | null;
    /** The options of the Icon, see [the options](#iconoptions). */
    options: IconOptions;
}
/**
 * Options of `Icon`.
 */
export interface IconOptions {
    /**
     * **(required)** The URL to the icon image (absolute or
     * relative to your script path).
     */
    iconUrl?: string;
    /**
     * The URL to a retina sized version of the icon
     * image (absolute or relative to your script path). Used for Retina screen devices.
     */
    iconRetinaUrl?: string;
    /**
     * Size of the icon image in pixels (a
     * number for square icons).
     */
    iconSize?: PointExpression|number;
    /**
     * The coordinates of the "tip" of the icon
     * (relative to its top left corner). The icon will be aligned so that this point is at
     * the marker's geographical location. Centered by default if size is specified, also
     * can be set in CSS with negative margins.
     */
    iconAnchor?: PointExpression;
    /**
     * The coordinates of the point from
     * which popups will "open", relative to the icon anchor.
     * @default [0, 0]
     */
    popupAnchor?: PointExpression;
    /**
     * The coordinates of the point from
     * which tooltips will "open", relative to the icon anchor.
     * @default [0, 0]
     */
    tooltipAnchor?: PointExpression;
    /**
     * The URL to the icon shadow image. If not specified, no
     * shadow image will be created.
     */
    shadowUrl?: string;
    /**
     * The URL to a retina sized version of the shadow
     * image. Used for Retina screen devices.
     */
    shadowRetinaUrl?: string;
    /**
     * Size of the shadow image in pixels.
     */
    shadowSize?: PointExpression|number;
    /**
     * The coordinates of the "tip" of the shadow
     * (relative to its top left corner) (the same as iconAnchor if not specified).
     */
    shadowAnchor?: PointExpression;
    /**
     * A custom class name to assign to both icon and shadow
     * images. Empty by default.
     */
    className?: string;
    /**
     * Whether the crossOrigin attribute will
     * be added to the icon images. If a String is provided, all images will have their
     * crossOrigin attribute set to the String provided. This is needed if you want to
     * access image pixel data. Refer to
     * [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
     * for valid String values.
     * @default false
     */
    crossOrigin?: boolean|string;
}
import { Class } from '../../core/Class.js';
import type { PointExpression } from '../../geometry/Point.js';
