import {expect, vi} from 'vite-plus/test';
import {LatLng, MaplairMap} from 'maplair';
import {createContainer, removeMapContainer, Finger} from '../../SpecHelper.js';

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

	function tapDrag(x, y, dy) {
		return new Finger('touch').moveTo(x, y).down().up().down().moveBy(0, dy).up();
	}

	it('zooms in when dragging down after a tap', async () => {
		map.setView([0, 0], 3);
		const zoomend = vi.fn();
		map.on('zoomend', zoomend);
		await tapDrag(300, 300, 256);
		expect(zoomend).toHaveBeenCalledOnce();
		expect(map.getZoom()).to.equal(5);
	});

	it('zooms out when dragging up after a tap', async () => {
		map.setView([0, 0], 3);
		const zoomend = vi.fn();
		map.on('zoomend', zoomend);
		await tapDrag(300, 300, -256);
		expect(zoomend).toHaveBeenCalledOnce();
		expect(map.getZoom()).to.equal(1);
	});

	it('keeps the tapped location in place', async () => {
		map.setView([0, 0], 3);
		const latLng = map.containerPointToLatLng([200, 200]);
		await tapDrag(200, 200, 128);
		expect(map.getZoom()).to.equal(4);
		expect(map.latLngToContainerPoint(latLng).distanceTo([200, 200])).to.be.lessThan(1);
	});

	it('tapDragZoom: \'center\' zooms around the center', async () => {
		map.options.tapDragZoom = 'center';
		map.setView([0, 0], 3);
		await tapDrag(200, 200, 128);
		expect(map.getZoom()).to.equal(4);
		expect(map.getCenter().equals(new LatLng(0, 0))).to.be.true;
	});

	it('does not zoom when the second touch comes too late', async () => {
		map.setView([0, 0], 3);
		const spy = vi.fn();
		map.on('zoomend', spy);
		// Every pointer event happens a second after the previous one
		let now = Date.now();
		vi.spyOn(Date, 'now').mockImplementation(() => (now += 1000));
		await tapDrag(300, 300, 128);
		vi.restoreAllMocks();
		expect(spy).not.toHaveBeenCalled();
		expect(map.getZoom()).to.equal(3);
	});

	it('does not zoom when disabled', async () => {
		map.tapDragZoom.disable();
		map.setView([0, 0], 3);
		const spy = vi.fn();
		map.on('zoomend', spy);
		await tapDrag(300, 300, 128);
		expect(spy).not.toHaveBeenCalled();
	});
});
