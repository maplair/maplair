import {expect, vi} from 'vite-plus/test';
import {GeoJSON, MaplairMap} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';
import 'maplair/geojson-loading';

describe('GeoJSON: loading', () => {
	let container, map, requests;

	const point = {type: 'Feature', properties: {name: 'A'}, geometry: {type: 'Point', coordinates: [11.40, 47.27]}},
	square = {type: 'Feature', properties: {}, geometry: {type: 'Polygon', coordinates: [[[10, 40], [20, 40], [20, 50], [10, 50], [10, 40]]]}};

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView([0, 0], 2);
		requests = [];
	});

	afterEach(() => {
		removeMapContainer(map, container);
		vi.restoreAllMocks();
	});

	// Mocks `fetch()`: `respond(request)` returns a Response, or `undefined` to never respond.
	function mockFetch(respond) {
		vi.spyOn(window, 'fetch').mockImplementation((input, init) => {
			const request = {url: input, init};
			requests.push(request);
			const response = respond(request);
			if (response) {
				return Promise.resolve(response);
			}
			return new Promise((resolve, reject) => {
				init.signal.addEventListener('abort', () => reject(init.signal.reason));
			});
		});
	}

	const json = data => new Response(JSON.stringify(data), {headers: {'Content-Type': 'application/geo+json'}});

	it('loads data from a URL, replacing the layers', async () => {
		mockFetch(({url}) => json(url === 'a.json' ? point : square));
		const layer = new GeoJSON(square).addTo(map),
		load = vi.fn();
		layer.on('load', load);

		expect(await layer.load('a.json', {headers: {Authorization: 'Bearer secret'}})).to.equal(layer);
		expect(requests[0].init.headers).to.eql({Authorization: 'Bearer secret'});
		expect(layer.getLayers().length).to.equal(1);
		expect(layer.getLayers()[0].feature.properties.name).to.equal('A');
		expect(load).toHaveBeenCalledOnce();
		expect(load.mock.calls[0][0].data).to.eql(point);
	});

	it('loads the url option when created, with fetchOptions', async () => {
		mockFetch(() => json(point));
		const layer = new GeoJSON(null, {url: 'a.json', fetchOptions: {credentials: 'include'}});
		await new Promise((resolve) => { layer.once('load', resolve); });
		expect(requests[0].url).to.equal('a.json');
		expect(requests[0].init.credentials).to.equal('include');
		expect(layer.getLayers().length).to.equal(1);
	});

	it('accepts a promise of the data', async () => {
		const layer = new GeoJSON();
		await layer.load(Promise.resolve(square));
		expect(layer.getLayers().length).to.equal(1);
	});

	it('aborts a running load', async () => {
		mockFetch(({url}) => (url === 'slow.json' ? undefined : json(square)));
		const layer = new GeoJSON().addTo(map),
		error = vi.fn();
		layer.on('error', error);
		const slow = layer.load('slow.json');
		await layer.load('fast.json');
		expect(requests[0].init.signal.aborted).to.be.true;
		expect(await slow).to.equal(layer);
		expect(error).not.toHaveBeenCalled();
		expect(layer.getLayers().length).to.equal(1);
	});

	it('fires error and rejects on failure', async () => {
		mockFetch(() => new Response('', {status: 404, statusText: 'Not Found'}));
		const layer = new GeoJSON(square),
		error = vi.fn();
		layer.on('error', error);
		await expect(layer.load('missing.json')).rejects.toThrow('404 Not Found');
		expect(error).toHaveBeenCalledOnce();
		// the previous data is kept
		expect(layer.getLayers().length).to.equal(1);
	});

	it('fits the bounds with the fitBounds option', async () => {
		const layer = new GeoJSON(null, {fitBounds: true}).addTo(map);
		await layer.load(Promise.resolve(square));
		expect(map.getBounds().contains(layer.getBounds())).to.be.true;
		expect(map.getZoom()).to.be.greaterThan(2);
	});
});
