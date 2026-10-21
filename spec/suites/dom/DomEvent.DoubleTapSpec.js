import {expect, vi} from 'vite-plus/test';
import {Control, DomEvent, DomUtil, MaplairMap} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('DomEvent.DoubleTapSpec.js', () => {
	let container, spy;

	beforeEach(() => {
		container = createContainer();

		vi.useFakeTimers({
			now: 0,
			toFake: ['setTimeout', 'clearTimeout', 'Date']
		});
		vi.advanceTimersByTime(1000);
		spy = vi.fn();
		DomEvent.on(container, 'dblclick', spy);
	});

	afterEach(() => {
		vi.useRealTimers();
		removeMapContainer(null, container);
	});

	it('fires synthetic dblclick after two clicks with delay<200', () => {
		UIEventSimulator.fire('click', container, {detail: 1});
		vi.advanceTimersByTime(100);
		UIEventSimulator.fire('click', container, {detail: 1});

		expect(spy).toHaveBeenCalled();
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.lastCall[0] instanceof MouseEvent).to.equal(true);
		expect(spy.mock.lastCall[0].isTrusted).to.equal(false);
	});

	it('does not fire dblclick when delay>200', () => {
		UIEventSimulator.fire('click', container, {detail: 1});
		vi.advanceTimersByTime(300);
		UIEventSimulator.fire('click', container, {detail: 1});

		expect(spy).not.toHaveBeenCalled();
	});

	it('does not fire dblclick after removeListener', () => {
		DomEvent.off(container, 'dblclick', spy);

		UIEventSimulator.fire('click', container, {detail: 1});
		vi.advanceTimersByTime(100);
		UIEventSimulator.fire('click', container, {detail: 1});
		vi.advanceTimersByTime(100);

		expect(spy).not.toHaveBeenCalled();
	});

	it('does not conflict with native dblclick', () => {
		UIEventSimulator.fire('click', container, {detail: 1});
		vi.advanceTimersByTime(100);
		UIEventSimulator.fire('click', container, {detail: 2}); // native dblclick expected
		UIEventSimulator.fire('dblclick', container); // native dblclick expected
		expect(spy).toHaveBeenCalled();
		expect(spy).toHaveBeenCalledOnce();
	});

	function tap(pointerDownType, clickType) {
		container.dispatchEvent(new PointerEvent('pointerdown', {pointerType: pointerDownType, bubbles: true}));
		container.dispatchEvent(new PointerEvent('click', {pointerType: clickType, detail: 1, bubbles: true}));
	}

	it('fires synthetic dblclick when touch clicks report a mouse pointerType (iOS Safari)', () => {
		tap('touch', 'mouse');
		vi.advanceTimersByTime(100);
		tap('touch', 'mouse');

		expect(spy).toHaveBeenCalledOnce();
	});

	it('does not fire synthetic dblclick for mouse clicks', () => {
		tap('mouse', 'mouse');
		vi.advanceTimersByTime(100);
		tap('mouse', 'mouse');

		expect(spy).not.toHaveBeenCalled();
	});

	it('synthetic dblclick event has expected properties', () => {
		const click = {
			detail: 1,
			clientX: 2,
			clientY: 3,
			screenX: 4,
			screenY: 5
		};
		UIEventSimulator.fire('click', container, click);
		vi.advanceTimersByTime(100);
		UIEventSimulator.fire('click', container, click);

		const event = spy.mock.lastCall[0];
		const expectedProps = {
			...click,
			type: 'dblclick',
			// bubbles: true,    // not important, as we do not actually dispatch the event
			// cancelable: true, //
			detail: 2,
			target: container
		};
		for (const [prop, expectedValue] of Object.entries(expectedProps)) {
			expect(event[prop]).to.equal(expectedValue);
		}
		expect(event.isTrusted).not.to.be.true;
	});

	it('respects disableClickPropagation', () => {
		const spyMap = vi.fn();
		const map = new MaplairMap(container).setView([51.505, -0.09], 13);
		map.on('dblclick', spyMap);

		const spyCtrl = vi.fn();
		const ctrl = DomUtil.create('div');
		DomEvent.disableClickPropagation(ctrl);
		class MyControl extends Control {
			onAdd() {
				return ctrl;
			}
		}
		map.addControl(new MyControl());
		DomEvent.on(ctrl, 'dblclick', spyCtrl);

		UIEventSimulator.fire('click', ctrl, {detail: 1});
		vi.advanceTimersByTime(100);
		UIEventSimulator.fire('click', ctrl, {detail: 1});

		expect(spyCtrl).toHaveBeenCalled();
		expect(spyMap).not.toHaveBeenCalled();
	});

	it('doesn\'t fire double-click while clicking on a label with `for` attribute', () => {
		const spyMap = vi.fn();
		const map = new MaplairMap(container).setView([51.505, -0.09], 13);
		map.on('dblclick', spyMap);

		let div;
		class MyControl extends Control {
			onAdd() {
				div = DomUtil.create('div');
				div.innerHTML = '<input type="checkbox" id="input">' +
					'<label for="input" style="background: #ffffff; width: 100px; height: 100px;display: block;">Click Me</label>';
				return div;
			}
		}
		map.addControl(new MyControl());
		// click on the label
		UIEventSimulator.fire('click', div.children[1], {detail: 1});
		vi.advanceTimersByTime(100);
		expect(spyMap).not.toHaveBeenCalled();
		map.remove();
	});
});
