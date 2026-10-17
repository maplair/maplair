import { I18n } from "../core/I18n.js";
//#region src/layer/Classification.js
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
var Classification = class {
	/**
	* Creates a classification from the given classes. Each class is an object with
	* `value` (a value or an array of values) or `lower`/`upper` (a range including
	* `lower`, excluding `upper`), a `symbol` (path options), a `legend` label, and
	* `counted: false` to exclude the class from the feature count (e.g. "no data").
	* @param {ClassificationClass[]} classes
	* @param {ClassificationOptions} [options]
	*/
	constructor(classes, options) {
		/**
		* The options of the classification.
		* @type {ClassificationOptions}
		*/
		this.options = {
			name: "",
			value: void 0,
			normalize: void 0,
			otherValues: void 0,
			...options
		};
		this._classes = classes;
		this._values = /* @__PURE__ */ new Map();
		this._labels = /* @__PURE__ */ new Map();
		const ranges = [];
		for (const cls of classes) {
			if ("value" in cls) for (const value of Array.isArray(cls.value) ? cls.value : [cls.value]) {
				const key = this._normalize(value);
				if (!this._values.has(key)) this._values.set(key, cls);
			}
			else ranges.push(cls);
			if (cls.legend !== void 0 && !this._labels.has(this._normalize(cls.legend))) this._labels.set(this._normalize(cls.legend), cls);
		}
		this._ranges = ranges.sort((a, b) => (a.lower ?? -Infinity) - (b.lower ?? -Infinity));
		const other = this.options.otherValues;
		this._other = other && {
			legend: I18n.translate("All other values"),
			...other
		};
		this.style = this.style.bind(this);
	}
	/**
	* Returns the class of the given GeoJSON feature, of a layer with a `feature`
	* (as created by `GeoJSON`) or, without the `value` option, of a value: one of the
	* classes passed to the constructor, the `otherValues` class or `undefined`.
	* @param {any} feature A `Feature`, a `Layer` with a `feature`, or a value.
	* @returns {ClassificationClass|undefined}
	*/
	classify(feature) {
		const value = this._normalize(this._getValue(feature?.feature ?? feature));
		return this._values.get(value) ?? this._findRange(value) ?? this._labels.get(value) ?? this._other;
	}
	/**
	* Returns the symbol of the class of the feature (an empty object for features
	* without class), bound to the classification for the `style` option of `GeoJSON`.
	* @param {any} feature A `Feature`, a `Layer` with a `feature`, or a value.
	* @returns {PathOptions}
	*/
	style(feature) {
		return this.classify(feature)?.symbol ?? {};
	}
	/**
	* Returns the items of the legend, `{legend, symbol, counted, classes}`, in the order
	* of the classes and `otherValues` last. Classes with the same legend label and
	* symbol share one item.
	* @returns {ClassificationLegendItem[]}
	*/
	legendItems() {
		return this._getItems().items;
	}
	/**
	* Counts the given features (or layers with a `feature`) per legend item, returning
	* the legend items with `count` and `share` (the fraction of the counted features).
	* Classes with `counted: false` get a `count`, but no `share`, and do not count
	* toward the total.
	* @param {any[]} features `Feature`s, `Layer`s with a `feature`, or values.
	* @returns {ClassificationFeatureCount[]}
	*/
	featureCount(features) {
		const { items, itemOf } = this._getItems(), counts = new Map(items.map((item) => [item, 0]));
		for (const feature of features) {
			const item = itemOf.get(this.classify(feature));
			if (item) counts.set(item, counts.get(item) + 1);
		}
		const total = items.reduce((sum, item) => sum + (item.counted ? counts.get(item) : 0), 0);
		return items.map((item) => ({
			...item,
			count: counts.get(item),
			share: item.counted ? total ? counts.get(item) / total : 0 : void 0
		}));
	}
	_getValue(feature) {
		const { value } = this.options;
		if (typeof value === "function") return value(feature);
		if (value === void 0) return feature;
		return feature?.properties?.[value];
	}
	_normalize(value) {
		value ??= null;
		const { normalize } = this.options;
		return normalize && value !== null ? normalize(value) : value;
	}
	_findRange(value) {
		const num = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
		if (typeof num !== "number" || Number.isNaN(num)) return;
		const ranges = this._ranges;
		let lo = 0, hi = ranges.length - 1, found;
		while (lo <= hi) {
			const mid = lo + hi >> 1;
			if ((ranges[mid].lower ?? -Infinity) <= num) {
				found = ranges[mid];
				lo = mid + 1;
			} else hi = mid - 1;
		}
		return found && num < (found.upper ?? Infinity) ? found : void 0;
	}
	_getItems() {
		const items = [], itemOf = /* @__PURE__ */ new Map(), byKey = /* @__PURE__ */ new Map(), classes = this._other ? [...this._classes, this._other] : this._classes;
		for (const cls of classes) {
			const legend = cls.legend ?? this._defaultLegend(cls), key = `${legend}\u0000${JSON.stringify(cls.symbol ?? {})}`;
			let item = byKey.get(key);
			if (!item) {
				item = {
					legend,
					symbol: cls.symbol ?? {},
					counted: cls.counted !== false,
					classes: []
				};
				byKey.set(key, item);
				items.push(item);
			}
			item.classes.push(cls);
			itemOf.set(cls, item);
		}
		return {
			items,
			itemOf
		};
	}
	_defaultLegend(cls) {
		if ("value" in cls) return [cls.value].flat().map(String).join(", ");
		const format = (num) => num.toLocaleString(I18n.getLocale() ?? void 0);
		if (cls.lower === void 0) return `< ${format(cls.upper)}`;
		if (cls.upper === void 0) return `≥ ${format(cls.lower)}`;
		return `${format(cls.lower)}–${format(cls.upper)}`;
	}
	/**
	* Returns `n` ranges `{lower, upper}` with about the same number of the given values
	* each (fewer for repeated values), the first and last range open-ended. Add a
	* `symbol` (and a `legend`) to each to create a `Classification`.
	* @group Classification methods
	* @param {number[]} values
	* @param {number} n
	* @returns {{lower?: number, upper?: number}[]}
	*/
	static quantile(values, n) {
		const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b), breaks = [];
		for (let i = 1; i < n && sorted.length; i++) breaks.push(sorted[Math.floor(i * sorted.length / n)]);
		return rangesOf(breaks);
	}
	/**
	* Returns `n` ranges `{lower, upper}` of equal width between the minimum and the
	* maximum of the given values, the first and last range open-ended.
	* @group Classification methods
	* @param {number[]} values
	* @param {number} n
	* @returns {{lower?: number, upper?: number}[]}
	*/
	static equalInterval(values, n) {
		const finite = values.filter(Number.isFinite);
		if (!finite.length) return rangesOf([]);
		const min = Math.min(...finite), width = (Math.max(...finite) - min) / n, breaks = [];
		for (let i = 1; i < n; i++) breaks.push(min + i * width);
		return rangesOf(breaks);
	}
};
function rangesOf(breaks) {
	const unique = [...new Set(breaks)];
	return [void 0, ...unique].map((lower, i) => {
		const range = {};
		if (lower !== void 0) range.lower = lower;
		if (i < unique.length) range.upper = unique[i];
		return range;
	});
}
//#endregion
export { Classification };

//# sourceMappingURL=Classification.js.map