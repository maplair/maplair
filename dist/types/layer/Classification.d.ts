import type { I18n } from '../core/I18n.js';
/** @import {PathOptions} from './vector/Path.js' */
/**
 * A class of a `Classification`, given by value or by range.
 * @typedef {object} ClassificationClass
 * @property {any} [value] The value of the class, or an array of values sharing the
 * class.
 * @property {number} [lower] The lower bound of the range of the class (included);
 * left out for an open end.
 * @property {number} [upper] The upper bound of the range of the class (excluded);
 * left out for an open end.
 * @property {PathOptions} [symbol] The symbol of the class (path options such as
 * `fillColor`).
 * @property {string} [legend] The legend label of the class.
 * @property {boolean} [counted] `false` to exclude the class from the feature count
 * (e.g. "no data").
 */
/**
 * An item of the legend of a `Classification`, see `legendItems()`.
 * @typedef {object} ClassificationLegendItem
 * @property {string} legend The legend label.
 * @property {PathOptions} symbol The symbol.
 * @property {boolean} counted Whether the features of the item are counted.
 * @property {ClassificationClass[]} classes The classes sharing the item.
 */
/**
 * A legend item of a `Classification` with the feature count, see `featureCount()`.
 * @typedef {object} ClassificationFeatureCount
 * @property {number} count The number of features of the item.
 * @property {number} [share] The fraction of the counted features (`undefined` for
 * items not counted).
 * @extends ClassificationLegendItem
 */
/**
 * Options of `Classification`.
 * @typedef {object} ClassificationOptions
 * @property {string} [name=''] The name of the classification, shown as title of its
 * legend.
 * @property {string|((feature: any) => any)} [value] The value to classify by: the
 * name of a property of the feature, or a function receiving the feature and
 * returning the value. Without it, the argument of `classify()` is the value itself.
 * @property {(value: any) => any} [normalize] A function applied to the values of the
 * classes and of the features before comparing them, for tolerant matching, e.g.
 * `v => String(v).trim().toUpperCase()`.
 * @property {ClassificationClass} [otherValues] The class of all values not matching
 * any other class, with `symbol` and `legend` (default "All other values"). Without
 * it, such features are not classified.
 */
/**
 * Classifies features
 * by the value of an attribute, for thematic maps: each class
 * has a symbol (path options such as `fillColor`) and a legend label. A class is
 * either given by value (`{value: 'S2'}`, or several values sharing one class
 * `{value: ['S1', 'S2']}`) or by range (`{lower: 0, upper: 10}` for
 * `0 ≤ value < 10`, either bound left out for an open end); both kinds may be
 * mixed in one classification. A feature is classified by its exact value first,
 * then by range, then by legend label, else it falls into the
 * [`otherValues`](#classification-othervalues) class.
 *
 * Use [`style`](#classification-style) as `style` option of `GeoJSON` to style
 * the features by their class, and
 * [`LegendControl.addClassification()`](#legendcontrol-addclassification) to
 * show the classes in a legend, with the feature count per class.
 *
 * @example
 * ```js
 * const temperature = new Classification([
 * 	{value: null, symbol: {fillColor: '#000000'}, legend: 'No data', counted: false},
 * 	{upper: 0, symbol: {fillColor: '#5bc0de'}, legend: '< 0 °C'},
 * 	{lower: 0, upper: 10, symbol: {fillColor: '#33ee33'}, legend: '0–10 °C'},
 * 	{lower: 10, symbol: {fillColor: '#f0a030'}, legend: '≥ 10 °C'}
 * ], {name: 'Air temperature', value: 'temperature'});
 *
 * const stations = new GeoJSON(data, {
 * 	pointToLayer: (feature, latlng) => new CircleMarker(latlng, {color: '#ffffff'}),
 * 	style: temperature.style
 * }).addTo(map);
 *
 * temperature.classify(data.features[0]).legend; // e.g. '0–10 °C'
 * ```
 *
 * Inspired by the categorized and graduated renderers of [QGIS](https://qgis.org/).
 */
