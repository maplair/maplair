import {expect} from 'vite-plus/test';
import {CircleMarker, MaplairMap, Path, Polyline} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';
import 'maplair/zoom-styles';

describe('Path: zoom-dependent styles', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false});
		map.setView([0, 0], 5);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	it('uses the value of the highest zoom stop not above the zoom', () => {
		const marker = new CircleMarker([0, 0], {radius: {5: 3, 10: 6, 15: 10}}).addTo(map);
		expect(marker.getRadius()).to.equal(3);
		map.setZoom(12);
		expect(marker.getRadius()).to.equal(6);
		map.setZoom(15);
		expect(marker.getRadius()).to.equal(10);
		map.setZoom(2);
		// below the lowest stop
		expect(marker.getRadius()).to.equal(3);
	});

	it('accepts functions of the zoom for the weight', () => {
		const line = new Polyline([[0, 0], [1, 1]], {weight: zoom => zoom / 2}).addTo(map);
		expect(line.options.weight).to.equal(2.5);
		expect(line._path.getAttribute('stroke-width')).to.equal('2.5');
		map.setZoom(8);
		expect(line._path.getAttribute('stroke-width')).to.equal('4');
	});

	it('interpolates between zoom stops with Path.interpolate()', () => {
		const weight = Path.interpolate({5: 1, 15: 11});
		expect(weight(0)).to.equal(1);
		expect(weight(5)).to.equal(1);
		expect(weight(7.5)).to.equal(3.5);
		expect(weight(15)).to.equal(11);
		expect(weight(20)).to.equal(11);

		const line = new Polyline([[0, 0], [1, 1]], {weight}).addTo(map);
		map.setZoom(10);
		expect(line.options.weight).to.equal(6);
	});

	it('takes zoom-dependent styles from setStyle() and setRadius()', () => {
		const marker = new CircleMarker([0, 0], {radius: 4, weight: 1}).addTo(map);
		marker.setStyle({weight: {0: 2, 8: 5}});
		expect(marker.options.weight).to.equal(2);
		marker.setRadius({0: 7, 8: 9});
		expect(marker.getRadius()).to.equal(7);
		map.setZoom(8);
		expect(marker.options.weight).to.equal(5);
		expect(marker.getRadius()).to.equal(9);

		// numbers replace the zoom-dependent styles
		marker.setStyle({weight: 1});
		marker.setRadius(4);
		map.setZoom(5);
		expect(marker.options.weight).to.equal(1);
		expect(marker.getRadius()).to.equal(4);
	});

	it('applies the zoom of the map the path is added to', () => {
		const marker = new CircleMarker([0, 0], {radius: {5: 3, 10: 6}});
		map.setZoom(10);
		marker.addTo(map);
		expect(marker.getRadius()).to.equal(6);
		expect(marker._pxRadius).to.equal(6);
	});

	it('keeps plain styles unchanged', () => {
		const marker = new CircleMarker([0, 0], {radius: 4}).addTo(map);
		map.setZoom(10);
		expect(marker.getRadius()).to.equal(4);
	});
});
