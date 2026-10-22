import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
import type { LayersControlEvent } from '../core/Events.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {LayersControlEvent} from '../core/Events.js' */
/**
 * An entry of `LayersControl`, as returned by `getLayers()`.
 * @typedef {object} LayersControlEntry
 * @property {Layer} layer The layer.
 * @property {string} name The name of the layer, as given to the control.
 * @property {boolean} overlay Whether the layer is an overlay (checkbox) or a base layer
 * (radio button).
 */
/**
 * The group of an entry of `LayersControl`, as returned by the option `groupBy`.
 * @typedef {object} LayersControlGroup
 * @property {string} group The name of the group, rendered as text.
 * @property {string} label The label of the entry within the group, may contain HTML
 * (like layer names).
 */
/**
 * Options of `LayersControl`.
 * @typedef {object} LayersControlOptions
 * @property {boolean} [collapsed=true] If `true`, the control will be collapsed into an
 * icon and expanded on pointer hover, touch, or keyboard activation. Ignored if `inline`
 * is `true`.
 * @property {boolean} [inline=false] If `true`, the control is laid out like the
 * attribution control: it is always expanded (without toggle button) and all entries are
 * placed next to each other, wrapping onto multiple lines if necessary.
 * @property {(name: string, layer: Layer, overlay: boolean) => LayersControlGroup | undefined} [groupBy]
 * A function to group the entries. For each entry, it returns the name of its group and
 * its label within the group, or `undefined` for an ungrouped entry. Consecutive entries
 * of the same group (base layers and overlays separately) are rendered within one
 * `maplair-control-layers-group` container, starting with the group name in a
 * `maplair-control-layers-group-name` element, and each entry shows only its label.
 * Events like `baselayerchange` still carry the full `name`. When combined with
 * `sortLayers`, the entries are sorted first and grouped afterwards.
 * @property {string|HTMLElement} [toggleContent] The content of the toggle button of a
 * collapsed control instead of the layers icon: HTML (e.g. an icon or a character) or an
 * element. String content is rendered as HTML; do not pass untrusted input.
 * @property {number} [collapseDelay=0] Collapse delay in milliseconds. If greater than 0,
 * the control will remain open longer, making it easier to scroll through long layer
 * lists.
 * @property {string} [position='topright'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {boolean} [autoZIndex=true] If `true`, the control will assign zIndexes in
 * increasing order to all of its layers so that the order is preserved when switching
 * them on/off.
 * @property {boolean} [hideSingleBase=false] If `true`, the base layers in the control
 * will be hidden when there is only one.
 * @property {boolean} [sortLayers=false] Whether to sort the layers. When `false`, layers
 * will keep the order in which they were added to the control.
 * @property {(layerA: Layer, layerB: Layer, nameA: string, nameB: string) => number} [sortFunction]
 * A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
 * that will be used for sorting the layers, when `sortLayers` is `true`. The function
 * receives both the `Layer` instances and their names, as in
 * `sortFunction(layerA, layerB, nameA, nameB)`. By default, it sorts layers
 * alphabetically by their name.
 * @extends ControlOptions
 */
/**
 * The layers control gives users the ability to switch between different base layers
 * and switch overlays on/off (check out the
 * [detailed example](https://maplair.org/examples/layers-control/)).
 *
 * @example
 * ```js
 * const baseLayers = {
 * 	"Mapbox": mapbox,
 * 	"OpenStreetMap": osm
 * };
 *
 * const overlays = {
 * 	"Marker": marker,
 * 	"Roads": roadsLayer
 * };
 *
 * new LayersControl(baseLayers, overlays).addTo(map);
 * ```
 *
 * The `baseLayers` and `overlays` parameters are object literals with layer names as keys and `Layer` objects as values:
 *
 * ```js
 * {
 *     "<someName1>": layer1,
 *     "<someName2>": layer2
 * }
 * ```
 *
 * The layer names can contain HTML, which allows you to add additional styling to the items:
 *
 * ```js
 * {"<img src='my-layer-icon' /> <span class='my-layer-item'>My Layer</span>": myLayer}
 * ```
 *
 * Layers can be grouped using the option `groupBy`, for example layer names of the form
 * `"Group (label)"`:
 *
 * ```js
 * new LayersControl(baseLayers, overlays, {
 * 	inline: true,
 * 	groupBy(name) {
 * 		const [, group, label] = /^([^<>()]+) \((.+)\)$/.exec(name) ?? [];
 * 		return group ? {group: `${group}:`, label} : undefined;
 * 	}
 * }).addTo(map);
 * ```
 *
 * @fires MaplairMap#baselayerchange {LayersControlEvent} Fired when the base layer is
 * changed through the [layers control](#control-layers).
 * @fires MaplairMap#overlayadd {LayersControlEvent} Fired when an overlay is selected
 * through the [layers control](#control-layers).
 * @fires MaplairMap#overlayremove {LayersControlEvent} Fired when an overlay is
 * deselected through the [layers control](#control-layers).
 */
