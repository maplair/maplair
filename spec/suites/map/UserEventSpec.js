import {expect} from 'vite-plus/test';
import {MaplairMap} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer, Finger} from '../SpecHelper.js';

describe('Map: originalEvent of user-initiated view changes', () => {
	let container, map, events;
	const types = ['movestart', 'move', 'moveend', 'zoomstart', 'zoom', 'zoomend', 'zoomanim'];

	function createMap(options) {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, ...options});
		map.setView([0, 0], 5);
		events = [];
		map.on(types.join(' '), e => events.push(e));
	}

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function originalEventTypes() {
		return [...new Set(events.map(e => e.originalEvent?.type))];
	}

	function nextEvent(type) {
		return new Promise((resolve) => {
			map.once(type, resolve);
		});
	}

	describe('without zoom animation', () => {
		beforeEach(() => {
			createMap();
		});

		it('has no originalEvent for changes by code', () => {
			map.setView([10, 10], 6);
			map.panBy([10, 10], {animate: false});
			map.fitBounds([[1, 1], [2, 2]]);
			expect(events.length).to.be.greaterThan(0);
			expect(originalEventTypes()).to.eql([undefined]);
		});

		it('has the dblclick event for double click zoom', () => {
			UIEventSimulator.fire('dblclick', container);
			expect(events.map(e => e.type)).to.include('zoomend');
			expect(originalEventTypes()).to.eql(['dblclick']);
		});

		it('has the click event for the zoom control', () => {
			UIEventSimulator.fire('click', container.querySelector('.maplair-control-zoom-in'));
			expect(events.map(e => e.type)).to.include('zoomend');
			expect(originalEventTypes()).to.eql(['click']);
		});

		it('has the keydown event for keyboard panning and zooming', () => {
			map.keyboard._onFocus();
			UIEventSimulator.fire('keydown', document, {key: '-', code: 'Minus'});
			expect(events.map(e => e.type)).to.include('zoomend');
			expect(originalEventTypes()).to.eql(['keydown']);
		});

		it('has the wheel event for scroll wheel zoom', async () => {
			const zoomend = nextEvent('zoomend');
			UIEventSimulator.fire('wheel', container, {deltaY: -120, deltaMode: 0});
			await zoomend;
			expect(originalEventTypes()).to.eql(['wheel']);
		});

		it('has the pointer events for dragging', async () => {
			const moveend = nextEvent('moveend');
			await new Finger().moveTo(200, 200).down().moveBy(50, 50).up();
			await moveend;
			expect(events.map(e => e.type)).to.include.members(['movestart', 'move', 'moveend']);
			for (const e of events) {
				expect(e.originalEvent).to.be.instanceOf(PointerEvent);
			}
		});

		it('has the pointer events for tap-drag zoom', async () => {
			const zoomend = nextEvent('zoomend');
			await new Finger('touch').moveTo(200, 200).down().up().down().moveBy(0, 128).up();
			await zoomend;
			expect(map.getZoom()).to.equal(6);
			for (const e of events) {
				expect(e.originalEvent).to.be.instanceOf(PointerEvent);
			}
		});

		it('has no originalEvent for changes by code after a user change', () => {
			UIEventSimulator.fire('dblclick', container);
			events.length = 0;
			map.setView([10, 10], 3);
			expect(events.length).to.be.greaterThan(0);
			expect(originalEventTypes()).to.eql([undefined]);
		});

		it('has no originalEvent for changes by code in a listener of a user change', () => {
			const inner = [];
			map.once('moveend', () => {
				map.once('moveend', e => inner.push(e));
				map.setView([10, 10], 3);
			});
			UIEventSimulator.fire('dblclick', container);
			expect(inner).to.have.length(1);
			expect(inner[0].originalEvent).to.be.undefined;
		});

		it('drops the originalEvent if the user interaction does not change the view', async () => {
			map.setZoom(map.getMaxZoom());
			UIEventSimulator.fire('click', container.querySelector('.maplair-control-zoom-in'));
			await Promise.resolve();
			events.length = 0;
			map.setView([10, 10], 3);
			expect(originalEventTypes()).to.eql([undefined]);
		});
	});

	describe('with zoom animation', () => {
		beforeEach(() => {
			createMap({zoomAnimation: true});
		});

		it('keeps the originalEvent until the end of the animation', async () => {
			const zoomend = nextEvent('zoomend');
			UIEventSimulator.fire('click', container.querySelector('.maplair-control-zoom-in'));
			await zoomend;
			expect(events.map(e => e.type)).to.include.members(['zoomstart', 'zoomanim', 'zoomend', 'moveend']);
			expect(originalEventTypes()).to.eql(['click']);

			events.length = 0;
			map.setView([10, 10], 3, {animate: false});
			expect(originalEventTypes()).to.eql([undefined]);
		});
	});
});
