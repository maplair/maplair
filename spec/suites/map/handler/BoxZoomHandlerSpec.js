import {expect, vi} from 'vite-plus/test';
import {MaplairMap, BoxZoomHandler} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';
import Hand from 'prosthetic-hand';

describe('BoxZoomHandler', () => {
	let container, map;
	let hand, finger;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {
			center: [0, 0],
			zoom: 3,
			zoomAnimation: false
		});
		hand = new Hand({timing: 'fastframe'});
		finger = hand.growFinger('pointer', {pointerType: 'mouse'});
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});


	it('cancel boxZoom by pressing ESC and re-enable click event on the map', async () => {
		// let mapClick = false;
		let clickSpy = vi.fn();
		map.once('click', clickSpy);

		finger.moveTo(100, 100).down().up();
		await hand.run();

		// check if click event on the map is fired
		expect(clickSpy).toHaveBeenCalledOnce();


		// fire pointerdown event with shiftKey = true, to start drawing the boxZoom
		finger.moveTo(100, 100).shift().down();

		// fire pointermove event with shiftKey = true, to draw the boxZoom
		finger.moveBy(100, 100);

		const boxStartSpy = vi.fn();
		map.once('boxzoomstart', boxStartSpy);
		const boxEndSpy = vi.fn();
		map.once('boxzoomend', boxEndSpy);

		await hand.run();

		expect(boxStartSpy).toHaveBeenCalledOnce();
		expect(boxEndSpy).not.toHaveBeenCalled();
		expect(map.getContainer().classList.contains('maplair-crosshair')).to.be.true;
		expect(map.getContainer().querySelectorAll('.maplair-zoom-box').length).to.equal(1);

		// fire keydown event ESC to cancel boxZoom
		UIEventSimulator.fire('keydown', document, {
			code: 'Escape'
		});

		await (new Promise((res) => { setTimeout(res, 1); }));

		expect(map.getContainer().classList.contains('maplair-crosshair')).to.be.false;
		expect(map.getContainer().querySelectorAll('.maplair-zoom-box').length).to.equal(0);

		finger.unshift().up();
		await hand.run();

		// check if click event on the map is fired
		finger.down().up();

		clickSpy = vi.fn();
		map.once('click', clickSpy);

		await hand.run();
		expect(clickSpy).toHaveBeenCalledOnce();
		expect(boxEndSpy).not.toHaveBeenCalled();
	});

	it('zooms from level 3 to level 5', async () => {
		expect(map.getZoom()).to.eql(3);
		const boxStartSpy = vi.fn();
		const boxEndSpy = vi.fn();
		const zoomSpy = vi.fn();
		map.on('boxzoomstart', boxStartSpy);
		map.on('boxzoomend', boxEndSpy);
		map.on('zoom', zoomSpy);

		const hand = new Hand({timing: 'fastframe'});
		const finger = hand.growFinger('pointer', {pointerType: 'mouse'});

		// fire pointerdown event with shiftKey = true, to start drawing the boxZoom
		finger.shift().moveTo(100, 100).down();

		// fire pointermove event with shiftKey = true, to draw the boxZoom
		// fire pointerup event with shiftKey = true, to finish drawing the boxZoom
		finger.moveBy(100, 100).unshift().up();

		await hand.run();

		expect(boxStartSpy).toHaveBeenCalled();
		expect(boxEndSpy).toHaveBeenCalled();
		expect(zoomSpy).toHaveBeenCalled();

		expect(map.getZoom()).to.eql(5);
	});

	it('doesn\'t start box zoom if shift key is not pressed', async () => {
		expect(map.getZoom()).to.eql(3);
		const zoomSpy = vi.fn();
		map.on('boxzoomstart', zoomSpy);

		const hand = new Hand({timing: 'fastframe'});
		const finger = hand.growFinger('pointer', {pointerType: 'mouse'});

		finger.unshift().moveTo(100, 100).down();
		finger.moveBy(100, 100).unshift().up().wait(200);

		await hand.run();

		expect(zoomSpy).not.toHaveBeenCalled();
		expect(map.getZoom()).to.eql(3);
	});

	it('_clearDeferredResetState', async () => {
		let resetTimeout = false;

		const stub = vi.spyOn(map.boxZoom, '_clearDeferredResetState').mockImplementation(() => {});
		stub.mockImplementation(() => {
			resetTimeout = map.boxZoom._resetStateTimeout !== 0;
			BoxZoomHandler.prototype._clearDeferredResetState.call(map.boxZoom);
		});

		const hand = new Hand({timing: 'fastframe'});
		const finger = hand.growFinger('pointer', {pointerType: 'mouse'});

		const clientX = 100;
		const clientY = 100;

		// fire pointerdown event with shiftKey = true, to start drawing the boxZoom
		finger.shift().moveTo(100, 100).down();

		// fire pointermove event with shiftKey = true, to draw the boxZoom
		finger.moveBy(100, 100);
		await hand.run();

		// manually fire pointerup event with shiftKey = true and zero async delay,
		// to finish drawing the boxZoom
		// Triggers scheduling a deferredResetState
		UIEventSimulator.fire('pointerup', map._container, {
			pointerId: finger._id,
			shiftKey: true,
			clientX,
			clientY,
		});

		// firing a pointerdown with zero delay triggers the _clearDeferredResetState
		UIEventSimulator.fire('pointerdown', map._container, {
			pointerId: finger._id,
			shiftKey: true,
			clientX,
			clientY,
		});

		expect(resetTimeout).to.be.true;

		// cleanup pointerdown - because it breaks other tests
		finger.down().up().unshift();
		await hand.run();
	});

	it('zooms out when dragged box is larger than map', async () => {

		const smallMap = new MaplairMap(createContainer('75px', '75px'), {
			center: [0, 0],
			zoom: 10,
			zoomAnimation: false
		});

		finger.moveTo(50, 50).shift().down();
		finger.moveBy(150, 150).unshift().up().wait(200);

		await hand.run();

		expect(smallMap.getZoom()).to.eql(9);

		finger.moveTo(50, 50).shift().down();
		finger.moveBy(300, 300).unshift().up().wait(200);

		await hand.run();

		expect(smallMap.getZoom()).to.eql(7);

		removeMapContainer(smallMap, smallMap.getContainer());
	});

});