export class LayersControl extends Control {
    static defaultOptions: Partial<LayersControlOptions>;
    /**
     * Creates a layers control with the given layers. Base layers will be switched with
     * radio buttons, while overlays will be switched with checkboxes. Note that all base
     * layers should be passed in the base layers object, but only one should be added to
     * the map during map instantiation.
     * @param {Record<string, Layer>} [baseLayers]
     * @param {Record<string, Layer>} [overlays]
     * @param {LayersControlOptions} [options]
     */
    constructor(baseLayers?: Record<string, Layer>, overlays?: Record<string, Layer>, options?: LayersControlOptions);
    /**
     * Adds the control to the given map.
     * @param {MaplairMap} map
     * @returns {this}
     */
    addTo(map: MaplairMap): this;
    /**
     * Adds a base layer (radio button entry) with the given name to the control.
     * @param {Layer} layer
     * @param {string} name
     * @returns {this}
     */
    addBaseLayer(layer: Layer, name: string): this;
    /**
     * Adds an overlay (checkbox entry) with the given name to the control.
     * @param {Layer} layer
     * @param {string} name
     * @returns {this}
     */
    addOverlay(layer: Layer, name: string): this;
    /**
     * Remove the given layer from the control.
     * @param {Layer} layer
     * @returns {this}
     */
    removeLayer(layer: Layer): this;
    /**
     * Returns the entries of the control in the order they are displayed.
     * @returns {LayersControlEntry[]}
     */
    getLayers(): LayersControlEntry[];
    /**
     * Selects the given layer of the control like a click on its entry: a base layer
     * replaces the current base layer, an overlay is added to the map. The events
     * `baselayerchange` and `overlayadd` are fired as for a click, but without
     * `originalEvent`. Has no effect if the control is not on a map or does not contain
     * the layer.
     * @param {Layer} layer
     * @returns {this}
     */
    selectLayer(layer: Layer): this;
    /**
     * Expand the control container if collapsed.
     * @returns {this}
     */
    expand(): this;
    /**
     * Collapse the control container if expanded.
     * @param {Event} [ev] The event causing the collapse, if any (collapsing is skipped
     * for `pointerleave` and `pointerout` of touch).
     * @returns {this}
     */
    collapse(ev?: Event): this;
    /** The options of the LayersControl, see [the options](#layerscontroloptions). */
    options: LayersControlOptions;
}
/**
 * An entry of `LayersControl`, as returned by `getLayers()`.
 */
export interface LayersControlEntry {
    /**
     * The layer.
     */
    layer: Layer;
    /**
     * The name of the layer, as given to the control.
     */
    name: string;
    /**
     * Whether the layer is an overlay (checkbox) or a base layer
     * (radio button).
     */
    overlay: boolean;
}
/**
 * The group of an entry of `LayersControl`, as returned by the option `groupBy`.
 */
export interface LayersControlGroup {
    /**
     * The name of the group, rendered as text.
     */
    group: string;
    /**
     * The label of the entry within the group, may contain HTML
     * (like layer names).
     */
    label: string;
}
/**
 * Options of `LayersControl`.
 */
export interface LayersControlOptions extends ControlOptions {
    /**
     * If `true`, the control will be collapsed into an
     * icon and expanded on pointer hover, touch, or keyboard activation. Ignored if `inline`
     * is `true`.
     * @default true
     */
    collapsed?: boolean;
    /**
     * If `true`, the control is laid out like the
     * attribution control: it is always expanded (without toggle button) and all entries are
     * placed next to each other, wrapping onto multiple lines if necessary.
     * @default false
     */
    inline?: boolean;
    /**
     * A function to group the entries. For each entry, it returns the name of its group and
     * its label within the group, or `undefined` for an ungrouped entry. Consecutive entries
     * of the same group (base layers and overlays separately) are rendered within one
     * `maplair-control-layers-group` container, starting with the group name in a
     * `maplair-control-layers-group-name` element, and each entry shows only its label.
     * Events like `baselayerchange` still carry the full `name`. When combined with
     * `sortLayers`, the entries are sorted first and grouped afterwards.
     */
    groupBy?: (name: string, layer: Layer, overlay: boolean) => LayersControlGroup | undefined;
    /**
     * The content of the toggle button of a
     * collapsed control instead of the layers icon: HTML (e.g. an icon or a character) or an
     * element. String content is rendered as HTML; do not pass untrusted input.
     */
    toggleContent?: string|HTMLElement;
    /**
     * Collapse delay in milliseconds. If greater than 0,
     * the control will remain open longer, making it easier to scroll through long layer
     * lists.
     * @default 0
     */
    collapseDelay?: number;
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topright'
     */
    position?: string;
    /**
     * If `true`, the control will assign zIndexes in
     * increasing order to all of its layers so that the order is preserved when switching
     * them on/off.
     * @default true
     */
    autoZIndex?: boolean;
    /**
     * If `true`, the base layers in the control
     * will be hidden when there is only one.
     * @default false
     */
    hideSingleBase?: boolean;
    /**
     * Whether to sort the layers. When `false`, layers
     * will keep the order in which they were added to the control.
     * @default false
     */
    sortLayers?: boolean;
    /**
     * A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
     * that will be used for sorting the layers, when `sortLayers` is `true`. The function
     * receives both the `Layer` instances and their names, as in
     * `sortFunction(layerA, layerB, nameA, nameB)`. By default, it sorts layers
     * alphabetically by their name.
     */
    sortFunction?: (layerA: Layer, layerB: Layer, nameA: string, nameB: string) => number;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
import type { Layer } from '../layer/Layer.js';
