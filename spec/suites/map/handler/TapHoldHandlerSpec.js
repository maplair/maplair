import {expect, vi} from 'vite-plus/test';
import {MaplairMap, Point} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer, Finger} from '../../SpecHelper.js';

describe('TapHoldHandler', () => {
	let container, spy, map;
	let touchFinger, touchFinger2, mouseFinger;

	const posStart = {x: 1, y: 1};
	const posNear = {x: 10, y: 10};
	const posFar = {x: 100, y: 100};

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {
			center: [51.505, -0.09],
			zoom: 13,
			tapHold: true
		});

		// Tap-Hold depends on timing, so fake the clock and tick it manually between finger steps.
		vi.useFakeTimers({
			now: 0,
			toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance']
		});
		vi.advanceTimersByTime(1000);
		spy = vi.fn();

		map.on('contextmenu', spy);

		touchFinger = new Finger('touch').moveTo(posStart.x, posStart.y);
		touchFinger2 = new Finger('touch').moveTo(posStart.x, posStart.y);
		mouseFinger = new Finger('mouse').moveTo(posStart.x, posStart.y);
	});

	afterEach(() => {
		vi.useRealTimers();
		removeMapContainer(map, container);
	});

	it('fires synthetic contextmenu after hold delay>600', async () => {
		await touchFinger.down();
		vi.advanceTimersByTime(550);

		expect(spy).not.toHaveBeenCalled();

		vi.advanceTimersByTime(100);

		expect(spy).toHaveBeenCalled();
		expect(spy).toHaveBeenCalledOnce();

		const event = spy.mock.lastCall[0];
		expect(event.type).to.equal('contextmenu');
		expect(event.originalEvent._simulated).to.be.true;
		await touchFinger.up();
	});

	it('does not fire contextmenu when multiple pointers touches', async () => {
		await Promise.all([touchFinger.down(), touchFinger2.down()]);
		vi.advanceTimersByTime(100);
		await touchFinger.up();
		vi.advanceTimersByTime(500);
		await touchFinger2.up();
		vi.advanceTimersByTime(400);

		expect(spy).not.toHaveBeenCalled();
	});

	it('does not fire contextmenu when multiple pointers touches > 1 (case:2)', async () => {
		expect(spy).not.toHaveBeenCalled();

		await touchFinger.down();
		vi.advanceTimersByTime(100);
		await touchFinger2.down();
		vi.advanceTimersByTime(550);
		await touchFinger.up();
		vi.advanceTimersByTime(100);

		expect(spy).not.toHaveBeenCalled();
		await touchFinger2.up();
	});

	it('ignores events from mouse', async () => {
		await mouseFinger.down();
		vi.advanceTimersByTime(650);
		await mouseFinger.up();
		vi.advanceTimersByTime(100);

		expect(spy).not.toHaveBeenCalled();
	});

	it('does not conflict with native contextmenu', async () => {
		await touchFinger.down();
		vi.advanceTimersByTime(560);

		UIEventSimulator.fire('contextmenu', container);

		vi.advanceTimersByTime(100);
		await touchFinger.up();

		expect(spy).toHaveBeenCalled();
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.lastCall[0].originalEvent._simulated).not.to.be.true;
	});

	it('swallows native contextmenu that comes after the simulated one', async () => {
		await touchFinger.down();
		vi.advanceTimersByTime(660);

		const nativeEvent = new MouseEvent('contextmenu', {bubbles: true, cancelable: true});
		container.dispatchEvent(nativeEvent);

		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.lastCall[0].originalEvent._simulated).to.be.true;
		expect(nativeEvent.defaultPrevented).to.be.true;

		await touchFinger.up();

		// up to the next press only, e.g. a right click
		await mouseFinger.down().up();
		UIEventSimulator.fire('contextmenu', container);
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('prevents native click', async () => {
		const clickSpy = vi.fn();
		map.on('click', clickSpy);

		await touchFinger.down();
		vi.advanceTimersByTime(650);
		await touchFinger.up();
		expect(clickSpy).not.toHaveBeenCalled();

		await touchFinger.down();
		vi.advanceTimersByTime(100);
		await touchFinger.up();
		expect(clickSpy).toHaveBeenCalled();
	});

	it('allows short movements', async () => {
		await touchFinger.down();
		vi.advanceTimersByTime(550);
		await touchFinger.moveTo(posNear.x, posNear.y);
		vi.advanceTimersByTime(100);
		await touchFinger.up();

		expect(spy).toHaveBeenCalled();
	});

	it('ignores long movements', async () => {
		expect(new Point(posStart.x, posStart.y).distanceTo([posFar.x, posFar.y]))
			.to.be.above(map.options.tapTolerance);

		await touchFinger.down();
		vi.advanceTimersByTime(550);
		await touchFinger.moveTo(posFar.x, posFar.y);
		vi.advanceTimersByTime(100);
		await touchFinger.up();
		expect(spy).not.toHaveBeenCalled();

		await touchFinger.down();
		vi.advanceTimersByTime(650);
		await touchFinger.up();
		expect(spy).toHaveBeenCalled();
	});

	it('.originalEvent has expected properties', async () => {
		await touchFinger.moveTo(2, 2).down();
		vi.advanceTimersByTime(625);
		await touchFinger.up();

		const originalEvent = spy.mock.lastCall[0].originalEvent;
		const expectedProps = {
			type: 'contextmenu',
			bubbles: true,
			cancelable: true,
			target: container,
			screenX: 2,
			screenY: 2
		};
		for (const [prop, expectedValue] of Object.entries(expectedProps)) {
			expect(originalEvent[prop]).to.equal(expectedValue);
		}
	});
});
