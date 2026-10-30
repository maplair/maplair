import {expect, vi} from 'vite-plus/test';
import {Canvas, LatLng, MaplairMap, Marker, Polyline, SVG} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';
import 'maplair/marker-movement';
import 'maplair/dash-animation';

describe('Animated markers and paths', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false});
		map.setView([0, 0], 5);
	});

	afterEach(() => {
		removeMapContainer(map, container);
		vi.restoreAllMocks();
	});

	function nextEvent(obj, type) {
		return new Promise((resolve) => {
			obj.once(type, resolve);
		});
	}

	describe('Marker.moveTo/moveAlong', () => {
		it('moves the marker smoothly to a location', async () => {
			const marker = new Marker([0, 0]).addTo(map),
			positions = [];
			marker.on('move', e => positions.push(e.latlng));
			// advance the clock in fixed steps, independent of slow CI runners
			let now = performance.now();
			vi.spyOn(performance, 'now').mockImplementation(() => (now += 25));
			const moveend = nextEvent(marker, 'moveend');
			marker.moveTo([0, 10], {duration: 200});
			expect(marker.isMoving()).to.be.true;
			await moveend;

			expect(marker.isMoving()).to.be.false;
			expect(marker.getLatLng()).to.be.nearLatLng([0, 10]);
			expect(positions.length).to.be.greaterThan(3);
			const lngs = positions.map(p => p.lng);
			expect(lngs).to.eql(lngs.toSorted((a, b) => a - b));
			expect(lngs.some(lng => lng > 1 && lng < 9)).to.be.true;
		});

		it('moves along points at a constant speed', async () => {
			const marker = new Marker([0, 0]).addTo(map),
			// 1 + 2 degrees at the equator
			route = [[0, 1], [0, 3]],
			speed = new LatLng(0, 0).distanceTo([0, 3]) / 0.3;
			// advance the clock in fixed steps, independent of slow CI runners
			let now = performance.now();
			vi.spyOn(performance, 'now').mockImplementation(() => (now += 25));
			const start = performance.now();
			const moveend = nextEvent(marker, 'moveend');
			marker.moveAlong(route, {speed});
			await moveend;
			expect(performance.now() - start).to.be.closeTo(300, 100);
			expect(marker.getLatLng()).to.be.nearLatLng([0, 3]);
		});

		it('moves in a straight line in the projection of the map', async () => {
			const marker = new Marker([60, 0]).addTo(map),
			points = [];
			marker.on('move', e => points.push(map.latLngToLayerPoint(e.latlng)));
			const moveend = nextEvent(marker, 'moveend');
			marker.moveTo([0, 60], {duration: 150});
			await moveend;
			const a = map.latLngToLayerPoint([60, 0]), b = map.latLngToLayerPoint([0, 60]);
			for (const p of points) {
				// distance from the line a–b
				const cross = Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / a.distanceTo(b);
				expect(cross).to.be.lessThan(1.5);
			}
		});

		it('rotates the icon to the heading', async () => {
			const marker = new Marker([0, 0]).addTo(map);
			const moveend = nextEvent(marker, 'moveend');
			marker.moveAlong([[0, 1], [-1, 1]], {duration: 100, rotate: true});
			await moveend;
			// heading south at the end
			expect(marker.getRotation()).to.be.closeTo(180, 1e-6);
			expect(marker.getElement().style.transform).to.contain('rotate(180deg)');
		});

		it('stops moving', async () => {
			const marker = new Marker([0, 0]).addTo(map),
			moveend = vi.fn();
			marker.on('moveend', moveend);
			marker.moveTo([0, 10], {duration: 1000});
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});
			marker.stopMoving();
			const latlng = marker.getLatLng();
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});
			expect(marker.getLatLng()).to.eql(latlng);
			expect(latlng.lng).to.be.lessThan(5);
			expect(moveend).not.toHaveBeenCalled();
		});

		it('moves markers which are not on a map', async () => {
			const marker = new Marker([0, 0]);
			const moveend = nextEvent(marker, 'moveend');
			marker.moveTo([10, 10], {duration: 50});
			await moveend;
			expect(marker.getLatLng()).to.be.nearLatLng([10, 10]);
		});
	});

	describe('Path option dashSpeed', () => {
		it('animates the dashes of SVG paths', () => {
			const line = new Polyline([[0, 0], [0, 10]], {renderer: new SVG(), dashArray: '10, 5', dashSpeed: 30}).addTo(map),
			path = line.getElement();
			expect(path.classList.contains('maplair-dash-animated')).to.be.true;
			expect(path.style.getPropertyValue('--maplair-dash-length')).to.equal('15px');
			expect(path.style.getPropertyValue('--maplair-dash-duration')).to.equal('0.5s');
			const style = getComputedStyle(path);
			expect(style.animationName).to.equal('maplair-dash');
			expect(style.animationIterationCount).to.equal('infinite');

			line.setStyle({dashSpeed: -15, dashArray: '4'});
			expect(path.style.getPropertyValue('--maplair-dash-length')).to.equal('-8px');
			line.setStyle({dashSpeed: 0});
			expect(path.classList.contains('maplair-dash-animated')).to.be.false;
		});

		it('does not animate without dashArray', () => {
			const line = new Polyline([[0, 0], [0, 10]], {renderer: new SVG(), dashSpeed: 30}).addTo(map);
			expect(line.getElement().classList.contains('maplair-dash-animated')).to.be.false;
		});

		it('animates the dashes of canvas paths', async () => {
			const renderer = new Canvas(),
			line = new Polyline([[0, 0], [0, 10]], {renderer, dashArray: '10, 5', dashSpeed: 30}).addTo(map),
			offsets = [];
			const original = renderer._fillStroke;
			renderer._fillStroke = function (ctx, layer) {
				original.call(this, ctx, layer);
				offsets.push(ctx.lineDashOffset);
			};
			// wait for frames rather than for a fixed time, which slow CI runners may draw too few frames in
			await vi.waitFor(() => {
				expect(offsets.length).to.be.greaterThan(3);
				expect(new Set(offsets).size).to.be.greaterThan(2);
			}, {timeout: 2000});
			for (const offset of offsets) {
				expect(offset).to.be.within(-15, 0);
			}

			// stops redrawing
			line.setStyle({dashSpeed: 0});
			await new Promise((resolve) => {
				setTimeout(resolve, 50);
			});
			const count = offsets.length;
			await new Promise((resolve) => {
				setTimeout(resolve, 100);
			});
			expect(offsets.length).to.equal(count);
		});
	});
});
