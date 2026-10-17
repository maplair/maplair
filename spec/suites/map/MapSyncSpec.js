import {expect, vi} from 'vite-plus/test';
import {MaplairMap, MapSync, Marker} from 'maplair';
import Hand from 'prosthetic-hand';
import {createContainer, removeMapContainer} from '../SpecHelper.js';
import 'maplair/map-rotation';

describe('MapSync', () => {
	let containers, maps, sync;

	function createMaps(count, options) {
		containers = [];
		maps = [];
		for (let i = 0; i < count; i++) {
			const container = createContainer('300px', '200px');
			container.style.left = `${i * 310}px`;
			containers.push(container);
			maps.push(new MaplairMap(container, {fadeAnimation: false, inertia: false, ...options}));
		}
		maps[0].setView([47.27, 11.40], 10);
	}

	afterEach(() => {
		sync?.remove();
		sync = null;
		for (let i = 0; i < maps.length; i++) {
			removeMapContainer(maps[i], containers[i]);
		}
	});

	function nextEvent(map, type) {
		return new Promise((resolve) => {
			map.once(type, resolve);
		});
	}

	function expectSameView(map, other) {
		expect(other.getZoom()).to.equal(map.getZoom());
		// within a pixel
		expect(other.latLngToContainerPoint(map.getCenter()).distanceTo(other.getSize().divideBy(2))).to.be.lessThan(1);
		expect(other.getBearing()).to.equal(map.getBearing());
	}

	function countEvents(map, types) {
		const counts = {};
		map.on(types, (e) => { counts[e.type] = (counts[e.type] ?? 0) + 1; });
		return counts;
	}

	describe('without animations', () => {
		beforeEach(() => {
			createMaps(2, {zoomAnimation: false});
			sync = new MapSync(maps);
		});

		it('starts with the view of the first map', () => {
			expect(maps[1]._loaded).to.be.true;
			expectSameView(maps[0], maps[1]);
		});

		it('follows views set by code, in both directions', () => {
			const counts = countEvents(maps[1], 'movestart moveend zoomstart zoomend');
			maps[0].setView([48, 12], 8);
			expectSameView(maps[0], maps[1]);
			expect(counts).to.eql({movestart: 1, zoomstart: 1, moveend: 1, zoomend: 1});

			maps[1].panBy([50, 20], {animate: false});
			expectSameView(maps[1], maps[0]);
		});

		it('follows dragging', async () => {
			const moveend = nextEvent(maps[0], 'moveend');
			const hand = new Hand({timing: 'fastframe'});
			const finger = hand.growFinger('pointer', {pointerType: 'mouse'});
			finger.wait(100).moveTo(150, 100, 0).down().moveBy(80, 40, 200).up();
			await moveend;
			expectSameView(maps[0], maps[1]);
		});

		it('moves the layers of the following map', () => {
			const marker = new Marker([47.3, 11.5]).addTo(maps[1]);
			maps[0].setView([47.3, 11.5], 12);
			const rect = marker.getElement().getBoundingClientRect(),
			origin = containers[1].getBoundingClientRect(),
			point = maps[1].latLngToContainerPoint(marker.getLatLng());
			expect(rect.left + rect.width / 2 - origin.left).to.be.closeTo(point.x, 1);
			expect(rect.bottom - origin.top).to.be.closeTo(point.y, 1);
			expect(point.distanceTo([150, 100])).to.be.lessThan(1);
		});

		it('synchronizes the bearing', () => {
			maps[0].setBearing(40);
			expectSameView(maps[0], maps[1]);
			maps[1].setBearing(10);
			expect(maps[0].getBearing()).to.equal(10);
		});

		it('stops when removed', () => {
			sync.remove();
			maps[0].setView([10, 10], 5);
			expect(maps[1].getZoom()).to.equal(10);
		});
	});

	describe('with animations', () => {
		beforeEach(() => {
			createMaps(3, {zoomAnimation: true});
			sync = new MapSync(maps);
		});

		it('follows animated zooming', async () => {
			const zoomanim = vi.fn(),
			counts = countEvents(maps[1], 'movestart moveend zoomend');
			maps[1].on('zoomanim', zoomanim);
			const ends = maps.map(map => nextEvent(map, 'moveend'));
			maps[0].zoomIn();
			await Promise.all(ends);
			// let the last animations end
			await new Promise((resolve) => {
				setTimeout(resolve, 100);
			});

			expect(zoomanim).toHaveBeenCalledOnce();
			expect(counts).to.eql({movestart: 1, moveend: 1, zoomend: 1});
			expectSameView(maps[0], maps[1]);
			expectSameView(maps[0], maps[2]);
		});

		it('follows animated panning', async () => {
			const moves = vi.fn();
			maps[2].on('move', moves);
			const moveend = nextEvent(maps[0], 'moveend');
			maps[0].panBy([100, 50]);
			await moveend;
			expect(moves.mock.calls.length).to.be.greaterThan(1);
			expectSameView(maps[0], maps[2]);
		});

		it('follows flyTo', async () => {
			const moveend = nextEvent(maps[2], 'moveend');
			maps[2].flyTo([48, 13], 8, {duration: 0.3});
			await moveend;
			expectSameView(maps[2], maps[0]);
			expectSameView(maps[2], maps[1]);
		});

		it('handles consecutive movements of different maps', async () => {
			let ends = maps.map(map => nextEvent(map, 'moveend'));
			maps[0].zoomIn();
			await Promise.all(ends);
			await new Promise((resolve) => {
				setTimeout(resolve, 100);
			});
			ends = maps.map(map => nextEvent(map, 'moveend'));
			maps[1].zoomOut();
			await Promise.all(ends);
			await new Promise((resolve) => {
				setTimeout(resolve, 100);
			});
			expect(maps[0].getZoom()).to.equal(10);
			expectSameView(maps[1], maps[0]);
			expectSameView(maps[1], maps[2]);
		});
	});
});
