import type { Marker } from '../layer/marker/Marker.js';
import type { define } from './MaplairElement.js';
import type { MapElement } from './MapElement.js';
/**
 * `<maplair-popup>`: a [`Popup`](#popup) with the content of the element (moved into the
 * popup), bound to the layer of the parent element (e.g. `<maplair-marker>`), or inside
 * `<maplair-map>` at `latlng`. `open` opens it, and reflects whether it's open.
 */
export class PopupElement extends OverlayElement {
    static Class: typeof Popup;
    static bind: string;
    static unbind: string;
    static open: string;
    static property: string;
    /**
     * The popup.
     * @type {Popup|null}
     */
    get popup(): Popup | null;
}
/**
 * `<maplair-tooltip>`: a [`Tooltip`](#tooltip) with the content of the element, bound to the
 * layer of the parent element, or inside `<maplair-map>` at `latlng`; e.g. `permanent`,
 * `direction="top"`.
 */
export class TooltipElement extends OverlayElement {
    static Class: typeof Tooltip;
    static bind: string;
    static unbind: string;
    static open: string;
    static property: string;
    /**
     * The tooltip.
     * @type {Tooltip|null}
     */
    get tooltip(): Tooltip | null;
}
/** `<maplair-icon>`: the [`Icon`](#icon) of the parent marker, e.g. `icon-url`, `icon-size="32,32"`. */
export class ImageIconElement extends IconElement {
    static Class: typeof Icon;
}
/** `<maplair-div-icon>`: a [`DivIcon`](#divicon) of the parent marker, with the content of the element. */
export class DivIconElement extends IconElement {
    static Class: typeof DivIcon;
    createInstance(): DivIcon;
}
/** `<maplair-svg-icon>`: an [`SvgIcon`](#svgicon) of the parent marker, e.g. `color`, `glyph`. */
export class SvgIconElement extends IconElement {
    static Class: typeof SvgIcon;
}
declare class OverlayElement extends MaplairElement {
    createInstance(): any;
    attach(parent: any): void;
    detach(parent: any): void;
    update(name: any, value: any): boolean;
}
import { Popup } from '../layer/Popup.js';
import { Tooltip } from '../layer/Tooltip.js';
declare class IconElement extends MaplairElement {
    attach(parent: any): void;
    detach(parent: any): void;
    update(): boolean;
    /**
     * The icon.
     * @type {Icon|null}
     */
    get icon(): Icon | null;
}
import { Icon } from '../layer/marker/Icon.js';
import { DivIcon } from '../layer/marker/DivIcon.js';
import { SvgIcon } from '../layer/marker/SvgIcon.js';
import { MaplairElement } from './MaplairElement.js';
export {};