export class Classification {
    /**
     * Returns `n` ranges `{lower, upper}` with about the same number of the given values
     * each (fewer for repeated values), the first and last range open-ended. Add a
     * `symbol` (and a `legend`) to each to create a `Classification`.
     * @group Classification methods
     * @param {number[]} values
     * @param {number} n
     * @returns {{lower?: number, upper?: number}[]}
     */
    static quantile(values: number[], n: number): {
        lower?: number;
        upper?: number;
    }[];
    /**
     * Returns `n` ranges `{lower, upper}` of equal width between the minimum and the
     * maximum of the given values, the first and last range open-ended.
     * @group Classification methods
     * @param {number[]} values
     * @param {number} n
     * @returns {{lower?: number, upper?: number}[]}
     */
    static equalInterval(values: number[], n: number): {
        lower?: number;
        upper?: number;
    }[];
    /**
     * Creates a classification from the given classes. Each class is an object with
     * `value` (a value or an array of values) or `lower`/`upper` (a range including
     * `lower`, excluding `upper`), a `symbol` (path options), a `legend` label, and
     * `counted: false` to exclude the class from the feature count (e.g. "no data").
     * @param {ClassificationClass[]} classes
     * @param {ClassificationOptions} [options]
     */
    constructor(classes: ClassificationClass[], options?: ClassificationOptions);
    /**
     * The options of the classification.
     * @type {ClassificationOptions}
     */
    options: ClassificationOptions;
    /**
     * Returns the symbol of the class of the feature (an empty object for features
     * without class), bound to the classification for the `style` option of `GeoJSON`.
     * @param {any} feature A `Feature`, a `Layer` with a `feature`, or a value.
     * @returns {PathOptions}
     */
    style(feature: any): PathOptions;
    /**
     * Returns the class of the given GeoJSON feature, of a layer with a `feature`
     * (as created by `GeoJSON`) or, without the `value` option, of a value: one of the
     * classes passed to the constructor, the `otherValues` class or `undefined`.
     * @param {any} feature A `Feature`, a `Layer` with a `feature`, or a value.
     * @returns {ClassificationClass|undefined}
     */
    classify(feature: any): ClassificationClass | undefined;
    /**
     * Returns the items of the legend, `{legend, symbol, counted, classes}`, in the order
     * of the classes and `otherValues` last. Classes with the same legend label and
     * symbol share one item.
     * @returns {ClassificationLegendItem[]}
     */
    legendItems(): ClassificationLegendItem[];
    /**
     * Counts the given features (or layers with a `feature`) per legend item, returning
     * the legend items with `count` and `share` (the fraction of the counted features).
     * Classes with `counted: false` get a `count`, but no `share`, and do not count
     * toward the total.
     * @param {any[]} features `Feature`s, `Layer`s with a `feature`, or values.
     * @returns {ClassificationFeatureCount[]}
     */
    featureCount(features: any[]): ClassificationFeatureCount[];
}
/**
 * A class of a `Classification`, given by value or by range.
 */
export interface ClassificationClass {
    /**
     * The value of the class, or an array of values sharing the
     * class.
     */
    value?: any;
    /**
     * The lower bound of the range of the class (included);
     * left out for an open end.
     */
    lower?: number;
    /**
     * The upper bound of the range of the class (excluded);
     * left out for an open end.
     */
    upper?: number;
    /**
     * The symbol of the class (path options such as
     * `fillColor`).
     */
    symbol?: PathOptions;
    /**
     * The legend label of the class.
     */
    legend?: string;
    /**
     * `false` to exclude the class from the feature count
     * (e.g. "no data").
     */
    counted?: boolean;
}
/**
 * An item of the legend of a `Classification`, see `legendItems()`.
 */
export interface ClassificationLegendItem {
    /**
     * The legend label.
     */
    legend: string;
    /**
     * The symbol.
     */
    symbol: PathOptions;
    /**
     * Whether the features of the item are counted.
     */
    counted: boolean;
    /**
     * The classes sharing the item.
     */
    classes: ClassificationClass[];
}
/**
 * A legend item of a `Classification` with the feature count, see `featureCount()`.
 */
export interface ClassificationFeatureCount extends ClassificationLegendItem {
    /**
     * The number of features of the item.
     */
    count: number;
    /**
     * The fraction of the counted features (`undefined` for
     * items not counted).
     */
    share?: number;
}
/**
 * Options of `Classification`.
 */
export interface ClassificationOptions {
    /**
     * The name of the classification, shown as title of its
     * legend.
     * @default ''
     */
    name?: string;
    /**
     * The value to classify by: the
     * name of a property of the feature, or a function receiving the feature and
     * returning the value. Without it, the argument of `classify()` is the value itself.
     */
    value?: string|((feature: any) => any);
    /**
     * A function applied to the values of the
     * classes and of the features before comparing them, for tolerant matching, e.g.
     * `v => String(v).trim().toUpperCase()`.
     */
    normalize?: (value: any) => any;
    /**
     * The class of all values not matching
     * any other class, with `symbol` and `legend` (default "All other values"). Without
     * it, such features are not classified.
     */
    otherValues?: ClassificationClass;
}
import type { PathOptions } from './vector/Path.js';
