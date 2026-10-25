import {expect, vi} from 'vite-plus/test';
import {DomEvent, MaplairMap, Util} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';

describe('DomEvent', () => {
	let el, listener;

	beforeEach(() => {
		el = document.createElement('div');
		document.body.appendChild(el);
		listener = vi.fn();
	});

	afterEach(() => {
		document.body.removeChild(el);
	});

	describe('#arguments check', () => {
		it('throws when el is not HTMLElement', () => {
			expect(() => DomEvent.on({}, 'click', Util.falseFn)).to.throw();
			expect(() => DomEvent.disableScrollPropagation({})).to.throw();
			expect(() => DomEvent.disableClickPropagation({})).to.throw();
			expect(() => DomEvent.getPointerPosition({clientX: 0, clientY: 0}, {})).to.throw();
			// .off and .isExternalTarget do not throw atm
		});
	});

	describe('#on', () => {
		it('throws when type is undefined and context is falseFn', () => {
			expect(() => DomEvent.on(el, undefined, Util.falseFn)).to.throw();
		});

		it('throws when type is null and context is falseFn', () => {
			expect(() => DomEvent.on(el, null, Util.falseFn)).to.throw();
		});

		it('throws when type is false and context is falseFn', () => {
			expect(() => DomEvent.on((el, false, Util.falseFn))).to.throw();
		});

		it('throws when type is "click" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'click', undefined)).to.throw();
		});

		it('throws when type is "click" and context is null', () => {
			expect(() => DomEvent.on(el, 'click', null)).to.throw();
		});

		it('throws when type is "click" and context is false', () => {
			expect(() => DomEvent.on(el, 'click', false)).to.throw();
		});

		it('throws when type is "click" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'click', undefined)).to.throw();
		});

		it('throws when type is "dblclick" and context is null', () => {
			expect(() => DomEvent.on(el, 'dblclick', null)).to.throw();
		});

		it('throws when type is "dblclick" and context is false', () => {
			expect(() => DomEvent.on(el, 'dblclick', false)).to.throw();
		});

		it('throws when type is "dblclick" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'dblclick', undefined)).to.throw();
		});

		it('throws when type is "pointerdown" and context is null', () => {
			expect(() => DomEvent.on(el, 'pointerdown', null)).to.throw();
		});

		it('throws when type is "pointerdown" and context is false', () => {
			expect(() => DomEvent.on(el, 'pointerdown', false)).to.throw();
		});

		it('throws when type is "pointerdown" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'pointerdown', undefined)).to.throw();
		});

		it('throws when type is "pointerup" and context is null', () => {
			expect(() => DomEvent.on(el, 'pointerup', null)).to.throw();
		});

		it('throws when type is "pointerup" and context is false', () => {
			expect(() => DomEvent.on(el, 'pointerup', false)).to.throw();
		});

		it('throws when type is "pointerup" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'pointerup', undefined)).to.throw();
		});

		it('throws when type is "pointerover" and context is null', () => {
			expect(() => DomEvent.on(el, 'pointerover', null)).to.throw();
		});

		it('throws when type is "pointerover" and context is false', () => {
			expect(() => DomEvent.on(el, 'pointerover', false)).to.throw();
		});

		it('throws when type is "pointerover" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'pointerover', undefined)).to.throw();
		});

		it('throws when type is "pointerout" and context is null', () => {
			expect(() => DomEvent.on(el, 'pointerout', null)).to.throw();
		});

		it('throws when type is "pointerout" and context is false', () => {
			expect(() => DomEvent.on(el, 'pointerout', false)).to.throw();
		});

		it('throws when type is "pointerout" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'pointerout', undefined)).to.throw();
		});

		it('throws when type is "pointermove" and context is null', () => {
			expect(() => DomEvent.on(el, 'pointermove', null)).to.throw();
		});

		it('throws when type is "pointermove" and context is false', () => {
			expect(() => DomEvent.on(el, 'pointermove', false)).to.throw();
		});

		it('throws when type is "pointermove" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'pointermove', undefined)).to.throw();
		});

		it('throws when type is "contextmenu" and context is null', () => {
			expect(() => DomEvent.on(el, 'contextmenu', null)).to.throw();
		});

		it('throws when type is "contextmenu" and context is false', () => {
			expect(() => DomEvent.on(el, 'contextmenu', false)).to.throw();
		});

		it('throws when type is "contextmenu" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'contextmenu', undefined)).to.throw();
		});

		it('throws when type is "keyup" and context is null', () => {
			expect(() => DomEvent.on(el, 'keyup', null)).to.throw();
		});

		it('throws when type is "keyup" and context is false', () => {
			expect(() => DomEvent.on(el, 'keyup', false)).to.throw();
		});

		it('throws when type is "keyup" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'keyup', undefined)).to.throw();
		});

		it('throws when type is "keypress" and context is null', () => {
			expect(() => DomEvent.on(el, 'keypress', null)).to.throw();
		});

		it('throws when type is "keypress" and context is false', () => {
			expect(() => DomEvent.on(el, 'keypress', false)).to.throw();
		});

		it('throws when type is "keypress" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'keypress', undefined)).to.throw();
		});

		it('throws when type is "keydown" and context is null', () => {
			expect(() => DomEvent.on(el, 'keydown', null)).to.throw();
		});

		it('throws when type is "keydown" and context is false', () => {
			expect(() => DomEvent.on(el, 'keydown', false)).to.throw();
		});

		it('throws when type is "keydown" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'keydown', undefined)).to.throw();
		});

		it('throws when type is "keydown and click" and context is null', () => {
			expect(() => DomEvent.on(el, 'keydown click', null)).to.throw();
		});

		it('throws when type is "keydown and click" and context is false', () => {
			expect(() => DomEvent.on(el, 'keydown click', false)).to.throw();
		});

		it('throws when type is "keydown and click" and context is undefined', () => {
			expect(() => DomEvent.on(el, 'keydown click', undefined)).to.throw();
		});

		it('adds a listener and calls it on event with click', () => {
			const listener2 = vi.fn();
			DomEvent.on(el, 'click', listener);
			DomEvent.on(el, 'click', listener2);

			UIEventSimulator.fire('click', el);

			expect(listener).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
		});

		it('adds a listener and calls it on event with click and keypress', () => {
			const listener2 = vi.fn();
			DomEvent.on(el, 'click keypress', listener);
			DomEvent.on(el, 'click', listener2);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
		});

		it('adds a listener when passed an event map', () => {
			const listener = vi.fn();

			DomEvent.on(el, {click: listener});

			UIEventSimulator.fire('click', el);

			expect(listener).toHaveBeenCalled();
		});

		it('adds 2 listener when passed an event map with multiple events', () => {
			const listener2 = vi.fn();

			DomEvent.on(el, {click: listener, keypress: listener2});

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener).toHaveBeenCalled();
			expect(listener2).toHaveBeenCalled();
		});

		it('binds "this" to the given context', () => {
			const obj = {foo: 'bar'};
			DomEvent.on(el, 'click', listener, obj);

			UIEventSimulator.fire('click', el);

			expect(listener.mock.contexts).to.include(obj);
		});

		it('binds "this" to the given context with multiple types', () => {
			const obj = {foo: 'bar'};
			DomEvent.on(el, 'click keypress', listener, obj);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener.mock.contexts).to.include(obj);
		});

		it('binds "this" to the given context when passed an event map', () => {
			const listener = vi.fn(),
			ctx = {foo: 'bar'};

			DomEvent.on(el, {click: listener}, ctx);

			UIEventSimulator.fire('click', el);

			expect(listener.mock.contexts).to.include(ctx);
		});

		it('binds "this" to the given context when passed an event map with multiple events', () => {
			const listener2 = vi.fn(),
			ctx = {foo: 'bar'};

			DomEvent.on(el, {click: listener, keypress: listener2}, ctx);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener.mock.contexts).to.include(ctx);
			expect(listener2.mock.contexts).to.include(ctx);
		});

		it('passes an event object to the listener', () => {
			DomEvent.on(el, 'click', listener);

			UIEventSimulator.fire('click', el);

			expect(listener.mock.lastCall[0].type).to.eql('click');
		});

		it('passes two event objects to the listener', () => {
			DomEvent.on(el, 'click keypress', listener);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener.mock.calls[0][0].type).to.eql('click');
			expect(listener.mock.calls[1][0].type).to.eql('keypress');
		});

		it('is chainable', () => {
			const res = DomEvent.on(el, 'click', () => {});

			expect(res).to.equal(DomEvent);
		});
	});

	describe('#off', () => {
		it('removes a previously added listener', () => {
			DomEvent.on(el, 'click', listener);
			DomEvent.off(el, 'click', listener);

			UIEventSimulator.fire('click', el);

			expect(listener).not.toHaveBeenCalled();
		});

		it('removes a previously added event', () => {
			DomEvent.on(el, 'click keypress', listener);
			DomEvent.off(el, 'click', listener);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener.mock.lastCall[0].type).to.eql('keypress');
		});

		it('only removes the specified listener', () => {
			const listenerA = vi.fn(),
			listenerB = vi.fn();

			DomEvent.on(el, 'click', listenerA);
			DomEvent.on(el, 'click', listenerB);
			DomEvent.off(el, 'click', listenerA);

			UIEventSimulator.fire('click', el);

			expect(listenerA).not.toHaveBeenCalled();
			expect(listenerB).toHaveBeenCalled();
		});

		it('removes a previously added listener when passed an event map', () => {
			const listener = vi.fn(),
			events = {click: listener};

			DomEvent.on(el, events);
			DomEvent.off(el, events);

			UIEventSimulator.fire('click', el);

			expect(listener).not.toHaveBeenCalled();
		});

		it('removes a previously added listener when passed an event map with multiple events', () => {
			const listener2 = vi.fn(),
			events = {click: listener, keypress: listener2};

			DomEvent.on(el, events);
			DomEvent.off(el, events);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener).not.toHaveBeenCalled();
			expect(listener2).not.toHaveBeenCalled();
		});

		it('removes a previously added event when passed an event map with multiple events', () => {
			const listener2 = vi.fn(),
			events = {click: listener, keypress: listener2},
			events2 = {click: listener};

			DomEvent.on(el, events);
			DomEvent.off(el, events2);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener).not.toHaveBeenCalled();
			expect(listener2.mock.lastCall[0].type).to.eql('keypress');
		});

		it('removes listener added with context', () => {
			const listener = vi.fn(),
			ctx = {foo: 'bar'};

			DomEvent.on(el, 'click', listener, ctx);
			DomEvent.off(el, 'click', listener, ctx);

			UIEventSimulator.fire('click', el);

			expect(listener).not.toHaveBeenCalled();
		});

		it('removes listener added with context when passed an event map', () => {
			const listener = vi.fn(),
			events = {click: listener},
			ctx = {foo: 'bar'};

			DomEvent.on(el, events, ctx);
			DomEvent.off(el, events, ctx);

			UIEventSimulator.fire('click', el);

			expect(listener).not.toHaveBeenCalled();
		});

		it('removes listener added with context when passed an event map with multiple events', () => {
			const listener2 = vi.fn(),
			events = {click: listener, keypress: listener2},
			events2 = {click: listener},
			ctx = {foo: 'bar'};

			DomEvent.on(el, events, ctx);
			DomEvent.off(el, events2, ctx);

			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('keypress', el);

			expect(listener).not.toHaveBeenCalled();
			expect(listener2.mock.lastCall[0].type).to.eql('keypress');
		});

		it('only removes listener when proper context specified', () => {
			let listener = vi.fn();
			const ctx = {foo: 'bar'};

			DomEvent.on(el, 'click', listener);
			DomEvent.off(el, 'click', listener, ctx);

			UIEventSimulator.fire('click', el);

			expect(listener).toHaveBeenCalled();

			listener = vi.fn();
			DomEvent.on(el, 'click', listener, ctx);
			DomEvent.off(el, 'click', listener, {}); // wrong context
			DomEvent.off(el, 'click', listener);

			UIEventSimulator.fire('click', el);

			expect(listener).toHaveBeenCalled();
		});

		it('only removes listener when proper context specified when passed an event map', () => {
			let listener = vi.fn(),
			events = {click: listener};
			const ctx = {foo: 'bar'};

			DomEvent.on(el, events);
			DomEvent.off(el, events, ctx);

			UIEventSimulator.fire('click', el);

			expect(listener).toHaveBeenCalled();

			listener = vi.fn();
			events = {click: listener};

			DomEvent.on(el, events, ctx);
			DomEvent.off(el, events);
			DomEvent.off(el, events, {}); // wrong context

			UIEventSimulator.fire('click', el);

			expect(listener).toHaveBeenCalled();
		});

		it('removes all listeners when only passed the HTMLElement', () => {
			const listenerA = vi.fn(),
			listenerB = vi.fn();

			DomEvent.on(el, 'click', listenerA);
			DomEvent.on(el, 'click', listenerB, {});
			DomEvent.off(el);

			UIEventSimulator.fire('click', el);

			expect(listenerA).not.toHaveBeenCalled();
			expect(listenerB).not.toHaveBeenCalled();
		});

		it('only removes specified listeners type', () => {
			const listenerClick = vi.fn(),
			listenerDblClick = vi.fn();

			DomEvent.on(el, 'click', listenerClick);
			DomEvent.on(el, 'dblclick', listenerDblClick);
			DomEvent.off(el, 'click');
			UIEventSimulator.fire('click', el);
			UIEventSimulator.fire('dblclick', el);

			expect(listenerClick).not.toHaveBeenCalled();
			expect(listenerDblClick).toHaveBeenCalled();
		});

		it('throws when types/fn are undefined/null/false', () => {
			expect(() => DomEvent.off(el, undefined)).to.throw();
			expect(() => DomEvent.off(el, null)).to.throw();
			expect(() => DomEvent.off(el, false)).to.throw();

			expect(() => DomEvent.off(el, 'click', undefined)).to.throw();
			expect(() => DomEvent.off(el, 'click', null)).to.throw();
			expect(() => DomEvent.off(el, 'click', false)).to.throw();
		});

		it('removes listener when passed an event map', () => {
			const listener = vi.fn();

			DomEvent.on(el, 'click', listener);
			DomEvent.off(el, {'click': listener});

			UIEventSimulator.fire('click', el);

			expect(listener).not.toHaveBeenCalled();
		});

		it('is chainable', () => {
			const res = DomEvent.off(el, 'click', () => {});

			expect(res).to.equal(DomEvent);
		});
	});

	describe('#getWheelDelta', () => {
		it('scales pixel deltas by device pixel ratio', () => {
			const e = new WheelEvent('wheel', {deltaY: 100, deltaMode: 0});
			const dpr = vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1);
			expect(DomEvent.getWheelDelta(e)).to.equal(-50);
			dpr.mockReturnValue(2);
			expect(DomEvent.getWheelDelta(e)).to.equal(-25);
			dpr.mockRestore();
		});
	});

	describe('#stopPropagation', () => {
		it('stops propagation of events from other windows (e.g. iframes)', () => {
			const iframe = document.createElement('iframe');
			document.body.appendChild(iframe);
			const event = new iframe.contentWindow.Event('click', {bubbles: true});
			DomEvent.stopPropagation(event);
			expect(event.cancelBubble).to.be.true;
			iframe.remove();
		});

		it('stops propagation of the given event', () => {
			const child = document.createElement('div');
			el.appendChild(child);
			DomEvent.on(child, 'click', DomEvent.stopPropagation);
			DomEvent.on(el, 'click', listener);

			UIEventSimulator.fire('click', child);

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('#disableScrollPropagation', () => {
		it('stops wheel events from propagation to parent elements', () => {
			const child = document.createElement('div');
			el.appendChild(child);
			const wheel = 'onwheel' in window ? 'wheel' : 'mousewheel';
			DomEvent.on(el, wheel, listener);

			DomEvent.disableScrollPropagation(child);
			UIEventSimulator.fire(wheel, child);

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe('#disableClickPropagation', () => {
		it('stops click events from propagation to parent elements', () => { // except 'click'
			const child = document.createElement('div');
			el.appendChild(child);
			DomEvent.disableClickPropagation(child);
			DomEvent.on(el, 'dblclick contextmenu pointerdown', listener);

			UIEventSimulator.fire('dblclick', child);
			UIEventSimulator.fire('contextmenu', child);
			UIEventSimulator.fire('pointerdown', child);

			expect(listener).not.toHaveBeenCalled();
		});

		it('prevents click event on map object, but propagates to DOM elements', () => { // to solve #301
			const child = document.createElement('div');
			el.appendChild(child);
			DomEvent.disableClickPropagation(child);
			DomEvent.on(el, 'click', listener);
			const grandChild = document.createElement('div');
			child.appendChild(grandChild);

			const map = new MaplairMap(el).setView([0, 0], 0);
			const mapClickListener = vi.fn();
			const mapOtherListener = vi.fn();
			map.on('click', mapClickListener);          // control case
			map.on('keydown', mapOtherListener);       // control case

			UIEventSimulator.fire('click', grandChild);
			UIEventSimulator.fire('keydown', grandChild);

			expect(mapOtherListener).toHaveBeenCalled(); // control case
			expect(listener).toHaveBeenCalled();
			expect(mapClickListener).not.toHaveBeenCalled();

			UIEventSimulator.fire('click', child);
			UIEventSimulator.fire('keydown', child);

			expect(listener).toHaveBeenCalledTimes(2);
			expect(mapClickListener).not.toHaveBeenCalled();

			map.remove();
		});
	});

	describe('#preventDefault', () => {
		it('prevents the default action of event', (done) => {
			DomEvent.on(el, 'click', (e) => {
				expect(e.defaultPrevented).not.to.be.true; // control case

				DomEvent.preventDefault(e);

				expect(e.defaultPrevented).to.be.true;
				done();
			});

			UIEventSimulator.fire('click', el);
		});
	});
});
