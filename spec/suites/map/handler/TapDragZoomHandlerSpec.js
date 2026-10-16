import {expect, vi} from 'vite-plus/test';
import {LatLng, MaplairMap} from 'maplair';
import Hand from 'prosthetic-hand';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('TapDragZoomHandler', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {
			inertia: false,
			zoomAnimation: false
		});
		container.style.width = container.style.height = '600px';
		map.invalidateSize();
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function tapDrag(x, y, dy, onStop) {
		const hand = new Hand({timing: 'fastframe', onStop});
		const finger = hand.growFinger('pointer', {pointerType: 'touch'});
		finger.wait(100).moveTo(x, y, 0)
			.down().wait(50).up().wait(50)
			.down().moveBy(0, dy, 300).up();
	}

	it('zooms in when dragging down after a tap', (done) => {
		map.setView([0, 0], 3);
		map.once('zoomend', () => {
			expect(map.getZoom()).to.equal(5);
			done();
		});
		tapDrag(300, 300, 256);
	});

	it('zooms out when dragging up after a tap', (done) => {
		map.setView([0, 0], 3);
		map.once('zoomend', () => {
			expect(map.getZoom()).to.equal(1);
			done();
		});
		tapDrag(300, 300, -256);
	});

	it('keeps the tapped location in place', (done) => {
		map.setView([0, 0], 3);
		const latLng = map.containerPointToLatLng([200, 200]);
		map.once('zoomend', () => {
			expect(map.getZoom()).to.equal(4);
			expect(map.latLngToContainerPoint(latLng).distanceTo([200, 200])).to.be.lessThan(1);
			done();
		});
		tapDrag(200, 200, 128);
	});

	it('tapDragZoom: \'center\' zooms around the center', (done) => {
		map.options.tapDragZoom = 'center';
		map.setView([0, 0], 3);
		map.once('zoomend', () => {
			expect(map.getZoom()).to.equal(4);
			expect(map.getCenter().equals(new LatLng(0, 0))).to.be.true;
			done();
		});
		tapDrag(200, 200, 128);
	});

	it('does not zoom when the second touch comes too late', (done) => {
		map.setView([0, 0], 3);
		const spy = vi.fn();
		map.on('zoomend', spy);
		// Every pointer event happens a second after the previous one
		let now = Date.now();
		vi.spyOn(Date, 'now').mockImplementation(() => (now += 1000));
		tapDrag(300, 300, 128, () => {
			vi.restoreAllMocks();
			expect(spy).not.toHaveBeenCalled();
			expect(map.getZoom()).to.equal(3);
			done();
		});
	});

	it('does not zoom when disabled', (done) => {
		map.tapDragZoom.disable();
		map.setView([0, 0], 3);
		const spy = vi.fn();
		map.on('zoomend', spy);
		tapDrag(300, 300, 128, () => {
			expect(spy).not.toHaveBeenCalled();
			done();
		});
	});
});
