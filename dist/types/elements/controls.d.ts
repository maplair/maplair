import type { Path } from '../layer/vector/Path.js';
import type { camelCase, define, parseOption } from './MaplairElement.js';
import type { MapElement } from './MapElement.js';
import type { LayerElement, GeoJSONElement } from './layers.js';
/**
 * The base of the elements of controls, e.g. `<maplair-scale-control>`, children of
 * `<maplair-map>`. The attributes are the options of the control, e.g. `position`.
 */
export class ControlElement extends MaplairElement {
    /**
     * The control.
     * @type {any}
     */
    get control(): any;
    attach(parent: any): void;
    detach(): void;
    update(name: any, value: any): boolean;
}
/** `<maplair-zoom-control>`: a [`ZoomControl`](#zoomcontrol), replacing the default one of the map. */
export class ZoomControlElement extends ControlElement {
    static Class: typeof ZoomControl;
}
/** `<maplair-scale-control>`: a [`ScaleControl`](#scalecontrol), e.g. `imperial="false"`. */
export class ScaleControlElement extends ControlElement {
    static Class: typeof ScaleControl;
}
/** `<maplair-attribution-control>`: an [`AttributionControl`](#attributioncontrol), replacing the default one, e.g. with a `prefix`. */
export class AttributionControlElement extends ControlElement {
    static Class: typeof AttributionControl;
}
/**
 * `<maplair-layers-control>`: a [`LayersControl`](#layerscontrol) listing the layer elements
 * of the map with a `name`, the ones with `base` as base layers.
 */
export class LayersControlElement extends ControlElement {
    static Class: typeof LayersControl;
    createInstance(): LayersControl;
    onRegister(kind: any, el: any): void;
    onUnregister(kind: any, el: any): void;
}
/** `<maplair-fullscreen-control>`: a [`FullscreenControl`](#fullscreencontrol). */
export class FullscreenControlElement extends ControlElement {
    static Class: typeof FullscreenControl;
}
/**
 * `<maplair-minimap-control>`: a [`MiniMapControl`](#minimapcontrol) showing the layer of its
 * child layer element, e.g. a `<maplair-tile-layer>`.
 */
export class MiniMapControlElement extends ControlElement {
    static Class: typeof MiniMapControl;
    createInstance(): {
        remove(): void;
    };
    attach(): void;
    attachChild(child: any): void;
    detachChild(): void;
    get control(): MiniMapControl | null;
    destroy(): void;
}
/**
 * `<maplair-search-control>`: a [`SearchControl`](#searchcontrol) searching places with
 * `provider="nominatim"` (which requires `accept-usage-policy`, see
 * [`SearchControl.nominatim()`](#searchcontrol-nominatim)), or the features of a layer element
 * with `layers` (its selector) by the feature property `property` (default `name`).
 */
export class SearchControlElement extends ControlElement {
    static Class: typeof SearchControl;
    createInstance(): SearchControl | null;
}
/**
 * `<maplair-legend-control>`: a [`LegendControl`](#legendcontrol) with the classifications of
 * the map's `<maplair-classification>` elements.
 */
export class LegendControlElement extends ControlElement {
    static Class: typeof LegendControl;
    onRegister(kind: any, el: any): void;
    onUnregister(kind: any, el: any): void;
}
/**
 * `<maplair-time-control>`: a [`TimeControl`](#timecontrol) stepping through `times` (separated
 * by spaces) or the times of `interval`; its child layer elements (e.g. a
 * `<maplair-wms-layer>`) show the current time.
 */
export class TimeControlElement extends ControlElement {
    static Class: typeof TimeControl;
    attachChild(child: any): void;
    detachChild(child: any): void;
}
/**
 * `<maplair-side-by-side-control>`: a [`SideBySideControl`](#sidebysidecontrol) comparing the
 * layer elements of the selectors `left` and `right`.
 */
export class SideBySideControlElement extends ControlElement {
    static Class: typeof SideBySideControl;
    createInstance(): SideBySideControl | null;
}
/** `<maplair-text-control>`: a [`TextControl`](#textcontrol) showing the content of the element. */
export class TextControlElement extends ControlElement {
    static Class: typeof TextControl;
    createInstance(): TextControl;
}
/**
 * `<maplair-button-control>`: a [`ButtonControl`](#buttoncontrol) with the content of the
 * element; clicking it dispatches `maplair-click` on the element.
 */
export class ButtonControlElement extends ControlElement {
    static Class: typeof ButtonControl;
    createInstance(): ButtonControl;
}
/**
 * `<maplair-context-menu>`: a [`ContextMenu`](#contextmenu) of the map or of the layer of the
 * parent element, with its child `<button>` elements as items; choosing one dispatches
 * `maplair-select` on the button, with the `latlng` of the menu in `detail`.
 */
export class ContextMenuElement extends ControlElement {
    static Class: typeof ContextMenu;
    createInstance(): ContextMenu | null;
}
/**
 * `<maplair-classification>`: a [`Classification`](#classification) styling the features of
 * the parent `<maplair-geojson>` by the property `property`, with its child
 * `<maplair-class>` elements as the classes; `name` is the title in
 * `<maplair-legend-control>`.
 *
 * `<maplair-class>`: a class by `value` (a number, a string, `null` or a JSON array of values)
 * or by the range from `lower` (included) to `upper` (excluded), with the path style as
 * attributes (e.g. `fill-color`), a `legend` label, and `counted="false"` to leave it out of
 * the feature count.
 */
export class ClassificationElement extends MaplairElement {
    /**
     * The classification.
     * @type {Classification|null}
     */
    get classification(): Classification | null;
    /**
     * The `GeoJSON` layer it styles.
     * @type {any}
     */
    get geojson(): any;
    createInstance(): Classification | null;
    attach(parent: any): void;
    detach(parent: any): void;
}
/** `<maplair-class>`: a class of the parent `<maplair-classification>`, see there. */
export class ClassElement extends HTMLElement {
}
import { MaplairElement } from './MaplairElement.js';
import { ZoomControl } from '../control/ZoomControl.js';
import { ScaleControl } from '../control/ScaleControl.js';
import { AttributionControl } from '../control/AttributionControl.js';
import { LayersControl } from '../control/LayersControl.js';
import { FullscreenControl } from '../control/FullscreenControl.js';
import { MiniMapControl } from '../control/MiniMapControl.js';
import { SearchControl } from '../control/SearchControl.js';
import { LegendControl } from '../control/LegendControl.js';
import { TimeControl } from '../control/TimeControl.js';
import { SideBySideControl } from '../control/SideBySideControl.js';
import { TextControl } from '../control/TextControl.js';
import { ButtonControl } from '../control/ButtonControl.js';
import { ContextMenu } from '../control/ContextMenu.js';
import { Classification } from '../layer/Classification.js';
