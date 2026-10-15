import * as Util from './Util.js';

// @class Class

// @section
// @uninheritable

// Thanks to John Resig and Dean Edwards for inspiration!

export class Class {
	// @function include(properties: Object): this
	// [Includes a mixin](#class-includes) into the current class.
	static include(props) {
		const parentOptions = this.prototype.options;
		for (const k of getAllMethodNames(props)) {
			this.prototype[k] = props[k];
		}
		if (props.options) {
			this.prototype.options = parentOptions;
			this.mergeOptions(props.options);
		}
		return this;

		function *getAllMethodNames(obj) {
			do {
				if (obj === Object || obj === Object.prototype) {
					break;
				}
				for (const k of Object.getOwnPropertyNames(obj)) {
					yield k;
				}
			} while ((obj = Object.getPrototypeOf(obj)) !== undefined);
		}
	}

	// @function setDefaultOptions(options: Object): this
	// Configures the [default `options`](#class-options) on the prototype of this class.
	static setDefaultOptions(options) {
		Util.setOptions(this.prototype, options);
		return this;
	}

	// @function mergeOptions(options: Object): this
	// [Merges `options`](#class-options) into the defaults of the class.
	static mergeOptions(options) {
		this.prototype.options ??= {};
		Object.assign(this.prototype.options, options);
		return this;
	}

	// @function addInitHook(fn: Function): this
	// Adds a [constructor hook](#class-constructor-hooks) to the class.
	static addInitHook(fn, ...args) { // (Function) || (String, args...)
		const init = typeof fn === 'function' ? fn : function () {
			this[fn](...args);
		};

		if (!Object.hasOwn(this, '_initHooks')) { // do not use ??= here, which would find the parent class' hooks
			this._initHooks = [];
		}
		this._initHooks.push(init);
		return this;
	}

	constructor() {
		Util.setOptions(this);
	}

	// @method callInitHooks(cls?: Function): this
	// Runs the [constructor hooks](#class-constructor-hooks) of the given class and
	// of its parent classes, which haven't run yet for this object. Classes call it
	// at the end of their constructor, e.g. `this.callInitHooks(MyClass)`.
	// Without `cls`, runs the hooks of all classes of this object.
	callInitHooks(cls = this.constructor) {
		const done = this._initHooksCalledFor;
		if (done && (done === cls || done.prototype instanceof cls)) {
			return this; // the hooks of `cls` already ran
		}

		// parent classes first; stop at the class whose hooks (and whose parent
		// classes' hooks) already ran, e.g. in the constructor of a parent class
		const classes = [];
		for (let c = cls; c && c !== Function.prototype && c !== done; c = Object.getPrototypeOf(c)) {
			classes.unshift(c);
		}
		this._initHooksCalledFor = cls;

		for (const c of classes) {
			if (Object.hasOwn(c, '_initHooks')) {
				for (const hook of c._initHooks) {
					hook.call(this);
				}
			}
		}
		return this;
	}
}
