import {expect, vi} from 'vite-plus/test';
import {Class} from 'maplair';

describe('Class', () => {
	describe('#extends', () => {
		it('merges options instead of replacing them', () => {
			class KlassWithOptions1 extends Class {
				static {
					this.setDefaultOptions({
						foo1: 1,
						foo2: 2
					});
				}
			}
			class KlassWithOptions2 extends KlassWithOptions1 {
				static {
					this.setDefaultOptions({
						foo2: 3,
						foo3: 4
					});
				}
			}

			const a = new KlassWithOptions2();
			expect(a.options.foo1).to.eql(1);
			expect(a.options.foo2).to.eql(3);
			expect(a.options.foo3).to.eql(4);
		});

		it('inherits constructor hooks', () => {
			const spy1 = vi.fn(),
			spy2 = vi.fn();

			class Class1 extends Class {
				constructor() {
					super();
					this.callInitHooks(Class1);
				}
			}
			class Class2 extends Class1 {
				constructor() {
					super();
					this.callInitHooks(Class2);
				}
			}

			Class1.addInitHook(spy1);
			Class2.addInitHook(spy2);

			new Class2();

			expect(spy1).toHaveBeenCalledOnce();
			expect(spy2).toHaveBeenCalledOnce();
		});

		it('does not call child constructor hooks', () => {
			const spy1 = vi.fn(),
			spy2 = vi.fn();

			class Class1 extends Class {
				constructor() {
					super();
					this.callInitHooks(Class1);
				}
			}
			class Class2 extends Class1 {}

			Class1.addInitHook(spy1);
			Class2.addInitHook(spy2);

			new Class1();

			expect(spy1).toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();
		});
	});

	describe('#callInitHooks', () => {
		it('runs the hooks of a class at the end of its constructor, parent classes first', () => {
			const calls = [];

			class Parent extends Class {
				constructor() {
					super();
					this.parentReady = true;
					this.callInitHooks(Parent);
				}
			}
			class Child extends Parent {
				constructor() {
					super();
					this.childReady = true;
					this.callInitHooks(Child);
				}
			}

			Child.addInitHook(function () { calls.push(['child', this.parentReady, this.childReady]); });
			Parent.addInitHook(function () { calls.push(['parent', this.parentReady, this.childReady]); });

			new Child();

			expect(calls).to.eql([['parent', true, undefined], ['child', true, true]]);
		});

		it('runs the hooks of classes without own constructor along with their subclass', () => {
			const calls = [];

			class Base extends Class {}
			class Middle extends Base {}
			class Leaf extends Middle {
				constructor() {
					super();
					this.ready = true;
					this.callInitHooks(Leaf);
				}
			}

			Base.addInitHook(function () { calls.push(['base', this.ready]); });
			Middle.addInitHook(function () { calls.push(['middle', this.ready]); });
			Leaf.addInitHook(function () { calls.push(['leaf', this.ready]); });

			new Leaf();

			expect(calls).to.eql([['base', true], ['middle', true], ['leaf', true]]);
		});

		it('runs the remaining hooks of all classes without argument', () => {
			const spy1 = vi.fn(),
			spy2 = vi.fn();

			class Class1 extends Class {
				constructor() {
					super();
					this.callInitHooks(Class1);
				}
			}
			class Class2 extends Class1 {
				constructor() {
					super();
					this.callInitHooks();
				}
			}

			Class1.addInitHook(spy1);
			Class2.addInitHook(spy2);

			new Class2();

			expect(spy1).toHaveBeenCalledOnce();
			expect(spy2).toHaveBeenCalledOnce();
		});

		it('doesn\'t run hooks twice', () => {
			const spy = vi.fn();

			class Class1 extends Class {
				constructor() {
					super();
					this.callInitHooks(Class1);
					this.callInitHooks(Class1);
				}
			}
			class Class2 extends Class1 {
				constructor() {
					super();
					this.callInitHooks();
					this.callInitHooks(Class1);
				}
			}

			Class1.addInitHook(spy);

			new Class2();

			expect(spy).toHaveBeenCalledOnce();
		});

		it('supports method name and arguments', () => {
			class Class1 extends Class {
				constructor() {
					super();
					this.callInitHooks(Class1);
				}
				setFoo(foo) {
					this.foo = foo;
				}
			}

			Class1.addInitHook('setFoo', 42);

			expect(new Class1().foo).to.equal(42);
		});
	});

	describe('#include', () => {
		let Klass;

		beforeEach(() => {
			Klass = class extends Class {};
		});

		it('returns the class with the extra methods', () => {

			const q = vi.fn();

			const Qlass = Klass.include({quux: q});

			const a = new Klass();
			const b = new Qlass();

			a.quux();
			expect(q).toHaveBeenCalled();

			b.quux();
			expect(q).toHaveBeenCalled();
		});

		it('keeps parent options', () => { // #6070

			class Quux extends Class {
				static {
					this.setDefaultOptions({foo: 'Foo!'});
				}
			}

			Quux.include({
				options: {bar: 'Bar!'}
			});

			const q = new Quux();
			expect(q.options).to.have.property('foo');
			expect(q.options).to.have.property('bar');
		});

		it('does not reuse original props.options', () => {
			const props = {options: {}};
			const K = Klass.include(props);

			expect(K.prototype.options).not.to.equal(props.options);
		});
	});

	// TODO Class.mergeOptions
});
