import {I18n} from '../core/I18n.js';

/*
 * @class Classification
 *
 * Classifies features by the value of an attribute, for thematic maps: each class
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

// @namespace Classification
// @constructor Classification(classes: Object[], options?: Classification options)
// Creates a classification from the given classes. Each class is an object with
// `value` (a value or an array of values) or `lower`/`upper` (a range including
// `lower`, excluding `upper`), a `symbol` (path options), a `legend` label, and
// `counted: false` to exclude the class from the feature count (e.g. "no data").
export class Classification {
	constructor(classes, options) {
		// @section
		// @aka Classification options
		this.options = {
			// @option name: String = ''
			// The name of the classification, shown as title of its legend.
			name: '',

			// @option value: String|Function = undefined
			// The value to classify by: the name of a property of the feature, or a
			// function receiving the feature and returning the value. Without it, the
			// argument of `classify()` is the value itself.
			value: undefined,

			// @option normalize: Function = undefined
			// A function applied to the values of the classes and of the features before
			// comparing them, for tolerant matching, e.g. `v => String(v).trim().toUpperCase()`.
			normalize: undefined,

			// @option otherValues: Object = undefined
			// The class of all values not matching any other class, with `symbol` and
			// `legend` (default "All other values"). Without it, such features are not
			// classified.
			otherValues: undefined,
			...options
		};

		this._classes = classes;
		this._values = new Map();
		this._labels = new Map();
		const ranges = [];
		for (const cls of classes) {
			if ('value' in cls) {
				for (const value of Array.isArray(cls.value) ? cls.value : [cls.value]) {
					const key = this._normalize(value);
					if (!this._values.has(key)) { this._values.set(key, cls); }
				}
			} else {
				ranges.push(cls);
			}
			if (cls.legend !== undefined && !this._labels.has(this._normalize(cls.legend))) {
				this._labels.set(this._normalize(cls.legend), cls);
			}
		}
		this._ranges = ranges.sort((a, b) => (a.lower ?? -Infinity) - (b.lower ?? -Infinity));

		const other = this.options.otherValues;
		this._other = other && {legend: I18n.translate('All other values'), ...other};

		// @method style(feature: Object): Object
		// Returns the symbol of the class of the feature (an empty object for features
		// without class), bound to the classification for the `style` option of `GeoJSON`.
		this.style = this.style.bind(this);
	}

	// @method classify(feature: Object): Object
	// Returns the class of the given GeoJSON feature, of a layer with a `feature`
	// (as created by `GeoJSON`) or, without the `value` option, of a value: one of the
	// classes passed to the constructor, the `otherValues` class or `undefined`.
	classify(feature) {
		const value = this._normalize(this._getValue(feature?.feature ?? feature));
		return this._values.get(value) ?? this._findRange(value) ?? this._labels.get(value) ?? this._other;
	}

	style(feature) {
		return this.classify(feature)?.symbol ?? {};
	}

	// @method legendItems(): Object[]
	// Returns the items of the legend, `{legend, symbol, counted, classes}`, in the order
	// of the classes and `otherValues` last. Classes with the same legend label and
	// symbol share one item.
	legendItems() {
		return this._getItems().items;
	}

	// @method featureCount(features: Object[]): Object[]
	// Counts the given features (or layers with a `feature`) per legend item, returning
	// the legend items with `count` and `share` (the fraction of the counted features).
	// Classes with `counted: false` get a `count`, but no `share`, and do not count
	// toward the total.
	featureCount(features) {
		const {items, itemOf} = this._getItems(),
		counts = new Map(items.map(item => [item, 0]));
		for (const feature of features) {
			const item = itemOf.get(this.classify(feature));
			if (item) { counts.set(item, counts.get(item) + 1); }
		}
		const total = items.reduce((sum, item) => sum + (item.counted ? counts.get(item) : 0), 0);
		return items.map(item => ({
			...item,
			count: counts.get(item),
			share: item.counted ? (total ? counts.get(item) / total : 0) : undefined
		}));
	}

	_getValue(feature) {
		const {value} = this.options;
		if (typeof value === 'function') { return value(feature); }
		if (value === undefined) { return feature; }
		return feature?.properties?.[value];
	}

	_normalize(value) {
		value ??= null;
		const {normalize} = this.options;
		return normalize && value !== null ? normalize(value) : value;
	}

	// the range with the greatest lower bound not greater than the value (binary search)
	_findRange(value) {
		const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
		if (typeof num !== 'number' || Number.isNaN(num)) { return undefined; }

		const ranges = this._ranges;
		let lo = 0, hi = ranges.length - 1, found;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if ((ranges[mid].lower ?? -Infinity) <= num) {
				found = ranges[mid];
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}
		return found && num < (found.upper ?? Infinity) ? found : undefined;
	}

	_getItems() {
		const items = [],
		itemOf = new Map(),
		byKey = new Map(),
		classes = this._other ? [...this._classes, this._other] : this._classes;
		for (const cls of classes) {
			const legend = cls.legend ?? this._defaultLegend(cls),
			key = `${legend}\u0000${JSON.stringify(cls.symbol ?? {})}`;
			let item = byKey.get(key);
			if (!item) {
				item = {legend, symbol: cls.symbol ?? {}, counted: cls.counted !== false, classes: []};
				byKey.set(key, item);
				items.push(item);
			}
			item.classes.push(cls);
			itemOf.set(cls, item);
		}
		return {items, itemOf};
	}

	_defaultLegend(cls) {
		if ('value' in cls) {
			return [cls.value].flat().map(String).join(', ');
		}
		const format = num => num.toLocaleString(I18n.getLocale() ?? undefined);
		if (cls.lower === undefined) { return `< ${format(cls.upper)}`; }
		if (cls.upper === undefined) { return `≥ ${format(cls.lower)}`; }
		return `${format(cls.lower)}–${format(cls.upper)}`;
	}

	// @section Classification methods
	// @function quantile(values: Number[], n: Number): Object[]
	// Returns `n` ranges `{lower, upper}` with about the same number of the given values
	// each (fewer for repeated values), the first and last range open-ended. Add a
	// `symbol` (and a `legend`) to each to create a `Classification`.
	static quantile(values, n) {
		const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b),
		breaks = [];
		for (let i = 1; i < n && sorted.length; i++) {
			breaks.push(sorted[Math.floor(i * sorted.length / n)]);
		}
		return rangesOf(breaks);
	}

	// @function equalInterval(values: Number[], n: Number): Object[]
	// Returns `n` ranges `{lower, upper}` of equal width between the minimum and the
	// maximum of the given values, the first and last range open-ended.
	static equalInterval(values, n) {
		const finite = values.filter(Number.isFinite);
		if (!finite.length) { return rangesOf([]); }
		const min = Math.min(...finite),
		width = (Math.max(...finite) - min) / n,
		breaks = [];
		for (let i = 1; i < n; i++) {
			breaks.push(min + i * width);
		}
		return rangesOf(breaks);
	}
}

// ranges between the given ascending breaks, open-ended at both ends
function rangesOf(breaks) {
	const unique = [...new Set(breaks)];
	return [undefined, ...unique].map((lower, i) => {
		const range = {};
		if (lower !== undefined) { range.lower = lower; }
		if (i < unique.length) { range.upper = unique[i]; }
		return range;
	});
}
