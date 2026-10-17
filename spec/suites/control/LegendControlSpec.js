import {expect} from 'vite-plus/test';
import {MaplairMap, LegendControl, Classification, GeoJSON, CircleMarker, Layer, Polygon, Polyline, FeatureGroup} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

const nextFrame = () => new Promise(requestAnimationFrame);
const point = temperature => ({type: 'Feature', properties: {temperature}, geometry: {type: 'Point', coordinates: [0, 0]}});

describe('LegendControl', () => {
	let container, map, temperature;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);
		map.setView([0, 0], 1);
		temperature = new Classification([
			{value: null, symbol: {fillColor: '#000000'}, legend: 'No data', counted: false},
			{upper: 10, symbol: {fillColor: '#33ee33'}, legend: '< 10 °C'},
			{lower: 10, symbol: {fillColor: '#f0a030'}, legend: '≥ 10 °C'}
		], {name: 'Air temperature', value: 'temperature'});
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function stationsLayer(values) {
		return new GeoJSON({type: 'FeatureCollection', features: values.map(point)}, {
			pointToLayer: (feature, latlng) => new CircleMarker(latlng, {color: '#ffffff'}),
			style: temperature.style
		});
	}

	const labels = control => Array.from(control.getContainer().querySelectorAll('li'), li => li.textContent);

	it('is hidden while empty, above the attribution', () => {
		const control = new LegendControl().addTo(map);
		const el = control.getContainer();
		expect(el.hidden).to.be.true;
		expect(el.nextSibling).to.equal(map.attributionControl.getContainer());
		expect(el.querySelector('summary').textContent).to.equal('Legend');
		expect(el.querySelector('details').open).to.be.true;
		expect(new LegendControl({collapsed: true}).addTo(map).getContainer().querySelector('details').open).to.be.false;
	});

	it('shows the classes of a classified layer with feature counts and a bar', async () => {
		const stations = stationsLayer([5, 5, 5, 15, null]).addTo(map);
		const control = new LegendControl({featureCount: true, bar: true}).addTo(map).addClassification(stations, temperature);
		await nextFrame();

		const el = control.getContainer();
		expect(el.hidden).to.be.false;
		expect(el.querySelector('.maplair-control-legend-name').textContent).to.equal('Air temperature');
		expect(el.querySelector('.maplair-control-legend-total').textContent).to.equal('4 features');
		expect(labels(control)).to.eql(['No data', '< 10 °C3 (75%)', '≥ 10 °C1 (25%)']);

		const bar = el.querySelector('.maplair-control-legend-bar');
		expect(bar.getAttribute('role')).to.equal('img');
		expect(bar.getAttribute('aria-label')).to.equal('< 10 °C: 3 (75%), ≥ 10 °C: 1 (25%)');
		expect(Array.from(bar.children, part => part.style.flexGrow)).to.eql(['3', '1']);
	});

	it('draws the patches in the style of the features', async () => {
		const stations = stationsLayer([5]).addTo(map);
		const control = new LegendControl().addTo(map).addClassification(stations, temperature);
		await nextFrame();

		const [noData, mild] = control.getContainer().querySelectorAll('.maplair-control-legend-patch circle');
		expect(mild.getAttribute('fill')).to.equal('#33ee33');
		expect(mild.getAttribute('stroke')).to.equal('#ffffff');
		// no feature of the class: its symbol over the style of another feature
		expect(noData.getAttribute('fill')).to.equal('#000000');
		expect(noData.getAttribute('stroke')).to.equal('#ffffff');
	});

	it('draws squares for polygons and lines for polylines', async () => {
		const zones = new FeatureGroup([new Polygon([[0, 0], [1, 1], [1, 0]])]).addTo(map);
		const roads = new FeatureGroup([new Polyline([[0, 0], [1, 1]])]).addTo(map);
		const classes = new Classification([{value: 'a', legend: 'A'}], {value: () => 'a'});
		const control = new LegendControl().addTo(map).addClassification(zones, classes).addClassification(roads, classes);
		await nextFrame();

		const patches = control.getContainer().querySelectorAll('.maplair-control-legend-patch');
		expect(patches[0].firstChild.tagName).to.equal('rect');
		expect(patches[1].firstChild.tagName).to.equal('line');
		expect(patches[1].firstChild.getAttribute('fill')).to.equal('none');
	});

	it('updates when features are added and removed, and while the layer is on the map', async () => {
		const stations = stationsLayer([5]).addTo(map);
		const control = new LegendControl({featureCount: true}).addTo(map).addClassification(stations, temperature);
		await nextFrame();
		expect(labels(control)[1]).to.equal('< 10 °C1 (100%)');

		stations.clearLayers().addData([point(15), point(15), point(2)]);
		await nextFrame();
		expect(labels(control).slice(1)).to.eql(['< 10 °C1 (33.3%)', '≥ 10 °C2 (66.7%)']);

		stations.remove();
		await nextFrame();
		expect(control.getContainer().hidden).to.be.true;

		stations.addTo(map);
		await nextFrame();
		expect(control.getContainer().hidden).to.be.false;

		control.removeClassification(stations);
		await nextFrame();
		expect(control.getContainer().hidden).to.be.true;
	});

	it('collects the legends of layers implementing getLegend', async () => {
		class LegendLayer extends Layer {
			onAdd() {}
			onRemove() {}
			getLegend() {
				return this.legend;
			}
		}
		const layer = new LegendLayer();
		layer.legend = '<b>Rain</b>';
		const control = new LegendControl().addTo(map);
		layer.addTo(map);
		await nextFrame();
		expect(control.getContainer().querySelector('.maplair-control-legend-list').innerHTML).to.contain('<b>Rain</b>');

		const el = document.createElement('img');
		layer.legend = el;
		layer.fire('legendchange');
		await nextFrame();
		expect(el.parentNode.parentNode).to.equal(control.getContainer().querySelector('.maplair-control-legend-list'));

		layer.remove();
		await nextFrame();
		expect(control.getContainer().hidden).to.be.true;
		expect(layer.listens('legendchange')).to.be.false;
	});
});
