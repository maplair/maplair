import type { IconOptions } from './Icon.js';
/** @import {IconOptions} from './Icon.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/**
 * Options of `DefaultIcon`.
 * @typedef {object} DefaultIconOptions
 * @property {string} [iconUrl] The maple leaf marker, inlined as an SVG data URI.
 * @property {string} [shadowUrl] Its shadow, inlined as an SVG data URI.
 * @property {PointExpression|number} [iconSize=[25, 41]]
 * @property {PointExpression} [iconAnchor=[12, 41]]
 * @property {PointExpression} [popupAnchor=[1, -34]]
 * @property {PointExpression} [tooltipAnchor=[16, -28]]
 * @property {PointExpression|number} [shadowSize=[41, 41]]
 * @extends IconOptions
 */
/**
 * A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
 * no icon is specified. The maple leaf marker and its shadow are inlined as SVG data
 * URIs, so they work with any bundler and need no image files.
 *
 * In order to customize the default icon, just change the properties of
 * `DefaultIcon.defaultOptions` (which is a set of `Icon options`).
 *
 * If you want to _completely_ replace the default icon, override the
 * `Marker.defaultOptions.icon` with your own icon instead.
 */
export class DefaultIcon extends Icon {
    static defaultOptions: Partial<DefaultIconOptions>;
    /**
     * Creates the default icon, optionally with changed options.
     * @param {[options?: DefaultIconOptions]} args The options.
     */
    constructor(options?: DefaultIconOptions | undefined);
    /** The options of the DefaultIcon, see [the options](#defaulticonoptions). */
    options: DefaultIconOptions;
}
/**
 * Options of `DefaultIcon`.
 */
export interface DefaultIconOptions extends IconOptions {
    /**
     * The maple leaf marker, inlined as an SVG data URI.
     */
    iconUrl?: string;
    /**
     * Its shadow, inlined as an SVG data URI.
     */
    shadowUrl?: string;
    /**
     * @default [25, 41]
     */
    iconSize?: PointExpression|number;
    /**
     * @default [12, 41]
     */
    iconAnchor?: PointExpression;
    /**
     * @default [1, -34]
     */
    popupAnchor?: PointExpression;
    /**
     * @default [16, -28]
     */
    tooltipAnchor?: PointExpression;
    /**
     * @default [41, 41]
     */
    shadowSize?: PointExpression|number;
}
import { Icon } from './Icon.js';
import type { PointExpression } from '../../geometry/Point.js';
