import {expect} from 'vite-plus/test';
import {GridLayer, Hash, LayersControl, MaplairMap} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';
import 'maplair/map-rotation';

describe('Hash', () => {
	let container, map, hash;

	beforeEach(() => {
		history.replaceState(null, '', location.pathname + location.search);
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false});
	});

	afterEach(() => {
		hash?.remove();
		hash = null;
		removeMapContainer(map, container);
		history.replaceState(null, '', location.pathname + location.search);
	});

	function setHash(value) {
		return new Promise((resolve) => {
			window.addEventListener('hashchange', resolve, {once: true});
			location.hash = value;
		});
	}

	describe('parse and format', () => {
		it('parses hashes', () => {
			const view = Hash.parse('#13/47.2692/11.4041');
			expect(view.zoom).to.equal(13);
			expect(view.center).to.be.nearLatLng([47.2692, 11.4041]);
			expect(view.bearing).to.be.undefined;
			expect(Hash.parse('#5.5/1/2/30').bearing).to.equal(30);
		});

		it('rejects other hashes', () => {
			for (const value of ['', '#', '#about', '#1/2', '#1/2/x', '#1//2', '#1/2/3/4/5', '#1/2/3/x']) {
				expect(Hash.parse(value), value).to.be.undefined;
			}
		});

		it('formats the view with a precision of about a pixel', () => {
			map.setView([47.26923456, 11.40412345], 13);
			expect(Hash.format(map)).to.equal('#13/47.2692/11.4041');
			map.setView([47.26923456, 11.40412345], 3);
			expect(Hash.format(map)).to.equal('#3/47.3/11.4');
			map.options.zoomSnap = 0;
			map.setZoom(3.256);
			expect(Hash.format(map).startsWith('#3.26/')).to.be.true;
		});

		it('parses geo URIs', () => {
			const view = Hash.parse('#geo:47.2692,-11.4041?z=13.5');
			expect(view.zoom).to.equal(13.5);
			expect(view.center).to.be.nearLatLng([47.2692, -11.4041]);
			expect(Hash.parse('#geo:1,2?z=3&bearing=45').bearing).to.equal(45);
			// without zoom
			expect(Hash.parse('#geo:1,2').zoom).to.be.undefined;
			// with altitude
			expect(Hash.parse('#geo:1,2,3').center).to.be.nearLatLng([1, 2]);
			for (const value of ['#geo:', '#geo:1', '#geo:1,x', '#geo:1,2?z=x', '#geo:91,2']) {
				expect(Hash.parse(value), value).to.be.undefined;
			}
		});

		it('formats geo URIs', () => {
			map.setView([47.26923456, 11.40412345], 13);
			expect(Hash.format(map, 'geo')).to.equal('#geo:47.2692,11.4041?z=13');
			map.setBearing(30);
			expect(Hash.format(map, 'geo')).to.equal('#geo:47.2692,11.4041?z=13&bearing=30');
		});

		it('adds the bearing of a rotated map', () => {
			map.setView([1, 2], 4);
			map.setBearing(30.04);
			expect(Hash.format(map)).to.equal('#4/1.00/2.00/30');
		});
	});

	it('writes the view to the hash when it changes', () => {
		map.setView([47.27, 11.40], 13);
		hash = new Hash(map);
		expect(location.hash).to.equal('#13/47.2700/11.4000');

		const historyLength = history.length;
		map.setView([48, 12], 10);
		expect(location.hash).to.equal('#10/48.000/12.000');
		// without adding to the history
		expect(history.length).to.equal(historyLength);
	});

	it('restores the view from the hash when created', () => {
		history.replaceState(null, '', '#10/48.0000/12.0000/90');
		hash = new Hash(map);
		expect(map.getZoom()).to.equal(10);
		expect(map.getCenter()).to.be.nearLatLng([48, 12]);
		expect(map.getBearing()).to.equal(90);
	});

	it('writes geo URIs with the format option', () => {
		map.setView([47.27, 11.40], 13);
		hash = new Hash(map, {format: 'geo'});
		expect(location.hash).to.equal('#geo:47.2700,11.4000?z=13');
		map.setView([48, 12], 10);
		expect(location.hash).to.equal('#geo:48.000,12.000?z=10');
	});

	it('restores the view from geo URIs in either format', async () => {
		map.setView([0, 0], 2);
		hash = new Hash(map);
		await setHash('#geo:10.000,20.000?z=7');
		expect(map.getZoom()).to.equal(7);
		expect(map.getCenter()).to.be.nearLatLng([10, 20]);

		// keeping the zoom
		await setHash('#geo:11.000,21.000');
		expect(map.getZoom()).to.equal(7);
		// panned by whole pixels
		expect(map.getCenter()).to.be.nearLatLng([11, 21], 0.01);
	});

	it('follows changes of the hash', async () => {
		map.setView([0, 0], 2);
		hash = new Hash(map);
		await setHash('#7/10.000/20.000');
		expect(map.getZoom()).to.equal(7);
		expect(map.getCenter()).to.be.nearLatLng([10, 20]);
	});

	it('ignores other hashes', async () => {
		map.setView([0, 0], 2);
		hash = new Hash(map);
		await setHash('#about');
		expect(map.getZoom()).to.equal(2);
	});

	it('stops when removed', async () => {
		map.setView([0, 0], 2);
		hash = new Hash(map);
		hash.remove();
		map.setView([10, 10], 5);
		expect(location.hash).to.equal('#2/0.0/0.0');
		await setHash('#7/10.000/20.000');
		expect(map.getZoom()).to.equal(5);
	});

	describe('layers', () => {
		let osm, topo, bikes, labels, layers;

		function gridLayer() {
			const grid = new GridLayer();
			grid.createTile = () => document.createElement('div');
			return grid;
		}

		beforeEach(() => {
			osm = gridLayer();
			topo = gridLayer();
			bikes = gridLayer();
			labels = gridLayer();
			layers = {OSM: osm, Topo: topo, 'Bike, routes': bikes, Labels: labels};
		});

		it('formats and parses the names of the layers', () => {
			map.setView([1, 2], 4);
			osm.addTo(map);
			bikes.addTo(map);
			const value = Hash.format(map, 'zoom/lat/lng', layers);
			expect(value).to.equal('#4/1.00/2.00?layers=OSM,Bike%2C%20routes');
			expect(Hash.parse(value).layers).to.eql(['OSM', 'Bike, routes']);
			expect(Hash.format(map, 'geo', layers)).to.equal('#geo:1.00,2.00?z=4&layers=OSM,Bike%2C%20routes');
			expect(Hash.parse('#geo:1,2?z=4&layers=Topo').layers).to.eql(['Topo']);
			expect(Hash.parse('#4/1/2?layers=').layers).to.eql([]);
			expect(Hash.parse('#4/1/2').layers).to.be.undefined;
		});

		it('writes the layers on the map to the hash', () => {
			map.setView([1, 2], 4);
			osm.addTo(map);
			hash = new Hash(map, {layers});
			expect(location.hash).to.equal('#4/1.00/2.00?layers=OSM');

			labels.addTo(map);
			expect(location.hash).to.equal('#4/1.00/2.00?layers=OSM,Labels');
			osm.remove();
			topo.addTo(map);
			expect(location.hash).to.equal('#4/1.00/2.00?layers=Topo,Labels');
		});

		it('restores the layers from the hash, with a layers control', async () => {
			const control = new LayersControl({OSM: osm, Topo: topo}, {'Bike, routes': bikes, Labels: labels}).addTo(map);
			map.setView([1, 2], 4);
			osm.addTo(map);
			labels.addTo(map);
			hash = new Hash(map, {layers, format: 'geo'});

			await setHash('#geo:1.00,2.00?z=4&layers=Topo,Bike%2C%20routes');
			expect(map.hasLayer(topo)).to.be.true;
			expect(map.hasLayer(bikes)).to.be.true;
			expect(map.hasLayer(osm)).to.be.false;
			expect(map.hasLayer(labels)).to.be.false;
			// the checkboxes of the control follow
			const checked = [...control.getContainer().querySelectorAll('input')].filter(i => i.checked).map(i => i.nextSibling.textContent.trim());
			expect(checked).to.eql(['Topo', 'Bike, routes']);
			expect(location.hash).to.equal('#geo:1.00,2.00?z=4&layers=Topo,Bike%2C%20routes');
		});

		it('keeps the layers for hashes without them', async () => {
			map.setView([1, 2], 4);
			osm.addTo(map);
			hash = new Hash(map, {layers});
			await setHash('#5/1.00/2.00');
			expect(map.getZoom()).to.equal(5);
			expect(map.hasLayer(osm)).to.be.true;
			expect(location.hash).to.equal('#5/1.00/2.00?layers=OSM');
		});

		it('restores the layers when created', () => {
			history.replaceState(null, '', '#4/1.00/2.00?layers=Labels');
			osm.addTo(map);
			hash = new Hash(map, {layers});
			expect(map.hasLayer(labels)).to.be.true;
			expect(map.hasLayer(osm)).to.be.false;
		});
	});

	describe('query mode', () => {
		let original;

		beforeEach(() => {
			original = location.search;
		});

		afterEach(() => {
			history.replaceState(null, '', location.pathname + original);
		});

		function setSearch(params) {
			const search = new URLSearchParams(original);
			for (const [name, value] of Object.entries(params)) {
				search.set(name, value);
			}
			history.replaceState(null, '', `${location.pathname}?${search}`);
		}

		it('parses and formats query strings', () => {
			const view = Hash.parseQuery('?q=cafe&zoom=13&lat=47.2692&lng=11.4041&bearing=30&layers=A,B%2CC');
			expect(view.zoom).to.equal(13);
			expect(view.center).to.be.nearLatLng([47.2692, 11.4041]);
			expect(view.bearing).to.equal(30);
			expect(view.layers).to.eql(['A', 'B,C']);
			expect(Hash.parseQuery('?lat=1&lng=2').zoom).to.be.undefined;
			for (const value of ['', '?', '?q=cafe', '?lat=1', '?lat=1&lng=x']) {
				expect(Hash.parseQuery(value), value).to.be.undefined;
			}

			map.setView([47.2692, 11.4041], 13);
			expect(Hash.formatQuery(map, undefined, '?q=cafe&zoom=1&lat=0')).to.equal('?q=cafe&zoom=13&lat=47.2692&lng=11.4041');
			expect(Hash.formatQuery(map)).to.equal('?zoom=13&lat=47.2692&lng=11.4041');
		});

		it('writes the view to the query string, keeping the other parameters and the hash', () => {
			setSearch({q: 'cafe'});
			history.replaceState(null, '', `${location.search}#section`);
			map.setView([47.2692, 11.4041], 13);
			hash = new Hash(map, {mode: 'query'});
			const params = new URLSearchParams(location.search);
			expect(params.get('q')).to.equal('cafe');
			expect(params.get('zoom')).to.equal('13');
			expect(params.get('lat')).to.equal('47.2692');
			expect(params.get('lng')).to.equal('11.4041');
			expect(location.hash).to.equal('#section');

			map.setView([48, 12], 10);
			expect(new URLSearchParams(location.search).get('zoom')).to.equal('10');
			expect(location.hash).to.equal('#section');
		});

		it('restores the view from the query string and on popstate', () => {
			setSearch({zoom: '13', lat: '47.2692', lng: '11.4041'});
			hash = new Hash(map, {mode: 'query'});
			expect(map.getZoom()).to.equal(13);
			expect(map.getCenter()).to.be.nearLatLng([47.2692, 11.4041]);

			setSearch({zoom: '10', lat: '48', lng: '12'});
			window.dispatchEvent(new PopStateEvent('popstate'));
			expect(map.getZoom()).to.equal(10);
			expect(map.getCenter()).to.be.nearLatLng([48, 12]);
		});

		it('keeps the layers in the query string', () => {
			const a = new GridLayer(), b = new GridLayer();
			setSearch({zoom: '5', lat: '1', lng: '2', layers: 'B'});
			a.addTo(map);
			hash = new Hash(map, {mode: 'query', layers: {A: a, B: b}});
			expect(map.hasLayer(a)).to.be.false;
			expect(map.hasLayer(b)).to.be.true;

			a.addTo(map);
			expect(new URLSearchParams(location.search).get('layers')).to.equal('A,B');
		});

		it('ignores the hash in query mode', () => {
			map.setView([1, 2], 5);
			history.replaceState(null, '', `${location.pathname}${original}#13/47.2692/11.4041`);
			hash = new Hash(map, {mode: 'query'});
			expect(map.getZoom()).to.equal(5);
			expect(location.hash).to.equal('#13/47.2692/11.4041');
		});
	});
});
