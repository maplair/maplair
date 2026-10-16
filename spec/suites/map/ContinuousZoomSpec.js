import {expect, vi} from 'vite-plus/test';
import {GridLayer, MaplairMap, Marker, Point} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Map: continuousZoom', () => {
	let container, map;

	function createMap(options) {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: true, fadeAnimation: false, continuousZoom: true, ...options});
		map.setView([0, 0], 5);
	}

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function nextEvent(type) {
		return new Promise((resolve) => {
			map.once(type, resolve);
		});
	}

	function recordZooms() {
		const zooms = [];
		map.on('zoom', () => zooms.push(map.getZoom()));
		return zooms;
	}

	describe('zoom animations', () => {
		beforeEach(() => {
			createMap();
		});

		it('zooms through fractional zoom levels', async () => {
			const zooms = recordZooms(),
			zoomanim = vi.fn();
			map.on('zoomanim', zoomanim);
			const zoomend = nextEvent('zoomend');
			map.zoomIn();
			await zoomend;

			expect(map.getZoom()).to.equal(6);
			expect(zooms.length).to.be.greaterThan(2);
			expect(zooms.some(z => z > 5 && z < 6)).to.be.true;
			// monotonic
			expect(zooms).to.eql(zooms.toSorted((a, b) => a - b));
			// no CSS zoom animation
			expect(zoomanim).not.toHaveBeenCalled();
			expect(map.getCenter()).to.be.nearLatLng([0, 0]);
		});

		it('keeps the zoom origin in place', async () => {
			const point = new Point(100, 300),
			latlng = map.containerPointToLatLng(point);
			let maxDistance = 0;
			map.on('zoom', () => {
				maxDistance = Math.max(maxDistance, map.latLngToContainerPoint(latlng).distanceTo(point));
			});
			const zoomend = nextEvent('zoomend');
			map.setZoomAround(point, 7);
			await zoomend;

			expect(map.getZoom()).to.equal(7);
			expect(maxDistance).to.be.lessThan(1);
		});

		it('zooms with double click and the zoom control', async () => {
			let zoomend = nextEvent('zoomend');
			UIEventSimulator.fire('dblclick', container);
			await zoomend;
			expect(map.getZoom()).to.equal(6);

			zoomend = nextEvent('zoomend');
			UIEventSimulator.fire('click', container.querySelector('.maplair-control-zoom-out'));
			expect((await zoomend).originalEvent.type).to.equal('click');
			expect(map.getZoom()).to.equal(5);
		});

		it('is interrupted by other view changes', async () => {
			map.zoomIn();
			await new Promise((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(resolve));
			});
			map.setView([10, 10], 3, {animate: false});
			await new Promise((resolve) => {
				setTimeout(resolve, 300);
			});
			expect(map.getZoom()).to.equal(3);
			expect(map.getCenter()).to.be.nearLatLng([10, 10], 1e-3);
		});

		it('moves markers along', async () => {
			const marker = new Marker(map.containerPointToLatLng([300, 100])).addTo(map);
			const positions = [];
			map.on('zoom', () => positions.push(marker.getElement().getBoundingClientRect().left));
			const zoomend = nextEvent('zoomend');
			map.zoomIn();
			await zoomend;
			expect(new Set(positions).size).to.be.greaterThan(2);
			const expected = map.latLngToContainerPoint(marker.getLatLng()).x + container.getBoundingClientRect().left;
			// the icon's left edge is 12px left of its anchor
			expect(marker.getElement().getBoundingClientRect().left).to.be.closeTo(expected - 12, 1);
		});

		it('loads the tiles of the new zoom level', async () => {
			const grid = new GridLayer();
			grid.createTile = () => document.createElement('div');
			grid.addTo(map);
			const zoomend = nextEvent('zoomend');
			map.zoomIn();
			await zoomend;
			expect(grid._tileZoom).to.equal(6);
			expect(Object.values(grid._tiles).some(t => t.coords.z === 6)).to.be.true;
		});
	});

	describe('scroll wheel', () => {
		function wheel(deltaY) {
			const e = new WheelEvent('wheel', {bubbles: true, cancelable: true, clientX: 200, clientY: 200, deltaY, deltaMode: 1});
			container.dispatchEvent(e);
		}

		it('zooms smoothly and snaps at the end', async () => {
			createMap({wheelPxPerZoomLevel: 60});
			const zooms = recordZooms();
			const zoomend = nextEvent('zoomend');
			// 3 lines = 60px = one zoom level each
			wheel(-3);
			wheel(-3);
			await zoomend;
			expect(map.getZoom()).to.equal(7);
			expect(zooms.filter(z => z > 5 && z < 7).length).to.be.greaterThan(2);
		});

		it('ends at fractional zoom levels with zoomSnap: 0', async () => {
			createMap({zoomSnap: 0, wheelPxPerZoomLevel: 60});
			const zoomend = nextEvent('zoomend');
			wheel(-1);
			await zoomend;
			expect(map.getZoom()).to.be.closeTo(5 + 1 / 3, 1e-9);
		});

		it('respects the zoom limits', async () => {
			createMap({maxZoom: 6, wheelPxPerZoomLevel: 60});
			const zooms = recordZooms();
			const zoomend = nextEvent('zoomend');
			wheel(-30);
			await zoomend;
			expect(map.getZoom()).to.equal(6);
			expect(Math.max(...zooms)).to.be.at.most(6);
		});
	});

	it('keeps the CSS zoom animation by default', async () => {
		createMap({continuousZoom: false});
		const zoomanim = vi.fn();
		map.on('zoomanim', zoomanim);
		new Marker([0, 0]).addTo(map);
		const zoomend = nextEvent('zoomend');
		map.zoomIn();
		await zoomend;
		expect(zoomanim).toHaveBeenCalledOnce();
	});
});
