import {expect} from 'vite-plus/test';
import {Classification, GeoJSON, CircleMarker} from 'maplair';

const point = properties => ({type: 'Feature', properties, geometry: {type: 'Point', coordinates: [0, 0]}});

describe('Classification', () => {
	const noData = {value: null, symbol: {fillColor: '#000000'}, legend: 'No data', counted: false},
	cold = {upper: 0, symbol: {fillColor: '#5bc0de'}, legend: '< 0 °C'},
	mild = {lower: 0, upper: 10, symbol: {fillColor: '#33ee33'}, legend: '0–10 °C'},
	warm = {lower: 10, symbol: {fillColor: '#f0a030'}, legend: '≥ 10 °C'},
	error = {value: 'n/a', symbol: {fillColor: '#ff0000'}, legend: 'Error'};

	function temperature(options) {
		return new Classification([noData, warm, cold, mild, error], {value: 'temperature', ...options});
	}

	describe('#classify', () => {
		it('classifies by range, including the lower and excluding the upper bound', () => {
			const c = temperature();
			expect(c.classify(point({temperature: -20}))).to.equal(cold);
			expect(c.classify(point({temperature: 0}))).to.equal(mild);
			expect(c.classify(point({temperature: 9.9}))).to.equal(mild);
			expect(c.classify(point({temperature: 10}))).to.equal(warm);
			expect(c.classify(point({temperature: 1000}))).to.equal(warm);
			expect(c.classify(point({temperature: '5'}))).to.equal(mild);
		});

		it('classifies by value before range, missing values as null', () => {
			const c = temperature();
			expect(c.classify(point({temperature: 'n/a'}))).to.equal(error);
			expect(c.classify(point({temperature: null}))).to.equal(noData);
			expect(c.classify(point({}))).to.equal(noData);
		});

		it('classifies several values sharing a class', () => {
			const sBahn = {value: ['S1', 'S2'], symbol: {color: '#1f78b4'}, legend: 'S-Bahn'};
			const c = new Classification([sBahn], {value: f => f.properties.line});
			expect(c.classify(point({line: 'S1'}))).to.equal(sBahn);
			expect(c.classify(point({line: 'S2'}))).to.equal(sBahn);
			expect(c.classify(point({line: 'S3'}))).to.be.undefined;
		});

		it('matches tolerantly with normalize and by legend label', () => {
			const sBahn = {value: 'S1', legend: 'S-Bahn'};
			const c = new Classification([sBahn], {normalize: v => String(v).trim().toUpperCase()});
			expect(c.classify(' s1 ')).to.equal(sBahn);
			expect(c.classify('s-bahn')).to.equal(sBahn);
		});

		it('falls back to all other values', () => {
			const c = temperature({otherValues: {symbol: {fillColor: '#cccccc'}}});
			const other = c.classify(point({temperature: 'unknown'}));
			expect(other.legend).to.equal('All other values');
			expect(other.symbol).to.eql({fillColor: '#cccccc'});
			expect(temperature().classify(point({temperature: 'unknown'}))).to.be.undefined;
		});

		it('classifies a value without the value option, and layers by their feature', () => {
			const c = new Classification([mild]);
			expect(c.classify(5)).to.equal(mild);

			const layer = new GeoJSON(point({temperature: 5})).getLayers()[0];
			expect(temperature().classify(layer)).to.equal(mild);
		});
	});

	it('styles GeoJSON features with style', () => {
		const c = temperature();
		const layer = new GeoJSON({type: 'FeatureCollection', features: [point({temperature: 5}), point({temperature: 'x'})]}, {
			pointToLayer: (feature, latlng) => new CircleMarker(latlng, {color: '#ffffff'}),
			style: c.style
		});
		const [first, second] = layer.getLayers();
		expect(first.options.fillColor).to.equal('#33ee33');
		expect(first.options.color).to.equal('#ffffff');
		expect(second.options.fillColor).to.equal(CircleMarker.prototype.options.fillColor);
	});

	it('merges classes with the same legend label and symbol into one legend item', () => {
		const c = new Classification([
			{value: 'S1', symbol: {color: '#1f78b4'}, legend: 'S-Bahn'},
			{value: 'S2', symbol: {color: '#1f78b4'}, legend: 'S-Bahn'},
			{value: 'S3', symbol: {color: '#ff0000'}, legend: 'S-Bahn'},
			{lower: 0, upper: 1.5}
		], {otherValues: {legend: 'Other'}});
		const items = c.legendItems();
		expect(items.map(item => item.legend)).to.eql(['S-Bahn', 'S-Bahn', '0–1.5', 'Other']);
		expect(items[0].classes.length).to.equal(2);
	});

	it('counts features per legend item, excluding uncounted classes from the total', () => {
		const c = temperature();
		const features = [-5, 2, 3, 4, 12, null, null].map(temperature => point({temperature}));
		const counts = c.featureCount(features);
		expect(counts.map(({legend, count, share}) => [legend, count, share])).to.eql([
			['No data', 2, undefined],
			['≥ 10 °C', 1, 0.2],
			['< 0 °C', 1, 0.2],
			['0–10 °C', 3, 0.6],
			['Error', 0, 0]
		]);
	});

	describe('classification methods', () => {
		it('computes quantile ranges', () => {
			expect(Classification.quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, NaN], 3)).to.eql([
				{upper: 4}, {lower: 4, upper: 7}, {lower: 7}
			]);
			expect(Classification.quantile([1, 1, 1, 1], 2)).to.eql([{upper: 1}, {lower: 1}]);
		});

		it('computes equal interval ranges', () => {
			expect(Classification.equalInterval([0, 10, 3], 2)).to.eql([{upper: 5}, {lower: 5}]);
			expect(Classification.equalInterval([], 2)).to.eql([{}]);
		});
	});
});
