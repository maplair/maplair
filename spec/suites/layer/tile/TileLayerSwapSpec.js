import {expect, vi} from 'vite-plus/test';
import {GridLayer, MaplairMap, TileLayer} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('TileLayer: flicker-free setUrl and placeholder', () => {
	let container, map, pending;
	// a transparent 1×1 GIF
	const gif = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));

	function createMap(options) {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false, ...options});
		map.setView([0, 0], 2);
	}

	beforeEach(() => {
		pending = [];
		// The tiles load when calling `respond()`, see the `fetchOptions` option.
		vi.spyOn(window, 'fetch').mockImplementation((url, init) => new Promise((resolve, reject) => {
			pending.push({url, respond: () => resolve(new Response(gif))});
			init.signal.addEventListener('abort', () => reject(init.signal.reason));
		}));
	});

	afterEach(() => {
		removeMapContainer(map, container);
		vi.restoreAllMocks();
	});

	function respondAll() {
		for (const request of pending.splice(0)) {
			request.respond();
		}
	}

	function nextEvent(obj, type) {
		return new Promise((resolve) => {
			obj.once(type, resolve);
		});
	}

	function tileImages(layer) {
		return [...layer.getContainer().querySelectorAll('img.maplair-tile')];
	}

	async function loadedLayer(url, options) {
		const layer = new TileLayer(url, {fetchOptions: {}, ...options});
		const load = nextEvent(layer, 'load');
		layer.addTo(map);
		respondAll();
		await load;
		return layer;
	}

	describe('setUrl', () => {
		beforeEach(() => {
			createMap();
		});

		it('keeps the current tiles until the new tiles have loaded', async () => {
			const layer = await loadedLayer('https://a.example.com/{z}/{x}/{y}.png');
			const oldTiles = tileImages(layer);
			expect(oldTiles.length).to.be.greaterThan(0);

			layer.setUrl('https://b.example.com/{z}/{x}/{y}.png');
			expect(pending.length).to.equal(oldTiles.length);
			expect(pending.every(r => r.url.startsWith('https://b.'))).to.be.true;
			// both old and new tiles are in the DOM, the old ones below
			for (const tile of oldTiles) {
				expect(tile.isConnected).to.be.true;
				expect(Number(tile.parentNode.style.zIndex)).to.equal(-1);
			}
			expect(tileImages(layer).length).to.equal(oldTiles.length * 2);

			const unloaded = [];
			layer.on('tileunload', e => unloaded.push(e.tile));
			const load = nextEvent(layer, 'load');
			respondAll();
			await load;

			for (const tile of oldTiles) {
				expect(tile.isConnected).to.be.false;
			}
			expect(unloaded).to.have.members(oldTiles);
			expect(tileImages(layer).length).to.equal(oldTiles.length);
		});

		it('keeps the first tiles when changing the URL again before loading', async () => {
			const layer = await loadedLayer('https://a.example.com/{z}/{x}/{y}.png');
			const oldTiles = tileImages(layer);

			layer.setUrl('https://b.example.com/{z}/{x}/{y}.png');
			layer.setUrl('https://c.example.com/{z}/{x}/{y}.png');
			for (const tile of oldTiles) {
				expect(tile.isConnected).to.be.true;
			}
			// the requests for b were aborted
			const load = nextEvent(layer, 'load');
			respondAll();
			await load;
			expect(tileImages(layer).every(tile => tile.src.startsWith('blob:'))).to.be.true;
			expect(tileImages(layer).length).to.equal(oldTiles.length);
		});

		it('drops the kept tiles when zooming', async () => {
			const layer = await loadedLayer('https://a.example.com/{z}/{x}/{y}.png');
			const oldTiles = tileImages(layer);

			layer.setUrl('https://b.example.com/{z}/{x}/{y}.png');
			map.setZoom(3);
			for (const tile of oldTiles) {
				expect(tile.isConnected).to.be.false;
			}
		});

		it('drops the kept tiles when removing the layer', async () => {
			const layer = await loadedLayer('https://a.example.com/{z}/{x}/{y}.png');
			const oldTiles = tileImages(layer);
			layer.setUrl('https://b.example.com/{z}/{x}/{y}.png');
			layer.remove();
			for (const tile of oldTiles) {
				expect(tile.isConnected).to.be.false;
			}
			expect(layer._keptLevel).to.equal(null);
		});

		it('removes the kept tiles after the new ones faded in', async () => {
			map.remove();
			createMap({fadeAnimation: true});
			const layer = await loadedLayer('https://a.example.com/{z}/{x}/{y}.png');
			const oldTiles = tileImages(layer);

			layer.setUrl('https://b.example.com/{z}/{x}/{y}.png');
			const load = nextEvent(layer, 'load');
			respondAll();
			await load;
			expect(oldTiles[0].isConnected).to.be.true;

			await new Promise((resolve) => {
				setTimeout(resolve, 300);
			});
			expect(oldTiles[0].isConnected).to.be.false;
		});
	});

	describe('placeholder', () => {
		it('shows the placeholder while loading', async () => {
			createMap({fadeAnimation: true});
			const layer = new TileLayer('https://a.example.com/{z}/{x}/{y}.png', {fetchOptions: {}, placeholder: 'rgb(221, 221, 221)'}).addTo(map);
			const tiles = tileImages(layer);
			expect(tiles.length).to.be.greaterThan(0);
			for (const tile of tiles) {
				expect(getComputedStyle(tile).backgroundColor).to.equal('rgb(221, 221, 221)');
			}

			const load = nextEvent(layer, 'load');
			respondAll();
			await load;
			for (const tile of tiles) {
				expect(getComputedStyle(tile).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
				// no fading, which would hide the placeholder at first
				expect(tile.style.opacity).not.to.equal('0');
			}
			await new Promise((resolve) => {
				requestAnimationFrame(resolve);
			});
			for (const tile of tiles) {
				expect(['', '1']).to.include(tile.style.opacity);
			}
		});

		it('works for grid layers', () => {
			createMap();
			const grid = new GridLayer({placeholder: 'red'});
			// never loading, since it has a `done` callback
			grid.createTile = function (coords, done) { return document.createElement('div'); }; // eslint-disable-line no-unused-vars
			grid.addTo(map);
			const tile = grid.getContainer().querySelector('.maplair-tile');
			expect(tile.style.background).to.contain('red');
		});
	});
});
