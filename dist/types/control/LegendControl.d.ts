import type { I18n } from '../core/I18n.js';
import type { CircleMarker } from '../layer/vector/CircleMarker.js';
import type { ControlOptions } from './Control.js';
export class LegendControl extends Control {
    /**
     * Creates a legend control.
     * @param {...LegendControlOptions} args The options.
     */
    constructor(options?: LegendControlOptions);
    /**
     * Shows the classes of `classification` in the legend while `layer` is on the map,
     * with the feature count of the layers of `layer` (e.g. a `GeoJSON` layer styled
     * with [`classification.style`](#classification-style)), kept up to date when
     * layers are added and removed.
     * @param {FeatureGroup} layer
     * @param {Classification} classification
     * @returns {this}
     */
    addClassification(layer: FeatureGroup, classification: Classification): this;
    /**
     * Removes the classification of `layer` from the legend.
     * @param {FeatureGroup} layer
     * @returns {this}
     */
    removeClassification(layer: FeatureGroup): this;
    /** The options of the LegendControl, see [the options](#legendcontroloptions). */
    options: LegendControlOptions;
}
/**
 * Options of `LegendControl`.
 */
export interface LegendControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the
     * map corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'bottomright'
     */
    position?: string;
    /**
     * If `true`, the legend starts collapsed to its
     * title, which toggles it.
     * @default false
     */
    collapsed?: boolean;
    /**
     * If `true`, the number of features is shown
     * per class and per classification.
     * @default false
     */
    featureCount?: boolean;
    /**
     * If `true`, the feature count of each classification
     * is shown as a bar of the class symbols, each as wide as its share.
     * @default false
     */
    bar?: boolean;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
import type { FeatureGroup } from '../layer/FeatureGroup.js';
import type { Classification } from '../layer/Classification.js';
