import {expect, vi} from 'vite-plus/test';
import {GridLayer, MaplairMap, Marker} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Map: idle event', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false});
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function nextIdle() {
		return new Promise((resolve) => {
			map.once('idle', resolve);
		});
	}

	function nextFrame() {
		return new Promise((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(resolve));
		});
	}

	// A grid layer whose tiles load after `delay` milliseconds.
	function slowGridLayer(delay) {
		const grid = new GridLayer();
		grid.createTile = function (coords, done) {
			const tile = document.createElement('div');
			setTimeout(done, delay, null, tile);
			return tile;
		};
		return grid;
	}

	it('fires after setting the view of a map without layers', async () => {
		const idle = nextIdle();
		map.setView([0, 0], 3);
		await idle;
	});

	it('fires once all tiles have loaded', async () => {
		const grid = slowGridLayer(50).addTo(map);
		const tileload = vi.fn();
		grid.on('tileload', tileload);

		const idle = nextIdle();
		map.setView([0, 0], 3);
		await idle;

		expect(tileload).toHaveBeenCalled();
		expect(grid.isLoading()).to.be.false;
		expect(Object.values(grid._tiles).every(t => t.loaded)).to.be.true;
	});

	it('fires once after the end of an animated pan', async () => {
		map.setView([0, 0], 3);
		await nextIdle();

		const spy = vi.fn();
		map.on('idle', spy);
		const moveend = vi.fn();
		map.on('moveend', moveend);
		map.panBy([100, 0], {duration: 0.1});
		await nextFrame();
		expect(spy).not.toHaveBeenCalled();

		await nextIdle();
		expect(moveend).toHaveBeenCalledOnce();
		await nextFrame();
		expect(spy).toHaveBeenCalledOnce();
	});

	it('fires after an animated zoom and the tiles of the new level', async () => {
		const grid = slowGridLayer(30).addTo(map);
		map.setView([0, 0], 3);
		await nextIdle();

		const order = [];
		map.on('zoomend', () => order.push('zoomend'));
		grid.on('load', () => order.push('load'));
		map.on('idle', () => order.push('idle'));
		map.zoomIn(1, {animate: true});
		await nextIdle();

		// the tiles may load before the end of the zoom animation, but idle comes last
		expect(order).to.have.members(['zoomend', 'load', 'idle']);
		expect(order.at(-1)).to.equal('idle');
		expect(map.getZoom()).to.equal(4);
	});

	it('does not fire again without changes', async () => {
		map.setView([0, 0], 3);
		await nextIdle();

		const spy = vi.fn();
		map.on('idle', spy);
		new Marker([0, 0]).addTo(map);
		await nextFrame();
		expect(spy).not.toHaveBeenCalled();
	});

	it('fires again after redrawing a tile layer', async () => {
		const grid = slowGridLayer(20).addTo(map);
		map.setView([0, 0], 3);
		await nextIdle();

		grid.redraw();
		expect(grid.isLoading()).to.be.true;
		await nextIdle();
		expect(grid.isLoading()).to.be.false;
	});

	it('fires when a loading tile layer is removed', async () => {
		map.setView([0, 0], 3);
		await nextIdle();

		const grid = slowGridLayer(10000).addTo(map);
		expect(grid.isLoading()).to.be.true;
		const idle = nextIdle();
		await nextFrame();
		grid.remove();
		await idle;
	});
});
