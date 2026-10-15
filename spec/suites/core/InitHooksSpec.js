import {expect} from 'vite-plus/test';
import {LatLng, MaplairMap, Marker, Path, Polygon, Polyline, Rectangle, TileLayer} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

// Constructor hooks as used by plugins, e.g. `Polyline.addInitHook(function () { this.editing = … })`.
// Hooks registered on library classes stay registered, so they only act on objects created with
// the `initHookTest` option.
describe('Init hooks of library classes', () => {
	let calls;

	function record(name) {
		return function () {
			if (this.options.initHookTest) {
				calls.push([name, this]);
			}
		};
	}

	beforeEach(() => {
		calls = [];
	});

	it('run on fully constructed markers', () => {
		Marker.addInitHook(function () {
			if (this.options.initHookTest) {
				calls.push(['marker', this.getLatLng()]);
			}
		});

		new Marker([1, 2], {initHookTest: true});

		expect(calls).to.eql([['marker', new LatLng(1, 2)]]);
	});

	it('run for classes without own constructor (Polygon) and abstract parent classes (Path)', () => {
		Path.addInitHook(record('path'));
		Polygon.addInitHook(record('polygon'));

		const polygon = new Polygon([[0, 0], [1, 1], [1, 0]], {initHookTest: true});

		expect(calls.map(([name]) => name)).to.eql(['path', 'polygon']);
		expect(calls.every(([, layer]) => layer === polygon)).to.be.true;
		expect(polygon.getLatLngs()[0]).to.have.length(3);
	});

	it('run once per class, parent classes first', () => {
		Polyline.addInitHook(record('polyline'));
		Rectangle.addInitHook(record('rectangle'));

		new Rectangle([[0, 0], [1, 1]], {initHookTest: true});

		expect(calls.map(([name]) => name)).to.eql(['path', 'polyline', 'polygon', 'rectangle']);
	});

	it('see the options passed to the constructor', () => {
		TileLayer.addInitHook(function () {
			if (this.options.initHookTest) {
				calls.push(['tilelayer', this._url, this.options.maxZoom]);
			}
		});

		new TileLayer('https://example.com/{z}/{x}/{y}.png', {initHookTest: true, maxZoom: 7});

		expect(calls).to.eql([['tilelayer', 'https://example.com/{z}/{x}/{y}.png', 7]]);
	});

	it('run on maps after the default handlers were added', () => {
		const container = createContainer();
		MaplairMap.addInitHook(function () {
			if (this.options.initHookTest) {
				calls.push(['map', !!this.dragging, !!this.getPane('markerPane')]);
			}
		});

		const map = new MaplairMap(container, {initHookTest: true});

		expect(calls).to.eql([['map', true, true]]);
		removeMapContainer(map, container);
	});

	it('run for subclasses which call callInitHooks()', () => {
		class MyMarker extends Marker {
			constructor(latlng, options) {
				super(latlng, options);
				this.extra = 'ready';
				this.callInitHooks();
			}
		}
		MyMarker.addInitHook(function () {
			calls.push(['mymarker', this.extra]);
		});

		new MyMarker([0, 0], {initHookTest: true});

		expect(calls.map(c => c[0])).to.eql(['marker', 'mymarker']);
		expect(calls[1]).to.eql(['mymarker', 'ready']);
	});
});
