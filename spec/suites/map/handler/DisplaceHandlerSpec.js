import {expect} from 'vite-plus/test';
import {CircleMarker, DisplaceHandler, LatLng, MaplairMap, Point} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';
import {displace} from '../../../../src/map/handler/DisplaceHandler.js';

describe('displace', () => {
	it('separates overlapping points', () => {
		const points = [new Point(0, 0), new Point(1, 0), new Point(0, 0)];
		displace(points, 10);
		for (const [i, a] of points.entries()) {
			for (const b of points.slice(i + 1)) {
				expect(a.distanceTo(b)).to.be.at.least(10 - 1e-6);
			}
		}
	});

	it('respects maxDisplacement', () => {
		const anchors = [new Point(0, 0), new Point(1, 0), new Point(0, 1)];
		const points = anchors.map(point => new Point(point));
		displace(points, 100, {maxDisplacement: 3});
		for (const [i, point] of points.entries()) {
			expect(point.distanceTo(anchors[i])).to.be.at.most(3 + 1e-6);
		}
		// The limit wins over the separation, the points still overlap
		expect(points[0].distanceTo(points[1])).to.be.below(100);
	});

	it('keeps single points untouched', () => {
		expect(displace([new Point(3, 4)], 10)).to.eql([new Point(3, 4)]);
	});
});

describe('DisplaceHandler', () => {
	const trueLatLng = new LatLng(48.1, 11.6);
	let containers, maps;

	class DisplaceMap extends MaplairMap {
		constructor(...args) {
			super(...args);
			this.callInitHooks(DisplaceMap);
		}
	}
	DisplaceMap.addInitHook('addHandler', 'displace', DisplaceHandler);

	function createMap(options, zoom = 10) {
		const container = createContainer('800px', '600px');
		const map = new DisplaceMap(container, {center: trueLatLng, zoom, ...options});
		containers.push(container);
		maps.push(map);
		return map;
	}

	function addMarkers(map, count, options = {displace: true}) {
		return Array.from({length: count}, () => new CircleMarker(trueLatLng, {radius: 6, ...options}).addTo(map));
	}

	beforeEach(() => {
		containers = [];
		maps = [];
	});

	afterEach(() => {
		maps.forEach((map, i) => removeMapContainer(map, containers[i]));
	});

	it('displaces overlapping markers', () => {
		const map = createMap({displace: {gap: 2}});
		expect(map.displace.enabled()).to.be.true;

		const markers = addMarkers(map, 3);
		const [other] = addMarkers(map, 1, {});

		map.displace.relayout();

		const points = markers.map(m => map.latLngToLayerPoint(m.getLatLng()));
		for (const [i, a] of points.entries()) {
			for (const b of points.slice(i + 1)) {
				expect(a.distanceTo(b)).to.be.at.least(2 * 6 + 2 - 1e-6);
			}
		}
		// Markers without `displace: true` are not touched
		expect(other.getLatLng()).to.eql(trueLatLng);
	});

	it('limits the displacement to maxDistance meters', () => {
		const map = createMap({displace: {maxDistance: 10_000}}, 7);
		const markers = addMarkers(map, 30);
		map.displace.relayout();
		for (const marker of markers) {
			expect(map.distance(marker.getLatLng(), trueLatLng)).to.be.at.most(10_000 * 1.01);
		}

		// … while an unlimited displacement spreads the same cluster much further
		const unlimited = createMap({displace: true}, 7);
		const spread = addMarkers(unlimited, 30);
		unlimited.displace.relayout();
		const distances = spread.map(marker => unlimited.distance(marker.getLatLng(), trueLatLng));
		expect(Math.max(...distances)).to.be.above(10_000);
	});

	it('is idempotent and does not drift', () => {
		const map = createMap({displace: true});
		const markers = addMarkers(map, 3);

		map.displace.relayout();
		const first = markers.map(m => m.getLatLng());
		map.displace.relayout();
		expect(markers.map(m => m.getLatLng())).to.eql(first);
	});

	it('restores the true positions when disabled', () => {
		const map = createMap({displace: true});
		const [marker] = addMarkers(map, 2);

		map.displace.relayout();
		expect(marker.getLatLng()).not.to.eql(trueLatLng);

		map.displace.disable();
		expect(marker.getLatLng()).to.eql(trueLatLng);
	});

	it('keeps markers with the same displaceId at the same position', () => {
		const map = createMap({displace: true});
		const markers = addMarkers(map, 3).map((marker, i) => {
			marker.options.displaceId = `m${i}`;
			return marker;
		});
		map.displace.relayout();
		const first = markers.map(m => m.getLatLng());

		// the same things on another layer reuse the cached positions
		markers.forEach(marker => marker.remove());
		const others = addMarkers(map, 3).map((marker, i) => {
			marker.options.displaceId = `m${i}`;
			return marker;
		});
		map.displace.relayout();
		expect(others.map(m => m.getLatLng())).to.eql(first);
	});

	it('takes moves by the application as new true positions', () => {
		const map = createMap({displace: true});
		const markers = addMarkers(map, 2).map((marker, i) => {
			marker.options.displaceId = `m${i}`;
			return marker;
		});
		map.displace.relayout();

		const moved = new LatLng(48.2, 11.7);
		markers[0].setLatLng(moved);
		map.displace.relayout();
		// far apart now, so neither the displacement nor the cache moves them
		expect(markers[0].getLatLng()).to.be.nearLatLng(moved);
		expect(markers[1].getLatLng()).to.be.nearLatLng(trueLatLng);

		map.displace.disable();
		expect(markers[0].getLatLng()).to.eql(moved);
	});

	it('relayouts in the next animation frame', async () => {
		const map = createMap({displace: true});
		const [marker] = addMarkers(map, 2);
		expect(marker.getLatLng()).to.eql(trueLatLng);

		await new Promise((resolve) => { requestAnimationFrame(resolve); });
		expect(marker.getLatLng()).not.to.eql(trueLatLng);
	});

	it('is not added to maps by default', () => {
		const map = new MaplairMap(createContainer(), {center: trueLatLng, zoom: 10});
		containers.push(map.getContainer());
		maps.push(map);
		expect(map.displace).to.be.undefined;
	});

	it('stays disabled without the map option', () => {
		const map = createMap({});
		expect(map.displace.enabled()).to.be.false;
		const [marker] = addMarkers(map, 2);
		map.displace.relayout();
		expect(marker.getLatLng()).to.eql(trueLatLng);
	});
});
