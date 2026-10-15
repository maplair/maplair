import {expect, vi} from 'vite-plus/test';
import {Class, Evented, FeatureGroup, Marker, Util} from 'maplair';

describe('Events', () => {
	describe('#fire', () => {
		it('fires all listeners added through #on', () => {
			const obj = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn(),
			spy3 = vi.fn(),
			spy4 = vi.fn(),
			spy5 = vi.fn();
			// spy6 = vi.fn();

			obj.on('test', spy1);
			obj.on('test', spy2);
			obj.on('other', spy3);
			obj.on({test: spy4, other: spy5});
			// obj.on({'test other': spy6 });

			expect(spy1).not.toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();
			expect(spy3).not.toHaveBeenCalled();
			expect(spy4).not.toHaveBeenCalled();
			expect(spy5).not.toHaveBeenCalled();
			// expect(spy6).not.toHaveBeenCalled();

			obj.fire('test');

			expect(spy1).toHaveBeenCalled();
			expect(spy2).toHaveBeenCalled();
			expect(spy3).not.toHaveBeenCalled();
			expect(spy4).toHaveBeenCalled();
			expect(spy5).not.toHaveBeenCalled();
			// expect(spy6).toHaveBeenCalled();
			// expect(spy6).toHaveBeenCalledTimes(1);
		});

		it('fires all listeners in the order they are added', () => {
			const obj = new Evented(),
			ctx1 = new Class(),
			ctx2 = new Class(),
			count = {one: 0, two: 0, three: 0, four: 0};

			function listener1() {
				count.one++;
				expect(count.two).to.eql(0);
			}

			function listener2() {
				count.two++;
				expect(count.one).to.eql(1);
				expect(count.three).to.eql(0);
				if (count.two === 1) {
					expect(this).to.eql(ctx2);
				} else if (count.two === 2) {
					expect(this).to.eql(ctx1);
				} else {
					expect(this).to.eql(obj);
				}
			}

			function listener3() {
				count.three++;
				expect(count.two).to.eql(3);
				expect(count.four).to.eql(0);
				if (count.three === 1) {
					expect(this).to.eql(ctx1);
				} else if (count.three === 2) {
					expect(this).to.eql(ctx2);
				}
			}

			function listener4() {
				count.four++;
				expect(count.three).to.eql(2);
			}

			obj.on('test', listener1, ctx1);
			obj.on('test', listener2, ctx2);
			obj.on('test', listener2, ctx1);  // Same listener but with different context.
			obj.on('test', listener2);  // Same listener but without context.
			obj.on('test', listener3, ctx1);
			obj.on('test', listener3, ctx2);
			obj.on('test', listener4, ctx2);

			obj.fire('test');

			expect(count.one).to.equal(1);
			expect(count.two).to.equal(3);
			expect(count.three).to.equal(2);
			expect(count.four).to.equal(1);
		});

		it('provides event object to listeners and executes them in the right context', () => {
			const obj = new Evented(),
			obj2 = new Evented(),
			obj3 = new Evented(),
			obj4 = new Evented(),
			foo = {};

			function listener1(e) {
				expect(e.type).to.eql('test');
				expect(e.target).to.eql(obj);
				expect(this).to.eql(obj);
				expect(e.baz).to.eql(1);
			}

			function listener2(e) {
				expect(e.type).to.eql('test');
				expect(e.target).to.eql(obj2);
				expect(this).to.eql(foo);
				expect(e.baz).to.eql(2);
			}

			function listener3(e) {
				expect(e.type).to.eql('test');
				expect(e.target).to.eql(obj3);
				expect(this).to.eql(obj3);
				expect(e.baz).to.eql(3);
			}

			function listener4(e) {
				expect(e.type).to.eql('test');
				expect(e.target).to.eql(obj4);
				expect(this).to.eql(foo);
				expect(e.baz).to.eql(4);
			}

			obj.on('test', listener1);
			obj2.on('test', listener2, foo);
			obj3.on({test: listener3});
			obj4.on({test: listener4}, foo);

			obj.fire('test', {baz: 1});
			obj2.fire('test', {baz: 2});
			obj3.fire('test', {baz: 3});
			obj4.fire('test', {baz: 4});
		});

		it('calls no listeners removed through #off', () => {
			const obj = new Evented(),
			spy = vi.fn(),
			spy2 = vi.fn(),
			spy3 = vi.fn(),
			spy4 = vi.fn(),
			spy5 = vi.fn();

			obj.on('test', spy);
			obj.off('test', spy);

			obj.fire('test');

			expect(spy).not.toHaveBeenCalled();

			obj.on('test2', spy2);
			obj.on('test2', spy3);
			obj.off('test2');

			obj.fire('test2');

			expect(spy2).not.toHaveBeenCalled();
			expect(spy3).not.toHaveBeenCalled();

			obj.on('test3', spy4);
			obj.on('test4', spy5);
			obj.off({
				test3: spy4,
				test4: spy5
			});

			obj.fire('test3');
			obj.fire('test4');

			expect(spy4).not.toHaveBeenCalled();
			expect(spy5).not.toHaveBeenCalled();
		});

		it('can handle calls to #off on objects with no registered event listeners', () => {
			const obj = new Evented();
			const removeNonExistentListener = function () {
				obj.off('test');
			};
			expect(removeNonExistentListener).to.not.throw();
		});

		// added due to context-sensitive removeListener optimization
		it('fires multiple listeners with the same context with id', () => {
			const obj = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn(),
			foo = {};

			Util.stamp(foo);

			obj.on('test', spy1, foo);
			obj.on('test', spy2, foo);

			obj.fire('test');

			expect(spy1).toHaveBeenCalled();
			expect(spy2).toHaveBeenCalled();
		});

		it('removes listeners with stamped contexts', () => {
			const obj = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn(),
			foo = {};

			Util.stamp(foo);

			obj.on('test', spy1, foo);
			obj.on('test', spy2, foo);

			obj.off('test', spy1, foo);

			obj.fire('test');

			expect(spy1).not.toHaveBeenCalled();
			expect(spy2).toHaveBeenCalled();
		});

		it('removes listeners with a stamp originally added without one', () => {
			const obj = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn(),
			foo = {};

			obj.on('test', spy1, foo);
			Util.stamp(foo);
			obj.on('test', spy2, foo);

			obj.off('test', spy1, foo);
			obj.off('test', spy2, foo);

			obj.fire('test');

			expect(spy1).not.toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();
		});

		it('removes listeners with context == this and a stamp originally added without one', () => {
			const obj = new Evented(),
			obj2 = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn(),
			spy3 = vi.fn();

			obj.on('test', spy1, obj);
			Util.stamp(obj);
			obj.on('test', spy2, obj);
			obj.on('test', spy3, obj2); // So that there is a contextId based listener, otherwise off will do correct behaviour anyway

			obj.off('test', spy1, obj);
			obj.off('test', spy2, obj);
			obj.off('test', spy3, obj2);

			obj.fire('test');

			expect(spy1).not.toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();
			expect(spy3).not.toHaveBeenCalled();
		});

		it('doesnt lose track of listeners when removing non existent ones', () => {
			const obj = new Evented(),
			spy = vi.fn(),
			spy2 = vi.fn(),
			foo = {},
			foo2 = {};

			Util.stamp(foo);
			Util.stamp(foo2);

			obj.on('test', spy, foo2);

			obj.off('test', spy, foo); // Decrements test_idx to 0, even though event listener isn't registered with foo's _maplair_id
			obj.off('test', spy, foo2);  // Doesn't get removed

			obj.on('test', spy2, foo);

			obj.fire('test');

			expect(spy).not.toHaveBeenCalled();
		});

		it('correctly removes all listeners if given no fn', () => {
			const obj = new Evented(),
			spy = vi.fn(),
			foo2 = {},
			foo3 = {};

			obj.on('test', spy, foo2);
			obj.on('test', spy, foo3);

			obj.off('test'); // Removes both of the above listeners

			expect(obj.listens('test')).to.be.false;

			// Add and remove a listener
			obj.on('test', spy, foo2);
			obj.off('test', spy, foo2);

			expect(obj.listens('test')).to.be.false;

			// Add and remove a listener without context
			obj.on('test', spy);
			obj.off('test', spy);

			expect(obj.listens('test')).to.be.false;
		});

		it('makes sure an event is not triggered if a listener is removed during dispatch', () => {
			const obj = new Evented(),
			spy = vi.fn(),
			spy2 = vi.fn(),
			foo = {};

			/* without context */
			obj.on('test', () => { obj.off('test', spy); });
			obj.on('test', spy);
			obj.fire('test');

			expect(spy).not.toHaveBeenCalled();

			/* with context */
			obj.on('test2', () => { obj.off('test2', spy2, foo); }, foo);
			obj.on('test2', spy2, foo);
			obj.fire('test2');
		});

		it('makes sure an event is not triggered if all listeners are removed during dispatch', () => {
			const obj = new Evented(),
			spy = vi.fn();

			obj.on('test', () => { obj.off('test'); });
			obj.on('test', spy);
			obj.fire('test');

			expect(spy).not.toHaveBeenCalled();
		});

		it('handles reentrant event firing', () => {
			const obj = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn();

			obj
				.on('test1', () => {
					obj.fire('test2');
				})
				.on('test2', spy1)
				.on('test1', () => {
					obj.off('test1', spy2);
				})
				.on('test1', spy2);

			obj.fire('test1');
			expect(spy1).toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();
		});

		it('can remove an event listener while firing', () => {
			const obj = new Evented(),
			spy = vi.fn();

			const removeSpy = function () {
				obj.off('test', spy);
			};

			obj.on('test', spy);
			obj.on('test', removeSpy);

			obj.fire('test');

			obj.off('test', removeSpy);

			expect(obj.listens('test')).to.be.false;
		});
	});

	describe('#on, #off & #fire', () => {
		it('does not remove all listeners when any fn argument specified', () => {
			const obj = new Evented();
			obj.on('test', Util.falseFn);
			obj.off('test', undefined);
			obj.off({test: undefined});

			expect(obj.listens('test')).to.be.true;
		});

		it('ignores non-function listeners passed', () => {
			const obj = new Evented();
			const off = obj.off.bind(obj);
			['string', {}, [], true, false, undefined].forEach((fn) => {
				obj.on('test', fn);
				expect(obj.listens('test')).to.be.false;
				expect(() => off('test', fn)).to.not.throw();
			});
		});

		it('throws with wrong types passed', () => {
			const obj = new Evented();
			const on = obj.on.bind(obj);
			const off = obj.off.bind(obj);
			// todo? make it throw  with []
			[true, false, undefined, 1].forEach((type) => {
				expect(() => on(type, Util.falseFn)).to.throw();
				expect(() => off(type, Util.falseFn)).to.throw();
			});

			// todo? make `fire` and `listen` to throw with wrong type
		});

		it('does not override existing methods with the same name', () => {
			const spy1 = vi.fn(),
			spy2 = vi.fn(),
			spy3 = vi.fn();

			class Klass extends Evented {
				on = spy1;
				off = spy2;
				fire = spy3;
			}

			const obj = new Klass();

			obj.on();
			expect(spy1).toHaveBeenCalled();

			obj.off();
			expect(spy2).toHaveBeenCalled();

			obj.fire();
			expect(spy3).toHaveBeenCalled();
		});

		it('does not add twice the same function', () => {
			const obj = new Evented(),
			spy = vi.fn();

			/* register without context */
			obj.on('test', spy);
			obj.on('test', spy);

			/* Should be called once */
			obj.fire('test');

			expect(spy).toHaveBeenCalledTimes(1);
		});
	});

	describe('#clearEventListeners', () => {
		it('clears all registered listeners on an object', () => {
			const spy = vi.fn(),
			obj = new Evented(),
			otherObj = new Evented();

			obj.on('test', spy, obj);
			obj.on('testTwo', spy);
			obj.on('test', spy, otherObj);
			obj.off();

			obj.fire('test');

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('#once', () => {
		it('removes event listeners after first trigger', () => {
			const obj = new Evented(),
			spy = vi.fn();

			obj.once('test', spy, obj);
			obj.fire('test');

			expect(spy).toHaveBeenCalled();

			obj.fire('test');

			expect(spy.mock.calls.length).to.be.lessThan(2);
		});

		it('works with an object hash', () => {
			const obj = new Evented(),
			spy = vi.fn(),
			otherSpy = vi.fn();

			obj.once({
				'test': spy,
				otherTest: otherSpy
			}, obj);

			obj.fire('test');
			obj.fire('otherTest');

			expect(spy).toHaveBeenCalled();
			expect(otherSpy).toHaveBeenCalled();

			obj.fire('test');
			obj.fire('otherTest');

			expect(spy.mock.calls.length).to.be.lessThan(2);
			expect(otherSpy.mock.calls.length).to.be.lessThan(2);
		});

		it('doesn\'t call listeners to events that have been removed', () => {
			const obj = new Evented(),
			spy = vi.fn();

			obj.once('test', spy, obj);
			obj.off('test', spy, obj);

			obj.fire('test');

			expect(spy).not.toHaveBeenCalled();
		});

		it('doesn\'t call once twice', () => {
			const obj = new Evented(),
			spy = vi.fn();
			obj.once('test', () => {
				spy();
				obj.fire('test');
			}, obj);

			obj.fire('test');

			expect(spy).toHaveBeenCalledOnce();
		});


		it('works if called from a context that doesnt implement #Events', () => {
			const obj = new Evented(),
			spy = vi.fn(),
			foo = {};

			obj.once('test', spy, foo);

			obj.fire('test');

			expect(spy).toHaveBeenCalled();
		});
	});

	describe('addEventParent && removeEventParent', () => {
		it('makes the object propagate events with to the given one if fired with propagate=true', () => {
			const obj = new Evented(),
			parent1 = new Evented(),
			parent2 = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn();

			parent1.on('test', spy1);
			parent2.on('test', spy2);

			obj.addEventParent(parent1).addEventParent(parent2);

			obj.fire('test');

			expect(spy1).not.toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();

			obj.fire('test', null, true);

			expect(spy1).toHaveBeenCalled();
			expect(spy2).toHaveBeenCalled();

			obj.removeEventParent(parent1);

			obj.fire('test', null, true);

			expect(spy1).toHaveBeenCalledTimes(1);
			expect(spy2).toHaveBeenCalledTimes(2);
		});

		it('can fire event where child has no listeners', () => {
			const obj = new Evented(),
			parent = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn();

			/* register without context */
			obj.on('test', spy1);
			parent.on('test2', spy2);

			obj.addEventParent(parent);

			/* Should be called once */
			obj.fire('test2', null, true);

			expect(spy1).toHaveBeenCalledTimes(0);
			expect(spy2).toHaveBeenCalledTimes(1);
		});

		it('sets target, sourceTarget and layer correctly', () => {
			const obj = new Evented(),
			parent = new Evented(),
			spy1 = vi.fn(),
			spy2 = vi.fn();

			/* register without context */
			obj.on('test2', spy1);
			parent.on('test2', spy2);

			obj.addEventParent(parent);

			/* Should be called once */
			obj.fire('test2', null, true);

			expect(spy1).toHaveBeenCalledWith({
				type: 'test2',
				target: obj,
				sourceTarget: obj
			});
			expect(spy2).toHaveBeenCalledWith({
				type: 'test2',
				target: parent,
				sourceTarget: obj,
				propagatedFrom: obj
			});
		});
	});

	describe('#listens', () => {
		it('is false if there is no event handler', () => {
			const obj = new Evented();

			expect(obj.listens('test')).to.be.false;
		});

		it('is true if there is an event handler', () => {
			const obj = new Evented(),
			spy = vi.fn();

			obj.on('test', spy);
			expect(obj.listens('test')).to.be.true;
		});

		it('is false if event handler has been removed', () => {
			const obj = new Evented(),
			spy = vi.fn();

			obj.on('test', spy);
			obj.off('test', spy);
			expect(obj.listens('test')).to.be.false;
		});

		it('changes for a "once" handler', () => {
			const obj = new Evented(),
			spy = vi.fn();

			obj.once('test', spy);
			expect(obj.listens('test')).to.be.true;

			obj.fire('test');
			expect(obj.listens('test')).to.be.false;
		});

		it('returns true if event handler with specific function and context is existing', () => {
			const obj = new Evented(),
			differentContext = new Evented(),
			spy = vi.fn(),
			diffentFnc = vi.fn();

			obj.on('test', spy);

			// event handler 'test' is existing
			expect(obj.listens('test')).to.be.true;

			// event handler with specific function is existing
			expect(obj.listens('test', spy)).to.be.true; // context arg: undefined === this
			expect(obj.listens('test', spy, obj)).to.be.true;

			// event handler with specific function and other context is not existing
			expect(obj.listens('test', spy, differentContext)).to.be.false;

			// event handler with specific function is not existing
			expect(obj.listens('test', diffentFnc)).to.be.false;
		});

		it('is true if there is an event handler on parent', () => {
			const fg = new FeatureGroup(),
			marker = new Marker([0, 0]).addTo(fg),
			spy = vi.fn();

			fg.on('test', spy);
			expect(marker.listens('test', false)).to.be.false;
			expect(marker.listens('test', true)).to.be.true;
		});

		it('is true if there is an event handler on parent parent', () => {
			const fgP = new FeatureGroup(),
			fg = new FeatureGroup().addTo(fgP),
			marker = new Marker([0, 0]).addTo(fg),
			spy = vi.fn();

			fgP.on('test', spy);
			expect(marker.listens('test', false)).to.be.false;
			expect(marker.listens('test', true)).to.be.true;
		});

		it('is true if there is an event handler with specific function on parent', () => {
			const fg = new FeatureGroup(),
			marker = new Marker([0, 0]).addTo(fg),
			spy = vi.fn();

			fg.on('test', spy);
			expect(marker.listens('test', spy, marker, false)).to.be.false;
			expect(marker.listens('test', spy, marker, true)).to.be.false;
			expect(marker.listens('test', spy, fg, false)).to.be.false;
			expect(marker.listens('test', spy, fg, true)).to.be.true;
		});
	});
});
