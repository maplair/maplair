import {expect, vi} from 'vite-plus/test';
import {Class, Evented, Layer, Marker} from 'maplair';

describe('Class', () => {
	describe('defaultOptions', () => {
		it('inherits and overrides parent defaults', () => {
			class Klass1 extends Class {
				static defaultOptions = {foo1: 1, foo2: 2};
			}
			class Klass2 extends Klass1 {
				static defaultOptions = {foo2: 3, foo3: 4};
			}

			const a = new Klass2();
			expect(a.options.foo1).to.eql(1);
			expect(a.options.foo2).to.eql(3);
			expect(a.options.foo3).to.eql(4);
		});

		it('gives every instance its own options', () => {
			class Klass extends Class {}
			const a = new Klass();
			expect(a.options).to.eql({});
			expect(Object.hasOwn(a, 'options')).to.be.true;
		});

		it('keeps defaults live for instances and subclasses', () => {
			class Klass1 extends Class {
				static defaultOptions = {foo: 1};
			}
			class Klass2 extends Klass1 {
				static defaultOptions = {bar: 2};
			}

			const a = new Klass2();
			Klass1.defaultOptions.foo = 5;
			expect(a.options.foo).to.eql(5);
			expect(new Klass2().options.foo).to.eql(5);
		});

		it('chains a class that declares defaults below one that does not', () => {
			class Klass1 extends Class {
				static defaultOptions = {foo: 1};
			}
			class Klass2 extends Klass1 {}
			class Klass3 extends Klass2 {
				static defaultOptions = {bar: 2};
			}

			const a = new Klass3();
			expect(a.options.foo).to.eql(1);
			expect(a.options.bar).to.eql(2);
		});

		it('is chained for built-in classes', () => {
			const marker = new Marker([0, 0]);
			expect(marker.options.pane).to.eql('markerPane');
			expect(marker.options.bubblingPointerEvents).to.be.false;
			expect(Object.getPrototypeOf(Marker.defaultOptions)).to.equal(Layer.defaultOptions);
		});
	});

	describe('#mergeOptions', () => {
		it('merges into the defaults of the class', () => {
			class Klass extends Class {
				static defaultOptions = {foo: 1};
			}
			Klass.mergeOptions({bar: 2});

			const a = new Klass();
			expect(a.options.foo).to.eql(1);
			expect(a.options.bar).to.eql(2);
		});

		it('does not write into parent defaults', () => {
			class Parent extends Class {
				static defaultOptions = {foo: 1};
			}
			class Child extends Parent {}

			Child.mergeOptions({foo: 2, bar: 3});

			expect(Parent.defaultOptions).to.eql({foo: 1});
			expect(new Parent().options.bar).to.be.undefined;
			expect(new Child().options.foo).to.eql(2);
			expect(new Child().options.bar).to.eql(3);
		});

		it('keeps parent defaults live after creating own defaults', () => {
			class Parent extends Class {
				static defaultOptions = {foo: 1};
			}
			class Child extends Parent {}

			Child.mergeOptions({bar: 2});
			Parent.mergeOptions({foo: 5});

			expect(new Child().options.foo).to.eql(5);
		});

		it('works with the deprecated setDefaultOptions in a static block', () => {
			class Parent extends Class {
				static defaultOptions = {foo: 1};
			}
			class Child extends Parent {
				static {
					this.setDefaultOptions({bar: 2});
				}
			}

			const a = new Child();
			expect(a.options.foo).to.eql(1);
			expect(a.options.bar).to.eql(2);
			expect(Parent.defaultOptions).to.eql({foo: 1});
		});
	});

	describe('#addInitHook', () => {
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
				static defaultOptions = {foo: 'Foo!'};
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

			expect(K.defaultOptions).not.to.equal(props.options);
			expect(K.prototype.options).to.be.undefined;
		});

		it('includes methods of a class prototype without replacing the constructor', () => {
			Klass.include(Evented.prototype);

			const a = new Klass();
			expect(a.on).to.equal(Evented.prototype.on);
			expect(a.constructor).to.equal(Klass);
		});
	});
});
