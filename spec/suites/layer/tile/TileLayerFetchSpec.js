import {expect, vi} from 'vite-plus/test';
import {MaplairMap, TileLayer} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

const tileUrlRe = /^https:\/\/tiles\.example\.com\/2\/\d\/\d\.gif$/;
const blobUrlRe = /^blob:/;

describe('TileLayer: fetchOptions', () => {
	let container, map, requests;
	// a transparent 1×1 GIF
	const gif = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));
	const url = 'https://tiles.example.com/{z}/{x}/{y}.gif';

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
	function mockFetch(respond = () => new Response(gif, {headers: {'Content-Type': 'image/gif'}})) {
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

	function nextEvent(layer, type) {
		return new Promise((resolve) => {
			layer.once(type, resolve);
		});
	}

	it('loads the tiles with fetch() and the given options', async () => {
		mockFetch();
		const layer = new TileLayer(url, {fetchOptions: {headers: {Authorization: 'Bearer secret'}}});
		const load = nextEvent(layer, 'load');
		layer.addTo(map);
		await load;

		const tiles = Object.values(layer._tiles);
		expect(tiles.length).to.be.greaterThan(0);
		expect(requests).to.have.length(tiles.length);
		for (const {url: requestUrl, init} of requests) {
			expect(requestUrl).to.match(tileUrlRe);
			expect(init.headers).to.eql({Authorization: 'Bearer secret'});
			expect(init.referrerPolicy).to.equal('strict-origin-when-cross-origin');
			expect(init.signal).to.be.instanceOf(AbortSignal);
		}
		for (const tile of tiles) {
			expect(tile.el.src).to.match(blobUrlRe);
			expect(tile.el.naturalWidth).to.equal(1);
		}
	});

	it('revokes the object URLs once loaded', async () => {
		mockFetch();
		const revoke = vi.spyOn(URL, 'revokeObjectURL');
		const layer = new TileLayer(url, {fetchOptions: {}});
		const load = nextEvent(layer, 'load');
		layer.addTo(map);
		await load;
		expect(revoke).toHaveBeenCalledTimes(requests.length);
	});

	it('does not use fetch() by default', () => {
		mockFetch();
		new TileLayer(url).addTo(map);
		expect(requests).to.have.length(0);
	});

	it('fires tileerror for failed requests and shows errorTileUrl', async () => {
		mockFetch(() => new Response('Unauthorized', {status: 401}));
		const errorTileUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
		const layer = new TileLayer(url, {fetchOptions: {}, errorTileUrl});
		const tileerror = nextEvent(layer, 'tileerror');
		layer.addTo(map);
		const e = await tileerror;
		expect(e.error.message).to.contain('HTTP 401');
		expect(e.tile.src).to.equal(errorTileUrl);
	});

	it('aborts the requests when removing the layer', () => {
		mockFetch(() => undefined);
		const layer = new TileLayer(url, {fetchOptions: {}}).addTo(map);
		const tileerror = vi.fn();
		layer.on('tileerror', tileerror);
		expect(requests.length).to.be.greaterThan(0);
		layer.remove();
		for (const {init} of requests) {
			expect(init.signal.aborted).to.be.true;
		}
		expect(tileerror).not.toHaveBeenCalled();
	});

	it('aborts the requests of tiles no longer needed after zooming', () => {
		mockFetch(() => undefined);
		new TileLayer(url, {fetchOptions: {}}).addTo(map);
		const before = [...requests];

		map.setZoom(5);
		expect(requests.length).to.be.greaterThan(before.length);
		for (const {init} of before) {
			expect(init.signal.aborted).to.be.true;
		}
		for (const {init} of requests.slice(before.length)) {
			expect(init.signal.aborted).to.be.false;
		}
	});

	it('fires tileabort for requests aborted during a zoom animation', async () => {
		map.remove();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: true});
		map.setView([0, 0], 2);
		mockFetch(() => undefined);
		const layer = new TileLayer(url, {fetchOptions: {}}).addTo(map);
		const tileabort = vi.fn();
		layer.on('tileabort', tileabort);
		const before = [...requests];

		const zoomend = new Promise((resolve) => {
			map.once('zoomend', resolve);
		});
		map.setZoom(3, {animate: true});
		await zoomend;
		expect(tileabort).toHaveBeenCalledTimes(before.length);
		for (const {init} of before) {
			expect(init.signal.aborted).to.be.true;
		}
	});
});
