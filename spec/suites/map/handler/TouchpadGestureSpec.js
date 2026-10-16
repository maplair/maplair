import {expect, vi} from 'vite-plus/test';
import {MaplairMap, Point} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('ScrollWheelZoomHandler: touchpad gestures', () => {
	let container, map;

	function createMap(options) {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false, ...options});
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

	function nextFrame() {
		return new Promise((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(resolve));
		});
	}

	// A wheel event at the container point `[x, y]`
	function wheel(x, y, init) {
		const rect = container.getBoundingClientRect();
		const e = new WheelEvent('wheel', {bubbles: true, cancelable: true, clientX: rect.left + x, clientY: rect.top + y, ...init});
		container.dispatchEvent(e);
		return e;
	}

	// Safari's GestureEvent, which is not available in other browsers
	function gesture(type, x, y, scale) {
		const rect = container.getBoundingClientRect();
		const e = new UIEvent(type, {bubbles: true, cancelable: true});
		Object.assign(e, {clientX: rect.left + x, clientY: rect.top + y, scale});
		container.dispatchEvent(e);
		return e;
	}

	describe('pinching (wheel with ctrlKey)', () => {
		beforeEach(() => {
			createMap();
		});

		it('zooms in continuously and snaps at the end', async () => {
			const zoomend = vi.fn();
			map.on('zoomend', zoomend);
			const e = wheel(200, 200, {ctrlKey: true, deltaY: -60});
			expect(e.defaultPrevented).to.be.true;
			wheel(200, 200, {ctrlKey: true, deltaY: -60});
			await nextFrame();
			expect(map.getZoom()).to.be.closeTo(6.2, 1e-9);
			expect(zoomend).not.toHaveBeenCalled();

			await nextEvent('zoomend');
			expect(map.getZoom()).to.equal(6);
			expect(map.getCenter()).to.be.nearLatLng([0, 0]);
		});

		it('zooms out', async () => {
			const zoomend = nextEvent('zoomend');
			for (let i = 0; i < 5; i++) {
				wheel(200, 200, {ctrlKey: true, deltaY: 40});
			}
			await zoomend;
			expect(map.getZoom()).to.equal(3);
		});

		it('keeps the location below the pointer in place', async () => {
			const latlng = map.containerPointToLatLng([100, 300]);
			const zoomend = nextEvent('zoomend');
			wheel(100, 300, {ctrlKey: true, deltaY: -100});
			await zoomend;
			expect(map.getZoom()).to.equal(6);
			expect(map.latLngToContainerPoint(latlng).distanceTo([100, 300])).to.be.lessThan(1);
		});

		it('zooms around the center with scrollWheelZoom: \'center\'', async () => {
			map.options.scrollWheelZoom = 'center';
			const zoomend = nextEvent('zoomend');
			wheel(100, 300, {ctrlKey: true, deltaY: -100});
			await zoomend;
			expect(map.getZoom()).to.equal(6);
			expect(map.getCenter()).to.be.nearLatLng([0, 0]);
		});

		it('respects the zoom limits', async () => {
			map.setMaxZoom(5);
			const zoomend = nextEvent('zoomend');
			wheel(200, 200, {ctrlKey: true, deltaY: -300});
			await zoomend;
			expect(map.getZoom()).to.equal(5);
		});

		it('has the wheel event as originalEvent', async () => {
			const zoomstart = nextEvent('zoomstart');
			wheel(200, 200, {ctrlKey: true, deltaY: -100});
			expect((await zoomstart).originalEvent.type).to.equal('wheel');
			await nextEvent('moveend');
		});

		it('is disabled with scrollWheelZoom', async () => {
			map.scrollWheelZoom.disable();
			wheel(200, 200, {ctrlKey: true, deltaY: -100});
			await nextFrame();
			expect(map.getZoom()).to.equal(5);
		});
	});

	describe('pinching in Safari (gesture events)', () => {
		beforeEach(() => {
			createMap();
		});

		it('zooms by the scale of the gesture', async () => {
			gesture('gesturestart', 100, 300, 1);
			const latlng = map.containerPointToLatLng([100, 300]);
			const e = gesture('gesturechange', 100, 300, 2);
			expect(e.defaultPrevented).to.be.true;
			await nextFrame();
			expect(map.getZoom()).to.be.closeTo(6, 1e-9);

			gesture('gesturechange', 100, 300, 3);
			await nextFrame();
			expect(map.getZoom()).to.be.closeTo(5 + Math.log2(3), 1e-9);

			const zoomend = nextEvent('zoomend');
			gesture('gestureend', 100, 300, 3);
			await zoomend;
			expect(map.getZoom()).to.equal(7);
			expect(map.latLngToContainerPoint(latlng).distanceTo([100, 300])).to.be.lessThan(1);
		});
	});

	describe('scrollWheelZoom: \'trackpad\'', () => {
		beforeEach(() => {
			createMap({scrollWheelZoom: 'trackpad'});
		});

		it('pans the map by scrolling', async () => {
			const center = map.latLngToContainerPoint(map.getCenter());
			const movestart = vi.fn(), moveend = vi.fn();
			map.on({movestart, moveend});

			wheel(200, 200, {deltaX: 30, deltaY: 40});
			wheel(200, 200, {deltaX: 0, deltaY: 20});
			expect(movestart).toHaveBeenCalledOnce();
			expect(moveend).not.toHaveBeenCalled();
			expect(map.getZoom()).to.equal(5);
			expect(map.latLngToContainerPoint([0, 0]).subtract(center).equals(new Point(-30, -60))).to.be.true;

			await nextEvent('moveend');
			expect(moveend).toHaveBeenCalledOnce();
		});

		it('pans horizontally with the Shift key and a mouse wheel', () => {
			const center = map.latLngToContainerPoint(map.getCenter());
			wheel(200, 200, {deltaY: 50, shiftKey: true});
			expect(map.latLngToContainerPoint([0, 0]).subtract(center).equals(new Point(-50, 0))).to.be.true;
		});

		it('still zooms by pinching', async () => {
			const zoomend = nextEvent('zoomend');
			wheel(200, 200, {ctrlKey: true, deltaY: -100});
			await zoomend;
			expect(map.getZoom()).to.equal(6);
		});
	});

	it('snaps with a zoom animation', async () => {
		createMap({zoomAnimation: true});
		const zoomend = nextEvent('zoomend');
		wheel(200, 200, {ctrlKey: true, deltaY: -130});
		await zoomend;
		expect(map.getZoom()).to.equal(6);
	});

	it('still zooms with the mouse wheel by default', async () => {
		createMap();
		const zoomend = nextEvent('zoomend');
		UIEventSimulator.fire('wheel', container, {deltaY: -120, deltaMode: 0});
		await zoomend;
		expect(map.getZoom()).to.be.greaterThan(5);
	});
});

