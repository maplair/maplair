import { setOptions } from "./Util.js";
//#region src/core/Class.js
/**
* Class powers the OOP facilities of Maplair and is used to create almost all of the
* Maplair classes documented here.
*
* It implements a simple classical inheritance model using JavaScript's standard
* `extends` keyword, and introduces several special properties for convenient code
* organization — options and init hooks.
*
* <h3 id="class-options">Options</h3>
*
* `options` is a special property that will be merged with the parent class options
* instead of overriding them completely, which makes managing configuration of objects
* and default values convenient. Use `setDefaultOptions()` in a static block to
* configure options:
*
* ```js
* class MyClass extends Class {
*     static {
*         this.setDefaultOptions({
*             myOption1: 'foo',
*             myOption2: 'bar'
*         });
*     }
* }
*
* class MyChildClass extends MyClass {
*     static {
*         this.setDefaultOptions({
*             myOption1: 'baz',
*             myOption3: 5
*         });
*     }
* }
*
* const a = new MyChildClass();
* a.options.myOption1; // 'baz'
* a.options.myOption2; // 'bar'
* a.options.myOption3; // 5
* ```
*
* There's also [`Util.setOptions`](#util-setoptions), a method for
* conveniently merging options passed to constructor with the defaults
* defined in the class:
*
* ```js
* class MyClass extends Class {
*     static {
*         this.setDefaultOptions({
*             foo: 'bar',
*             bla: 5
*         });
*     }
*
*     constructor(options) {
*         super();
*         Util.setOptions(this, options);
*         ...
*     }
* }
*
* const a = new MyClass({bla: 10});
* a.options; // {foo: 'bar', bla: 10}
* ```
*
* Note that the options object allows any keys, not just
* the options defined by the class and its base classes.
* This means you can use the options object to store
* application specific information, as long as you avoid
* keys that are already used by the class in question.
*
* <h3 id="class-includes">Mixins</h3>
*
* You can add methods and properties from other objects using the `include` method
* (such objects are called mixins):
*
* ```js
* const MyMixin = {
*     foo() { ... },
*     bar: 5
* };
*
* class MyClass extends Class {}
*
* MyClass.include(MyMixin);
*
* const a = new MyClass();
* a.foo();
* ```
*
* <h3 id="class-constructor-hooks">Constructor hooks</h3>
*
* If you're a plugin developer, you often need to add additional initialization code
* to existing classes (e.g. editing hooks for `Polyline`). Maplair comes with a way to
* do it easily using the `addInitHook` method:
*
* ```js
* Polyline.addInitHook(function () {
*     // ... do something in constructor additionally
*     // e.g. add event listeners, set custom properties etc.
*     this.editing = new PolylineEditor(this);
* });
* ```
*
* You can also use the following shortcut when you just need to make one additional
* method call:
*
* ```js
* MyClass.addInitHook('methodName', arg1, arg2, …);
* ```
*
* The hooks of a class run at the end of its constructor, which calls
* [`callInitHooks`](#class-callinithooks) — so they can rely on everything the
* constructor sets up. All Maplair classes do so. Hooks of parent classes run
* first, and parent classes without a constructor of their own (such as `Layer`
* or `Path`) have their hooks run along with their subclasses. Each hook runs
* once per object.
*
* Note that the hooks of a parent class run before the constructor of a subclass
* continues. To support hooks on your own classes, call `this.callInitHooks()`
* at the end of their constructor:
*
* ```js
* class MyMarker extends Marker {
*     constructor(latlng, options) {
*         super(latlng, options); // runs the hooks of Marker (and of Layer etc.)
*         this.extra = 'ready';
*         this.callInitHooks();   // runs the hooks of MyMarker
*     }
* }
* ```
*
* @example
* ```js
* class MyClass extends Class {
*     constructor(greeter) {
*         super();
*         this.greeter = greeter;
*         this.callInitHooks(MyClass); // optional, see constructor hooks above
*     }
*
*     greet(name) {
*         alert(this.greeter + ', ' + name)
*     }
* }
*
* // create instance of MyClass, passing "Hello" to the constructor
* const a = new MyClass("Hello");
*
* // call greet method, alerting "Hello, World"
* a.greet("World");
* ```
*/
var Class = class {
	/**
	* [Includes a mixin](#class-includes) into the current class: copies the properties
	* of `props` (and of its prototypes) to the prototype of the class, and merges
	* `props.options` into its default options.
	* @template {typeof Class} T
	* @this {T}
	* @param {object} props
	* @returns {T}
	*/
	static include(props) {
		const parentOptions = this.prototype.options;
		for (const k of getAllMethodNames(props)) this.prototype[k] = props[k];
		if (props.options) {
			this.prototype.options = parentOptions;
			this.mergeOptions(props.options);
		}
		return this;
		function* getAllMethodNames(obj) {
			do {
				if (obj === Object || obj === Object.prototype) break;
				for (const k of Object.getOwnPropertyNames(obj)) yield k;
			} while ((obj = Object.getPrototypeOf(obj)) !== void 0);
		}
	}
	/**
	* Configures the [default `options`](#class-options) on the prototype of this class.
	* @template {typeof Class} T
	* @this {T}
	* @param {object} options
	* @returns {T}
	*/
	static setDefaultOptions(options) {
		setOptions(this.prototype, options);
		return this;
	}
	/**
	* [Merges `options`](#class-options) into the defaults of the class.
	* @template {typeof Class} T
	* @this {T}
	* @param {object} options
	* @returns {T}
	*/
	static mergeOptions(options) {
		this.prototype.options ??= {};
		Object.assign(this.prototype.options, options);
		return this;
	}
	/**
	* Adds a [constructor hook](#class-constructor-hooks) to the class: a function
	* (called with the object as `this`), or the name of a method to call with the
	* given arguments.
	* @template {typeof Class} T
	* @this {T}
	* @param {((this: any) => void)|string} fn
	* @param {...any} args Arguments of the method `fn`.
	* @returns {T}
	*/
	static addInitHook(fn, ...args) {
		const init = typeof fn === "function" ? fn : function() {
			this[fn](...args);
		};
		if (!Object.hasOwn(this, "_initHooks")) this._initHooks = [];
		this._initHooks.push(init);
		return this;
	}
	constructor() {
		setOptions(this);
	}
	/**
	* Runs the [constructor hooks](#class-constructor-hooks) of the given class and
	* of its parent classes, which haven't run yet for this object. Classes call it
	* at the end of their constructor, e.g. `this.callInitHooks(MyClass)`.
	* Without `cls`, runs the hooks of all classes of this object.
	* @param {Function} [cls]
	* @returns {this}
	*/
	callInitHooks(cls = this.constructor) {
		const done = this._initHooksCalledFor;
		if (done && (done === cls || done.prototype instanceof cls)) return this;
		const classes = [];
		for (let c = cls; c && c !== Function.prototype && c !== done; c = Object.getPrototypeOf(c)) classes.unshift(c);
		this._initHooksCalledFor = cls;
		for (const c of classes) if (Object.hasOwn(c, "_initHooks")) for (const hook of c._initHooks) hook.call(this);
		return this;
	}
};
//#endregion
export { Class };

//# sourceMappingURL=Class.js.map