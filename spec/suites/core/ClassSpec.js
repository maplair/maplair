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

			class Class1 extends Class {}
			class Class2 extends Class1 {}

			Class1.addInitHook(spy1);
			Class2.addInitHook(spy2);

			new Class2();

			expect(spy1).toHaveBeenCalled();
			expect(spy2).toHaveBeenCalled();
		});

		it('does not call child constructor hooks', () => {
			const spy1 = vi.fn(),
			spy2 = vi.fn();

			class Class1 extends Class {}
			class Class2 extends Class1 {}

			Class1.addInitHook(spy1);
			Class2.addInitHook(spy2);

			new Class1();

			expect(spy1).toHaveBeenCalled();
			expect(spy2).not.toHaveBeenCalled();
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
