import type { IconOptions } from './Icon.js';
/**
 * Options of `DefaultIcon`.
 * @typedef {object} DefaultIconOptions
 * @property {string} [iconUrl='marker-icon.svg']
 * @property {string} [iconRetinaUrl='marker-icon.svg']
 * @property {string} [shadowUrl='marker-shadow.svg']
 * @property {PointExpression|number} [iconSize=[25, 41]]
 * @property {PointExpression} [iconAnchor=[12, 41]]
 * @property {PointExpression} [popupAnchor=[1, -34]]
 * @property {PointExpression} [tooltipAnchor=[16, -28]]
 * @property {PointExpression|number} [shadowSize=[41, 41]]
 * @property {string} [imagePath] `DefaultIcon` will try to auto-detect the location of
 * the blue icon images. If you are placing these images in a non-standard way, set this
 * option to point to the right path.
 * @extends IconOptions
 */
/**
 * A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
 * no icon is specified. Points to the blue marker image distributed with Maplair
 * releases.
 *
 * In order to customize the default icon, just change the properties of
 * `DefaultIcon.prototype.options` (which is a set of `Icon options`).
 *
 * If you want to _completely_ replace the default icon, override the
 * `Marker.prototype.options.icon` with your own icon instead.
 */
export class DefaultIcon extends Icon {
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
     * @default 'marker-icon.svg'
     */
    iconUrl?: string;
    /**
     * @default 'marker-icon.svg'
     */
    iconRetinaUrl?: string;
    /**
     * @default 'marker-shadow.svg'
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
    /**
     * `DefaultIcon` will try to auto-detect the location of
     * the blue icon images. If you are placing these images in a non-standard way, set this
     * option to point to the right path.
     */
    imagePath?: string;
}
import { Icon } from './Icon.js';
import type { PointExpression } from '../../geometry/Point.js';
