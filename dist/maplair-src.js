/* @preserve
 * Maplair 4.1.0, a JS library for interactive maps. https://maplair.org
 * (c) 2026 Simon Legner and Maplair contributors, (c) 2010-2026 Volodymyr Agafonkin, (c) 2010-2011 CloudMade
 */

// \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
// package.json
var version$1 = "4.1.0";
// src/core/Util.js
var Util_exports = /* @__PURE__ */ __exportAll({
	falseFn: () => falseFn,
	formatNum: () => formatNum,
	lastId: () => lastId,
	setOptions: () => setOptions,
	splitWords: () => splitWords,
	stamp: () => stamp,
	template: () => template,
	throttle: () => throttle,
	wrapNum: () => wrapNum
});
/**
* Last unique ID used by [`stamp()`](#util-stamp).
* @type {number}
*/
let lastId = 0;
/**
* Returns the unique ID of an object, assigning it one if it doesn't have it.
* @param {object} obj
* @returns {number}
*/
function stamp(obj) {
	if (!("_maplair_id" in obj)) obj["_maplair_id"] = ++lastId;
	return obj._maplair_id;
}
/**
* Returns a function which executes function `fn` with the given scope `context`
* (so that the `this` keyword refers to `context` inside `fn`'s code). The function
* `fn` will be called no more than one time per given amount of `time`. The arguments
* received by the bound function will be any arguments passed when binding the
* function, followed by any arguments passed when invoking the bound function.
* @param {(...args: any[]) => void} fn
* @param {number} time In milliseconds.
* @param {object} [context]
* @returns {(...args: any[]) => void}
*/
function throttle(fn, time, context) {
	let lock, queuedArgs;
	function later() {
		lock = false;
		if (queuedArgs) {
			wrapperFn.apply(context, queuedArgs);
			queuedArgs = false;
		}
	}
	function wrapperFn(...args) {
		if (lock) queuedArgs = args;
		else {
			fn.apply(context, args);
			setTimeout(later, time);
			lock = true;
		}
	}
	return wrapperFn;
}
/**
* Returns the number `x` modulo `range` in such a way so it lies within
* `range[0]` and `range[1]`. The returned value will always be smaller than
* `range[1]` unless `includeMax` is set to `true`.
* @param {number} x
* @param {[number, number]} range
* @param {boolean} [includeMax]
* @returns {number}
*/
function wrapNum(x, range, includeMax) {
	const max = range[1], min = range[0], d = max - min;
	return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
}
/**
* A function which always returns `false`.
* @returns {false}
*/
function falseFn() {
	return false;
}
/**
* Returns the number `num` rounded with specified `precision`.
* The default `precision` value is 6 decimal places.
* `false` can be passed to skip any processing (can be useful to avoid round-off errors).
* @param {number} num
* @param {number|false} [precision]
* @returns {number}
*/
function formatNum(num, precision) {
	if (precision === false) return num;
	const pow = 10 ** (precision === void 0 ? 6 : precision);
	return Math.round(num * pow) / pow;
}
const WHITESPACE_RE = /\s+/;
/**
* Trims and splits the string on whitespace and returns the array of parts.
* @param {string} str
* @returns {string[]}
*/
function splitWords(str) {
	return str.trim().split(WHITESPACE_RE);
}
/**
* Merges the given properties to the `options` of the `obj` object, returning the
* resulting options. See `Class options`.
* @param {object} obj
* @param {object} [options]
* @returns {object}
*/
function setOptions(obj, options) {
	if (!Object.hasOwn(obj, "options")) {
		const defaults = getDefaultOptions(obj.constructor) ?? obj.options;
		obj.options = defaults ? Object.create(defaults) : {};
	}
	for (const i in options) if (Object.hasOwn(options, i)) obj.options[i] = options[i];
	return obj.options;
}
const chainedDefaults = /* @__PURE__ */ new WeakMap();
function getDefaultOptions(cls) {
	const defaults = cls?.defaultOptions;
	if (defaults && chainedDefaults.get(cls) !== defaults) {
		for (let c = cls; c.defaultOptions; c = Object.getPrototypeOf(c)) if (Object.hasOwn(c, "defaultOptions")) Object.setPrototypeOf(c.defaultOptions, Object.getPrototypeOf(c).defaultOptions ?? Object.prototype);
		chainedDefaults.set(cls, defaults);
	}
	return defaults;
}
const templateRe = /\{ *([\w_ -]+) *\}/g;
/**
* Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
* and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
* `('Hello foo, bar')`. You can also specify functions instead of strings for
* data values — they will be evaluated passing `data` as an argument.
* @param {string} str
* @param {Record<string, any>} data
* @returns {string}
*/
function template(str, data) {
	return str.replace(templateRe, (str, key) => {
		let value = data[key];
		if (value === void 0) throw new Error(`No value provided for variable ${str}`);
		else if (typeof value === "function") value = value(data);
		return value;
	});
}
// src/core/Class.js
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
* `options` is a special property whose defaults, the static `defaultOptions` of the
* class, are merged with those of the parent class instead of overriding them
* completely, which makes managing configuration of objects and default values
* convenient:
*
* ```js
* class MyClass extends Class {
*     static defaultOptions = {
*         myOption1: 'foo',
*         myOption2: 'bar'
*     };
* }
*
* class MyChildClass extends MyClass {
*     static defaultOptions = {
*         myOption1: 'baz',
*         myOption3: 5
*     };
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
*     static defaultOptions = {
*         foo: 'bar',
*         bla: 5
*     };
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
		for (let obj = props; obj && obj !== Object.prototype; obj = Object.getPrototypeOf(obj)) for (const k of Object.getOwnPropertyNames(obj)) if (k !== "constructor" && k !== "options") this.prototype[k] = props[k];
		if (props.options) this.mergeOptions(props.options);
		return this;
	}
	/**
	* [Merges `options`](#class-options) into the `defaultOptions` of the class.
	* @template {typeof Class} T
	* @this {T}
	* @param {object} options
	* @returns {T}
	*/
	static mergeOptions(options) {
		if (!Object.hasOwn(this, "defaultOptions")) this.defaultOptions = Object.create(this.defaultOptions ?? Object.prototype);
		Object.assign(this.defaultOptions, options);
		return this;
	}
	/**
	* Deprecated alias of `mergeOptions()`, kept for code written for Maplair 4.0.
	* @deprecated Use `static defaultOptions = {…}` or `mergeOptions()`.
	* @template {typeof Class} T
	* @this {T}
	* @param {object} options
	* @returns {T}
	*/
	static setDefaultOptions(options) {
		return this.mergeOptions(options);
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
		if (this.initialize) throw new Error(`${this.constructor.name}: initialize() is not called in Maplair. Rename it to constructor() and call super() at its start.`);
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
// src/geometry/Point.js
/**
* A point in pixels: a `Point`, an array of the form `[x, y]`, or a plain object of
* the form `{x, y}`. Accepted by all Maplair methods and options which accept `Point`
* objects (unless noted otherwise).
* @typedef {Point|[number, number]|number[]|{x: number, y: number}} PointExpression
*/
/**
* Represents a point with `x` and `y` coordinates in pixels.
*
* @example
* ```js
* const point = new Point(200, 300);
* ```
*
* All Maplair methods and options that accept `Point` objects also accept them in a
* simple Array form (unless noted otherwise), so these lines are equivalent:
*
* ```js
* map.panBy([200, 300]);
* map.panBy(new Point(200, 300));
* ```
*
* Note that `Point` does not inherit from Maplair's `Class` object,
* which means new classes can't inherit from it, and new methods
* can't be added to it with the `include` function.
*/
var Point = class Point {
	/**
	* Creates a Point object with the given `x` and `y` coordinates. If optional `round`
	* is set to true, rounds the `x` and `y` values. Alternatively, expects a Point
	* object, an array of the form `[x, y]` or a plain object of the form `{x, y}`
	* instead.
	* @param {number|PointExpression} x The `x` coordinate, or the coordinates.
	* @param {number} [y] The `y` coordinate.
	* @param {boolean} [round]
	*/
	constructor(x, y, round) {
		if (!Point.validate(x, y)) throw new Error(`Invalid Point object: (${x}, ${y})`);
		let _x, _y;
		if (x instanceof Point) {
			_x = x.x;
			_y = x.y;
		} else if (Array.isArray(x)) {
			_x = x[0];
			_y = x[1];
		} else if (typeof x === "object" && "x" in x && "y" in x) {
			_x = x.x;
			_y = x.y;
		} else {
			_x = x;
			_y = y;
		}
		/**
		* The `x` coordinate of the point.
		* @type {number}
		*/
		this.x = round ? Math.round(_x) : _x;
		/**
		* The `y` coordinate of the point.
		* @type {number}
		*/
		this.y = round ? Math.round(_y) : _y;
	}
	/**
	* Returns the given `Point` object as it is (unless `round` is set), or else a new
	* `Point` object created from the given arguments (the same as of the constructor) —
	* unlike the constructor, which always creates a new object.
	*
	* @example
	* ```js
	* Point.from(point) === point; // true
	* Point.from([200, 300]); // Point(200, 300)
	* ```
	* @param {number|PointExpression} x The `x` coordinate, or the coordinates.
	* @param {number} [y] The `y` coordinate.
	* @param {boolean} [round]
	* @returns {Point}
	*/
	static from(x, y, round) {
		return x instanceof Point && !round ? x : new Point(x, y, round);
	}
	/**
	* Returns `true` if the Point object can be properly initialized with the given
	* arguments (the same as of the constructor).
	* @param {any} x
	* @param {any} [y]
	* @returns {boolean}
	*/
	static validate(x, y) {
		if (x instanceof Point || Array.isArray(x)) return true;
		else if (x && typeof x === "object" && "x" in x && "y" in x) return true;
		else if ((x || x === 0) && (y || y === 0)) return true;
		return false;
	}
	/**
	* Returns the result of addition of the current and the given points.
	* @param {PointExpression} point
	* @returns {Point}
	*/
	add(point) {
		return new Point(this)._add(Point.from(point));
	}
	_add(point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	}
	/**
	* Returns the result of subtraction of the given point from the current.
	* @param {PointExpression} point
	* @returns {Point}
	*/
	subtract(point) {
		return new Point(this)._subtract(Point.from(point));
	}
	_subtract(point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	}
	/**
	* Returns the result of division of the current point by the given number.
	* @param {number} num
	* @returns {Point}
	*/
	divideBy(num) {
		return new Point(this)._divideBy(num);
	}
	_divideBy(num) {
		this.x /= num;
		this.y /= num;
		return this;
	}
	/**
	* Returns the result of multiplication of the current point by the given number.
	* @param {number} num
	* @returns {Point}
	*/
	multiplyBy(num) {
		return new Point(this)._multiplyBy(num);
	}
	_multiplyBy(num) {
		this.x *= num;
		this.y *= num;
		return this;
	}
	/**
	* Multiply each coordinate of the current point by each coordinate of
	* `scale`. In linear algebra terms, multiply the point by the
	* [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
	* defined by `scale`.
	* @param {Point} point The scale.
	* @returns {Point}
	*/
	scaleBy(point) {
		return new Point(this.x * point.x, this.y * point.y);
	}
	/**
	* Inverse of `scaleBy`. Divide each coordinate of the current point by
	* each coordinate of `scale`.
	* @param {Point} point The scale.
	* @returns {Point}
	*/
	unscaleBy(point) {
		return new Point(this.x / point.x, this.y / point.y);
	}
	/**
	* Returns a copy of the current point with rounded coordinates.
	* @returns {Point}
	*/
	round() {
		return new Point(this)._round();
	}
	_round() {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	}
	/**
	* Returns a copy of the current point with floored coordinates (rounded down).
	* @returns {Point}
	*/
	floor() {
		return new Point(this)._floor();
	}
	_floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	}
	/**
	* Returns a copy of the current point with ceiled coordinates (rounded up).
	* @returns {Point}
	*/
	ceil() {
		return new Point(this)._ceil();
	}
	_ceil() {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		return this;
	}
	/**
	* Returns a copy of the current point with truncated coordinates (rounded towards
	* zero).
	* @returns {Point}
	*/
	trunc() {
		return new Point(this)._trunc();
	}
	_trunc() {
		this.x = Math.trunc(this.x);
		this.y = Math.trunc(this.y);
		return this;
	}
	/**
	* Returns the cartesian distance between the current and the given points.
	* @param {PointExpression} point
	* @returns {number}
	*/
	distanceTo(point) {
		point = Point.from(point);
		const x = point.x - this.x, y = point.y - this.y;
		return Math.sqrt(x * x + y * y);
	}
	/**
	* Returns `true` if the given point has the same coordinates.
	* @param {PointExpression} point
	* @returns {boolean}
	*/
	equals(point) {
		point = Point.from(point);
		return point.x === this.x && point.y === this.y;
	}
	/**
	* Returns `true` if both coordinates of the given point are less than the
	* corresponding current point coordinates (in absolute values).
	* @param {PointExpression} point
	* @returns {boolean}
	*/
	contains(point) {
		point = Point.from(point);
		return Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y);
	}
	/**
	* Returns a string representation of the point for debugging purposes.
	* @returns {string}
	*/
	toString() {
		return `Point(${formatNum(this.x)}, ${formatNum(this.y)})`;
	}
};
// src/dom/DomEvent.DoubleTap.js
function makeDblclick(ev) {
	const init = {
		bubbles: ev.bubbles,
		cancelable: ev.cancelable,
		composed: ev.composed,
		detail: 2,
		view: ev.view,
		screenX: ev.screenX,
		screenY: ev.screenY,
		clientX: ev.clientX,
		clientY: ev.clientY,
		ctrlKey: ev.ctrlKey,
		shiftKey: ev.shiftKey,
		altKey: ev.altKey,
		metaKey: ev.metaKey,
		button: ev.button,
		buttons: ev.buttons,
		relatedTarget: ev.relatedTarget,
		region: ev.region
	};
	let newEvent;
	if (ev instanceof PointerEvent) newEvent = new PointerEvent("dblclick", {
		...init,
		pointerId: ev.pointerId,
		width: ev.width,
		height: ev.height,
		pressure: ev.pressure,
		tangentialPressure: ev.tangentialPressure,
		tiltX: ev.tiltX,
		tiltY: ev.tiltY,
		twist: ev.twist,
		pointerType: ev.pointerType,
		isPrimary: ev.isPrimary
	});
	else newEvent = new MouseEvent("dblclick", init);
	return newEvent;
}
const delay$1 = 200;
/**
* Adds a `dblclick` listener which also handles double taps (simulating `dblclick`
* on platforms which don't fire it for touch events).
* @param {EventTarget} obj
* @param {(ev: MouseEvent) => void} handler
* @returns {{dblclick: (ev: MouseEvent) => void, simDblclick: (ev: PointerEvent) => void}}
* The listeners to pass to `removeDoubleTapListener`.
*/
function addDoubleTapListener(obj, handler) {
	obj.addEventListener("dblclick", handler);
	let last = 0, detail, pointerType;
	function onPointerDown(ev) {
		pointerType = ev.pointerType;
	}
	function simDblclick(ev) {
		if (ev.detail !== 1) {
			detail = ev.detail;
			return;
		}
		if (pointerType === "mouse" || ev.sourceCapabilities && !ev.sourceCapabilities.firesTouchEvents) return;
		const path = ev.composedPath();
		if (path.some((el) => el instanceof HTMLLabelElement && el.htmlFor) && !path.some((el) => el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) return;
		const now = Date.now();
		if (now - last <= delay$1) {
			detail++;
			if (detail === 2) ev.target.dispatchEvent(makeDblclick(ev));
		} else detail = 1;
		last = now;
	}
	obj.addEventListener("pointerdown", onPointerDown, true);
	obj.addEventListener("click", simDblclick);
	return {
		dblclick: handler,
		onPointerDown,
		simDblclick
	};
}
/**
* Removes the listeners added by `addDoubleTapListener`.
* @param {EventTarget} obj
* @param {{dblclick: (ev: MouseEvent) => void, simDblclick: (ev: PointerEvent) => void}} handlers
* @returns {void}
*/
function removeDoubleTapListener(obj, handlers) {
	obj.removeEventListener("dblclick", handlers.dblclick);
	obj.removeEventListener("pointerdown", handlers.onPointerDown, true);
	obj.removeEventListener("click", handlers.simDblclick);
}
// src/dom/DomEvent.PointerEvents.js
var DomEvent_PointerEvents_exports = /* @__PURE__ */ __exportAll({
	disablePointerDetection: () => disablePointerDetection,
	enablePointerDetection: () => enablePointerDetection,
	getPointers: () => getPointers
});
const activePointers = /* @__PURE__ */ new Map();
/**
* Enables pointer detection and capture for the document.
* @group Pointer detection
* @param {EventTarget} el
* @returns {void}
*/
function enablePointerDetection(el) {
	el.addEventListener("pointerdown", _onSet, { capture: true });
	el.addEventListener("pointermove", _onUpdate, { capture: true });
	el.addEventListener("pointerup", _onDelete, { capture: true });
	el.addEventListener("pointercancel", _onDelete, { capture: true });
	activePointers.clear();
}
/**
* Disables pointer detection and capture for the document.
* @group Pointer detection
* @param {EventTarget} el
* @returns {void}
*/
function disablePointerDetection(el) {
	el.removeEventListener("pointerdown", _onSet, { capture: true });
	el.removeEventListener("pointermove", _onUpdate, { capture: true });
	el.removeEventListener("pointerup", _onDelete, { capture: true });
	el.removeEventListener("pointercancel", _onDelete, { capture: true });
}
function _onSet(e) {
	if (e.isTrusted) e.target.setPointerCapture(e.pointerId);
	activePointers.set(e.pointerId, e);
}
function _onUpdate(e) {
	if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, e);
}
function _onDelete(e) {
	if (e.target.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
	activePointers.delete(e.pointerId);
}
/**
* Returns the active pointers on the document.
* @group Pointer detection
* @returns {PointerEvent[]}
*/
function getPointers() {
	return [...activePointers.values()];
}
// src/dom/DomEvent.js
var DomEvent_exports = /* @__PURE__ */ __exportAll({
	PointerEvents: () => DomEvent_PointerEvents_exports,
	disableClickPropagation: () => disableClickPropagation,
	disableScrollPropagation: () => disableScrollPropagation,
	getPointerPosition: () => getPointerPosition,
	getWheelDelta: () => getWheelDelta,
	getWheelPxFactor: () => getWheelPxFactor,
	isExternalTarget: () => isExternalTarget,
	off: () => off,
	on: () => on,
	preventDefault: () => preventDefault,
	stop: () => stop,
	stopPropagation: () => stopPropagation
});
/**
* Adds a listener function (`fn`) to a particular DOM event type of the
* element `obj`. You can optionally specify the context of the listener
* (object the `this` keyword will point to). You can also pass several
* space-separated types (e.g. `'click dblclick'`). Alternatively, adds a set of
* type/listener pairs, e.g. `{click: onClick, pointermove: onPointerMove}`, with the
* context as third argument.
* @param {EventTarget} obj
* @param {string|Record<string, (ev: any) => void>} types
* @param {((ev: any) => void)|object} [fn]
* @param {object} [context]
* @returns {typeof import('./DomEvent.js')}
*/
function on(obj, types, fn, context) {
	if (types && typeof types === "object") for (const [type, listener] of Object.entries(types)) addOne(obj, type, listener, fn);
	else for (const type of splitWords(types)) addOne(obj, type, fn, context);
	return this;
}
const eventsKey = "_maplair_events";
/**
* Removes a previously added listener function.
* Note that if you passed a custom context to on, you must pass the same
* context to `off` in order to remove the listener. Alternatively, removes a set of
* type/listener pairs, e.g. `{click: onClick, pointermove: onPointerMove}`; with
* `types` only, removes all previously added listeners of given types; with the
* element only, removes all previously added listeners from the given element.
* @param {EventTarget} obj
* @param {string|Record<string, (ev: any) => void>} [types]
* @param {((ev: any) => void)|object} [fn]
* @param {object} [context]
* @returns {typeof import('./DomEvent.js')}
*/
function off(obj, types, fn, context) {
	if (arguments.length === 1) {
		batchRemove(obj);
		delete obj[eventsKey];
	} else if (types && typeof types === "object") for (const [type, listener] of Object.entries(types)) removeOne(obj, type, listener, fn);
	else {
		types = splitWords(types);
		if (arguments.length === 2) batchRemove(obj, (type) => types.includes(type));
		else for (const type of types) removeOne(obj, type, fn, context);
	}
	return this;
}
const DIGIT_RE = /\d/;
function batchRemove(obj, filterFn) {
	for (const id of Object.keys(obj[eventsKey] ?? {})) {
		const type = id.split(DIGIT_RE)[0];
		if (!filterFn || filterFn(type)) removeOne(obj, type, null, null, id);
	}
}
function addOne(obj, type, fn, context) {
	const id = type + stamp(fn) + (context ? `_${stamp(context)}` : "");
	if (obj[eventsKey] && obj[eventsKey][id]) return this;
	let handler = function(e) {
		return fn.call(context || obj, e);
	};
	if (type === "dblclick") handler = addDoubleTapListener(obj, handler);
	else obj.addEventListener(type, handler, type === "wheel" ? { passive: false } : false);
	obj[eventsKey] ??= {};
	obj[eventsKey][id] = handler;
}
function removeOne(obj, type, fn, context, id) {
	id ??= type + stamp(fn) + (context ? `_${stamp(context)}` : "");
	const handler = obj[eventsKey] && obj[eventsKey][id];
	if (!handler) return this;
	if (type === "dblclick") removeDoubleTapListener(obj, handler);
	else obj.removeEventListener(type, handler, false);
	obj[eventsKey][id] = null;
}
/**
* Stop the given event from propagation to parent elements. Used inside the listener
* functions:
* ```js
* DomEvent.on(div, 'click', DomEvent.stopPropagation);
* ```
* Also accepts a Maplair event with an `originalEvent`.
* @param {Event|{originalEvent: Event}} e
* @returns {typeof import('./DomEvent.js')}
*/
function stopPropagation(e) {
	if (e.stopPropagation) e.stopPropagation();
	else if (e.originalEvent) e.originalEvent._stopped = true;
	else console.debug("Unsupported event", e);
	return this;
}
/**
* Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).
* @param {HTMLElement} el
* @returns {typeof import('./DomEvent.js')}
*/
function disableScrollPropagation(el) {
	addOne(el, "wheel", stopPropagation);
	return this;
}
/**
* Adds `stopPropagation` to the element's `'dblclick'`, `'contextmenu'`
* and `'pointerdown'` events (plus browser variants).
* For `'click'` events, prevents the map from handling the click
* while still allowing the native DOM click event to propagate normally.
* @param {HTMLElement} el
* @returns {typeof import('./DomEvent.js')}
*/
function disableClickPropagation(el) {
	on(el, "pointerdown dblclick contextmenu", stopPropagation);
	el["_maplair_disable_click"] = true;
	return this;
}
/**
* Prevents the default action of the DOM Event `e` from happening (such as
* following a link in the href of the a element, or doing a POST request
* with page reload when a `<form>` is submitted).
* Use it inside listener functions.
* @param {Event} e
* @returns {typeof import('./DomEvent.js')}
*/
function preventDefault(e) {
	e.preventDefault?.();
	return this;
}
/**
* Does `stopPropagation` and `preventDefault` at the same time.
* @param {Event} e
* @returns {typeof import('./DomEvent.js')}
*/
function stop(e) {
	preventDefault(e);
	stopPropagation(e);
	return this;
}
/**
* Gets normalized pointer position from a DOM event relative to the
* `container` (border excluded) or to the whole page if not specified.
* @param {MouseEvent|Touch} e
* @param {HTMLElement} [container]
* @returns {Point}
*/
function getPointerPosition(e, container) {
	if (!container) return new Point(e.clientX, e.clientY);
	const scale = getScale(container), offset = scale.boundingClientRect;
	return new Point((e.clientX - offset.left) / scale.x - container.clientLeft, (e.clientY - offset.top) / scale.y - container.clientTop);
}
/**
* Gets the wheel pixel factor based on the devicePixelRatio.
* @returns {number}
*/
function getWheelPxFactor() {
	return window.devicePixelRatio * 2;
}
/**
* Gets normalized wheel delta from a wheel DOM event, in vertical
* pixels scrolled (negative if scrolling down).
* Events from pointing devices without precise scrolling are mapped to
* a best guess of 60 pixels.
* @param {WheelEvent} e
* @returns {number}
*/
function getWheelDelta(e) {
	return e.deltaY && e.deltaMode === 0 ? -e.deltaY / getWheelPxFactor() : e.deltaY && e.deltaMode === 1 ? -e.deltaY * 20 : e.deltaY && e.deltaMode === 2 ? -e.deltaY * 60 : e.deltaX || e.deltaZ ? 0 : 0;
}
/**
* Checks if the pointer really left/entered the element `el` (for
* `pointerover`/`pointerout`).
* @internal
* @param {Node} el
* @param {MouseEvent} e
* @returns {boolean}
*/
function isExternalTarget(el, e) {
	return !el.contains(e.relatedTarget);
}
// src/dom/DomUtil.js
var DomUtil_exports = /* @__PURE__ */ __exportAll({
	create: () => create,
	disableImageDrag: () => disableImageDrag,
	enableImageDrag: () => enableImageDrag,
	get: () => get,
	getPosition: () => getPosition,
	getScale: () => getScale,
	getSizedParentNode: () => getSizedParentNode,
	setPosition: () => setPosition,
	setTransform: () => setTransform,
	toBack: () => toBack,
	toFront: () => toFront
});
/**
* Returns an element given its DOM id, or returns the element itself
* if it was passed directly.
* @param {string|HTMLElement} id
* @returns {HTMLElement|null}
*/
function get(id) {
	return typeof id === "string" ? document.getElementById(id) : id;
}
/**
* Creates an HTML element with `tagName`, sets its class to `className`, and
* optionally appends it to `container` element.
* @param {string} tagName
* @param {string} [className]
* @param {HTMLElement} [container]
* @returns {HTMLElement}
*/
function create(tagName, className, container) {
	const el = document.createElement(tagName);
	el.className = className ?? "";
	container?.appendChild(el);
	return el;
}
/**
* Makes `el` the last child of its parent, so it renders in front of the other
* children.
* @param {Element} el
* @returns {void}
*/
function toFront(el) {
	const parent = el.parentNode;
	if (!parent || parent.lastChild === el) return;
	if (el.matches(":hover")) while (el.nextSibling) parent.insertBefore(el.nextSibling, el);
	else parent.appendChild(el);
}
/**
* Makes `el` the first child of its parent, so it renders behind the other children.
* @param {Element} el
* @returns {void}
*/
function toBack(el) {
	const parent = el.parentNode;
	if (!parent || parent.firstChild === el) return;
	if (el.matches(":hover")) while (el.previousSibling) parent.insertBefore(el.previousSibling, el.nextSibling);
	else parent.insertBefore(el, parent.firstChild);
}
/**
* Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
* and optionally scaled by `scale`. Does not have an effect if the
* browser doesn't support 3D CSS transforms.
* @param {HTMLElement|SVGElement} el
* @param {Point} [offset]
* @param {number} [scale]
* @returns {void}
*/
function setTransform(el, offset, scale) {
	const pos = offset ?? new Point(0, 0);
	const transform = `translate3d(${pos.x}px, ${pos.y}px, 0px)${scale ? ` scale(${scale})` : ""}`;
	if (el.style.transform !== transform) el.style.transform = transform;
}
const positions = /* @__PURE__ */ new WeakMap();
/**
* Sets the position of `el` to coordinates specified by `point` using a CSS translate
* (used by Maplair internally to position its layers). With `flat`, the translate is 2D,
* so `el` is painted into its parent's compositor layer instead of getting a layer of its own.
* @param {HTMLElement|SVGElement} el
* @param {Point} point
* @param {boolean} [flat]
* @returns {void}
*/
function setPosition(el, point, flat) {
	positions.set(el, point);
	if (flat) el.style.transform = `translate(${point.x}px, ${point.y}px)`;
	else setTransform(el, point);
}
/**
* Returns the coordinates of an element previously positioned with setPosition.
* @param {HTMLElement|SVGElement} el
* @returns {Point}
*/
function getPosition(el) {
	return positions.get(el) ?? new Point(0, 0);
}
/**
* Prevents the user from generating `dragstart` DOM events, usually generated when
* the user drags an image.
* @returns {void}
*/
function disableImageDrag() {
	on(window, "dragstart", preventDefault);
}
/**
* Cancels the effects of a previous
* [`DomUtil.disableImageDrag`](#domutil-disableimagedrag).
* @returns {void}
*/
function enableImageDrag() {
	off(window, "dragstart", preventDefault);
}
/**
* Finds the closest parent node which size (width and height) is not null.
* @param {HTMLElement} element
* @returns {HTMLElement}
*/
function getSizedParentNode(element) {
	do
		element = element.parentNode;
	while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
	return element;
}
/**
* Computes the CSS scale currently applied on the element.
* Returns an object with `x` and `y` members as horizontal and vertical scales
* respectively, and `boundingClientRect` as the result of
* [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
* @param {HTMLElement} element
* @returns {{x: number, y: number, boundingClientRect: DOMRect}}
*/
function getScale(element) {
	const rect = element.getBoundingClientRect();
	return {
		x: rect.width / element.offsetWidth || 1,
		y: rect.height / element.offsetHeight || 1,
		boundingClientRect: rect
	};
}
// src/control/Control.js
/** @import {MaplairMap} from '../map/Map.js' */
/**
* Options of `Control`, inherited by all controls.
* @typedef {object} ControlOptions
* @property {string} [position='topright'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {number} [order=0] The position of the control within its corner: controls
* with a lower order are closer to the corner of the map, those with the same order in
* the order of adding.
*/
/**
* Methods of `MaplairMap` for controls.
* @lends MaplairMap.prototype
*/
const mapControlMethods = {
	/**
	* Adds the given control to the map.
	* @group Methods for layers and controls
	* @param {Control} control
	* @returns {this}
	*/
	addControl(control) {
		control.addTo(this);
		return this;
	},
	/**
	* Removes the given control from the map.
	* @group Methods for layers and controls
	* @param {Control} control
	* @returns {this}
	*/
	removeControl(control) {
		control.remove();
		return this;
	},
	_initControlPos() {
		const corners = this._controlCorners = {}, l = "maplair-", container = this._controlContainer = create("div", `${l}control-container`, this._container);
		for (const v of ["top", "bottom"]) for (const h of ["left", "right"]) corners[v + h] = create("div", `${l + v} ${l}${h}`, container);
	},
	_clearControlPos() {
		this._controlContainer.remove();
		delete this._controlCorners;
		delete this._controlContainer;
	}
};
/** @typedef {typeof mapControlMethods} MapControlMethods */
/**
* The methods which controls implement, see `Control`.
* @typedef {object} ControlExtensionMethods
* @property {(map: MaplairMap) => HTMLElement} [onAdd] Should return the container DOM
* element for the control and add listeners on relevant map events. Called on
* [`control.addTo(map)`](#control-addto).
* @property {(map: MaplairMap) => void} [onRemove] Should contain all clean up code that
* removes the listeners previously added in `onAdd`. Called on
* [`control.remove()`](#control-remove).
* @lends Control
*/
const controlOrders = /* @__PURE__ */ new WeakMap();
/**
* Control is a base class for implementing map controls. Handles positioning.
* All other controls extend from this class.
*
* Every control should extend from `Control` and (re-)implement the following methods:
*
* * `onAdd(map: MaplairMap): HTMLElement` should return the container DOM element for
*   the control and add listeners on relevant map events. Called on
*   [`control.addTo(map)`](#control-addTo).
* * `onRemove(map: MaplairMap)` (optional) should contain all clean up code that removes
*   the listeners previously added in [`onAdd`](#control-onadd). Called on
*   [`control.remove()`](#control-remove).
*/
var Control = class Control extends Class {
	static defaultOptions = {
		position: "topright",
		order: 0
	};
	/**
	* @param {ControlOptions} [options]
	*/
	constructor(options) {
		super();
		setOptions(this, options);
		this.callInitHooks(Control);
	}
	/**
	* Returns the position of the control.
	* @returns {string}
	*/
	getPosition() {
		return this.options.position;
	}
	/**
	* Sets the position of the control.
	* @param {string} position
	* @returns {this}
	*/
	setPosition(position) {
		const map = this._map;
		map?.removeControl(this);
		this.options.position = position;
		map?.addControl(this);
		return this;
	}
	/**
	* Returns the HTMLElement that contains the control.
	* @returns {HTMLElement}
	*/
	getContainer() {
		return this._container;
	}
	/**
	* Adds the control to the given map.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	addTo(map) {
		this.remove();
		this._map = map;
		const container = this._container = this.onAdd(map), pos = this.getPosition(), corner = map._controlCorners[pos];
		container.classList.add("maplair-control");
		const order = this.options.order ?? 0, bottom = pos.includes("bottom"), children = [...corner.children];
		controlOrders.set(container, order);
		corner.insertBefore(container, children.find((el) => bottom ? (controlOrders.get(el) ?? 0) <= order : (controlOrders.get(el) ?? 0) > order) ?? null);
		this._map.on("unload", this.remove, this);
		return this;
	}
	/**
	* Removes the control from the map it is currently active on.
	* @returns {this}
	*/
	remove() {
		if (!this._map) return this;
		this._container.remove();
		if (this.onRemove) this.onRemove(this._map);
		this._map.off("unload", this.remove, this);
		this._map = null;
		return this;
	}
	_refocusOnMap(e) {
		if (this._map && e && !(e.screenX === 0 && e.screenY === 0)) this._map.getContainer().focus({
			preventScroll: true,
			focusVisible: false
		});
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.include(mapControlMethods);
	}
};
// src/core/I18n.js
/**
* Utility functions to deal with translations.
*
* Translations of Maplair's built-in strings are maintained on
* [Transifex](https://app.transifex.com/simon04/maplair/) and published in the
* `i18n` directory of the package. Load one before creating the map, see the example.
*
* @example
* ```js
* import {I18n} from 'maplair';
* import de from 'maplair/i18n/de.json' with {type: 'json'};
*
* I18n.registerLocale('de', de);
* I18n.setLocale('de');
* ```
*/
var I18n = class {
	static #messages = {};
	static #locale = null;
	/**
	* Define localized strings for a given locale, defined by `locale`.
	* @param {string} locale
	* @param {Record<string, string>} [messages]
	* @returns {void}
	*/
	static registerLocale(locale, messages) {
		this.#messages[locale] = {
			...this.#messages[locale],
			...messages
		};
	}
	/**
	* Define or change the locale code to be used when translating strings.
	* Note that changing the locale does not affect already instantiated objects.
	* @param {string|null} locale
	* @returns {void}
	*/
	static setLocale(locale) {
		this.#locale = locale;
	}
	/**
	* Returns the current locale code, that will be used when translating strings.
	* @returns {string|null}
	*/
	static getLocale() {
		return this.#locale;
	}
	/**
	* Actually try to translate the `string`, with optional variable passed in `data`.
	* @param {string} string
	* @param {Record<string, any>} [data]
	* @returns {string}
	*/
	static translate(string, data = {}) {
		if (this.#locale === null) return template(string, data);
		const translation = this.#messages[this.#locale]?.[string];
		if (!translation) {
			console.warn(`No translation found for "${string}", falling back to the original string.`);
			return template(string, data);
		}
		try {
			return template(translation, data);
		} catch (err) {
			console.error(`Error while translating "${translation}".`, err);
			return translation;
		}
	}
};
// src/control/AttributionControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
const mapleLeaf = "<span aria-hidden=\"true\" class=\"maplair-attribution-leaf\">&#x1F341;</span>";
/**
* Options of `AttributionControl`.
* @typedef {object} AttributionControlOptions
* @property {string} [position='bottomright'] The position of the control (one of the
* map corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string|false|null} [prefix=null] The HTML text shown before the
* attributions. Pass `false` to disable. By default (`null`), a link to Maplair.
* @extends ControlOptions
*/
/**
* Map options of `AttributionControl`.
* @typedef {object} AttributionControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [attributionControl=true] Whether a
* [attribution control](#control-attribution) is added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `AttributionControl`.
* @typedef {object} AttributionControlMapProperties
* @lends MaplairMap
* @property {AttributionControl} attributionControl The attribution control of the map,
* the default one (if the [`attributionControl` option](#map-attributioncontrol) was
* `true` when creating the map) or the one added last.
*/
/**
* The attribution control allows you to display attribution data in a small text box
* on a map. It is put on the map by default unless you set its
* [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches
* attribution texts from layers with the [`getAttribution` method](#layer-getattribution)
* automatically.
*/
var AttributionControl = class AttributionControl extends Control {
	static defaultOptions = {
		position: "bottomright",
		prefix: null
	};
	/**
	* Creates an attribution control.
	* @param {AttributionControlOptions} [options]
	*/
	constructor(options) {
		super(options);
		if (this.options.prefix === null) {
			const title = I18n.translate("A JavaScript library for interactive maps");
			this.options.prefix = `<a target="_blank" href="https://maplair.org" title="${title}">${mapleLeaf}Maplair</a>`;
		}
		this._attributions = {};
		this._orders = {};
		this._layerAttributions = /* @__PURE__ */ new Map();
		this.callInitHooks(AttributionControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		map.attributionControl = this;
		this._container = create("div", "maplair-control-attribution");
		disableClickPropagation(this._container);
		if (map._loaded) map.eachLayer((layer) => this._addLayer({ layer }));
		this._update();
		map.on({
			layeradd: this._addLayer,
			layerremove: this._removeLayer
		}, this);
		return this._container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off({
			layeradd: this._addLayer,
			layerremove: this._removeLayer
		}, this);
		for (const layer of this._layerAttributions.keys()) this._removeLayer({ layer });
	}
	_addLayer({ layer }) {
		const text = layer.getAttribution?.();
		if (!text || this._layerAttributions.has(layer)) return;
		this._layerAttributions.set(layer, text);
		this.addAttribution(text, layer.options?.attributionOrder);
	}
	_removeLayer({ layer }) {
		this.removeAttribution(this._layerAttributions.get(layer));
		this._layerAttributions.delete(layer);
	}
	/**
	* The HTML text shown before the attributions. Pass `false` to disable.
	* @param {string|false} prefix
	* @returns {this}
	*/
	setPrefix(prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	}
	/**
	* Adds an attribution text (e.g. `'© OpenStreetMap contributors'`). Attributions
	* are sorted by `order` (see the layer option `attributionOrder`), then by the order
	* of adding.
	* @param {string} text
	* @param {number} [order=0]
	* @returns {this}
	*/
	addAttribution(text, order = 0) {
		if (!text) return this;
		this._orders[text] = order;
		if (!this._attributions[text]) this._attributions[text] = 0;
		this._attributions[text]++;
		this._update();
		return this;
	}
	/**
	* Removes an attribution text.
	* @param {string} text
	* @returns {this}
	*/
	removeAttribution(text) {
		if (!text) return this;
		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}
		return this;
	}
	_update() {
		if (!this._map) return;
		const attribs = Object.keys(this._attributions).filter((i) => this._attributions[i]).sort((a, b) => this._orders[a] - this._orders[b]);
		const prefixAndAttribs = [];
		if (this.options.prefix) prefixAndAttribs.push(this.options.prefix);
		if (attribs.length) prefixAndAttribs.push(attribs.join(", "));
		this._container.innerHTML = prefixAndAttribs.join(" <span aria-hidden=\"true\">|</span> ");
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ attributionControl: true });
		MaplairMap.addInitHook(function() {
			if (this.options.attributionControl) new AttributionControl().addTo(this);
		});
	}
};
// src/control/ButtonControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
* A state of a `ButtonControl`, see its `states` option.
* @typedef {object} ButtonControlState
* @property {string} name The name of the state, see `setState()`.
* @property {string|HTMLElement} [content] The content of the button in this state.
* @property {string} [title] The title of the button in this state.
* @property {(this: ButtonControl, e: MouseEvent, button: ButtonControl, map: MaplairMap) => void} [onClick]
* Called when clicking the button in this state.
*/
/**
* Options of `ButtonControl`.
* @typedef {object} ButtonControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string|HTMLElement} [content=''] The content of the button: HTML (e.g. an
* icon or a character) or an element. String content is rendered as HTML; do not pass
* untrusted input.
* @property {string} [title=''] The title (tooltip) and accessible name of the button.
* @property {(this: ButtonControl, e: MouseEvent, button: ButtonControl, map: MaplairMap) => void} [onClick]
* Called with the click event, the `ButtonControl` and the map when clicking the button.
* @property {ButtonControlState[]} [states] Alternative states of the button, each an
* object with `name` and with `content`, `title` and `onClick` like the options. The
* first state is the initial one, `setState()` switches them.
* @property {string} [className=''] A custom CSS class name to assign to the button.
* @property {string} [accessKey=''] A key to activate the button with the browser's
* [access key](https://developer.mozilla.org/docs/Web/HTML/Reference/Global_attributes/accesskey)
* modifiers (e.g. Alt+Shift+K), shown in the title.
* @extends ControlOptions
*/
/**
* A control with a button, styled like the zoom control, calling a function when
* clicked. It can have several states with their own content, title and function,
* e.g. to toggle something. Several buttons can be grouped with `ButtonBarControl`.
*
* Inspired by the [Leaflet.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton) plugin.
*
* @example
* ```js
* new ButtonControl({
* 	content: '⌂',
* 	title: 'Home',
* 	onClick: (e, button, map) => map.setView([47.27, 11.40], 13)
* }).addTo(map);
*
* new ButtonControl({
* 	states: [{
* 		name: 'show',
* 		content: '👁',
* 		title: 'Show the markers',
* 		onClick(e, button, map) { markers.addTo(map); button.setState('hide'); }
* 	}, {
* 		name: 'hide',
* 		content: '🙈',
* 		title: 'Hide the markers',
* 		onClick(e, button) { markers.remove(); button.setState('show'); }
* 	}]
* }).addTo(map);
* ```
*/
var ButtonControl = class ButtonControl extends Control {
	static defaultOptions = {
		position: "topleft",
		content: "",
		title: "",
		onClick: void 0,
		states: void 0,
		className: "",
		accessKey: ""
	};
	/**
	* Creates a button control.
	* @param {...ButtonControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this._state = this.options.states?.[0];
		this.callInitHooks(ButtonControl);
	}
	/**
	* @internal
	* @returns {HTMLElement}
	*/
	onAdd() {
		const container = create("div", "maplair-bar maplair-control-button");
		this._createButton(container);
		return container;
	}
	_createButton(container) {
		const button = this._button = create("button", `maplair-control-button-button ${this.options.className}`, container);
		button.type = "button";
		button.accessKey = this.options.accessKey;
		disableClickPropagation(button);
		on(button, "click", stop);
		on(button, "click", this._onClick, this);
		on(button, "click", this._refocusOnMap, this);
		this._update();
		return button;
	}
	_onClick(e) {
		if (this._disabled) return;
		(this._state ?? this.options).onClick?.call(this, e, this, this._map);
	}
	_update() {
		if (!this._button) return;
		const { content, title } = this._state ?? this.options, button = this._button;
		if (typeof content === "string") button.innerHTML = content;
		else button.replaceChildren(content);
		const key = button.accessKeyLabel || this.options.accessKey.toUpperCase();
		button.title = [title, key && `[${key}]`].filter(Boolean).join(" ");
		button.setAttribute("aria-label", title ?? "");
		if (this._state) button.dataset.state = this._state.name;
		button.classList.toggle("maplair-disabled", !!this._disabled);
		button.setAttribute("aria-disabled", !!this._disabled);
	}
	/**
	* Switches to the state with the given `name`, see the `states` option.
	* @param {string} name
	* @returns {this}
	*/
	setState(name) {
		const state = this.options.states?.find((s) => s.name === name);
		if (!state) throw new Error(`Unknown button state "${name}".`);
		this._state = state;
		this._update();
		return this;
	}
	/**
	* Returns the name of the current state, see the `states` option.
	* @returns {string|undefined}
	*/
	getState() {
		return this._state?.name;
	}
	/**
	* Disables the button, so that clicking it does nothing.
	* @returns {this}
	*/
	disable() {
		this._disabled = true;
		this._update();
		return this;
	}
	/**
	* Enables the button again.
	* @returns {this}
	*/
	enable() {
		this._disabled = false;
		this._update();
		return this;
	}
	/**
	* Returns the button element.
	* @returns {HTMLElement}
	*/
	getButton() {
		return this._button;
	}
};
/**
* Groups several `ButtonControl`s in one bar, like the buttons of the zoom control.
*
* Inspired by the [Leaflet.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton) plugin.
*
* @example
* ```js
* new ButtonBarControl([
* 	new ButtonControl({content: 'A', title: 'First', onClick: () => {}}),
* 	new ButtonControl({content: 'B', title: 'Second', onClick: () => {}})
* ]).addTo(map);
* ```
*/
var ButtonBarControl = class ButtonBarControl extends Control {
	/**
	* Creates a bar with the given buttons.
	* @param {ButtonControl[]} buttons
	* @param {ControlOptions} [options]
	*/
	constructor(buttons, options) {
		super(options);
		this._buttons = buttons;
		this.callInitHooks(ButtonBarControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-bar maplair-control-button-bar");
		for (const button of this._buttons) {
			button._map = map;
			button._createButton(container);
		}
		return container;
	}
	/** @internal */
	onRemove() {
		for (const button of this._buttons) button._map = null;
	}
	/**
	* Returns the buttons of the bar.
	* @returns {ButtonControl[]}
	*/
	getButtons() {
		return this._buttons;
	}
};
// src/core/Events.js
const warnedEvents = /* @__PURE__ */ new Set();
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {LatLngBounds} from '../geo/LatLngBounds.js' */
/** @import {Point} from '../geometry/Point.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {Popup} from '../layer/Popup.js' */
/** @import {Tooltip} from '../layer/Tooltip.js' */
/**
* The base event object, the argument of event listeners. All other event objects
* contain these properties too. Whenever a class inheriting from `Evented` fires an
* event, a listener function is called with an event object containing information
* about the event, which depends on the event type. For example:
*
* ```js
* map.on('click', function(ev) {
*     alert(ev.latlng); // ev is an event object (MaplairPointerEvent in this case)
* });
* ```
*
* @typedef {object} MaplairEvent
* @property {string} type The event type (e.g. `'click'`).
* @property {any} target The object that fired the event. For propagated events, the
* last object in the propagation chain that fired the event.
* @property {any} sourceTarget The object that originally fired the event. For
* non-propagated events, this will be the same as the `target`.
* @property {any} [propagatedFrom] For propagated events, the last object that
* propagated the event to its event parent.
*/
/**
* A listener of events, called with the event object, which has more properties
* depending on the event type (see the event objects below).
* @typedef {(event: MaplairEvent & Record<string, any>) => void} EventListener
*/
/**
* The event object of keyboard events.
* @typedef {object} MaplairKeyboardEvent
* @property {KeyboardEvent} originalEvent The original
* [DOM `KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
* that triggered this Maplair event.
* @extends MaplairEvent
*/
/**
* The event object of pointer events (`click`, `pointermove`, …).
* @typedef {object} MaplairPointerEvent
* @property {LatLng} latlng The geographical point where the pointer event occurred.
* @property {Point} layerPoint Pixel coordinates of the point where the pointer event
* occurred relative to the map layer.
* @property {Point} containerPoint Pixel coordinates of the point where the pointer
* event occurred relative to the map container.
* @property {MouseEvent|PointerEvent} originalEvent The original
* [DOM `MouseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) or
* [DOM `PointerEvent`](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
* that triggered this Maplair event.
* @extends MaplairEvent
*/
/**
* The event object of `locationfound`.
* @typedef {object} LocationEvent
* @property {LatLng} latlng Detected geographical location of the user.
* @property {LatLngBounds} bounds Geographical bounds of the area user is located in
* (with respect to the accuracy of location).
* @property {number} accuracy Accuracy of location in meters.
* @property {number} altitude Height of the position above the WGS84 ellipsoid in meters.
* @property {number} altitudeAccuracy Accuracy of altitude in meters.
* @property {number} heading The direction of travel in degrees counting clockwise from true North.
* @property {number} speed Current velocity in meters per second.
* @property {number} timestamp The time when the position was acquired.
* @extends MaplairEvent
*/
/**
* The event object of errors, e.g. `locationerror`.
* @typedef {object} MaplairErrorEvent
* @property {string} message Error message.
* @property {number} [code] Error code (if applicable).
* @extends MaplairEvent
*/
/**
* The event object of adding and removing layers.
* @typedef {object} LayerEvent
* @property {Layer} layer The layer that was added or removed.
* @extends MaplairEvent
*/
/**
* The event object of the layers control.
* @typedef {object} LayersControlEvent
* @property {Layer} layer The layer that was added or removed.
* @property {string} name The name of the layer that was added or removed.
* @property {Event} [originalEvent] The DOM event of the click on the entry in the
* layers control, `undefined` if the layer was added or removed by code.
* @extends MaplairEvent
*/
/**
* The event object of tile events.
* @typedef {object} TileEvent
* @property {HTMLElement} tile The tile element (image).
* @property {Point} coords Point object with the tile's `x`, `y`, and `z` (zoom level) coordinates.
* @extends MaplairEvent
*/
/**
* The event object of `tileerror`.
* @typedef {object} TileErrorEvent
* @property {any} error Error passed to the tile's `done()` callback.
* @extends TileEvent
*/
/**
* The event object of `resize`.
* @typedef {object} ResizeEvent
* @property {Point} oldSize The old size before resize event.
* @property {Point} newSize The new size after the resize event.
* @extends MaplairEvent
*/
/**
* The event object of `crschange`.
* @typedef {object} CrsChangeEvent
* @property {CRS} oldCrs The CRS of the map before the change.
* @property {CRS} crs The new CRS of the map.
* @extends MaplairEvent
*/
/**
* The event object of `worldcopyjump`.
* @typedef {object} WorldCopyJumpEvent
* @property {number} worlds The signed number of world widths by which the map pane moved.
* @extends MaplairEvent
*/
/**
* The event object of adding GeoJSON features.
* @typedef {object} GeoJSONEvent
* @property {Layer} layer The layer for the GeoJSON feature that is being added to the map.
* @property {object} properties GeoJSON properties of the feature.
* @property {string} geometryType GeoJSON geometry type of the feature.
* @property {string|number} [id] GeoJSON ID of the feature (if present).
* @extends MaplairEvent
*/
/**
* The event object of opening and closing popups.
* @typedef {object} PopupEvent
* @property {Popup} popup The popup that was opened or closed.
* @extends MaplairEvent
*/
/**
* The event object of opening and closing tooltips.
* @typedef {object} TooltipEvent
* @property {Tooltip} tooltip The tooltip that was opened or closed.
* @extends MaplairEvent
*/
/**
* The event object of `dragend`.
* @typedef {object} DragEndEvent
* @property {number} distance The distance in pixels the draggable element was moved by.
* @extends MaplairEvent
*/
/**
* The event object of `zoomanim`.
* @typedef {object} ZoomAnimEvent
* @property {LatLng} center The current center of the map.
* @property {number} zoom The current zoom level of the map.
* @property {boolean} [noUpdate] Whether layers should update their contents due to this event.
* @extends MaplairEvent
*/
/**
* A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
*
* @example
*
* ```js
* map.on('click', function(e) {
* 	alert(e.latlng);
* } );
* ```
*
* Maplair deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
*
* ```js
* function onClick(e) { ... }
*
* map.on('click', onClick);
* map.off('click', onClick);
* ```
*/
var Evented = class Evented extends Class {
	/**
	* Adds a listener function (`fn`) to a particular event type of the object. You can
	* optionally specify the context of the listener (object the this keyword will point
	* to). You can also pass several space-separated types (e.g. `'click dblclick'`).
	* Alternatively, adds a set of type/listener pairs, e.g.
	* `{click: onClick, pointermove: onPointerMove}`, with the context as second argument.
	* @param {string|Record<string, EventListener>} types
	* @param {EventListener|object} [fn]
	* @param {object} [context]
	* @returns {this}
	*/
	on(types, fn, context) {
		if (typeof types === "object") for (const [type, f] of Object.entries(types)) this._on(type, f, fn);
		else for (const type of splitWords(types)) this._on(type, fn, context);
		return this;
	}
	/**
	* Removes a previously added listener function. If no function is specified, it will
	* remove all the listeners of that particular event from the object. Note that if you
	* passed a custom context to `on`, you must pass the same context to `off` in order to
	* remove the listener. Alternatively, removes a set of type/listener pairs. Without
	* arguments, removes all listeners to all events on the object, including implicitly
	* attached events.
	* @param {string|Record<string, EventListener>} [types]
	* @param {EventListener|object} [fn]
	* @param {object} [context]
	* @returns {this}
	*/
	off(types, fn, context) {
		if (!arguments.length) {
			delete this._events;
			delete this._listenerIndex;
		} else if (typeof types === "object") for (const [type, f] of Object.entries(types)) this._off(type, f, fn);
		else {
			const removeAll = arguments.length === 1;
			for (const type of splitWords(types)) if (removeAll) this._off(type);
			else this._off(type, fn, context);
		}
		return this;
	}
	static __REMOVED_EVENTS = {
		mousedown: "pointerdown",
		mouseup: "pointerup",
		mouseover: "pointerover",
		mouseout: "pointerout",
		mousemove: "pointermove",
		keypress: "keydown"
	};
	_on(type, fn, context, _once) {
		if (Object.hasOwn(Evented.__REMOVED_EVENTS, type) && !warnedEvents.has(type)) {
			warnedEvents.add(type);
			console.error(`The event ${type} has been removed in Maplair. Use ${Evented.__REMOVED_EVENTS[type]} instead.`);
		}
		if (typeof fn !== "function") {
			console.warn(`wrong listener type: ${typeof fn}`);
			return;
		}
		if (context === this) context = void 0;
		const contexts = this._getListenerIndex(type).get(fn);
		if (contexts?.has(context)) return;
		const newListener = {
			fn,
			ctx: context
		};
		if (_once) newListener.once = true;
		this._events ??= {};
		this._events[type] ??= /* @__PURE__ */ new Set();
		this._events[type].add(newListener);
		if (contexts) contexts.set(context, newListener);
		else this._listenerIndex[type].set(fn, /* @__PURE__ */ new Map([[context, newListener]]));
	}
	_getListenerIndex(type) {
		this._listenerIndex ??= {};
		return this._listenerIndex[type] ??= /* @__PURE__ */ new Map();
	}
	_off(type, fn, context) {
		if (!this._events) return;
		let listeners = this._events[type];
		if (!listeners) return;
		if (arguments.length === 1) {
			if (this._firingCount) for (const listener of listeners) listener.fn = falseFn;
			delete this._events[type];
			delete this._listenerIndex?.[type];
			return;
		}
		if (typeof fn !== "function") {
			console.warn(`wrong listener type: ${typeof fn}`);
			return;
		}
		if (context === this) context = void 0;
		const contexts = this._listenerIndex?.[type]?.get(fn), listener = contexts?.get(context);
		if (listener) {
			contexts.delete(context);
			if (!contexts.size) this._listenerIndex[type].delete(fn);
			if (this._firingCount) {
				listener.fn = falseFn;
				this._events[type] = listeners = new Set(listeners);
			}
			listeners.delete(listener);
		}
	}
	/**
	* Fires an event of the specified type. You can optionally provide a data
	* object — the first argument of the listener function will contain its
	* properties. The event can optionally be propagated to event parents.
	* @param {string} type
	* @param {object} [data]
	* @param {boolean} [propagate]
	* @returns {this}
	*/
	fire(type, data, propagate) {
		if (!this.listens(type, propagate)) return this;
		const event = {
			...data,
			type,
			target: this,
			sourceTarget: data?.sourceTarget || this
		};
		if (this._events) {
			const listeners = this._events[type];
			if (listeners) {
				this._firingCount = this._firingCount + 1 || 1;
				for (const l of listeners) {
					const fn = l.fn;
					if (l.once) this.off(type, fn, l.ctx);
					fn.call(l.ctx || this, event);
				}
				this._firingCount--;
			}
		}
		if (propagate) this._propagateEvent(event);
		return this;
	}
	/**
	* Returns `true` if a particular event type has any listeners attached to it (or the
	* given listener function, with the given context). The verification can optionally
	* be propagated, it will return `true` if parents have the listener attached to it.
	* Called as `listens(type, propagate?)` or `listens(type, fn, context?, propagate?)`.
	* @param {string} type
	* @param {EventListener|boolean} [fn]
	* @param {object} [context]
	* @param {boolean} [propagate]
	* @returns {boolean}
	*/
	listens(type, fn, context, propagate) {
		if (typeof type !== "string") console.warn("\"string\" type argument expected");
		let _fn = fn;
		if (typeof fn !== "function") {
			propagate = !!fn;
			_fn = void 0;
			context = void 0;
		}
		if (this._events?.[type]?.size) {
			if (this._listens(type, _fn, context) !== false) return true;
		}
		if (propagate) {
			for (const p of Object.values(this._eventParents ?? {})) if (p.listens(type, fn, context, propagate)) return true;
		}
		return false;
	}
	_listens(type, fn, context) {
		if (!this._events) return false;
		const listeners = this._events[type];
		if (!fn) return !!listeners?.size;
		if (context === this) context = void 0;
		return !!this._listenerIndex?.[type]?.get(fn)?.has(context);
	}
	/**
	* Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
	* @param {string|Record<string, EventListener>} types
	* @param {EventListener|object} [fn]
	* @param {object} [context]
	* @returns {this}
	*/
	once(types, fn, context) {
		if (typeof types === "object") for (const [type, f] of Object.entries(types)) this._on(type, f, fn, true);
		else for (const type of splitWords(types)) this._on(type, fn, context, true);
		return this;
	}
	/**
	* Adds an event parent - an `Evented` that will receive propagated events.
	* @param {Evented} obj
	* @returns {this}
	*/
	addEventParent(obj) {
		this._eventParents ??= {};
		this._eventParents[stamp(obj)] = obj;
		return this;
	}
	/**
	* Removes an event parent, so it will stop receiving propagated events.
	* @param {Evented} obj
	* @returns {this}
	*/
	removeEventParent(obj) {
		if (this._eventParents) delete this._eventParents[stamp(obj)];
		return this;
	}
	_propagateEvent(e) {
		for (const p of Object.values(this._eventParents ?? {})) p.fire(e.type, {
			propagatedFrom: e.target,
			...e
		}, true);
	}
};
// src/layer/Layer.js
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {LayerGroup} from './LayerGroup.js' */
/** @import {EventListener, MaplairEvent, MaplairPointerEvent, LayerEvent} from '../core/Events.js' */
/**
* Options of `Layer`, inherited by all layers.
* @typedef {object} LayerOptions
* @property {string} [pane='overlayPane'] By default the layer will be added to the
* map's [overlay pane](#map-pane) (`overlayPane`). Overriding this option will cause the layer
* to be placed on another pane by default. Not effective if the `renderer` option is
* set (the `renderer` option will override the `pane` option).
* @property {string|null} [attribution=null] String to be shown in the attribution
* control, e.g. "© OpenStreetMap contributors". It describes the layer data and is
* often a legal obligation towards copyright holders and tile providers.
* @property {number} [attributionOrder=0] The position of the attribution in the
* attribution control: attributions are sorted by it, then by the order of adding,
* e.g. `1` keeps a legend last.
*/
/**
* Options of interactive layers. Some layers can be made interactive - when the user
* interacts with such a layer, pointer events like `click` and `pointerover` can be
* handled. Use the [event handling methods](#evented-method) to handle these events.
* @typedef {object} InteractiveLayerOptions
* @property {boolean} [interactive=true] If `false`, the layer will not emit pointer
* events and will act as a part of the underlying map.
* @property {boolean} [bubblingPointerEvents=true] When `true`, a pointer event on this
* layer will trigger the same event on the map (unless
* [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
* @extends LayerOptions
* @fires Layer#click {MaplairPointerEvent} Fired when the user clicks (or taps) the
* layer, if it is interactive.
* @fires Layer#dblclick {MaplairPointerEvent} Fired when the user double-clicks (or
* double-taps) the layer, if it is interactive.
* @fires Layer#pointerdown {MaplairPointerEvent} Fired when the user pushes the pointer
* on the layer, if it is interactive.
* @fires Layer#pointerup {MaplairPointerEvent} Fired when the user releases the pointer
* pushed on the layer, if it is interactive.
* @fires Layer#pointerover {MaplairPointerEvent} Fired when the pointer enters the
* layer, if it is interactive.
* @fires Layer#pointerout {MaplairPointerEvent} Fired when the pointer leaves the layer,
* if it is interactive.
* @fires Layer#contextmenu {MaplairPointerEvent} Fired when the user right-clicks on
* the layer, if it is interactive; prevents default browser context menu from showing
* if there are listeners on this event. Also fired on mobile when the user holds a
* single touch for a second (also called long press).
*/
/**
* Methods of `MaplairMap` for layers.
* @lends MaplairMap.prototype
* @fires MaplairMap#layeradd {LayerEvent} Fired when a new layer is added to the map.
* @fires MaplairMap#layerremove {LayerEvent} Fired when some layer is removed from the map.
* @fires MaplairMap#zoomlevelschange {MaplairEvent} Fired when the number of zoomlevels
* on the map is changed due to adding or removing a layer.
*/
const mapLayerMethods = {
	/**
	* Adds the given layer to the map.
	* @group Methods for layers and controls
	* @param {Layer} layer
	* @returns {this}
	*/
	addLayer(layer) {
		if (!layer._layerAdd) throw new Error("The provided object is not a Layer.");
		const id = stamp(layer);
		if (this._layers[id]) return this;
		this._layers[id] = layer;
		layer._mapToAdd = this;
		if (layer.beforeAdd) layer.beforeAdd(this);
		this.whenReady(layer._layerAdd, layer);
		return this;
	},
	/**
	* Removes the given layer from the map.
	* @group Methods for layers and controls
	* @param {Layer} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		const id = stamp(layer);
		if (!this._layers[id]) return this;
		if (this._loaded) layer.onRemove(this);
		delete this._layers[id];
		if (this._loaded) {
			this.fire("layerremove", { layer });
			layer.fire("remove");
		}
		layer._map = layer._mapToAdd = null;
		return this;
	},
	/**
	* Returns `true` if the given layer is currently added to the map.
	* @group Methods for layers and controls
	* @param {Layer} layer
	* @returns {boolean}
	*/
	hasLayer(layer) {
		return stamp(layer) in this._layers;
	},
	/**
	* Iterates over the layers of the map, optionally specifying context of the iterator function.
	* ```js
	* map.eachLayer(function(layer){
	*     layer.bindPopup('Hello');
	* });
	* ```
	* @group Methods for layers and controls
	* @param {(layer: Layer) => void} method
	* @param {object} [context]
	* @returns {this}
	*/
	eachLayer(method, context) {
		for (const layer of Object.values(this._layers)) method.call(context, layer);
		return this;
	},
	_addLayers(layers) {
		layers = layers ? Array.isArray(layers) ? layers : [layers] : [];
		for (const layer of layers) this.addLayer(layer);
	},
	_addZoomLimit(layer) {
		if (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
			this._zoomBoundLayers[stamp(layer)] = layer;
			this._updateZoomLevels();
		}
	},
	_removeZoomLimit(layer) {
		const id = stamp(layer);
		if (this._zoomBoundLayers[id]) {
			delete this._zoomBoundLayers[id];
			this._updateZoomLevels();
		}
	},
	_updateZoomLevels() {
		let minZoom = Infinity, maxZoom = -Infinity;
		const oldZoomSpan = this._getZoomSpan();
		for (const l of Object.values(this._zoomBoundLayers)) {
			const options = l.options;
			minZoom = Math.min(minZoom, options.minZoom ?? Infinity);
			maxZoom = Math.max(maxZoom, options.maxZoom ?? -Infinity);
		}
		this._layersMaxZoom = maxZoom === -Infinity ? void 0 : maxZoom;
		this._layersMinZoom = minZoom === Infinity ? void 0 : minZoom;
		if (oldZoomSpan !== this._getZoomSpan()) this.fire("zoomlevelschange");
		if (this.options.maxZoom === void 0 && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) this.setZoom(this._layersMaxZoom);
		if (this.options.minZoom === void 0 && this._layersMinZoom && this.getZoom() < this._layersMinZoom) this.setZoom(this._layersMinZoom);
	}
};
/** @typedef {typeof mapLayerMethods} MapLayerMethods */
/**
* The methods which layers implement, see `Layer`.
* @typedef {object} LayerExtensionMethods
* @property {(map: MaplairMap) => void} [onAdd] Should contain code that creates DOM
* elements for the layer, adds them to `map panes` where they should belong and puts
* listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
* @property {(map: MaplairMap) => void} [onRemove] Should contain all clean up code that
* removes the layer's elements from the DOM and removes listeners previously added in
* `onAdd`. Called on [`map.removeLayer(layer)`](#map-removelayer).
* @property {() => Record<string, Function>} [getEvents] Should return an object
* like `{ viewreset: this._reset }` for [`on`](#evented-on). The event handlers in this
* object will be automatically added and removed from the map with your layer.
* @property {() => HTMLElement|string} [getLegend] Should return an element (or a string
* containing HTML) to be shown on the `LegendControl` whenever the layer is visible.
* Fire `legendchange` on the layer when the legend changes.
* @property {(map: MaplairMap) => void} [beforeAdd] Called on
* [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before
* events are initialized, without waiting until the map is in a usable state. Use for
* early initialization only.
* @lends Layer
*/
/**
* The base class of all Maplair layers, with the methods they share.
*
* Every layer should extend from `Layer` and (re-)implement the following methods:
*
* * `onAdd(map: MaplairMap): this` should contain code that creates DOM elements for
*   the layer, adds them to `map panes` where they should belong and puts listeners on
*   relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
* * `onRemove(map: MaplairMap): this` should contain all clean up code that removes the
*   layer's elements from the DOM and removes listeners previously added in `onAdd`.
*   Called on [`map.removeLayer(layer)`](#map-removelayer).
* * `getEvents(): Object` (optional) should return an object like
*   `{ viewreset: this._reset }` for [`on`](#evented-on). The event handlers in this
*   object will be automatically added and removed from the map with your layer.
* * `getAttribution(): String` (optional) should return a string containing HTML to be
*   shown on the `Attribution control` whenever the layer is visible.
* * `getLegend(): HTMLElement|String` (optional) should return an element (or a string
*   containing HTML) to be shown on the `LegendControl` whenever the layer is visible.
*   Fire `legendchange` on the layer when the legend changes.
* * `beforeAdd(map: MaplairMap): this` (optional) is called on
*   [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map,
*   before events are initialized, without waiting until the map is in a usable state.
*   Use for early initialization only.
*
* @example
* ```js
* const layer = new Marker(latlng).addTo(map);
* layer.addTo(map);
* layer.remove();
* ```
*
* @fires add {MaplairEvent} Fired after the layer is added to a map.
* @fires remove {MaplairEvent} Fired after the layer is removed from a map.
*/
var Layer = class extends Evented {
	static defaultOptions = {
		pane: "overlayPane",
		attribution: null,
		attributionOrder: 0,
		bubblingPointerEvents: true
	};
	/**
	* Adds the layer to the given map or layer group.
	* @param {MaplairMap|LayerGroup} map
	* @returns {this}
	*/
	addTo(map) {
		map.addLayer(this);
		return this;
	}
	/**
	* Removes the layer from the map it is currently active on.
	* @returns {this}
	*/
	remove() {
		return this.removeFrom(this._map || this._mapToAdd);
	}
	/**
	* Removes the layer from the given map or `LayerGroup`.
	* @param {MaplairMap|LayerGroup} obj
	* @returns {this}
	*/
	removeFrom(obj) {
		obj?.removeLayer(this);
		return this;
	}
	/**
	* Returns the `HTMLElement` representing the named pane on the map. If `name` is
	* omitted, returns the pane for this layer.
	* @param {string} [name]
	* @returns {HTMLElement}
	*/
	getPane(name) {
		return this._map.getPane(name ? this.options[name] || name : this.options.pane);
	}
	/**
	* Changes the [`interactive`](#interactivelayeroptions-interactive) option of the
	* layer, e.g. to stop a layer from emitting pointer events while it is being edited.
	* @param {boolean} interactive
	* @returns {this}
	*/
	setInteractive(interactive) {
		interactive = !!interactive;
		if (this.options.interactive !== interactive) {
			setOptions(this, { interactive });
			if (this._map) this._updateInteractive();
		}
		return this;
	}
	_updateInteractive() {}
	/**
	* Makes `targetEl` a target of pointer events of this layer.
	* @internal
	* @param {HTMLElement} targetEl
	* @returns {this}
	*/
	addInteractiveTarget(targetEl) {
		this._map._targets[stamp(targetEl)] = this;
		return this;
	}
	/**
	* Stops `targetEl` from being a target of pointer events of this layer.
	* @internal
	* @param {HTMLElement} targetEl
	* @returns {this}
	*/
	removeInteractiveTarget(targetEl) {
		delete this._map._targets[stamp(targetEl)];
		return this;
	}
	/**
	* Used by the `attribution control`, returns the [attribution option](#layeroptions-attribution).
	* @returns {string|null}
	*/
	getAttribution() {
		return this.options.attribution;
	}
	/**
	* Changes the [attribution option](#layeroptions-attribution), also in the
	* attribution control while the layer is on the map.
	* @param {string|null} attribution
	* @returns {this}
	*/
	setAttribution(attribution) {
		const control = this._map?.attributionControl;
		control?._removeLayer({ layer: this });
		setOptions(this, { attribution });
		control?._addLayer({ layer: this });
		return this;
	}
	_layerAdd(e) {
		const map = e.target;
		if (!map.hasLayer(this)) return;
		this._map = map;
		this._zoomAnimated = map._zoomAnimated;
		if (this.getEvents) {
			const events = this.getEvents();
			map.on(events, this);
			this.once("remove", () => map.off(events, this));
		}
		this.onAdd(map);
		this.fire("add");
		map.fire("layeradd", { layer: this });
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.include(mapLayerMethods);
	}
};
// src/control/ContextMenu.js
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {Point} from '../geometry/Point.js' */
/**
* Options of `ContextMenu`.
* @typedef {object} ContextMenuOptions
* @property {string} [className=''] A custom CSS class name to assign to the menu.
*/
/**
* The argument of the `callback` of a `ContextMenu` item, with the location of the
* `contextmenu` event.
* @typedef {object} ContextMenuEvent
* @property {LatLng} latlng The geographical point of the event.
* @property {Point} containerPoint Pixel coordinates of the event relative to the map
* container.
* @property {Point} layerPoint Pixel coordinates of the event relative to the map layer.
* @property {MouseEvent|PointerEvent} originalEvent The original DOM event.
* @property {Layer} [relatedTarget] The layer, for menus of layers.
*/
/**
* An item of a `ContextMenu`.
* @typedef {object} ContextMenuItem
* @property {string} text The text of the item.
* @property {(this: ContextMenu, event: ContextMenuEvent) => void} [callback] Called
* when the item is chosen.
* @property {boolean} [disabled] Whether the item is disabled.
*/
/**
* A menu opened with the `contextmenu` event (right click, or long tap on touch
* screens) on the map or on a layer. Each item calls a function with the location
* of the event. The menu is a [popover](https://developer.mozilla.org/docs/Web/API/Popover_API),
* closed by clicking outside of it or pressing Escape, and can be used with the
* keyboard (arrow keys, Enter).
*
* Inspired by the [Leaflet.contextmenu](https://github.com/aratcliffe/Leaflet.contextmenu) plugin.
*
* @example
* ```js
* new ContextMenu([
* 	{text: 'Center the map here', callback: e => map.panTo(e.latlng)},
* 	'-',
* 	{text: 'Zoom in', callback: () => map.zoomIn()}
* ]).addTo(map);
*
* new ContextMenu([
* 	{text: 'Remove', callback: e => e.relatedTarget.remove()}
* ]).addTo(marker);
* ```
*/
var ContextMenu = class ContextMenu extends Class {
	static defaultOptions = { className: "" };
	/**
	* Creates a context menu. Each item is an object with `text`, `callback` and the
	* optional `disabled`, or `'-'` for a separator. The `callback` gets an event with
	* `latlng`, `containerPoint`, `layerPoint`, `originalEvent` and `relatedTarget`
	* (the layer, for menus of layers).
	* @param {(ContextMenuItem|'-')[]} items
	* @param {ContextMenuOptions} [options]
	*/
	constructor(items, options) {
		super();
		setOptions(this, options);
		this._items = items;
		this.callInitHooks(ContextMenu);
	}
	/**
	* Opens the menu on `contextmenu` events of the map or the layer.
	* @param {MaplairMap|Layer} target
	* @returns {this}
	*/
	addTo(target) {
		this.remove();
		this._target = target;
		target.on("contextmenu", this._open, this);
		return this;
	}
	/**
	* Removes the menu from its map or layer.
	* @returns {this}
	*/
	remove() {
		this.close();
		this._target?.off("contextmenu", this._open, this);
		this._target = null;
		this._container?.remove();
		this._container = null;
		return this;
	}
	/**
	* Closes the menu.
	* @returns {this}
	*/
	close() {
		if (this._container?.matches(":popover-open")) this._container.hidePopover();
		return this;
	}
	/**
	* Returns `true` if the menu is open.
	* @returns {boolean}
	*/
	isOpen() {
		return !!this._container?.matches(":popover-open");
	}
	_open(e) {
		stop(e);
		const map = this._target instanceof Layer ? this._target._map : this._target;
		if (!map) return;
		this._map = map;
		this._event = {
			latlng: e.latlng,
			containerPoint: e.containerPoint,
			layerPoint: e.layerPoint,
			originalEvent: e.originalEvent,
			relatedTarget: this._target instanceof Layer ? this._target : void 0
		};
		const container = this._createMenu(map._container);
		if (!container.matches(":popover-open")) container.showPopover();
		this._position(e.originalEvent);
		container.querySelector("button:not([disabled])")?.focus({ preventScroll: true });
		map.once("movestart", this.close, this);
	}
	_createMenu(parent) {
		const container = this._container ??= create("div", `maplair-contextmenu ${this.options.className}`);
		if (container.parentNode !== parent) parent.appendChild(container);
		container.popover = "auto";
		container.setAttribute("role", "menu");
		container.replaceChildren();
		for (const item of this._items) {
			if (item === "-") {
				create("div", "maplair-contextmenu-separator", container).setAttribute("role", "separator");
				continue;
			}
			const button = create("button", "maplair-contextmenu-item", container);
			button.type = "button";
			button.setAttribute("role", "menuitem");
			button.textContent = item.text;
			button.disabled = !!item.disabled;
			on(button, "click", (ev) => {
				stop(ev);
				this.close();
				item.callback?.call(this, this._event);
			});
		}
		on(container, "keydown", this._onKeyDown, this);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		on(container, "contextmenu", stop);
		return container;
	}
	_position(e) {
		const container = this._container, viewport = document.documentElement, x = Math.min(e.clientX, viewport.clientWidth - container.offsetWidth), y = Math.min(e.clientY, viewport.clientHeight - container.offsetHeight);
		container.style.left = `${Math.max(0, x)}px`;
		container.style.top = `${Math.max(0, y)}px`;
	}
	_onKeyDown(e) {
		if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
		stop(e);
		const buttons = [...this._container.querySelectorAll("button:not([disabled])")], index = buttons.indexOf(document.activeElement), next = e.key === "ArrowDown" ? index + 1 : index - 1;
		buttons.at(next % buttons.length)?.focus();
	}
};
// src/control/FullscreenControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
const enterIcon = "<svg aria-hidden=\"true\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M2 2h5v2H4v3H2zm7 0h5v5h-2V4H9zM2 9h2v3h3v2H2zm10 0h2v5H9v-2h3z\"/></svg>";
const exitIcon = "<svg aria-hidden=\"true\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"currentColor\"><path d=\"M5 2h2v5H2V5h3zm4 0h2v3h3v2H9zM2 9h5v5H5v-3H2zm7 0h5v2h-3v3H9z\"/></svg>";
/**
* Options of `FullscreenControl`.
* @typedef {object} FullscreenControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string} [enterText] The HTML content of the button while the map is not in
* fullscreen, by default an expand icon.
* @property {string} [exitText] The HTML content of the button while the map is in
* fullscreen, by default a collapse icon.
* @extends ControlOptions
*/
/**
* Map options of `FullscreenControl`.
* @typedef {object} FullscreenControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [fullscreenControl=false] Whether a
* [fullscreen control](#fullscreencontrol) is added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `FullscreenControl`.
* @typedef {object} FullscreenControlMapProperties
* @lends MaplairMap
* @property {FullscreenControl} fullscreenControl The default fullscreen control (only
* available if the [`fullscreenControl` option](#map-fullscreencontrol) was `true` when
* creating the map).
*/
/**
* Methods of `MaplairMap` for the fullscreen view.
* @lends MaplairMap.prototype
* @fires MaplairMap#enterfullscreen {MaplairEvent} Fired when the map enters fullscreen.
* @fires MaplairMap#exitfullscreen {MaplairEvent} Fired when the map exits fullscreen.
* @fires MaplairMap#fullscreenchange {MaplairEvent} Fired when the map enters or exits
* fullscreen.
*/
const mapFullscreenMethods = {
	/**
	* Enters or exits the fullscreen view of the map, see `FullscreenControl`.
	* Browsers allow entering fullscreen only in response to a user interaction,
	* e.g. a click.
	* @group Methods for modifying map state
	* @returns {this}
	*/
	toggleFullscreen() {
		const container = this._container;
		if (this._fullscreen === "pseudo") this._setFullscreen(false);
		else if (this._fullscreen) document.exitFullscreen();
		else if (document.fullscreenEnabled && container.requestFullscreen) {
			on(document, "fullscreenchange", this._onFullscreenChange, this);
			container.requestFullscreen().catch(() => {
				off(document, "fullscreenchange", this._onFullscreenChange, this);
				this._setFullscreen("pseudo");
			});
		} else this._setFullscreen("pseudo");
		return this;
	},
	/**
	* Returns `true` if the map is viewed in fullscreen.
	* @group Other methods
	* @returns {boolean}
	*/
	isFullscreen() {
		return !!this._fullscreen;
	},
	_onFullscreenChange() {
		const fullscreen = document.fullscreenElement === this._container;
		if (!fullscreen) off(document, "fullscreenchange", this._onFullscreenChange, this);
		if (fullscreen !== this.isFullscreen()) this._setFullscreen(fullscreen && "native");
	},
	_onFullscreenKeyDown(e) {
		if (e.key === "Escape") this._setFullscreen(false);
	},
	_setFullscreen(mode) {
		const container = this._container;
		this._fullscreen = mode;
		container.classList.toggle("maplair-fullscreen", !!mode);
		container.classList.toggle("maplair-pseudo-fullscreen", mode === "pseudo");
		if (mode === "pseudo") on(document, "keydown", this._onFullscreenKeyDown, this);
		else off(document, "keydown", this._onFullscreenKeyDown, this);
		this.invalidateSize();
		this.fire(mode ? "enterfullscreen" : "exitfullscreen");
		this.fire("fullscreenchange");
	}
};
/** @typedef {typeof mapFullscreenMethods} MapFullscreenMethods */
/**
* A control with a button to view the map in fullscreen and to exit it again. It is
* put on the map if you set its [`fullscreenControl` option](#map-fullscreencontrol)
* to `true`. Where the browser does not support the
* [Fullscreen API](https://developer.mozilla.org/docs/Web/API/Fullscreen_API)
* (e.g. Safari on iPhone) or refuses fullscreen (e.g. in an iframe without
* `allow="fullscreen"`), the map is enlarged to the size of the window instead.
*
* @example
* ```js
* new FullscreenControl({position: 'topright'}).addTo(map);
* ```
*/
var FullscreenControl = class FullscreenControl extends Control {
	static defaultOptions = {
		position: "topleft",
		enterText: enterIcon,
		exitText: exitIcon
	};
	/**
	* Creates a fullscreen control.
	* @param {...FullscreenControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(FullscreenControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-control-fullscreen maplair-bar"), button = this._button = create("button", "maplair-control-fullscreen-button", container);
		button.type = "button";
		disableClickPropagation(button);
		on(button, "click", stop);
		on(button, "click", this._toggleFullscreen, this);
		on(button, "click", this._refocusOnMap, this);
		this._update();
		map.on("fullscreenchange", this._update, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("fullscreenchange", this._update, this);
	}
	_toggleFullscreen() {
		this._map.toggleFullscreen();
	}
	_update() {
		const fullscreen = this._map.isFullscreen(), title = fullscreen ? I18n.translate("Exit fullscreen") : I18n.translate("View fullscreen");
		this._button.innerHTML = fullscreen ? this.options.exitText : this.options.enterText;
		this._button.title = title;
		this._button.setAttribute("aria-label", title);
		this._button.setAttribute("aria-pressed", fullscreen);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ fullscreenControl: false });
		MaplairMap.include(mapFullscreenMethods);
		MaplairMap.addInitHook(function() {
			this.on("unload", function() {
				if (this._fullscreen === "native") {
					off(document, "fullscreenchange", this._onFullscreenChange, this);
					document.exitFullscreen();
				}
				this._container.classList.remove("maplair-fullscreen", "maplair-pseudo-fullscreen");
				off(document, "keydown", this._onFullscreenKeyDown, this);
				this._fullscreen = false;
			});
			if (this.options.fullscreenControl) {
				this.fullscreenControl = new FullscreenControl();
				this.addControl(this.fullscreenControl);
			}
		});
	}
};
// src/control/LayersControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {LayersControlEvent} from '../core/Events.js' */
/**
* An entry of `LayersControl`, as returned by `getLayers()`.
* @typedef {object} LayersControlEntry
* @property {Layer} layer The layer.
* @property {string} name The name of the layer, as given to the control.
* @property {boolean} overlay Whether the layer is an overlay (checkbox) or a base layer
* (radio button).
*/
/**
* The group of an entry of `LayersControl`, as returned by the option `groupBy`.
* @typedef {object} LayersControlGroup
* @property {string} group The name of the group, rendered as text.
* @property {string} label The label of the entry within the group, may contain HTML
* (like layer names).
*/
/**
* Options of `LayersControl`.
* @typedef {object} LayersControlOptions
* @property {boolean} [collapsed=true] If `true`, the control will be collapsed into an
* icon and expanded on pointer hover, touch, or keyboard activation. Ignored if `inline`
* is `true`.
* @property {boolean} [inline=false] If `true`, the control is laid out like the
* attribution control: it is always expanded (without toggle button) and all entries are
* placed next to each other, wrapping onto multiple lines if necessary.
* @property {(name: string, layer: Layer, overlay: boolean) => LayersControlGroup | undefined} [groupBy]
* A function to group the entries. For each entry, it returns the name of its group and
* its label within the group, or `undefined` for an ungrouped entry. Consecutive entries
* of the same group (base layers and overlays separately) are rendered within one
* `maplair-control-layers-group` container, starting with the group name in a
* `maplair-control-layers-group-name` element, and each entry shows only its label.
* Events like `baselayerchange` still carry the full `name`. When combined with
* `sortLayers`, the entries are sorted first and grouped afterwards.
* @property {string|HTMLElement} [toggleContent] The content of the toggle button of a
* collapsed control instead of the layers icon: HTML (e.g. an icon or a character) or an
* element. String content is rendered as HTML; do not pass untrusted input.
* @property {number} [collapseDelay=0] Collapse delay in milliseconds. If greater than 0,
* the control will remain open longer, making it easier to scroll through long layer
* lists.
* @property {string} [position='topright'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {boolean} [autoZIndex=true] If `true`, the control will assign zIndexes in
* increasing order to all of its layers so that the order is preserved when switching
* them on/off.
* @property {boolean} [hideSingleBase=false] If `true`, the base layers in the control
* will be hidden when there is only one.
* @property {boolean} [sortLayers=false] Whether to sort the layers. When `false`, layers
* will keep the order in which they were added to the control.
* @property {(layerA: Layer, layerB: Layer, nameA: string, nameB: string) => number} [sortFunction]
* A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
* that will be used for sorting the layers, when `sortLayers` is `true`. The function
* receives both the `Layer` instances and their names, as in
* `sortFunction(layerA, layerB, nameA, nameB)`. By default, it sorts layers
* alphabetically by their name.
* @extends ControlOptions
*/
/**
* The layers control gives users the ability to switch between different base layers
* and switch overlays on/off (check out the
* [detailed example](https://maplair.org/examples/layers-control/)).
*
* @example
* ```js
* const baseLayers = {
* 	"Mapbox": mapbox,
* 	"OpenStreetMap": osm
* };
*
* const overlays = {
* 	"Marker": marker,
* 	"Roads": roadsLayer
* };
*
* new LayersControl(baseLayers, overlays).addTo(map);
* ```
*
* The `baseLayers` and `overlays` parameters are object literals with layer names as keys and `Layer` objects as values:
*
* ```js
* {
*     "<someName1>": layer1,
*     "<someName2>": layer2
* }
* ```
*
* The layer names can contain HTML, which allows you to add additional styling to the items:
*
* ```js
* {"<img src='my-layer-icon' /> <span class='my-layer-item'>My Layer</span>": myLayer}
* ```
*
* Layers can be grouped using the option `groupBy`, for example layer names of the form
* `"Group (label)"`:
*
* ```js
* new LayersControl(baseLayers, overlays, {
* 	inline: true,
* 	groupBy(name) {
* 		const [, group, label] = /^([^<>()]+) \((.+)\)$/.exec(name) ?? [];
* 		return group ? {group: `${group}:`, label} : undefined;
* 	}
* }).addTo(map);
* ```
*
* @fires MaplairMap#baselayerchange {LayersControlEvent} Fired when the base layer is
* changed through the [layers control](#control-layers).
* @fires MaplairMap#overlayadd {LayersControlEvent} Fired when an overlay is selected
* through the [layers control](#control-layers).
* @fires MaplairMap#overlayremove {LayersControlEvent} Fired when an overlay is
* deselected through the [layers control](#control-layers).
*/
var LayersControl = class LayersControl extends Control {
	static defaultOptions = {
		collapsed: true,
		inline: false,
		groupBy: void 0,
		toggleContent: void 0,
		collapseDelay: 0,
		position: "topright",
		autoZIndex: true,
		hideSingleBase: false,
		sortLayers: false,
		sortFunction(layerA, layerB, nameA, nameB) {
			return nameA < nameB ? -1 : nameB < nameA ? 1 : 0;
		}
	};
	/**
	* Creates a layers control with the given layers. Base layers will be switched with
	* radio buttons, while overlays will be switched with checkboxes. Note that all base
	* layers should be passed in the base layers object, but only one should be added to
	* the map during map instantiation.
	* @param {Record<string, Layer>} [baseLayers]
	* @param {Record<string, Layer>} [overlays]
	* @param {LayersControlOptions} [options]
	*/
	constructor(baseLayers, overlays, options) {
		super(options);
		this._layerControlInputs = [];
		this._layers = [];
		this._lastZIndex = 0;
		this._handlingClick = false;
		this._preventClick = false;
		for (const [name, layer] of Object.entries(baseLayers ?? {})) this._addLayer(layer, name);
		for (const [name, layer] of Object.entries(overlays ?? {})) this._addLayer(layer, name, true);
		this.callInitHooks(LayersControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		this._initLayout();
		this._update();
		this._map = map;
		map.on("zoomend", this._checkDisabledLayers, this);
		for (const layer of this._layers) layer.layer.on("add remove", this._onLayerChange, this);
		if (!this._isCollapsible()) map.on("resize", this._expandIfNotCollapsed, this);
		return this._container;
	}
	/**
	* Adds the control to the given map.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	addTo(map) {
		super.addTo(map);
		return this._expandIfNotCollapsed();
	}
	/** @internal */
	onRemove() {
		this._map.off("zoomend", this._checkDisabledLayers, this);
		for (const layer of this._layers) layer.layer.off("add remove", this._onLayerChange, this);
		this._map.off("resize", this._expandIfNotCollapsed, this);
	}
	/**
	* Adds a base layer (radio button entry) with the given name to the control.
	* @param {Layer} layer
	* @param {string} name
	* @returns {this}
	*/
	addBaseLayer(layer, name) {
		this._addLayer(layer, name);
		return this._map ? this._update() : this;
	}
	/**
	* Adds an overlay (checkbox entry) with the given name to the control.
	* @param {Layer} layer
	* @param {string} name
	* @returns {this}
	*/
	addOverlay(layer, name) {
		this._addLayer(layer, name, true);
		return this._map ? this._update() : this;
	}
	/**
	* Remove the given layer from the control.
	* @param {Layer} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		layer.off("add remove", this._onLayerChange, this);
		this._layers = this._layers.filter((o) => o.layer !== layer);
		return this._map ? this._update() : this;
	}
	/**
	* Returns the entries of the control in the order they are displayed.
	* @returns {LayersControlEntry[]}
	*/
	getLayers() {
		return this._layers.map(({ layer, name, overlay }) => ({
			layer,
			name,
			overlay
		}));
	}
	/**
	* Selects the given layer of the control like a click on its entry: a base layer
	* replaces the current base layer, an overlay is added to the map. The events
	* `baselayerchange` and `overlayadd` are fired as for a click, but without
	* `originalEvent`. Has no effect if the control is not on a map or does not contain
	* the layer.
	* @param {Layer} layer
	* @returns {this}
	*/
	selectLayer(layer) {
		const input = this._layerControlInputs.find((input) => input._layer === layer);
		if (input && !input.checked) {
			input.checked = true;
			this._onInputClick();
		}
		return this;
	}
	/**
	* Expand the control container if collapsed.
	* @returns {this}
	*/
	expand() {
		clearTimeout(this._collapseDelayTimeout);
		this._container.classList.add("maplair-control-layers-expanded");
		this._section.style.height = "";
		const acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
		if (acceptableHeight < this._section.clientHeight) {
			this._section.classList.add("maplair-control-layers-scrollbar");
			this._section.style.height = `${acceptableHeight}px`;
		} else this._section.classList.remove("maplair-control-layers-scrollbar");
		this._checkDisabledLayers();
		return this;
	}
	/**
	* Collapse the control container if expanded.
	* @param {Event} [ev] The event causing the collapse, if any (collapsing is skipped
	* for `pointerleave` and `pointerout` of touch).
	* @returns {this}
	*/
	collapse(ev) {
		if (this.options.inline) return this;
		if (!ev || !((ev.type === "pointerleave" || ev.type === "pointerout") && ev.pointerType === "touch")) {
			if (this.options.collapseDelay > 0) {
				this._collapseDelayTimeout = setTimeout(() => {
					this._container.classList.remove("maplair-control-layers-expanded");
				}, this.options.collapseDelay);
				return this;
			}
			this._container.classList.remove("maplair-control-layers-expanded");
		}
		return this;
	}
	_initLayout() {
		const className = "maplair-control-layers", container = this._container = create("div", className), collapsed = this._isCollapsible();
		if (this.options.inline) container.classList.add(`${className}-inline`);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		const section = this._section = create("fieldset", `${className}-list`);
		section.setAttribute("aria-label", I18n.translate("Layers"));
		if (collapsed) {
			this._map.on("click", this.collapse, this);
			on(container, {
				pointerenter: this._expandSafely,
				pointerleave: this.collapse
			}, this);
		}
		if (!this.options.inline) {
			const link = this._layersLink = create("button", `${className}-toggle`, container);
			link.type = "button";
			link.title = I18n.translate("Layers");
			link.setAttribute("aria-label", I18n.translate("Layers"));
			const { toggleContent } = this.options;
			if (typeof toggleContent === "string") link.innerHTML = toggleContent;
			else if (toggleContent) link.replaceChildren(toggleContent);
			on(link, {
				keydown(e) {
					if (e.code === "Enter") this._expandSafely();
				},
				click(e) {
					e.preventDefault();
					this._expandSafely();
				}
			}, this);
		}
		if (!collapsed) this.expand();
		this._baseLayersList = create("div", `${className}-base`, section);
		this._separator = create("div", `${className}-separator`, section);
		this._overlaysList = create("div", `${className}-overlays`, section);
		container.appendChild(section);
	}
	_addLayer(layer, name, overlay) {
		if (this._map) layer.on("add remove", this._onLayerChange, this);
		this._layers.push({
			layer,
			name,
			overlay: !!overlay
		});
		if (this.options.sortLayers) this._layers.sort(((a, b) => this.options.sortFunction(a.layer, b.layer, a.name, b.name)));
		if (this.options.autoZIndex && layer.setZIndex) {
			this._lastZIndex++;
			layer.setZIndex(this._lastZIndex);
		}
		this._expandIfNotCollapsed();
	}
	_update() {
		if (!this._container) return this;
		this._baseLayersList.replaceChildren();
		this._overlaysList.replaceChildren();
		this._layerControlInputs = [];
		this._groupCount = 0;
		let baseLayersPresent, overlaysPresent, baseLayersCount = 0;
		for (const obj of this._layers) {
			this._addItem(obj);
			overlaysPresent ||= obj.overlay;
			baseLayersPresent ||= !obj.overlay;
			baseLayersCount += !obj.overlay ? 1 : 0;
		}
		if (this.options.hideSingleBase) {
			baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
			this._baseLayersList.style.display = baseLayersPresent ? "" : "none";
		}
		this._separator.style.display = overlaysPresent && baseLayersPresent ? "" : "none";
		return this;
	}
	_onLayerChange(e) {
		if (!this._handlingClick) this._update();
		const obj = this._layers.find((o) => o.layer === e.target);
		const type = obj.overlay ? e.type === "add" ? "overlayadd" : "overlayremove" : e.type === "add" ? "baselayerchange" : null;
		if (type) this._map.fire(type, this._clickEvent ? {
			...obj,
			originalEvent: this._clickEvent
		} : obj);
	}
	_addItem(obj) {
		const label = document.createElement("label"), checked = this._map.hasLayer(obj.layer);
		const input = document.createElement("input");
		input.type = obj.overlay ? "checkbox" : "radio";
		input.className = "maplair-control-layers-selector";
		input.defaultChecked = checked;
		if (!obj.overlay) input.name = `maplair-base-layers_${stamp(this)}`;
		this._layerControlInputs.push(input);
		input._layer = obj.layer;
		on(input, "click", this._onInputClick, this);
		const group = this.options.groupBy?.(obj.name, obj.layer, obj.overlay);
		const name = document.createElement("span");
		name.innerHTML = ` ${group ? group.label : obj.name}`;
		const holder = document.createElement("span");
		label.appendChild(holder);
		holder.appendChild(input);
		holder.appendChild(name);
		const list = obj.overlay ? this._overlaysList : this._baseLayersList;
		(group ? this._getGroupContainer(list, group.group) : list).appendChild(label);
		this._checkDisabledLayers();
		return label;
	}
	/**
	* Returns the container of the given group if it is the last element in `list`
	* (continuing the group), otherwise appends a new group container to `list`.
	* @param {HTMLElement} list
	* @param {string} group
	* @returns {HTMLElement}
	*/
	_getGroupContainer(list, group) {
		const last = list.lastElementChild;
		if (last?._maplairGroup === group) return last;
		const className = "maplair-control-layers-group", container = create("div", className, list), name = create("span", `${className}-name`, container);
		name.id = `${className}_${stamp(this)}_${++this._groupCount}`;
		name.textContent = group;
		container.setAttribute("role", "group");
		container.setAttribute("aria-labelledby", name.id);
		container._maplairGroup = group;
		return container;
	}
	_onInputClick(e) {
		if (this._preventClick) return;
		const checked = /* @__PURE__ */ new Map();
		for (const input of this._layerControlInputs) {
			const layer = input._layer;
			checked.set(layer, checked.get(layer) || input.checked);
		}
		const addedLayers = [], removedLayers = [];
		for (const [layer, on] of checked) if (on !== this._map.hasLayer(layer)) (on ? addedLayers : removedLayers).push(layer);
		this._handlingClick = true;
		this._clickEvent = e;
		for (const layer of removedLayers) this._map.removeLayer(layer);
		for (const layer of addedLayers) this._map.addLayer(layer);
		this._handlingClick = false;
		this._clickEvent = void 0;
		for (const [layer, on] of checked) if (on !== this._map.hasLayer(layer)) {
			this._update();
			break;
		}
		this._refocusOnMap(e);
	}
	_checkDisabledLayers() {
		const inputs = this._layerControlInputs, zoom = this._map.getZoom();
		for (const input of inputs) {
			const layer = input._layer;
			input.disabled = layer.options.minZoom !== void 0 && zoom < layer.options.minZoom || layer.options.maxZoom !== void 0 && zoom > layer.options.maxZoom;
		}
	}
	_isCollapsible() {
		return this.options.collapsed && !this.options.inline;
	}
	_expandIfNotCollapsed() {
		if (this._map && !this._isCollapsible()) this.expand();
		return this;
	}
	_expandSafely() {
		const section = this._section;
		this._preventClick = true;
		on(section, "click", preventDefault);
		this.expand();
		setTimeout(() => {
			off(section, "click", preventDefault);
			this._preventClick = false;
		});
	}
};
// src/geometry/Bounds.js
/** @import {PointExpression} from './Point.js' */
/**
* A rectangular area in pixel coordinates: a `Bounds`, or an array of points (usually
* two diagonally opposite corners), e.g. `[[10, 10], [40, 60]]`. Accepted by all
* Maplair methods which accept `Bounds` objects (unless noted otherwise).
* @typedef {Bounds|PointExpression[]} BoundsExpression
*/
/**
* Represents a rectangular area in pixel coordinates.
*
* @example
* ```js
* const p1 = new Point(10, 10),
* p2 = new Point(40, 60),
* bounds = new Bounds(p1, p2);
* ```
*
* All Maplair methods that accept `Bounds` objects also accept them in a simple Array
* form (unless noted otherwise), so the bounds example above can be passed like this:
*
* ```js
* otherBounds.intersects([[10, 10], [40, 60]]);
* ```
*
* Note that `Bounds` does not inherit from Maplair's `Class` object,
* which means new classes can't inherit from it, and new methods
* can't be added to it with the `include` function.
*/
var Bounds = class Bounds {
	/**
	* Creates a Bounds object from two corners coordinate pairs. Alternatively, creates a
	* Bounds object from the given array of points, or a copy of the given Bounds object.
	* @param {PointExpression|BoundsExpression} [a] The first corner, the points or the
	* bounds to copy.
	* @param {PointExpression} [b] The opposite corner.
	*/
	constructor(a, b) {
		if (!a) return;
		if (a instanceof Bounds) {
			if (a.isValid()) {
				/**
				* The top left corner of the rectangle.
				* @type {Point}
				*/
				this.min = new Point(a.min);
				/**
				* The bottom right corner of the rectangle.
				* @type {Point}
				*/
				this.max = new Point(a.max);
			}
			return;
		}
		const points = b ? [a, b] : a;
		for (const point of points) this.extend(point);
	}
	/**
	* Returns the given `Bounds` object as it is, or else a new `Bounds` object created
	* from the given arguments (the same as of the constructor) — unlike the
	* constructor, which always creates a new object.
	* @param {PointExpression|BoundsExpression} [a] The first corner, the points or the
	* bounds.
	* @param {PointExpression} [b] The opposite corner.
	* @returns {Bounds}
	*/
	static from(a, b) {
		return a instanceof Bounds ? a : new Bounds(a, b);
	}
	/**
	* Extends the bounds to contain the given point or bounds.
	* @param {PointExpression|BoundsExpression} obj
	* @returns {this}
	*/
	extend(obj) {
		let min2, max2;
		if (!obj) return this;
		if (obj instanceof Point || typeof obj[0] === "number" || "x" in obj) min2 = max2 = Point.from(obj);
		else {
			({min: min2, max: max2} = Bounds.from(obj));
			if (!min2) return this;
		}
		if (!this.min) {
			this.min = new Point(min2);
			this.max = new Point(max2);
		} else {
			this.min.x = Math.min(min2.x, this.min.x);
			this.max.x = Math.max(max2.x, this.max.x);
			this.min.y = Math.min(min2.y, this.min.y);
			this.max.y = Math.max(max2.y, this.max.y);
		}
		return this;
	}
	/**
	* Returns the center point of the bounds.
	* @param {boolean} [round]
	* @returns {Point}
	*/
	getCenter(round) {
		return new Point((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, round);
	}
	/**
	* Returns the bottom-left point of the bounds.
	* @returns {Point}
	*/
	getBottomLeft() {
		return new Point(this.min.x, this.max.y);
	}
	/**
	* Returns the top-right point of the bounds.
	* @returns {Point}
	*/
	getTopRight() {
		return new Point(this.max.x, this.min.y);
	}
	/**
	* Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
	* @returns {Point}
	*/
	getTopLeft() {
		return this.min;
	}
	/**
	* Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
	* @returns {Point}
	*/
	getBottomRight() {
		return this.max;
	}
	/**
	* Returns the size of the given bounds.
	* @returns {Point}
	*/
	getSize() {
		return this.max.subtract(this.min);
	}
	/**
	* Returns `true` if the rectangle contains the given bounds or point.
	* @param {BoundsExpression|PointExpression} obj
	* @returns {boolean}
	*/
	contains(obj) {
		let min, max;
		if (typeof obj[0] === "number" || obj instanceof Point) obj = Point.from(obj);
		else obj = Bounds.from(obj);
		if (obj instanceof Bounds) {
			min = obj.min;
			max = obj.max;
		} else min = max = obj;
		return min.x >= this.min.x && max.x <= this.max.x && min.y >= this.min.y && max.y <= this.max.y;
	}
	/**
	* Returns `true` if the rectangle intersects the given bounds. Two bounds
	* intersect if they have at least one point in common.
	* @param {BoundsExpression} bounds
	* @returns {boolean}
	*/
	intersects(bounds) {
		bounds = Bounds.from(bounds);
		const min = this.min, max = this.max, min2 = bounds.min, max2 = bounds.max, xIntersects = max2.x >= min.x && min2.x <= max.x, yIntersects = max2.y >= min.y && min2.y <= max.y;
		return xIntersects && yIntersects;
	}
	/**
	* Returns `true` if the rectangle overlaps the given bounds. Two bounds
	* overlap if their intersection is an area.
	* @param {BoundsExpression} bounds
	* @returns {boolean}
	*/
	overlaps(bounds) {
		bounds = Bounds.from(bounds);
		const min = this.min, max = this.max, min2 = bounds.min, max2 = bounds.max, xOverlaps = max2.x > min.x && min2.x < max.x, yOverlaps = max2.y > min.y && min2.y < max.y;
		return xOverlaps && yOverlaps;
	}
	/**
	* Returns `true` if the bounds are properly initialized.
	* @returns {boolean}
	*/
	isValid() {
		return !!(this.min && this.max);
	}
	/**
	* Returns bounds created by extending or retracting the current bounds by a given
	* ratio in each direction. For example, a ratio of 0.5 extends the bounds by 50% in
	* each direction. Negative values will retract the bounds.
	* @param {number} bufferRatio
	* @returns {Bounds}
	*/
	pad(bufferRatio) {
		const min = this.min, max = this.max, heightBuffer = Math.abs(min.x - max.x) * bufferRatio, widthBuffer = Math.abs(min.y - max.y) * bufferRatio;
		return new Bounds(new Point(min.x - heightBuffer, min.y - widthBuffer), new Point(max.x + heightBuffer, max.y + widthBuffer));
	}
	/**
	* Returns `true` if the rectangle is equivalent to the given bounds.
	* @param {BoundsExpression} bounds
	* @returns {boolean}
	*/
	equals(bounds) {
		if (!bounds) return false;
		bounds = Bounds.from(bounds);
		return this.min.equals(bounds.getTopLeft()) && this.max.equals(bounds.getBottomRight());
	}
};
// src/layer/BlanketOverlay.js
/** @import {LayerOptions} from './Layer.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener} from '../core/Events.js' */
/**
* Options of `BlanketOverlay`.
* @typedef {object} BlanketOverlayOptions
* @property {number} [padding=0.1] How much to extend the clip area around the map
* view (relative to its size) e.g. 0.1 would be 10% of map view in each direction.
* @property {boolean} [continuous=false] When `false`, the blanket will update its
* position only when the map state settles (*after* a pan/zoom animation). When
* `true`, it will update when the map state changes (*during* pan/zoom animations).
* @extends LayerOptions
*/
/**
* Represents an HTML element that covers ("blankets") the entire surface
* of the map.
*
* Do not use this class directly. It's meant for `Renderer`, and for plugins
* that rely on one single HTML element.
*
* Subclasses must define the following methods:
*
* * `_initContainer()` must initialize the HTML element to use as blanket, and store
*   it as `this._container`. The base implementation creates a blank `<div>`.
* * `_destroyContainer()` must destroy the HTML element in `this._container` and free
*   any other resources. The base implementation destroys the element and removes
*   any event handlers attached to it.
* * `_resizeContainer(): Point`: the base implementation resizes the container
*   (based on the map's size and taking into account the padding), returning the new
*   size in CSS pixels. Subclass implementations shall reset container parameters and
*   data structures as needed.
* * `_onZoomEnd(ev?: PointerEvent)` (optional) runs on the map's `zoomend` event.
* * `_onViewReset(ev?: PointerEvent)` (optional) runs on the map's `viewreset` event.
* * `_onSettled()` runs whenever the map state settles after changing (at the end of
*   pan/zoom animations, etc). This should trigger the bulk of any rendering logic.
*   If the `continuous` option is set to `true`, then this also runs on any map
*   state change (including *during* pan/zoom animations).
*/
var BlanketOverlay = class BlanketOverlay extends Layer {
	static defaultOptions = {
		padding: .1,
		continuous: false
	};
	/**
	* @param {BlanketOverlayOptions} [options]
	*/
	constructor(options) {
		super();
		setOptions(this, options);
		this.callInitHooks(BlanketOverlay);
	}
	/**
	* Adds the blanket to the map.
	* @type {(map: MaplairMap) => void}
	*/
	onAdd() {
		if (!this._container) {
			this._initContainer();
			this._container.classList.add("maplair-zoom-animated");
		}
		this.getPane().appendChild(this._container);
		this._resizeContainer();
		this._onMoveEnd();
	}
	/**
	* Removes the blanket from the map.
	* @type {(map: MaplairMap) => void}
	*/
	onRemove() {
		this._destroyContainer();
	}
	/**
	* Returns the map events the blanket listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = {
			viewreset: this._reset,
			zoom: this._onZoom,
			moveend: this._onMoveEnd,
			resize: this._resizeContainer,
			zoomend: this._onZoomEnd,
			zoomanim: this._onAnimZoom
		};
		if (this.options.continuous) events.move = this._onMoveEnd;
		return events;
	}
	_onAnimZoom(ev) {
		this._updateTransform(ev.center, ev.zoom);
	}
	_onZoom() {
		this._updateTransform(this._map.getCenter(), this._map.getZoom());
	}
	_updateTransform(center, zoom) {
		const scale = this._map.getZoomScale(zoom, this._zoom), viewHalf = this._map.getSize().multiplyBy(.5 + this.options.padding), currentCenterPoint = this._map.project(this._center, zoom), topLeftOffset = viewHalf.multiplyBy(-scale)._add(currentCenterPoint)._subtract(this._map._getNewPixelOrigin(center, zoom))._round();
		setTransform(this._container, topLeftOffset, scale);
	}
	_onMoveEnd(ev) {
		const p = this.options.padding, size = this._map.getSize(), min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();
		this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
		this._center = this._map.getCenter();
		this._zoom = this._map.getZoom();
		this._updateTransform(this._center, this._zoom);
		this._onSettled(ev);
	}
	_reset() {
		this._onSettled();
		this._updateTransform(this._center, this._zoom);
		this._onViewReset();
	}
	_initContainer() {
		this._container = create("div");
	}
	_destroyContainer() {
		off(this._container);
		this._container.remove();
		delete this._container;
	}
	_resizeContainer() {
		const p = this.options.padding, size = this._map.getSize().multiplyBy(1 + p * 2).round();
		this._container.style.width = `${size.x}px`;
		this._container.style.height = `${size.y}px`;
		return size;
	}
	_onZoomEnd() {}
	_onViewReset() {}
	_onSettled() {}
};
// src/layer/vector/Renderer.js
/** @import {BlanketOverlayOptions} from '../BlanketOverlay.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/**
* Options of `Renderer`, `SVG` and `Canvas`. The `continuous` option inherited from
* `BlanketOverlay` cannot be set to `true`.
* @typedef {object} RendererOptions
* @extends BlanketOverlayOptions
*/
/**
* Base class for vector renderer implementations (`SVG`, `Canvas`). Handles the
* DOM container of the renderer, its bounds, and its zoom animation.
*
* A `Renderer` works as an implicit layer group for all `Path`s - the renderer
* itself can be added or removed to the map. All paths use a renderer, which can
* be implicit (the map will decide the type of renderer and use it automatically)
* or explicit (using the [`renderer`](#pathoptions-renderer) option of the path).
*
* Do not use this class directly, use `SVG` and `Canvas` instead.
*
* The `continuous` option inherited from `BlanketOverlay` cannot be set to `true`
* (otherwise, renderers get out of place during a pinch-zoom operation).
*
* @fires update {MaplairEvent} Fired when the renderer updates its bounds, center and
* zoom, for example when its map has moved.
*/
var Renderer = class Renderer extends BlanketOverlay {
	/**
	* @param {RendererOptions} [options]
	*/
	constructor(options) {
		super({
			...options,
			continuous: false
		});
		stamp(this);
		this._layers ??= {};
		this.callInitHooks(Renderer);
	}
	/**
	* Adds the container of the renderer to the map and starts updating the paths.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		super.onAdd(map);
		this.on("update", this._updatePaths, this);
	}
	/**
	* Removes the container of the renderer from the map.
	*/
	onRemove() {
		super.onRemove();
		this.off("update", this._updatePaths, this);
	}
	_onZoomEnd() {
		for (const layer of Object.values(this._layers)) layer._project();
	}
	_updatePaths() {
		for (const layer of Object.values(this._layers)) layer._update();
	}
	_onViewReset() {
		for (const layer of Object.values(this._layers)) layer._reset();
	}
	_onSettled() {
		this._update();
	}
	_update() {}
};
// src/layer/vector/SVG.js
/** @import {Point} from '../../geometry/Point.js' */
/** @import {RendererOptions} from './Renderer.js' */
/**
* Allows vector layers to be displayed with [SVG](https://developer.mozilla.org/docs/Web/SVG).
* Inherits `Renderer`.
*
* @example
* Use SVG by default for all paths in the map:
*
* ```js
* const map = new MaplairMap('map', {
* 	renderer: new SVG()
* });
* ```
*
* Use a SVG renderer with extra padding for specific vector geometries:
*
* ```js
* const map = new MaplairMap('map');
* const myRenderer = new SVG({ padding: 0.5 });
* const line = new Polyline( coordinates, { renderer: myRenderer } );
* const circle = new Circle( center, { renderer: myRenderer, radius: 100 } );
* ```
*/
var SVG = class SVG extends Renderer {
	/**
	* Creates a SVG renderer with the given options.
	* @overload
	* @param {RendererOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(SVG);
	}
	_initContainer() {
		this._container = SVG.create("svg");
		this._container.setAttribute("pointer-events", "none");
		this._rootGroup = SVG.create("g");
		this._container.appendChild(this._rootGroup);
	}
	_destroyContainer() {
		super._destroyContainer();
		delete this._rootGroup;
		delete this._svgSize;
	}
	_resizeContainer() {
		const size = super._resizeContainer();
		if (!this._svgSize || !this._svgSize.equals(size)) {
			this._svgSize = size;
			this._container.setAttribute("width", `${size.x}`);
			this._container.setAttribute("height", `${size.y}`);
		}
		const b = this._bounds;
		if (b) this._container.setAttribute("viewBox", [
			b.min.x,
			b.min.y,
			size.x,
			size.y
		].join(" "));
	}
	_update() {
		if (this._map._animatingZoom && this._bounds) return;
		const b = this._bounds, size = b.getSize();
		this._container.setAttribute("viewBox", [
			b.min.x,
			b.min.y,
			size.x,
			size.y
		].join(" "));
		this.fire("update");
	}
	_initPath(layer) {
		const path = layer._path = SVG.create("path");
		if (layer.options.className) path.classList.add(...splitWords(layer.options.className));
		if (layer.options.interactive) path.classList.add("maplair-interactive");
		this._updateStyle(layer);
		this._layers[stamp(layer)] = layer;
	}
	_updateInteractive(layer) {
		layer._path.classList.toggle("maplair-interactive", !!layer.options.interactive);
	}
	_addPath(layer) {
		if (!this._rootGroup) this._initContainer();
		this._rootGroup.appendChild(layer._path);
		layer.addInteractiveTarget(layer._path);
	}
	_removePath(layer) {
		layer._path.remove();
		layer.removeInteractiveTarget(layer._path);
		delete this._layers[stamp(layer)];
	}
	_updatePath(layer) {
		layer._project();
		layer._update();
	}
	_updateStyle(layer) {
		const path = layer._path, options = layer.options;
		if (!path) return;
		if (options.stroke) {
			path.setAttribute("stroke", options.color);
			path.setAttribute("stroke-opacity", `${options.opacity}`);
			path.setAttribute("stroke-width", `${options.weight}`);
			path.setAttribute("stroke-linecap", options.lineCap);
			path.setAttribute("stroke-linejoin", options.lineJoin);
			if (options.dashArray) path.setAttribute("stroke-dasharray", options.dashArray);
			else path.removeAttribute("stroke-dasharray");
			if (options.dashOffset) path.setAttribute("stroke-dashoffset", options.dashOffset);
			else path.removeAttribute("stroke-dashoffset");
		} else path.setAttribute("stroke", "none");
		if (options.fill) {
			path.setAttribute("fill", options.fillColor || options.color);
			path.setAttribute("fill-opacity", `${options.fillOpacity}`);
			path.setAttribute("fill-rule", options.fillRule || "evenodd");
		} else path.setAttribute("fill", "none");
	}
	_updatePoly(layer, closed) {
		this._setPath(layer, SVG.pointsToPath(layer._parts, closed));
	}
	_updateCircle(layer) {
		const p = layer._point, r = Math.max(Math.round(layer._pxRadius), 1), arc = `a${r},${Math.max(Math.round(layer._pxRadiusY), 1) || r} 0 1,0 `;
		const d = layer._empty() ? "M0 0" : `M${num(p.x - r)},${num(p.y)}${arc}${r * 2},0 ${arc}${-r * 2},0 `;
		this._setPath(layer, d);
	}
	_setPath(layer, path) {
		layer._path.setAttribute("d", path);
	}
	_bringToFront(layer) {
		toFront(layer._path);
	}
	_bringToBack(layer) {
		toBack(layer._path);
	}
	/**
	* Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
	* corresponding to the class name passed. For example, using 'line' will return
	* an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).
	* @param {string} name
	* @returns {SVGElement}
	*/
	static create(name) {
		return document.createElementNS("http://www.w3.org/2000/svg", name);
	}
	/**
	* Generates a SVG path string for multiple rings, with each ring turning
	* into "M..L..L.." instructions.
	* @param {Point[][]} rings
	* @param {boolean} [closed]
	* @returns {string}
	*/
	static pointsToPath(rings, closed) {
		return rings.flatMap((points) => [...points.map((p, j) => `${(j ? "L" : "M") + num(p.x)} ${num(p.y)}`), closed ? "z" : ""]).join("") || "M0 0";
	}
};
function num(v) {
	const n = Math.round(v * 10), a = n < 0 ? -n : n, i = Math.floor(a / 10), d = a - i * 10;
	return (n < 0 ? "-" : "") + (d ? `${i}.${d}` : i);
}
// src/layer/vector/Path.js
/** @import {InteractiveLayerOptions} from '../Layer.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {Renderer} from './Renderer.js' */
/**
* Options of `Path`, shared by all vector layers.
* @typedef {object} PathOptions
* @property {boolean} [stroke=true] Whether to draw stroke along the path. Set it to
* `false` to disable borders on polygons or circles.
* @property {string} [color='#3388ff'] Stroke color.
* @property {number} [weight=3] Stroke width in pixels.
* @property {number} [opacity=1] Stroke opacity.
* @property {string} [lineCap='round'] A string that defines
* [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap)
* of the stroke.
* @property {string} [lineJoin='round'] A string that defines
* [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin)
* of the stroke.
* @property {string|null} [dashArray=null] A string that defines the stroke
* [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray).
* @property {string|null} [dashOffset=null] A string that defines the
* [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset).
* @property {boolean} [fill=false] Whether to fill the path with color. Set it to
* `false` to disable filling on polygons or circles. The default depends on the
* class: `true` for polygons and circles.
* @property {string|null} [fillColor=null] Fill color. Defaults to the value of the
* [`color`](#pathoptions-color) option.
* @property {number} [fillOpacity=0.2] Fill opacity.
* @property {string} [fillRule='evenodd'] A string that defines
* [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule)
* is determined.
* @property {string} [className] Custom class name set on an element. Only for SVG renderer.
* Applied when the element is created; [`setStyle`](#path-setstyle) does not update it
* afterwards.
* @property {Renderer} [renderer] Use this specific instance of `Renderer` for this
* path. If not set, the path uses the map's [renderer](#maplairmapoptions-renderer),
* which is `SVG` by default. If set, it overrides the `pane` option.
* @extends InteractiveLayerOptions
*/
/**
* An abstract class that contains options and constants shared between vector
* overlays (Polygon, Polyline, Circle). Do not use it directly. Extends `Layer`.
*/
var Path = class extends Layer {
	static defaultOptions = {
		stroke: true,
		color: "#3388ff",
		weight: 3,
		opacity: 1,
		lineCap: "round",
		lineJoin: "round",
		dashArray: null,
		dashOffset: null,
		fill: false,
		fillColor: null,
		fillOpacity: .2,
		fillRule: "evenodd",
		interactive: true,
		bubblingPointerEvents: true
	};
	/**
	* Gets the renderer of the path from the map, before it is added.
	* @param {MaplairMap} map
	*/
	beforeAdd(map) {
		this._renderer = map.getRenderer(this);
	}
	/**
	* Adds the path to its renderer.
	*/
	onAdd() {
		this._renderer._initPath(this);
		this._reset();
		this._renderer._addPath(this);
	}
	/**
	* Removes the path from its renderer.
	*/
	onRemove() {
		this._renderer._removePath(this);
	}
	/**
	* Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
	* @returns {this}
	*/
	redraw() {
		if (this._map) this._renderer._updatePath(this);
		return this;
	}
	_updateInteractive() {
		this._renderer._updateInteractive(this);
	}
	/**
	* Changes the appearance of a Path based on the options in the `PathOptions` object.
	* Note that [`className`](#pathoptions-classname) is an exception: it is applied only
	* when the path element is created, so passing it here updates the option but leaves
	* the element's class unchanged.
	* @param {PathOptions} style
	* @returns {this}
	*/
	setStyle(style) {
		setOptions(this, style);
		if (this._renderer) {
			this._renderer._updateStyle(this);
			if (this.options.stroke && style && Object.hasOwn(style, "weight")) this._updateBounds();
		}
		return this;
	}
	/**
	* Brings the layer to the top of all path layers.
	* @returns {this}
	*/
	bringToFront() {
		this._renderer?._bringToFront(this);
		return this;
	}
	/**
	* Brings the layer to the bottom of all path layers.
	* @returns {this}
	*/
	bringToBack() {
		this._renderer?._bringToBack(this);
		return this;
	}
	/**
	* Returns the SVG `path` element of the layer, if it is rendered by the `SVG` renderer.
	* @returns {SVGPathElement|undefined}
	*/
	getElement() {
		return this._path;
	}
	_createRenderer(options) {
		return new SVG(options);
	}
	_reset() {
		this._project();
		this._update();
	}
	_clickTolerance() {
		return (this.options.stroke ? this.options.weight / 2 : 0) + (this._renderer.options.tolerance || 0);
	}
};
// src/geo/LatLngBounds.js
/** @import {LatLngExpression} from './LatLng.js' */
/**
* A geographical area: a `LatLngBounds`, or an array of geographical points (usually
* two diagonally opposite corners), e.g. `[[40.712, -74.227], [40.774, -74.125]]`.
* Accepted by all Maplair methods which accept `LatLngBounds` objects (unless noted
* otherwise).
* @typedef {LatLngBounds|LatLngExpression[]} LatLngBoundsExpression
*/
/**
* Represents a rectangular geographical area on a map.
*
* @example
* ```js
* const corner1 = new LatLng(40.712, -74.227),
* corner2 = new LatLng(40.774, -74.125),
* bounds = new LatLngBounds(corner1, corner2);
* ```
*
* All Maplair methods that accept LatLngBounds objects also accept them in a simple
* Array form (unless noted otherwise), so the bounds example above can be passed like
* this:
*
* ```js
* map.fitBounds([
* 	[40.712, -74.227],
* 	[40.774, -74.125]
* ]);
* ```
*
* Caution: if the area crosses the antimeridian (often confused with the International
* Date Line), you must specify corners _outside_ the [-180, 180] degrees longitude range.
*
* Note that `LatLngBounds` does not inherit from Maplair's `Class` object,
* which means new classes can't inherit from it, and new methods
* can't be added to it with the `include` function.
*/
var LatLngBounds = class LatLngBounds {
	/**
	* Creates a `LatLngBounds` object by defining two diagonally opposite corners of the
	* rectangle. Alternatively, creates a `LatLngBounds` object defined by the
	* geographical points it contains (very useful for zooming the map to fit a
	* particular set of locations with [`fitBounds`](#map-fitbounds)), or a copy of the
	* given `LatLngBounds` object.
	* @param {LatLngExpression|LatLngBoundsExpression} [corner1] The first corner, the
	* points or the bounds to copy.
	* @param {LatLngExpression} [corner2] The opposite corner.
	*/
	constructor(corner1, corner2) {
		if (!corner1) return;
		if (corner1 instanceof LatLngBounds) {
			if (corner1.isValid()) {
				this._southWest = new LatLng(corner1._southWest);
				this._northEast = new LatLng(corner1._northEast);
			}
			return;
		}
		const latlngs = corner2 ? [corner1, corner2] : corner1;
		for (const latlng of latlngs) this.extend(latlng);
	}
	/**
	* Returns the given `LatLngBounds` object as it is, or else a new `LatLngBounds`
	* object created from the given arguments (the same as of the constructor) — unlike
	* the constructor, which always creates a new object.
	* @param {LatLngExpression|LatLngBoundsExpression} [corner1] The first corner, the
	* points or the bounds.
	* @param {LatLngExpression} [corner2] The opposite corner.
	* @returns {LatLngBounds}
	*/
	static from(corner1, corner2) {
		return corner1 instanceof LatLngBounds ? corner1 : new LatLngBounds(corner1, corner2);
	}
	/**
	* Extend the bounds to contain the given point or bounds.
	* @param {LatLngExpression|LatLngBoundsExpression} obj
	* @returns {this}
	*/
	extend(obj) {
		const sw = this._southWest, ne = this._northEast;
		let sw2, ne2;
		if (obj instanceof LatLng) sw2 = ne2 = obj;
		else if (obj instanceof LatLngBounds) {
			({_southWest: sw2, _northEast: ne2} = obj);
			if (!sw2) return this;
		} else if (!obj) return this;
		else if (LatLng.validate(obj)) sw2 = ne2 = LatLng.from(obj);
		else return this.extend(LatLngBounds.from(obj));
		if (!sw) {
			this._southWest = new LatLng(sw2.lat, sw2.lng);
			this._northEast = new LatLng(ne2.lat, ne2.lng);
		} else {
			sw.lat = Math.min(sw2.lat, sw.lat);
			sw.lng = Math.min(sw2.lng, sw.lng);
			ne.lat = Math.max(ne2.lat, ne.lat);
			ne.lng = Math.max(ne2.lng, ne.lng);
		}
		return this;
	}
	/**
	* Returns bounds created by extending or retracting the current bounds by a given
	* ratio in each direction. For example, a ratio of 0.5 extends the bounds by 50% in
	* each direction. Negative values will retract the bounds.
	* @param {number} bufferRatio
	* @returns {LatLngBounds}
	*/
	pad(bufferRatio) {
		const sw = this._southWest, ne = this._northEast, heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio, widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;
		return new LatLngBounds(new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer), new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
	}
	/**
	* Returns the center point of the bounds.
	* @returns {LatLng}
	*/
	getCenter() {
		return new LatLng((this._southWest.lat + this._northEast.lat) / 2, (this._southWest.lng + this._northEast.lng) / 2);
	}
	/**
	* Returns the south-west point of the bounds.
	* @returns {LatLng}
	*/
	getSouthWest() {
		return this._southWest;
	}
	/**
	* Returns the north-east point of the bounds.
	* @returns {LatLng}
	*/
	getNorthEast() {
		return this._northEast;
	}
	/**
	* Returns the north-west point of the bounds.
	* @returns {LatLng}
	*/
	getNorthWest() {
		return new LatLng(this.getNorth(), this.getWest());
	}
	/**
	* Returns the south-east point of the bounds.
	* @returns {LatLng}
	*/
	getSouthEast() {
		return new LatLng(this.getSouth(), this.getEast());
	}
	/**
	* Returns the west longitude of the bounds.
	* @returns {number}
	*/
	getWest() {
		return this._southWest.lng;
	}
	/**
	* Returns the south latitude of the bounds.
	* @returns {number}
	*/
	getSouth() {
		return this._southWest.lat;
	}
	/**
	* Returns the east longitude of the bounds.
	* @returns {number}
	*/
	getEast() {
		return this._northEast.lng;
	}
	/**
	* Returns the north latitude of the bounds.
	* @returns {number}
	*/
	getNorth() {
		return this._northEast.lat;
	}
	/**
	* Returns `true` if the rectangle contains the given bounds or point.
	* @param {LatLngBoundsExpression|LatLngExpression} obj
	* @returns {boolean}
	*/
	contains(obj) {
		if (LatLng.validate(obj)) obj = LatLng.from(obj);
		else obj = LatLngBounds.from(obj);
		const sw = this._southWest, ne = this._northEast;
		let sw2, ne2;
		if (obj instanceof LatLngBounds) {
			sw2 = obj.getSouthWest();
			ne2 = obj.getNorthEast();
		} else sw2 = ne2 = obj;
		return sw2.lat >= sw.lat && ne2.lat <= ne.lat && sw2.lng >= sw.lng && ne2.lng <= ne.lng;
	}
	/**
	* Returns `true` if the rectangle intersects the given bounds. Two bounds intersect
	* if they have at least one point in common.
	* @param {LatLngBoundsExpression} bounds
	* @returns {boolean}
	*/
	intersects(bounds) {
		bounds = LatLngBounds.from(bounds);
		const sw = this._southWest, ne = this._northEast, sw2 = bounds.getSouthWest(), ne2 = bounds.getNorthEast(), latIntersects = ne2.lat >= sw.lat && sw2.lat <= ne.lat, lngIntersects = ne2.lng >= sw.lng && sw2.lng <= ne.lng;
		return latIntersects && lngIntersects;
	}
	/**
	* Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if
	* their intersection is an area.
	* @param {LatLngBoundsExpression} bounds
	* @returns {boolean}
	*/
	overlaps(bounds) {
		bounds = LatLngBounds.from(bounds);
		const sw = this._southWest, ne = this._northEast, sw2 = bounds.getSouthWest(), ne2 = bounds.getNorthEast(), latOverlaps = ne2.lat > sw.lat && sw2.lat < ne.lat, lngOverlaps = ne2.lng > sw.lng && sw2.lng < ne.lng;
		return latOverlaps && lngOverlaps;
	}
	/**
	* Returns a string with bounding box coordinates in a
	* 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for
	* sending requests to web services that return geo data.
	* @returns {string}
	*/
	toBBoxString() {
		return [
			this.getWest(),
			this.getSouth(),
			this.getEast(),
			this.getNorth()
		].join(",");
	}
	/**
	* Returns `true` if the rectangle is equivalent (within a small margin of error) to
	* the given bounds. The margin of error can be overridden by setting `maxMargin` to
	* a small number.
	* @param {LatLngBoundsExpression} bounds
	* @param {number} [maxMargin]
	* @returns {boolean}
	*/
	equals(bounds, maxMargin) {
		if (!bounds) return false;
		bounds = LatLngBounds.from(bounds);
		return this._southWest.equals(bounds.getSouthWest(), maxMargin) && this._northEast.equals(bounds.getNorthEast(), maxMargin);
	}
	/**
	* Returns `true` if the bounds are properly initialized.
	* @returns {boolean}
	*/
	isValid() {
		return !!(this._southWest && this._northEast);
	}
};
// src/geo/LatLng.js
const coordinate = String.raw`([+-]?\d+(?:\.\d+)?)\s*°?`;
const separator = String.raw`(?:\s*[,;]\s*|\s+)`;
const plainRe = new RegExp(`^${coordinate}${separator}${coordinate}$`);
const prefixRe = new RegExp(`^([NSEW])\\s*${coordinate}${separator}([NSEW])\\s*${coordinate}$`, "i");
const suffixRe = new RegExp(`^${coordinate}\\s*([NSEW])${separator}${coordinate}\\s*([NSEW])$`, "i");
const hemisphereRe = /^[NSEW]$/i;
const geoUriRe = /^geo:([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)(?:,([+-]?\d+(?:\.\d+)?))?(?:[;?].*)?$/i;
/**
* A geographical point: a `LatLng`, an array of the form `[lat, lng]` or
* `[lat, lng, alt]`, or a plain object of the form `{lat, lng}` or `{lat, lng, alt}`
* (`lon` can be used in place of `lng`). Accepted by all Maplair methods which accept
* `LatLng` objects (unless noted otherwise). Plain arrays (`number[]`) are accepted
* for JavaScript, where array literals in variables are no tuples.
* @typedef {LatLng|[number, number]|[number, number, number]|number[]|{lat: number, lng: number, alt?: number}|{lat: number, lon: number, alt?: number}} LatLngExpression
*/
/**
* Represents a geographical point with a certain latitude and longitude.
*
* @example
* ```js
* const latlng = new LatLng(50.5, 30.5);
* ```
*
* All Maplair methods that accept LatLng objects also accept them in a simple Array
* form and simple object form (unless noted otherwise), so these lines are equivalent:
*
* ```js
* map.panTo([50, 30]);
* map.panTo({lat: 50, lng: 30});
* map.panTo({lat: 50, lon: 30});
* map.panTo(new LatLng(50, 30));
* ```
*
* Note that `LatLng` does not inherit from Maplair's `Class` object,
* which means new classes can't inherit from it, and new methods
* can't be added to it with the `include` function.
*/
var LatLng = class LatLng {
	/**
	* Creates an object representing a geographical point with the given latitude and
	* longitude (and optionally altitude). Alternatively, expects a `LatLng` object, an
	* array of the form `[lat, lng]` or `[lat, lng, alt]`, or a plain object of the form
	* `{lat, lng}` or `{lat, lng, alt}` (`lon` can be used in place of `lng`) instead.
	* @param {number|LatLngExpression} lat Latitude in degrees, or the coordinates.
	* @param {number} [lng] Longitude in degrees.
	* @param {number} [alt] Altitude in meters.
	*/
	constructor(lat, lng, alt) {
		if (!LatLng.validate(lat, lng, alt)) throw new Error(`Invalid LatLng object: (${lat}, ${lng})`);
		let _lat, _lng, _alt;
		if (lat instanceof LatLng) {
			_lat = lat.lat;
			_lng = lat.lng;
			_alt = lat.alt;
		} else if (Array.isArray(lat) && typeof lat[0] !== "object") {
			if (lat.length === 3) {
				_lat = lat[0];
				_lng = lat[1];
				_alt = lat[2];
			} else if (lat.length === 2) {
				_lat = lat[0];
				_lng = lat[1];
			}
		} else if (typeof lat === "object" && "lat" in lat) {
			_lat = lat.lat;
			_lng = "lng" in lat ? lat.lng : lat.lon;
			_alt = lat.alt;
		} else {
			_lat = lat;
			_lng = lng;
			_alt = alt;
		}
		/**
		* Latitude in degrees.
		* @type {number}
		*/
		this.lat = +_lat;
		/**
		* Longitude in degrees.
		* @type {number}
		*/
		this.lng = +_lng;
		if (_alt !== void 0)
 /**
		* Altitude in meters (optional).
		* @type {number|undefined}
		*/
		this.alt = +_alt;
	}
	/**
	* Returns the given `LatLng` object as it is, or else a new `LatLng` object created
	* from the given arguments (the same as of the constructor) — unlike the
	* constructor, which always creates a new object.
	*
	* @example
	* ```js
	* LatLng.from(latlng) === latlng; // true
	* LatLng.from([50.5, 30.5]); // LatLng(50.5, 30.5)
	* ```
	* @param {number|LatLngExpression} lat Latitude in degrees, or the coordinates.
	* @param {number} [lng] Longitude in degrees.
	* @param {number} [alt] Altitude in meters.
	* @returns {LatLng}
	*/
	static from(lat, lng, alt) {
		return lat instanceof LatLng ? lat : new LatLng(lat, lng, alt);
	}
	/**
	* Returns `true` if the LatLng object can be properly initialized with the given
	* arguments (the same as of the constructor).
	* @param {any} lat
	* @param {any} [lng]
	* @param {any} [alt]
	* @returns {boolean}
	*/
	static validate(lat, lng, alt) {
		if (lat instanceof LatLng || typeof lat === "object" && lat !== null && "lat" in lat) return true;
		else if (lat && Array.isArray(lat) && typeof lat[0] !== "object") {
			if (lat.length === 3 || lat.length === 2) return true;
			return false;
		} else if ((lat || lat === 0) && (lng || lng === 0)) return true;
		return false;
	}
	/**
	* Parses coordinates in decimal degrees: a pair of numbers (latitude first), e.g.
	* `'47.27, 11.4'` or `'47.27 11.4'`, with the hemispheres before or after the numbers,
	* e.g. `'N 47.27, E 11.4'`, `'47.27° S 11.4° W'` (also longitude first), or a
	* [geo URI](https://www.rfc-editor.org/rfc/rfc5870) like `'geo:47.27,11.4'` (with an
	* optional altitude). Returns `null` for other text and out-of-range coordinates.
	*
	* @example
	* ```js
	* LatLng.parse('47.2692 N, 11.4041 E'); // LatLng(47.2692, 11.4041)
	* LatLng.parse('geo:47.2692,11.4041?z=13'); // LatLng(47.2692, 11.4041)
	* ```
	* @param {string} text
	* @returns {LatLng|null}
	*/
	static parse(text) {
		text = text.trim();
		let lat, lng, alt, match;
		if (match = geoUriRe.exec(text)) [lat, lng, alt] = match.slice(1).map((n) => n === void 0 ? void 0 : Number(n));
		else if (match = plainRe.exec(text)) [lat, lng] = match.slice(1).map(Number);
		else if (match = prefixRe.exec(text) ?? suffixRe.exec(text)) {
			const coords = hemisphereRe.test(match[1]) ? [[match[1], match[2]], [match[3], match[4]]] : [[match[2], match[1]], [match[4], match[3]]];
			for (const [hemisphere, number] of coords) {
				const h = hemisphere.toUpperCase(), value = Math.abs(Number(number)) * (h === "S" || h === "W" ? -1 : 1);
				if (h === "N" || h === "S") {
					if (lat !== void 0) return null;
					lat = value;
				} else {
					if (lng !== void 0) return null;
					lng = value;
				}
			}
		}
		if (lat === void 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
		return new LatLng(lat, lng, alt);
	}
	/**
	* Returns `true` if the given `LatLng` point is at the same position (within a small
	* margin of error). The margin of error can be overridden by setting `maxMargin` to
	* a small number.
	* @param {LatLngExpression} obj
	* @param {number} [maxMargin]
	* @returns {boolean}
	*/
	equals(obj, maxMargin) {
		if (!obj) return false;
		obj = LatLng.from(obj);
		return Math.max(Math.abs(this.lat - obj.lat), Math.abs(this.lng - obj.lng)) <= (maxMargin ?? 1e-9);
	}
	/**
	* Returns a string representation of the point (for debugging purposes).
	* @param {number|false} [precision]
	* @returns {string}
	*/
	toString(precision) {
		return `LatLng(${formatNum(this.lat, precision)}, ${formatNum(this.lng, precision)})`;
	}
	/**
	* Returns the distance (in meters) to the given `LatLng` calculated using the
	* [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula).
	* @param {LatLngExpression} other
	* @returns {number}
	*/
	distanceTo(other) {
		return haversineDistance(this, LatLng.from(other), 6371e3);
	}
	/**
	* Returns a new `LatLng` object with the longitude wrapped so it's always between
	* -180 and +180 degrees.
	* @returns {LatLng}
	*/
	wrap() {
		return new LatLng(this.lat, wrapNum(this.lng, [-180, 180], true), this.alt);
	}
	/**
	* Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2`
	* meters apart from the `LatLng`.
	* @param {number} sizeInMeters
	* @returns {LatLngBounds}
	*/
	toBounds(sizeInMeters) {
		const latAccuracy = 180 * sizeInMeters / 40075017, lngAccuracy = latAccuracy / Math.cos(Math.PI / 180 * this.lat);
		return new LatLngBounds([this.lat - latAccuracy, this.lng - lngAccuracy], [this.lat + latAccuracy, this.lng + lngAccuracy]);
	}
};
/**
* The great-circle distance on a sphere of radius `R`, shared with `EarthCRS.distance()`.
* @param {LatLng} latlng1
* @param {LatLng} latlng2
* @param {number} R
* @returns {number}
*/
function haversineDistance(latlng1, latlng2, R) {
	const rad = Math.PI / 180, lat1 = latlng1.lat * rad, lat2 = latlng2.lat * rad, sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2), sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2), a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
	return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
// src/geometry/LineUtil.js
var LineUtil_exports = /* @__PURE__ */ __exportAll({
	_getBitCode: () => _getBitCode,
	_getEdgeIntersection: () => _getEdgeIntersection,
	_projectRing: () => _projectRing,
	_sqClosestPointOnSegment: () => _sqClosestPointOnSegment,
	clipSegment: () => clipSegment,
	closestPointOnSegment: () => closestPointOnSegment,
	isFlat: () => isFlat,
	pointToSegmentDistance: () => pointToSegmentDistance,
	polylineCenter: () => polylineCenter,
	simplify: () => simplify
});
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {Bounds} from './Bounds.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/**
* Dramatically reduces the number of points in a polyline while retaining
* its shape and returns a new array of simplified points, using the
* [Ramer-Douglas-Peucker algorithm](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm).
* Used for a huge performance boost when processing/displaying Maplair polylines for
* each zoom level and also reducing visual noise. tolerance affects the amount of
* simplification (lesser value means higher quality but slower and with more points).
* Also released as a separated micro-library
* [Simplify.js](https://mourner.github.io/simplify-js/).
* @param {Point[]} points
* @param {number} tolerance
* @returns {Point[]}
*/
function simplify(points, tolerance) {
	if (!tolerance || !points.length) return points.slice();
	const sqTolerance = tolerance * tolerance;
	points = _reducePoints(points, sqTolerance);
	points = _simplifyDP(points, sqTolerance);
	return points;
}
/**
* Returns the distance between point `p` and segment `p1` to `p2`.
* @param {Point} p
* @param {Point} p1
* @param {Point} p2
* @returns {number}
*/
function pointToSegmentDistance(p, p1, p2) {
	return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
}
/**
* Returns the closest point from a point `p` on a segment `p1` to `p2`.
* @param {Point} p
* @param {Point} p1
* @param {Point} p2
* @returns {Point}
*/
function closestPointOnSegment(p, p1, p2) {
	return _sqClosestPointOnSegment(p, p1, p2);
}
function _simplifyDP(points, sqTolerance) {
	const len = points.length, markers = new Uint8Array(len);
	markers[0] = markers[len - 1] = 1;
	_simplifyDPStep(points, markers, sqTolerance, 0, len - 1);
	let i;
	const newPoints = [];
	for (i = 0; i < len; i++) if (markers[i]) newPoints.push(points[i]);
	return newPoints;
}
function _simplifyDPStep(points, markers, sqTolerance, first, last) {
	let maxSqDist = 0, index, i, sqDist;
	for (i = first + 1; i <= last - 1; i++) {
		sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);
		if (sqDist > maxSqDist) {
			index = i;
			maxSqDist = sqDist;
		}
	}
	if (maxSqDist > sqTolerance) {
		markers[index] = 1;
		_simplifyDPStep(points, markers, sqTolerance, first, index);
		_simplifyDPStep(points, markers, sqTolerance, index, last);
	}
}
function _reducePoints(points, sqTolerance) {
	const reducedPoints = [points[0]];
	let prev = 0;
	for (let i = 1; i < points.length; i++) if (_sqDist(points[i], points[prev]) > sqTolerance) {
		reducedPoints.push(points[i]);
		prev = i;
	}
	if (prev < points.length - 1) reducedPoints.push(points[points.length - 1]);
	return reducedPoints;
}
let _lastCode;
/**
* Clips the segment a to b by rectangular bounds with the
* [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
* (modifying the segment points directly!). Used by Maplair to only show polyline
* points that are on the screen or near, increasing performance. Returns `false` if
* the segment is outside of the bounds.
* @param {Point} a
* @param {Point} b
* @param {Bounds} bounds
* @param {boolean} [useLastCode]
* @param {boolean} [round]
* @returns {[Point, Point]|false}
*/
function clipSegment(a, b, bounds, useLastCode, round) {
	const a0 = a, b0 = b;
	let codeA = useLastCode ? _lastCode : _getBitCode(a, bounds), codeB = _getBitCode(b, bounds), codeOut, p, newCode;
	_lastCode = codeB;
	while (true) {
		if (!(codeA | codeB)) {
			if (round) {
				if (a !== a0) a = a.round();
				if (b !== b0) b = b.round();
			}
			return [a, b];
		}
		if (codeA & codeB) return false;
		codeOut = codeA || codeB;
		p = _getEdgeIntersection(a, b, codeOut, bounds);
		newCode = _getBitCode(p, bounds);
		if (codeOut === codeA) {
			a = p;
			codeA = newCode;
		} else {
			b = p;
			codeB = newCode;
		}
	}
}
function _getEdgeIntersection(a, b, code, bounds, round) {
	const dx = b.x - a.x, dy = b.y - a.y, min = bounds.min, max = bounds.max;
	let x, y;
	if (code & 8) {
		x = a.x + dx * (max.y - a.y) / dy;
		y = max.y;
	} else if (code & 4) {
		x = a.x + dx * (min.y - a.y) / dy;
		y = min.y;
	} else if (code & 2) {
		x = max.x;
		y = a.y + dy * (max.x - a.x) / dx;
	} else if (code & 1) {
		x = min.x;
		y = a.y + dy * (min.x - a.x) / dx;
	}
	return new Point(x, y, round);
}
function _getBitCode(p, bounds) {
	let code = 0;
	if (p.x < bounds.min.x) code |= 1;
	else if (p.x > bounds.max.x) code |= 2;
	if (p.y < bounds.min.y) code |= 4;
	else if (p.y > bounds.max.y) code |= 8;
	return code;
}
function _sqDist(p1, p2) {
	const dx = p2.x - p1.x, dy = p2.y - p1.y;
	return dx * dx + dy * dy;
}
function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
	let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y, t;
	const dot = dx * dx + dy * dy;
	if (dot > 0) {
		t = ((p.x - x) * dx + (p.y - y) * dy) / dot;
		if (t > 1) {
			x = p2.x;
			y = p2.y;
		} else if (t > 0) {
			x += dx * t;
			y += dy * t;
		}
	}
	dx = p.x - x;
	dy = p.y - y;
	return sqDist ? dx * dx + dy * dy : new Point(x, y);
}
/**
* Returns true if `latlngs` is a flat array, false is nested.
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @returns {boolean}
*/
function isFlat(latlngs) {
	return !Array.isArray(latlngs[0]) || typeof latlngs[0][0] !== "object" && typeof latlngs[0][0] !== "undefined";
}
/**
* Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the passed
* LatLngs (first ring) from a polyline.
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @param {typeof CRS} crs
* @returns {LatLng}
*/
function polylineCenter(latlngs, crs) {
	const points = _projectRing(latlngs, crs), len = points.length;
	let halfDist = 0;
	for (let i = 1; i < len; i++) halfDist += points[i - 1].distanceTo(points[i]);
	halfDist /= 2;
	let center = points[0];
	for (let i = 1, dist = 0; i < len; i++) {
		const p1 = points[i - 1], p2 = points[i], segDist = p1.distanceTo(p2);
		dist += segDist;
		if (dist > halfDist) {
			const ratio = (dist - halfDist) / segDist;
			center = new Point(p2.x - ratio * (p2.x - p1.x), p2.y - ratio * (p2.y - p1.y));
			break;
		}
	}
	return crs.unproject(center);
}
/**
* Projects the first ring of the given latlngs.
* @internal
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @param {typeof CRS} crs
* @returns {Point[]}
*/
function _projectRing(latlngs, crs) {
	if (!latlngs || latlngs.length === 0) throw new Error("latlngs not passed");
	if (!isFlat(latlngs)) {
		console.warn("latlngs are not flat! Only the first ring will be used");
		latlngs = latlngs[0];
	}
	return latlngs.map((latlng) => crs.project(LatLng.from(latlng)));
}
// src/layer/GeoJSONUtil.js
/** @import {Feature, FeatureCollection, GeoJsonObject, Geometry} from 'geojson' */
/** @import {Layer} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/**
* See `GeoJSON.latLngToCoords()`.
* @param {LatLngExpression} latlng
* @param {number|false} [precision]
* @returns {number[]}
*/
function latLngToCoords(latlng, precision) {
	latlng = LatLng.from(latlng);
	return latlng.alt !== void 0 ? [
		formatNum(latlng.lng, precision),
		formatNum(latlng.lat, precision),
		formatNum(latlng.alt, precision)
	] : [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision)];
}
/**
* See `GeoJSON.latLngsToCoords()`.
* @param {any[]} latlngs
* @param {number} [levelsDeep]
* @param {boolean} [close]
* @param {number|false} [precision]
* @returns {any[]}
*/
function latLngsToCoords(latlngs, levelsDeep, close, precision) {
	const coords = latlngs.map((latlng) => levelsDeep ? latLngsToCoords(latlng, isFlat(latlng) ? 0 : levelsDeep - 1, close, precision) : latLngToCoords(latlng, precision));
	if (!levelsDeep && close && coords.length > 0) coords.push(coords[0].slice());
	return coords;
}
/**
* See `GeoJSON.getFeature()`.
* @param {Layer} layer
* @param {Geometry} newGeometry
* @returns {Feature}
*/
function getFeature(layer, newGeometry) {
	return layer.feature ? {
		...layer.feature,
		geometry: newGeometry
	} : asFeature(newGeometry);
}
/**
* See `GeoJSON.asFeature()`.
* @param {GeoJsonObject} geojson
* @returns {Feature|FeatureCollection}
*/
function asFeature(geojson) {
	if (geojson.type === "Feature" || geojson.type === "FeatureCollection") return geojson;
	return {
		type: "Feature",
		properties: {},
		geometry: geojson
	};
}
/**
* The GeoJSON `Point` Feature of a layer with `getLatLng()`, for its `toGeoJSON()`.
* @param {Layer & {getLatLng(): LatLng}} layer
* @param {number|false} [precision]
* @returns {Feature}
*/
function pointToGeoJSON(layer, precision) {
	return getFeature(layer, {
		type: "Point",
		coordinates: latLngToCoords(layer.getLatLng(), precision)
	});
}
// src/layer/vector/CircleMarker.js
/** @import {Feature} from 'geojson' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {PathOptions} from './Path.js' */
/**
* Options of `CircleMarker`.
* @typedef {object} CircleMarkerOptions
* @property {boolean} [fill=true] Whether to fill the circle with color.
* @property {number} [radius=10] Radius of the circle marker, in CSS pixels.
* @extends PathOptions
*/
/**
* The event object of `move` of circle markers.
* @typedef {object} CircleMarkerMoveEvent
* @property {LatLng} oldLatLng The previous position of the circle marker.
* @property {LatLng} latlng The new position of the circle marker.
* @extends MaplairEvent
*/
/**
* A circle of a fixed size with radius specified in CSS pixels. Extends `Path`.
*
* @fires move {CircleMarkerMoveEvent} Fired when the marker is moved via
* [`setLatLng`](#circlemarker-setlatlng). Old and new coordinates are included in
* event arguments as `oldLatLng`, `latlng`.
*/
var CircleMarker = class CircleMarker extends Path {
	static defaultOptions = {
		fill: true,
		radius: 10
	};
	/**
	* Instantiates a circle marker object given a geographical point, and an optional
	* options object.
	* @param {LatLngExpression} latlng
	* @param {CircleMarkerOptions} [options]
	*/
	constructor(latlng, options) {
		super();
		setOptions(this, options);
		this._latlng = new LatLng(latlng);
		this._radius = this.options.radius;
		this.callInitHooks(CircleMarker);
	}
	/**
	* Sets the position of a circle marker to a new location.
	* @param {LatLngExpression} latlng
	* @returns {this}
	*/
	setLatLng(latlng) {
		const oldLatLng = this._latlng;
		this._latlng = new LatLng(latlng);
		this.redraw();
		return this.fire("move", {
			oldLatLng,
			latlng: this._latlng
		});
	}
	/**
	* Returns the current geographical position of the circle marker.
	* @returns {LatLng}
	*/
	getLatLng() {
		return this._latlng;
	}
	/**
	* Sets the radius of a circle marker. Units are in CSS pixels.
	* @param {number} radius
	* @returns {this}
	*/
	setRadius(radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	}
	/**
	* Returns the current radius of the circle. Units are in CSS pixels.
	* @returns {number}
	*/
	getRadius() {
		return this._radius;
	}
	/**
	* Changes the appearance of the circle marker, also its `radius`.
	* @param {CircleMarkerOptions} options
	* @returns {this}
	*/
	setStyle(options) {
		super.setStyle(options);
		if (options?.radius !== void 0) this.setRadius(options.radius);
		return this;
	}
	_project() {
		this._point = this._map.latLngToLayerPoint(this._latlng)._round();
		this._pxRadius = this._radius;
		this._updateBounds();
	}
	_updateBounds() {
		const r = this._pxRadius, r2 = this._pxRadiusY ?? r, w = this._clickTolerance(), p = [r + w, r2 + w];
		this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
	}
	_update() {
		if (this._map) this._updatePath();
	}
	_updatePath() {
		this._renderer._updateCircle(this);
	}
	_empty() {
		return this._pxRadius && !this._renderer._bounds.intersects(this._pxBounds);
	}
	_containsPoint(p) {
		return p.distanceTo(this._point) <= this._pxRadius + this._clickTolerance();
	}
	/**
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
	* given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
	* representation of the circle marker (as a GeoJSON `Point` Feature).
	* @param {number|false} [precision]
	* @returns {Feature}
	*/
	toGeoJSON(precision) {
		return pointToGeoJSON(this, precision);
	}
};
// src/control/LegendControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {FeatureGroup} from '../layer/FeatureGroup.js' */
/** @import {Classification} from '../layer/Classification.js' */
/**
* Options of `LegendControl`.
* @typedef {object} LegendControlOptions
* @property {string} [position='bottomright'] The position of the control (one of the
* map corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {boolean} [collapsed=false] If `true`, the legend starts collapsed to its
* title, which toggles it.
* @property {boolean} [featureCount=false] If `true`, the number of features is shown
* per class and per classification.
* @property {boolean} [bar=false] If `true`, the feature count of each classification
* is shown as a bar of the class symbols, each as wide as its share.
* @extends ControlOptions
*/
/**
* A control showing the legend of the map: the classes of the layers added with
* [`addClassification()`](#legendcontrol-addclassification), each with a patch in the
* shape and symbol of its features and optionally the feature count, and the
* legends of all layers on the map implementing [`getLegend()`](#layer-getlegend),
* like the attribution control collects [`getAttribution()`](#layer-getattribution).
* The legend is updated when features are added to or removed from the classified
* layers (e.g. when reloading the data) and when a layer fires `legendchange`. It
* is collapsible and hidden while empty. Placed at the bottom right, it sits right
* above the attribution.
*
* Inspired by the legend of [QGIS](https://qgis.org/).
*
* @example
* ```js
* const legend = new LegendControl({featureCount: true, bar: true}).addTo(map);
* legend.addClassification(stations, temperature);
* ```
*/
const svgNS$1 = "http://www.w3.org/2000/svg";
var LegendControl = class LegendControl extends Control {
	static defaultOptions = {
		position: "bottomright",
		collapsed: false,
		featureCount: false,
		bar: false
	};
	/**
	* Creates a legend control.
	* @param {...LegendControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this._classifications = [];
		this._legendLayers = /* @__PURE__ */ new Set();
		this.callInitHooks(LegendControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-control-legend"), details = this._details = create("details", "", container), summary = create("summary", "maplair-control-legend-title", details);
		summary.textContent = I18n.translate("Legend");
		details.open = !this.options.collapsed;
		this._list = create("div", "maplair-control-legend-list", details);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		this._container = container;
		map.on("layeradd layerremove", this._scheduleUpdate, this);
		this._update();
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("layeradd layerremove", this._scheduleUpdate, this);
		cancelAnimationFrame(this._frame);
		this._frame = null;
		for (const layer of this._legendLayers) layer.off("legendchange", this._scheduleUpdate, this);
		this._legendLayers.clear();
	}
	/**
	* Shows the classes of `classification` in the legend while `layer` is on the map,
	* with the feature count of the layers of `layer` (e.g. a `GeoJSON` layer styled
	* with [`classification.style`](#classification-style)), kept up to date when
	* layers are added and removed.
	* @param {FeatureGroup} layer
	* @param {Classification} classification
	* @returns {this}
	*/
	addClassification(layer, classification) {
		this._classifications.push({
			layer,
			classification
		});
		layer.on("layeradd layerremove", this._scheduleUpdate, this);
		this._scheduleUpdate();
		return this;
	}
	/**
	* Removes the classification of `layer` from the legend.
	* @param {FeatureGroup} layer
	* @returns {this}
	*/
	removeClassification(layer) {
		this._classifications = this._classifications.filter((entry) => entry.layer !== layer);
		layer.off("layeradd layerremove", this._scheduleUpdate, this);
		this._scheduleUpdate();
		return this;
	}
	_scheduleUpdate() {
		if (!this._map || this._frame) return;
		this._frame = requestAnimationFrame(() => {
			this._frame = null;
			this._update();
		});
	}
	_update() {
		const map = this._map;
		if (!map) return;
		const sections = this._classifications.filter(({ layer }) => map.hasLayer(layer)).map(({ layer, classification }) => this._renderClassification(layer, classification));
		const legendLayers = new Set(Object.values(map._layers).filter((layer) => layer.getLegend));
		for (const layer of this._legendLayers) if (!legendLayers.has(layer)) layer.off("legendchange", this._scheduleUpdate, this);
		for (const layer of legendLayers) {
			if (!this._legendLayers.has(layer)) layer.on("legendchange", this._scheduleUpdate, this);
			const legend = layer.getLegend();
			if (legend) {
				const section = create("div", "maplair-control-legend-section");
				if (typeof legend === "string") section.innerHTML = legend;
				else section.append(legend);
				sections.push(section);
			}
		}
		this._legendLayers = legendLayers;
		this._list.replaceChildren(...sections);
		this._container.hidden = !sections.length;
	}
	_renderClassification(layer, classification) {
		const layers = layer.getLayers(), items = classification.featureCount(layers), { featureCount, bar } = this.options, section = create("div", "maplair-control-legend-section"), { name } = classification.options, total = items.reduce((sum, item) => sum + (item.counted ? item.count : 0), 0);
		if (name) create("div", "maplair-control-legend-name", section).textContent = name;
		if (featureCount) create("div", "maplair-control-legend-total", section).textContent = I18n.translate("{n} features", { n: total });
		const samples = /* @__PURE__ */ new Map();
		for (const feature of layers) {
			const cls = classification.classify(feature), item = items.find((i) => i.classes.includes(cls));
			if (item && !samples.has(item)) samples.set(item, feature);
			if (samples.size === items.length) break;
		}
		const list = create("ul", "maplair-control-legend-items", section);
		for (const item of items) {
			const li = create("li", "", list);
			li.append(createPatch(samples.get(item) ?? layers[0], item.symbol, Boolean(samples.get(item))));
			create("span", "maplair-control-legend-label", li).textContent = item.legend;
			if (featureCount && item.counted) create("span", "maplair-control-legend-count", li).textContent = formatCount(item);
		}
		if (bar && total) {
			const barEl = create("div", "maplair-control-legend-bar", section);
			barEl.setAttribute("role", "img");
			barEl.setAttribute("aria-label", items.filter((item) => item.counted && item.count).map((item) => `${item.legend}: ${formatCount(item)}`).join(", "));
			for (const item of items) {
				if (!item.counted || !item.count) continue;
				const part = create("div", "", barEl);
				part.style.flexGrow = item.count;
				part.style.backgroundColor = item.symbol.fillColor ?? item.symbol.color ?? "";
				part.title = `${item.legend}: ${formatCount(item)}`;
			}
		}
		return section;
	}
};
function formatCount({ count, share }) {
	return `${count} (${new Intl.NumberFormat(I18n.getLocale() ?? void 0, {
		style: "percent",
		maximumFractionDigits: 1
	}).format(share)})`;
}
function createPatch(layer, symbol, styled) {
	while (layer?.getLayers) layer = layer.getLayers()[0];
	if (!layer?.setStyle) layer = void 0;
	const base = layer?.options ?? new CircleMarker([0, 0]).options, options = Object.assign(Object.create(base), layer && styled ? {} : symbol), svg = document.createElementNS(svgNS$1, "svg");
	svg.setAttribute("class", "maplair-control-legend-patch");
	svg.setAttribute("width", 16);
	svg.setAttribute("height", 16);
	svg.setAttribute("viewBox", "0 0 16 16");
	svg.setAttribute("aria-hidden", "true");
	let shape;
	if (layer?.getLatLngs && options.fill) shape = svgElement$1("rect", {
		x: 2,
		y: 2,
		width: 12,
		height: 12
	});
	else if (layer?.getLatLngs) shape = svgElement$1("line", {
		x1: 1,
		y1: 8,
		x2: 15,
		y2: 8
	});
	else shape = svgElement$1("circle", {
		cx: 8,
		cy: 8,
		r: 6
	});
	shape.setAttribute("fill", options.fill ? options.fillColor ?? options.color : "none");
	shape.setAttribute("fill-opacity", options.fillOpacity);
	shape.setAttribute("stroke", options.stroke ? options.color : "none");
	shape.setAttribute("stroke-opacity", options.opacity);
	shape.setAttribute("stroke-width", Math.min(options.weight, 4));
	if (options.dashArray) shape.setAttribute("stroke-dasharray", options.dashArray);
	svg.append(shape);
	return svg;
}
function svgElement$1(name, attributes) {
	const el = document.createElementNS(svgNS$1, name);
	for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
	return el;
}
// src/geo/crs/CRS.js
/** @import {LatLngExpression} from '../LatLng.js' */
/** @import {LatLngBoundsExpression} from '../LatLngBounds.js' */
/** @import {Point} from '../../geometry/Point.js' */
/** @import {Transformation} from '../../geometry/Transformation.js' */
/** @import {Projection} from '../projection/index.js' */
/**
* Object that defines coordinate reference systems for projecting
* geographical points into pixel (screen) coordinates and back (and to
* coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service)
* services). See
* [spatial reference system](https://en.wikipedia.org/wiki/Spatial_reference_system).
*
* Maplair defines the most usual CRSs by default. If you want to use a
* CRS not defined by default, extend `CRS` with a projection of your own, e.g.
* based on [Proj4js](https://github.com/proj4js/proj4js) (the Leaflet plugin
* [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) doesn't work with Maplair).
*
* The CRSs are classes with static properties and methods only; they are not
* instantiated, the class itself is passed as the CRS, e.g. to the `crs` option of the
* map. Maplair's CRSs extend `CRS` (`EarthCRS` for the global ones).
*
* Besides the properties and methods below, a CRS may define:
*
* * `code: string`: Standard code name of the CRS passed into WMS services (e.g.
*   `'EPSG:3857'`).
* * `wrapLng: [number, number]`: An array of two numbers defining whether the longitude
*   (horizontal) coordinate axis wraps around a given range and how. Defaults to
*   `[-180, 180]` in most geographical CRSs. If `undefined`, the longitude axis does
*   not wrap around.
* * `wrapLat: [number, number]`: Like `wrapLng`, but for the latitude (vertical) axis.
* * `distance(latlng1: LatLng, latlng2: LatLng): number`: Returns the distance between
*   two geographical coordinates.
*/
var CRS = class {
	/**
	* The projection of the CRS.
	* @type {Projection|undefined}
	*/
	static projection = void 0;
	/**
	* The transformation of projected coordinates into pixel coordinates at zoom 0.
	* @type {Transformation|undefined}
	*/
	static transformation = void 0;
	/**
	* Projects geographical coordinates into pixel coordinates for a given zoom.
	* @param {LatLngExpression} latlng
	* @param {number} zoom
	* @returns {Point}
	*/
	static latLngToPoint(latlng, zoom) {
		const projectedPoint = this.projection.project(latlng), scale = this.scale(zoom);
		return this.transformation._transform(projectedPoint, scale);
	}
	/**
	* The inverse of `latLngToPoint`. Projects pixel coordinates on a given
	* zoom into geographical coordinates.
	* @param {Point} point
	* @param {number} zoom
	* @returns {LatLng}
	*/
	static pointToLatLng(point, zoom) {
		const scale = this.scale(zoom), untransformedPoint = this.transformation.untransform(point, scale);
		return this.projection.unproject(untransformedPoint);
	}
	/**
	* Projects geographical coordinates into coordinates in units accepted for
	* this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
	* @param {LatLngExpression} latlng
	* @returns {Point}
	*/
	static project(latlng) {
		return this.projection.project(latlng);
	}
	/**
	* Given a projected coordinate returns the corresponding LatLng.
	* The inverse of `project`.
	* @param {Point} point
	* @returns {LatLng}
	*/
	static unproject(point) {
		return this.projection.unproject(point);
	}
	/**
	* Returns the scale used when transforming projected coordinates into
	* pixel coordinates for a particular zoom. For example, it returns
	* `256 * 2^zoom` for Mercator-based CRS.
	* @param {number} zoom
	* @returns {number}
	*/
	static scale(zoom) {
		return 256 * 2 ** zoom;
	}
	/**
	* Inverse of `scale()`, returns the zoom level corresponding to a scale
	* factor of `scale`.
	* @param {number} scale
	* @returns {number}
	*/
	static zoom(scale) {
		return Math.log(scale / 256) / Math.LN2;
	}
	/**
	* Returns the projection's bounds scaled and transformed for the provided `zoom`
	* (`null` if the CRS is `infinite`).
	* @param {number} zoom
	* @returns {Bounds|null}
	*/
	static getProjectedBounds(zoom) {
		if (this.infinite) return null;
		const b = this.projection.bounds, s = this.scale(zoom);
		return new Bounds(this.transformation.transform(b.min, s), this.transformation.transform(b.max, s));
	}
	/**
	* If true, the coordinate space will be unbounded (infinite in both axes).
	* @type {boolean}
	*/
	static infinite = false;
	/**
	* Returns a `LatLng` where lat and lng has been wrapped according to the
	* CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
	* @param {LatLngExpression} latlng
	* @returns {LatLng}
	*/
	static wrapLatLng(latlng) {
		latlng = LatLng.from(latlng);
		const lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng, lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat, alt = latlng.alt;
		return new LatLng(lat, lng, alt);
	}
	/**
	* Returns a `LatLngBounds` with the same size as the given one, ensuring
	* that its center is within the CRS's bounds.
	* @param {LatLngBoundsExpression} bounds
	* @returns {LatLngBounds}
	*/
	static wrapLatLngBounds(bounds) {
		bounds = new LatLngBounds(bounds);
		const center = bounds.getCenter(), newCenter = this.wrapLatLng(center), latShift = center.lat - newCenter.lat, lngShift = center.lng - newCenter.lng;
		if (latShift === 0 && lngShift === 0) return bounds;
		const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
		return new LatLngBounds(new LatLng(sw.lat - latShift, sw.lng - lngShift), new LatLng(ne.lat - latShift, ne.lng - lngShift));
	}
};
// src/geo/crs/EarthCRS.js
/** @import {LatLng} from '../LatLng.js' */
/**
* Serves as the base for CRS that are global such that they cover the earth.
* Can only be used as the base for other CRS and cannot be used directly,
* since it does not have a `code`, `projection` or `transformation`. `distance()` returns
* meters.
*/
var EarthCRS = class extends CRS {
	/**
	* The range around which the longitude axis wraps.
	* @type {[number, number]}
	*/
	static wrapLng = [-180, 180];
	/**
	* Mean Earth Radius in meters, as recommended for use by
	* the International Union of Geodesy and Geophysics,
	* see https://rosettacode.org/wiki/Haversine_formula
	* @type {number}
	*/
	static R = 6371e3;
	/**
	* Returns the distance in meters between two geographical points using the
	* Haversine approximation.
	* @param {LatLng} latlng1
	* @param {LatLng} latlng2
	* @returns {number}
	*/
	static distance(latlng1, latlng2) {
		return haversineDistance(latlng1, latlng2, this.R);
	}
};
// src/geo/projection/Projection.SphericalMercator.js
/** @import {Projection} from './index.js' */
const earthRadius$1 = 6378137;
/**
* Spherical Mercator projection — the most common projection for online maps,
* used by almost all free and commercial tile providers. Assumes that Earth is
* a sphere. Used by the `EPSG:3857` CRS.
* @type {Projection & {R: number, MAX_LATITUDE: number}}
*/
const SphericalMercator = {
	R: earthRadius$1,
	MAX_LATITUDE: 85.0511287798,
	project(latlng) {
		latlng = LatLng.from(latlng);
		const d = Math.PI / 180, max = this.MAX_LATITUDE, lat = Math.max(Math.min(max, latlng.lat), -max), sin = Math.sin(lat * d);
		return new Point(this.R * latlng.lng * d, this.R * Math.log((1 + sin) / (1 - sin)) / 2);
	},
	unproject(point) {
		point = Point.from(point);
		const d = 180 / Math.PI;
		return new LatLng((2 * Math.atan(Math.exp(point.y / this.R)) - Math.PI / 2) * d, point.x * d / this.R);
	},
	bounds: /* @__PURE__ */ (() => {
		const d = earthRadius$1 * Math.PI;
		return new Bounds([-d, -d], [d, d]);
	})()
};
// src/geometry/Transformation.js
/**
* Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
* for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
* the reverse. Used by Maplair in its projections code.
*
* @example
* ```js
* const transformation = new Transformation(2, 5, -1, 10),
* 	p = new Point(1, 2),
* 	p2 = transformation.transform(p), //  new Point(7, 8)
* 	p3 = transformation.untransform(p2); //  new Point(1, 2)
* ```
*/
var Transformation = class {
	/**
	* Instantiates a Transformation object with the given coefficients. Alternatively,
	* expects a coefficients array of the form `[a, b, c, d]`.
	* @param {number|[number, number, number, number]} a
	* @param {number} [b]
	* @param {number} [c]
	* @param {number} [d]
	*/
	constructor(a, b, c, d) {
		if (Array.isArray(a)) {
			this._a = a[0];
			this._b = a[1];
			this._c = a[2];
			this._d = a[3];
			return;
		}
		this._a = a;
		this._b = b;
		this._c = c;
		this._d = d;
	}
	/**
	* Returns a transformed point, optionally multiplied by the given scale.
	* Only accepts actual `Point` instances, not arrays.
	* @param {Point} point
	* @param {number} [scale]
	* @returns {Point}
	*/
	transform(point, scale) {
		return this._transform(new Point(point), scale);
	}
	_transform(point, scale) {
		scale ||= 1;
		point.x = scale * (this._a * point.x + this._b);
		point.y = scale * (this._c * point.y + this._d);
		return point;
	}
	/**
	* Returns the reverse transformation of the given point, optionally divided
	* by the given scale. Only accepts actual `Point` instances, not arrays.
	* @param {Point} point
	* @param {number} [scale]
	* @returns {Point}
	*/
	untransform(point, scale) {
		scale ||= 1;
		return new Point((point.x / scale - this._b) / this._a, (point.y / scale - this._d) / this._c);
	}
};
// src/geo/crs/EPSG3857.js
/** @import {Projection} from '../projection/index.js' */
/**
* The most common CRS for online maps, used by almost all free and commercial
* tile providers. Uses Spherical Mercator projection. Set in by default in
* Map's `crs` option.
*/
var EPSG3857 = class extends EarthCRS {
	/** @type {string} */
	static code = "EPSG:3857";
	/** @type {Projection} */
	static projection = SphericalMercator;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ (() => {
		const scale = .5 / (Math.PI * SphericalMercator.R);
		return new Transformation(scale, .5, -scale, .5);
	})();
};
/**
* The same as `EPSG3857`, with its former unofficial code `EPSG:900913`.
*/
var EPSG900913 = class extends EPSG3857 {
	/** @type {string} */
	static code = "EPSG:900913";
};
// src/dom/PosAnimation.js
/** @import {Point} from '../geometry/Point.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
* Runs the map's pan animations: moves an element to a new position on an ease-out
* curve, firing `start`, `step` and `end`.
* @internal
*/
var PosAnimation = class PosAnimation extends Evented {
	/**
	* Creates a `PosAnimation` object.
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(PosAnimation);
	}
	/**
	* Run an animation of a given element to a new position, optionally setting
	* duration in seconds (`0.25` by default) and easing linearity factor (3rd
	* argument of the [cubic bezier curve](https://cubic-bezier.com/#0,0,.5,1),
	* `0.5` by default).
	* @param {HTMLElement} el
	* @param {Point} newPos
	* @param {number} [duration=0.25]
	* @param {number} [easeLinearity=0.5]
	* @returns {void}
	*/
	run(el, newPos, duration, easeLinearity) {
		this.stop();
		this._el = el;
		this._inProgress = true;
		this._duration = duration ?? .25;
		this._easeOutPower = 1 / Math.max(easeLinearity ?? .5, .2);
		this._startPos = getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = Date.now();
		this.fire("start");
		this._animate();
	}
	/**
	* Stops the animation (if currently running).
	* @returns {void}
	*/
	stop() {
		if (!this._inProgress) return;
		this._step(true);
		this._complete();
	}
	_animate() {
		this._animId = requestAnimationFrame(this._animate.bind(this));
		this._step();
	}
	_step(round) {
		const elapsed = Date.now() - this._startTime, duration = this._duration * 1e3;
		if (elapsed < duration) this._runFrame(this._easeOut(elapsed / duration), round);
		else {
			this._runFrame(1);
			this._complete();
		}
	}
	_runFrame(progress, round) {
		const pos = this._startPos.add(this._offset.multiplyBy(progress));
		if (round) pos._round();
		setPosition(this._el, pos);
		this.fire("step");
	}
	_complete() {
		cancelAnimationFrame(this._animId);
		this._inProgress = false;
		this.fire("end");
	}
	_easeOut(t) {
		return 1 - (1 - t) ** this._easeOutPower;
	}
};
// src/control/ZoomControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
* Options of `ZoomControl`.
* @typedef {object} ZoomControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string} [zoomInText='<span aria-hidden="true">+</span>'] The text set on
* the 'zoom in' button.
* @property {string} [zoomOutText='<span aria-hidden="true">&#x2212;</span>'] The text
* set on the 'zoom out' button.
* @extends ControlOptions
*/
/**
* Map options of `ZoomControl`.
* @typedef {object} ZoomControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [zoomControl=true] Whether a [zoom control](#control-zoom) is
* added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `ZoomControl`.
* @typedef {object} ZoomControlMapProperties
* @lends MaplairMap
* @property {ZoomControl} zoomControl The default zoom control (only available if the
* [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
*/
/**
* A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by
* default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`.
*/
var ZoomControl = class ZoomControl extends Control {
	static defaultOptions = {
		position: "topleft",
		zoomInText: "<span aria-hidden=\"true\">+</span>",
		zoomOutText: "<span aria-hidden=\"true\">&#x2212;</span>"
	};
	/**
	* Creates a zoom control.
	* @param {...ZoomControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(ZoomControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const zoomName = "maplair-control-zoom", container = create("div", `${zoomName} maplair-bar`), options = this.options;
		this._zoomInButton = this._createButton(options.zoomInText, I18n.translate("Zoom in"), `${zoomName}-in`, container, (e) => this._zoom(e, 1));
		this._zoomOutButton = this._createButton(options.zoomOutText, I18n.translate("Zoom out"), `${zoomName}-out`, container, (e) => this._zoom(e, -1));
		this._updateDisabled();
		map.on("zoomend zoomlevelschange", this._updateDisabled, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("zoomend zoomlevelschange", this._updateDisabled, this);
	}
	/**
	* Disables the zoom buttons.
	* @returns {this}
	*/
	disable() {
		this._disabled = true;
		this._updateDisabled();
		return this;
	}
	/**
	* Enables the zoom buttons (if the zoom level allows).
	* @returns {this}
	*/
	enable() {
		this._disabled = false;
		this._updateDisabled();
		return this;
	}
	_zoom(e, dir) {
		const map = this._map;
		if (!this._disabled && (dir > 0 ? map._zoom < map.getMaxZoom() : map._zoom > map.getMinZoom())) {
			map._setUserEvent(e);
			map.zoomIn(dir * map.options.zoomDelta * (e.shiftKey ? 3 : 1));
		}
	}
	_createButton(html, title, className, container, fn) {
		const link = create("button", className, container);
		link.type = "button";
		link.innerHTML = html;
		link.title = title;
		link.setAttribute("aria-label", title);
		disableClickPropagation(link);
		on(link, "click", (e) => {
			stop(e);
			fn.call(this, e);
			this._refocusOnMap(e);
		});
		return link;
	}
	_updateDisabled() {
		const map = this._map;
		for (const [button, limit] of [[this._zoomInButton, map.getMaxZoom()], [this._zoomOutButton, map.getMinZoom()]]) {
			const disabled = this._disabled || map._zoom === limit;
			button.classList.toggle("maplair-disabled", disabled);
			button.setAttribute("aria-disabled", `${disabled}`);
		}
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ zoomControl: true });
		MaplairMap.addInitHook(function() {
			if (this.options.zoomControl) {
				this.zoomControl = new ZoomControl();
				this.addControl(this.zoomControl);
			}
		});
	}
};
// src/layer/LayerGroup.js
/** @import {Feature, FeatureCollection} from 'geojson' */
/** @import {InteractiveLayerOptions} from './Layer.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
* Used to group several layers and handle them as one. If you add it to the map,
* any layers added or removed from the group will be added/removed on the map as
* well. Extends `Layer`.
*
* @example
* ```js
* new LayerGroup([marker1, marker2])
* 	.addLayer(polyline)
* 	.addTo(map);
* ```
*/
var LayerGroup = class LayerGroup extends Layer {
	/**
	* Creates a layer group, optionally given an initial set of layers and an
	* `options` object.
	* @param {Layer[]} [layers]
	* @param {InteractiveLayerOptions} [options]
	*/
	constructor(layers, options) {
		super();
		setOptions(this, options);
		this._layers = {};
		for (const layer of layers ?? []) this.addLayer(layer);
		this.callInitHooks(LayerGroup);
	}
	/**
	* Adds the given layer to the group.
	* @param {Layer} layer
	* @returns {this}
	*/
	addLayer(layer) {
		const id = this.getLayerId(layer);
		this._layers[id] = layer;
		this._map?.addLayer(layer);
		return this;
	}
	/**
	* Removes the given layer, or the layer with the given internal ID, from the group.
	* @param {Layer|number} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		const id = layer in this._layers ? layer : this.getLayerId(layer);
		if (this._map && this._layers[id]) this._map.removeLayer(this._layers[id]);
		delete this._layers[id];
		return this;
	}
	/**
	* Returns `true` if the given layer, or the layer with the given internal ID, is
	* currently added to the group.
	* @param {Layer|number} layer
	* @returns {boolean}
	*/
	hasLayer(layer) {
		return (typeof layer === "number" ? layer : this.getLayerId(layer)) in this._layers;
	}
	/**
	* Removes all the layers from the group.
	* @returns {this}
	*/
	clearLayers() {
		return this.eachLayer(this.removeLayer, this);
	}
	/**
	* Adds the layers of the group to the map.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		this.eachLayer(map.addLayer, map);
	}
	/**
	* Removes the layers of the group from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		this.eachLayer(map.removeLayer, map);
	}
	/**
	* Iterates over the layers of the group, optionally specifying context of the
	* iterator function.
	* ```js
	* group.eachLayer(layer => layer.bindPopup('Hello'));
	* ```
	* @param {(layer: Layer) => void} method
	* @param {object} [context]
	* @returns {this}
	*/
	eachLayer(method, context) {
		for (const layer of Object.values(this._layers)) method.call(context, layer);
		return this;
	}
	/**
	* Returns the layer with the given internal ID.
	* @param {number} id
	* @returns {Layer|undefined}
	*/
	getLayer(id) {
		return this._layers[id];
	}
	/**
	* Returns an array of all the layers added to the group.
	* @returns {Layer[]}
	*/
	getLayers() {
		const layers = [];
		this.eachLayer(layers.push, layers);
		return layers;
	}
	/**
	* Calls `setZIndex` on every layer contained in this group, passing the z-index.
	* @param {number} zIndex
	* @returns {this}
	*/
	setZIndex(zIndex) {
		return this.eachLayer((l) => l.setZIndex?.(zIndex));
	}
	/**
	* Returns the internal ID for a layer.
	* @param {Layer} layer
	* @returns {number}
	*/
	getLayerId(layer) {
		return stamp(layer);
	}
	/**
	* Returns a GeoJSON `MultiPoint` Feature of the points of the group, used by
	* `toGeoJSON()`.
	* @internal
	* @param {number|false} [precision]
	* @returns {Feature}
	*/
	toMultiPoint(precision) {
		const coords = [];
		this.eachLayer((layer) => {
			coords.push(layer.toGeoJSON(precision).geometry.coordinates);
		});
		return getFeature(this, {
			type: "MultiPoint",
			coordinates: coords
		});
	}
	/**
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
	* given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
	* representation of the layer group (as a GeoJSON `FeatureCollection`,
	* `GeometryCollection`, or `MultiPoint`).
	* @param {number|false} [precision]
	* @returns {Feature|FeatureCollection}
	*/
	toGeoJSON(precision) {
		const type = this.feature?.geometry?.type;
		if (type === "MultiPoint") return this.toMultiPoint(precision);
		const isGeometryCollection = type === "GeometryCollection", jsons = [];
		this.eachLayer((layer) => {
			if (layer.toGeoJSON) {
				const json = layer.toGeoJSON(precision);
				if (isGeometryCollection) jsons.push(json.geometry);
				else {
					const feature = asFeature(json);
					if (feature.type === "FeatureCollection") jsons.push(...feature.features);
					else jsons.push(feature);
				}
			}
		});
		if (isGeometryCollection) return getFeature(this, {
			geometries: jsons,
			type: "GeometryCollection"
		});
		return {
			type: "FeatureCollection",
			features: jsons
		};
	}
};
// src/layer/FeatureGroup.js
/** @import {Layer, InteractiveLayerOptions} from './Layer.js' */
/** @import {LayerEvent} from '../core/Events.js' */
/** @import {PathOptions} from './vector/Path.js' */
/**
* Extended `LayerGroup` that makes it easier to do the same thing to all its member layers:
* * [`bindPopup`](#layer-bindpopup) binds a popup to all of the layers at once
*   (likewise with [`bindTooltip`](#layer-bindtooltip))
* * Events are propagated to the `FeatureGroup`, so if the group has an event
*   handler, it will handle events from any of the layers. This includes pointer
*   events and custom events.
* * Has `layeradd` and `layerremove` events
*
* @example
* ```js
* new FeatureGroup([marker1, marker2, polyline])
* 	.bindPopup('Hello world!')
* 	.on('click', function() { alert('Clicked on a member of the group!'); })
* 	.addTo(map);
* ```
*
* @fires layeradd {LayerEvent} Fired when a layer is added to this `FeatureGroup`.
* @fires layerremove {LayerEvent} Fired when a layer is removed from this `FeatureGroup`.
*/
var FeatureGroup = class FeatureGroup extends LayerGroup {
	/**
	* Creates a feature group, optionally given an initial set of layers and an
	* `options` object.
	* @overload
	* @param {Layer[]} [layers]
	* @param {InteractiveLayerOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(FeatureGroup);
	}
	/**
	* Adds the given layer to the group.
	* @param {Layer} layer
	* @returns {this}
	*/
	addLayer(layer) {
		if (this.hasLayer(layer)) return this;
		layer.addEventParent(this);
		super.addLayer(layer);
		return this.fire("layeradd", { layer });
	}
	/**
	* Removes the given layer, or the layer with the given internal ID, from the group.
	* @param {Layer|number} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		if (!this.hasLayer(layer)) return this;
		if (layer in this._layers) layer = this._layers[layer];
		layer.removeEventParent(this);
		super.removeLayer(layer);
		return this.fire("layerremove", { layer });
	}
	/**
	* Sets the given path options to each layer of the group that has a `setStyle` method.
	* @param {PathOptions} style
	* @returns {this}
	*/
	setStyle(style) {
		return this.eachLayer((l) => l.setStyle?.(style));
	}
	/**
	* Changes the `interactive` option of each layer of the group.
	* @param {boolean} interactive
	* @returns {this}
	*/
	setInteractive(interactive) {
		setOptions(this, { interactive: !!interactive });
		return this.eachLayer((l) => l.setInteractive?.(interactive));
	}
	/**
	* Brings the layer group to the top of all other layers.
	* @returns {this}
	*/
	bringToFront() {
		return this.eachLayer((l) => l.bringToFront?.());
	}
	/**
	* Brings the layer group to the back of all other layers.
	* @returns {this}
	*/
	bringToBack() {
		return this.eachLayer((l) => l.bringToBack?.());
	}
	/**
	* Returns the `LatLngBounds` of the feature group (created from bounds and
	* coordinates of its children, including the layers of nested layer groups).
	* @returns {LatLngBounds}
	*/
	getBounds() {
		const bounds = new LatLngBounds();
		for (const layer of Object.values(this._layers)) if (layer.getBounds) bounds.extend(layer.getBounds());
		else if (layer.getLatLng) bounds.extend(layer.getLatLng());
		else if (layer instanceof LayerGroup) bounds.extend(FeatureGroup.prototype.getBounds.call(layer));
		return bounds;
	}
};
// src/layer/DivOverlay.js
/** @import {InteractiveLayerOptions} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, MaplairEvent} from '../core/Events.js' */
/**
* The content of a `DivOverlay` (`Popup`, `Tooltip`): a string rendered as HTML, an
* `HTMLElement`, or a function receiving the source layer and returning one of them.
* @typedef {string|HTMLElement|((layer: Layer) => string|HTMLElement)} DivOverlayContent
*/
/**
* Options of `DivOverlay`.
* @typedef {object} DivOverlayOptions
* @property {boolean} [interactive=false] If true, the popup/tooltip will listen to the
* pointer events.
* @property {PointExpression} [offset=[0, 0]] The offset of the overlay position.
* @property {string} [className=''] A custom CSS class name to assign to the overlay.
* @property {string} [pane] `Map pane` where the overlay will be added.
* @property {boolean} [overflow=false] Whether the overlay may extend beyond the map
* container, e.g. a tooltip of a marker near the edge of a small map. The overlay is
* then shown as [popover](https://developer.mozilla.org/docs/Web/API/Popover_API) in
* the top layer of the page, above all other content, while remaining in its map pane
* in the DOM (for styling and events).
* @property {DivOverlayContent} [content=''] Sets the HTML content of the overlay while
* initializing. If a function is passed the source layer will be passed to the
* function. The function should return a `String` or `HTMLElement` to be used in the
* overlay. String content is rendered as HTML; sanitize untrusted input or pass an
* `HTMLElement` with safe `textContent` instead.
* @extends InteractiveLayerOptions
*/
/**
* Methods of `MaplairMap` for overlays.
* @lends MaplairMap.prototype
*/
const mapDivOverlayMethods = { _initOverlay(OverlayClass, content, latlng, options) {
	let overlay = content;
	if (!(overlay instanceof OverlayClass)) overlay = new OverlayClass(options).setContent(content);
	if (latlng) overlay.setLatLng(latlng);
	return overlay;
} };
/** @typedef {typeof mapDivOverlayMethods} MapDivOverlayMethods */
/**
* Methods of `Layer` for overlays.
* @lends Layer.prototype
*/
const layerDivOverlayMethods = { _initOverlay(OverlayClass, old, content, options) {
	let overlay = content;
	if (overlay instanceof OverlayClass) {
		setOptions(overlay, options);
		overlay._source = this;
	} else {
		overlay = old && !options ? old : new OverlayClass(options, this);
		overlay.setContent(content);
	}
	return overlay;
} };
/** @typedef {typeof layerDivOverlayMethods} LayerDivOverlayMethods */
/**
* Base model for Popup and Tooltip. Inherit from it for custom overlays like plugins.
*
* @fires contentupdate {MaplairEvent} Fired when the content of the overlay is updated.
*/
var DivOverlay = class DivOverlay extends Layer {
	static defaultOptions = {
		interactive: false,
		offset: [0, 0],
		className: "",
		pane: void 0,
		overflow: false,
		content: ""
	};
	/**
	* Instantiates an overlay given an optional `options` object that describes its
	* appearance and location and an optional `source` object that is used to tag the
	* overlay with a reference to the Layer to which it refers.
	* @overload
	* @param {DivOverlayOptions} [options]
	* @param {Layer} [source]
	*/
	/**
	* Instantiates an overlay given `latlng` where the overlay will open and an
	* optional `options` object that describes its appearance and location.
	* @overload
	* @param {LatLngExpression} latlng
	* @param {DivOverlayOptions} [options]
	*/
	/**
	* @param {DivOverlayOptions|LatLngExpression} [options]
	* @param {Layer|DivOverlayOptions} [source]
	*/
	constructor(options, source) {
		super();
		if (options instanceof LatLng || Array.isArray(options)) {
			this._latlng = new LatLng(options);
			setOptions(this, source);
		} else {
			setOptions(this, options);
			this._source = source;
		}
		if (this.options.content) this._content = this.options.content;
		this.callInitHooks(DivOverlay);
	}
	/**
	* Adds the overlay to the map.
	* Alternative to `map.openPopup(popup)`/`.openTooltip(tooltip)`.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	openOn(map) {
		map = arguments.length ? map : this._source._map;
		if (!map.hasLayer(this)) map.addLayer(this);
		return this;
	}
	/**
	* Closes the overlay.
	* Alternative to `map.closePopup(popup)`/`.closeTooltip(tooltip)`
	* and `layer.closePopup()`/`.closeTooltip()`.
	* @returns {this}
	*/
	close() {
		this._map?.removeLayer(this);
		return this;
	}
	/**
	* Opens or closes the overlay bound to layer depending on its current state.
	* Argument may be omitted only for overlay bound to layer.
	* Alternative to `layer.togglePopup()`/`.toggleTooltip()`.
	* @param {Layer} [layer]
	* @returns {this}
	*/
	toggle(layer) {
		if (this._map) this.close();
		else {
			if (arguments.length) this._source = layer;
			else layer = this._source;
			this._prepareOpen();
			this.openOn(layer._map);
		}
		return this;
	}
	/**
	* Adds the overlay to the map.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		if (!this._container) this._initLayout();
		if (map._fadeAnimated) this._container.style.opacity = "0";
		clearTimeout(this._removeTimeout);
		this.getPane().appendChild(this._container);
		if (this.options.overflow) {
			this._container.classList.add("maplair-overflow");
			this._container.popover = "manual";
			this._container.showPopover();
			this._onPageChange ??= () => this._updatePosition();
			document.addEventListener("scroll", this._onPageChange, {
				capture: true,
				passive: true
			});
			window.addEventListener("resize", this._onPageChange, { passive: true });
		}
		this.update();
		if (map._fadeAnimated) this._container.style.opacity = "1";
		if (!this.options.overflow) this.bringToFront();
		if (this.options.interactive) {
			this._container.classList.add("maplair-interactive");
			this.addInteractiveTarget(this._container);
		}
	}
	/**
	* Removes the overlay from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		if (this.options.overflow) {
			document.removeEventListener("scroll", this._onPageChange, { capture: true });
			window.removeEventListener("resize", this._onPageChange);
		}
		if (map._fadeAnimated) {
			this._container.style.opacity = "0";
			this._removeTimeout = setTimeout(() => this._container.remove(), 200);
		} else this._container.remove();
		if (this.options.interactive) {
			this._container.classList.remove("maplair-interactive");
			this.removeInteractiveTarget(this._container);
		}
	}
	_updateInteractive() {
		this._container.classList.toggle("maplair-interactive", this.options.interactive);
		if (this.options.interactive) this.addInteractiveTarget(this._container);
		else this.removeInteractiveTarget(this._container);
	}
	/**
	* Returns the geographical point of the overlay.
	* @returns {LatLng}
	*/
	getLatLng() {
		return this._latlng;
	}
	/**
	* Sets the geographical point where the overlay will open.
	* @param {LatLngExpression} latlng
	* @returns {this}
	*/
	setLatLng(latlng) {
		this._latlng = new LatLng(latlng);
		if (this._map) {
			this._updatePosition();
			this._adjustPan();
		}
		return this;
	}
	/**
	* Returns the content of the overlay.
	* @returns {DivOverlayContent}
	*/
	getContent() {
		return this._content;
	}
	/**
	* Sets the HTML content of the overlay. A `String` argument is rendered as
	* HTML; if it may contain untrusted input, sanitize it (e.g. with DOMPurify)
	* or pass an `HTMLElement` with safe `textContent` instead. If a function is
	* passed the source layer will be passed to the function. The function should
	* return a `String` or `HTMLElement` to be used in the overlay.
	* @param {DivOverlayContent} content
	* @returns {this}
	*/
	setContent(content) {
		this._content = content;
		this.update();
		return this;
	}
	/**
	* Returns the HTML container of the overlay.
	* @returns {HTMLElement}
	*/
	getElement() {
		return this._container;
	}
	/**
	* Updates the overlay content, layout and position. Useful for updating the
	* overlay after something inside changed, e.g. image loaded.
	* @returns {void}
	*/
	update() {
		if (!this._map) return;
		this._container.style.visibility = "hidden";
		this._updateContent();
		this._updateLayout();
		this._updatePosition();
		this._container.style.visibility = "";
		this._adjustPan();
	}
	/**
	* Returns the map events the overlay listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = {
			zoom: this._updatePosition,
			viewreset: this._updatePosition,
			zoomanim: this._animateZoom
		};
		if (this.options.overflow) events.move = this._updatePosition;
		return events;
	}
	/**
	* Returns `true` when the overlay is visible on the map.
	* @returns {boolean}
	*/
	isOpen() {
		return !!this._map && this._map.hasLayer(this);
	}
	/**
	* Brings this overlay in front of other overlays (in the same map pane).
	* @returns {this}
	*/
	bringToFront() {
		if (this._map) {
			toFront(this._container);
			this._restackPopovers();
		}
		return this;
	}
	/**
	* Brings this overlay to the back of other overlays (in the same map pane).
	* @returns {this}
	*/
	bringToBack() {
		if (this._map) {
			toBack(this._container);
			this._restackPopovers();
		}
		return this;
	}
	_restackPopovers() {
		if (!this.options.overflow) return;
		for (const el of this.getPane().children) {
			if (!el.classList.contains("maplair-overflow")) continue;
			if (el.matches(":popover-open")) el.hidePopover();
			el.showPopover();
		}
	}
	_prepareOpen(latlng) {
		let source = this._source;
		if (!source._map) return false;
		if (source instanceof FeatureGroup) {
			source = null;
			for (const layer of Object.values(this._source._layers)) if (layer._map) {
				source = layer;
				break;
			}
			if (!source) return false;
			this._source = source;
		}
		if (!latlng) {
			if (source.getCenter) latlng = source.getCenter();
			else if (source.getLatLng) latlng = source.getLatLng();
			else if (source.getBounds) latlng = source.getBounds().getCenter();
			else throw new Error("Unable to get source layer LatLng.");
		}
		this.setLatLng(latlng);
		if (this._map) this.update();
		return true;
	}
	_updateContent() {
		if (!this._content) return;
		const node = this._contentNode;
		const content = typeof this._content === "function" ? this._content(this._source ?? this) : this._content;
		if (typeof content === "string") node.innerHTML = content;
		else {
			while (node.hasChildNodes()) node.removeChild(node.firstChild);
			node.appendChild(content);
		}
		this.fire("contentupdate");
	}
	_updatePosition() {
		if (!this._map) return;
		const pos = this._map.latLngToLayerPoint(this._latlng)._round(), offset = Point.from(this.options.offset);
		this._setContainerPosition(pos.add(this._getAnchor()));
		const bottom = this._containerBottom = -offset.y, left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;
		if (this.options.overflow) {
			this._container.style.top = "auto";
			this._container.style.bottom = `calc(100% + ${bottom}px)`;
		} else this._container.style.bottom = `${bottom}px`;
		this._container.style.left = `${left}px`;
	}
	_setContainerPosition(pos) {
		this._containerPos = pos;
		if (this.options.overflow) {
			const mapContainer = this._map._container, rect = mapContainer.getBoundingClientRect();
			pos = this._map.layerPointToContainerPoint(pos)._add(new Point(rect.left + mapContainer.clientLeft, rect.top + mapContainer.clientTop));
		}
		setPosition(this._container, pos);
	}
	_getContainerPosition() {
		return this._containerPos ?? new Point(0, 0);
	}
	_getAnchor() {
		return [0, 0];
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.include(mapDivOverlayMethods);
		Layer.include(layerDivOverlayMethods);
	}
};
// src/layer/Popup.js
/** @import {DivOverlayOptions, DivOverlayContent} from './DivOverlay.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, MaplairEvent, PopupEvent} from '../core/Events.js' */
/**
* Options of `Popup`.
* @typedef {object} PopupOptions
* @property {string} [pane='popupPane'] `Map pane` where the popup will be added.
* @property {PointExpression} [offset=[0, 7]] The offset of the popup position.
* @property {number} [maxWidth=300] Max width of the popup, in pixels.
* @property {number} [minWidth=50] Min width of the popup, in pixels.
* @property {number|null} [maxHeight=null] If set, creates a scrollable container of
* the given height inside a popup if its content exceeds it. The scrollable container
* can be styled using the `maplair-popup-scrolled` CSS class selector.
* @property {boolean} [autoPan=true] Set it to `false` if you don't want the map to do
* panning animation to fit the opened popup.
* @property {PointExpression|null} [autoPanPaddingTopLeft=null] The margin between the
* popup and the top left corner of the map view after autopanning was performed.
* @property {PointExpression|null} [autoPanPaddingBottomRight=null] The margin between
* the popup and the bottom right corner of the map view after autopanning was
* performed.
* @property {PointExpression} [autoPanPadding=[5, 5]] Equivalent of setting both top
* left and bottom right autopan padding to the same value.
* @property {boolean} [keepInView=false] Set it to `true` if you want to prevent users
* from panning the popup off of the screen while it is open.
* @property {boolean} [closeButton=true] Controls the presence of a close button in
* the popup.
* @property {boolean} [autoClose=true] Set it to `false` if you want to override the
* default behavior of the popup closing when another popup is opened.
* @property {boolean} [closeOnEscapeKey=true] Set it to `false` if you want to
* override the default behavior of the ESC key for closing of the popup.
* @property {boolean} [closeOnClick] Set it if you want to override the default
* behavior of the popup closing when user clicks on the map. Defaults to the map's
* [`closePopupOnClick`](#map-closepopuponclick) option.
* @property {string} [className=''] A custom CSS class name to assign to the popup.
* @property {boolean} [trackResize=true] Whether the popup shall react to changes in
* the size of its contents (e.g. when an image inside the popup loads) and reposition
* itself.
* @extends DivOverlayOptions
*/
/**
* Map options of `Popup`.
* @typedef {object} PopupMapOptions
* @lends MaplairMapOptions
* @property {boolean} [closePopupOnClick=true] Set it to `false` if you don't want
* popups to close when user clicks the map.
*/
/**
* Methods of `MaplairMap` for popups.
* @lends MaplairMap.prototype
* @fires MaplairMap#popupopen {PopupEvent} Fired when a popup is opened in the map.
* @fires MaplairMap#popupclose {PopupEvent} Fired when a popup in the map is closed.
* @fires MaplairMap#autopanstart {MaplairEvent} Fired when the map starts autopanning
* when opening a popup.
*/
const mapPopupMethods = {
	/**
	* Opens the specified popup while closing the previously opened (to make sure only
	* one is opened at one time for usability).
	*
	* Alternatively, creates a popup with the specified content and options and opens
	* it in the given point on a map. String content is rendered as HTML; sanitize
	* untrusted input or pass an `HTMLElement` with safe `textContent` instead.
	* @group Methods for layers and controls
	* @param {Popup|DivOverlayContent} popup The popup, or the content of a new popup.
	* @param {LatLngExpression} [latlng]
	* @param {PopupOptions} [options]
	* @returns {this}
	*/
	openPopup(popup, latlng, options) {
		this._initOverlay(Popup, popup, latlng, options).openOn(this);
		return this;
	},
	/**
	* Closes the popup previously opened with [openPopup](#map-openpopup) (or the
	* given one).
	* @group Methods for layers and controls
	* @param {Popup} [popup]
	* @returns {this}
	*/
	closePopup(popup) {
		popup = arguments.length ? popup : this._popup;
		popup?.close();
		return this;
	}
};
/** @typedef {typeof mapPopupMethods} MapPopupMethods */
/**
* Methods of `Layer` for popups. All layers share a set of methods convenient for
* binding popups to it.
*
* ```js
* const layer = new Polygon(latlngs).bindPopup('Hi There!').addTo(map);
* layer.openPopup();
* layer.closePopup();
* ```
*
* Popups will also be automatically opened when the layer is clicked on and closed
* when the layer is removed from the map or another popup is opened.
*
* @lends Layer.prototype
* @fires Layer#popupopen {PopupEvent} Fired when a popup bound to this layer is opened.
* @fires Layer#popupclose {PopupEvent} Fired when a popup bound to this layer is closed.
*/
const layerPopupMethods = {
	/**
	* Binds a popup to the layer with the passed `content` and sets up the
	* necessary event listeners. A `String` argument is rendered as HTML; if it
	* may contain untrusted input, sanitize it (e.g. with DOMPurify) or pass an
	* `HTMLElement` with safe `textContent` instead. If a `Function` is passed
	* it will receive the layer as the first argument and should return a
	* `String` or `HTMLElement`.
	* @group Popup methods
	* @param {DivOverlayContent|Popup} content
	* @param {PopupOptions} [options]
	* @returns {this}
	*/
	bindPopup(content, options) {
		this._popup = this._initOverlay(Popup, this._popup, content, options);
		this.on({
			click: this._openPopup,
			remove: this.closePopup,
			move: this._movePopup
		});
		return this;
	},
	/**
	* Removes the popup previously bound with `bindPopup`.
	* @group Popup methods
	* @returns {this}
	*/
	unbindPopup() {
		if (this._popup) {
			this.off({
				click: this._openPopup,
				remove: this.closePopup,
				move: this._movePopup
			});
			this._popup = null;
		}
		return this;
	},
	/**
	* Opens the bound popup at the specified `latlng` or at the default popup anchor
	* if no `latlng` is passed.
	* @group Popup methods
	* @param {LatLngExpression} [latlng]
	* @returns {this}
	*/
	openPopup(latlng) {
		if (this._popup) {
			if (!(this instanceof FeatureGroup)) this._popup._source = this;
			if (this._popup._prepareOpen(latlng || this._latlng)) this._popup.openOn(this._map);
		}
		return this;
	},
	/**
	* Closes the popup bound to this layer if it is open.
	* @group Popup methods
	* @returns {this}
	*/
	closePopup() {
		this._popup?.close();
		return this;
	},
	/**
	* Opens or closes the popup bound to this layer depending on its current state.
	* @group Popup methods
	* @returns {this}
	*/
	togglePopup() {
		this._popup?.toggle(this);
		return this;
	},
	/**
	* Returns `true` if the popup bound to this layer is currently open.
	* @group Popup methods
	* @returns {boolean}
	*/
	isPopupOpen() {
		return this._popup?.isOpen() ?? false;
	},
	/**
	* Sets the content of the popup bound to this layer. String content is rendered
	* as HTML; sanitize untrusted input or pass an `HTMLElement` with safe
	* `textContent` instead.
	* @group Popup methods
	* @param {DivOverlayContent} content
	* @returns {this}
	*/
	setPopupContent(content) {
		this._popup?.setContent(content);
		return this;
	},
	/**
	* Returns the popup bound to this layer.
	* @group Popup methods
	* @returns {Popup|undefined}
	*/
	getPopup() {
		return this._popup;
	},
	_openPopup(e) {
		if (!this._popup || !this._map) return;
		stopPropagation(e);
		const target = e.propagatedFrom ?? e.target;
		if (this._popup._source === target && !(target instanceof Path)) {
			if (this._map.hasLayer(this._popup)) this.closePopup();
			else this.openPopup(e.latlng);
			return;
		}
		this._popup._source = target;
		this.openPopup(e.latlng);
	},
	_movePopup(e) {
		this._popup.setLatLng(e.latlng);
	}
};
/** @typedef {typeof layerPopupMethods} LayerPopupMethods */
/**
* Used to open popups in certain places of the map. Use [Map.openPopup](#map-openpopup) to
* open popups while making sure that only one popup is open at one time
* (recommended for usability), or use [Map.addLayer](#map-addlayer) to open as many as you want.
*
* @example
* If you want to just bind a popup to marker click and then open it, it's really easy:
*
* ```js
* marker.bindPopup(popupContent).openPopup();
* ```
* Path overlays like polylines also have a `bindPopup` method.
*
* A popup can be also standalone:
*
* ```js
* const popup = new Popup()
* 	.setLatLng(latlng)
* 	.setContent('<p>Hello world!<br />This is a nice popup.</p>')
* 	.openOn(map);
* ```
* or
* ```js
* const popup = new Popup(latlng, {content: '<p>Hello world!<br />This is a nice popup.</p>'})
* 	.openOn(map);
* ```
*
* **Security note.** Popup string content is rendered as HTML. If your content
* may include untrusted input (e.g. data from users or external APIs), sanitize
* it with a library like [DOMPurify](https://github.com/cure53/DOMPurify), or
* build a DOM element using `textContent` to render it as plain text:
*
* ```js
* const el = document.createElement('div');
* el.textContent = untrustedString;
* marker.bindPopup(el);
* ```
*/
var Popup = class Popup extends DivOverlay {
	static defaultOptions = {
		pane: "popupPane",
		offset: [0, 7],
		maxWidth: 300,
		minWidth: 50,
		maxHeight: null,
		autoPan: true,
		autoPanPaddingTopLeft: null,
		autoPanPaddingBottomRight: null,
		autoPanPadding: [5, 5],
		keepInView: false,
		closeButton: true,
		autoClose: true,
		closeOnEscapeKey: true,
		className: "",
		trackResize: true
	};
	/**
	* Instantiates a `Popup` object given an optional `options` object that describes
	* its appearance and location and an optional `source` object that is used to tag
	* the popup with a reference to the Layer to which it refers.
	* @overload
	* @param {PopupOptions} [options]
	* @param {Layer} [source]
	*/
	/**
	* Instantiates a `Popup` object given `latlng` where the popup will open and an
	* optional `options` object that describes its appearance and location.
	* @overload
	* @param {LatLngExpression} latlng
	* @param {PopupOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(Popup);
	}
	/**
	* Alternative to `map.openPopup(popup)`.
	* Adds the popup to the map and closes the previous one.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	openOn(map) {
		map = arguments.length ? map : this._source._map;
		if (!map.hasLayer(this) && map._popup && map._popup.options.autoClose) map.removeLayer(map._popup);
		map._popup = this;
		return super.openOn(map);
	}
	/**
	* Adds the popup to the map.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		const active = document.activeElement;
		this._returnFocus = map._container.contains(active) && !this._container?.contains(active) ? active : null;
		super.onAdd(map);
		if (this._source?._clickedByKeyboard) {
			if (!this._closeButton) this._container.tabIndex = -1;
			(this._closeButton ?? this._container).focus({ preventScroll: true });
		}
		map.fire("popupopen", { popup: this });
		if (this._source) {
			this._source.fire("popupopen", { popup: this }, true);
			if (!(this._source instanceof Path)) this._source.on("preclick", stopPropagation);
		}
	}
	/**
	* Removes the popup from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		if (this._container.contains(document.activeElement) && this._returnFocus?.isConnected) this._returnFocus.focus({ preventScroll: true });
		this._returnFocus = null;
		super.onRemove(map);
		map.fire("popupclose", { popup: this });
		if (this._source) {
			this._source.fire("popupclose", { popup: this }, true);
			if (!(this._source instanceof Path)) this._source.off("preclick", stopPropagation);
		}
	}
	/**
	* Returns the map events the popup listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = super.getEvents();
		if (this.options.closeOnClick ?? this._map.options.closePopupOnClick) events.preclick = this.close;
		if (this.options.keepInView) events.moveend = this._adjustPan;
		return events;
	}
	_initLayout() {
		const prefix = "maplair-popup", container = this._container = create("div", `${prefix} ${this.options.className || ""} maplair-zoom-animated`);
		const wrapper = this._wrapper = create("div", `${prefix}-content-wrapper`, container);
		this._contentNode = create("div", `${prefix}-content`, wrapper);
		disableClickPropagation(container);
		disableScrollPropagation(this._contentNode);
		on(container, "contextmenu", stopPropagation);
		this._tipContainer = create("div", `${prefix}-tip-container`, container);
		this._tip = create("div", `${prefix}-tip`, this._tipContainer);
		if (this.options.closeButton) {
			const closeButton = this._closeButton = create("button", `${prefix}-close-button`, container);
			closeButton.type = "button";
			closeButton.setAttribute("aria-label", I18n.translate("Close popup"));
			closeButton.innerHTML = "<span aria-hidden=\"true\">&#215;</span>";
			on(closeButton, "click", (ev) => {
				ev.preventDefault();
				this.close();
			});
		}
		if (this.options.trackResize) {
			this._resizeObserver = new ResizeObserver(() => {
				if (!this._map) return;
				this._updateLayout();
				this._updatePosition();
				this._adjustPan();
			});
			this._resizeObserver.observe(this._contentNode);
		}
	}
	_updateLayout() {
		const container = this._contentNode, style = container.style;
		style.maxWidth = `${this.options.maxWidth}px`;
		style.minWidth = `${this.options.minWidth}px`;
		style.height = "";
		const maxHeight = this.options.maxHeight, scrolled = !!maxHeight && container.offsetHeight > maxHeight;
		if (scrolled) style.height = `${maxHeight}px`;
		container.classList.toggle("maplair-popup-scrolled", scrolled);
		this._containerWidth = this._container.offsetWidth;
		this._containerHeight = this._container.offsetHeight;
		this._containerMarginBottom = parseInt(getComputedStyle(this._container).marginBottom, 10) || 0;
	}
	_animateZoom(e) {
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center), anchor = this._getAnchor();
		this._setContainerPosition(pos.add(anchor));
	}
	_adjustPan() {
		if (!this.options.autoPan) return;
		this._map._panAnim?.stop();
		if (!this._map) return;
		if (this._autopanning) {
			this._autopanning = false;
			return;
		}
		const map = this._map, marginBottom = this._containerMarginBottom ?? (parseInt(getComputedStyle(this._container).marginBottom, 10) || 0), containerHeight = this._containerHeight + marginBottom, containerWidth = this._containerWidth, layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);
		layerPos._add(this._getContainerPosition());
		const containerPos = map.layerPointToContainerPoint(layerPos), padding = Point.from(this.options.autoPanPadding), paddingTL = Point.from(this.options.autoPanPaddingTopLeft ?? padding), paddingBR = Point.from(this.options.autoPanPaddingBottomRight ?? padding), size = map.getSize();
		let dx = 0, dy = 0;
		if (containerPos.x + containerWidth + paddingBR.x > size.x) dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		if (containerPos.x - dx - paddingTL.x < 0) dx = containerPos.x - paddingTL.x;
		if (containerPos.y + containerHeight + paddingBR.y > size.y) dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		if (containerPos.y - dy - paddingTL.y < 0) dy = containerPos.y - paddingTL.y;
		if (dx || dy) {
			if (this.options.keepInView) this._autopanning = true;
			map.fire("autopanstart").panBy([dx, dy]);
		}
	}
	_getAnchor() {
		return new Point(this._source?._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ closePopupOnClick: true });
		MaplairMap.include(mapPopupMethods);
		Layer.include(layerPopupMethods);
	}
};
// src/layer/Tooltip.js
const directions = [
	"top",
	"bottom",
	"center",
	"right",
	"left"
];
const tipSize = 6;
const autoPadding = 4;
function shiftInto(start, size, min, max) {
	return Math.max(0, min - start) - Math.max(0, start + size - max);
}
function clampTip(tipShift, size) {
	const max = Math.max(0, size / 2 - 12);
	return Math.round(Math.min(max, Math.max(-max, tipShift)));
}
/** @import {DivOverlayOptions, DivOverlayContent} from './DivOverlay.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, TooltipEvent} from '../core/Events.js' */
/**
* Options of `Tooltip`.
* @typedef {object} TooltipOptions
* @property {string} [pane='tooltipPane'] `Map pane` where the tooltip will be added.
* @property {PointExpression} [offset=[0, 0]] Optional offset of the tooltip position.
* @property {'right'|'left'|'top'|'bottom'|'center'|'auto'} [direction='auto']
* Direction where to open the tooltip. Possible values are: `right`, `left`, `top`,
* `bottom`, `center`, `auto`. `auto` chooses the direction with enough space when
* opening the tooltip: preferably the side towards the center of the map (`right` or
* `left`), otherwise the opposite side, `top` or `bottom`. The tooltip is shifted
* along that side to stay within the map (within the viewport if `overflow` is set),
* its tip still pointing at the source.
* @property {boolean} [permanent=false] Whether to open the tooltip permanently or only
* on pointerover.
* @property {boolean} [sticky=false] If true, the tooltip will follow the pointer
* instead of being fixed at the feature center.
* @property {number} [opacity=0.9] Tooltip container opacity.
* @extends DivOverlayOptions
*/
/**
* Methods of `MaplairMap` for tooltips.
* @lends MaplairMap.prototype
* @fires MaplairMap#tooltipopen {TooltipEvent} Fired when a tooltip is opened in the map.
* @fires MaplairMap#tooltipclose {TooltipEvent} Fired when a tooltip in the map is closed.
*/
const mapTooltipMethods = {
	/**
	* Opens the specified tooltip.
	*
	* Alternatively, creates a tooltip with the specified content and options and
	* opens it. String content is rendered as HTML; sanitize untrusted input or pass
	* an `HTMLElement` with safe `textContent` instead.
	* @group Methods for layers and controls
	* @param {Tooltip|DivOverlayContent} tooltip The tooltip, or the content of a new
	* tooltip.
	* @param {LatLngExpression} [latlng]
	* @param {TooltipOptions} [options]
	* @returns {this}
	*/
	openTooltip(tooltip, latlng, options) {
		this._initOverlay(Tooltip, tooltip, latlng, options).openOn(this);
		return this;
	},
	/**
	* Closes the tooltip given as parameter.
	* @group Methods for layers and controls
	* @param {Tooltip} tooltip
	* @returns {this}
	*/
	closeTooltip(tooltip) {
		tooltip.close();
		return this;
	}
};
/** @typedef {typeof mapTooltipMethods} MapTooltipMethods */
/**
* Methods of `Layer` for tooltips. All layers share a set of methods convenient for
* binding tooltips to it.
*
* ```js
* const layer = new Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
* layer.openTooltip();
* layer.closeTooltip();
* ```
*
* @lends Layer.prototype
* @fires Layer#tooltipopen {TooltipEvent} Fired when a tooltip bound to this layer is
* opened.
* @fires Layer#tooltipclose {TooltipEvent} Fired when a tooltip bound to this layer is
* closed.
*/
const layerTooltipMethods = {
	/**
	* Binds a tooltip to the layer with the passed `content` and sets up the
	* necessary event listeners. A `String` argument is rendered as HTML; if it
	* may contain untrusted input, sanitize it (e.g. with DOMPurify) or pass an
	* `HTMLElement` with safe `textContent` instead. If a `Function` is passed
	* it will receive the layer as the first argument and should return a
	* `String` or `HTMLElement`.
	* @group Tooltip methods
	* @param {DivOverlayContent|Tooltip} content
	* @param {TooltipOptions} [options]
	* @returns {this}
	*/
	bindTooltip(content, options) {
		const old = this.isTooltipOpen() ? null : this._tooltip;
		if (this._tooltip) this.unbindTooltip();
		this._tooltip = this._initOverlay(Tooltip, old, content, options);
		this._initTooltipInteractions();
		if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) this.openTooltip();
		return this;
	},
	/**
	* Removes the tooltip previously bound with `bindTooltip`.
	* @group Tooltip methods
	* @returns {this}
	*/
	unbindTooltip() {
		if (this._tooltip) {
			this._initTooltipInteractions(true);
			this.closeTooltip();
			this._tooltip = null;
		}
		return this;
	},
	_initTooltipInteractions(remove) {
		const { permanent, sticky } = this._tooltip.options, events = {
			remove: this.closeTooltip,
			move: this._moveTooltip
		};
		if (permanent) events.add = this._openTooltip;
		else {
			events.pointerover = this._openTooltip;
			events.pointerout = this.closeTooltip;
			events.click = this._openTooltip;
			events.add = this._toggleFocusListeners;
			if (this._map) this._toggleFocusListeners(!remove);
		}
		if (sticky) events.pointermove = this._moveTooltip;
		this[remove ? "off" : "on"](events);
	},
	/**
	* Opens the bound tooltip at the specified `latlng` or at the default tooltip
	* anchor if no `latlng` is passed.
	* @group Tooltip methods
	* @param {LatLngExpression} [latlng]
	* @returns {this}
	*/
	openTooltip(latlng) {
		if (this._tooltip) {
			if (!(this instanceof FeatureGroup)) this._tooltip._source = this;
			if (this._tooltip._prepareOpen(latlng)) {
				this._tooltip.openOn(this._map);
				if (this.getElement) this._setAriaDescribedByOnLayer(this);
				else if (this.eachLayer) this.eachLayer(this._setAriaDescribedByOnLayer, this);
			}
		}
		return this;
	},
	/**
	* Closes the tooltip bound to this layer if it is open.
	* @group Tooltip methods
	* @returns {this}
	*/
	closeTooltip() {
		this._tooltip?.close();
		return this;
	},
	/**
	* Opens or closes the tooltip bound to this layer depending on its current state.
	* @group Tooltip methods
	* @returns {this}
	*/
	toggleTooltip() {
		this._tooltip?.toggle(this);
		return this;
	},
	/**
	* Returns `true` if the tooltip bound to this layer is currently open.
	* @group Tooltip methods
	* @returns {boolean}
	*/
	isTooltipOpen() {
		return this._tooltip?.isOpen() ?? false;
	},
	/**
	* Sets the content of the tooltip bound to this layer. String content is rendered
	* as HTML; sanitize untrusted input or pass an `HTMLElement` with safe
	* `textContent` instead.
	* @group Tooltip methods
	* @param {DivOverlayContent} content
	* @returns {this}
	*/
	setTooltipContent(content) {
		this._tooltip?.setContent(content);
		return this;
	},
	/**
	* Returns the tooltip bound to this layer.
	* @group Tooltip methods
	* @returns {Tooltip|undefined}
	*/
	getTooltip() {
		return this._tooltip;
	},
	_toggleFocusListeners(add) {
		if (this.getElement) this._addFocusListenersOnLayer(this, !add);
		else if (this.eachLayer) this.eachLayer((layer) => this._addFocusListenersOnLayer(layer, !add), this);
	},
	_addFocusListenersOnLayer(layer, remove) {
		const el = typeof layer.getElement === "function" && layer.getElement();
		if (el) {
			const toggle = remove ? off : on;
			if (!remove) {
				el._maplair_focus_handler && off(el, "focus", el._maplair_focus_handler, this);
				el._maplair_focus_handler = () => {
					if (this._tooltip) {
						this._tooltip._source = layer;
						this.openTooltip();
					}
				};
			}
			el._maplair_focus_handler && toggle(el, "focus", el._maplair_focus_handler, this);
			toggle(el, "blur", this.closeTooltip, this);
			if (remove) delete el._maplair_focus_handler;
		}
	},
	_setAriaDescribedByOnLayer(layer) {
		(typeof layer.getElement === "function" && layer.getElement())?.setAttribute?.("aria-describedby", this._tooltip._container.id);
	},
	_openTooltip(e) {
		if (!this._tooltip || !this._map) return;
		if (this._map.dragging?.moving()) {
			if (e.type === "add" && !this._moveEndOpensTooltip) {
				this._moveEndOpensTooltip = true;
				this._map.once("moveend", () => {
					this._moveEndOpensTooltip = false;
					this._openTooltip(e);
				});
			}
			return;
		}
		this._tooltip._source = e.propagatedFrom ?? e.target;
		this.openTooltip(this._tooltip.options.sticky ? e.latlng : void 0);
	},
	_moveTooltip(e) {
		let latlng = e.latlng, containerPoint, layerPoint;
		if (this._tooltip.options.sticky && e.originalEvent) {
			containerPoint = this._map.pointerEventToContainerPoint(e.originalEvent);
			layerPoint = this._map.containerPointToLayerPoint(containerPoint);
			latlng = this._map.layerPointToLatLng(layerPoint);
		}
		this._tooltip.setLatLng(latlng);
	}
};
/** @typedef {typeof layerTooltipMethods} LayerTooltipMethods */
/**
* Used to display small texts on top of map layers.
*
* @example
* If you want to just bind a tooltip to marker:
*
* ```js
* marker.bindTooltip("my tooltip text").openTooltip();
* ```
* Path overlays like polylines also have a `bindTooltip` method.
*
* A tooltip can be also standalone:
*
* ```js
* const tooltip = new Tooltip()
* 	.setLatLng(latlng)
* 	.setContent('Hello world!<br />This is a nice tooltip.')
* 	.addTo(map);
* ```
* or
* ```js
* const tooltip = new Tooltip(latlng, {content: 'Hello world!<br />This is a nice tooltip.'})
* 	.addTo(map);
* ```
*
* **Security note.** Tooltip string content is rendered as HTML. If your content
* may include untrusted input (e.g. data from users or external APIs), sanitize
* it with a library like [DOMPurify](https://github.com/cure53/DOMPurify), or
* build a DOM element using `textContent` to render it as plain text:
*
* ```js
* const el = document.createElement('div');
* el.textContent = untrustedString;
* marker.bindTooltip(el);
* ```
*
* Note about tooltip offset. Maplair takes two options in consideration
* for computing tooltip offsetting:
* - the `offset` Tooltip option: it defaults to [0, 0], and it's specific to one tooltip.
*   Add a positive x offset to move the tooltip to the right, and a positive y offset to
*   move it to the bottom. Negatives will move to the left and top.
* - the `tooltipAnchor` Icon option: this will only be considered for Marker. You
*   should adapt this value if you use a custom icon.
*/
var Tooltip = class Tooltip extends DivOverlay {
	static defaultOptions = {
		pane: "tooltipPane",
		offset: [0, 0],
		direction: "auto",
		permanent: false,
		sticky: false,
		opacity: .9
	};
	/**
	* Instantiates a `Tooltip` object given an optional `options` object that describes
	* its appearance and location and an optional `source` object that is used to tag
	* the tooltip with a reference to the Layer to which it refers.
	* @overload
	* @param {TooltipOptions} [options]
	* @param {Layer} [source]
	*/
	/**
	* Instantiates a `Tooltip` object given `latlng` where the tooltip will open and an
	* optional `options` object that describes its appearance and location.
	* @overload
	* @param {LatLngExpression} latlng
	* @param {TooltipOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(Tooltip);
	}
	/**
	* Adds the tooltip to the map.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		super.onAdd(map);
		this.setOpacity(this.options.opacity);
		map.fire("tooltipopen", { tooltip: this });
		if (this._source) {
			this.addEventParent(this._source);
			this._source.fire("tooltipopen", { tooltip: this }, true);
		}
	}
	/**
	* Removes the tooltip from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		super.onRemove(map);
		map.fire("tooltipclose", { tooltip: this });
		if (this._source) {
			this.removeEventParent(this._source);
			this._source.fire("tooltipclose", { tooltip: this }, true);
		}
	}
	/**
	* Returns the map events the tooltip listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = super.getEvents();
		if (!this.options.permanent) events.preclick = this.close;
		return events;
	}
	_initLayout() {
		const className = `maplair-tooltip ${this.options.className || ""} maplair-zoom-animated`;
		this._contentNode = this._container = create("div", className);
		this._container.setAttribute("role", "tooltip");
		this._container.setAttribute("id", `maplair-tooltip-${stamp(this)}`);
	}
	_updateLayout() {}
	_adjustPan() {}
	/**
	* Updates the tooltip content, layout and position.
	* @returns {void}
	*/
	update() {
		this._autoDirection = void 0;
		super.update();
	}
	_setPosition(pos) {
		let direction = this.options.direction, shift = new Point(0, 0);
		const container = this._container, tooltipWidth = container.offsetWidth, tooltipHeight = container.offsetHeight, offset = new Point(this.options.offset), anchor = this._getAnchor();
		if (!directions.includes(direction)) {
			({direction, shift} = this._getAutoPlacement(pos, offset, anchor, tooltipWidth, tooltipHeight));
			if (direction === "left") {
				offset.x = -offset.x;
				anchor.x = -anchor.x;
			}
		}
		let subX = tooltipWidth / 2, subY = tooltipHeight / 2;
		if (direction === "top") subY = tooltipHeight;
		else if (direction === "bottom") subY = 0;
		else if (direction === "right") subX = 0;
		else if (direction === "left") subX = tooltipWidth;
		pos = pos.subtract(new Point(subX, subY, true)).add(offset).add(anchor).add(shift);
		container.classList.remove("maplair-tooltip-right", "maplair-tooltip-left", "maplair-tooltip-top", "maplair-tooltip-bottom");
		container.classList.add(`maplair-tooltip-${direction}`);
		const tipShift = direction === "top" || direction === "bottom" ? clampTip(-shift.x, tooltipWidth) : clampTip(-shift.y, tooltipHeight);
		if (tipShift) container.style.setProperty("--maplair-tooltip-tip-shift", `${tipShift}px`);
		else container.style.removeProperty("--maplair-tooltip-tip-shift");
		this._setContainerPosition(pos);
	}
	_getAutoPlacement(pos, offset, anchor, width, height) {
		const area = this._getAutoArea(), point = this._map.layerPointToContainerPoint(pos), x = point.x + offset.x + anchor.x, y = point.y + offset.y + anchor.y, space = {
			right: area.max.x - x - width - tipSize,
			left: point.x - offset.x - anchor.x - area.min.x - width - tipSize,
			top: y - area.min.y - height - tipSize,
			bottom: area.max.y - y - height - tipSize
		};
		if (!this._autoDirection) {
			const sides = point.x < (area.min.x + area.max.x) / 2 ? ["right", "left"] : ["left", "right"], fallback = space.right >= space.left ? "right" : "left";
			this._autoDirection = [
				...sides,
				"top",
				"bottom"
			].find((d) => space[d] >= 0 && (d === "right" || d === "left" || width <= area.max.x - area.min.x)) ?? fallback;
		}
		const direction = this._autoDirection;
		return {
			direction,
			shift: direction === "top" || direction === "bottom" ? new Point(shiftInto(x - width / 2, width, area.min.x, area.max.x), 0) : new Point(0, shiftInto(y - height / 2, height, area.min.y, area.max.y))
		};
	}
	_getAutoArea() {
		const map = this._map;
		let min = new Point(0, 0), max = map.getSize();
		if (this.options.overflow) {
			const mapContainer = map._container, rect = mapContainer.getBoundingClientRect(), origin = new Point(rect.left + mapContainer.clientLeft, rect.top + mapContainer.clientTop), viewport = document.documentElement;
			min = min.subtract(origin);
			max = new Point(viewport.clientWidth, viewport.clientHeight).subtract(origin);
		}
		const padding = new Point(autoPadding, autoPadding);
		return {
			min: min.add(padding),
			max: max.subtract(padding)
		};
	}
	_updatePosition() {
		const pos = this._map.latLngToLayerPoint(this._latlng)._round();
		this._setPosition(pos);
	}
	/**
	* Sets the opacity of the tooltip.
	* @param {number} opacity
	* @returns {void}
	*/
	setOpacity(opacity) {
		this.options.opacity = opacity;
		if (this._container) this._container.style.opacity = `${opacity}`;
	}
	_animateZoom(e) {
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
		this._setPosition(pos);
	}
	_getAnchor() {
		return new Point(this._source?._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.include(mapTooltipMethods);
		Layer.include(layerTooltipMethods);
	}
};
// src/layer/vector/Renderer.getRenderer.js
var Renderer_getRenderer_exports = /* @__PURE__ */ __exportAll({ register: () => register });
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {Path} from './Path.js' */
/** @import {Renderer} from './Renderer.js' */
/**
* Methods of `MaplairMap` for the renderers of vector layers.
* @lends MaplairMap.prototype
*/
const mapRendererMethods = {
	/**
	* Returns the instance of `Renderer` that should be used to render the given
	* `Path`. It will ensure that the `renderer` options of the map and paths
	* are respected, and that the renderers do exist on the map.
	* @internal
	* @param {Path} layer
	* @returns {Renderer}
	*/
	getRenderer(layer) {
		const renderer = layer.options.renderer ?? this._getPaneRenderer(layer) ?? this.options.renderer ?? (this._renderer ??= layer._createRenderer());
		if (!this.hasLayer(renderer)) this.addLayer(renderer);
		return renderer;
	},
	_getPaneRenderer(layer) {
		const name = layer.options.pane;
		if (name === "overlayPane" || name === void 0) return;
		let renderer = this._paneRenderers[name];
		if (!renderer) {
			const Renderer = this.options.renderer?.constructor;
			renderer = Renderer ? new Renderer({
				...this.options.renderer.options,
				pane: name
			}) : layer._createRenderer({ pane: name });
			this._paneRenderers[name] = renderer;
		}
		return renderer;
	}
};
/** @typedef {typeof mapRendererMethods} MapRendererMethods */
/**
* Map options of the vector renderers.
* @typedef {object} RendererMapOptions
* @lends MaplairMapOptions
* @property {Renderer} [renderer] The default method for drawing vector layers on the
* map. A new `SVG` renderer by default; pass `new Canvas()` to draw them on a canvas
* instead.
*/
/**
* Registers `getRenderer()` and related methods on the given map class, called by
* `MaplairMap` itself.
* @internal
* @param {typeof MaplairMap} MaplairMap
*/
function register(MaplairMap) {
	MaplairMap.include(mapRendererMethods);
	MaplairMap.addInitHook(function() {
		if (this.options.preferCanvas !== void 0) console.error("MaplairMap: preferCanvas option has been removed. Use renderer: new Canvas() instead.");
	});
}
// src/core/Handler.js
/** @import {MaplairMap} from '../map/Map.js' */
/**
* Abstract class for map interaction handlers, the base class of the handlers that
* are used internally to inject interaction features like dragging to classes like
* `MaplairMap` and `Marker`.
*
* Classes inheriting from `Handler` must implement the two following extension methods:
*
* * `addHooks()` is called when the handler is enabled, should add event hooks.
* * `removeHooks()` is called when the handler is disabled, should remove the event
*   hooks added previously.
*/
var Handler = class Handler extends Class {
	/**
	* @param {MaplairMap} map The map the handler belongs to.
	*/
	constructor(map) {
		super();
		this._map = map;
		this.callInitHooks(Handler);
	}
	/**
	* Enables the handler.
	* @returns {this}
	*/
	enable() {
		if (this._enabled) return this;
		this._enabled = true;
		this.addHooks();
		return this;
	}
	/**
	* Disables the handler.
	* @returns {this}
	*/
	disable() {
		if (!this._enabled) return this;
		this._enabled = false;
		this.removeHooks();
		return this;
	}
	/**
	* Returns `true` if the handler is enabled.
	* @returns {boolean}
	*/
	enabled() {
		return !!this._enabled;
	}
	/**
	* Adds a new handler of this class to the given map with the given name, which is
	* then available as the property of the map with this name.
	* @template {typeof Handler} T
	* @this {T}
	* @param {MaplairMap} map
	* @param {string} name
	* @returns {T}
	*/
	static addTo(map, name) {
		map.addHandler(name, this);
		return this;
	}
};
// src/map/handler/BoxZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/**
* The event object of `boxzoomend`.
* @typedef {object} BoxZoomEndEvent
* @property {LatLngBounds} boxZoomBounds The bounds of the box the map was zoomed to.
* @extends MaplairEvent
*/
/**
* Map options of `BoxZoomHandler`.
* @typedef {object} BoxZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean} [boxZoom=true] Whether the map can be zoomed to a rectangular
* area specified by dragging the pointer while pressing the shift key.
*/
/**
* Handler of `MaplairMap` for box zoom.
* @typedef {object} BoxZoomHandlerMapProperties
* @lends MaplairMap
* @property {BoxZoomHandler} boxZoom Box (shift-drag with pointer) zoom handler.
*/
/**
* Adds shift-drag zoom interaction to the map (zoom to a selected bounding box),
* enabled by default, see the map option `boxZoom`.
*
* @fires MaplairMap#boxzoomstart {MaplairEvent} Fired when the user starts drawing
* a box to zoom to.
* @fires MaplairMap#boxzoomend {BoxZoomEndEvent} Fired when the user has drawn a box
* and the map is zoomed to it.
*/
var BoxZoomHandler = class BoxZoomHandler extends Handler {
	/**
	* @param {MaplairMap} map
	*/
	constructor(map) {
		super(map);
		this.callInitHooks(BoxZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "pointerdown", this._onPointerDown, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "pointerdown", this._onPointerDown, this);
	}
	/**
	* Returns `true` if a box has been drawn by the current or last interaction.
	* @returns {boolean}
	*/
	moved() {
		return this._moved;
	}
	_resetState() {
		clearTimeout(this._resetStateTimeout);
		this._moved = false;
	}
	_toggleListeners(onOff) {
		onOff(this._map._container, {
			contextmenu: stop,
			pointermove: this._onPointerMove,
			pointerup: this._onPointerUp
		}, this);
		onOff(document, "keydown", this._onKeyDown, this);
	}
	_onPointerDown(e) {
		if (!e.shiftKey || e.button !== 0) return false;
		this._resetState();
		preventDefault(e);
		this._startPoint = this._map.pointerEventToContainerPoint(e);
		this._toggleListeners(on);
	}
	_onPointerMove(e) {
		const map = this._map;
		if (!this._moved) {
			this._moved = true;
			this._box = create("div", "maplair-zoom-box", map._container);
			map._container.classList.add("maplair-crosshair");
			map.fire("boxzoomstart");
		}
		this._point = map.pointerEventToContainerPoint(e);
		const bounds = new Bounds(this._point, this._startPoint), size = bounds.getSize();
		setPosition(this._box, bounds.min);
		this._box.style.width = `${size.x}px`;
		this._box.style.height = `${size.y}px`;
	}
	_finish() {
		if (this._moved) {
			this._box.remove();
			this._map._container.classList.remove("maplair-crosshair");
		}
		this._toggleListeners(off);
	}
	_onPointerUp(e) {
		if (e.button !== 0) return;
		this._finish();
		if (!this._moved) return;
		this._resetStateTimeout = setTimeout(() => this._resetState(), 0);
		const bounds = new LatLngBounds(this._map.containerPointToLatLng(this._startPoint), this._map.containerPointToLatLng(this._point));
		this._map._setUserEvent(e);
		if (this._map.getBoundsZoom(bounds) !== Infinity) this._map.fitBounds(bounds);
		this._map.fire("boxzoomend", { boxZoomBounds: bounds });
	}
	_onKeyDown(e) {
		if (e.code === "Escape") {
			this._finish();
			this._resetState();
		}
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ boxZoom: true });
		MaplairMap.addInitHook("addHandler", "boxZoom", BoxZoomHandler);
	}
};
// src/map/handler/DoubleClickZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
/**
* Map options of `DoubleClickZoomHandler`.
* @typedef {object} DoubleClickZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|'center'} [doubleClickZoom=true] Whether the map can be zoomed in
* by double clicking on it and zoomed out by double clicking while holding shift. If
* passed `'center'`, double-click zoom will zoom to the center of the view regardless
* of where the pointer was.
*/
/**
* Handler of `MaplairMap` for double-click zoom.
*
* Map properties include interaction handlers that allow you to control interaction
* behavior in runtime, enabling or disabling certain features such as dragging or
* touch zoom (see `Handler` methods). For example:
*
* ```js
* map.doubleClickZoom.disable();
* ```
*
* @typedef {object} DoubleClickZoomHandlerMapProperties
* @lends MaplairMap
* @property {DoubleClickZoomHandler} doubleClickZoom Double click zoom handler.
*/
/**
* Handles double-click zoom on the map, enabled by default, see the map option
* `doubleClickZoom`.
*/
var DoubleClickZoomHandler = class DoubleClickZoomHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(DoubleClickZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		this._map.on("dblclick", this._onDoubleClick, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		this._map.off("dblclick", this._onDoubleClick, this);
	}
	_onDoubleClick(e) {
		const map = this._map, oldZoom = map.getZoom(), delta = map.options.zoomDelta, zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;
		map._setUserEvent(e.originalEvent);
		if (map.options.doubleClickZoom === "center") map.setZoom(zoom);
		else map.setZoomAround(e.containerPoint, zoom);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ doubleClickZoom: true });
		MaplairMap.addInitHook("addHandler", "doubleClickZoom", DoubleClickZoomHandler);
	}
};
// src/dom/Draggable.js
/** @import {MaplairEvent, DragEndEvent} from '../core/Events.js' */
/**
* Options of `Draggable`.
* @typedef {object} DraggableOptions
* @property {number} [clickTolerance=3] The max number of pixels a user can shift the
* pointer during a click for it to be considered a valid click (as opposed to a
* pointer drag).
*/
/**
* The event object of `dragstart`, `predrag` and `drag` of `Draggable`.
* @typedef {object} DraggableEvent
* @property {PointerEvent} originalEvent The DOM event of the pointer which drags.
* @extends MaplairEvent
*/
/**
* A class for making DOM elements draggable.
* Used internally for map and marker dragging. Works on any DOM element.
*
* @example
* ```js
* const draggable = new Draggable(elementToDrag);
* draggable.enable();
* ```
*
* @fires down {MaplairEvent} Fired when a drag is about to start.
* @fires dragstart {DraggableEvent} Fired when a drag starts.
* @fires predrag {DraggableEvent} Fired continuously during dragging *before* each
* corresponding update of the element's position.
* @fires drag {DraggableEvent} Fired continuously during dragging.
* @fires dragend {DragEndEvent} Fired when the drag ends (with `noInertia: true` if
* the drag was finished without inertia, e.g. by disabling the draggable).
*/
var Draggable = class Draggable extends Evented {
	static defaultOptions = { clickTolerance: 3 };
	/**
	* Creates a `Draggable` object for moving `element` when you start dragging the
	* `dragStartTarget` element (equals `element` itself by default).
	* @param {HTMLElement} element
	* @param {HTMLElement} [dragStartTarget]
	* @param {DraggableOptions} [options]
	*/
	constructor(element, dragStartTarget, options) {
		if (typeof options === "boolean") throw new Error("Draggable: the preventOutline argument is removed in Maplair. Pass options as the third argument.");
		super();
		setOptions(this, options);
		this._element = element;
		this._dragStartTarget = dragStartTarget ?? element;
		this.callInitHooks(Draggable);
	}
	/**
	* Enables the dragging ability.
	* @returns {void}
	*/
	enable() {
		if (this._enabled) return;
		on(this._dragStartTarget, "pointerdown", this._onDown, this);
		this._enabled = true;
	}
	/**
	* Disables the dragging ability.
	* @returns {void}
	*/
	disable() {
		if (!this._enabled) return;
		if (Draggable._dragging === this) this.finishDrag(true);
		off(this._dragStartTarget, "pointerdown", this._onDown, this);
		this._enabled = false;
		this._moved = false;
	}
	_onDown(e) {
		this._moved = false;
		if (this._element.classList.contains("maplair-zoom-anim")) return;
		if (getPointers().length !== 1) {
			if (Draggable._dragging === this) this.finishDrag();
			return;
		}
		if (Draggable._dragging || e.shiftKey || e.button !== 0 && e.pointerType !== "touch") return;
		Draggable._dragging = this;
		disableImageDrag();
		if (this._moving) return;
		this.fire("down");
		const sizedParent = getSizedParentNode(this._element);
		this._startPoint = new Point(e.clientX, e.clientY);
		this._startPos = getPosition(this._element);
		this._parentScale = getScale(sizedParent);
		on(this._dragStartTarget, "pointermove", this._onMove, this);
		on(this._dragStartTarget, "pointerup pointercancel lostpointercapture", this._onUp, this);
	}
	_onMove(e) {
		if (getPointers().length > 1) {
			this._moved = true;
			return;
		}
		const offset = new Point(e.clientX, e.clientY)._subtract(this._startPoint);
		const dist = Math.abs(offset.x) + Math.abs(offset.y);
		if (!this._moved && (!dist || dist < this.options.clickTolerance)) return;
		offset.x /= this._parentScale.x;
		offset.y /= this._parentScale.y;
		if (e.cancelable) e.preventDefault();
		if (!this._moved) {
			this.fire("dragstart", { originalEvent: e });
			this._moved = true;
			this._draggingContainer = this._element.closest(".maplair-container") ?? this._element;
			this._draggingContainer.classList.add("maplair-dragging");
			this._lastTarget = e.target;
			this._lastTarget.classList.add("maplair-drag-target");
		}
		this._newPos = this._startPos.add(offset);
		this._moving = true;
		this._lastEvent = e;
		this._updatePosition();
	}
	_updatePosition() {
		const e = { originalEvent: this._lastEvent };
		this.fire("predrag", e);
		const dpr = window.devicePixelRatio;
		this._newPos = this._newPos.multiplyBy(dpr)._round()._divideBy(dpr);
		setPosition(this._element, this._newPos);
		this.fire("drag", e);
	}
	_onUp(e) {
		if (e.type === "lostpointercapture" && e.buttons) return;
		this.finishDrag();
	}
	/**
	* Ends the current drag.
	* @internal
	* @param {boolean} [noInertia]
	* @returns {void}
	*/
	finishDrag(noInertia) {
		this._draggingContainer?.classList.remove("maplair-dragging");
		this._draggingContainer = null;
		if (this._lastTarget) {
			this._lastTarget.classList.remove("maplair-drag-target");
			this._lastTarget = null;
		}
		off(this._dragStartTarget, "pointermove", this._onMove, this);
		off(this._dragStartTarget, "pointerup pointercancel lostpointercapture", this._onUp, this);
		enableImageDrag();
		const fireDragend = this._moved && this._moving;
		this._moving = false;
		Draggable._dragging = false;
		if (fireDragend) this.fire("dragend", {
			noInertia,
			distance: this._newPos.distanceTo(this._startPos)
		});
	}
};
// src/map/handler/DragHandler.js
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent, DragEndEvent} from '../../core/Events.js' */
/**
* Map options of `DragHandler`, the interaction options for dragging.
* @typedef {object} DragHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean} [dragging=true] Whether the map is draggable with pointer or not.
* @property {boolean} [inertia=true] If enabled, panning of the map will have an
* inertia effect where the map builds momentum while dragging and continues moving in
* the same direction for some time. Feels especially nice on touch devices.
* @property {number} [inertiaDeceleration=3400] The rate with which the inertial
* movement slows down, in pixels/second².
* @property {number} [inertiaMaxSpeed=1400] Max speed of the inertial movement,
* in pixels/second.
* @property {number} [easeLinearity=0.2] The linearity of the easing of the inertial
* movement.
* @property {boolean} [worldCopyJump=false] With this option enabled, the map tracks
* when you pan to another "copy" of the world and seamlessly jumps to the original one
* so that all overlays like markers and vector layers are still visible. A map with an
* infinite CRS, such as `SimpleCRS`, does not jump, as it has no copies of the world.
* @property {number} [maxBoundsViscosity=0.0] If `maxBounds` is set, this option will
* control how solid the bounds are when dragging the map around. The default value of
* `0.0` allows the user to drag outside the bounds at normal speed, higher values will
* slow down map dragging outside bounds, and `1.0` makes the bounds fully solid,
* preventing the user from dragging outside the bounds.
*/
/**
* Handler of `MaplairMap` for dragging.
* @typedef {object} DragHandlerMapProperties
* @lends MaplairMap
* @property {DragHandler} dragging Map dragging handler.
*/
/**
* Makes the map draggable (with panning inertia), enabled by default, see the map
* option `dragging`.
*
* @fires MaplairMap#dragstart {MaplairEvent} Fired when the user starts dragging the map.
* @fires MaplairMap#drag {MaplairEvent} Fired repeatedly while the user drags the map.
* @fires MaplairMap#dragend {DragEndEvent} Fired when the user stops dragging the map.
*/
var DragHandler = class DragHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(DragHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		if (!this._draggable) {
			const map = this._map;
			this._draggable = new Draggable(map._mapPane, map._container);
			this._draggable.on({
				down: this._onDown,
				dragstart: this._onDragStart,
				drag: this._onDrag,
				dragend: this._onDragEnd
			}, this);
			this._draggable.on("predrag", this._onPreDragLimit, this);
			if (map.options.worldCopyJump) this._draggable.on("predrag", this._onPreDragWrap, this);
		}
		this._map._container.classList.add("maplair-grab", "maplair-touch-drag");
		this._draggable.enable();
		this._positions = [];
		this._times = [];
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		this._map._container.classList.remove("maplair-grab", "maplair-touch-drag");
		this._draggable.disable();
	}
	/**
	* Returns `true` if the map has been moved by the current or last drag.
	* @returns {boolean}
	*/
	moved() {
		return this._draggable?._moved;
	}
	/**
	* Returns `true` while the map is being dragged.
	* @returns {boolean}
	*/
	moving() {
		return this._draggable?._moving;
	}
	_onDown() {
		this._map._stop();
	}
	_onDragStart(e) {
		const map = this._map;
		map._stop();
		map._setUserEvent(e.originalEvent);
		if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
			const bounds = LatLngBounds.from(this._map.options.maxBounds);
			this._offsetLimit = new Bounds(this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1), this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1).add(this._map.getSize()));
			this._viscosity = Math.min(1, Math.max(0, this._map.options.maxBoundsViscosity));
		} else this._offsetLimit = null;
		map.fire("movestart").fire("dragstart");
		if (map.options.inertia) {
			this._positions = [];
			this._times = [];
		}
	}
	_onDrag(e) {
		if (this._map.options.inertia) {
			const time = this._lastTime = Date.now(), pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;
			this._positions.push(pos);
			this._times.push(time);
			this._prunePositions(time);
		}
		this._map.fire("move", e).fire("drag", e);
	}
	_prunePositions(time) {
		while (this._positions.length > 1 && time - this._times[0] > 50) {
			this._positions.shift();
			this._times.shift();
		}
	}
	_viscousLimit(value, threshold) {
		return value - (value - threshold) * this._viscosity;
	}
	_onPreDragLimit() {
		if (!this._viscosity || !this._offsetLimit) return;
		const offset = this._draggable._newPos.subtract(this._draggable._startPos);
		const limit = this._offsetLimit;
		if (offset.x < limit.min.x) offset.x = this._viscousLimit(offset.x, limit.min.x);
		if (offset.y < limit.min.y) offset.y = this._viscousLimit(offset.y, limit.min.y);
		if (offset.x > limit.max.x) offset.x = this._viscousLimit(offset.x, limit.max.x);
		if (offset.y > limit.max.y) offset.y = this._viscousLimit(offset.y, limit.max.y);
		this._draggable._newPos = this._draggable._startPos.add(offset);
	}
	_onPreDragWrap() {
		const draggable = this._draggable;
		draggable._absPos = draggable._newPos;
		draggable._newPos = this._map._wrapWorldCopy(draggable._newPos);
	}
	_onDragEnd(e) {
		const map = this._map, options = map.options, noInertia = !options.inertia || e.noInertia || this._times.length < 2;
		map.fire("dragend", e);
		if (noInertia) map.fire("moveend");
		else {
			this._prunePositions(Date.now());
			const direction = this._lastPos.subtract(this._positions[0]), duration = (this._lastTime - this._times[0]) / 1e3, ease = options.easeLinearity, speedVector = direction.multiplyBy(ease / duration), speed = speedVector.distanceTo([0, 0]), limitedSpeed = Math.min(options.inertiaMaxSpeed, speed), limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed), maxOffset = map.getSize().divideBy(2);
			let decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease), offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();
			if (map._prefersReducedMotion() && !maxOffset.contains(offset)) {
				const k = Math.min(maxOffset.x / Math.abs(offset.x), maxOffset.y / Math.abs(offset.y));
				offset = offset.multiplyBy(k).round();
				decelerationDuration *= Math.sqrt(k);
			}
			if (!offset.x && !offset.y) map.fire("moveend");
			else {
				offset = map._limitOffset(offset, map.options.maxBounds);
				requestAnimationFrame(() => {
					map.panBy(offset, {
						duration: decelerationDuration,
						easeLinearity: ease,
						noMoveStart: true,
						animate: true
					});
				});
			}
		}
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			dragging: true,
			inertia: true,
			inertiaDeceleration: 3400,
			inertiaMaxSpeed: 1400,
			easeLinearity: .2,
			worldCopyJump: false,
			maxBoundsViscosity: 0
		});
		MaplairMap.addInitHook("addHandler", "dragging", DragHandler);
	}
};
// src/map/handler/KeyboardHandler.js
/** @import {MaplairMap} from '../Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/**
* Map options of `KeyboardHandler`, the keyboard navigation options.
* @typedef {object} KeyboardHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean} [keyboard=true] Makes the map focusable and allows users to
* navigate the map with keyboard arrows and `+`/`-` keys.
* @property {number} [keyboardPanDelta=80] Amount of pixels to pan when pressing an
* arrow key.
* @property {boolean|string} [ariaKeyShortcuts=false] Sets the `aria-keyshortcuts`
* attribute of the map container. ARIA names keys by what they type on a given layout,
* so `true` uses the names for a US English layout, which can be wrong for pages in
* other languages; pass a string to set the value for your audience's layout instead.
*/
/**
* Handler of `MaplairMap` for keyboard navigation.
* @typedef {object} KeyboardHandlerMapProperties
* @lends MaplairMap
* @property {KeyboardHandler} keyboard Keyboard navigation handler.
*/
/**
* Handles keyboard interaction with the map, enabled by default, see the map option
* `keyboard`. The `?` key shows a list of the keyboard shortcuts.
*
* @fires MaplairMap#focus {MaplairEvent} Fired when the map gains focus.
* @fires MaplairMap#blur {MaplairEvent} Fired when the map loses focus.
*/
var KeyboardHandler = class KeyboardHandler extends Handler {
	/**
	* The [values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
	* of the keys for panning and zooming the map, so zoom keys follow the keyboard
	* layout and cover the numpad too; `=` and `_` keep the US `+` and `-` keys working
	* both with and without Shift.
	* @type {Record<'left'|'right'|'down'|'up'|'zoomIn'|'zoomOut', string[]>}
	*/
	static keys = {
		left: ["ArrowLeft"],
		right: ["ArrowRight"],
		down: ["ArrowDown"],
		up: ["ArrowUp"],
		zoomIn: ["+", "="],
		zoomOut: ["-", "_"]
	};
	/**
	* @param {MaplairMap} map
	*/
	constructor(map) {
		super(map);
		this.callInitHooks(KeyboardHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		const container = this._map._container;
		if (container.tabIndex <= 0) container.tabIndex = 0;
		const shortcuts = this._map.options.ariaKeyShortcuts;
		if (shortcuts) container.ariaKeyShortcuts = shortcuts === true ? "ArrowLeft ArrowRight ArrowUp ArrowDown = Plus -" : shortcuts;
		on(container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown,
			keydown: this._onContainerKeyDown
		}, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(document, "keydown", this._onKeyDown, this);
		if (this._map.options.ariaKeyShortcuts) this._map._container.removeAttribute("aria-keyshortcuts");
		off(this._map._container, {
			focus: this._onFocus,
			blur: this._onBlur,
			pointerdown: this._onPointerDown,
			keydown: this._onContainerKeyDown
		}, this);
		this._help?.remove();
		this._help = null;
	}
	_toggleHelp() {
		this._help ??= this._createHelp();
		this._help.togglePopover();
	}
	_createHelp() {
		const help = create("div", "maplair-keyboard-help", this._map._container), title = I18n.translate("Keyboard shortcuts");
		help.popover = "auto";
		help.setAttribute("role", "dialog");
		help.setAttribute("aria-label", title);
		create("h2", "", help).textContent = title;
		const list = create("dl", "", help);
		for (const [keys, description] of [
			[[
				"←",
				"→",
				"↑",
				"↓"
			], I18n.translate("Pan the map")],
			[["+"], I18n.translate("Zoom in")],
			[["−"], I18n.translate("Zoom out")],
			[["Shift"], I18n.translate("Pan or zoom further, together with the keys above")],
			[["Esc"], I18n.translate("Close popup")],
			[["?"], I18n.translate("Show or hide the keyboard shortcuts")]
		]) {
			const row = create("div", "", list), dt = create("dt", "", row);
			for (const key of keys) create("kbd", "", dt).textContent = key;
			create("dd", "", row).textContent = description;
		}
		disableClickPropagation(help);
		disableScrollPropagation(help);
		return help;
	}
	_onPointerDown() {
		if (this._focused) return;
		this._map._container.focus({
			preventScroll: true,
			focusVisible: false
		});
	}
	_onFocus() {
		this._focused = true;
		on(document, "keydown", this._onKeyDown, this);
		this._map.fire("focus");
	}
	_onBlur() {
		this._focused = false;
		off(document, "keydown", this._onKeyDown, this);
		this._map.fire("blur");
	}
	_onContainerKeyDown(e) {
		const map = this._map, popup = map._popup;
		if (e.key !== "Escape" || e.defaultPrevented || !popup?.options.closeOnEscapeKey || map._controlContainer?.contains(e.target)) return;
		const inPopup = popup._container.contains(e.target), icon = popup._source?._icon;
		map.closePopup();
		e.preventDefault();
		if (inPopup) (icon?.tabIndex >= 0 ? icon : map._container).focus();
	}
	_onKeyDown(e) {
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.key === "?") {
			this._toggleHelp();
			stop(e);
			return;
		}
		const key = e.key, map = this._map, { left, right, down, up, zoomIn, zoomOut } = KeyboardHandler.keys, x = +right.includes(key) - +left.includes(key), y = +down.includes(key) - +up.includes(key), dz = +zoomIn.includes(key) - +zoomOut.includes(key), k = e.shiftKey ? 3 : 1;
		if (x || y) {
			if (!map._panAnim?._inProgress) {
				let offset = new Point(x, y).multiplyBy(k * map.options.keyboardPanDelta);
				if (map.options.maxBounds) offset = map._limitOffset(offset, map.options.maxBounds);
				map._setUserEvent(e);
				map.panBy(offset);
			}
		} else if (dz) {
			if (!map._zoomInputBlocked()) {
				map._setUserEvent(e);
				map.setZoom(map.getZoom() + k * dz * map.options.zoomDelta);
			}
		} else return;
		stop(e);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			keyboard: true,
			keyboardPanDelta: 80,
			ariaKeyShortcuts: false
		});
		MaplairMap.addInitHook("addHandler", "keyboard", KeyboardHandler);
	}
};
// src/map/handler/PinchZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
/**
* Map options of `PinchZoomHandler`, touch interaction options.
* @typedef {object} PinchZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|'center'} [pinchZoom=true] Whether the map can be zoomed by
* touch-dragging with two fingers. If passed `'center'`, it will zoom to the center of
* the view regardless of where the touch events (fingers) were. Enabled for
* touch-capable web browsers.
* @property {boolean} [bounceAtZoomLimits=true] Set it to false if you don't want the
* map to zoom beyond min/max zoom and then bounce back when pinch-zooming.
* @property {boolean|'center'} [touchZoom] Deprecated, use `pinchZoom` instead.
*/
/**
* Handler of `MaplairMap` for pinch zoom.
* @typedef {object} PinchZoomHandlerMapProperties
* @lends MaplairMap
* @property {PinchZoomHandler} pinchZoom Pinch zoom handler.
* @property {PinchZoomHandler} touchZoom Deprecated, the same as `pinchZoom`.
*/
/**
* Adds pinch zoom to the map on supported mobile browsers, enabled by default, see the
* map option `pinchZoom`.
*/
var PinchZoomHandler = class PinchZoomHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(PinchZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		this._map._container.classList.add("maplair-touch-zoom");
		on(this._map._container, "pointerdown", this._onPointerStart, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		this._map._container.classList.remove("maplair-touch-zoom");
		off(this._map._container, "pointerdown", this._onPointerStart, this);
		off(this._map._container, "pointermove", this._onPointerMove, this);
		off(this._map._container, "pointerup pointercancel", this._onPointerEnd, this);
	}
	_onPointerStart(e) {
		const map = this._map;
		const pointers = getPointers();
		if (pointers.length !== 2 || map._animatingZoom || this._zooming) return;
		const p1 = map.pointerEventToContainerPoint(pointers[0]);
		const p2 = map.pointerEventToContainerPoint(pointers[1]);
		const { x, y } = getScale(map._container);
		this._containerScale = new Point(x, y);
		this._containerOrigin = new Point(pointers[0].clientX, pointers[0].clientY)._subtract(p1.scaleBy(this._containerScale));
		this._centerPoint = map.getSize()._divideBy(2);
		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
		if (map.options.pinchZoom !== "center") this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
		this._startDist = p1.distanceTo(p2);
		this._startZoom = map.getZoom();
		this._moved = false;
		this._zooming = true;
		map._stop();
		on(this._map._container, "pointermove", this._onPointerMove, this);
		on(this._map._container, "pointerup pointercancel", this._onPointerEnd, this);
		e.preventDefault();
	}
	_onPointerMove(e) {
		const pointers = getPointers();
		if (pointers.length !== 2 || !this._zooming) return;
		const map = this._map, p1 = this._toContainerPoint(pointers[0]), p2 = this._toContainerPoint(pointers[1]), scale = p1.distanceTo(p2) / this._startDist;
		this._zoom = map.getScaleZoom(scale, this._startZoom);
		if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale < 1 || this._zoom > map.getMaxZoom() && scale > 1)) this._zoom = map._limitZoom(this._zoom);
		if (map.options.pinchZoom === "center") {
			this._center = this._startLatLng;
			if (scale === 1) return;
		} else {
			const delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
			if (scale === 1 && delta.x === 0 && delta.y === 0) return;
			this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
		}
		if (!this._moved) {
			map._setUserEvent(e);
			map._moveStart(true, false);
			this._moved = true;
		}
		cancelAnimationFrame(this._animRequest);
		const moveFn = map._move.bind(map, this._center, this._zoom, {
			pinch: true,
			round: false
		}, void 0);
		this._animRequest = requestAnimationFrame(moveFn.bind(this));
		e.preventDefault();
	}
	_toContainerPoint(e) {
		return new Point(e.clientX, e.clientY)._subtract(this._containerOrigin).unscaleBy(this._containerScale);
	}
	_onPointerEnd() {
		off(this._map._container, "pointermove", this._onPointerMove, this);
		off(this._map._container, "pointerup pointercancel", this._onPointerEnd, this);
		if (!this._moved || !this._zooming) {
			this._zooming = false;
			return;
		}
		this._zooming = false;
		cancelAnimationFrame(this._animRequest);
		if (this._map._zoomAnimated) this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
		else this._map._resetView(this._center, this._map._limitZoom(this._zoom));
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			pinchZoom: true,
			bounceAtZoomLimits: true
		});
		MaplairMap.addInitHook("addHandler", "pinchZoom", PinchZoomHandler);
		MaplairMap.addInitHook(function() {
			this.touchZoom = this.pinchZoom;
			if (this.options.touchZoom !== void 0) {
				console.warn("Map: touchZoom option is deprecated and will be removed in future versions. Use pinchZoom instead.");
				this.options.pinchZoom = this.options.touchZoom;
				delete this.options.touchZoom;
			}
			if (this.options.pinchZoom) this.pinchZoom.enable();
			else this.pinchZoom.disable();
		});
	}
};
// src/map/handler/ScrollWheelZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
const pinchPxPerZoomLevel = 100;
const gestureEndDelay$1 = 150;
/**
* Map options of `ScrollWheelZoomHandler`, the mouse wheel options.
* @typedef {object} ScrollWheelZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|'center'|'trackpad'} [scrollWheelZoom=true] Whether the map can
* be zoomed by using the mouse wheel and by pinching on a touchpad (or using the mouse
* wheel with the Ctrl key). If passed `'center'`, it will zoom to the center of the
* view regardless of where the pointer was. If passed `'trackpad'`, scrolling (e.g.
* with two fingers on a touchpad) pans the map instead, while pinching still zooms.
* @property {number} [wheelDebounceTime=40] Limits the rate at which a wheel can fire
* (in milliseconds). By default, the user can't zoom via wheel more often than once
* per 40 ms.
* @property {number} [wheelPxPerZoomLevel=60] How many scroll pixels (as reported by
* [DomEvent.getWheelDelta](#domevent-getwheeldelta)) mean a change of one full zoom
* level. Smaller values will make wheel-zooming faster (and vice versa).
*/
/**
* Handler of `MaplairMap` for scroll wheel zoom.
* @typedef {object} ScrollWheelZoomHandlerMapProperties
* @lends MaplairMap
* @property {ScrollWheelZoomHandler} scrollWheelZoom Scroll wheel zoom handler.
*/
/**
* Enables mouse scroll wheel zoom on the map, as well as touchpad gestures: pinching
* zooms, and with `scrollWheelZoom: 'trackpad'` scrolling with two fingers pans.
* Enabled by default, see the map option `scrollWheelZoom`.
*/
var ScrollWheelZoomHandler = class ScrollWheelZoomHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(ScrollWheelZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "wheel", this._onWheelScroll, this);
		on(this._map._container, "gesturestart", this._onGestureStart, this);
		on(this._map._container, "gesturechange", this._onGestureChange, this);
		on(this._map._container, "gestureend", this._onGestureEnd, this);
		this._delta = 0;
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "wheel", this._onWheelScroll, this);
		off(this._map._container, "gesturestart", this._onGestureStart, this);
		off(this._map._container, "gesturechange", this._onGestureChange, this);
		off(this._map._container, "gestureend", this._onGestureEnd, this);
		clearTimeout(this._timer);
		this._endPinch();
		this._endPan();
	}
	_onWheelScroll(e) {
		if (e.ctrlKey) {
			stop(e);
			const delta = -e.deltaY * (e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 60 : 1);
			this._pinchTo(e, (this._pinch?.zoom ?? this._map.getZoom()) + delta / pinchPxPerZoomLevel);
			clearTimeout(this._pinchTimer);
			this._pinchTimer = setTimeout(this._endPinch.bind(this), gestureEndDelay$1);
			return;
		}
		if (this._map.options.scrollWheelZoom === "trackpad") {
			this._panBy(e);
			return;
		}
		this._onWheelZoom(e);
	}
	_onGestureStart(e) {
		if (getPointers().length) return;
		stop(e);
		this._gestureStartZoom = this._map.getZoom();
	}
	_onGestureChange(e) {
		if (this._gestureStartZoom === void 0) return;
		stop(e);
		this._pinchTo(e, this._gestureStartZoom + Math.log2(e.scale));
	}
	_onGestureEnd(e) {
		if (this._gestureStartZoom === void 0) return;
		stop(e);
		this._gestureStartZoom = void 0;
		this._endPinch();
	}
	_pinchTo(e, zoom, eased) {
		const map = this._map;
		if (!this._pinch) {
			if (map._animatingZoom) return;
			map._stop();
			const point = map.pointerEventToContainerPoint(e), offset = point.subtract(map.getSize()._divideBy(2));
			this._pinch = {
				aroundLatLng: map.options.scrollWheelZoom === "center" ? map.getCenter() : map.containerPointToLatLng(point),
				offset: map.options.scrollWheelZoom === "center" ? new Point(0, 0) : offset
			};
			map._setUserEvent(e);
			map._moveStart(true, false);
		}
		if (!map.options.bounceAtZoomLimits || eased) zoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), zoom));
		this._pinch.zoom = zoom;
		this._pinch.shown ??= map.getZoom();
		const frame = () => {
			const pinch = this._pinch, delta = pinch.zoom - pinch.shown;
			pinch.shown = eased && Math.abs(delta) > .01 ? pinch.shown + delta * .3 : pinch.zoom;
			map._move(this._getPinchCenter(pinch.shown), pinch.shown, {
				pinch: true,
				round: false
			});
			if (pinch.shown !== pinch.zoom) this._pinchFrame = requestAnimationFrame(frame);
		};
		cancelAnimationFrame(this._pinchFrame);
		this._pinchFrame = requestAnimationFrame(frame);
	}
	_getPinchCenter(zoom) {
		const { aroundLatLng, offset } = this._pinch, map = this._map;
		return map.unproject(map.project(aroundLatLng, zoom).subtract(offset), zoom);
	}
	_endPinch() {
		clearTimeout(this._pinchTimer);
		if (!this._pinch) return;
		cancelAnimationFrame(this._pinchFrame);
		const map = this._map, zoom = map._limitZoom(this._pinch.zoom), center = this._getPinchCenter(zoom);
		this._pinch = null;
		if (map.options.zoomAnimation && Math.abs(zoom - map.getZoom()) > 1e-9) map._animateZoom(center, zoom, true, map.options.zoomSnap);
		else map._move(center, zoom)._moveEnd(true);
	}
	_panBy(e) {
		stop(e);
		const map = this._map;
		if (map._animatingZoom) return;
		const factor = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 60 : 1;
		let offset = new Point(e.deltaX * factor, e.deltaY * factor);
		if (e.shiftKey && !e.deltaX) offset = new Point(offset.y, 0);
		if (map.options.maxBounds) offset = map._limitOffset(offset, map.options.maxBounds);
		if (!this._panning) {
			map._stop();
			this._panning = true;
			map._setUserEvent(e);
			map.fire("movestart");
		}
		map._rawPanBy(offset.round());
		map.fire("move");
		clearTimeout(this._panTimer);
		this._panTimer = setTimeout(this._endPan.bind(this), gestureEndDelay$1);
	}
	_endPan() {
		clearTimeout(this._panTimer);
		if (!this._panning) return;
		this._panning = false;
		this._map.fire("moveend");
	}
	_onWheelZoom(e) {
		if (this._map.options.continuousZoom) {
			stop(e);
			const delta = getWheelDelta(e) / this._map.options.wheelPxPerZoomLevel;
			this._pinchTo(e, (this._pinch?.zoom ?? this._map.getZoom()) + delta, true);
			clearTimeout(this._pinchTimer);
			this._pinchTimer = setTimeout(this._endPinch.bind(this), gestureEndDelay$1);
			return;
		}
		const delta = getWheelDelta(e);
		const debounce = this._map.options.wheelDebounceTime;
		this._delta += delta;
		this._lastEvent = e;
		if (!this._startTime) this._startTime = Date.now();
		const left = Math.max(debounce - (Date.now() - this._startTime), 0);
		clearTimeout(this._timer);
		this._timer = setTimeout(this._performZoom.bind(this), left);
		stop(e);
	}
	_performZoom() {
		const map = this._map, zoom = map.getZoom(), snap = this._map.options.zoomSnap ?? 0;
		map._stop();
		const d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4), d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2, d4 = snap ? Math.ceil(d3 / snap) * snap : d3, d5 = map._prefersReducedMotion() ? Math.min(d4, 1) : d4, delta = map._limitZoom(zoom + (this._delta > 0 ? d5 : -d5)) - zoom;
		this._delta = 0;
		this._startTime = null;
		if (!delta || map._zoomInputBlocked()) return;
		map._setUserEvent(this._lastEvent);
		if (map.options.scrollWheelZoom === "center") map.setZoom(zoom + delta);
		else map.setZoomAround(map.pointerEventToContainerPoint(this._lastEvent), zoom + delta);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			scrollWheelZoom: true,
			wheelDebounceTime: 40,
			wheelPxPerZoomLevel: 60
		});
		MaplairMap.addInitHook("addHandler", "scrollWheelZoom", ScrollWheelZoomHandler);
	}
};
// src/map/handler/TapHoldHandler.js
/** @import {MaplairMap} from '../Map.js' */
const tapHoldDelay = 600;
/**
* Map options of `TapHoldHandler`, touch interaction options.
* @typedef {object} TapHoldHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean} [tapHold=true] Enables simulation of `contextmenu` event on touch
* and hold.
* @property {number} [tapTolerance=15] The max number of pixels a user can shift his
* finger during touch for it to be considered a valid tap.
*/
/**
* Handler of `MaplairMap` for long taps.
* @typedef {object} TapHoldHandlerMapProperties
* @lends MaplairMap
* @property {TapHoldHandler} tapHold Long tap handler to simulate `contextmenu` event
* (useful in mobile Safari).
*/
/**
* Simulates the `contextmenu` event on long hold, which otherwise is not fired by
* mobile Safari, see the map option `tapHold`.
*/
var TapHoldHandler = class TapHoldHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(TapHoldHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "pointerdown", this._onDown, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "pointerdown", this._onDown, this);
		this._cancel();
		this._cancelClickPrevent();
		this._stopPreventingNative();
	}
	_onDown(e) {
		clearTimeout(this._holdTimeout);
		if (getPointers().length !== 1 || e.pointerType === "mouse") return;
		const el = this._map._container;
		this._startPos = this._newPos = new Point(e.clientX, e.clientY);
		this._holdTimeout = setTimeout((() => {
			this._cancel();
			if (!this._isTapValid()) return;
			on(el, "pointerup", preventDefault);
			on(el, "pointerup pointercancel", this._cancelClickPrevent, this);
			this._simulateEvent("contextmenu", e);
			el.addEventListener("contextmenu", stop, true);
			el.addEventListener("pointerdown", this._stopPreventingNative, true);
		}), tapHoldDelay);
		on(el, "pointerup pointercancel contextmenu", this._cancel, this);
		on(el, "pointermove", this._onMove, this);
	}
	_cancelClickPrevent() {
		const el = this._map._container;
		off(el, "pointerup", preventDefault);
		off(el, "pointerup pointercancel", this._cancelClickPrevent, this);
	}
	_stopPreventingNative = () => {
		const el = this._map._container;
		el.removeEventListener("contextmenu", stop, true);
		el.removeEventListener("pointerdown", this._stopPreventingNative, true);
	};
	_cancel() {
		clearTimeout(this._holdTimeout);
		const el = this._map._container;
		off(el, "pointerup pointercancel contextmenu", this._cancel, this);
		off(el, "pointermove", this._onMove, this);
	}
	_onMove(e) {
		this._newPos = new Point(e.clientX, e.clientY);
	}
	_isTapValid() {
		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
	}
	_simulateEvent(type, e) {
		const simulatedEvent = new MouseEvent(type, {
			bubbles: true,
			cancelable: true,
			view: window,
			screenX: e.screenX,
			screenY: e.screenY,
			clientX: e.clientX,
			clientY: e.clientY
		});
		simulatedEvent._simulated = true;
		e.target.dispatchEvent(simulatedEvent);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			tapHold: true,
			tapTolerance: 15
		});
		MaplairMap.addInitHook("addHandler", "tapHold", TapHoldHandler);
	}
};
// src/map/handler/TapDragZoomHandler.js
/** @import {MaplairMap} from '../Map.js' */
const maxTapInterval = 500;
const maxTapDistance = 30;
const pixelsPerZoomLevel = 128;
/**
* Map options of `TapDragZoomHandler`, touch interaction options.
* @typedef {object} TapDragZoomHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|'center'} [tapDragZoom=true] Whether the map can be zoomed with
* one finger by tapping once, then touching again and dragging down (zoom in) or up
* (zoom out). If passed `'center'`, it will zoom to the center of the view regardless
* of where the finger was.
*/
/**
* Handler of `MaplairMap` for tap-drag zoom.
* @typedef {object} TapDragZoomHandlerMapProperties
* @lends MaplairMap
* @property {TapDragZoomHandler} tapDragZoom Tap-drag zoom handler (double tap and
* drag with one finger).
*/
/**
* Zooms the map with one finger on touch devices: tap once, then touch again and drag
* down to zoom in or up to zoom out (as known from MapLibre GL JS and Google Maps).
* Enabled by default, see the map option `tapDragZoom`.
*/
var TapDragZoomHandler = class TapDragZoomHandler extends Handler {
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(TapDragZoomHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		on(this._map._container, "pointerdown", this._onDown, this);
		on(this._map._container, "pointerup", this._onTapUp, this);
		on(this._map._container, "pointercancel", this._reset, this);
	}
	/**
	* Called when the handler is disabled, removes the event hooks.
	*/
	removeHooks() {
		off(this._map._container, "pointerdown", this._onDown, this);
		off(this._map._container, "pointerup", this._onTapUp, this);
		off(this._map._container, "pointercancel", this._reset, this);
		this._onUp();
		this._reset();
	}
	_onDown(e) {
		if (e.pointerType === "mouse" || getPointers().length !== 1) {
			this._onUp();
			this._reset();
			return;
		}
		const map = this._map, pos = new Point(e.clientX, e.clientY), now = Date.now();
		if (!this._tapPos || now - this._tapTime > maxTapInterval || pos.distanceTo(this._tapPos) > maxTapDistance || map._animatingZoom) {
			this._tapPos = null;
			this._downPos = pos;
			this._downTime = now;
			return;
		}
		this._tapPos = this._downPos = null;
		this._startPos = pos;
		this._startZoom = map.getZoom();
		this._moved = false;
		this._zooming = true;
		const containerPoint = map.pointerEventToContainerPoint(e);
		this._centerPoint = map.getSize()._divideBy(2);
		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
		if (map.options.tapDragZoom !== "center") {
			this._aroundLatLng = map.containerPointToLatLng(containerPoint);
			this._aroundOffset = containerPoint.subtract(this._centerPoint);
		}
		this._cancelDragging();
		on(map._container, "pointermove", this._onMove, this);
		on(map._container, "pointerup pointercancel", this._onUp, this);
	}
	_onTapUp(e) {
		if (!this._downPos) return;
		const pos = new Point(e.clientX, e.clientY), now = Date.now();
		if (now - this._downTime <= maxTapInterval && pos.distanceTo(this._downPos) <= this._map.options.tapTolerance) {
			this._tapPos = this._downPos;
			this._tapTime = now;
		}
		this._downPos = null;
	}
	_reset() {
		this._tapPos = this._downPos = null;
	}
	_cancelDragging() {
		const draggable = this._map.dragging?._draggable;
		if (draggable && Draggable._dragging === draggable) draggable.finishDrag(true);
	}
	_onMove(e) {
		if (!this._zooming || getPointers().length !== 1) return;
		const map = this._map, dy = e.clientY - this._startPos.y;
		if (!this._moved && Math.abs(dy) <= map.options.tapTolerance) return;
		this._cancelDragging();
		this._zoom = this._startZoom + dy / pixelsPerZoomLevel;
		if (!map.options.bounceAtZoomLimits) this._zoom = map._limitZoom(this._zoom);
		if (map.options.tapDragZoom === "center") this._center = this._startLatLng;
		else this._center = map.unproject(map.project(this._aroundLatLng, this._zoom).subtract(this._aroundOffset), this._zoom);
		if (!this._moved) {
			map._stop();
			map._setUserEvent(e);
			map._moveStart(true, false);
			this._moved = true;
		}
		cancelAnimationFrame(this._animRequest);
		this._animRequest = requestAnimationFrame(() => map._move(this._center, this._zoom, {
			pinch: true,
			round: false
		}));
		e.preventDefault();
	}
	_onUp() {
		off(this._map._container, "pointermove", this._onMove, this);
		off(this._map._container, "pointerup pointercancel", this._onUp, this);
		if (!this._zooming) return;
		this._zooming = false;
		if (!this._moved) return;
		this._moved = false;
		cancelAnimationFrame(this._animRequest);
		const map = this._map, zoom = map._limitZoom(this._zoom);
		if (map.options.zoomAnimation) map._animateZoom(this._center, zoom, true, map.options.zoomSnap);
		else map._move(this._center, zoom)._moveEnd(true);
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ tapDragZoom: true });
		MaplairMap.addInitHook("addHandler", "tapDragZoom", TapDragZoomHandler);
	}
};
// src/map/Map.js
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {PointExpression} from '../geometry/Point.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/** @import {Handler} from '../core/Handler.js' */
/** @import {Renderer} from '../layer/vector/Renderer.js' */
/** @import {MaplairEvent, MaplairPointerEvent, MaplairKeyboardEvent, MaplairErrorEvent, LocationEvent, ResizeEvent, CrsChangeEvent, WorldCopyJumpEvent, ZoomAnimEvent} from '../core/Events.js' */
const zoomAnimDuration = 250;
/**
* Options of `MaplairMap`.
* @typedef {object} MaplairMapOptions
* @property {CRS} [crs=EPSG3857] The [Coordinate Reference System](#crs) to use.
* Don't change this if you're not sure what it means.
* @property {LatLngExpression} [center] Initial geographic center of the map.
* @property {number} [zoom] Initial map zoom level.
* @property {number} [minZoom] Minimum zoom level of the map. If not specified and at
* least one `GridLayer` or `TileLayer` is in the map, the lowest of their `minZoom`
* options will be used instead.
* @property {number} [maxZoom] Maximum zoom level of the map. If not specified and at
* least one `GridLayer` or `TileLayer` is in the map, the highest of their `maxZoom`
* options will be used instead.
* @property {Layer[]} [layers=[]] Array of layers that will be added to the map initially.
* @property {string} [ariaLabel] The accessible name of the map, announced by screen
* readers, `'Map'` by default. The map container gets the ARIA role `region` with this
* label, unless it already has a role or label. The default is translated, see `I18n`.
* @property {LatLngBoundsExpression} [maxBounds] When this option is set, the map
* restricts the view to the given geographical bounds, bouncing the user back if the
* user tries to pan outside the view. To set the restriction dynamically, use
* [`setMaxBounds`](#map-setmaxbounds) method.
* @property {Renderer} [renderer] The default method for drawing vector layers on the
* map. `SVG` or `Canvas` by default depending on browser support.
* @property {boolean} [zoomAnimation=true] Whether the map zoom animation is enabled.
* @property {number} [zoomAnimationThreshold=4] Won't animate zoom if the zoom
* difference exceeds this value (or 1 if the user prefers
* [reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
* and `animate: true` isn't passed).
* @property {boolean} [continuousZoom=false] Whether zoom animations (e.g. of the zoom
* control, double click and keyboard) change the view frame by frame through fractional
* zoom levels, like `flyTo()` and pinch zoom, instead of scaling the map with a CSS
* transition between two zoom levels. Also makes the scroll wheel zoom smoothly with
* each wheel event (see `scrollWheelZoom`), snapping to `zoomSnap` when scrolling ends.
* @property {boolean} [fadeAnimation=true] Whether the tile and popup fade animation is
* enabled.
* @property {boolean} [markerZoomAnimation=true] Whether markers animate their zoom
* with the zoom animation, if disabled they will disappear for the length of the
* animation.
* @property {boolean} [markerCulling=false] Whether markers far outside of the map view
* (more than half a view away) are taken off the page until the map is moved closer to
* them. This reduces the browser's rendering work, and the work of repositioning
* markers while zooming, when a map has many markers (e.g. several thousands) of which
* only some are visible at a time.
* @property {number} [transform3DLimit=8388608] Defines the maximum size of a CSS
* translation transform (2^23). The default value should not be changed unless a web
* browser positions layers in the wrong place after doing a large `panBy`.
* @property {number} [zoomSnap=1] Forces the map's zoom level to always be a multiple
* of this, particularly right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
* By default, the zoom level snaps to the nearest integer; lower values (e.g. `0.5` or
* `0.1`) allow for greater granularity. A value of `0` means the zoom level will not be
* snapped after `fitBounds` or a pinch-zoom.
* @property {number} [zoomDelta=1] Controls how much the map's zoom level will change
* after a [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+` or `-`
* on the keyboard, or using the [zoom controls](#control-zoom). Values smaller than `1`
* (e.g. `0.5`) allow for greater granularity.
* @property {boolean} [trackResize=true] Whether the map automatically handles browser
* window resize to update itself. A hidden map (with the size 0, e.g. `display: none`
* in an inactive tab) keeps its size, view and bounds until it is shown again.
*/
/**
* Options of the geolocation methods of `MaplairMap`, e.g. `locate()`.
* @typedef {object} LocateOptions
* @property {boolean} [watch=false] If `true`, starts continuous watching of location
* changes (instead of detecting it once) using W3C `watchPosition` method. You can
* later stop watching using `map.stopLocate()` method.
* @property {boolean} [setView=false] If `true`, automatically sets the map view to the
* user location with respect to detection accuracy, or to world view if geolocation
* failed.
* @property {number} [maxZoom=Infinity] The maximum zoom for automatic view setting
* when using `setView` option.
* @property {number} [timeout=10000] Number of milliseconds to wait for a response from
* geolocation before firing a `locationerror` event.
* @property {number} [maximumAge=0] Maximum age of detected location. If less than this
* amount of milliseconds passed since last geolocation response, `locate` will return
* a cached location.
* @property {boolean} [enableHighAccuracy=false] Enables high accuracy, see
* [description in the W3C spec](https://w3c.github.io/geolocation-api/#enablehighaccuracy-member).
*/
/**
* Options of the `MaplairMap` methods which modify the zoom level.
* @typedef {object} ZoomOptions
* @property {boolean} [animate] If not specified, zoom animation will happen if the
* zoom origin is inside the current view, and if the user prefers reduced motion, only
* when zooming by at most one level. If `true`, the map will attempt animating zoom
* disregarding where zoom origin is and the user's reduced motion preference. Setting
* `false` will make it always reset the view completely without animation.
*/
/**
* Options of the `MaplairMap` methods which modify the center of the map.
* @typedef {object} PanOptions
* @property {boolean} [animate] If `true`, panning will always be animated if possible,
* even if the user prefers reduced motion. If `false`, it will not animate panning,
* either resetting the map view if panning more than a screen away, or just setting a
* new offset for the map pane (except for `panBy` which always does the latter). If not
* specified, panning is animated, except for pans longer than half the map size when
* the user prefers reduced motion.
* @property {number} [duration=0.25] Duration of animated panning, in seconds.
* @property {number} [easeLinearity=0.25] The curvature factor of panning animation
* easing (third parameter of the [Cubic Bezier curve](https://cubic-bezier.com/)).
* 1.0 means linear animation, and the smaller this number, the more bowed the curve.
* @property {boolean} [noMoveStart=false] If `true`, panning won't fire `movestart`
* event on start (used internally for panning inertia).
*/
/**
* Options of the `MaplairMap` methods which modify the zoom level and the center.
* @typedef {object} ZoomPanOptions
* @extends ZoomOptions, PanOptions
*/
/**
* Options of `MaplairMap.invalidateSize()`.
* @typedef {object} InvalidateSizeOptions
* @property {boolean} [pan=true] If `false`, panning will not occur.
* @property {boolean} [debounceMoveend=false] If `true`, it will delay `moveend` event
* so that it doesn't happen often even if the method is called many times in a row.
* @extends ZoomPanOptions
*/
/**
* Padding options of `MaplairMap` methods, e.g. `panInside()`.
* @typedef {object} PaddingOptions
* @property {PointExpression} [paddingTopLeft=[0, 0]] Sets the amount of padding in the
* top left corner of a map container that shouldn't be accounted for when setting the
* view to fit bounds. Useful if you have some control overlays on the map like a
* sidebar and you don't want them to obscure objects you're zooming to.
* @property {PointExpression} [paddingBottomRight=[0, 0]] The same for the bottom right
* corner of the map.
* @property {PointExpression} [padding=[0, 0]] Equivalent of setting both top left and
* bottom right padding to the same value.
*/
/**
* Options of `MaplairMap.fitBounds()` and similar methods.
* @typedef {object} FitBoundsOptions
* @property {number|null} [maxZoom=null] The maximum possible zoom to use.
* @extends ZoomPanOptions, PaddingOptions
*/
/**
* The central class of the API — it is used to create a map on a page and manipulate it.
*
* <h3 id="map-pane">Panes</h3>
*
* Panes are DOM elements used to control the ordering of layers on the map. You can
* access panes with [`map.getPane`](#map-getpane) or [`map.getPanes`](#map-getpanes)
* methods. New panes can be created with the [`map.createPane`](#map-createpane) method.
*
* Every map has the following default panes that differ only in zIndex.
*
* | Pane | zIndex | Description |
* |---|---|---|
* | `mapPane` | `'auto'` | Pane that contains all other map panes |
* | `tilePane` | 200 | Pane for `GridLayer`s and `TileLayer`s |
* | `overlayPane` | 400 | Pane for vectors (`Path`s, like `Polyline`s and `Polygon`s), `ImageOverlay`s and `VideoOverlay`s |
* | `shadowPane` | 500 | Pane for overlay shadows (e.g. `Marker` shadows) |
* | `markerPane` | 600 | Pane for `Icon`s of `Marker`s |
* | `tooltipPane` | 650 | Pane for `Tooltip`s |
* | `popupPane` | 700 | Pane for `Popup`s |
*
* **Map state change events**
*
* The map state change events `movestart`, `move`, `moveend`, `zoomstart`, `zoom`,
* `zoomend` and `zoomanim` caused by the user (e.g. dragging, scrolling, pinching,
* pressing a key or clicking a zoom button) have an `originalEvent` property with the
* DOM event that started the change. It is `undefined` for changes made by code (e.g.
* `setView()`), which allows to tell them apart, e.g. to avoid feedback loops when
* synchronizing the view.
*
* @example
* ```js
* // initialize the map on the "map" div with a given center and zoom
* const map = new MaplairMap('map', {
* 	center: [51.505, -0.09],
* 	zoom: 13
* });
* ```
*
* @fires resize {ResizeEvent} Fired when the map is resized.
* @fires unload {MaplairEvent} Fired when the map is destroyed with [remove](#map-remove) method.
* @fires viewprereset {MaplairEvent} Fired before the map resets its view (see `viewreset`).
* @fires viewreset {MaplairEvent} Fired when the map needs to redraw its content (this
* usually happens on map zoom or load). Very useful for creating custom overlays.
* @fires load {MaplairEvent} Fired when the map is initialized (when its center and zoom
* are set for the first time).
* @fires zoomstart {MaplairEvent} Fired when the map zoom is about to change (e.g. before
* zoom animation).
* @fires movestart {MaplairEvent} Fired when the view of the map starts changing (e.g.
* user starts dragging the map).
* @fires zoom {MaplairEvent} Fired repeatedly during any change in zoom level, including
* zoom and fly animations.
* @fires move {MaplairEvent} Fired repeatedly during any movement of the map, including
* pan and fly animations.
* @fires zoomend {MaplairEvent} Fired when the map zoom changed, after any animations.
* @fires moveend {MaplairEvent} Fired when the center of the map stops changing (e.g.
* user stopped dragging the map or after non-centered zoom).
* @fires idle {MaplairEvent} Fired when the map becomes idle: the view is not changing
* (no dragging, panning or zooming, including their animations) and all layers have
* finished loading (e.g. the tiles of tile layers, see `GridLayer.isLoading()`). Useful
* e.g. for taking screenshots or for tests.
* @fires locationerror {MaplairErrorEvent} Fired when geolocation (using the
* [`locate`](#map-locate) method) failed.
* @fires locationfound {LocationEvent} Fired when geolocation (using the
* [`locate`](#map-locate) method) went successfully.
* @fires click {MaplairPointerEvent} Fired when the user clicks (or taps) the map.
* @fires dblclick {MaplairPointerEvent} Fired when the user double-clicks (or
* double-taps) the map.
* @fires pointerdown {MaplairPointerEvent} Fired when the user pushes the pointer on the map.
* @fires pointerup {MaplairPointerEvent} Fired when the user releases the pointer on the map.
* @fires pointerover {MaplairPointerEvent} Fired when the pointer enters the map.
* @fires pointerout {MaplairPointerEvent} Fired when the pointer leaves the map.
* @fires pointermove {MaplairPointerEvent} Fired while the pointer moves over the map.
* @fires contextmenu {MaplairPointerEvent} Fired when the user pushes the right mouse
* button on the map, prevents default browser context menu from showing if there are
* listeners on this event. Also fired on mobile when the user holds a single touch for
* a second (also called long press).
* @fires preclick {MaplairPointerEvent} Fired before pointer click on the map (sometimes
* useful when you want something to happen on click before any existing click handlers
* start running).
* @fires keydown {MaplairKeyboardEvent} Fired when the user presses a key from the
* keyboard while the map is focused.
* @fires keyup {MaplairKeyboardEvent} Fired when the user releases a key from the
* keyboard while the map is focused.
* @fires crschange {CrsChangeEvent} Fired when the CRS of the map changes with
* `setCrs()`, before the view is reset.
* @fires worldcopyjump {WorldCopyJumpEvent} Fired when [`worldCopyJump`](#maplairmapoptions-worldcopyjump)
* moves the map pane by one or more world widths.
* @fires pixelratiochange {MaplairEvent} Fired when the `devicePixelRatio` of the browser
* changes, e.g. when moving the window to a screen with another resolution or when
* zooming the page. Tile layers with `detectRetina` and canvas renderers adapt to it.
* @fires zoomanim {ZoomAnimEvent} Fired at least once per zoom animation. For continuous
* zoom, like pinch zooming, fired once per frame during zoom.
*/
var MaplairMap = class MaplairMap extends Evented {
	static defaultOptions = {
		crs: EPSG3857,
		center: void 0,
		zoom: void 0,
		minZoom: void 0,
		maxZoom: void 0,
		layers: [],
		ariaLabel: void 0,
		maxBounds: void 0,
		renderer: void 0,
		zoomAnimation: true,
		zoomAnimationThreshold: 4,
		continuousZoom: false,
		fadeAnimation: true,
		markerZoomAnimation: true,
		markerCulling: false,
		transform3DLimit: 8388608,
		zoomSnap: 1,
		zoomDelta: 1,
		trackResize: true
	};
	/**
	* Instantiates a map object given the DOM ID of a `<div>` element or the element
	* itself, and optionally an object literal with `MaplairMap` options.
	* @param {string|HTMLElement} id The `<div>` element or its DOM ID.
	* @param {MaplairMapOptions} [options]
	*/
	constructor(id, options) {
		super();
		options = setOptions(this, options);
		this._handlers = [];
		this._layers = {};
		this._zoomBoundLayers = {};
		this._sizeChanged = true;
		this._initContainer(id);
		this._initLayout();
		this._initEvents();
		this._watchPixelRatio();
		this.on({
			movestart: this._onBusy,
			zoomstart: this._onBusy,
			move: this._onMove,
			moveend: this._onViewChanged,
			layerremove: this._scheduleIdleCheck
		}, this);
		if (options.maxBounds) this.setMaxBounds(options.maxBounds);
		if (options.zoom !== void 0) this._zoom = this._limitZoom(options.zoom);
		if (options.center && options.zoom !== void 0) this.setView(LatLng.from(options.center), options.zoom, { reset: true });
		this.callInitHooks(MaplairMap);
		this._zoomAnimated = this.options.zoomAnimation;
		if (this._zoomAnimated) this._createAnimProxy();
		this._addLayers(this.options.layers);
	}
	/**
	* Sets the view of the map (geographical center and zoom) with the given
	* animation options.
	* @group Methods for modifying map state
	* @param {LatLngExpression} center
	* @param {number} [zoom]
	* @param {ZoomPanOptions} [options]
	* @returns {this}
	*/
	setView(center, zoom, options) {
		zoom = zoom === void 0 ? this._zoom : this._limitZoom(zoom);
		center = this._limitCenter(new LatLng(center), zoom, this.options.maxBounds);
		options ??= {};
		this._stop();
		if (this._loaded && !options.reset && options !== true) {
			if (options.animate !== void 0) {
				options.zoom = {
					animate: options.animate,
					...options.zoom
				};
				options.pan = {
					animate: options.animate,
					duration: options.duration,
					...options.pan
				};
			}
			if (this._zoom !== zoom ? this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) : this._tryAnimatedPan(center, options.pan)) {
				clearTimeout(this._sizeTimer);
				return this;
			}
		}
		this._resetView(center, zoom, options.pan?.noMoveStart);
		return this;
	}
	/**
	* Sets the zoom of the map.
	* @group Methods for modifying map state
	* @param {number} zoom
	* @param {ZoomPanOptions} [options]
	* @returns {this}
	*/
	setZoom(zoom, options) {
		if (!this._loaded) {
			this._zoom = zoom;
			return this;
		}
		return this.setView(this.getCenter(), zoom, { zoom: options });
	}
	/**
	* Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
	* @group Methods for modifying map state
	* @param {number} [delta]
	* @param {ZoomOptions} [options]
	* @returns {this}
	*/
	zoomIn(delta, options) {
		delta ??= this.options.zoomDelta;
		return this.setZoom(this._zoom + delta, options);
	}
	/**
	* Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
	* @group Methods for modifying map state
	* @param {number} [delta]
	* @param {ZoomOptions} [options]
	* @returns {this}
	*/
	zoomOut(delta, options) {
		delta ??= this.options.zoomDelta;
		return this.setZoom(this._zoom - delta, options);
	}
	/**
	* Zooms the map while keeping a specified geographical point on the map
	* stationary (e.g. used internally for scroll zoom and double-click zoom). Given a
	* `Point`, it keeps the specified pixel on the map (relative to the top-left corner)
	* stationary instead.
	* @group Methods for modifying map state
	* @param {LatLngExpression|Point} latlng The geographical point or the pixel offset.
	* @param {number} zoom
	* @param {ZoomOptions} [options]
	* @returns {this}
	*/
	setZoomAround(latlng, zoom, options) {
		const center = this.project(this.getCenter()), offset = latlng instanceof Point ? this.containerPointToLayerPoint(latlng).subtract(this.containerPointToLayerPoint(this.getSize().divideBy(2))) : this.project(latlng).subtract(center), newCenter = this.unproject(center.add(offset.multiplyBy(1 - 1 / this.getZoomScale(zoom))));
		return this.setView(newCenter, zoom, { zoom: options });
	}
	_getBoundsCenterZoom(bounds, options) {
		options ??= {};
		bounds = bounds.getBounds ? bounds.getBounds() : LatLngBounds.from(bounds);
		const paddingTL = Point.from(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = Point.from(options.paddingBottomRight || options.padding || [0, 0]);
		let zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));
		zoom = typeof options.maxZoom === "number" ? Math.min(options.maxZoom, zoom) : zoom;
		if (zoom === Infinity) return {
			center: bounds.getCenter(),
			zoom
		};
		const paddingOffset = paddingBR.subtract(paddingTL).divideBy(2), swPoint = this.project(bounds.getSouthWest(), zoom), nePoint = this.project(bounds.getNorthEast(), zoom);
		return {
			center: this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom),
			zoom
		};
	}
	/**
	* Sets a map view that contains the given geographical bounds with the
	* maximum zoom level possible.
	* @group Methods for modifying map state
	* @param {LatLngBoundsExpression} bounds
	* @param {FitBoundsOptions} [options]
	* @returns {this}
	*/
	fitBounds(bounds, options) {
		bounds = LatLngBounds.from(bounds);
		if (!bounds.isValid()) throw new Error("Bounds are not valid.");
		const target = this._getBoundsCenterZoom(bounds, options);
		return this.setView(target.center, target.zoom, options);
	}
	/**
	* Sets a map view that mostly contains the whole world with the maximum
	* zoom level possible.
	* @group Methods for modifying map state
	* @param {FitBoundsOptions} [options]
	* @returns {this}
	*/
	fitWorld(options) {
		return this.fitBounds([[-90, -180], [90, 180]], options);
	}
	/**
	* Pans the map to a given center.
	* @group Methods for modifying map state
	* @param {LatLngExpression} center
	* @param {PanOptions} [options]
	* @returns {this}
	*/
	panTo(center, options) {
		return this.setView(center, this._zoom, { pan: options });
	}
	/**
	* Pans the map by a given number of pixels (animated unless `animate: false` is passed,
	* or the user prefers reduced motion and the pan is longer than half the map size
	* without `animate: true`).
	* @group Methods for modifying map state
	* @param {PointExpression} offset
	* @param {PanOptions} [options]
	* @returns {this}
	*/
	panBy(offset, options) {
		offset = Point.from(offset).round();
		options ??= {};
		if (!offset.x && !offset.y) return this.fire("moveend");
		const size = this.getSize();
		if (options.animate !== true && !size.contains(offset)) {
			const center = this.unproject(this.project(this.getCenter()).add(offset));
			this._resetView(this.options.worldCopyJump ? this.wrapLatLng(center) : center, this.getZoom());
			return this;
		}
		if (!this._panAnim) {
			this._panAnim = new PosAnimation();
			this._panAnim.on({
				"step": this._onPanTransitionStep,
				"end": this._onPanTransitionEnd
			}, this);
		}
		if (!options.noMoveStart) this.fire("movestart");
		const tooFarForReducedMotion = this._prefersReducedMotion() && !size.divideBy(2).contains(offset);
		if (options.animate === true || options.animate !== false && !tooFarForReducedMotion) {
			this._mapPane.classList.add("maplair-pan-anim");
			const newPos = this._getMapPanePos().subtract(offset).round();
			this._panAnim.run(this._mapPane, newPos, options.duration || .25, options.easeLinearity);
		} else {
			this._rawPanBy(offset);
			this._wrapWorldCopy();
			this.fire("move").fire("moveend");
		}
		return this;
	}
	/**
	* Sets the view of the map (geographical center and zoom) performing a smooth
	* pan-zoom animation. If the user prefers reduced motion (and `animate: true` isn't
	* passed), it behaves like `setView` instead, only animating short pans and zooms.
	* @group Methods for modifying map state
	* @param {LatLngExpression} targetCenter
	* @param {number} [targetZoom]
	* @param {ZoomPanOptions} [options]
	* @returns {this}
	*/
	flyTo(targetCenter, targetZoom, options) {
		options ??= {};
		if (options.animate === false) return this.setView(targetCenter, targetZoom, {
			...options,
			zoom: {
				...options.zoom,
				animate: false
			}
		});
		if (options.animate !== true && this._prefersReducedMotion()) return this.setView(targetCenter, targetZoom, options);
		this._stop();
		targetZoom = targetZoom === void 0 ? this._zoom : this._limitZoom(targetZoom);
		targetCenter = this._limitCenter(new LatLng(targetCenter), targetZoom, this.options.maxBounds);
		const from = this.project(this.getCenter()), to = this.project(targetCenter), size = this.getSize(), startZoom = this._zoom;
		const w0 = Math.max(size.x, size.y), w1 = w0 * this.getZoomScale(startZoom, targetZoom), u1 = to.distanceTo(from) || 1, rho = 1.42, rho2 = rho * rho;
		function r(i) {
			const s1 = i ? -1 : 1, s2 = i ? w1 : w0, t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1, b1 = 2 * s2 * rho2 * u1;
			return -Math.asinh(t1 / b1);
		}
		const r0 = r(0);
		function u(s) {
			return w0 * (Math.cosh(r0) * Math.tanh(r0 + rho * s) - Math.sinh(r0)) / rho2;
		}
		function easeOut(t) {
			return 1 - (1 - t) ** 1.5;
		}
		const start = Date.now(), S = (r(1) - r0) / rho, duration = options.duration ? 1e3 * options.duration : 1e3 * S * .8;
		const frame = () => {
			const t = (Date.now() - start) / duration, s = easeOut(t) * S;
			if (t <= 1) {
				this._flyToFrame = requestAnimationFrame(frame);
				this._move(this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom), this.getScaleZoom(Math.cosh(r0 + rho * s) / Math.cosh(r0), startZoom), { flyTo: true });
			} else {
				const zoomChanged = this._zoom !== targetZoom;
				this._move(targetCenter, targetZoom);
				if (!zoomChanged) this.fire("zoom");
				this._moveEnd(true);
			}
		};
		this._moveStart(true, options.noMoveStart);
		frame(this);
		return this;
	}
	/**
	* Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
	* but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
	* @group Methods for modifying map state
	* @param {LatLngBoundsExpression} bounds
	* @param {FitBoundsOptions} [options]
	* @returns {this}
	*/
	flyToBounds(bounds, options) {
		const target = this._getBoundsCenterZoom(bounds, options);
		return this.flyTo(target.center, target.zoom, options);
	}
	/**
	* Changes the [Coordinate Reference System](#crs) of the map, keeping its center
	* and (as far as possible with the zoom levels and `zoomSnap`) its scale at the
	* center. All layers are redrawn in the new CRS; note that tile layers only work
	* with the CRS their tiles were made for.
	* @group Methods for modifying map state
	* @param {CRS} crs
	* @returns {this}
	*/
	setCrs(crs) {
		const oldCrs = this.options.crs;
		if (crs === oldCrs) return this;
		if (!this._loaded) {
			this.options.crs = crs;
			this.fire("crschange", {
				oldCrs,
				crs
			});
			return this;
		}
		this._stop();
		const center = this.getCenter(), resolution = this._getResolution(center);
		this.options.crs = crs;
		const zoom = this._limitZoom(crs.zoom(crs.scale(this._zoom) * this._getResolution(center) / resolution));
		this.fire("crschange", {
			oldCrs,
			crs
		});
		this._resetView(center, zoom);
		return this;
	}
	_getResolution(latlng) {
		const crs = this.options.crs, point = crs.latLngToPoint(latlng, this._zoom);
		return crs.distance(latlng, crs.pointToLatLng(point.add([1, 0]), this._zoom));
	}
	/**
	* Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
	* @group Methods for modifying map state
	* @param {LatLngBoundsExpression} bounds
	* @returns {this}
	*/
	setMaxBounds(bounds) {
		bounds = new LatLngBounds(bounds);
		if (this.listens("moveend", this._panInsideMaxBounds)) this.off("moveend", this._panInsideMaxBounds);
		if (!bounds.isValid()) {
			this.options.maxBounds = null;
			return this;
		}
		this.options.maxBounds = bounds;
		if (this._loaded) this._panInsideMaxBounds();
		return this.on("moveend", this._panInsideMaxBounds);
	}
	/**
	* Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
	* @group Methods for modifying map state
	* @param {number} zoom
	* @returns {this}
	*/
	setMinZoom(zoom) {
		const oldZoom = this.options.minZoom;
		this.options.minZoom = zoom;
		if (this._loaded && oldZoom !== zoom) {
			this.fire("zoomlevelschange");
			if (this.getZoom() < this.options.minZoom) return this.setZoom(zoom);
		}
		return this;
	}
	/**
	* Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
	* @group Methods for modifying map state
	* @param {number} zoom
	* @returns {this}
	*/
	setMaxZoom(zoom) {
		const oldZoom = this.options.maxZoom;
		this.options.maxZoom = zoom;
		if (this._loaded && oldZoom !== zoom) {
			this.fire("zoomlevelschange");
			if (this.getZoom() > this.options.maxZoom) return this.setZoom(zoom);
		}
		return this;
	}
	/**
	* Pans the map to the closest view that would lie inside the given bounds (if
	* it's not already), controlling the animation using the options specific, if any.
	* @group Methods for modifying map state
	* @param {LatLngBoundsExpression} bounds
	* @param {PanOptions} [options]
	* @returns {this}
	*/
	panInsideBounds(bounds, options) {
		this._enforcingBounds = true;
		const center = this.getCenter(), newCenter = this._limitCenter(center, this._zoom, LatLngBounds.from(bounds));
		if (!center.equals(newCenter)) this.panTo(newCenter, options);
		this._enforcingBounds = false;
		return this;
	}
	/**
	* Pans the map the minimum amount to make the `latlng` visible. Use
	* padding options to fit the display to more restricted bounds.
	* If `latlng` is already within the (optionally padded) display bounds,
	* the map will not be panned.
	* @group Methods for modifying map state
	* @param {LatLngExpression} latlng
	* @param {PaddingOptions & PanOptions} [options]
	* @returns {this}
	*/
	panInside(latlng, options) {
		options ??= {};
		const paddingTL = Point.from(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = Point.from(options.paddingBottomRight || options.padding || [0, 0]), pixelCenter = this.project(this.getCenter()), pixelPoint = this.project(latlng), pixelBounds = this.getPixelBounds(), paddedBounds = new Bounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]), paddedSize = paddedBounds.getSize();
		if (!paddedBounds.contains(pixelPoint)) {
			this._enforcingBounds = true;
			const centerOffset = pixelPoint.subtract(paddedBounds.getCenter());
			const offset = paddedBounds.extend(pixelPoint).getSize().subtract(paddedSize);
			pixelCenter.x += centerOffset.x < 0 ? -offset.x : offset.x;
			pixelCenter.y += centerOffset.y < 0 ? -offset.y : offset.y;
			this.panTo(this.unproject(pixelCenter), options);
			this._enforcingBounds = false;
		}
		return this;
	}
	/**
	* Checks if the map container size changed and updates the map if so —
	* call it after you've changed the map size dynamically, also animating
	* pan by default. If `options.pan` is `false`, panning will not occur.
	* If `options.debounceMoveend` is `true`, it will delay `moveend` event so
	* that it doesn't happen often even if the method is called many
	* times in a row. Passing `true` instead of options animates the panning.
	* @group Methods for modifying map state
	* @param {InvalidateSizeOptions|boolean} [options]
	* @returns {this}
	*/
	invalidateSize(options) {
		if (!this._loaded) return this;
		options = {
			animate: false,
			pan: true,
			...options === true ? { animate: true } : options
		};
		const oldSize = this.getSize();
		this._sizeChanged = true;
		this._lastCenter = null;
		const newSize = this.getSize(), oldCenter = oldSize.divideBy(2).round(), newCenter = newSize.divideBy(2).round(), offset = oldCenter.subtract(newCenter);
		if (!offset.x && !offset.y) return this;
		if (options.animate && options.pan) this.panBy(offset);
		else {
			if (options.pan) this._rawPanBy(offset);
			this.fire("move");
			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(this.fire.bind(this, "moveend"), 200);
			} else this.fire("moveend");
		}
		return this.fire("resize", {
			oldSize,
			newSize
		});
	}
	/**
	* Stops the currently running `panTo` or `flyTo` animation, if any.
	* @group Methods for modifying map state
	* @returns {this}
	*/
	stop() {
		this.setZoom(this._limitZoom(this._zoom));
		if (!this.options.zoomSnap) this.fire("viewreset");
		return this._stop();
	}
	/**
	* Tries to locate the user using the Geolocation API, firing a
	* [`locationfound`](#map-locationfound) event with location data on success or a
	* [`locationerror`](#map-locationerror) event on failure, and optionally sets the map
	* view to the user's location with respect to detection accuracy (or to the world view
	* if geolocation failed).
	* Note that, if your page doesn't use HTTPS, this method will fail in
	* modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
	* See `LocateOptions` for more details.
	* @group Geolocation methods
	* @param {LocateOptions} [options]
	* @returns {this}
	*/
	locate(options) {
		options = this._locateOptions = {
			timeout: 1e4,
			watch: false,
			...options
		};
		if (!("geolocation" in navigator)) {
			this._handleGeolocationError({
				code: 0,
				message: "Geolocation not supported."
			});
			return this;
		}
		const onResponse = this._handleGeolocationResponse.bind(this), onError = this._handleGeolocationError.bind(this);
		if (options.watch) {
			if (this._locationWatchId !== void 0) navigator.geolocation.clearWatch(this._locationWatchId);
			this._locationWatchId = navigator.geolocation.watchPosition(onResponse, onError, options);
		} else navigator.geolocation.getCurrentPosition(onResponse, onError, options);
		return this;
	}
	/**
	* Stops watching location previously initiated by `map.locate({watch: true})`
	* and aborts resetting the map view if map.locate was called with
	* `{setView: true}`.
	* @group Geolocation methods
	* @returns {this}
	*/
	stopLocate() {
		navigator.geolocation?.clearWatch?.(this._locationWatchId);
		if (this._locateOptions) this._locateOptions.setView = false;
		return this;
	}
	_handleGeolocationError(error) {
		if (!this._container._maplair_id) return;
		const c = error.code, message = error.message || (c === 1 ? "permission denied" : c === 2 ? "position unavailable" : "timeout");
		if (this._locateOptions.setView && !this._loaded) this.fitWorld();
		this.fire("locationerror", {
			code: c,
			message: `Geolocation error: ${message}.`
		});
	}
	_handleGeolocationResponse(pos) {
		if (!this._container._maplair_id) return;
		const lat = pos.coords.latitude, lng = pos.coords.longitude, latlng = new LatLng(lat, lng), bounds = latlng.toBounds(pos.coords.accuracy * 2), options = this._locateOptions;
		if (options.setView) {
			const zoom = this.getBoundsZoom(bounds);
			this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
		}
		const data = {
			latlng,
			bounds,
			timestamp: pos.timestamp
		};
		for (const i in pos.coords) if (typeof pos.coords[i] === "number") data[i] = pos.coords[i];
		this.fire("locationfound", data);
	}
	/**
	* Adds a new `Handler` to the map, given its name and constructor function.
	* @group Other methods
	* @param {string} name
	* @param {new (map: MaplairMap) => Handler} HandlerClass
	* @returns {this}
	*/
	addHandler(name, HandlerClass) {
		if (!HandlerClass) return this;
		const handler = this[name] = new HandlerClass(this);
		this._handlers.push(handler);
		if (this.options[name]) handler.enable();
		return this;
	}
	/**
	* Destroys the map and clears all related event listeners.
	* @group Other methods
	* @returns {this}
	*/
	remove() {
		this._initEvents(true);
		if (this.options.maxBounds) this.off("moveend", this._panInsideMaxBounds);
		if (this._containerId !== this._container._maplair_id) throw new Error("Map container is being reused by another instance");
		delete this._container._maplair_id;
		delete this._containerId;
		if (this._locationWatchId !== void 0) this.stopLocate();
		this._stop();
		disablePointerDetection(this._container);
		this._mapPane.remove();
		for (const name of this._ariaAttributes) this._container.removeAttribute(name);
		if (this._clearControlPos) this._clearControlPos();
		cancelAnimationFrame(this._resizeRequest);
		cancelAnimationFrame(this._idleRequest);
		this._watchPixelRatio(true);
		for (const handler of this._handlers) handler.disable();
		clearTimeout(this._transitionEndTimer);
		clearTimeout(this._sizeTimer);
		if (this._loaded) this.fire("unload");
		for (const layer of Object.values(this._layers)) layer.remove();
		for (const pane of Object.values(this._panes)) pane.remove();
		this._layers = {};
		this._panes = {};
		delete this._mapPane;
		delete this._renderer;
		return this;
	}
	/**
	* Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
	* then returns it. The pane is created as a child of `container`, or
	* as a child of the main map pane if not set.
	* @group Other methods
	* @param {string} name
	* @param {HTMLElement} [container]
	* @returns {HTMLElement}
	*/
	createPane(name, container) {
		const pane = create("div", `maplair-pane${name ? ` maplair-${name.replace("Pane", "")}-pane` : ""}`, container || this._mapPane);
		if (name) this._panes[name] = pane;
		return pane;
	}
	/**
	* Returns the geographical center of the map view.
	* @group Methods for getting map state
	* @returns {LatLng}
	*/
	getCenter() {
		this._checkIfLoaded();
		if (this._lastCenter && this._getMapPanePos().equals(this._lastCenterPanePos)) return new LatLng(this._lastCenter);
		return this.layerPointToLatLng(this._getCenterLayerPoint());
	}
	/**
	* Returns the current zoom level of the map view.
	* @group Methods for getting map state
	* @returns {number}
	*/
	getZoom() {
		return this._zoom;
	}
	/**
	* Returns the geographical bounds visible in the current map view.
	* @group Methods for getting map state
	* @returns {LatLngBounds}
	*/
	getBounds() {
		const bounds = this.getPixelBounds();
		return new LatLngBounds(this.unproject(bounds.getBottomLeft()), this.unproject(bounds.getTopRight()));
	}
	/**
	* Returns the minimum zoom level of the map (if set in the `minZoom` option of the
	* map or of any layers), or `0` by default.
	* @group Methods for getting map state
	* @returns {number}
	*/
	getMinZoom() {
		return this.options.minZoom ?? this._layersMinZoom ?? 0;
	}
	/**
	* Returns the maximum zoom level of the map (if set in the `maxZoom` option of the
	* map or of any layers).
	* @group Methods for getting map state
	* @returns {number}
	*/
	getMaxZoom() {
		return this.options.maxZoom ?? this._layersMaxZoom ?? Infinity;
	}
	/**
	* Returns the maximum zoom level on which the given bounds fit to the map
	* view in its entirety. If `inside` (optional) is set to `true`, the method
	* instead returns the minimum zoom level on which the map view fits into
	* the given bounds in its entirety.
	* @group Methods for getting map state
	* @param {LatLngBoundsExpression} bounds
	* @param {boolean} [inside]
	* @param {PointExpression} [padding]
	* @returns {number}
	*/
	getBoundsZoom(bounds, inside, padding) {
		bounds = LatLngBounds.from(bounds);
		padding = Point.from(padding ?? [0, 0]);
		let zoom = this.getZoom() ?? 0;
		const min = this.getMinZoom(), max = this.getMaxZoom(), nw = bounds.getNorthWest(), se = bounds.getSouthEast(), size = this.getSize().subtract(padding), boundsSize = new Bounds(this.project(se, zoom), this.project(nw, zoom)).getSize(), snap = this.options.zoomSnap, scalex = size.x / boundsSize.x, scaley = size.y / boundsSize.y, scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);
		zoom = this.getScaleZoom(scale, zoom);
		if (snap) {
			zoom = Math.round(zoom / (snap / 100)) * (snap / 100);
			zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
		}
		return Math.max(min, Math.min(max, zoom));
	}
	/**
	* Returns the current size of the map container (in pixels).
	* @group Methods for getting map state
	* @returns {Point}
	*/
	getSize() {
		if (!this._size || this._sizeChanged) {
			this._size = new Point(this._container.clientWidth || 0, this._container.clientHeight || 0);
			this._sizeChanged = false;
		}
		return new Point(this._size);
	}
	/**
	* Returns the bounds of the current map view in projected pixel
	* coordinates (sometimes useful in layer and overlay implementations).
	* If `center` and `zoom` is omitted, the map's current zoom level and center is used.
	* @group Methods for getting map state
	* @param {LatLngExpression} [center]
	* @param {number} [zoom]
	* @returns {Bounds}
	*/
	getPixelBounds(center, zoom) {
		const topLeftPoint = this._getTopLeftPoint(center, zoom);
		return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
	}
	/**
	* Returns the projected pixel coordinates of the top left point of
	* the map layer (useful in custom layer and overlay implementations).
	* @group Methods for getting map state
	* @returns {Point}
	*/
	getPixelOrigin() {
		this._checkIfLoaded();
		return this._pixelOrigin;
	}
	/**
	* Returns the world's bounds in pixel coordinates for zoom level `zoom`.
	* If `zoom` is omitted, the map's current zoom level is used.
	* @group Methods for getting map state
	* @param {number} [zoom]
	* @returns {Bounds|null} `null` for CRSs with infinite bounds.
	*/
	getPixelWorldBounds(zoom) {
		return this.options.crs.getProjectedBounds(zoom ?? this.getZoom());
	}
	/**
	* Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
	* @group Other methods
	* @param {string|HTMLElement} pane
	* @returns {HTMLElement}
	*/
	getPane(pane) {
		return typeof pane === "string" ? this._panes[pane] : pane;
	}
	/**
	* Returns a plain object containing the names of all [panes](#map-pane) as keys and
	* the panes as values.
	* @group Other methods
	* @returns {Record<string, HTMLElement>}
	*/
	getPanes() {
		return this._panes;
	}
	/**
	* Returns the HTML element that contains the map.
	* @group Other methods
	* @returns {HTMLElement}
	*/
	getContainer() {
		return this._container;
	}
	/**
	* Returns the scale factor to be applied to a map transition from zoom level
	* `fromZoom` to `toZoom`. Used internally to help with zoom animations.
	* @group Conversion methods
	* @param {number} toZoom
	* @param {number} [fromZoom]
	* @returns {number}
	*/
	getZoomScale(toZoom, fromZoom) {
		const crs = this.options.crs;
		fromZoom ??= this._zoom;
		return crs.scale(toZoom) / crs.scale(fromZoom);
	}
	/**
	* Returns the zoom level that the map would end up at, if it is at `fromZoom`
	* level and everything is scaled by a factor of `scale`. Inverse of
	* [`getZoomScale`](#map-getZoomScale).
	* @group Conversion methods
	* @param {number} scale
	* @param {number} [fromZoom]
	* @returns {number}
	*/
	getScaleZoom(scale, fromZoom) {
		const crs = this.options.crs;
		fromZoom ??= this._zoom;
		const zoom = crs.zoom(scale * crs.scale(fromZoom));
		return isNaN(zoom) ? Infinity : zoom;
	}
	/**
	* Projects a geographical coordinate `LatLng` according to the projection
	* of the map's CRS, then scales it according to `zoom` and the CRS's
	* `Transformation`. The result is pixel coordinate relative to
	* the CRS origin.
	* @group Conversion methods
	* @param {LatLngExpression} latlng
	* @param {number} [zoom]
	* @returns {Point}
	*/
	project(latlng, zoom) {
		zoom ??= this._zoom;
		return this.options.crs.latLngToPoint(LatLng.from(latlng), zoom);
	}
	/**
	* Inverse of [`project`](#map-project).
	* @group Conversion methods
	* @param {PointExpression} point
	* @param {number} [zoom]
	* @returns {LatLng}
	*/
	unproject(point, zoom) {
		zoom ??= this._zoom;
		return this.options.crs.pointToLatLng(Point.from(point), zoom);
	}
	/**
	* Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
	* returns the corresponding geographical coordinate (for the current zoom level).
	* @group Conversion methods
	* @param {PointExpression} point
	* @returns {LatLng}
	*/
	layerPointToLatLng(point) {
		const projectedPoint = Point.from(point).add(this.getPixelOrigin());
		return this.unproject(projectedPoint);
	}
	/**
	* Given a geographical coordinate, returns the corresponding pixel coordinate
	* relative to the [origin pixel](#map-getpixelorigin).
	* @group Conversion methods
	* @param {LatLngExpression} latlng
	* @returns {Point}
	*/
	latLngToLayerPoint(latlng) {
		return this.project(LatLng.from(latlng))._subtract(this.getPixelOrigin());
	}
	/**
	* Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
	* map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
	* CRS's bounds.
	* By default this means longitude is wrapped around the dateline so its
	* value is between -180 and +180 degrees.
	* @group Conversion methods
	* @param {LatLngExpression} latlng
	* @returns {LatLng}
	*/
	wrapLatLng(latlng) {
		return this.options.crs.wrapLatLng(LatLng.from(latlng));
	}
	/**
	* Returns a `LatLngBounds` with the same size as the given one, ensuring that
	* its center is within the CRS's bounds.
	* By default this means the center longitude is wrapped around the dateline so its
	* value is between -180 and +180 degrees, and the majority of the bounds
	* overlaps the CRS's bounds.
	* @group Conversion methods
	* @param {LatLngBoundsExpression} bounds
	* @returns {LatLngBounds}
	*/
	wrapLatLngBounds(bounds) {
		return this.options.crs.wrapLatLngBounds(new LatLngBounds(bounds));
	}
	/**
	* Returns the distance between two geographical coordinates according to
	* the map's CRS. By default this measures distance in meters.
	* @group Conversion methods
	* @param {LatLngExpression} latlng1
	* @param {LatLngExpression} latlng2
	* @returns {number}
	*/
	distance(latlng1, latlng2) {
		return this.options.crs.distance(LatLng.from(latlng1), LatLng.from(latlng2));
	}
	/**
	* Given a pixel coordinate relative to the map container, returns the corresponding
	* pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
	* @group Conversion methods
	* @param {PointExpression} point
	* @returns {Point}
	*/
	containerPointToLayerPoint(point) {
		return Point.from(point).subtract(this._getMapPanePos());
	}
	/**
	* Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
	* returns the corresponding pixel coordinate relative to the map container.
	* @group Conversion methods
	* @param {PointExpression} point
	* @returns {Point}
	*/
	layerPointToContainerPoint(point) {
		return Point.from(point).add(this._getMapPanePos());
	}
	/**
	* Given a pixel coordinate relative to the map container, returns
	* the corresponding geographical coordinate (for the current zoom level).
	* @group Conversion methods
	* @param {PointExpression} point
	* @returns {LatLng}
	*/
	containerPointToLatLng(point) {
		const layerPoint = this.containerPointToLayerPoint(Point.from(point));
		return this.layerPointToLatLng(layerPoint);
	}
	/**
	* Given a geographical coordinate, returns the corresponding pixel coordinate
	* relative to the map container.
	* @group Conversion methods
	* @param {LatLngExpression} latlng
	* @returns {Point}
	*/
	latLngToContainerPoint(latlng) {
		return this.layerPointToContainerPoint(this.latLngToLayerPoint(LatLng.from(latlng)));
	}
	/**
	* Given a PointerEvent object, returns the pixel coordinate relative to the
	* map container where the event took place.
	* @group Conversion methods
	* @param {MouseEvent|PointerEvent} e
	* @returns {Point}
	*/
	pointerEventToContainerPoint(e) {
		return getPointerPosition(e, this._container);
	}
	/**
	* Given a PointerEvent object, returns the pixel coordinate relative to
	* the [origin pixel](#map-getpixelorigin) where the event took place.
	* @group Conversion methods
	* @param {MouseEvent|PointerEvent} e
	* @returns {Point}
	*/
	pointerEventToLayerPoint(e) {
		return this.containerPointToLayerPoint(this.pointerEventToContainerPoint(e));
	}
	/**
	* Given a PointerEvent object, returns geographical coordinate where the
	* event took place.
	* @group Conversion methods
	* @param {MouseEvent|PointerEvent} e
	* @returns {LatLng}
	*/
	pointerEventToLatLng(e) {
		return this.layerPointToLatLng(this.pointerEventToLayerPoint(e));
	}
	_initContainer(id) {
		const container = this._container = get(id);
		if (!container) throw new Error("Map container not found.");
		else if (container._maplair_id) throw new Error("Map container is already initialized.");
		enablePointerDetection(container);
		on(container, "scroll", this._onScroll, this);
		this._containerId = stamp(container);
	}
	_initLayout() {
		const container = this._container;
		this._fadeAnimated = this.options.fadeAnimation;
		const classes = ["maplair-container", "maplair-touch"];
		if (window.devicePixelRatio > 1) classes.push("maplair-retina");
		if (this._fadeAnimated) classes.push("maplair-fade-anim");
		container.classList.add(...classes);
		this._ariaAttributes = [];
		if (!container.hasAttribute("role")) {
			container.setAttribute("role", "region");
			this._ariaAttributes.push("role");
		}
		if (!container.hasAttribute("aria-label") && !container.hasAttribute("aria-labelledby")) {
			container.setAttribute("aria-label", this.options.ariaLabel ?? I18n.translate("Map"));
			this._ariaAttributes.push("aria-label");
		}
		const { position } = getComputedStyle(container);
		if (position !== "absolute" && position !== "relative" && position !== "fixed" && position !== "sticky") container.style.position = "relative";
		this._initPanes();
		if (this._initControlPos) this._initControlPos();
	}
	_initPanes() {
		const panes = this._panes = {};
		this._paneRenderers = {};
		this._mapPane = this.createPane("mapPane", this._container);
		setPosition(this._mapPane, new Point(0, 0));
		this.createPane("tilePane");
		this.createPane("overlayPane");
		this.createPane("shadowPane");
		this.createPane("markerPane");
		this.createPane("tooltipPane");
		this.createPane("popupPane");
		if (!this.options.markerZoomAnimation) {
			panes.markerPane.classList.add("maplair-zoom-hide");
			panes.shadowPane.classList.add("maplair-zoom-hide");
		}
	}
	_resetView(center, zoom, noMoveStart) {
		const loading = !this._loaded;
		this._loaded = true;
		zoom = this._limitZoom(zoom);
		this.fire("viewprereset", {
			center,
			zoom
		});
		setPosition(this._mapPane, new Point(0, 0));
		const zoomChanged = this._zoom !== zoom;
		if (zoomChanged && !loading) this._instantZoomEnd = Date.now() + zoomAnimDuration;
		this._moveStart(zoomChanged, noMoveStart)._move(center, zoom)._moveEnd(zoomChanged);
		this.fire("viewreset");
		if (loading) this.fire("load");
	}
	/**
	* Fires an event of the specified type, see `Evented.fire()`. The map state change
	* events caused by the user get an `originalEvent` property (see the class
	* description).
	* @param {string} type
	* @param {object} [data]
	* @param {boolean} [propagate]
	* @returns {this}
	*/
	fire(type, data, propagate) {
		if (this._userEvent && MaplairMap._viewEvents.has(type)) {
			data = {
				originalEvent: this._userEvent,
				...data
			};
			if (type === "moveend") this._userEvent = null;
			else this._userMoving = true;
		}
		return super.fire(type, data, propagate);
	}
	static _viewEvents = /* @__PURE__ */ new Set([
		"movestart",
		"move",
		"moveend",
		"zoomstart",
		"zoom",
		"zoomend",
		"zoomanim"
	]);
	_watchPixelRatio(remove) {
		this._pixelRatioQuery?.removeEventListener("change", this._onPixelRatioChange);
		if (remove || typeof window === "undefined" || !window.matchMedia) return;
		this._onPixelRatioChange ??= () => {
			this._watchPixelRatio();
			this.fire("pixelratiochange");
		};
		this._pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
		this._pixelRatioQuery.addEventListener("change", this._onPixelRatioChange);
	}
	_onBusy() {
		this._viewChanging = true;
		this._idle = false;
	}
	_onMove() {
		this._cullingBounds = null;
	}
	_onViewChanged() {
		this._viewChanging = false;
		this._scheduleIdleCheck();
	}
	_onLayerLoading() {
		this._idle = false;
	}
	_scheduleIdleCheck() {
		cancelAnimationFrame(this._idleRequest);
		this._idleRequest = requestAnimationFrame(() => this._checkIdle());
	}
	_checkIdle() {
		if (this._idle || !this._loaded || this._viewChanging || this._animatingZoom) return;
		for (const layer of Object.values(this._layers)) if (layer.isLoading?.()) return;
		this._idle = true;
		this.fire("idle");
	}
	_setUserEvent(e) {
		this._userEvent = e;
		this._userMoving = false;
		queueMicrotask(() => {
			if (this._userEvent === e && !this._userMoving) this._userEvent = null;
		});
	}
	_moveStart(zoomChanged, noMoveStart) {
		if (zoomChanged) this.fire("zoomstart");
		if (!noMoveStart) this.fire("movestart");
		return this;
	}
	_move(center, zoom, data, suppressEvent) {
		if (zoom === void 0) zoom = this._zoom;
		const zoomChanged = this._zoom !== zoom;
		this._zoom = zoom;
		this._lastCenter = center;
		this._lastCenterPanePos = this._getMapPanePos();
		this._pixelOrigin = this._getNewPixelOrigin(center);
		if (!suppressEvent) {
			if (zoomChanged || data?.pinch) this.fire("zoom", data);
			this.fire("move", data);
		} else if (data?.pinch) this.fire("zoom", data);
		return this;
	}
	_moveEnd(zoomChanged) {
		if (zoomChanged) this.fire("zoomend");
		return this.fire("moveend");
	}
	_stop() {
		cancelAnimationFrame(this._flyToFrame);
		cancelAnimationFrame(this._zoomAnimFrame);
		this._panAnim?.stop();
		return this;
	}
	_rawPanBy(offset) {
		setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
	}
	_wrapWorldCopy(pos = this._getMapPanePos()) {
		if (!this._loaded || !this.options.worldCopyJump || this.options.crs.infinite) return pos;
		const width = this.getPixelWorldBounds().getSize().x, x = pos.x - width * Math.round((pos.x + this.latLngToLayerPoint([0, 0]).x - this.getSize().x / 2) / width), worlds = Math.round((x - this._getMapPanePos().x) / width);
		pos = new Point(x, pos.y);
		if (worlds) {
			setPosition(this._mapPane, pos);
			this.fire("worldcopyjump", { worlds });
		}
		return pos;
	}
	_getZoomSpan() {
		return this.getMaxZoom() - this.getMinZoom();
	}
	_panInsideMaxBounds() {
		if (!this._enforcingBounds) this.panInsideBounds(this.options.maxBounds);
	}
	_checkIfLoaded() {
		if (!this._loaded) throw new Error("Set map center and zoom first.");
	}
	_initEvents(remove) {
		this._targets = {};
		this._targets[stamp(this._container)] = this;
		(remove ? off : on)(this._container, "click dblclick pointerdown pointerup pointerover pointerout pointermove contextmenu keydown keyup", this._handleDOMEvent, this);
		if (this.options.trackResize) {
			if (!remove) {
				if (!this._resizeObserver) this._resizeObserver = new ResizeObserver(this._onResize.bind(this));
				this._resizeObserver.observe(this._container);
			} else this._resizeObserver.disconnect();
		}
		if (this.options.transform3DLimit) (remove ? this.off : this.on).call(this, "moveend", this._onMoveEnd);
	}
	_onResize() {
		cancelAnimationFrame(this._resizeRequest);
		this._resizeRequest = requestAnimationFrame(() => {
			if (this._container.clientWidth || this._container.clientHeight) this.invalidateSize({ debounceMoveend: true });
		});
	}
	_onScroll() {
		this._container.scrollTop = 0;
		this._container.scrollLeft = 0;
	}
	_onMoveEnd() {
		const pos = this._getMapPanePos();
		if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) this._resetView(this.getCenter(), this.getZoom());
	}
	_findEventTargets(e, type) {
		let targets = [], target, src = e.target, dragging = false;
		const isHover = type === "pointerout" || type === "pointerover";
		while (src) {
			target = this._targets[stamp(src)];
			if (target && (type === "click" || type === "preclick") && this._draggableMoved(target)) {
				dragging = true;
				break;
			}
			if (target && target.listens(type, true)) {
				if (isHover && !isExternalTarget(src, e)) break;
				targets.push(target);
				if (isHover) break;
			}
			if (src === this._container) break;
			src = src.parentNode;
		}
		if (!targets.length && !dragging && !isHover && this.listens(type, true)) targets = [this];
		return targets;
	}
	_isClickDisabled(el) {
		while (el && el !== this._container) {
			if (el["_maplair_disable_click"] || !el.parentNode) return true;
			el = el.parentNode;
		}
	}
	_handleDOMEvent(e) {
		const el = e.target;
		if (!this._loaded || el["_maplair_disable_events"] || e.type === "click" && this._isClickDisabled(el)) return;
		this._fireDOMEvent(e, e.type);
	}
	static _pointerEvents = [
		"click",
		"dblclick",
		"pointerover",
		"pointerout",
		"contextmenu"
	];
	_fireDOMEvent(e, type, canvasTargets) {
		if (type === "click") this._fireDOMEvent(e, "preclick", canvasTargets);
		let targets = this._findEventTargets(e, type);
		if (canvasTargets) targets = [...canvasTargets.filter((t) => t.listens(type, true)), ...targets];
		if (!targets.length) return;
		if (type === "contextmenu") e.preventDefault();
		const target = targets[0];
		const data = { originalEvent: e };
		if (e.type !== "keydown" && e.type !== "keyup") {
			const isMarker = target.getLatLng && (!target._pxRadius || target._pxRadius <= 10);
			data.containerPoint = isMarker ? this.latLngToContainerPoint(target.getLatLng()) : this.pointerEventToContainerPoint(e);
			data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
			data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
		}
		for (const t of targets) {
			t.fire(type, data, true);
			const bubbling = t.options.bubblingMouseEvents ?? t.options.bubblingPointerEvents;
			if (data.originalEvent._stopped || bubbling === false && MaplairMap._pointerEvents.includes(type)) return;
		}
	}
	_draggableMoved(obj) {
		obj = obj.dragging?.enabled() ? obj : this;
		return obj.dragging?.moved() || this.boxZoom?.moved();
	}
	/**
	* Runs the given function `callback` when the map gets initialized with
	* a view (center and zoom) and at least one layer, or immediately
	* if it's already initialized, optionally passing a function context.
	* @group Other methods
	* @param {(event: {target: MaplairMap}) => void} callback
	* @param {object} [context]
	* @returns {this}
	*/
	whenReady(callback, context) {
		if (this._loaded) callback.call(context || this, { target: this });
		else this.on("load", callback, context);
		return this;
	}
	_getMapPanePos() {
		return getPosition(this._mapPane);
	}
	_getTopLeftPoint(center, zoom) {
		return (center && zoom !== void 0 ? this._getNewPixelOrigin(center, zoom) : this.getPixelOrigin()).subtract(this._getMapPanePos());
	}
	_getNewPixelOrigin(center, zoom) {
		const viewHalf = this.getSize()._divideBy(2);
		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
	}
	_latLngToNewLayerPoint(latlng, zoom, center) {
		const topLeft = this._getNewPixelOrigin(center, zoom);
		return this.project(latlng, zoom)._subtract(topLeft);
	}
	_getCenterLayerPoint() {
		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
	}
	_getCenterOffset(latlng) {
		return this.latLngToLayerPoint(latlng)._round()._subtract(this._getCenterLayerPoint());
	}
	_limitCenter(center, zoom, bounds) {
		if (!bounds) return center;
		const centerPoint = this.project(center, zoom), viewHalf = this.getSize().divideBy(2), viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)), offset = this._getBoundsOffset(viewBounds, bounds, zoom);
		if (Math.abs(offset.x) <= 1 && Math.abs(offset.y) <= 1) return center;
		return this.unproject(centerPoint.add(offset), zoom);
	}
	_prefersReducedMotion() {
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}
	_limitOffset(offset, bounds) {
		if (!bounds) return offset;
		const viewBounds = this.getPixelBounds(), newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));
		return offset.add(this._getBoundsOffset(newBounds, bounds));
	}
	_getBoundsOffset(pxBounds, maxBounds, zoom) {
		const projectedMaxBounds = new Bounds(this.project(maxBounds.getNorthEast(), zoom), this.project(maxBounds.getSouthWest(), zoom)), minOffset = projectedMaxBounds.min.subtract(pxBounds.min), maxOffset = projectedMaxBounds.max.subtract(pxBounds.max);
		return new Point(this._rebound(minOffset.x, -maxOffset.x), this._rebound(minOffset.y, -maxOffset.y));
	}
	_rebound(left, right) {
		return left + right > 0 ? Math.round(left - right) / 2 : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	}
	_limitZoom(zoom) {
		const min = this.getMinZoom(), max = this.getMaxZoom(), snap = this.options.zoomSnap;
		if (snap) zoom = Math.round(zoom / snap) * snap;
		return Math.max(min, Math.min(max, zoom));
	}
	_onPanTransitionStep() {
		this.fire("move");
	}
	_onPanTransitionEnd() {
		this._mapPane.classList.remove("maplair-pan-anim");
		this._wrapWorldCopy();
		this.fire("moveend");
	}
	_tryAnimatedPan(center, options) {
		const offset = this._getCenterOffset(center)._trunc();
		if (options?.animate !== true && !this.getSize().contains(offset)) return false;
		this.panBy(offset, options);
		return true;
	}
	_createAnimProxy() {
		this._proxy = create("div", "maplair-proxy maplair-zoom-animated");
		this._panes.mapPane.appendChild(this._proxy);
		this.on("zoomanim", this._animateProxyZoom, this);
		this.on("load moveend", this._animMoveEnd, this);
		on(this._proxy, "transitionend", this._catchTransitionEnd, this);
	}
	_animateProxyZoom(e) {
		const transform = this._proxy.style.transform;
		setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));
		if (transform === this._proxy.style.transform && this._animatingZoom) this._onZoomTransitionEnd();
	}
	_animMoveEnd() {
		const c = this.getCenter();
		const z = this.getZoom();
		setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
	}
	_catchTransitionEnd(e) {
		if (this._animatingZoom && e.propertyName.includes("transform")) this._onZoomTransitionEnd();
	}
	_nothingToAnimate() {
		return !this._container.getElementsByClassName("maplair-zoom-animated").length;
	}
	_continuousZoom(center, zoom, offset, options) {
		const startZoom = this._zoom, originOffset = offset.multiplyBy(-1), origin = this.containerPointToLatLng(this.getSize()._divideBy(2).add(offset)), start = performance.now(), duration = 250;
		this._moveStart(true, options.noMoveStart ?? false);
		const frame = () => {
			const t = Math.min(1, (performance.now() - start) / duration);
			if (t < 1) {
				const z = startZoom + (zoom - startZoom) * (1 - (1 - t) ** 2);
				this._move(this.unproject(this.project(origin, z).add(originOffset), z), z, { continuous: true });
				this._flyToFrame = requestAnimationFrame(frame);
			} else this._move(center, zoom)._moveEnd(true);
		};
		this._flyToFrame = requestAnimationFrame(frame);
	}
	_zoomInputBlocked() {
		return this._animatingZoom || Date.now() < this._instantZoomEnd;
	}
	_tryAnimatedZoom(center, zoom, options) {
		if (this._animatingZoom) return true;
		options ??= {};
		const threshold = this.options.zoomAnimationThreshold, maxZoomDiff = this._prefersReducedMotion() && options.animate !== true ? Math.min(threshold, 1) : threshold;
		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() && !this.options.continuousZoom || Math.abs(zoom - this._zoom) > maxZoomDiff) return false;
		const scale = this.getZoomScale(zoom), offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);
		if (options.animate !== true && !this.getSize().contains(offset)) return false;
		if (this.options.continuousZoom) {
			this._continuousZoom(center, zoom, offset, options);
			return true;
		}
		const userEvent = this._userEvent;
		this._zoomAnimFrame = requestAnimationFrame(() => {
			this._zoomAnimFrame = null;
			if (userEvent) this._setUserEvent(userEvent);
			this._moveStart(true, options.noMoveStart ?? false)._animateZoom(center, zoom, true);
		});
		return true;
	}
	_animateZoom(center, zoom, startAnim, noUpdate) {
		if (!this._mapPane) return;
		if (startAnim) {
			this._animatingZoom = true;
			this._animateToCenter = center;
			this._animateToZoom = zoom;
			this._mapPane.classList.add("maplair-zoom-anim");
		}
		this.fire("zoomanim", {
			center,
			zoom,
			noUpdate
		});
		if (!this._tempFireZoomEvent) this._tempFireZoomEvent = this._zoom !== this._animateToZoom;
		this._move(this._animateToCenter, this._animateToZoom, void 0, true);
		this._transitionEndTimer = setTimeout(this._onZoomTransitionEnd.bind(this), zoomAnimDuration);
	}
	_onZoomTransitionEnd() {
		if (!this._animatingZoom) return;
		this._mapPane?.classList.remove("maplair-zoom-anim");
		this._animatingZoom = false;
		this._move(this._animateToCenter, this._animateToZoom, void 0, true);
		if (this._tempFireZoomEvent) this.fire("zoom");
		delete this._tempFireZoomEvent;
		this.fire("move");
		this._moveEnd(true);
	}
};
for (const feature of [
	AttributionControl,
	Control,
	DivOverlay,
	Layer,
	BoxZoomHandler,
	DoubleClickZoomHandler,
	DragHandler,
	KeyboardHandler,
	PinchZoomHandler,
	ScrollWheelZoomHandler,
	TapHoldHandler,
	TapDragZoomHandler,
	Popup,
	Tooltip,
	Renderer_getRenderer_exports,
	ZoomControl,
	FullscreenControl
]) feature.register(MaplairMap);
// src/layer/vector/Polyline.js
/** @import {Feature} from 'geojson' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/** @import {PathOptions} from './Path.js' */
/**
* Options of `Polyline`.
* @typedef {object} PolylineOptions
* @property {number} [smoothFactor=0.5] How much to simplify the polyline on each zoom
* level (Douglas–Peucker epsilon, in pixels). Higher values mean faster rendering but
* less accuracy; lower values mean more accuracy but slower rendering.
* @property {boolean} [noClip=false] Disable polyline clipping.
* @extends PathOptions
*/
/**
* A class for drawing polyline overlays on a map. Extends `Path`.
*
* @example
* ```js
* // create a red polyline from an array of LatLng points
* const latlngs = [
* 	[45.51, -122.68],
* 	[37.77, -122.43],
* 	[34.04, -118.2]
* ];
*
* const polyline = new Polyline(latlngs, {color: 'red'}).addTo(map);
*
* // zoom the map to the polyline
* map.fitBounds(polyline.getBounds());
* ```
*
* You can also pass a multi-dimensional array to represent a `MultiPolyline` shape:
*
* ```js
* // create a red polyline from an array of arrays of LatLng points
* const latlngs = [
* 	[[45.51, -122.68],
* 	 [37.77, -122.43],
* 	 [34.04, -118.2]],
* 	[[40.78, -73.91],
* 	 [41.83, -87.62],
* 	 [32.76, -96.72]]
* ];
* ```
*/
var Polyline = class Polyline extends Path {
	static defaultOptions = {
		smoothFactor: .5,
		noClip: false
	};
	/**
	* Instantiates a polyline object given an array of geographical points and
	* optionally an options object. You can create a `Polyline` object with
	* multiple separate lines (`MultiPolyline`) by passing an array of arrays
	* of geographic points.
	* @param {LatLngExpression[]|LatLngExpression[][]|LatLngExpression[][][]} latlngs
	* @param {PolylineOptions} [options]
	*/
	constructor(latlngs, options) {
		super();
		setOptions(this, options);
		this._setLatLngs(latlngs);
		this.callInitHooks(Polyline);
	}
	/**
	* Returns an array of the points in the path, or nested arrays of points in case of
	* multi-polyline.
	* @returns {LatLng[]|LatLng[][]|LatLng[][][]}
	*/
	getLatLngs() {
		return this._latlngs;
	}
	/**
	* Replaces all the points in the polyline with the given array of geographical points.
	* @param {LatLngExpression[]|LatLngExpression[][]|LatLngExpression[][][]} latlngs
	* @returns {this}
	*/
	setLatLngs(latlngs) {
		this._setLatLngs(latlngs);
		return this.redraw();
	}
	/**
	* Returns `true` if the Polyline has no LatLngs.
	* @returns {boolean}
	*/
	isEmpty() {
		return !this._latlngs.length;
	}
	/**
	* Returns the point closest to `p` on the Polyline, with its `distance` to `p` in
	* pixels, or `null` if the polyline is not visible.
	* @param {PointExpression} p
	* @returns {(Point & {distance: number})|null}
	*/
	closestLayerPoint(p) {
		p = Point.from(p);
		let minDistance = Infinity, minPoint = null, p1, p2;
		const closest = _sqClosestPointOnSegment;
		for (const points of this._parts) for (let i = 1, len = points.length; i < len; i++) {
			p1 = points[i - 1];
			p2 = points[i];
			const sqDist = closest(p, p1, p2, true);
			if (sqDist < minDistance) {
				minDistance = sqDist;
				minPoint = closest(p, p1, p2);
			}
		}
		if (minPoint) minPoint.distance = Math.sqrt(minDistance);
		return minPoint;
	}
	/**
	* Returns the center ([centroid](https://en.wikipedia.org/wiki/Centroid)) of the polyline.
	* @returns {LatLng}
	*/
	getCenter() {
		if (!this._map) throw new Error("Must add layer to map before using getCenter()");
		return polylineCenter(this._defaultShape(), this._map.options.crs);
	}
	/**
	* Returns the `LatLngBounds` of the path.
	* @returns {LatLngBounds}
	*/
	getBounds() {
		return this._bounds;
	}
	/**
	* Adds a given point to the polyline. By default, adds to the first ring of
	* the polyline in case of a multi-polyline, but can be overridden by passing
	* a specific ring as a LatLng array (that you can earlier access with
	* [`getLatLngs`](#polyline-getlatlngs)).
	* @param {LatLngExpression} latlng
	* @param {LatLng[]} [latlngs]
	* @returns {this}
	*/
	addLatLng(latlng, latlngs) {
		latlngs ??= this._defaultShape();
		latlng = new LatLng(latlng);
		latlngs.push(latlng);
		this._bounds.extend(latlng);
		return this.redraw();
	}
	_setLatLngs(latlngs) {
		this._bounds = new LatLngBounds();
		this._latlngs = this._convertLatLngs(latlngs);
	}
	_defaultShape() {
		return isFlat(this._latlngs) ? this._latlngs : this._latlngs[0];
	}
	_convertLatLngs(latlngs) {
		const result = [], flat = isFlat(latlngs);
		for (let i = 0, len = latlngs.length; i < len; i++) if (flat) {
			result[i] = new LatLng(latlngs[i]);
			this._bounds.extend(result[i]);
		} else result[i] = this._convertLatLngs(latlngs[i]);
		return result;
	}
	_project() {
		const pxBounds = new Bounds();
		this._rings = [];
		this._projectLatlngs(this._latlngs, this._rings, pxBounds);
		if (this._bounds.isValid() && pxBounds.isValid()) {
			this._rawPxBounds = pxBounds;
			this._updateBounds();
		}
	}
	_updateBounds() {
		const w = this._clickTolerance(), p = new Point(w, w);
		if (!this._rawPxBounds) return;
		this._pxBounds = new Bounds([this._rawPxBounds.min.subtract(p), this._rawPxBounds.max.add(p)]);
	}
	_projectLatlngs(latlngs, result, projectedBounds) {
		if (latlngs[0] instanceof LatLng) {
			const ring = latlngs.map((latlng) => this._map.latLngToLayerPoint(latlng));
			ring.forEach((r) => projectedBounds.extend(r));
			result.push(ring);
		} else latlngs.forEach((latlng) => this._projectLatlngs(latlng, result, projectedBounds));
	}
	_clipPoints() {
		const bounds = this._renderer._bounds;
		this._parts = [];
		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) return;
		if (this.options.noClip) {
			this._parts = this._rings;
			return;
		}
		const parts = this._parts;
		let i, j, k, len, len2, segment, points;
		for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
			points = this._rings[i];
			for (j = 0, len2 = points.length; j < len2 - 1; j++) {
				segment = clipSegment(points[j], points[j + 1], bounds, j);
				if (!segment) continue;
				parts[k] ??= [];
				parts[k].push(segment[0]);
				if (segment[1] !== points[j + 1] || j === len2 - 2) {
					parts[k].push(segment[1]);
					k++;
				}
			}
		}
	}
	_simplifyPoints() {
		const parts = this._parts, tolerance = this.options.smoothFactor;
		for (let i = 0, len = parts.length; i < len; i++) parts[i] = simplify(parts[i], tolerance);
	}
	_update() {
		if (!this._map) return;
		this._clipPoints();
		this._simplifyPoints();
		this._updatePath();
	}
	_updatePath() {
		this._renderer._updatePoly(this);
	}
	_containsPoint(p, closed) {
		let i, j, k, len, len2, part;
		const w = this._clickTolerance();
		if (!this._pxBounds || !this._pxBounds.contains(p)) return false;
		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];
			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				if (!closed && j === 0) continue;
				if (pointToSegmentDistance(p, part[k], part[j]) <= w) return true;
			}
		}
		return false;
	}
	/**
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
	* given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
	* representation of the polyline (as a GeoJSON `LineString` or `MultiLineString`
	* Feature).
	* @param {number|false} [precision]
	* @returns {Feature}
	*/
	toGeoJSON(precision) {
		const multi = !isFlat(this._latlngs);
		const coords = latLngsToCoords(this._latlngs, multi ? 1 : 0, false, precision);
		return getFeature(this, {
			type: `${multi ? "Multi" : ""}LineString`,
			coordinates: coords
		});
	}
};
// src/geometry/PolyUtil.js
var PolyUtil_exports = /* @__PURE__ */ __exportAll({
	centroid: () => centroid,
	clipPolygon: () => clipPolygon,
	polygonCenter: () => polygonCenter
});
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {Bounds} from './Bounds.js' */
/** @import {CRS} from '../geo/crs/CRS.js' */
/**
* Clips the polygon geometry defined by the given `points` by the given bounds (using
* the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
* Used by Maplair to only show polygon points that are on the screen or near, increasing
* performance. Note that polygon points needs different algorithm for clipping
* than polyline, so there's a separate method for it.
* @param {Point[]} points
* @param {Bounds} bounds
* @param {boolean} [round]
* @returns {Point[]}
*/
function clipPolygon(points, bounds, round) {
	let clippedPoints, i, j, k, a, b, len, edge, p;
	const edges = [
		1,
		4,
		2,
		8
	];
	for (i = 0, len = points.length; i < len; i++) points[i]._code = _getBitCode(points[i], bounds);
	for (k = 0; k < 4; k++) {
		edge = edges[k];
		clippedPoints = [];
		for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
			a = points[i];
			b = points[j];
			if (!(a._code & edge)) {
				if (b._code & edge) {
					p = _getEdgeIntersection(b, a, edge, bounds, round);
					p._code = _getBitCode(p, bounds);
					clippedPoints.push(p);
				}
				clippedPoints.push(a);
			} else if (!(b._code & edge)) {
				p = _getEdgeIntersection(b, a, edge, bounds, round);
				p._code = _getBitCode(p, bounds);
				clippedPoints.push(p);
			}
		}
		points = clippedPoints;
	}
	return points;
}
/**
* Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the passed
* LatLngs (first ring) from a polygon.
* @param {LatLngExpression[]|LatLngExpression[][]} latlngs
* @param {typeof CRS} crs
* @returns {LatLng}
*/
function polygonCenter(latlngs, crs) {
	const points = _projectRing(latlngs, crs), origin = new Point(points[0]), len = points.length;
	for (const p of points) p._subtract(origin);
	let area = 0, x = 0, y = 0;
	for (let i = 0, j = len - 1; i < len; j = i++) {
		const p1 = points[i], p2 = points[j], f = p1.y * p2.x - p2.y * p1.x;
		x += (p1.x + p2.x) * f;
		y += (p1.y + p2.y) * f;
		area += f;
	}
	return crs.unproject(area === 0 ? origin : new Point(x / (3 * area), y / (3 * area))._add(origin));
}
/**
* Returns the 'center of mass' of the passed LatLngs.
* @param {LatLngExpression[]} coords
* @returns {LatLng}
*/
function centroid(coords) {
	let latSum = 0;
	let lngSum = 0;
	let len = 0;
	for (const coord of coords) {
		const latlng = LatLng.from(coord);
		latSum += latlng.lat;
		lngSum += latlng.lng;
		len++;
	}
	return new LatLng([latSum / len, lngSum / len]);
}
// src/layer/vector/Polygon.js
/** @import {Feature} from 'geojson' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {PolylineOptions} from './Polyline.js' */
/**
* Options of `Polygon`.
* @typedef {object} PolygonOptions
* @property {boolean} [fill=true] Whether to fill the polygon with color.
* @extends PolylineOptions
*/
/**
* A class for drawing polygon overlays on a map. Extends `Polyline`.
*
* Note that points you pass when creating a polygon shouldn't have an additional last
* point equal to the first one — it's better to filter out such points.
*
* @example
* ```js
* // create a red polygon from an array of LatLng points
* const latlngs = [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]];
*
* const polygon = new Polygon(latlngs, {color: 'red'}).addTo(map);
*
* // zoom the map to the polygon
* map.fitBounds(polygon.getBounds());
* ```
*
* You can also pass an array of arrays of latlngs, with the first array representing
* the outer shape and the other arrays representing holes in the outer shape:
*
* ```js
* const latlngs = [
*   [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
*   [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
* ];
* ```
*
* Additionally, you can pass a multi-dimensional array to represent a MultiPolygon shape.
*
* ```js
* const latlngs = [
*   [ // first polygon
*     [[37, -109.05],[41, -109.03],[41, -102.05],[37, -102.04]], // outer ring
*     [[37.29, -108.58],[40.71, -108.58],[40.71, -102.50],[37.29, -102.50]] // hole
*   ],
*   [ // second polygon
*     [[41, -111.03],[45, -111.04],[45, -104.05],[41, -104.05]]
*   ]
* ];
* ```
*/
var Polygon = class Polygon extends Polyline {
	static defaultOptions = { fill: true };
	/**
	* Instantiates a polygon object given an array of geographical points (or arrays
	* of them for holes and multi-polygons) and optionally an options object.
	* @overload
	* @param {LatLngExpression[]|LatLngExpression[][]|LatLngExpression[][][]} latlngs
	* @param {PolygonOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(Polygon);
	}
	/**
	* Returns `true` if the Polygon has no LatLngs.
	* @returns {boolean}
	*/
	isEmpty() {
		return !this._latlngs.length || !this._latlngs[0].length;
	}
	/**
	* Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the Polygon.
	* @returns {LatLng}
	*/
	getCenter() {
		if (!this._map) throw new Error("Must add layer to map before using getCenter()");
		return polygonCenter(this._defaultShape(), this._map.options.crs);
	}
	_convertLatLngs(latlngs) {
		const result = super._convertLatLngs(latlngs), len = result.length;
		if (len >= 2 && result[0] instanceof LatLng && result[0].equals(result[len - 1])) result.pop();
		return result;
	}
	_setLatLngs(latlngs) {
		super._setLatLngs(latlngs);
		if (isFlat(this._latlngs)) this._latlngs = [this._latlngs];
	}
	_defaultShape() {
		return isFlat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
	}
	_clipPoints() {
		let bounds = this._renderer._bounds;
		const w = this.options.weight, p = new Point(w, w);
		bounds = new Bounds(bounds.min.subtract(p), bounds.max.add(p));
		this._parts = [];
		if (!this._pxBounds || !this._pxBounds.intersects(bounds)) return;
		if (this.options.noClip) {
			this._parts = this._rings;
			return;
		}
		for (const ring of this._rings) {
			const clipped = clipPolygon(ring, bounds);
			if (clipped.length) this._parts.push(clipped);
		}
	}
	_updatePath() {
		this._renderer._updatePoly(this, true);
	}
	_containsPoint(p) {
		let inside = false, part, p1, p2, i, j, k, len, len2;
		if (!this._pxBounds || !this._pxBounds.contains(p)) return false;
		for (i = 0, len = this._parts.length; i < len; i++) {
			part = this._parts[i];
			for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
				p1 = part[j];
				p2 = part[k];
				if (p1.y > p.y !== p2.y > p.y && p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x) inside = !inside;
			}
		}
		return inside || super._containsPoint(p, true);
	}
	/**
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
	* given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
	* representation of the polygon (as a GeoJSON `Polygon` or `MultiPolygon` Feature).
	* @param {number|false} [precision]
	* @returns {Feature}
	*/
	toGeoJSON(precision) {
		const holes = !isFlat(this._latlngs), multi = holes && !isFlat(this._latlngs[0]);
		let coords = latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true, precision);
		if (!holes) coords = [coords];
		return getFeature(this, {
			type: `${multi ? "Multi" : ""}Polygon`,
			coordinates: coords
		});
	}
};
// src/control/MiniMapControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMapOptions} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {PathOptions} from '../layer/vector/Path.js' */
/**
* Options of `MiniMapControl`.
* @typedef {object} MiniMapControlOptions
* @property {string} [position='bottomright'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {number} [width=150] The width of the overview map in pixels.
* @property {number} [height=150] The height of the overview map in pixels.
* @property {number} [zoomOffset=-5] The zoom level of the overview map relative to the
* map.
* @property {boolean} [collapsed=false] Whether the overview map is collapsed initially.
* @property {PathOptions} [rectangleOptions={color: '#ff7800', weight: 1, fillOpacity: 0.2}]
* The style of the rectangle showing the view of the map.
* @property {MaplairMapOptions} [mapOptions={}] Further options of the overview map.
* @extends ControlOptions
*/
/**
* An overview map in a corner of the map, showing the view of the map as a
* rectangle (or rotated rectangle on a rotated map) at a smaller zoom level.
* Dragging the overview map pans the map, clicking it centers the map there, and
* a button collapses it.
*
* Inspired by the [Leaflet-MiniMap](https://github.com/Norkart/Leaflet-MiniMap) plugin.
*
* @example
* ```js
* // a layer of its own, a layer can only be on one map
* const overviewLayer = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
* new MiniMapControl(overviewLayer).addTo(map);
* ```
*/
var MiniMapControl = class MiniMapControl extends Control {
	static defaultOptions = {
		position: "bottomright",
		width: 150,
		height: 150,
		zoomOffset: -5,
		collapsed: false,
		rectangleOptions: {
			color: "#ff7800",
			weight: 1,
			fillOpacity: .2
		},
		mapOptions: {}
	};
	/**
	* Creates an overview map control showing `layer` (which must not be on another map).
	* @param {Layer} layer
	* @param {MiniMapControlOptions} [options]
	*/
	constructor(layer, options) {
		super(options);
		this._layer = layer;
		this.callInitHooks(MiniMapControl);
	}
	/**
	* Adds the control to the given map.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	addTo(map) {
		super.addTo(map);
		this._miniMap.invalidateSize({ pan: false });
		this._update();
		return this;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-control-minimap"), mapContainer = create("div", "maplair-control-minimap-map", container);
		container.style.width = `${this.options.width}px`;
		container.style.height = `${this.options.height}px`;
		const toggle = this._toggle = create("button", "maplair-control-minimap-toggle", container);
		toggle.type = "button";
		on(toggle, "click", stop);
		on(toggle, "click", this.toggle, this);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		this._miniMap = new MaplairMap(mapContainer, {
			attributionControl: false,
			zoomControl: false,
			doubleClickZoom: false,
			scrollWheelZoom: false,
			boxZoom: false,
			keyboard: false,
			pinchZoom: false,
			tapDragZoom: false,
			ariaLabel: I18n.translate("Overview map"),
			...this.options.mapOptions,
			layers: [this._layer]
		});
		mapContainer.tabIndex = -1;
		this._rectangle = new Polygon([], {
			interactive: false,
			...this.options.rectangleOptions
		});
		this._miniMap.on({
			moveend: this._onMiniMapMoveEnd,
			click: this._onMiniMapClick
		}, this);
		map.on("move zoom rotate resize", this._update, this);
		map.whenReady(this._update, this);
		this._setCollapsed(this.options.collapsed);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("move zoom rotate resize", this._update, this);
		this._miniMap.remove();
		this._miniMap = null;
	}
	/**
	* Returns the overview map.
	* @returns {MaplairMap}
	*/
	getMiniMap() {
		return this._miniMap;
	}
	/**
	* Collapses or expands the overview map.
	* @returns {this}
	*/
	toggle() {
		return this._setCollapsed(!this._collapsed);
	}
	_setCollapsed(collapsed) {
		this._collapsed = collapsed;
		const container = this._container ?? this._toggle.parentNode, title = collapsed ? I18n.translate("Show the overview map") : I18n.translate("Hide the overview map");
		container.classList.toggle("maplair-control-minimap-collapsed", collapsed);
		this._toggle.title = title;
		this._toggle.setAttribute("aria-label", title);
		this._toggle.setAttribute("aria-expanded", !collapsed);
		if (!collapsed) {
			this._miniMap.invalidateSize();
			this._update();
		}
		return this;
	}
	_update() {
		const map = this._map, miniMap = this._miniMap;
		if (!map?._loaded || !miniMap || this._collapsed) return;
		const zoom = Math.max(miniMap.getMinZoom(), Math.min(map.getZoom() + this.options.zoomOffset, miniMap.getMaxZoom()));
		miniMap.setView(map.getCenter(), zoom, { animate: false });
		const size = map.getSize();
		this._rectangle.setLatLngs([
			[0, 0],
			[size.x, 0],
			size,
			[0, size.y]
		].map((p) => map.containerPointToLatLng(p)));
		if (!miniMap.hasLayer(this._rectangle)) this._rectangle.addTo(miniMap);
	}
	_onMiniMapMoveEnd(e) {
		if (e.originalEvent) this._map.panTo(this._miniMap.getCenter());
	}
	_onMiniMapClick(e) {
		if (!this._miniMap.dragging?.moved()) this._map.panTo(e.latlng);
	}
};
// src/control/ScaleControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/**
* Options of `ScaleControl`.
* @typedef {object} ScaleControlOptions
* @property {string} [position='bottomleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {number} [maxWidth=100] Maximum width of the control in pixels. The width is
* set dynamically to show round values (e.g. 100, 200, 500).
* @property {boolean} [metric=true] Whether to show the metric scale line (m/km).
* @property {boolean} [imperial=true] Whether to show the imperial scale line (mi/ft).
* @property {boolean} [updateWhenIdle=false] If `true`, the control is updated on
* [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on
* [`move`](#map-move)).
* @extends ControlOptions
*/
/**
* A simple scale control that shows the scale of the current center of screen in metric
* (m/km) and imperial (mi/ft) systems.
*
* @example
*
* ```js
* new ScaleControl().addTo(map);
* ```
*/
var ScaleControl = class ScaleControl extends Control {
	static defaultOptions = {
		position: "bottomleft",
		maxWidth: 100,
		metric: true,
		imperial: true,
		updateWhenIdle: false
	};
	/**
	* Creates a scale control with the given options.
	* @param {...ScaleControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(ScaleControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const className = "maplair-control-scale", container = create("div", className), options = this.options;
		this._addScales(options, `${className}-line`, container);
		map.on(options.updateWhenIdle ? "moveend" : "move", this._update, this);
		map.whenReady(this._update, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this);
	}
	_addScales(options, className, container) {
		if (options.metric) this._mScale = create("div", className, container);
		if (options.imperial) this._iScale = create("div", className, container);
	}
	_update() {
		const map = this._map, y = map.getSize().y / 2;
		const maxMeters = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([this.options.maxWidth, y]));
		this._updateScales(maxMeters);
	}
	_updateScales(maxMeters) {
		if (this.options.metric && maxMeters) this._updateMetric(maxMeters);
		if (this.options.imperial && maxMeters) this._updateImperial(maxMeters);
	}
	_updateMetric(maxMeters) {
		const meters = this._getRoundNum(maxMeters), label = meters < 1e3 ? I18n.translate("{meters} m", { meters }) : I18n.translate("{kilometers} km", { kilometers: meters / 1e3 });
		this._updateScale(this._mScale, label, meters / maxMeters);
	}
	_updateImperial(maxMeters) {
		const maxFeet = maxMeters * 3.2808399;
		let maxMiles, miles, feet;
		if (maxFeet > 5280) {
			maxMiles = maxFeet / 5280;
			miles = this._getRoundNum(maxMiles);
			this._updateScale(this._iScale, I18n.translate("{miles} mi", { miles }), miles / maxMiles);
		} else {
			feet = this._getRoundNum(maxFeet);
			this._updateScale(this._iScale, I18n.translate("{feet} ft", { feet }), feet / maxFeet);
		}
	}
	_updateScale(scale, text, ratio) {
		scale.style.width = `${Math.round(this.options.maxWidth * ratio)}px`;
		scale.innerHTML = text;
	}
	_getRoundNum(num) {
		const pow10 = 10 ** (`${Math.floor(num)}`.length - 1);
		let d = num / pow10;
		d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
		return pow10 * d;
	}
};
// src/layer/marker/Icon.js
/** @import {PointExpression} from '../../geometry/Point.js' */
/**
* Options of `Icon`.
* @typedef {object} IconOptions
* @property {string} [iconUrl] **(required)** The URL to the icon image (absolute or
* relative to your script path).
* @property {string} [iconRetinaUrl] The URL to a retina sized version of the icon
* image (absolute or relative to your script path). Used for Retina screen devices.
* @property {PointExpression|number} [iconSize] Size of the icon image in pixels (a
* number for square icons).
* @property {PointExpression} [iconAnchor] The coordinates of the "tip" of the icon
* (relative to its top left corner). The icon will be aligned so that this point is at
* the marker's geographical location. Centered by default if size is specified, also
* can be set in CSS with negative margins.
* @property {PointExpression} [popupAnchor=[0, 0]] The coordinates of the point from
* which popups will "open", relative to the icon anchor.
* @property {PointExpression} [tooltipAnchor=[0, 0]] The coordinates of the point from
* which tooltips will "open", relative to the icon anchor.
* @property {string} [shadowUrl] The URL to the icon shadow image. If not specified, no
* shadow image will be created.
* @property {string} [shadowRetinaUrl] The URL to a retina sized version of the shadow
* image. Used for Retina screen devices.
* @property {PointExpression|number} [shadowSize] Size of the shadow image in pixels.
* @property {PointExpression} [shadowAnchor] The coordinates of the "tip" of the shadow
* (relative to its top left corner) (the same as iconAnchor if not specified).
* @property {string} [className] A custom class name to assign to both icon and shadow
* images. Empty by default.
* @property {boolean|string} [crossOrigin=false] Whether the crossOrigin attribute will
* be added to the icon images. If a String is provided, all images will have their
* crossOrigin attribute set to the String provided. This is needed if you want to
* access image pixel data. Refer to
* [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
* for valid String values.
*/
/**
* Represents an icon to provide when creating a marker.
*
* `DefaultIcon` extends `Icon` and is the blue icon Maplair uses for markers by default.
*
* @example
* ```js
* const myIcon = new Icon({
*     iconUrl: 'my-icon.png',
*     iconRetinaUrl: 'my-icon@2x.png',
*     iconSize: [38, 95],
*     iconAnchor: [22, 94],
*     popupAnchor: [-3, -76],
*     shadowUrl: 'my-icon-shadow.png',
*     shadowRetinaUrl: 'my-icon-shadow@2x.png',
*     shadowSize: [68, 95],
*     shadowAnchor: [22, 94]
* });
*
* new Marker([50.505, 30.57], {icon: myIcon}).addTo(map);
* ```
*/
var Icon = class Icon extends Class {
	static defaultOptions = {
		popupAnchor: [0, 0],
		tooltipAnchor: [0, 0],
		crossOrigin: false
	};
	/**
	* Creates an icon instance with the given options.
	* @param {IconOptions} [options]
	*/
	constructor(options) {
		super();
		setOptions(this, options);
		this.callInitHooks(Icon);
	}
	/**
	* Called internally when the icon has to be shown, returns a `<img>` HTML element
	* styled according to the options.
	* @param {HTMLElement} [oldIcon] The current element of the icon, to be reused if possible.
	* @returns {HTMLElement}
	*/
	createIcon(oldIcon) {
		return this._createIcon("icon", oldIcon);
	}
	/**
	* As `createIcon`, but for the shadow beneath it. Returns `null` without a shadow.
	* @param {HTMLElement} [oldIcon] The current element of the shadow, to be reused if possible.
	* @returns {HTMLElement|null}
	*/
	createShadow(oldIcon) {
		return this._createIcon("shadow", oldIcon);
	}
	_createIcon(name, oldIcon) {
		const src = this._getIconUrl(name);
		if (!src) {
			if (name === "icon") throw new Error("iconUrl not set in Icon options (see the docs).");
			return null;
		}
		const img = this._createImg(src, oldIcon instanceof HTMLImageElement ? oldIcon : null);
		this._setIconStyles(img, name);
		if (this.options.crossOrigin || this.options.crossOrigin === "") img.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
		return img;
	}
	_setIconStyles(img, name) {
		const options = this.options;
		let sizeOption = options[`${name}Size`];
		if (typeof sizeOption === "number") sizeOption = [sizeOption, sizeOption];
		const size = Point.validate(sizeOption) && Point.from(sizeOption);
		const anchorPosition = name === "shadow" && options.shadowAnchor || options.iconAnchor || size && size.divideBy(2, true);
		const anchor = Point.validate(anchorPosition) && Point.from(anchorPosition);
		img.className = `maplair-marker-${name} ${options.className || ""}`;
		if (anchor) {
			img.style.marginLeft = `${-anchor.x}px`;
			img.style.marginTop = `${-anchor.y}px`;
		}
		img.style.transformOrigin = anchor ? `${anchor.x}px ${anchor.y}px` : "0 0";
		if (size) {
			img.style.width = `${size.x}px`;
			img.style.height = `${size.y}px`;
		}
	}
	_createImg(src, el) {
		el ??= document.createElement("img");
		el.src = src;
		return el;
	}
	_getIconUrl(name) {
		return window.devicePixelRatio > 1 && this.options[`${name}RetinaUrl`] || this.options[`${name}Url`];
	}
};
// src/layer/marker/DefaultIcon.js
/** @import {IconOptions} from './Icon.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/**
* Options of `DefaultIcon`.
* @typedef {object} DefaultIconOptions
* @property {string} [iconUrl] The maple leaf marker, inlined as an SVG data URI.
* @property {string} [shadowUrl] Its shadow, inlined as an SVG data URI.
* @property {PointExpression|number} [iconSize=[25, 41]]
* @property {PointExpression} [iconAnchor=[12, 41]]
* @property {PointExpression} [popupAnchor=[1, -34]]
* @property {PointExpression} [tooltipAnchor=[16, -28]]
* @property {PointExpression|number} [shadowSize=[41, 41]]
* @extends IconOptions
*/
/**
* A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
* no icon is specified. The maple leaf marker and its shadow are inlined as SVG data
* URIs, so they work with any bundler and need no image files.
*
* In order to customize the default icon, just change the properties of
* `DefaultIcon.defaultOptions` (which is a set of `Icon options`).
*
* If you want to _completely_ replace the default icon, override the
* `Marker.defaultOptions.icon` with your own icon instead.
*/
var DefaultIcon = class DefaultIcon extends Icon {
	static defaultOptions = {
		iconUrl: "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round\" viewBox=\"0 0 500 820\"><defs><linearGradient id=\"a\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"0\" gradientTransform=\"rotate(-90 478.727 62.272)scale(37.566)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"%23C2331B\"/><stop offset=\"1\" stop-color=\"%23E2603F\"/></linearGradient><linearGradient id=\"b\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"0\" gradientTransform=\"rotate(-90 468.484 54.002)scale(19.053)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"%238F2D20\"/><stop offset=\"1\" stop-color=\"%23B23A27\"/></linearGradient></defs><path fill=\"url(%23a)\" stroke=\"url(%23b)\" stroke-width=\"1.1\" stroke-linejoin=\"miter\" stroke-miterlimit=\"10\" d=\"M416.500 542.096L420.919 533.569L422.024 531.437L424.460 529.996L424.233 527.174L426.670 525.732L426.382 522.881L428.720 521.213L428.075 518.393L429.979 516.125L428.342 513.639L429.080 510.777L426.581 509.207L426.168 506.292L423.266 505.773L421.781 503.221L418.898 503.859L416.511 502.112L414.131 503.870L411.248 503.241L409.766 505.793L406.865 506.302L406.439 509.216L403.933 510.775L404.661 513.641L403.023 516.136L404.935 518.393L404.271 521.204L406.590 522.896L406.299 525.752L408.738 527.189L408.516 530.011L410.956 531.448L412.065 533.578Z\" transform=\"translate(-7889.1 -9807.44)scale(19.5417)\"/><path fill=\"%23FFF\" d=\"m-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z\" transform=\"translate(250 258)scale(.068)\"/></svg>",
		shadowUrl: "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" viewBox=\"0 0 817.2 820\"><radialGradient id=\"a\" cx=\"526.6\" cy=\"486.836\" r=\"478.154\" fx=\"275.876\" fy=\"893.983\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" style=\"stop-color:%235c5c5c;stop-opacity:.9477\"/><stop offset=\".112\" style=\"stop-color:%23474747;stop-opacity:.7805\"/><stop offset=\".34\" style=\"stop-color:%23202020;stop-opacity:.4413\"/><stop offset=\".523\" style=\"stop-color:%23090909;stop-opacity:.1692\"/><stop offset=\".637\" style=\"stop-color:%23000;stop-opacity:0\"/></radialGradient><path d=\"M254.7 820.0L430.1 664.9L473.9 626.1L541.3 599.9L561.5 548.6L629.0 522.4L648.1 470.5L715.4 440.2L726.3 388.9L789.2 347.6L774.9 302.4L817.1 250.3L775.4 221.8L792.3 168.8L732.1 159.3L721.8 112.9L651.7 124.5L614.0 92.7L545.0 124.7L486.2 113.3L430.2 159.7L360.8 169.0L325.1 222.0L255.1 250.3L245.6 302.4L186.6 347.8L209.1 388.9L169.0 440.0L205.6 470.8L173.5 522.7L215.1 548.9L184.8 600.2L226.4 626.3L232.1 665.1Z\" style=\"fill-rule:evenodd;clip-rule:evenodd;fill:url(%23a);fill-opacity:.7;filter:blur(15px)\"/></svg>",
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		tooltipAnchor: [16, -28],
		shadowSize: [41, 41]
	};
	/**
	* Creates the default icon, optionally with changed options.
	* @param {[options?: DefaultIconOptions]} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(DefaultIcon);
	}
};
// src/layer/marker/Marker.Drag.js
/** @import {Marker, MarkerMoveEvent} from './Marker.js' */
/** @import {MaplairEvent, DragEndEvent} from '../../core/Events.js' */
/**
* The handler of `Marker` which makes the markers draggable, see the
* [`dragging`](#marker-dragging) property of markers and its `draggable` option.
*
* @fires Marker#dragstart {MaplairEvent} Fired when the user starts dragging the marker.
* @fires Marker#movestart {MaplairEvent} Fired when the marker starts moving (because of
* dragging).
* @fires Marker#drag {MarkerMoveEvent} Fired repeatedly while the user drags the marker.
* @fires Marker#dragend {DragEndEvent} Fired when the user stops dragging the marker.
* @fires Marker#moveend {MaplairEvent} Fired when the marker stops moving (because of
* dragging).
*/
var MarkerDrag = class MarkerDrag extends Handler {
	/**
	* Creates the dragging handler of the given marker.
	* @param {Marker} marker
	*/
	constructor(marker) {
		super(marker._map);
		this._marker = marker;
		this.callInitHooks(MarkerDrag);
	}
	/**
	* Makes the icon of the marker draggable, called by `enable()`.
	*/
	addHooks() {
		const icon = this._marker._icon;
		if (!this._draggable) this._draggable = new Draggable(icon);
		this._draggable.on({
			dragstart: this._onDragStart,
			predrag: this._onPreDrag,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).enable();
		icon.classList.add("maplair-marker-draggable");
	}
	/**
	* Makes the icon of the marker undraggable, called by `disable()`.
	*/
	removeHooks() {
		this._draggable.off({
			dragstart: this._onDragStart,
			predrag: this._onPreDrag,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).disable();
		this._marker._icon?.classList.remove("maplair-marker-draggable");
	}
	/**
	* Returns `true` if the marker has been moved by the current or last drag.
	* @returns {boolean}
	*/
	moved() {
		return this._draggable?._moved;
	}
	_adjustPan(e) {
		const marker = this._marker, map = marker._map, speed = this._marker.options.autoPanSpeed, padding = this._marker.options.autoPanPadding, iconPos = getPosition(marker._icon), bounds = map.getPixelBounds(), origin = map.getPixelOrigin();
		const panBounds = new Bounds(bounds.min._subtract(origin).add(padding), bounds.max._subtract(origin).subtract(padding));
		if (!panBounds.contains(iconPos)) {
			const movement = new Point((Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) - (Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x), (Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) - (Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)).multiplyBy(speed);
			map.panBy(movement, { animate: false });
			this._draggable._newPos._add(movement);
			this._draggable._startPos._add(movement);
			setPosition(marker._icon, this._draggable._newPos);
			this._onDrag(e);
			this._panRequest = requestAnimationFrame(this._adjustPan.bind(this, e));
		}
	}
	_onDragStart() {
		this._oldLatLng = this._marker.getLatLng();
		this._marker.closePopup?.();
		this._marker.fire("movestart").fire("dragstart");
	}
	_onPreDrag(e) {
		if (this._marker.options.autoPan) {
			cancelAnimationFrame(this._panRequest);
			this._panRequest = requestAnimationFrame(this._adjustPan.bind(this, e));
		}
	}
	_onDrag(e) {
		const marker = this._marker, iconPos = getPosition(marker._icon), latlng = marker._map.layerPointToLatLng(iconPos);
		marker._positionElements(iconPos);
		marker._latlng = latlng;
		e.latlng = latlng;
		e.oldLatLng = this._oldLatLng;
		marker.fire("move", e).fire("drag", e);
	}
	_onDragEnd(e) {
		cancelAnimationFrame(this._panRequest);
		delete this._oldLatLng;
		this._marker.fire("moveend").fire("dragend", e);
	}
};
// src/layer/marker/Marker.js
/** @import {Feature} from 'geojson' */
/** @import {Icon} from './Icon.js' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {InteractiveLayerOptions} from '../Layer.js' */
/**
* Options of `Marker`.
* @typedef {object} MarkerOptions
* @property {Icon} [icon=new DefaultIcon()] Icon instance to use for rendering the
* marker. See [Icon documentation](#Icon) for details on how to customize the marker
* icon. If not specified, a common instance of `DefaultIcon` is used.
* @property {boolean} [keyboard=true] Whether the marker can be tabbed to with a keyboard
* and, if interactive, clicked by pressing Enter or Space.
* @property {string} [title=''] Text for the browser tooltip that appear on marker hover
* (no tooltip by default).
* [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
* @property {string} [alt='Marker'] Text for the `alt` attribute of the icon image.
* [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
* @property {number} [zIndexOffset=0] By default, marker images zIndex is set
* automatically based on its latitude. Use this option if you want to put the marker on
* top of all others (or below), specifying a high value like `1000` (or high negative
* value, respectively).
* @property {number} [opacity=1] The opacity of the marker.
* @property {number|null} [rotation=null] Rotation of the marker icon in degrees,
* clockwise, around the icon anchor, e.g. for the heading of a vehicle. A rotated
* marker, even at 0°, has no shadow, since the shadow of an upright pin looks wrong
* under a tilted one. `null` means no rotation.
* @property {boolean} [riseOnHover=false] If `true`, the marker will get on top of
* others when you hover the pointer over it.
* @property {number} [riseOffset=250] The z-index offset used for the `riseOnHover`
* feature.
* @property {string} [pane='markerPane'] `Map pane` where the markers icon will be added.
* @property {string} [shadowPane='shadowPane'] `Map pane` where the markers shadow will
* be added.
* @property {boolean} [shadow=true] Whether to show the shadow of the marker's icon. Each
* shadow is an additional element on the page, so disabling shadows noticeably reduces
* the browser's rendering work when showing many markers (e.g. several thousands),
* especially while panning and zooming. To disable shadows for all markers, use
* `Marker.mergeOptions({shadow: false})`.
* @property {boolean} [bubblingPointerEvents=false] When `true`, a pointer event on this
* marker will trigger the same event on the map (unless
* [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
* @property {boolean} [autoPanOnFocus=true] When `true`, the map will pan whenever the
* marker is focused (via e.g. pressing `tab` on the keyboard) to ensure the marker is
* visible within the map's bounds.
* @property {boolean} [draggable=false] Whether the marker is draggable with pointer or
* not.
* @property {boolean} [autoPan=false] Whether to pan the map when dragging this marker
* near its edge or not.
* @property {PointExpression} [autoPanPadding=[50, 50]] Distance (in pixels to the
* left/right and to the top/bottom) of the map edge to start panning the map.
* @property {number} [autoPanSpeed=10] Number of pixels the map should pan by.
* @extends InteractiveLayerOptions
*/
/**
* The event object of `move` and `drag` of markers.
* @typedef {object} MarkerMoveEvent
* @property {LatLng} latlng The new position of the marker.
* @property {LatLng} [oldLatLng] The previous position of the marker.
* @extends MaplairEvent
*/
/**
* Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
*
* In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and
* [popup methods](#Popup) like `bindPopup()` you can also use the methods below.
*
* @example
* ```js
* new Marker([50.5, 30.5]).addTo(map);
* ```
*
* @fires move {MarkerMoveEvent} Fired when the marker is moved via
* [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new
* coordinates are included in event arguments as `oldLatLng`, `latlng`.
*/
var Marker = class Marker extends Layer {
	static defaultOptions = {
		icon: /* @__PURE__ */ new DefaultIcon(),
		interactive: true,
		keyboard: true,
		title: "",
		alt: "Marker",
		zIndexOffset: 0,
		opacity: 1,
		rotation: null,
		riseOnHover: false,
		riseOffset: 250,
		pane: "markerPane",
		shadowPane: "shadowPane",
		shadow: true,
		bubblingPointerEvents: false,
		autoPanOnFocus: true,
		draggable: false,
		autoPan: false,
		autoPanPadding: [50, 50],
		autoPanSpeed: 10
	};
	/**
	* Instantiates a Marker object given a geographical point and optionally an options
	* object.
	* @param {LatLngExpression} latlng
	* @param {MarkerOptions} [options]
	*/
	constructor(latlng, options) {
		super();
		setOptions(this, options);
		this._latlng = new LatLng(latlng);
		this.callInitHooks(Marker);
	}
	/**
	* Adds the icon (and shadow) of the marker to the map.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;
		if (this._zoomAnimated) map.on("zoomanim", this._animateZoom, this);
		this._initIcon();
		this.update();
		if (map.options.markerCulling) this._updateCulling();
	}
	/**
	* Removes the icon (and shadow) of the marker from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		if (this.dragging) {
			this.options.draggable = this.dragging.enabled();
			if (this.options.draggable) this.dragging.removeHooks();
		}
		delete this.dragging;
		if (this._zoomAnimated) map.off("zoomanim", this._animateZoom, this);
		this._removeIcon();
		this._removeShadow();
		this._culled = false;
	}
	/**
	* Returns the map events the marker listens to, see `Layer`.
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		const events = {
			zoom: this.update,
			viewreset: this.update
		};
		if (this._map?.options.markerCulling) events.moveend = this._updateCulling;
		return events;
	}
	/**
	* Returns the current geographical position of the marker.
	* @returns {LatLng}
	*/
	getLatLng() {
		return this._latlng;
	}
	/**
	* Changes the marker position to the given point.
	* @param {LatLngExpression} latlng
	* @returns {this}
	*/
	setLatLng(latlng) {
		const oldLatLng = this._latlng;
		this._latlng = new LatLng(latlng);
		if (this._map?.options.markerCulling) this._updateCulling();
		this.update();
		return this.fire("move", {
			oldLatLng,
			latlng: this._latlng
		});
	}
	/**
	* Changes the [zIndex offset](#markeroptions-zindexoffset) of the marker.
	* @param {number} offset
	* @returns {this}
	*/
	setZIndexOffset(offset) {
		this.options.zIndexOffset = offset;
		return this.update();
	}
	/**
	* Returns the current icon used by the marker.
	* @returns {Icon}
	*/
	getIcon() {
		return this.options.icon;
	}
	/**
	* Changes the marker icon.
	* @param {Icon} icon
	* @returns {this}
	*/
	setIcon(icon) {
		this.options.icon = icon;
		if (this._map) {
			this._initIcon();
			this.update();
		}
		return this;
	}
	/**
	* Returns the instance of [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)
	* used by Marker layer.
	* @returns {HTMLElement}
	*/
	getElement() {
		return this._icon;
	}
	/**
	* Updates the position of the marker on the map, e.g. after a change of its options.
	* @returns {this}
	*/
	update() {
		if (this._icon && this._map && !this._culled) {
			const pos = this._map.latLngToLayerPoint(this._latlng)._round();
			this._setPos(pos);
		}
		return this;
	}
	_initIcon() {
		const options = this.options, classToAdd = `maplair-zoom-${this._zoomAnimated ? "animated" : "hide"}`;
		const icon = options.icon.createIcon(this._icon);
		let addIcon = false;
		if (icon !== this._icon) {
			if (this._icon) this._removeIcon();
			addIcon = true;
			if (options.title) icon.title = options.title;
			if (icon instanceof HTMLImageElement) icon.alt = options.alt ?? "";
		}
		icon.classList.add(classToAdd);
		if (options.keyboard) {
			icon.tabIndex = 0;
			if (options.interactive) icon.setAttribute("role", "button");
			on(icon, "keydown", this._onKeyDown, this);
		}
		this._icon = icon;
		if (options.riseOnHover) this.on({
			pointerover: this._bringToFront,
			pointerout: this._resetZIndex
		});
		if (this.options.autoPanOnFocus) on(icon, "focus", this._panOnFocus, this);
		const newShadow = options.shadow ? options.icon.createShadow?.(this._shadow) ?? null : null;
		let addShadow = false;
		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}
		if (newShadow) {
			newShadow.classList.add(classToAdd);
			newShadow.alt = "";
		}
		this._shadow = newShadow;
		if (options.opacity < 1) this._updateOpacity();
		if (addIcon) this.getPane().appendChild(this._icon);
		this._initInteraction();
		if (newShadow && addShadow) this.getPane(options.shadowPane).appendChild(this._shadow);
	}
	_removeIcon() {
		if (this.options.riseOnHover) this.off({
			pointerover: this._bringToFront,
			pointerout: this._resetZIndex
		});
		if (this.options.autoPanOnFocus) off(this._icon, "focus", this._panOnFocus, this);
		off(this._icon, "keydown", this._onKeyDown, this);
		this._icon.remove();
		this.removeInteractiveTarget(this._icon);
		this._icon = null;
	}
	_updateCulling() {
		if (!this._icon || !this._map) return;
		const map = this._map, visible = (map._cullingBounds ??= map.getBounds().pad(.5)).contains(this._latlng) || !!this.dragging?._draggable?._moving || this._icon.contains(document.activeElement);
		if (visible === !this._culled) return;
		this._culled = !visible;
		if (visible) {
			this.getPane().appendChild(this._icon);
			if (this._shadow) this.getPane(this.options.shadowPane).appendChild(this._shadow);
			this.update();
		} else {
			this._icon.remove();
			this._shadow?.remove();
		}
	}
	_removeShadow() {
		this._shadow?.remove();
		this._shadow = null;
	}
	_setPos(pos) {
		this._positionElements(pos);
		this._zIndex = pos.y + this.options.zIndexOffset;
		this._resetZIndex();
	}
	_positionElements(pos) {
		const rotation = this.options.rotation;
		if (this._icon) {
			setPosition(this._icon, pos);
			if (rotation != null) this._icon.style.transform += ` rotate(${rotation}deg)`;
		}
		if (this._shadow) {
			setPosition(this._shadow, pos);
			this._shadow.style.display = rotation == null ? "" : "none";
		}
	}
	_updateZIndex(offset) {
		const zIndex = String(this._zIndex + offset);
		if (this._icon && this._icon.style.zIndex !== zIndex) this._icon.style.zIndex = zIndex;
	}
	_animateZoom(opt) {
		if (this._culled) return;
		const pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center)._round();
		this._setPos(pos);
	}
	_updateInteractive() {
		if (!this._icon) return;
		if (this.options.keyboard) {
			if (this.options.interactive) this._icon.setAttribute("role", "button");
			else this._icon.removeAttribute("role");
		}
		if (this.options.interactive) {
			this._initInteraction();
			if (this._draggableBeforeNonInteractive) this.dragging?.enable();
		} else {
			this._icon.classList.remove("maplair-interactive");
			this.removeInteractiveTarget(this._icon);
			this._draggableBeforeNonInteractive = this.dragging?.enabled();
			this.dragging?.disable();
		}
	}
	_initInteraction() {
		if (!this.options.interactive) return;
		this._icon.classList.add("maplair-interactive");
		this.addInteractiveTarget(this._icon);
		if (MarkerDrag) {
			if (this.dragging?._draggable?._element === this._icon) {
				this._icon.classList.toggle("maplair-marker-draggable", this.dragging.enabled());
				return;
			}
			let draggable = this.options.draggable;
			if (this.dragging) {
				draggable = this.dragging.enabled();
				this.dragging.disable();
			}
			/**
			* Marker dragging handler, see `Handler`. Only valid when the marker is on the
			* map (otherwise set [`marker.options.draggable`](#markeroptions-draggable)).
			*
			* Interaction handlers are properties of a marker instance that allow you to
			* control interaction behavior in runtime, enabling or disabling certain
			* features such as dragging (see `Handler` methods). Example:
			*
			* ```js
			* marker.dragging.disable();
			* ```
			* @group Interaction handlers
			* @type {MarkerDrag}
			*/
			this.dragging = new MarkerDrag(this);
			if (draggable) this.dragging.enable();
		}
	}
	/**
	* Returns the current [rotation](#markeroptions-rotation) of the marker in degrees.
	* @returns {number|null}
	*/
	getRotation() {
		return this.options.rotation;
	}
	/**
	* Changes the [rotation](#markeroptions-rotation) of the marker; `null` removes it.
	* @param {number|null} rotation
	* @returns {this}
	*/
	setRotation(rotation) {
		this.options.rotation = rotation;
		if (this._icon && !this._map._animatingZoom) {
			this._positionElements(getPosition(this._icon));
			this._popup?._updatePosition();
			this._tooltip?._updatePosition();
		}
		return this;
	}
	/**
	* Changes the opacity of the marker.
	* @param {number} opacity
	* @returns {this}
	*/
	setOpacity(opacity) {
		this.options.opacity = opacity;
		if (this._map) this._updateOpacity();
		return this;
	}
	_updateOpacity() {
		const opacity = this.options.opacity;
		if (this._icon) this._icon.style.opacity = `${opacity}`;
		if (this._shadow) this._shadow.style.opacity = `${opacity}`;
	}
	_bringToFront() {
		this._updateZIndex(this.options.riseOffset);
	}
	_resetZIndex() {
		this._updateZIndex(0);
	}
	_onKeyDown(e) {
		if (this.options.interactive && e.target === this._icon && !e.repeat && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			this._clickedByKeyboard = true;
			this._icon.click();
			this._clickedByKeyboard = false;
		}
	}
	_panOnFocus() {
		const map = this._map;
		if (!map) return;
		const icon = this._icon, style = getComputedStyle(icon), anchor = new Point(-parseFloat(style.marginLeft) || 0, -parseFloat(style.marginTop) || 0), size = new Point(icon.offsetWidth, icon.offsetHeight);
		map.panInside(this._latlng, {
			paddingTopLeft: anchor,
			paddingBottomRight: size.subtract(anchor)
		});
	}
	_getPopupAnchor() {
		return this._rotateAnchor(this.options.icon.options.popupAnchor);
	}
	_getTooltipAnchor() {
		return this._rotateAnchor(this.options.icon.options.tooltipAnchor);
	}
	_rotateAnchor(anchor) {
		const angle = this.options.rotation * Math.PI / 180;
		if (!angle || !anchor) return anchor;
		const { x, y } = Point.from(anchor), cos = Math.cos(angle), sin = Math.sin(angle);
		return new Point(x * cos - y * sin, x * sin + y * cos);
	}
	/**
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
	* given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
	* representation of the marker (as a GeoJSON `Point` Feature).
	* @group Other methods
	* @param {number|false} [precision]
	* @returns {Feature}
	*/
	toGeoJSON(precision) {
		return pointToGeoJSON(this, precision);
	}
};
// src/control/SearchControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {LayerGroup} from '../layer/LayerGroup.js' */
const searchIcon = "<svg aria-hidden=\"true\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"6.5\" cy=\"6.5\" r=\"4.5\"/><path d=\"M10 10l4.5 4.5\"/></svg>";
const nextRequests = /* @__PURE__ */ new Map();
function delay(ms, signal) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(resolve, ms);
		signal.addEventListener("abort", () => {
			clearTimeout(timeout);
			reject(signal.reason);
		}, { once: true });
	});
}
/**
* A result of a search, returned by a [geocoder](#searchcontrol-geocoder).
* @typedef {object} SearchResult
* @property {string} label The text shown in the list of results, e.g. an address.
* @property {LatLngExpression} latlng The position of the result.
* @property {LatLngBoundsExpression} [bounds] The extent of the result, e.g. of a city,
* which the map fits to instead of zooming to the position.
* @property {any} [raw] The original result of the service, for use in event listeners.
* @property {Layer} [layer] The found layer, by [`SearchControl.layers()`](#searchcontrol-layers),
* e.g. to open its tooltip in a `searchresult` listener.
*/
/**
* A function searching places for a query, see the [`geocoder`](#searchcontrol-geocoder)
* option. It should pass the `signal` to `fetch()`: searches are aborted when the user
* starts another one. Optional properties of the function: `attribution`, an attribution
* text which the control adds to the map, and `autoComplete: false` if the service
* forbids searching while typing (overriding the
* [`autoComplete`](#searchcontrol-autocomplete) option).
* @typedef {((query: string, options: {signal: AbortSignal}) => Promise<SearchResult[]>) & {attribution?: string, autoComplete?: boolean}} Geocoder
*/
/**
* Options of `SearchControl`.
* @typedef {object} SearchControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {Geocoder} geocoder The function searching places (required), e.g.
* [Nominatim](#searchcontrol-nominatim). Coordinates (see
* [`LatLng.parse()`](#latlng-parse)) are found without it.
* @property {boolean} [collapsed=true] If `true`, the control is collapsed into a button
* and expanded on click.
* @property {boolean} [autoComplete=false] Whether to search while typing instead of
* on <kbd>Enter</kbd>. Not with the public Nominatim service, its
* [usage policy](https://operations.osmfoundation.org/policies/nominatim/) forbids
* auto-complete.
* @property {number} [autoCompleteDelay=250] The delay in milliseconds after typing
* before searching with [`autoComplete`](#searchcontrol-autocomplete).
* @property {number} [minLength=3] The minimum length of queries searched with
* [`autoComplete`](#searchcontrol-autocomplete).
* @property {number} [zoom=16] The zoom level for results without bounds, and the
* maximum zoom level for fitting the bounds of results.
* @property {boolean|((result: SearchResult) => Layer|null|undefined)} [marker=true] Whether
* to show a marker at the selected result, or a function returning the layer to show
* instead, e.g. a `CircleMarker` highlighting the result (or nothing for none). The
* layer is removed when the search is cleared or another result is selected.
* @property {boolean} [clearOnMapClick=false] If `true`, a click on the map clears the
* search (the field, the results and the marker) and collapses the control. By
* default, the click only hides the results and the marker stays.
* @property {string} [placeholder] The placeholder of the search field, by default
* the translation of "Search".
* @property {string} [noResultsText] The message shown if nothing is found, by
* default the translation of "No results".
* @extends ControlOptions
*/
/**
* The event object of `searchresult`.
* @typedef {object} SearchResultEvent
* @property {SearchResult} result The selected result.
* @property {LatLng} latlng The position of the result.
* @property {LatLngBounds|undefined} bounds The extent of the result, if any.
* @extends MaplairEvent
*/
/**
* A control with a search field for places, showing the results in a list to select
* one with the pointer or the keyboard. The selected result is shown on the map with a
* marker. It searches with a [`geocoder`](#searchcontrol-geocoder), e.g.
* [Nominatim](#searchcontrol-nominatim) of OpenStreetMap or any other service.
* Coordinates like `47.27, 11.4` or `geo:47.27,11.4` are found without a service.
*
* The public Nominatim service is free, but limited by its
* [usage policy](https://operations.osmfoundation.org/policies/nominatim/): it is for
* occasional searches of users, not for heavy use (an absolute maximum of one request
* per second for all users of an app), and forbids auto-complete. The
* [Nominatim geocoder](#searchcontrol-nominatim) follows the technical requirements,
* but you are responsible for your use of the service, which you confirm with the
* `acceptUsagePolicy` option: for more traffic, use your own Nominatim server or a
* commercial provider.
*
* @example
* ```js
* new SearchControl({
*     geocoder: SearchControl.nominatim({acceptUsagePolicy: true})
* }).addTo(map);
*
* // Photon of Komoot, which allows auto-complete
* new SearchControl({
*     autoComplete: true,
*     async geocoder(query, {signal}) {
*         const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`, {signal});
*         const {features} = await response.json();
*         return features.map(({geometry, properties}) => ({
*             label: [properties.name, properties.city, properties.country].filter(Boolean).join(', '),
*             latlng: [geometry.coordinates[1], geometry.coordinates[0]],
*             raw: properties
*         }));
*     }
* }).addTo(map);
* ```
*
* @fires MaplairMap#searchresult {SearchResultEvent} Fired when a result of the
* [search control](#searchcontrol) is selected.
*/
var SearchControl = class SearchControl extends Control {
	static defaultOptions = {
		position: "topleft",
		geocoder: void 0,
		collapsed: true,
		autoComplete: false,
		autoCompleteDelay: 250,
		minLength: 3,
		zoom: 16,
		marker: true,
		clearOnMapClick: false,
		placeholder: void 0,
		noResultsText: void 0
	};
	/**
	* Returns a [geocoder](#searchcontrol-geocoder) searching with
	* [Nominatim](https://nominatim.org/release-docs/latest/api/Search/), by default the
	* public service of OpenStreetMap. Using it requires that you read and accept its
	* [usage policy](https://operations.osmfoundation.org/policies/nominatim/) with the
	* `acceptUsagePolicy` option, otherwise this throws an error. The geocoder sends at most one request per second, caches the results of the last 100
	* queries, adds the OpenStreetMap attribution to the map and does not search while
	* typing with the public service. For more traffic, use your own Nominatim server or a
	* commercial provider.
	*
	* @example
	* ```js
	* new SearchControl({
	*     geocoder: SearchControl.nominatim({acceptUsagePolicy: true, params: {countrycodes: 'at,de'}})
	* }).addTo(map);
	* ```
	* @param {object} [options]
	* @param {string} [options.url='https://nominatim.openstreetmap.org/search'] The URL
	* of the search endpoint.
	* @param {Record<string, string>} [options.params] Further query parameters, e.g.
	* `countrycodes`, `viewbox` or `limit` (5 by default).
	* @param {boolean} [options.acceptUsagePolicy=false] Confirms that your use of the
	* public service complies with its
	* [usage policy](https://operations.osmfoundation.org/policies/nominatim/), required
	* for the public service.
	* @returns {Geocoder}
	*/
	static nominatim({ url = "https://nominatim.openstreetmap.org/search", params = {}, acceptUsagePolicy = false } = {}) {
		const { host } = new URL(url), publicService = host === "nominatim.openstreetmap.org";
		if (publicService && !acceptUsagePolicy) throw new Error("Using the public Nominatim service requires that you read and accept its usage policy (https://operations.osmfoundation.org/policies/nominatim/) with the acceptUsagePolicy option.");
		const cache = /* @__PURE__ */ new Map();
		async function geocoder(query, { signal }) {
			const requestUrl = `${url}?${new URLSearchParams({
				q: query,
				format: "jsonv2",
				limit: "5",
				...params
			})}`;
			if (cache.has(requestUrl)) return cache.get(requestUrl);
			const now = Date.now(), next = nextRequests.get(host) ?? 0, wait = next - now;
			nextRequests.set(host, Math.max(now, next) + 1e3);
			if (wait > 0) await delay(wait, signal);
			const response = await fetch(requestUrl, { signal });
			if (!response.ok) throw new Error(`Nominatim: ${response.status} ${response.statusText}`);
			const results = (await response.json()).map((place) => {
				const [s, n, w, e] = place.boundingbox.map(Number);
				return {
					label: place.display_name,
					latlng: [Number(place.lat), Number(place.lon)],
					bounds: [[s, w], [n, e]],
					raw: place
				};
			});
			cache.set(requestUrl, results);
			if (cache.size > 100) cache.delete(cache.keys().next().value);
			return results;
		}
		return Object.defineProperties(geocoder, {
			attribution: { get: () => `&copy; <a href="https://www.openstreetmap.org/copyright">${I18n.translate("OpenStreetMap contributors")}</a>` },
			autoComplete: { value: !publicService }
		});
	}
	/**
	* Returns a [geocoder](#searchcontrol-geocoder) searching the layers of a layer group,
	* e.g. the markers of a `FeatureGroup` or the features of a `GeoJSON` layer, by their
	* label: a property of their GeoJSON feature (`layer.feature.properties`) or the
	* result of a function. The group is searched at the time of the search, so layers
	* added later are found as well, and nested groups without a label are searched
	* recursively. The search ignores the case and finds the query anywhere in the
	* label; labels starting with it come first, then in alphabetical order. The results
	* contain the found `layer` and its GeoJSON feature as `raw`; layers without a
	* single position (e.g. polygons) have the `bounds` and their center as `latlng`.
	* Combine it with [`autoComplete`](#searchcontrol-autocomplete) to search while
	* typing, and with [`marker`](#searchcontrol-marker) `false` or a function to not
	* cover the found marker with another one.
	*
	* @example
	* ```js
	* const stations = new GeoJSON(data, {
	*     onEachFeature: (feature, layer) => layer.bindTooltip(feature.properties.name)
	* }).addTo(map);
	* new SearchControl({
	*     geocoder: SearchControl.layers(stations, {property: 'name'}),
	*     autoComplete: true,
	*     minLength: 1,
	*     marker: false
	* }).addTo(map);
	* map.on('searchresult', ({result}) => result.layer.openTooltip());
	* ```
	* @param {LayerGroup} group The layer group to search.
	* @param {object} [options]
	* @param {string} [options.property='name'] The property of the GeoJSON features to
	* search.
	* @param {(layer: Layer) => string|number|null|undefined} [options.label] A function
	* returning the label of a layer instead of the `property`, nothing to skip the
	* layer (or to search its layers, if it is a group).
	* @param {number} [options.limit=10] The maximum number of results.
	* @returns {Geocoder}
	*/
	static layers(group, { property = "name", label = (layer) => layer.feature?.properties?.[property], limit = 10 } = {}) {
		return (query) => {
			query = query.toLocaleLowerCase();
			const found = [];
			group.eachLayer(function search(layer) {
				const text = label(layer);
				if (text === void 0 || text === null || text === "") {
					layer.eachLayer?.(search);
					return;
				}
				const result = {
					label: String(text),
					layer,
					raw: layer.feature
				}, index = result.label.toLocaleLowerCase().indexOf(query);
				if (index < 0) return;
				if (layer.getLatLng) result.latlng = layer.getLatLng();
				else if (layer.getBounds?.().isValid()) {
					result.bounds = layer.getBounds();
					result.latlng = result.bounds.getCenter();
				} else return;
				found.push({
					result,
					prefix: index === 0
				});
			});
			return Promise.resolve(found.sort((a, b) => b.prefix - a.prefix || a.result.label.localeCompare(b.result.label)).slice(0, limit).map(({ result }) => result));
		};
	}
	/**
	* Creates a search control.
	* @param {...SearchControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		if (!this.options.geocoder) throw new Error("SearchControl: the geocoder option is required, e.g. SearchControl.nominatim().");
		this.callInitHooks(SearchControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const className = "maplair-control-search", container = this._container = create("div", `${className} maplair-bar`), form = create("form", `${className}-form`, container), toggle = this._toggle = create("button", `${className}-toggle`, form), input = this._input = create("input", `${className}-input`, form), reset = create("button", `${className}-reset`, form), list = this._list = create("ul", `${className}-results`, container), listId = `${className}-results-${stamp(this)}`, title = I18n.translate("Search");
		form.role = "search";
		toggle.type = "button";
		toggle.innerHTML = searchIcon;
		toggle.title = title;
		toggle.setAttribute("aria-label", title);
		input.type = "search";
		input.placeholder = this.options.placeholder ?? title;
		input.autocomplete = "off";
		input.enterKeyHint = "search";
		input.role = "combobox";
		input.setAttribute("aria-label", title);
		input.setAttribute("aria-autocomplete", "list");
		input.setAttribute("aria-controls", listId);
		reset.type = "reset";
		reset.innerHTML = "<span aria-hidden=\"true\">&times;</span>";
		reset.title = I18n.translate("Clear the search");
		reset.setAttribute("aria-label", reset.title);
		list.id = listId;
		list.role = "listbox";
		list.setAttribute("aria-label", I18n.translate("Search results"));
		this._message = create("div", `${className}-message`, container);
		this._message.role = "status";
		disableClickPropagation(container);
		disableScrollPropagation(container);
		on(toggle, "click", this._onToggle, this);
		on(form, "submit", this._onSubmit, this);
		on(form, "reset", this._onReset, this);
		on(input, "input", this._onInput, this);
		on(input, "keydown", this._onKeyDown, this);
		on(list, "click", this._onListClick, this);
		map.on("click", this._onMapClick, this);
		this._attribution = this.options.geocoder.attribution;
		map.attributionControl?.addAttribution(this._attribution);
		this._showResults([]);
		this._setExpanded(!this.options.collapsed);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("click", this._onMapClick, this);
		map.attributionControl?.removeAttribution(this._attribution);
		this._abort();
		this._marker?.remove();
	}
	/**
	* Expands the search field of a [collapsed](#searchcontrol-collapsed) control and
	* focuses it.
	* @returns {this}
	*/
	expand() {
		this._setExpanded(true);
		this._input.focus();
		return this;
	}
	/**
	* Collapses the control into its button, if [collapsed](#searchcontrol-collapsed),
	* and hides the results.
	* @returns {this}
	*/
	collapse() {
		this._showResults([]);
		this._setExpanded(!this.options.collapsed);
		return this;
	}
	/**
	* Searches the given text and shows the results in the list. Resolves to the results.
	* @param {string} query
	* @returns {Promise<SearchResult[]>}
	*/
	async search(query) {
		this._abort();
		this._input.value = query;
		query = query.trim();
		if (!query) {
			this._showResults([]);
			return [];
		}
		const latlng = LatLng.parse(query);
		if (latlng) {
			const results = [{
				label: query,
				latlng
			}];
			this._showResults(results);
			return results;
		}
		const controller = this._controller = new AbortController();
		this._container.classList.add("maplair-control-search-loading");
		try {
			const results = await this.options.geocoder(query, { signal: controller.signal });
			if (!controller.signal.aborted) this._showResults(results, this.options.noResultsText ?? I18n.translate("No results"));
			return results;
		} catch (error) {
			if (controller.signal.aborted) return [];
			this._showResults([], I18n.translate("The search failed"));
			throw error;
		} finally {
			if (this._controller === controller) {
				this._controller = null;
				this._container.classList.remove("maplair-control-search-loading");
			}
		}
	}
	/**
	* Shows the given result on the map: zooms to it, shows a
	* [marker](#searchcontrol-marker) and fires `searchresult` on the map.
	* @param {SearchResult} result
	* @returns {this}
	*/
	select(result) {
		const map = this._map, latlng = LatLng.from(result.latlng), bounds = result.bounds ? LatLngBounds.from(result.bounds) : void 0;
		this._input.value = result.label;
		this._showResults([]);
		if (bounds?.isValid() && !bounds.getNorthWest().equals(bounds.getSouthEast())) map.fitBounds(bounds, { maxZoom: this.options.zoom });
		else map.setView(latlng, this.options.zoom);
		this._marker?.remove();
		const { marker } = this.options;
		this._marker = typeof marker === "function" ? marker(result)?.addTo(map) ?? null : marker ? new Marker(latlng, { title: result.label }).addTo(map) : null;
		map.fire("searchresult", {
			result,
			latlng,
			bounds
		});
		return this;
	}
	/**
	* Clears the search field, the results and the marker.
	* @returns {this}
	*/
	clear() {
		this._abort();
		this._input.value = "";
		this._showResults([]);
		this._marker?.remove();
		this._marker = null;
		return this;
	}
	_setExpanded(expanded) {
		this._container.classList.toggle("maplair-control-search-expanded", expanded);
		this._toggle.setAttribute("aria-expanded", expanded);
	}
	_abort() {
		clearTimeout(this._autoCompleteTimeout);
		this._controller?.abort();
		this._controller = null;
		this._container?.classList.remove("maplair-control-search-loading");
	}
	_showResults(results, message = "") {
		this._results = results;
		this._list.replaceChildren(...results.map((result, i) => {
			const item = create("li", "maplair-control-search-result");
			item.id = `${this._list.id}-${i}`;
			item.role = "option";
			item.textContent = result.label;
			return item;
		}));
		this._list.hidden = !results.length;
		this._message.textContent = results.length ? "" : message;
		this._message.hidden = !this._message.textContent;
		this._input.setAttribute("aria-expanded", !!results.length);
		this._setActive(-1);
	}
	_setActive(index) {
		this._active = index;
		for (const [i, item] of [...this._list.children].entries()) item.setAttribute("aria-selected", i === index);
		if (index < 0) this._input.removeAttribute("aria-activedescendant");
		else {
			const item = this._list.children[index];
			this._input.setAttribute("aria-activedescendant", item.id);
			item.scrollIntoView({ block: "nearest" });
		}
	}
	_onToggle() {
		if (this.options.collapsed && !this._container.classList.contains("maplair-control-search-expanded")) this.expand();
		else this._onSubmit();
	}
	_onSubmit(e) {
		if (e) preventDefault(e);
		const query = this._input.value, result = this._results[this._active], latlng = LatLng.parse(query);
		if (result) this.select(result);
		else if (latlng) this.select({
			label: query.trim(),
			latlng
		});
		else this.search(query).catch(falseFn);
	}
	_onReset() {
		this.clear();
		this._input.focus();
	}
	_onInput() {
		clearTimeout(this._autoCompleteTimeout);
		const query = this._input.value.trim();
		if (!this.options.autoComplete || this.options.geocoder.autoComplete === false) this._showResults([]);
		else if (query.length >= this.options.minLength || LatLng.parse(query)) this._autoCompleteTimeout = setTimeout(() => {
			this.search(this._input.value).catch(falseFn);
		}, this.options.autoCompleteDelay);
		else {
			this._abort();
			this._showResults([]);
		}
	}
	_onKeyDown(e) {
		const n = this._results.length;
		if ((e.key === "ArrowDown" || e.key === "ArrowUp") && n) {
			preventDefault(e);
			const step = e.key === "ArrowDown" ? 1 : -1;
			this._setActive(((this._active < 0 && step < 0 ? n : this._active) + step + n) % n);
		} else if (e.key === "Escape") {
			preventDefault(e);
			if (n || !this._message.hidden) this._showResults([]);
			else if (this._input.value) this.clear();
			else if (this.options.collapsed) {
				this.collapse();
				this._map.getContainer().focus();
			}
		}
	}
	_onListClick(e) {
		const item = e.target.closest(".maplair-control-search-result"), index = [...this._list.children].indexOf(item);
		if (index >= 0) this.select(this._results[index]);
	}
	_onMapClick() {
		if (this.options.clearOnMapClick) {
			this.clear();
			this.collapse();
		} else if (this._input.value) this._showResults([]);
		else this.collapse();
	}
};
// src/control/SideBySideControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
* Options of `SideBySideControl`.
* @typedef {object} SideBySideControlOptions
* @property {number} [ratio=0.5] The initial position of the divider, from `0` (left) to
* `1` (right).
* @extends ControlOptions
*/
/**
* The event object of `dividermove`.
* @typedef {object} DividerMoveEvent
* @property {number} ratio The position of the divider, from `0` (left) to `1` (right).
* @property {number} x The position of the divider in container pixels.
* @extends MaplairEvent
*/
/**
* Compares layers side by side: a vertical divider across the map shows the
* "left" layers on its left and the "right" layers on its right side. The divider
* can be dragged, or moved with the arrow keys. Works with layers having a
* container or element of their own, e.g. tile layers and image overlays.
*
* Inspired by the [leaflet-side-by-side](https://github.com/digidem/leaflet-side-by-side) plugin.
*
* @example
* ```js
* const before = new TileLayer('https://…/2020/{z}/{x}/{y}.png').addTo(map);
* const after = new TileLayer('https://…/2025/{z}/{x}/{y}.png').addTo(map);
* new SideBySideControl(before, after).addTo(map);
* ```
*
* @fires MaplairMap#dividermove {DividerMoveEvent} Fired when the divider of a
* `SideBySideControl` moves.
*/
var SideBySideControl = class SideBySideControl extends Control {
	static defaultOptions = { ratio: .5 };
	/**
	* Creates a side-by-side control for the given layers (which have to be added to the
	* map separately).
	* @param {Layer|Layer[]} [leftLayers]
	* @param {Layer|Layer[]} [rightLayers]
	* @param {SideBySideControlOptions} [options]
	*/
	constructor(leftLayers, rightLayers, options) {
		super(options);
		this._leftLayers = [leftLayers ?? []].flat();
		this._rightLayers = [rightLayers ?? []].flat();
		this._ratio = this.options.ratio;
		this.callInitHooks(SideBySideControl);
	}
	/**
	* Adds the control to the given map. The divider spans the map instead of being in
	* a corner.
	* @param {MaplairMap} map
	* @returns {this}
	*/
	addTo(map) {
		this.remove();
		this._map = map;
		this._container = this.onAdd(map);
		map._container.appendChild(this._container);
		map.on("unload", this.remove, this);
		return this;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const divider = create("div", "maplair-sidebyside-divider"), label = I18n.translate("Divider between the compared layers");
		divider.tabIndex = 0;
		divider.setAttribute("role", "slider");
		divider.setAttribute("aria-label", label);
		divider.setAttribute("aria-valuemin", 0);
		divider.setAttribute("aria-valuemax", 100);
		disableClickPropagation(divider);
		on(divider, "pointerdown", this._onPointerDown, this);
		on(divider, "keydown", this._onKeyDown, this);
		map.on("move zoom viewreset resize rotate layeradd", this._update, this);
		this._container = divider;
		this._update();
		return divider;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		this._onPointerUp();
		map.off("move zoom viewreset resize rotate layeradd", this._update, this);
		for (const layer of [...this._leftLayers, ...this._rightLayers]) {
			const el = getElement(layer);
			if (el) el.style.clipPath = "";
		}
	}
	/**
	* Sets the layers shown on the left side of the divider.
	* @param {Layer|Layer[]} layers
	* @returns {this}
	*/
	setLeftLayers(layers) {
		this._clear(this._leftLayers);
		this._leftLayers = [layers].flat();
		return this._update();
	}
	/**
	* Sets the layers shown on the right side of the divider.
	* @param {Layer|Layer[]} layers
	* @returns {this}
	*/
	setRightLayers(layers) {
		this._clear(this._rightLayers);
		this._rightLayers = [layers].flat();
		return this._update();
	}
	/**
	* Returns the position of the divider, from `0` (left) to `1` (right).
	* @returns {number}
	*/
	getRatio() {
		return this._ratio;
	}
	/**
	* Moves the divider, from `0` (left) to `1` (right).
	* @param {number} ratio
	* @returns {this}
	*/
	setRatio(ratio) {
		this._ratio = Math.min(1, Math.max(0, ratio));
		this._update();
		this._map?.fire("dividermove", {
			ratio: this._ratio,
			x: this._x
		});
		return this;
	}
	_clear(layers) {
		for (const layer of layers) {
			const el = getElement(layer);
			if (el) el.style.clipPath = "";
		}
	}
	_update() {
		const map = this._map;
		if (!map?._loaded || !this._container) return this;
		const size = map.getSize(), x = this._x = Math.round(size.x * this._ratio);
		this._container.style.left = `${x}px`;
		this._container.setAttribute("aria-valuenow", Math.round(this._ratio * 100));
		this._clip(this._leftLayers, 0, x, size.y);
		this._clip(this._rightLayers, x, size.x, size.y);
		return this;
	}
	_clip(layers, x1, x2, height) {
		const map = this._map;
		for (const layer of layers) {
			const el = getElement(layer);
			if (!el || !map.hasLayer(layer)) continue;
			const offset = getPosition(el), corners = [
				[x1, 0],
				[x2, 0],
				[x2, height],
				[x1, height]
			].map((p) => {
				const point = map.containerPointToLayerPoint(p).subtract(offset);
				return `${point.x}px ${point.y}px`;
			});
			el.style.clipPath = `polygon(${corners.join(", ")})`;
		}
	}
	_onPointerDown(e) {
		stop(e);
		this._container.focus({ preventScroll: true });
		on(document, "pointermove", this._onPointerMove, this);
		on(document, "pointerup pointercancel", this._onPointerUp, this);
	}
	_onPointerMove(e) {
		const rect = this._map._container.getBoundingClientRect();
		this.setRatio((e.clientX - rect.left) / rect.width);
	}
	_onPointerUp() {
		off(document, "pointermove", this._onPointerMove, this);
		off(document, "pointerup pointercancel", this._onPointerUp, this);
	}
	_onKeyDown(e) {
		const step = e.shiftKey ? .01 : .05;
		if (e.key === "ArrowLeft") this.setRatio(this._ratio - step);
		else if (e.key === "ArrowRight") this.setRatio(this._ratio + step);
		else return;
		stop(e);
	}
};
function getElement(layer) {
	return layer.getContainer?.() ?? layer.getElement?.();
}
// src/control/TextControl.js
/** @import {ControlOptions} from './Control.js' */
/**
* Options of `TextControl`.
* @typedef {object} TextControlOptions
* @property {string} [position='topright'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {string|HTMLElement} [content=''] The content of the control: HTML or an
* element. String content is rendered as HTML; do not pass untrusted input.
* @property {string} [className=''] A custom CSS class name to assign to the control.
* @extends ControlOptions
*/
/**
* A control showing a text or any content in a box, e.g. a title, a note on the
* data or a status. It is hidden while its content is empty.
*
* @example
* ```js
* const status = new TextControl({position: 'topright', content: 'Loading…'}).addTo(map);
* status.setContent(`Updated at ${new Date().toLocaleTimeString()}`);
* ```
*/
var TextControl = class TextControl extends Control {
	static defaultOptions = {
		position: "topright",
		content: "",
		className: ""
	};
	/**
	* Creates a text control.
	* @param {...TextControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(TextControl);
	}
	/**
	* @internal
	* @returns {HTMLElement}
	*/
	onAdd() {
		const container = create("div", `maplair-control-text ${this.options.className}`);
		disableClickPropagation(container);
		disableScrollPropagation(container);
		this._container = container;
		this._update();
		return container;
	}
	/**
	* Changes the [content](#textcontrol-content) of the control.
	* @param {string|HTMLElement} content
	* @returns {this}
	*/
	setContent(content) {
		this.options.content = content;
		this._update();
		return this;
	}
	/**
	* Returns the content of the control.
	* @returns {string|HTMLElement}
	*/
	getContent() {
		return this.options.content;
	}
	_update() {
		const container = this._container, { content } = this.options;
		if (!container) return;
		if (typeof content === "string") container.innerHTML = content;
		else container.replaceChildren(content ?? "");
		container.hidden = !content;
	}
};
// src/control/TimeControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
const icon = (path) => `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="${path}"/></svg>`;
const previousIcon = icon("M3 3h2v10H3zm10 0v10L6 8z");
const playIcon = icon("M4 2v12l10-6z");
const pauseIcon = icon("M4 3h3v10H4zm5 0h3v10H9z");
const nextIcon = icon("M11 3h2v10h-2zM3 3v10l7-5z");
const durationRe = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
function parseDuration(duration) {
	const match = durationRe.exec(duration);
	if (!match || duration === "P" || duration.endsWith("T")) throw new Error(`Invalid or unsupported ISO 8601 duration "${duration}".`);
	const [years, months, weeks, days, hours, minutes, seconds] = match.slice(1).map((n) => Number(n ?? 0));
	return {
		years,
		months,
		ms: ((((weeks * 7 + days) * 24 + hours) * 60 + minutes) * 60 + seconds) * 1e3
	};
}
function addDuration(time, duration, n) {
	const date = new Date(time);
	date.setUTCFullYear(date.getUTCFullYear() + n * duration.years, date.getUTCMonth() + n * duration.months);
	return new Date(+date + n * duration.ms);
}
function parseDate(date) {
	const time = Date.parse(date);
	if (Number.isNaN(time)) throw new Error(`Invalid date "${date}".`);
	return new Date(time);
}
function intervalTimes(interval, period) {
	const parts = interval.split("/");
	if (parts.length === 3) period = parts.pop();
	if (parts.length !== 2) throw new Error(`Invalid ISO 8601 interval "${interval}".`);
	const [first, second] = parts, step = parseDuration(period);
	let start, end;
	if (first.startsWith("P")) {
		end = parseDate(second);
		start = addDuration(end, parseDuration(first), -1);
	} else {
		start = parseDate(first);
		end = second.startsWith("P") ? addDuration(start, parseDuration(second), 1) : parseDate(second);
	}
	if (!(addDuration(start, step, 1) > start)) throw new Error(`The period "${period}" has to be positive.`);
	const times = [];
	for (let i = 0, time = start; time <= end; time = addDuration(start, step, ++i)) times.push(time);
	return times;
}
/**
* Options of `TimeControl`.
* @typedef {object} TimeControlOptions
* @property {string} [position='bottomleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {(Date|number|string)[]} [times] The times to step through in ascending
* order: dates, timestamps or date strings (parsed with `Date.parse()`).
* @property {string} [interval] Instead of `times`, an ISO 8601 time interval whose times
* every [`period`](#timecontrol-period) from the start up to the end are stepped
* through: `start/end` (e.g. `'2026-10-17T00:00Z/2026-10-18T00:00Z'`), `start/duration`
* (e.g. `'2026-10-17T00:00Z/P1D'`) or `duration/end` (e.g. `'PT24H/2026-10-18T00:00Z'`).
* A third part is the period, as in the time dimension of WMS capabilities (e.g.
* `'2026-10-17T00:00Z/2026-10-18T00:00Z/PT5M'`). Start and end are parsed with
* `Date.parse()`, e.g. `2026-10-17`, `2026-10-17T12:00Z` or
* `2026-10-17T12:00:00.000+02:00` (without a time zone, times are local times).
* @property {string} [period='P1D'] The ISO 8601 duration between the times of the
* `interval`: integer numbers of years, months, weeks, days, hours, minutes and seconds,
* e.g. `'PT1H'`, `'PT5M'`, `'P1DT12H'` or `'P1M'` (years and months are added in UTC).
* @property {Date|number|string} [time] The initial time (the nearest of the times), by
* default the current time.
* @property {(Layer & TimeLayer)[]} [layers=[]] The layers showing the current time, see
* `addLayer()`.
* @property {number} [transitionTime=1000] The minimum time in milliseconds a time is
* shown while playing. The next time is shown only after the layers have loaded, too.
* @property {boolean} [loop=false] Whether playing starts over after the last time
* instead of stopping, and the buttons step from the last time to the first one and
* back.
* @property {(date: Date) => string} [formatTime] Returns the text of the label for a
* time, by default the date and time by `Intl.DateTimeFormat` in the [locale](#i18n)
* (or the browser's language) and the browser's time zone.
* @extends ControlOptions
*/
/**
* A layer showing a given time, see `TimeControl`.
* @typedef {object} TimeLayer
* @property {(date: Date) => any} [setTime] Shows the given time.
*/
/**
* The event object of `timechange`.
* @typedef {object} TimeChangeEvent
* @property {Date} time The current time.
* @property {number} index The index of the current time in the times of the control.
* @extends MaplairEvent
*/
/**
* A control to step through or play the times of time-dependent layers, e.g. an
* animated weather radar from a WMS with a `TIME` dimension. It has buttons for the
* previous and next time and to play or pause, a slider (usable with the arrow, Home
* and End keys) and a label with the current time.
*
* Each of the `layers` shows the current time: by its method `setTime(date)` if it has
* one, otherwise by the parameter `time` set to the time in ISO 8601 format
* (`date.toISOString()`): the WMS parameter of a `WMSTileLayer` (with `setParams()`) or
* the variable of the URL template of a `TileLayer` (e.g.
* `'https://…/{time}/{z}/{x}/{y}.png'`, with `setUrl()`). The tiles of the previous
* time stay visible until the new ones have loaded, and playing waits for them (the
* `load` event), so that no time is skipped with slow servers.
*
* Replaces the [Leaflet.TimeDimension](https://github.com/socib/Leaflet.TimeDimension)
* plugin for the common use cases.
*
* @example
* ```js
* const radar = new WMSTileLayer('https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi', {
* 	layers: 'nexrad-n0r-wmst',
* 	format: 'image/png',
* 	transparent: true
* }).addTo(map);
*
* new TimeControl({
* 	interval: '2013-05-20T18:00Z/2013-05-20T22:00Z',
* 	period: 'PT5M',
* 	layers: [radar],
* 	loop: true
* }).addTo(map);
*
* map.on('timechange', e => console.log(e.time));
* ```
*
* @fires MaplairMap#timechange {TimeChangeEvent} Fired when the current time of a
* `TimeControl` changes.
*/
var TimeControl = class TimeControl extends Control {
	static defaultOptions = {
		position: "bottomleft",
		times: void 0,
		interval: void 0,
		period: "P1D",
		time: void 0,
		layers: [],
		transitionTime: 1e3,
		loop: false,
		formatTime: void 0
	};
	/**
	* Creates a time control.
	* @param {...TimeControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		const { times, interval, period, time, layers } = this.options;
		this._layers = [];
		this._playing = false;
		this._times = [];
		this._index = -1;
		this.setTimes(interval ? intervalTimes(interval, period) : times ?? [], time);
		for (const layer of layers) this.addLayer(layer);
		this.callInitHooks(TimeControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-bar maplair-control-time");
		disableClickPropagation(container);
		disableScrollPropagation(container);
		this._previousButton = new ButtonControl({
			className: "maplair-control-time-previous",
			content: previousIcon,
			title: I18n.translate("Step back"),
			onClick: () => this.previous()
		});
		this._playButton = new ButtonControl({
			className: "maplair-control-time-play",
			states: [{
				name: "play",
				content: playIcon,
				title: I18n.translate("Play"),
				onClick: () => this.play()
			}, {
				name: "pause",
				content: pauseIcon,
				title: I18n.translate("Pause"),
				onClick: () => this.pause()
			}]
		});
		this._nextButton = new ButtonControl({
			className: "maplair-control-time-next",
			content: nextIcon,
			title: I18n.translate("Step forward"),
			onClick: () => this.next()
		});
		for (const button of [
			this._previousButton,
			this._playButton,
			this._nextButton
		]) {
			button._map = map;
			button._createButton(container);
		}
		const slider = this._slider = create("input", "maplair-control-time-slider", container);
		slider.type = "range";
		slider.min = "0";
		slider.step = "1";
		slider.setAttribute("aria-label", I18n.translate("Time"));
		on(slider, "input", this._onSliderInput, this);
		this._label = create("span", "maplair-control-time-label", container);
		this._formatter = new Intl.DateTimeFormat(I18n.getLocale() ?? void 0, {
			dateStyle: "short",
			timeStyle: "short"
		});
		this._updateControl();
		return container;
	}
	/**
	* @internal
	*/
	onRemove() {
		this.pause();
		this._slider = null;
	}
	_onSliderInput() {
		this.pause();
		this._setIndex(Number(this._slider.value));
	}
	_updateControl() {
		if (!this._slider) return;
		const index = this._index, last = this._times.length - 1, time = this.getTime(), text = time ? (this.options.formatTime ?? this._formatter.format)(time) : "", loop = this.options.loop;
		this._slider.max = String(Math.max(last, 0));
		this._slider.value = String(Math.max(index, 0));
		this._slider.disabled = last < 1;
		this._slider.setAttribute("aria-valuetext", text);
		this._label.textContent = text;
		this._playButton.setState(this._playing ? "pause" : "play");
		this._setDisabled(this._playButton, last < 1);
		this._setDisabled(this._previousButton, last < 1 || index === 0 && !loop);
		this._setDisabled(this._nextButton, last < 1 || index === last && !loop);
	}
	_setDisabled(button, disabled) {
		if (disabled) button.disable();
		else button.enable();
	}
	/**
	* Sets the times to step through, see the [`times` option](#timecontrol-times), and
	* shows the nearest of them to `time`, by default to the current time of the control.
	* @param {(Date|number|string)[]} times
	* @param {Date|number|string} [time]
	* @returns {this}
	*/
	setTimes(times, time = this.getTime()) {
		this._times = times.map((t) => new Date(t));
		this._index = -1;
		if (this._times.length < 2) this.pause();
		return this.setTime(time ?? Date.now());
	}
	/**
	* Returns the times to step through.
	* @returns {Date[]}
	*/
	getTimes() {
		return this._times;
	}
	/**
	* Shows the nearest of the times to the given time.
	* @param {Date|number|string} time
	* @returns {this}
	*/
	setTime(time) {
		const ms = +new Date(time);
		let index = this._times.length ? 0 : -1;
		this._times.forEach((t, i) => {
			if (Math.abs(+t - ms) < Math.abs(+this._times[index] - ms)) index = i;
		});
		return this._setIndex(index);
	}
	/**
	* Returns the current time.
	* @returns {Date|undefined}
	*/
	getTime() {
		return this._times[this._index];
	}
	_setIndex(index) {
		if (index !== this._index) {
			this._index = index;
			for (const layer of this._layers) this._updateLayer(layer);
			if (index >= 0) this._map?.fire("timechange", {
				time: this.getTime(),
				index
			});
			if (this._playing) this._schedule();
		}
		this._updateControl();
		return this;
	}
	/**
	* Shows the next time (or the first one after the last one if looping).
	* @returns {this}
	*/
	next() {
		if (this._index < this._times.length - 1) this._setIndex(this._index + 1);
		else if (this.options.loop && this._times.length > 1) this._setIndex(0);
		return this;
	}
	/**
	* Shows the previous time (or the last one before the first one if looping).
	* @returns {this}
	*/
	previous() {
		if (this._index > 0) this._setIndex(this._index - 1);
		else if (this.options.loop && this._times.length > 1) this._setIndex(this._times.length - 1);
		return this;
	}
	/**
	* Plays the times one after the other, each for at least the
	* [`transitionTime`](#timecontrol-transitiontime) and until the layers have loaded.
	* Starts at the first time if the last one is shown. Stops at the last time unless
	* [looping](#timecontrol-loop).
	* @returns {this}
	*/
	play() {
		if (this._playing || this._times.length < 2) return this;
		this._playing = true;
		if (this._index === this._times.length - 1) this._setIndex(0);
		else {
			this._schedule();
			this._updateControl();
		}
		return this;
	}
	/**
	* Stops playing.
	* @returns {this}
	*/
	pause() {
		clearTimeout(this._timeout);
		this._timeout = null;
		if (this._playing) {
			this._playing = false;
			this._updateControl();
		}
		return this;
	}
	/**
	* Returns `true` while playing.
	* @returns {boolean}
	*/
	isPlaying() {
		return this._playing;
	}
	_schedule() {
		clearTimeout(this._timeout);
		this._timeout = setTimeout(() => {
			this._timeout = null;
			this._advance();
		}, this.options.transitionTime);
	}
	_advance() {
		if (!this._playing || this._timeout || this._layers.some((layer) => layer._map && layer.isLoading?.())) return;
		if (this._index < this._times.length - 1 || this.options.loop) this.next();
		else this.pause();
	}
	_updateLayer(layer) {
		const time = this.getTime();
		if (!time) return;
		if (typeof layer.setTime === "function") layer.setTime(time);
		else if (typeof layer.setParams === "function") layer.setParams({ time: time.toISOString() });
		else if (typeof layer.setUrl === "function") {
			layer.options.time = time.toISOString();
			layer.setUrl(layer._url, false);
		}
	}
	/**
	* Adds a layer showing the current time, see the [`layers` option](#timecontrol-layers).
	* The layer still has to be added to the map.
	* @param {Layer & TimeLayer} layer
	* @returns {this}
	*/
	addLayer(layer) {
		if (this._layers.includes(layer)) return this;
		this._layers.push(layer);
		layer.on("load remove", this._advance, this);
		this._updateLayer(layer);
		return this;
	}
	/**
	* Removes a layer from the layers showing the current time.
	* @param {Layer} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		this._layers = this._layers.filter((l) => l !== layer);
		layer.off("load remove", this._advance, this);
		this._advance();
		return this;
	}
};
// src/geo/projection/Projection.LonLat.js
/** @import {Projection} from './index.js' */
/**
* Equirectangular, or Plate Carree projection — the most simple projection,
* mostly used by GIS enthusiasts. Directly maps `x` as longitude, and `y` as
* latitude. Also suitable for flat worlds, e.g. game maps. Used by the
* `EPSG4326` and `SimpleCRS` CRS.
* @type {Projection}
*/
const LonLat = {
	project(latlng) {
		latlng = LatLng.from(latlng);
		return new Point(latlng.lng, latlng.lat);
	},
	unproject(point) {
		point = Point.from(point);
		return new LatLng(point.y, point.x);
	},
	bounds: /* @__PURE__ */ new Bounds([-180, -90], [180, 90])
};
/**
* Elliptical Mercator projection — more complex than Spherical Mercator. Assumes that
* Earth is an ellipsoid. Used by the EPSG:3395 CRS.
* @type {Projection & {R: number, R_MINOR: number}}
*/
const Mercator = {
	R: 6378137,
	R_MINOR: 6356752.314245179,
	bounds: /* @__PURE__ */ new Bounds([-20037508.34279, -15496570.73972], [20037508.34279, 18764656.23138]),
	project(latlng) {
		latlng = LatLng.from(latlng);
		const d = Math.PI / 180, r = this.R, tmp = this.R_MINOR / r, e = Math.sqrt(1 - tmp * tmp);
		let y = latlng.lat * d;
		const con = e * Math.sin(y);
		const ts = Math.tan(Math.PI / 4 - y / 2) / ((1 - con) / (1 + con)) ** (e / 2);
		y = -r * Math.log(Math.max(ts, 1e-10));
		return new Point(latlng.lng * d * r, y);
	},
	unproject(point) {
		point = Point.from(point);
		const d = 180 / Math.PI, r = this.R, tmp = this.R_MINOR / r, e = Math.sqrt(1 - tmp * tmp), ts = Math.exp(-point.y / r);
		let phi = Math.PI / 2 - 2 * Math.atan(ts);
		for (let i = 0, dphi = .1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
			con = e * Math.sin(phi);
			con = ((1 - con) / (1 + con)) ** (e / 2);
			dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
			phi += dphi;
		}
		return new LatLng(phi * d, point.x * d / r);
	}
};
// src/geo/projection/index.js
var projection_exports = /* @__PURE__ */ __exportAll({
	LonLat: () => LonLat,
	Mercator: () => Mercator,
	SphericalMercator: () => SphericalMercator
});
// src/geo/crs/EPSG3395.js
/** @import {Projection} from '../projection/index.js' */
/**
* Rarely used by some commercial tile providers. Uses Elliptical Mercator projection.
*/
var EPSG3395 = class extends EarthCRS {
	/** @type {string} */
	static code = "EPSG:3395";
	/** @type {Projection} */
	static projection = Mercator;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ (() => {
		const scale = .5 / (Math.PI * Mercator.R);
		return new Transformation(scale, .5, -scale, .5);
	})();
};
// src/geo/crs/EPSG4326.js
/** @import {Projection} from '../projection/index.js' */
/**
* A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
*
* Maplair complies with the
* [TMS coordinate scheme for EPSG:4326](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification#global-geodetic).
* If you are using a `TileLayer` with this CRS, ensure that there are two 256x256
* pixel tiles covering the whole earth at zoom level zero, and that the tile
* coordinate origin is (-180,+90), or (-180,-90) for `TileLayer`s with
* [the `tms` option](#tilelayer-tms) set.
*/
var EPSG4326 = class extends EarthCRS {
	/** @type {string} */
	static code = "EPSG:4326";
	/** @type {Projection} */
	static projection = LonLat;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ new Transformation(1 / 180, 1, -1 / 180, .5);
};
// src/geo/crs/SimpleCRS.js
/** @import {LatLng} from '../LatLng.js' */
/** @import {Projection} from '../projection/index.js' */
/**
* A simple CRS that maps longitude and latitude into `x` and `y` directly.
* May be used for maps of flat surfaces (e.g. game maps). Note that the `y`
* axis should still be inverted (going from bottom to top). `distance()` returns
* simple euclidean distance.
*/
var SimpleCRS = class extends CRS {
	/** @type {Projection} */
	static projection = LonLat;
	/** @type {Transformation} */
	static transformation = /* @__PURE__ */ new Transformation(1, 0, -1, 0);
	/**
	* Returns `2^zoom`.
	* @param {number} zoom
	* @returns {number}
	*/
	static scale(zoom) {
		return 2 ** zoom;
	}
	/**
	* Inverse of `scale()`.
	* @param {number} scale
	* @returns {number}
	*/
	static zoom(scale) {
		return Math.log(scale) / Math.LN2;
	}
	/**
	* Returns the euclidean distance between two points.
	* @param {LatLng} latlng1
	* @param {LatLng} latlng2
	* @returns {number}
	*/
	static distance(latlng1, latlng2) {
		const dx = latlng2.lng - latlng1.lng, dy = latlng2.lat - latlng1.lat;
		return Math.sqrt(dx * dx + dy * dy);
	}
	/** @type {boolean} */
	static infinite = true;
};
// src/layer/GeoJSON.js
/** @import {Feature, FeatureCollection, GeoJSON as GeoJSONData, GeoJsonObject, Geometry} from 'geojson' */
/** @import {Layer, InteractiveLayerOptions} from './Layer.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {PathOptions} from './vector/Path.js' */
/**
* Options of `GeoJSON`.
* @typedef {object} GeoJSONOptions
* @property {(geoJsonPoint: Feature, latlng: LatLng) => Layer} [pointToLayer] A
* `Function` defining how GeoJSON points spawn Maplair layers. It is internally
* called when data is added, passing the GeoJSON point feature and its `LatLng`.
* The default is to spawn a default `Marker`:
* ```js
* function(geoJsonPoint, latlng) {
* 	return new Marker(latlng);
* }
* ```
* @property {PathOptions|((geoJsonFeature: Feature) => PathOptions)} [style] A
* `Function` defining the `Path options` for styling GeoJSON lines and polygons,
* called internally when data is added.
* The default value is to not override any defaults:
* ```js
* function (geoJsonFeature) {
* 	return {}
* }
* ```
* @property {(feature: Feature, layer: Layer) => void} [onEachFeature] A `Function`
* that will be called once for each created `Feature`, after it has been created and
* styled. Useful for attaching events and popups to features. It will receive the
* `feature` as the first argument and its corresponding spawned `layer` from
* [`asFeature`](#geojson-asFeature) as the second.
* The default is to do nothing with the newly created layers:
* ```js
* function (feature, layer) {}
* ```
* @property {(geoJsonFeature: Feature) => boolean} [filter] A `Function` that will be
* used to decide whether to include a feature or not.
* The default is to include all features:
* ```js
* function (geoJsonFeature) {
* 	return true;
* }
* ```
* Note: dynamically changing the `filter` option will have effect only on newly
* added data. It will _not_ re-evaluate already included features.
* @property {(coords: number[]) => LatLng} [coordsToLatLng] A `Function` that will be
* used for converting GeoJSON coordinates to `LatLng`s.
* The default is the `coordsToLatLng` static method.
* @property {boolean} [markersInheritOptions=false] Whether default Markers for "Point"
* type Features inherit from group options.
* @extends InteractiveLayerOptions
*/
/**
* Properties of layers created from GeoJSON.
* @typedef {object} GeoJSONLayerProperties
* @lends Layer
* @property {Feature} [feature] The GeoJSON feature the layer was created from (by
* `GeoJSON`).
*/
/**
* Represents a GeoJSON object or an array of GeoJSON objects. Allows you to parse
* GeoJSON data and display it on the map. Extends `FeatureGroup`.
*
* There are several static functions which can be called without instantiating
* `GeoJSON`.
*
* @example
* ```js
* new GeoJSON(data, {
* 	style: function (feature) {
* 		return {color: feature.properties.color};
* 	}
* }).bindPopup(function (layer) {
* 	return layer.feature.properties.description;
* }).addTo(map);
* ```
*/
var GeoJSON = class GeoJSON extends FeatureGroup {
	/**
	* Creates a GeoJSON layer. Optionally accepts an object in
	* [GeoJSON format](https://tools.ietf.org/html/rfc7946) to display on the map
	* (you can alternatively add it later with `addData` method) and an `options` object.
	* @param {GeoJSONData|GeoJSONData[]|null} [geojson]
	* @param {GeoJSONOptions} [options]
	*/
	constructor(geojson, options) {
		super(void 0, options);
		if (geojson) this.addData(geojson);
		this.callInitHooks(GeoJSON);
	}
	/**
	* Adds a GeoJSON object to the layer.
	* @param {GeoJSONData|GeoJSONData[]} geojson
	* @returns {this}
	*/
	addData(geojson) {
		const features = Array.isArray(geojson) ? geojson : geojson.features;
		if (features) {
			for (const feature of features) if (feature.geometries || feature.geometry || feature.features || feature.coordinates) this.addData(feature);
			return this;
		}
		const options = this.options;
		if (options.filter && !options.filter(geojson)) return this;
		const layer = GeoJSON.geometryToLayer(geojson, options);
		if (!layer) return this;
		layer.feature = GeoJSON.asFeature(geojson);
		layer.defaultOptions = layer.options;
		this.resetStyle(layer);
		if (options.onEachFeature) options.onEachFeature(geojson, layer);
		return this.addLayer(layer);
	}
	/**
	* Resets the given vector layer's style to the original GeoJSON style, useful for
	* resetting style after hover events. If `layer` is omitted, the style of all
	* features in the current layer is reset.
	* @param {Layer} [layer]
	* @returns {this}
	*/
	resetStyle(layer) {
		if (layer === void 0) return this.eachLayer(this.resetStyle, this);
		layer.options = Object.create(layer.defaultOptions);
		this._setLayerStyle(layer, this.options.style);
		return this;
	}
	/**
	* Changes styles of GeoJSON vector layers with the given style function.
	* @param {PathOptions|((geoJsonFeature: Feature) => PathOptions)} style
	* @returns {this}
	*/
	setStyle(style) {
		return this.eachLayer((layer) => this._setLayerStyle(layer, style));
	}
	_setLayerStyle(layer, style) {
		if (layer.setStyle) {
			if (typeof style === "function") style = style(layer.feature);
			layer.setStyle(style);
		}
	}
	/**
	* Creates a `Layer` from a given GeoJSON feature. Can use a custom
	* [`pointToLayer`](#geojson-pointtolayer) and/or [`coordsToLatLng`](#geojson-coordstolatlng)
	* functions if provided as options.
	* @param {GeoJsonObject} geojson
	* @param {GeoJSONOptions} [options]
	* @returns {Layer|null}
	*/
	static geometryToLayer(geojson, options) {
		const geometry = geojson.type === "Feature" ? geojson.geometry : geojson, coords = geometry?.coordinates, layers = [], pointToLayer = options?.pointToLayer, _coordsToLatLng = options?.coordsToLatLng ?? GeoJSON.coordsToLatLng;
		let latlng, latlngs;
		if (!coords && !geometry) return null;
		switch (geometry.type) {
			case "Point":
				latlng = _coordsToLatLng(coords);
				return GeoJSON._pointToLayer(pointToLayer, geojson, latlng, options);
			case "MultiPoint":
				for (const coord of coords) {
					latlng = _coordsToLatLng(coord);
					layers.push(GeoJSON._pointToLayer(pointToLayer, geojson, latlng, options));
				}
				return new FeatureGroup(layers);
			case "LineString":
			case "MultiLineString":
				latlngs = GeoJSON.coordsToLatLngs(coords, geometry.type === "LineString" ? 0 : 1, _coordsToLatLng);
				return new Polyline(latlngs, options);
			case "Polygon":
			case "MultiPolygon":
				latlngs = GeoJSON.coordsToLatLngs(coords, geometry.type === "Polygon" ? 1 : 2, _coordsToLatLng);
				return new Polygon(latlngs, options);
			case "GeometryCollection":
				for (const g of geometry.geometries) {
					const geoLayer = GeoJSON.geometryToLayer({
						geometry: g,
						type: "Feature",
						properties: geojson.properties
					}, options);
					if (geoLayer) {
						geoLayer.feature = GeoJSON.asFeature(g);
						layers.push(geoLayer);
					}
				}
				return new FeatureGroup(layers);
			case "FeatureCollection":
				for (const f of geometry.features) {
					const featureLayer = GeoJSON.geometryToLayer(f, options);
					if (featureLayer) layers.push(featureLayer);
				}
				return new FeatureGroup(layers);
			default: throw new Error("Invalid GeoJSON object.");
		}
	}
	static _pointToLayer(pointToLayerFn, geojson, latlng, options) {
		return pointToLayerFn ? pointToLayerFn(geojson, latlng) : new Marker(latlng, options?.markersInheritOptions && options);
	}
	/**
	* Creates a `LatLng` object from an array of 2 numbers (longitude, latitude)
	* or 3 numbers (longitude, latitude, altitude) used in GeoJSON for points.
	* @param {number[]} coords
	* @returns {LatLng}
	*/
	static coordsToLatLng(coords) {
		return new LatLng(coords[1], coords[0], coords[2]);
	}
	/**
	* Creates a multidimensional array of `LatLng`s from a GeoJSON coordinates array.
	* `levelsDeep` specifies the nesting level (0 is for an array of points, 1 for an
	* array of arrays of points, etc., 0 by default).
	* Can use a custom [`coordsToLatLng`](#geojson-coordstolatlng) function.
	* @param {any[]} coords
	* @param {number} [levelsDeep]
	* @param {(coords: number[]) => LatLng} [_coordsToLatLng]
	* @returns {any[]}
	*/
	static coordsToLatLngs(coords, levelsDeep, _coordsToLatLng) {
		return coords.map((coord) => levelsDeep ? GeoJSON.coordsToLatLngs(coord, levelsDeep - 1, _coordsToLatLng) : (_coordsToLatLng || GeoJSON.coordsToLatLng)(coord));
	}
	/**
	* Reverse of [`coordsToLatLng`](#geojson-coordstolatlng).
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) function.
	* @param {LatLngExpression} latlng
	* @param {number|false} [precision]
	* @returns {number[]}
	*/
	static latLngToCoords(latlng, precision) {
		return latLngToCoords(latlng, precision);
	}
	/**
	* Reverse of [`coordsToLatLngs`](#geojson-coordstolatlngs).
	* `close` determines whether the first point should be appended to the end of the
	* array to close the feature, only used when `levelsDeep` is 0. False by default.
	* Coordinates values are rounded with [`formatNum`](#util-formatnum) function.
	* @param {any[]} latlngs
	* @param {number} [levelsDeep]
	* @param {boolean} [close]
	* @param {number|false} [precision]
	* @returns {any[]}
	*/
	static latLngsToCoords(latlngs, levelsDeep, close, precision) {
		return latLngsToCoords(latlngs, levelsDeep, close, precision);
	}
	/**
	* Returns GeoJSON geometries/features of layer with new GeoJSON geometry.
	* @param {Layer} layer
	* @param {Geometry} newGeometry
	* @returns {Feature}
	*/
	static getFeature(layer, newGeometry) {
		return getFeature(layer, newGeometry);
	}
	/**
	* Normalize GeoJSON geometries/features into GeoJSON features.
	* @param {GeoJsonObject} geojson
	* @returns {Feature|FeatureCollection}
	*/
	static asFeature(geojson) {
		return asFeature(geojson);
	}
};
// src/layer/Classification.js
/** @import {PathOptions} from './vector/Path.js' */
/**
* A class of a `Classification`, given by value or by range.
* @typedef {object} ClassificationClass
* @property {any} [value] The value of the class, or an array of values sharing the
* class.
* @property {number} [lower] The lower bound of the range of the class (included);
* left out for an open end.
* @property {number} [upper] The upper bound of the range of the class (excluded);
* left out for an open end.
* @property {PathOptions} [symbol] The symbol of the class (path options such as
* `fillColor`).
* @property {string} [legend] The legend label of the class.
* @property {boolean} [counted] `false` to exclude the class from the feature count
* (e.g. "no data").
*/
/**
* An item of the legend of a `Classification`, see `legendItems()`.
* @typedef {object} ClassificationLegendItem
* @property {string} legend The legend label.
* @property {PathOptions} symbol The symbol.
* @property {boolean} counted Whether the features of the item are counted.
* @property {ClassificationClass[]} classes The classes sharing the item.
*/
/**
* A legend item of a `Classification` with the feature count, see `featureCount()`.
* @typedef {object} ClassificationFeatureCount
* @property {number} count The number of features of the item.
* @property {number} [share] The fraction of the counted features (`undefined` for
* items not counted).
* @extends ClassificationLegendItem
*/
/**
* Options of `Classification`.
* @typedef {object} ClassificationOptions
* @property {string} [name=''] The name of the classification, shown as title of its
* legend.
* @property {string|((feature: any) => any)} [value] The value to classify by: the
* name of a property of the feature, or a function receiving the feature and
* returning the value. Without it, the argument of `classify()` is the value itself.
* @property {(value: any) => any} [normalize] A function applied to the values of the
* classes and of the features before comparing them, for tolerant matching, e.g.
* `v => String(v).trim().toUpperCase()`.
* @property {ClassificationClass} [otherValues] The class of all values not matching
* any other class, with `symbol` and `legend` (default "All other values"). Without
* it, such features are not classified.
*/
/**
* Classifies features
* by the value of an attribute, for thematic maps: each class
* has a symbol (path options such as `fillColor`) and a legend label. A class is
* either given by value (`{value: 'S2'}`, or several values sharing one class
* `{value: ['S1', 'S2']}`) or by range (`{lower: 0, upper: 10}` for
* `0 ≤ value < 10`, either bound left out for an open end); both kinds may be
* mixed in one classification. A feature is classified by its exact value first,
* then by range, then by legend label, else it falls into the
* [`otherValues`](#classification-othervalues) class.
*
* Use [`style`](#classification-style) as `style` option of `GeoJSON` to style
* the features by their class, and
* [`LegendControl.addClassification()`](#legendcontrol-addclassification) to
* show the classes in a legend, with the feature count per class.
*
* @example
* ```js
* const temperature = new Classification([
* 	{value: null, symbol: {fillColor: '#000000'}, legend: 'No data', counted: false},
* 	{upper: 0, symbol: {fillColor: '#5bc0de'}, legend: '< 0 °C'},
* 	{lower: 0, upper: 10, symbol: {fillColor: '#33ee33'}, legend: '0–10 °C'},
* 	{lower: 10, symbol: {fillColor: '#f0a030'}, legend: '≥ 10 °C'}
* ], {name: 'Air temperature', value: 'temperature'});
*
* const stations = new GeoJSON(data, {
* 	pointToLayer: (feature, latlng) => new CircleMarker(latlng, {color: '#ffffff'}),
* 	style: temperature.style
* }).addTo(map);
*
* temperature.classify(data.features[0]).legend; // e.g. '0–10 °C'
* ```
*
* Inspired by the categorized and graduated renderers of [QGIS](https://qgis.org/).
*/
var Classification = class {
	/**
	* Creates a classification from the given classes. Each class is an object with
	* `value` (a value or an array of values) or `lower`/`upper` (a range including
	* `lower`, excluding `upper`), a `symbol` (path options), a `legend` label, and
	* `counted: false` to exclude the class from the feature count (e.g. "no data").
	* @param {ClassificationClass[]} classes
	* @param {ClassificationOptions} [options]
	*/
	constructor(classes, options) {
		/**
		* The options of the classification.
		* @type {ClassificationOptions}
		*/
		this.options = {
			name: "",
			value: void 0,
			normalize: void 0,
			otherValues: void 0,
			...options
		};
		this._classes = classes;
		this._values = /* @__PURE__ */ new Map();
		this._labels = /* @__PURE__ */ new Map();
		const ranges = [];
		for (const cls of classes) {
			if ("value" in cls) for (const value of Array.isArray(cls.value) ? cls.value : [cls.value]) {
				const key = this._normalize(value);
				if (!this._values.has(key)) this._values.set(key, cls);
			}
			else ranges.push(cls);
			if (cls.legend !== void 0 && !this._labels.has(this._normalize(cls.legend))) this._labels.set(this._normalize(cls.legend), cls);
		}
		this._ranges = ranges.sort((a, b) => (a.lower ?? -Infinity) - (b.lower ?? -Infinity));
		const other = this.options.otherValues;
		this._other = other && {
			legend: I18n.translate("All other values"),
			...other
		};
		this.style = this.style.bind(this);
	}
	/**
	* Returns the class of the given GeoJSON feature, of a layer with a `feature`
	* (as created by `GeoJSON`) or, without the `value` option, of a value: one of the
	* classes passed to the constructor, the `otherValues` class or `undefined`.
	* @param {any} feature A `Feature`, a `Layer` with a `feature`, or a value.
	* @returns {ClassificationClass|undefined}
	*/
	classify(feature) {
		const value = this._normalize(this._getValue(feature?.feature ?? feature));
		return this._values.get(value) ?? this._findRange(value) ?? this._labels.get(value) ?? this._other;
	}
	/**
	* Returns the symbol of the class of the feature (an empty object for features
	* without class), bound to the classification for the `style` option of `GeoJSON`.
	* @param {any} feature A `Feature`, a `Layer` with a `feature`, or a value.
	* @returns {PathOptions}
	*/
	style(feature) {
		return this.classify(feature)?.symbol ?? {};
	}
	/**
	* Returns the items of the legend, `{legend, symbol, counted, classes}`, in the order
	* of the classes and `otherValues` last. Classes with the same legend label and
	* symbol share one item.
	* @returns {ClassificationLegendItem[]}
	*/
	legendItems() {
		return this._getItems().items;
	}
	/**
	* Counts the given features (or layers with a `feature`) per legend item, returning
	* the legend items with `count` and `share` (the fraction of the counted features).
	* Classes with `counted: false` get a `count`, but no `share`, and do not count
	* toward the total.
	* @param {any[]} features `Feature`s, `Layer`s with a `feature`, or values.
	* @returns {ClassificationFeatureCount[]}
	*/
	featureCount(features) {
		const { items, itemOf } = this._getItems(), counts = new Map(items.map((item) => [item, 0]));
		for (const feature of features) {
			const item = itemOf.get(this.classify(feature));
			if (item) counts.set(item, counts.get(item) + 1);
		}
		const total = items.reduce((sum, item) => sum + (item.counted ? counts.get(item) : 0), 0);
		return items.map((item) => ({
			...item,
			count: counts.get(item),
			share: item.counted ? total ? counts.get(item) / total : 0 : void 0
		}));
	}
	_getValue(feature) {
		const { value } = this.options;
		if (typeof value === "function") return value(feature);
		if (value === void 0) return feature;
		return feature?.properties?.[value];
	}
	_normalize(value) {
		value ??= null;
		const { normalize } = this.options;
		return normalize && value !== null ? normalize(value) : value;
	}
	_findRange(value) {
		const num = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
		if (typeof num !== "number" || Number.isNaN(num)) return;
		const ranges = this._ranges;
		let lo = 0, hi = ranges.length - 1, found;
		while (lo <= hi) {
			const mid = lo + hi >> 1;
			if ((ranges[mid].lower ?? -Infinity) <= num) {
				found = ranges[mid];
				lo = mid + 1;
			} else hi = mid - 1;
		}
		return found && num < (found.upper ?? Infinity) ? found : void 0;
	}
	_getItems() {
		const items = [], itemOf = /* @__PURE__ */ new Map(), byKey = /* @__PURE__ */ new Map(), classes = this._other ? [...this._classes, this._other] : this._classes;
		for (const cls of classes) {
			const legend = cls.legend ?? this._defaultLegend(cls), key = `${legend}\u0000${JSON.stringify(cls.symbol ?? {})}`;
			let item = byKey.get(key);
			if (!item) {
				item = {
					legend,
					symbol: cls.symbol ?? {},
					counted: cls.counted !== false,
					classes: []
				};
				byKey.set(key, item);
				items.push(item);
			}
			item.classes.push(cls);
			itemOf.set(cls, item);
		}
		return {
			items,
			itemOf
		};
	}
	_defaultLegend(cls) {
		if ("value" in cls) return [cls.value].flat().map(String).join(", ");
		const format = (num) => num.toLocaleString(I18n.getLocale() ?? void 0);
		if (cls.lower === void 0) return `< ${format(cls.upper)}`;
		if (cls.upper === void 0) return `≥ ${format(cls.lower)}`;
		return `${format(cls.lower)}–${format(cls.upper)}`;
	}
	/**
	* Returns `n` ranges `{lower, upper}` with about the same number of the given values
	* each (fewer for repeated values), the first and last range open-ended. Add a
	* `symbol` (and a `legend`) to each to create a `Classification`.
	* @group Classification methods
	* @param {number[]} values
	* @param {number} n
	* @returns {{lower?: number, upper?: number}[]}
	*/
	static quantile(values, n) {
		const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b), breaks = [];
		for (let i = 1; i < n && sorted.length; i++) breaks.push(sorted[Math.floor(i * sorted.length / n)]);
		return rangesOf(breaks);
	}
	/**
	* Returns `n` ranges `{lower, upper}` of equal width between the minimum and the
	* maximum of the given values, the first and last range open-ended.
	* @group Classification methods
	* @param {number[]} values
	* @param {number} n
	* @returns {{lower?: number, upper?: number}[]}
	*/
	static equalInterval(values, n) {
		const finite = values.filter(Number.isFinite);
		if (!finite.length) return rangesOf([]);
		const min = Math.min(...finite), width = (Math.max(...finite) - min) / n, breaks = [];
		for (let i = 1; i < n; i++) breaks.push(min + i * width);
		return rangesOf(breaks);
	}
};
function rangesOf(breaks) {
	const unique = [...new Set(breaks)];
	return [void 0, ...unique].map((lower, i) => {
		const range = {};
		if (lower !== void 0) range.lower = lower;
		if (i < unique.length) range.upper = unique[i];
		return range;
	});
}
// src/layer/HeatLayer.js
/** @import {BlanketOverlayOptions} from './BlanketOverlay.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/**
* Options of `HeatLayer`.
* @typedef {object} HeatLayerOptions
* @property {number} [radius=25] The radius of each point in pixels.
* @property {number} [blur=15] The amount of blur in pixels.
* @property {number} [max=1] The intensity with the strongest color.
* @property {number} [maxZoom] The zoom level where the points reach the full
* intensity; below it, the intensity is halved per zoom level. By default the
* maximum zoom of the map.
* @property {number} [minOpacity=0.05] The minimum opacity of the heat.
* @property {Record<number, string>} [gradient={0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'}]
* The colors for the intensities from `0` to `1`, any CSS colors.
* @property {string} [pane='overlayPane'] The map pane of the layer.
* @extends BlanketOverlayOptions
*/
/**
* A heatmap of points, each with an optional intensity, drawn on a canvas: the
* points are drawn as blurred circles adding up, and colored by a gradient.
* Nearby points are merged into a grid for speed, so that tens of thousands of
* points stay fast.
*
* Inspired by the [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) plugin
* and its [simpleheat](https://github.com/mourner/simpleheat) algorithm.
*
* @example
* ```js
* new HeatLayer([
* 	[47.27, 11.40, 0.5], // latitude, longitude, intensity
* 	[47.28, 11.41],
* 	new LatLng(47.26, 11.39)
* ], {radius: 20}).addTo(map);
* ```
*/
var HeatLayer = class HeatLayer extends BlanketOverlay {
	static defaultOptions = {
		radius: 25,
		blur: 15,
		max: 1,
		maxZoom: void 0,
		minOpacity: .05,
		gradient: {
			.4: "blue",
			.6: "cyan",
			.7: "lime",
			.8: "yellow",
			1: "red"
		},
		pane: "overlayPane"
	};
	/**
	* Creates a heatmap of the given points: `LatLng`s or arrays
	* `[lat, lng, intensity]` (the intensity defaults to `1`).
	* @param {LatLngExpression[]} [latlngs]
	* @param {HeatLayerOptions} [options]
	*/
	constructor(latlngs, options) {
		super(options);
		this._latlngs = latlngs ?? [];
		this.callInitHooks(HeatLayer);
	}
	/**
	* Replaces the points of the heatmap.
	* @param {LatLngExpression[]} latlngs
	* @returns {this}
	*/
	setLatLngs(latlngs) {
		this._latlngs = latlngs;
		return this.redraw();
	}
	/**
	* Adds a point to the heatmap.
	* @param {LatLngExpression} latlng
	* @returns {this}
	*/
	addLatLng(latlng) {
		this._latlngs.push(latlng);
		return this.redraw();
	}
	/**
	* Returns the points of the heatmap.
	* @returns {LatLngExpression[]}
	*/
	getLatLngs() {
		return this._latlngs;
	}
	/**
	* Changes the options, e.g. the `radius` or the `gradient`.
	* @param {HeatLayerOptions} options
	* @returns {this}
	*/
	setOptions(options) {
		setOptions(this, options);
		this._circle = this._gradient = null;
		return this.redraw();
	}
	/**
	* Redraws the heatmap.
	* @returns {this}
	*/
	redraw() {
		if (this._map && this._bounds) {
			cancelAnimationFrame(this._frame);
			this._frame = requestAnimationFrame(() => this._draw());
		}
		return this;
	}
	_initContainer() {
		this._container = document.createElement("canvas");
		this._container.classList.add("maplair-heatmap-layer");
		this._ctx = this._container.getContext("2d");
	}
	_destroyContainer() {
		cancelAnimationFrame(this._frame);
		super._destroyContainer();
	}
	_resizeContainer() {
		const size = super._resizeContainer();
		this._container.width = size.x;
		this._container.height = size.y;
		return size;
	}
	_onSettled() {
		this._draw();
	}
	_getCircle() {
		if (this._circle) return this._circle;
		const { radius, blur } = this.options, r = radius + blur, circle = this._circle = document.createElement("canvas"), ctx = circle.getContext("2d");
		circle.width = circle.height = r * 2;
		ctx.shadowOffsetX = ctx.shadowOffsetY = r * 2;
		ctx.shadowBlur = blur;
		ctx.shadowColor = "black";
		ctx.beginPath();
		ctx.arc(-r, -r, radius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
		return circle;
	}
	_getGradient() {
		if (this._gradient) return this._gradient;
		const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d"), gradient = ctx.createLinearGradient(0, 0, 0, 256);
		canvas.width = 1;
		canvas.height = 256;
		for (const [stop, color] of Object.entries(this.options.gradient)) gradient.addColorStop(Number(stop), color);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 1, 256);
		this._gradient = ctx.getImageData(0, 0, 1, 256).data;
		return this._gradient;
	}
	_draw() {
		const map = this._map;
		if (!map || !this._bounds) return;
		const ctx = this._ctx, { width, height } = this._container, offset = this._bounds.min, { radius, blur, max, minOpacity } = this.options, r = radius + blur, maxZoom = this.options.maxZoom ?? map.getMaxZoom(), zoomFactor = 1 / 2 ** Math.max(0, Math.min(maxZoom - map.getZoom(), 12)), cellSize = radius / 2, grid = /* @__PURE__ */ new Map();
		for (const latlng of this._latlngs) {
			const point = map.latLngToLayerPoint(latlng)._round()._subtract(offset);
			if (point.x < -r || point.y < -r || point.x > width + r || point.y > height + r) continue;
			const intensity = (latlng.alt ?? latlng[2] ?? 1) * zoomFactor, key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`, cell = grid.get(key);
			if (cell) {
				const sum = cell.intensity + intensity;
				cell.x = (cell.x * cell.intensity + point.x * intensity) / sum;
				cell.y = (cell.y * cell.intensity + point.y * intensity) / sum;
				cell.intensity = sum;
			} else grid.set(key, {
				x: point.x,
				y: point.y,
				intensity
			});
		}
		ctx.clearRect(0, 0, width, height);
		const circle = this._getCircle();
		for (const { x, y, intensity } of grid.values()) {
			ctx.globalAlpha = Math.min(Math.max(intensity / max, minOpacity), 1);
			ctx.drawImage(circle, x - r, y - r);
		}
		ctx.globalAlpha = 1;
		if (!grid.size) return;
		const image = ctx.getImageData(0, 0, width, height), pixels = image.data, gradient = this._getGradient();
		for (let i = 3; i < pixels.length; i += 4) {
			const j = pixels[i] * 4;
			if (j) {
				pixels[i - 3] = gradient[j];
				pixels[i - 2] = gradient[j + 1];
				pixels[i - 1] = gradient[j + 2];
			}
		}
		ctx.putImageData(image, 0, 0);
	}
};
// src/layer/ImageOverlay.js
/** @import {InteractiveLayerOptions} from './Layer.js' */
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, MaplairEvent} from '../core/Events.js' */
/**
* Options of `ImageOverlay`.
* @typedef {object} ImageOverlayOptions
* @property {number} [opacity=1] The opacity of the image overlay.
* @property {string} [alt=''] Text for the `alt` attribute of the image (useful for
* accessibility).
* @property {boolean} [interactive=false] If `true`, the image overlay will emit
* [pointer events](#interactivelayeroptions) when clicked or hovered.
* @property {boolean|string} [crossOrigin=false] Whether the crossOrigin attribute
* will be added to the image. If a String is provided, the image will have its
* crossOrigin attribute set to the String provided. This is needed if you want to
* access image pixel data. Refer to
* [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
* for valid String values.
* @property {string} [errorOverlayUrl=''] URL to the overlay image to show in place
* of the overlay that failed to load.
* @property {number} [zIndex=1] The explicit
* [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index)
* of the overlay layer.
* @property {string} [className=''] A custom class name to assign to the image. Empty
* by default.
* @property {boolean} [pixelated=false] Whether to scale the image with
* nearest-neighbour interpolation (`image-rendering: pixelated`) instead of smoothing
* it, so that its pixels stay crisp when zoomed in. Useful for raster data, pixel art
* or scientific imagery.
* @property {string} [decoding='auto'] Tells the browser whether to decode the image
* in a synchronous fashion, as per the
* [`decoding` HTML attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding).
* If the image overlay is flickering when being added/removed, set this option to
* `'sync'`.
* @extends InteractiveLayerOptions
*/
/**
* Used to load and display a single image over specific bounds of the map. Extends `Layer`.
*
* @example
* ```js
* const imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
* 	imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
* new ImageOverlay(imageUrl, imageBounds).addTo(map);
* ```
*
* @fires load {MaplairEvent} Fired when the ImageOverlay layer has loaded its image.
* @fires error {MaplairEvent} Fired when the ImageOverlay layer fails to load its image.
*/
var ImageOverlay = class ImageOverlay extends Layer {
	static defaultOptions = {
		opacity: 1,
		alt: "",
		interactive: false,
		crossOrigin: false,
		errorOverlayUrl: "",
		zIndex: 1,
		className: "",
		pixelated: false,
		decoding: "auto"
	};
	/**
	* Instantiates an image overlay object given the URL of the image (or an image
	* element) and the geographical bounds it is tied to.
	* @param {string|HTMLImageElement} url
	* @param {LatLngBoundsExpression} bounds
	* @param {ImageOverlayOptions} [options]
	*/
	constructor(url, bounds, options) {
		super();
		this._url = url;
		this._bounds = new LatLngBounds(bounds);
		setOptions(this, options);
		this.callInitHooks(ImageOverlay);
	}
	/**
	* Adds the image to the map.
	* @type {(map: MaplairMap) => void}
	*/
	onAdd() {
		if (!this._image) {
			this._initImage();
			if (this.options.opacity < 1) this._updateOpacity();
		}
		if (this.options.interactive) {
			this._image.classList.add("maplair-interactive");
			this.addInteractiveTarget(this._image);
		}
		this._image.classList.toggle("maplair-pixelated", !!this.options.pixelated);
		this.getPane().appendChild(this._image);
		this._reset();
	}
	/**
	* Removes the image from the map.
	* @type {(map: MaplairMap) => void}
	*/
	onRemove() {
		this._image.remove();
		if (this.options.interactive) this.removeInteractiveTarget(this._image);
	}
	_updateInteractive() {
		this._image.classList.toggle("maplair-interactive", this.options.interactive);
		if (this.options.interactive) this.addInteractiveTarget(this._image);
		else this.removeInteractiveTarget(this._image);
	}
	/**
	* Sets the opacity of the overlay.
	* @param {number} opacity
	* @returns {this}
	*/
	setOpacity(opacity) {
		this.options.opacity = opacity;
		if (this._image) this._updateOpacity();
		return this;
	}
	/**
	* Sets the opacity of the overlay from the given style options, e.g. by
	* `FeatureGroup.setStyle()`.
	* @param {{opacity?: number}} styleOpts
	* @returns {this}
	*/
	setStyle(styleOpts) {
		if (styleOpts.opacity) this.setOpacity(styleOpts.opacity);
		return this;
	}
	/**
	* Brings the layer to the top of all overlays.
	* @returns {this}
	*/
	bringToFront() {
		if (this._map) toFront(this._image);
		return this;
	}
	/**
	* Brings the layer to the bottom of all overlays.
	* @returns {this}
	*/
	bringToBack() {
		if (this._map) toBack(this._image);
		return this;
	}
	/**
	* Changes the URL of the image.
	* @param {string} url
	* @returns {this}
	*/
	setUrl(url) {
		this._url = url;
		if (this._image) this._image.src = url;
		return this;
	}
	/**
	* Update the bounds that this ImageOverlay covers.
	* @param {LatLngBoundsExpression} bounds
	* @returns {this}
	*/
	setBounds(bounds) {
		this._bounds = new LatLngBounds(bounds);
		if (this._map) this._reset();
		return this;
	}
	/**
	* Returns the map events the overlay listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		return {
			zoom: this._reset,
			viewreset: this._reset,
			zoomanim: this._animateZoom
		};
	}
	/**
	* Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
	* @param {number} value
	* @returns {this}
	*/
	setZIndex(value) {
		this.options.zIndex = value;
		this._updateZIndex();
		return this;
	}
	/**
	* Get the bounds that this ImageOverlay covers.
	* @returns {LatLngBounds}
	*/
	getBounds() {
		return this._bounds;
	}
	/**
	* Returns the instance of
	* [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
	* used by this overlay (`HTMLVideoElement` for `VideoOverlay`, `SVGElement` for
	* `SVGOverlay`).
	* @returns {HTMLElement|SVGElement}
	*/
	getElement() {
		return this._image;
	}
	_initImage() {
		const wasElementSupplied = this._url instanceof HTMLImageElement;
		const img = this._image = wasElementSupplied ? this._url : create("img");
		img.classList.add("maplair-image-layer", "maplair-zoom-animated");
		if (this.options.className) img.classList.add(...splitWords(this.options.className));
		img.onload = this.fire.bind(this, "load");
		img.onerror = this._overlayOnError.bind(this);
		if (this.options.crossOrigin || this.options.crossOrigin === "") img.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
		img.decoding = this.options.decoding;
		if (this.options.zIndex) this._updateZIndex();
		if (wasElementSupplied) {
			this._url = img.src;
			return;
		}
		img.src = this._url;
		img.alt = this.options.alt;
	}
	_animateZoom(e) {
		const scale = this._map.getZoomScale(e.zoom), offset = this._map._latLngToNewLayerPoint(this._bounds.getNorthWest(), e.zoom, e.center);
		setTransform(this._image, offset, scale);
	}
	_reset() {
		const image = this._image, bounds = new Bounds(this._map.latLngToLayerPoint(this._bounds.getNorthWest())._round(), this._map.latLngToLayerPoint(this._bounds.getSouthEast())._round()), size = bounds.getSize();
		setPosition(image, bounds.min);
		image.style.width = `${size.x}px`;
		image.style.height = `${size.y}px`;
	}
	_updateOpacity() {
		this._image.style.opacity = `${this.options.opacity}`;
	}
	_updateZIndex() {
		if (this._image && this.options.zIndex !== void 0 && this.options.zIndex !== null) this._image.style.zIndex = `${this.options.zIndex}`;
	}
	_overlayOnError() {
		this.fire("error");
		const errorUrl = this.options.errorOverlayUrl;
		if (errorUrl && this._url !== errorUrl) {
			this._url = errorUrl;
			this._image.src = errorUrl;
		}
	}
	/**
	* Returns the center of the ImageOverlay.
	* @returns {LatLng}
	*/
	getCenter() {
		return this._bounds.getCenter();
	}
};
// src/layer/VideoOverlay.js
/** @import {ImageOverlayOptions} from './ImageOverlay.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
* Options of `VideoOverlay`.
* @typedef {object} VideoOverlayOptions
* @property {boolean} [autoplay=true] Whether the video starts playing automatically
* when loaded. On some browsers autoplay will only work with `muted: true`.
* @property {boolean} [controls=false] Whether the browser will offer controls to
* allow the user to control video playback, including volume, seeking, and
* pause/resume playback.
* @property {boolean} [loop=true] Whether the video will loop back to the beginning
* when played.
* @property {boolean} [keepAspectRatio=true] Whether the video will save aspect ratio
* after the projection.
* @property {boolean} [muted=false] Whether the video starts on mute when loaded.
* @property {boolean} [playsInline=true] Mobile browsers will play the video right
* where it is instead of open it up in fullscreen mode.
* @extends ImageOverlayOptions
*/
/**
* Used to load and display a video player over specific bounds of the map. Extends
* `ImageOverlay`.
*
* A video overlay uses the [`<video>`](https://developer.mozilla.org/docs/Web/HTML/Element/video)
* HTML element; `getElement()` returns the instance of
* [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement)
* used by this overlay.
*
* @example
* ```js
* const videoUrl = 'https://www.mapbox.com/bites/00188/patricia_nasa.webm',
* 	videoBounds = [[ 32, -130], [ 13, -100]];
* new VideoOverlay(videoUrl, videoBounds ).addTo(map);
* ```
*
* @fires load {MaplairEvent} Fired when the video has finished loading the first frame.
*/
var VideoOverlay = class VideoOverlay extends ImageOverlay {
	static defaultOptions = {
		autoplay: true,
		controls: false,
		loop: true,
		keepAspectRatio: true,
		muted: false,
		playsInline: true
	};
	/**
	* Instantiates a video overlay object given the URL of the video (or array of
	* URLs, or even a video element) and the geographical bounds it is tied to.
	* @overload
	* @param {string|string[]|HTMLVideoElement} video
	* @param {LatLngBoundsExpression} bounds
	* @param {VideoOverlayOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(VideoOverlay);
	}
	_initImage() {
		const wasElementSupplied = this._url instanceof HTMLVideoElement;
		const vid = this._image = wasElementSupplied ? this._url : create("video");
		vid.classList.add("maplair-image-layer", "maplair-zoom-animated");
		if (this.options.className) vid.classList.add(...splitWords(this.options.className));
		on(vid, "pointerdown", (e) => {
			if (vid.controls) stopPropagation(e);
		});
		vid.onloadeddata = this.fire.bind(this, "load");
		if (wasElementSupplied) {
			const sourceElements = vid.getElementsByTagName("source");
			const sources = Array.from(sourceElements, (e) => e.src);
			this._url = sourceElements.length > 0 ? sources : [vid.src];
			return;
		}
		if (!Array.isArray(this._url)) this._url = [this._url];
		if (!this.options.keepAspectRatio) vid.style["objectFit"] = "fill";
		vid.autoplay = !!this.options.autoplay;
		vid.controls = !!this.options.controls;
		vid.loop = !!this.options.loop;
		vid.muted = !!this.options.muted;
		vid.playsInline = !!this.options.playsInline;
		for (const url of this._url) {
			const source = create("source");
			source.src = url;
			vid.appendChild(source);
		}
	}
};
// src/layer/SVGOverlay.js
/** @import {ImageOverlayOptions} from './ImageOverlay.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/**
* Used to load, display and provide DOM access to an SVG file over specific bounds of
* the map. Extends `ImageOverlay`.
*
* An SVG overlay uses the [`<svg>`](https://developer.mozilla.org/docs/Web/SVG/Element/svg)
* element; `getElement()` returns the instance of
* [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) used by this
* overlay.
*
* @example
* ```js
* const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
* svgElement.setAttribute('xmlns', "http://www.w3.org/2000/svg");
* svgElement.setAttribute('viewBox', "0 0 200 200");
* svgElement.innerHTML = '<rect width="200" height="200"/><rect x="75" y="23" width="50" height="50" style="fill:red"/><rect x="75" y="123" width="50" height="50" style="fill:#0013ff"/>';
* const svgElementBounds = [ [ 32, -130 ], [ 13, -100 ] ];
* new SVGOverlay(svgElement, svgElementBounds).addTo(map);
* ```
*/
var SVGOverlay = class SVGOverlay extends ImageOverlay {
	/**
	* Instantiates an image overlay object given an SVG element and the geographical
	* bounds it is tied to. A viewBox attribute is required on the SVG element to zoom
	* in and out properly.
	* @overload
	* @param {SVGElement} svg
	* @param {LatLngBoundsExpression} bounds
	* @param {ImageOverlayOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(SVGOverlay);
	}
	_initImage() {
		const el = this._image = this._url;
		el.classList.add("maplair-image-layer", "maplair-zoom-animated");
		if (this.options.className) el.classList.add(...splitWords(this.options.className));
	}
};
// src/layer/marker/DivIcon.js
/** @import {IconOptions} from './Icon.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/**
* Options of `DivIcon`.
* @typedef {object} DivIconOptions
* @property {PointExpression|number} [iconSize=[12, 12]] Size of the icon in pixels,
* also can be set through CSS.
* @property {string|HTMLElement|false} [html=false] Custom HTML code to put inside the
* div element, empty by default. Alternatively, an instance of `HTMLElement`.
* @property {PointExpression|null} [bgPos=null] Optional relative position of the
* background, in pixels.
* @property {string} [className='maplair-div-icon']
* @extends IconOptions
*/
/**
* Represents a lightweight icon for markers that uses a simple `<div>`
* element instead of an image. Inherits from `Icon` but ignores the `iconUrl` and
* shadow options.
*
* By default, it has a 'maplair-div-icon' CSS class and is styled as a little white
* square with a shadow.
*
* @example
* ```js
* const myIcon = new DivIcon({className: 'my-div-icon'});
* // you can set .my-div-icon styles in CSS
*
* new Marker([50.505, 30.57], {icon: myIcon}).addTo(map);
* ```
*/
var DivIcon = class DivIcon extends Icon {
	static defaultOptions = {
		iconSize: [12, 12],
		html: false,
		bgPos: null,
		className: "maplair-div-icon"
	};
	/**
	* Creates a `DivIcon` instance with the given options.
	* @param {[options?: DivIconOptions]} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(DivIcon);
	}
	/**
	* Called internally when the icon has to be shown, returns a `<div>` element
	* styled according to the options.
	* @param {HTMLElement} [oldIcon] The current element of the icon, to be reused if possible.
	* @returns {HTMLElement}
	*/
	createIcon(oldIcon) {
		const div = oldIcon instanceof HTMLDivElement ? oldIcon : document.createElement("div"), options = this.options;
		if (options.html instanceof Element) {
			div.replaceChildren();
			div.appendChild(options.html);
		} else div.innerHTML = options.html !== false ? options.html : "";
		if (options.bgPos) {
			const bgPos = Point.from(options.bgPos);
			div.style.backgroundPosition = `${-bgPos.x}px ${-bgPos.y}px`;
		}
		this._setIconStyles(div, "icon");
		return div;
	}
	/**
	* Returns `null`, a `DivIcon` has no shadow.
	* @returns {null}
	*/
	createShadow() {
		return null;
	}
};
// src/layer/marker/SvgIcon.js
/** @import {DefaultIconOptions} from './DefaultIcon.js' */
const svgNS = "http://www.w3.org/2000/svg";
const markerPath = "M416.500 542.096L420.919 533.569L422.024 531.437L424.460 529.996L424.233 527.174L426.670 525.732L426.382 522.881L428.720 521.213L428.075 518.393L429.979 516.125L428.342 513.639L429.080 510.777L426.581 509.207L426.168 506.292L423.266 505.773L421.781 503.221L418.898 503.859L416.511 502.112L414.131 503.870L411.248 503.241L409.766 505.793L406.865 506.302L406.439 509.216L403.933 510.775L404.661 513.641L403.023 516.136L404.935 518.393L404.271 521.204L406.590 522.896L406.299 525.752L408.738 527.189L408.516 530.011L410.956 531.448L412.065 533.578Z";
const markerTransform = "translate(-7889.1 -9807.44)scale(19.5417)";
const leafPath = "m-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z";
const leafTransform = "translate(250 258)scale(.068)";
const glyphX = 250;
const glyphY = 270;
const glyphSize = 230;
function svgElement(name, attributes, parent) {
	const el = document.createElementNS(svgNS, name);
	for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
	parent?.appendChild(el);
	return el;
}
/**
* Options of `SvgIcon`.
* @typedef {object} SvgIconOptions
* @property {string} [color='#d4462c'] The fill color of the marker, any CSS color. The
* outline is a darker shade of it.
* @property {string} [glyph] A character or emoji (or short text) shown in the marker
* instead of the maple leaf.
* @property {string} [glyphPath] The path data of an SVG glyph in a 24×24 view box (like
* Material Design Icons), shown in the marker instead of the maple leaf.
* @property {string} [glyphColor='white'] The color of the glyph or the maple leaf.
* @extends DefaultIconOptions
*/
/**
* A marker icon in the shape of the default marker (with its shadow), drawn as
* inline SVG in any color and with an optional glyph – a character, an emoji or an
* SVG path (e.g. of an icon set) – instead of the white maple leaf. No image per
* color is needed, and it stays sharp on any screen.
*
* Inspired by the [Leaflet.awesome-markers](https://github.com/lennardv2/Leaflet.awesome-markers),
* [leaflet-color-markers](https://github.com/pointhi/leaflet-color-markers) and
* [Leaflet.ExtraMarkers](https://github.com/coryasilva/Leaflet.ExtraMarkers) plugins.
*
* @example
* ```js
* new Marker([47.27, 11.40], {icon: new SvgIcon({color: '#2a81cb', glyph: 'P'})}).addTo(map);
* new Marker([47.28, 11.41], {icon: new SvgIcon({color: 'green', glyph: '🚲'})}).addTo(map);
* // a 24×24 SVG path, e.g. from Material Design Icons
* new Marker([47.29, 11.42], {icon: new SvgIcon({color: 'purple', glyphPath: 'M12 2L2 22h20z'})}).addTo(map);
* ```
*/
var SvgIcon = class SvgIcon extends DefaultIcon {
	static defaultOptions = {
		color: "#d4462c",
		glyph: void 0,
		glyphPath: void 0,
		glyphColor: "white"
	};
	/**
	* Creates an `SvgIcon` with the given options.
	* @param {[options?: SvgIconOptions]} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(SvgIcon);
	}
	/**
	* Called internally when the icon has to be shown, returns a `<div>` element with
	* the SVG of the marker, styled according to the options.
	* @param {HTMLElement} [oldIcon] The current element of the icon, to be reused if possible.
	* @returns {HTMLElement}
	*/
	createIcon(oldIcon) {
		const div = oldIcon?.tagName === "DIV" ? oldIcon : document.createElement("div"), options = this.options, svg = svgElement("svg", {
			viewBox: "0 0 500 820",
			width: "100%",
			height: "100%",
			"aria-hidden": "true"
		});
		svgElement("path", {
			d: markerPath,
			transform: markerTransform,
			fill: options.color,
			stroke: `color-mix(in srgb, ${options.color}, black 30%)`,
			"stroke-width": "1.1",
			"stroke-linejoin": "miter"
		}, svg);
		if (options.glyphPath) {
			const scale = glyphSize / 24;
			svgElement("path", {
				d: options.glyphPath,
				fill: options.glyphColor,
				transform: `translate(${glyphX - glyphSize / 2} ${glyphY - glyphSize / 2})scale(${scale})`
			}, svg);
		} else if (options.glyph) svgElement("text", {
			x: glyphX,
			y: glyphY,
			fill: options.glyphColor,
			"font-size": glyphSize,
			"font-family": "sans-serif",
			"font-weight": "bold",
			"text-anchor": "middle",
			"dominant-baseline": "central"
		}, svg).textContent = options.glyph;
		else svgElement("path", {
			d: leafPath,
			transform: leafTransform,
			fill: options.glyphColor
		}, svg);
		div.replaceChildren(svg);
		this._setIconStyles(div, "icon");
		return div;
	}
};
// src/layer/marker/MarkerClusterGroup.js
/** @import {Layer, LayerOptions} from '../Layer.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/**
* A cluster of markers, see `MarkerClusterGroup`.
* @typedef {object} MarkerCluster
* @property {LatLng} latlng The position of the cluster marker: the mean of the
* positions of its markers.
* @property {LatLngBounds} bounds The bounds of its markers.
* @property {Layer[]} markers Its markers.
* @property {number} count The number of its markers.
*/
/**
* The event object of `clusterclick`.
* @typedef {object} ClusterClickEvent
* @property {MarkerCluster} cluster The clicked cluster.
* @property {Marker} layer The marker of the cluster.
* @property {Event} originalEvent The DOM event of the click.
* @extends MaplairEvent
*/
/**
* Options of `MarkerClusterGroup`.
* @typedef {object} MarkerClusterGroupOptions
* @property {number} [maxClusterRadius=80] The maximum distance in pixels between the
* first marker of a cluster and the other ones.
* @property {number} [disableClusteringAtZoom] From this zoom level on, the markers are
* shown without clustering.
* @property {boolean} [zoomToBoundsOnClick=true] Whether a click on a cluster zooms to
* the bounds of its markers.
* @property {boolean} [spiderfyOnMaxZoom=true] Whether a click on a cluster which
* zooming in doesn't split (e.g. markers at the same position, or at the maximum
* zoom) spreads its markers in a circle around it ("spiderfies" them). Until the next
* click on the map, change of the zoom or of the layers, their `getLatLng()` returns
* the spread positions. Clusters can also be activated with the <kbd>Enter</kbd> key.
* @property {(cluster: MarkerCluster) => DivIcon} [iconCreateFunction] Returns the icon
* of a cluster, by default a circle with the count, sized and colored by the
* `maplair-cluster-small`, `-medium` and `-large` CSS classes (for up to 9, 99 and
* more markers).
* @extends LayerOptions
*/
/**
* A layer group clustering its markers: nearby markers are shown as one marker with
* their count, which zooms in to them when clicked. The clusters are computed for
* the zoom level of the map, and only the ones near the view are on the map, so
* that tens of thousands of markers stay fast. Accepts all layers with a single
* position (`getLatLng()`), e.g. markers and circle markers; other layers are shown
* without clustering. Events of the markers (e.g. `click`) propagate to the group.
*
* Replaces the [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
* plugin for the common use cases, with its option names; without animations and
* cluster coverage polygons.
*
* @example
* ```js
* const clusters = new MarkerClusterGroup();
* for (const [lat, lng, name] of places) {
* 	clusters.addLayer(new Marker([lat, lng]).bindPopup(name));
* }
* map.addLayer(clusters);
* ```
*
* @fires MarkerClusterGroup#clusterclick {ClusterClickEvent} Fired when a cluster is
* clicked.
*/
var MarkerClusterGroup = class MarkerClusterGroup extends FeatureGroup {
	static defaultOptions = {
		maxClusterRadius: 80,
		disableClusteringAtZoom: void 0,
		zoomToBoundsOnClick: true,
		spiderfyOnMaxZoom: true,
		iconCreateFunction: void 0
	};
	/**
	* Creates a cluster group with the given layers.
	* @param {Layer[]} [layers]
	* @param {MarkerClusterGroupOptions} [options]
	*/
	constructor(layers, options) {
		super(layers, options);
		this._shown = /* @__PURE__ */ new Set();
		this.callInitHooks(MarkerClusterGroup);
	}
	/**
	* Adds the given layer to the group.
	* @param {Layer} layer
	* @returns {this}
	*/
	addLayer(layer) {
		return this.addLayers([layer]);
	}
	/**
	* Adds the given layers to the group, clustering once instead of for each layer.
	* @param {Layer[]} layers
	* @returns {this}
	*/
	addLayers(layers) {
		for (const layer of layers) if (!this.hasLayer(layer)) {
			layer.addEventParent(this).on("dragend", this._onDragEnd, this);
			this._layers[this.getLayerId(layer)] = layer;
			this.fire("layeradd", { layer });
		}
		return this.refreshClusters();
	}
	/**
	* Removes the given layer from the group.
	* @param {Layer|number} layer The layer or its id.
	* @returns {this}
	*/
	removeLayer(layer) {
		layer = typeof layer === "number" ? this._layers[layer] : layer;
		if (!layer || !this.hasLayer(layer)) return this;
		this._unspiderfy();
		layer.removeEventParent(this).off("dragend", this._onDragEnd, this);
		delete this._layers[this.getLayerId(layer)];
		if (this._shown?.delete(layer)) this._map.removeLayer(layer);
		this.fire("layerremove", { layer });
		return this.refreshClusters();
	}
	/**
	* Removes all layers from the group.
	* @returns {this}
	*/
	clearLayers() {
		this._unspiderfy();
		for (const layer of this.getLayers()) {
			layer.removeEventParent(this).off("dragend", this._onDragEnd, this);
			this.fire("layerremove", { layer });
		}
		this._layers = {};
		return this.refreshClusters();
	}
	/**
	* Computes the clusters again, e.g. after markers of the group were moved with
	* `setLatLng()`. Happens by itself when the zoom changes or layers are added or
	* removed.
	* @returns {this}
	*/
	refreshClusters() {
		this._clusters = null;
		if (this._map) this._update();
		return this;
	}
	onAdd() {
		this._clusters = null;
		this._update();
	}
	onRemove(map) {
		this._unspiderfy();
		for (const layer of this._shown) map.removeLayer(layer);
		this._shown.clear();
	}
	getEvents() {
		return {
			moveend: this._update,
			zoomstart: this._unspiderfy,
			click: this._unspiderfy
		};
	}
	_onDragEnd({ target: marker }) {
		if (marker._clusterLatLng) marker._clusterLatLng = marker.getLatLng();
		this.refreshClusters();
	}
	_update() {
		const map = this._map, zoom = map.getZoom();
		if (!this._clusters || this._clustersZoom !== zoom) {
			this._unspiderfy();
			this._clusters = this._cluster();
			this._clustersZoom = zoom;
		}
		const view = map.getPixelBounds().pad(.5), shown = /* @__PURE__ */ new Set();
		for (const cluster of this._clusters) {
			const { markers, point } = cluster;
			if (markers.length > 1) {
				if (view.contains(point)) {
					cluster.marker ??= this._createClusterMarker(cluster);
					shown.add(cluster.marker);
				}
			} else if (!markers[0].getLatLng || view.contains(point)) shown.add(markers[0]);
		}
		const spiderfied = this._spider?.clusterMarker;
		for (const layer of this._shown) if (!shown.has(layer)) map.removeLayer(layer);
		for (const layer of shown) if (layer !== spiderfied) map.addLayer(layer);
		this._shown = shown;
	}
	_cluster() {
		const map = this._map, zoom = map.getZoom(), radius = this.options.maxClusterRadius, noClustering = zoom >= (this.options.disableClusteringAtZoom ?? Infinity), grid = /* @__PURE__ */ new Map(), clusters = [];
		for (const layer of Object.values(this._layers)) {
			if (!layer.getLatLng) {
				clusters.push({ markers: [layer] });
				continue;
			}
			const point = map.project(layer.getLatLng(), zoom), x = Math.floor(point.x / radius), y = Math.floor(point.y / radius);
			let nearest, minDistance = radius;
			for (let i = x - 1; i <= x + 1; i++) for (let j = y - 1; j <= y + 1; j++) for (const cluster of noClustering ? [] : grid.get(`${i}:${j}`) ?? []) {
				const distance = cluster.point.distanceTo(point);
				if (distance <= minDistance) {
					nearest = cluster;
					minDistance = distance;
				}
			}
			if (nearest) nearest.markers.push(layer);
			else {
				const cluster = {
					point,
					markers: [layer]
				}, key = `${x}:${y}`;
				if (!grid.has(key)) grid.set(key, []);
				grid.get(key).push(cluster);
				clusters.push(cluster);
			}
		}
		for (const cluster of clusters) if (cluster.markers.length > 1) {
			const latlngs = cluster.markers.map((marker) => marker.getLatLng());
			cluster.latlng = new LatLng(latlngs.reduce((sum, latlng) => sum + latlng.lat, 0) / latlngs.length, latlngs.reduce((sum, latlng) => sum + latlng.lng, 0) / latlngs.length);
			cluster.point = map.project(cluster.latlng, zoom);
		}
		return clusters;
	}
	_createClusterMarker({ latlng, markers }) {
		const cluster = {
			latlng,
			bounds: new LatLngBounds(markers.map((marker) => marker.getLatLng())),
			markers,
			count: markers.length
		}, marker = new Marker(latlng, {
			icon: this.options.iconCreateFunction?.(cluster) ?? this._createIcon(cluster),
			title: I18n.translate("{count} markers", { count: cluster.count })
		});
		marker.on("click", (e) => this._onClusterClick(cluster, marker, e));
		return marker;
	}
	_createIcon({ count }) {
		const size = count < 10 ? "small" : count < 100 ? "medium" : "large";
		return new DivIcon({
			html: `<span>${count}</span>`,
			className: `maplair-cluster maplair-cluster-${size}`,
			iconSize: {
				small: 32,
				medium: 38,
				large: 44
			}[size]
		});
	}
	_onClusterClick(cluster, marker, e) {
		this.fire("clusterclick", {
			cluster,
			layer: marker,
			originalEvent: e.originalEvent
		});
		const map = this._map, maxZoom = map.getMaxZoom(), { bounds } = cluster;
		if (map.getZoom() < maxZoom && (this.options.disableClusteringAtZoom <= maxZoom || map.project(bounds.getNorthEast(), maxZoom).distanceTo(map.project(bounds.getSouthWest(), maxZoom)) > this.options.maxClusterRadius)) {
			if (this.options.zoomToBoundsOnClick) map.fitBounds(bounds);
		} else if (this.options.spiderfyOnMaxZoom) this._spiderfy(cluster, marker);
	}
	_spiderfy({ markers }, clusterMarker) {
		this._unspiderfy();
		const map = this._map, center = map.latLngToLayerPoint(clusterMarker.getLatLng()), radius = Math.max(30, markers.length * 30 / (2 * Math.PI)), spider = this._spider = {
			markers,
			clusterMarker,
			legs: []
		};
		map.removeLayer(clusterMarker);
		markers.forEach((marker, i) => {
			const angle = 2 * Math.PI * i / markers.length, latlng = map.layerPointToLatLng(center.add(new Point(Math.cos(angle), Math.sin(angle)).multiplyBy(radius)));
			marker._clusterLatLng = marker.getLatLng();
			marker.setLatLng(latlng);
			const leg = new Polyline([clusterMarker.getLatLng(), latlng], {
				className: "maplair-cluster-leg",
				interactive: false,
				weight: 1.5
			});
			spider.legs.push(leg);
			map.addLayer(leg);
			map.addLayer(marker);
		});
	}
	_unspiderfy() {
		const spider = this._spider;
		if (!spider) return;
		this._spider = null;
		const map = this._map;
		for (const leg of spider.legs) map?.removeLayer(leg);
		for (const marker of spider.markers) {
			map?.removeLayer(marker);
			marker.setLatLng(marker._clusterLatLng);
			delete marker._clusterLatLng;
		}
		if (map && this._shown.has(spider.clusterMarker)) map.addLayer(spider.clusterMarker);
	}
};
// src/layer/tile/GridLayer.js
/** @import {LatLngBoundsExpression} from '../../geo/LatLngBounds.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {MaplairEvent, TileEvent, TileErrorEvent} from '../../core/Events.js' */
/** @import {LayerOptions} from '../Layer.js' */
/**
* Options of `GridLayer`.
* @typedef {object} GridLayerOptions
* @property {number|Point} [tileSize=256] Width and height of tiles in the grid. Use a
* number if width and height are equal, or `Point(width, height)` otherwise.
* @property {number} [opacity=1] Opacity of the tiles. Can be used in the `createTile()`
* function.
* @property {string|null} [placeholder=null] A CSS
* [`background`](https://developer.mozilla.org/docs/Web/CSS/background) shown in place
* of tiles while they are loading, e.g. `'#ddd'` or
* `'url(loading.svg) center no-repeat #eee'`. Tiles with a placeholder appear without
* fading in.
* @property {boolean} [updateWhenIdle=false] Load new tiles only when panning ends.
* @property {boolean} [updateWhenZooming=true] By default, a smooth zoom animation
* (during a [pinch zoom](#map-pinchzoom) or a [`flyTo()`](#map-flyto)) will update grid
* layers every integer zoom level. Setting this option to `false` will update the grid
* layer only when the smooth animation ends.
* @property {number} [updateInterval=200] Tiles will not update more than once every
* `updateInterval` milliseconds when panning.
* @property {number} [zIndex=1] The explicit zIndex of the tile layer.
* @property {LatLngBoundsExpression|null} [bounds=null] If set, tiles will only be
* loaded inside the set `LatLngBounds`.
* @property {number} [minZoom=0] The minimum zoom level down to which this layer will
* be displayed (inclusive).
* @property {number} [maxZoom] The maximum zoom level up to which this layer will be
* displayed (inclusive).
* @property {number} [maxNativeZoom] Maximum zoom number the tile source has available.
* If it is specified, the tiles on all zoom levels higher than `maxNativeZoom` will be
* loaded from `maxNativeZoom` level and auto-scaled.
* @property {number} [minNativeZoom] Minimum zoom number the tile source has available.
* If it is specified, the tiles on all zoom levels lower than `minNativeZoom` will be
* loaded from `minNativeZoom` level and auto-scaled.
* @property {boolean} [noWrap=false] Whether the layer is wrapped around the
* antimeridian. If `true`, the GridLayer will only be displayed once at low zoom
* levels. Has no effect when the [map CRS](#maplairmapoptions-crs) doesn't wrap around.
* Can be used in combination with [`bounds`](#gridlayeroptions-bounds) to prevent
* requesting tiles outside the CRS limits.
* @property {string} [pane='tilePane'] `Map pane` where the grid layer will be added.
* @property {string} [className=''] A custom class name to assign to the tile layer.
* Empty by default.
* @property {boolean} [pixelated=false] Whether to scale the tiles with
* nearest-neighbour interpolation (`image-rendering: pixelated`) instead of smoothing
* them, so that their pixels stay crisp, e.g. while zooming or beyond `maxNativeZoom`.
* Useful for raster data, pixel art or scientific imagery.
* @property {number} [keepBuffer=2] When panning the map, keep this many rows and
* columns of tiles before unloading them.
* @extends LayerOptions
*/
/**
* The callback of asynchronous `createTile()`, to be called with an error (or `null`)
* and the tile when the tile has finished loading and drawing.
* @typedef {(error: any, tile: HTMLElement) => void} TileDoneCallback
*/
/**
* Generic class for handling a tiled grid of HTML elements. This is the base class for
* all tile layers and replaces `TileLayer.Canvas`. GridLayer can be extended to create
* a tiled grid of HTML elements like `<canvas>`, `<img>` or `<div>`. GridLayer will
* handle creating and animating these DOM elements for you.
*
* Layers extending `GridLayer` shall reimplement the [`createTile()`](#gridlayer-createtile)
* method.
*
* @example
* ### Synchronous usage
*
* To create a custom layer, extend GridLayer and implement the `createTile()` method,
* which will be passed a `Point` object with the `x`, `y`, and `z` (zoom level)
* coordinates to draw your tile.
*
* ```js
* class CanvasLayer extends GridLayer {
*     createTile(coords) {
*         // create a <canvas> element for drawing
*         const tile = DomUtil.create('canvas', 'maplair-tile');
*
*         // setup tile width and height according to the options
*         const size = this.getTileSize();
*         tile.width = size.x;
*         tile.height = size.y;
*
*         // get a canvas context and draw something on it using coords.x, coords.y and coords.z
*         const ctx = tile.getContext('2d');
*
*         // return the tile so it can be rendered on screen
*         return tile;
*     }
* }
* ```
*
* @example
* ### Asynchronous usage
*
* Tile creation can also be asynchronous, this is useful when using a third-party
* drawing library. Once the tile is finished drawing it can be passed to the `done()`
* callback.
*
* ```js
* class CanvasLayer extends GridLayer {
*     createTile(coords, done) {
*         const error;
*
*         // create a <canvas> element for drawing
*         const tile = DomUtil.create('canvas', 'maplair-tile');
*
*         // setup tile width and height according to the options
*         const size = this.getTileSize();
*         tile.width = size.x;
*         tile.height = size.y;
*
*         // draw something asynchronously and pass the tile to the done() callback
*         setTimeout(function() {
*             done(error, tile);
*         }, 1000);
*
*         return tile;
*     }
* }
* ```
*
* @fires loading {MaplairEvent} Fired when the grid layer starts loading tiles.
* @fires tileunload {TileEvent} Fired when a tile is removed (e.g. when a tile goes off
* the screen).
* @fires tileloadstart {TileEvent} Fired when a tile is requested and starts loading.
* @fires tileerror {TileErrorEvent} Fired when there is an error loading a tile.
* @fires tileload {TileEvent} Fired when a tile loads.
* @fires load {MaplairEvent} Fired when the grid layer loaded all visible tiles.
*/
var GridLayer = class GridLayer extends Layer {
	static defaultOptions = {
		tileSize: 256,
		opacity: 1,
		placeholder: null,
		updateWhenIdle: false,
		updateWhenZooming: true,
		updateInterval: 200,
		zIndex: 1,
		bounds: null,
		minZoom: 0,
		maxZoom: void 0,
		maxNativeZoom: void 0,
		minNativeZoom: void 0,
		noWrap: false,
		pane: "tilePane",
		className: "",
		pixelated: false,
		keepBuffer: 2
	};
	/**
	* Creates a new instance of GridLayer with the supplied options.
	* @param {GridLayerOptions} [options]
	*/
	constructor(options) {
		super();
		setOptions(this, options);
		this.callInitHooks(GridLayer);
	}
	/**
	* Creates the container of the tiles and loads the tiles.
	* @overload
	* @param {MaplairMap} map
	* @returns {void}
	*/
	onAdd() {
		this._initContainer();
		this._levels = {};
		this._tiles = {};
		this._resetView();
	}
	/**
	* Registers the zoom limits of the layer on the map.
	* @param {MaplairMap} map
	*/
	beforeAdd(map) {
		map._addZoomLimit(this);
	}
	/**
	* Removes the tiles from the map.
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		this._removeKeptLevel();
		this._removeAllTiles();
		this._container.remove();
		map._removeZoomLimit(this);
		this._container = null;
		this._tileZoom = void 0;
		clearTimeout(this._pruneTimeout);
		cancelAnimationFrame(this._fadePruneFrame);
		this._fadePruneFrame = 0;
	}
	/**
	* Brings the tile layer to the top of all tile layers.
	* @returns {this}
	*/
	bringToFront() {
		if (this._map) {
			toFront(this._container);
			this._setAutoZIndex(Math.max);
		}
		return this;
	}
	/**
	* Brings the tile layer to the bottom of all tile layers.
	* @returns {this}
	*/
	bringToBack() {
		if (this._map) {
			toBack(this._container);
			this._setAutoZIndex(Math.min);
		}
		return this;
	}
	/**
	* Returns the HTML element that contains the tiles for this layer.
	* @returns {HTMLElement}
	*/
	getContainer() {
		return this._container;
	}
	/**
	* Changes the [opacity](#gridlayeroptions-opacity) of the grid layer.
	* @param {number} opacity
	* @returns {this}
	*/
	setOpacity(opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	}
	/**
	* Changes the [zIndex](#gridlayeroptions-zindex) of the grid layer.
	* @param {number} zIndex
	* @returns {this}
	*/
	setZIndex(zIndex) {
		this.options.zIndex = zIndex;
		this._updateZIndex();
		return this;
	}
	/**
	* Returns `true` if any tile in the grid layer has not finished loading.
	* @returns {boolean}
	*/
	isLoading() {
		return this._loading;
	}
	/**
	* Causes the layer to clear all the tiles and request them again.
	* @returns {this}
	*/
	redraw() {
		if (this._map) {
			this._removeAllTiles();
			const tileZoom = this._clampZoom(Math.round(this._map.getZoom()));
			if (tileZoom !== this._tileZoom) {
				this._tileZoom = tileZoom;
				this._updateLevels();
			}
			this._update();
		}
		return this;
	}
	/**
	* Returns the map events the layer listens to, see `Layer`.
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		const events = {
			viewprereset: this._invalidateAll,
			viewreset: this._resetView,
			zoom: this._resetView,
			moveend: this._onMoveEnd,
			worldcopyjump: this._onWorldCopyJump,
			zoomanim: this._animateZoom
		};
		if (!this.options.updateWhenIdle) {
			if (!this._onMove) this._onMove = throttle(this._onMoveEnd, this.options.updateInterval, this);
			events.move = this._onMove;
		}
		return events;
	}
	/**
	* Called only internally, must be overridden by classes extending `GridLayer`.
	* Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
	* is specified, it must be called when the tile has finished loading and drawing.
	* @group Extension methods
	* @overload
	* @param {Point} coords The `x`, `y` and `z` (zoom level) coordinates of the tile.
	* @param {TileDoneCallback} [done]
	* @returns {HTMLElement}
	*/
	createTile() {
		return document.createElement("div");
	}
	/**
	* Normalizes the [tileSize option](#gridlayeroptions-tilesize) into a point. Used by
	* the `createTile()` method.
	* @returns {Point}
	*/
	getTileSize() {
		const s = this.options.tileSize;
		return s instanceof Point ? s : new Point(s, s);
	}
	_updateZIndex() {
		if (this._container && this.options.zIndex !== void 0 && this.options.zIndex !== null) this._container.style.zIndex = `${this.options.zIndex}`;
	}
	_setAutoZIndex(compare) {
		const layers = this.getPane().children;
		let edgeZIndex = -compare(-Infinity, Infinity);
		for (const layer of layers) {
			const zIndex = layer.style.zIndex;
			if (layer !== this._container && zIndex) edgeZIndex = compare(edgeZIndex, +zIndex);
		}
		if (isFinite(edgeZIndex)) {
			this.options.zIndex = edgeZIndex + compare(-1, 1);
			this._updateZIndex();
		}
	}
	_updateOpacity() {
		if (!this._map) return;
		this._container.style.opacity = `${this.options.opacity}`;
	}
	_onOpaqueTile() {}
	_initContainer() {
		if (this._container) return;
		this._container = create("div", `maplair-layer ${this.options.className ?? ""}`);
		this._container.classList.toggle("maplair-pixelated", !!this.options.pixelated);
		this._updateZIndex();
		if (this.options.opacity < 1) this._updateOpacity();
		this.getPane().appendChild(this._container);
	}
	_keepCurrentTiles() {
		const zoom = this._tileZoom, level = this._levels?.[zoom];
		if (!this._map || !level || this._keptLevel) return;
		const tiles = [];
		for (const [key, tile] of Object.entries(this._tiles)) if (tile.coords.z === zoom && tile.loaded) {
			tiles.push(tile);
			delete this._tiles[key];
		}
		delete this._levels[zoom];
		level.el.style.zIndex = -1;
		this._keptLevel = {
			level,
			tiles
		};
		this._updateLevels();
		this.on("load", this._onLoadKeptLevel, this);
		this._map.on("zoomstart viewprereset", this._removeKeptLevel, this);
	}
	_onLoadKeptLevel() {
		if (this._map._fadeAnimated) {
			clearTimeout(this._keptLevelTimeout);
			this._keptLevelTimeout = setTimeout(this._removeKeptLevel.bind(this), 250);
		} else this._removeKeptLevel();
	}
	_removeKeptLevel() {
		if (!this._keptLevel) return;
		const { level, tiles } = this._keptLevel;
		this._keptLevel = null;
		clearTimeout(this._keptLevelTimeout);
		this.off("load", this._onLoadKeptLevel, this);
		this._map.off("zoomstart viewprereset", this._removeKeptLevel, this);
		level.el.remove();
		for (const tile of tiles) this.fire("tileunload", {
			tile: tile.el,
			coords: tile.coords
		});
	}
	_updateLevels() {
		const zoom = this._tileZoom, maxZoom = this.options.maxZoom;
		if (zoom === void 0) return;
		for (let z of Object.keys(this._levels)) {
			z = Number(z);
			if (this._levels[z].el.children.length || z === zoom) {
				this._levels[z].el.style.zIndex = `${maxZoom - Math.abs(zoom - z)}`;
				this._onUpdateLevel(z);
			} else {
				this._levels[z].el.remove();
				this._removeTilesAtZoom(z);
				this._onRemoveLevel(z);
				delete this._levels[z];
			}
		}
		let level = this._levels[zoom];
		const map = this._map;
		if (!level) {
			level = this._levels[zoom] = {};
			level.el = create("div", "maplair-tile-container maplair-zoom-animated", this._container);
			level.el.style.zIndex = `${maxZoom}`;
			level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
			level.zoom = zoom;
			this._setZoomTransform(level, map.getCenter(), map.getZoom());
			level.el.offsetWidth;
			this._onCreateLevel(level);
		}
		this._level = level;
		return level;
	}
	_onUpdateLevel() {}
	_onRemoveLevel() {}
	_onCreateLevel() {}
	_pruneTiles() {
		if (!this._map) return;
		const zoom = this._map.getZoom();
		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			this._removeAllTiles();
			return;
		}
		for (const tile of Object.values(this._tiles)) tile.retain = tile.current;
		for (const tile of Object.values(this._tiles)) if (tile.current && !tile.active) {
			const coords = tile.coords;
			if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
		}
		for (const [key, tile] of Object.entries(this._tiles)) if (!tile.retain) this._removeTile(key);
	}
	_removeTilesAtZoom(zoom) {
		for (const [key, tile] of Object.entries(this._tiles)) if (tile.coords.z === zoom) this._removeTile(key);
	}
	_removeAllTiles() {
		for (const key of Object.keys(this._tiles)) this._removeTile(key);
	}
	_invalidateAll(e) {
		const map = this._map;
		if (e?.zoom !== void 0 && e.zoom !== map.getZoom() && map.getBounds().contains(e.center)) return;
		for (const z of Object.keys(this._levels)) {
			this._levels[z].el.remove();
			this._onRemoveLevel(Number(z));
			delete this._levels[z];
		}
		this._removeAllTiles();
		this._tileZoom = void 0;
	}
	_retainParent(x, y, z, minZoom) {
		for (z--; z >= minZoom; z--) {
			x = Math.floor(x / 2);
			y = Math.floor(y / 2);
			if (this._retain(x, y, z)) return true;
		}
		return false;
	}
	_retainChildren(x, y, z, maxZoom) {
		for (let i = 2 * x; i < 2 * x + 2; i++) for (let j = 2 * y; j < 2 * y + 2; j++) if (!this._retain(i, j, z + 1) && z + 1 < maxZoom) this._retainChildren(i, j, z + 1, maxZoom);
	}
	_retain(x, y, z) {
		const tile = this._tiles[this._tileCoordsToKey({
			x,
			y,
			z
		})];
		if (tile?.loaded) tile.retain = true;
		return tile?.active;
	}
	_resetView(e) {
		const animating = e && (e.pinch || e.flyTo || e.continuous);
		this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
	}
	_animateZoom(e) {
		this._setView(e.center, e.zoom, true, e.noUpdate);
	}
	_clampZoom(zoom) {
		const options = this.options;
		if (void 0 !== options.minNativeZoom && zoom < options.minNativeZoom) return options.minNativeZoom;
		if (void 0 !== options.maxNativeZoom && options.maxNativeZoom < zoom) return options.maxNativeZoom;
		return zoom;
	}
	_setView(center, zoom, noPrune, noUpdate) {
		let tileZoom = Math.round(zoom);
		if (this.options.maxZoom !== void 0 && tileZoom > this.options.maxZoom || this.options.minZoom !== void 0 && tileZoom < this.options.minZoom) tileZoom = void 0;
		else tileZoom = this._clampZoom(tileZoom);
		const tileZoomChanged = this.options.updateWhenZooming && tileZoom !== this._tileZoom;
		if (!noUpdate || tileZoomChanged) {
			this._tileZoom = tileZoom;
			if (this._abortLoading) this._abortLoading();
			this._updateLevels();
			this._resetGrid();
			if (tileZoom !== void 0) this._update(center);
			if (!noPrune) this._pruneTiles();
			this._noPrune = !!noPrune;
		}
		this._setZoomTransforms(center, zoom);
	}
	_setZoomTransforms(center, zoom) {
		for (const level of Object.values(this._levels)) this._setZoomTransform(level, center, zoom);
	}
	_setZoomTransform(level, center, zoom) {
		const scale = this._map.getZoomScale(zoom, level.zoom), translate = level.origin.multiplyBy(scale).subtract(this._map._getNewPixelOrigin(center, zoom)).round();
		setTransform(level.el, translate, scale);
	}
	_resetGrid() {
		const map = this._map, crs = map.options.crs, tileSize = this._tileSize = this.getTileSize(), tileZoom = this._tileZoom;
		const bounds = this._map.getPixelWorldBounds(this._tileZoom);
		if (bounds) this._globalTileRange = this._pxBoundsToTileRange(bounds);
		this._wrapX = crs.wrapLng && !this.options.noWrap && [Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x), Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.x)];
		this._wrapY = crs.wrapLat && !this.options.noWrap && [Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.y), Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)];
	}
	_onMoveEnd() {
		if (!this._map || this._map._animatingZoom) return;
		this._update();
	}
	_onWorldCopyJump({ worlds }) {
		if (!this._wrapX) return;
		const tileSize = this.getTileSize(), tiles = {};
		for (const tile of Object.values(this._tiles)) {
			const { coords, el } = tile, dx = worlds * this._map.getPixelWorldBounds(coords.z).getSize().x;
			if (dx % tileSize.x === 0) {
				coords.x -= dx / tileSize.x;
				setPosition(el, getPosition(el).subtract([dx, 0]), true);
			}
			tiles[this._tileCoordsToKey(coords)] = tile;
		}
		this._tiles = tiles;
	}
	_getTiledPixelBounds(center) {
		const map = this._map, mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(), scale = map.getZoomScale(mapZoom, this._tileZoom), pixelCenter = map.project(center, this._tileZoom).floor(), halfSize = map.getSize().divideBy(scale * 2);
		return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
	}
	_update(center) {
		const map = this._map;
		if (!map) return;
		const zoom = this._clampZoom(map.getZoom());
		if (center === void 0) center = map.getCenter();
		if (this._tileZoom === void 0) return;
		const pixelBounds = this._getTiledPixelBounds(center), tileRange = this._pxBoundsToTileRange(pixelBounds), tileCenter = tileRange.getCenter(), queue = [], margin = this.options.keepBuffer, noPruneRange = new Bounds(tileRange.getBottomLeft().subtract([margin, -margin]), tileRange.getTopRight().add([margin, -margin]));
		if (!(isFinite(tileRange.min.x) && isFinite(tileRange.min.y) && isFinite(tileRange.max.x) && isFinite(tileRange.max.y))) throw new Error("Attempted to load an infinite number of tiles");
		for (const tile of Object.values(this._tiles)) {
			const c = tile.coords;
			if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) tile.current = false;
		}
		if (Math.abs(zoom - this._tileZoom) > 1) {
			this._setView(center, zoom);
			return;
		}
		for (let j = tileRange.min.y; j <= tileRange.max.y; j++) for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
			const coords = new Point(i, j);
			coords.z = this._tileZoom;
			if (!this._isValidTile(coords)) continue;
			const tile = this._tiles[this._tileCoordsToKey(coords)];
			if (tile) tile.current = true;
			else queue.push(coords);
		}
		queue.sort((a, b) => a.distanceTo(tileCenter) - b.distanceTo(tileCenter));
		if (queue.length !== 0) {
			if (!this._loading) {
				this._loading = true;
				this.fire("loading");
				this._map._onLayerLoading();
			}
			const fragment = document.createDocumentFragment();
			for (const q of queue) this._addTile(q, fragment);
			this._level.el.appendChild(fragment);
		}
	}
	_isValidTile(coords) {
		const crs = this._map.options.crs;
		if (!crs.infinite) {
			const bounds = this._globalTileRange;
			if (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x) || !crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y)) return false;
		}
		if (!this.options.bounds) return true;
		const tileBounds = this._tileCoordsToBounds(coords);
		return LatLngBounds.from(this.options.bounds).overlaps(tileBounds);
	}
	_tileCoordsToNwSe(coords) {
		const map = this._map, tileSize = this.getTileSize(), nwPoint = coords.scaleBy(tileSize), sePoint = nwPoint.add(tileSize);
		return [map.unproject(nwPoint, coords.z), map.unproject(sePoint, coords.z)];
	}
	_tileCoordsToBounds(coords) {
		const bp = this._tileCoordsToNwSe(coords);
		let bounds = new LatLngBounds(bp[0], bp[1]);
		if (!this.options.noWrap) bounds = this._map.wrapLatLngBounds(bounds);
		return bounds;
	}
	_tileCoordsToKey(coords) {
		return `${coords.x}:${coords.y}:${coords.z}`;
	}
	_removeTile(key) {
		const tile = this._tiles[key];
		if (!tile) return;
		tile.el.remove();
		delete this._tiles[key];
		this.fire("tileunload", {
			tile: tile.el,
			coords: tile.coords
		});
	}
	_initTile(tile) {
		tile.classList.add("maplair-tile");
		const tileSize = this.getTileSize();
		tile.style.width = `${tileSize.x}px`;
		tile.style.height = `${tileSize.y}px`;
		if (this.options.placeholder) tile.style.background = this.options.placeholder;
	}
	_addTile(coords, container) {
		const tilePos = this._getTilePos(coords), key = this._tileCoordsToKey(coords);
		const tile = this.createTile(this._wrapCoords(coords), this._tileReady.bind(this, coords));
		this._initTile(tile);
		if (this.createTile.length < 2) requestAnimationFrame(this._tileReady.bind(this, coords, null, tile));
		setPosition(tile, tilePos, true);
		this._tiles[key] = {
			el: tile,
			coords,
			current: true
		};
		container.appendChild(tile);
		this.fire("tileloadstart", {
			tile,
			coords
		});
	}
	_tileReady(coords, err, tile) {
		if (err) this.fire("tileerror", {
			error: err,
			tile,
			coords
		});
		const key = this._tileCoordsToKey(coords);
		tile = this._tiles[key];
		if (!tile) return;
		if (this.options.placeholder) tile.el.style.background = "";
		if (!this._map._fadeAnimated || this.options.placeholder) {
			tile.active = true;
			this._pruneTiles();
		} else if (!tile.loaded) {
			tile.el.classList.add("maplair-tile-fading");
			tile.el.animate({ opacity: [0, 1] }, 200).onfinish = this._onTileFaded.bind(this, tile);
		}
		tile.loaded = true;
		if (!err) {
			tile.el.classList.add("maplair-tile-loaded");
			this.fire("tileload", {
				tile: tile.el,
				coords
			});
		}
		if (this._map && this._noTilesToLoad()) {
			this._loading = false;
			this.fire("load");
			if (!this._map) return;
			this._map._scheduleIdleCheck();
			if (!this._map._fadeAnimated) requestAnimationFrame(this._pruneTiles.bind(this));
			else this._pruneTimeout = setTimeout(this._pruneTiles.bind(this), 250);
		}
	}
	_onTileFaded(tile) {
		tile.el.classList.remove("maplair-tile-fading");
		if (this._tiles[this._tileCoordsToKey(tile.coords)] !== tile) return;
		tile.active = true;
		this._onOpaqueTile(tile);
		if (this._noPrune || this._fadePruneFrame) return;
		this._fadePruneFrame = requestAnimationFrame(() => {
			this._fadePruneFrame = 0;
			if (!this._noPrune) this._pruneTiles();
		});
	}
	_getTilePos(coords) {
		return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
	}
	_wrapCoords(coords) {
		const newCoords = new Point(this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x, this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y);
		newCoords.z = coords.z;
		return newCoords;
	}
	_pxBoundsToTileRange(bounds) {
		const tileSize = this.getTileSize();
		return new Bounds(bounds.min.unscaleBy(tileSize).floor(), bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
	}
	_noTilesToLoad() {
		return Object.values(this._tiles).every((t) => t.loaded);
	}
};
// src/layer/tile/TileLayer.js
/** @import {Point} from '../../geometry/Point.js' */
/** @import {GridLayerOptions, TileDoneCallback} from './GridLayer.js' */
/** @import {TileEvent} from '../../core/Events.js' */
const osmHosts = ["tile.openstreetmap.org", "tile.osm.org"];
const hostRe = /^(https?:)?\/\/([^/?#:]*)/i;
const httpRe = /^http:/i;
function isOSMUrl(url) {
	const host = hostRe.exec(url)?.[2] ?? "";
	return osmHosts.some((osmHost) => host === osmHost || host.endsWith(`.${osmHost}`));
}
const upgradeOSMUrl = (url) => isOSMUrl(url) ? url.replace(httpRe, "https:") : url;
/**
* Options of `TileLayer`.
* @typedef {object} TileLayerOptions
* @property {number} [minZoom=0] The minimum zoom level down to which this layer will be
* displayed (inclusive).
* @property {number} [maxZoom=18] The maximum zoom level up to which this layer will be
* displayed (inclusive).
* @property {string|string[]} [subdomains='abc'] Subdomains of the tile service. Can be
* passed in the form of one string (where each letter is a subdomain name) or an array
* of strings.
* @property {string} [errorTileUrl=''] URL to the tile image to show in place of the
* tile that failed to load.
* @property {number} [zoomOffset=0] The zoom number used in tile URLs will be offset
* with this value.
* @property {boolean} [tms=false] If `true`, inverses Y axis numbering for tiles (turn
* this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
* @property {boolean} [zoomReverse=false] If set to true, the zoom number used in tile
* URLs will be reversed (`maxZoom - zoom` instead of `zoom`).
* @property {boolean} [detectRetina=false] If `true` and user is on a retina display, it
* will request four tiles of half the specified size and a bigger zoom level in place
* of one to utilize the high resolution.
* @property {boolean|string} [crossOrigin=false] Whether the crossOrigin attribute will
* be added to the tiles. If a String is provided, all tiles will have their crossOrigin
* attribute set to the String provided. This is needed if you want to access tile pixel
* data. Refer to
* [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
* for valid String values.
* @property {ReferrerPolicy} [referrerPolicy='strict-origin-when-cross-origin'] Sets the
* tiles' `referrerPolicy` attribute set to the String provided. See
* [`HTMLImageElement.referrerPolicy`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy)
* for possible values.
*
* Tile providers might require you to use a specific referrer policy (e.g. to verify
* API tokens or prevent abuse). Specifically, if you are using tiles from
* `tile.openstreetmap.org` or `tile.osm.org`, you
* [should not change this value](https://operations.osmfoundation.org/policies/tiles/).
* @property {RequestInit|null} [fetchOptions=null] If set, the tiles are loaded with
* [`fetch()`](https://developer.mozilla.org/docs/Web/API/Window/fetch) using these
* options (see [`RequestInit`](https://developer.mozilla.org/docs/Web/API/RequestInit)),
* e.g. `{headers: {Authorization: 'Bearer …'}}` for tile servers requiring custom HTTP
* headers. Requests of tiles that are no longer needed (e.g. after panning or zooming
* away) are aborted. Cross-origin tile servers have to allow such requests with
* [CORS](https://developer.mozilla.org/docs/Web/HTTP/CORS) headers.
* @extends GridLayerOptions
*/
/**
* Used to load and display tile layers on the map. Note that most tile servers require
* attribution, which you can set under `Layer`. Extends `GridLayer`.
*
* ### URL template
*
* A string of the following form:
*
* ```
* 'https://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
* ```
*
* `{s}` means one of the available subdomains (used sequentially to help with browser
* parallel requests per domain limitation; subdomain values are specified in options;
* `a`, `b` or `c` by default, can be omitted), `{z}` — zoom level, `{x}` and `{y}` —
* tile coordinates. `{r}` can be used to add "@2x" to the URL to load retina tiles.
*
* You can use custom keys in the template, which will be [evaluated](#util-template)
* from TileLayer options, like this:
*
* ```
* new TileLayer('https://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});
* ```
*
* Layers extending `TileLayer` might reimplement the [`getTileUrl()`](#tilelayer-gettileurl)
* method.
*
* @example
* ```js
* new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
* ```
*
* @fires tileabort {TileEvent} Fired when a tile was loading but is now not wanted.
*/
var TileLayer = class TileLayer extends GridLayer {
	static defaultOptions = {
		minZoom: 0,
		maxZoom: 18,
		subdomains: "abc",
		errorTileUrl: "",
		zoomOffset: 0,
		tms: false,
		zoomReverse: false,
		detectRetina: false,
		crossOrigin: false,
		referrerPolicy: "strict-origin-when-cross-origin",
		fetchOptions: null
	};
	/**
	* Instantiates a tile layer object given a [URL template](#tilelayer) and optionally an
	* options object.
	* @param {string} url The URL template.
	* @param {TileLayerOptions & Record<string, unknown>} [options] The options, and the values
	* of custom keys of the URL template.
	*/
	constructor(url, options) {
		super(options);
		options = setOptions(this, options);
		if (isOSMUrl(url) && options.attribution === null) options.attribution = `&copy; <a href="https://www.openstreetmap.org/copyright">${I18n.translate("OpenStreetMap contributors")}</a>`;
		this._url = upgradeOSMUrl(url);
		const { tileSize, zoomOffset, minZoom, maxZoom, minNativeZoom, maxNativeZoom } = this.options;
		this._nonRetinaOptions = {
			tileSize,
			zoomOffset,
			minZoom,
			maxZoom,
			minNativeZoom,
			maxNativeZoom
		};
		this._applyRetina();
		if (typeof this.options.subdomains === "string") this.options.subdomains = this.options.subdomains.split("");
		this.callInitHooks(TileLayer);
	}
	_applyRetina() {
		Object.assign(this.options, this._nonRetinaOptions);
		this._retina = window.devicePixelRatio > 1;
		if (this.options.detectRetina && this._retina && this.options.maxZoom > 0) {
			this.options.tileSize = Math.floor(this.options.tileSize / 2);
			if (!this.options.zoomReverse) {
				this.options.zoomOffset++;
				this.options.maxZoom = Math.max(this.options.minZoom, this.options.maxZoom - 1);
				if (this.options.maxNativeZoom !== void 0) this.options.maxNativeZoom = Math.max(0, this.options.maxNativeZoom - 1);
				if (this.options.minNativeZoom !== void 0) this.options.minNativeZoom = Math.max(0, this.options.minNativeZoom - 1);
			} else {
				this.options.zoomOffset--;
				this.options.minZoom = Math.min(this.options.maxZoom, this.options.minZoom + 1);
			}
			this.options.minZoom = Math.max(0, this.options.minZoom);
		} else if (!this.options.zoomReverse) this.options.maxZoom = Math.max(this.options.minZoom, this.options.maxZoom);
		else this.options.minZoom = Math.min(this.options.maxZoom, this.options.minZoom);
	}
	/**
	* Returns the map events the layer listens to, see `Layer`.
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		const events = super.getEvents();
		events.pixelratiochange = this._onPixelRatioChange;
		return events;
	}
	_onPixelRatioChange() {
		if (window.devicePixelRatio > 1 === this._retina) return;
		const map = this._map;
		this._applyRetina();
		if (this.options.detectRetina) {
			map._removeZoomLimit(this);
			map._addZoomLimit(this);
			this._invalidateAll();
			this._resetView();
		} else if (this._url.includes("{r}")) this.redraw();
	}
	/**
	* Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
	* If the URL does not change, the layer will not be redrawn unless
	* the noRedraw parameter is set to false.
	* The current tiles stay visible until the new tiles have loaded, to avoid flickering.
	* @param {string} url
	* @param {boolean} [noRedraw]
	* @returns {this}
	*/
	setUrl(url, noRedraw) {
		url = upgradeOSMUrl(url);
		if (this._url === url && noRedraw === void 0) noRedraw = true;
		this._url = url;
		if (!noRedraw) {
			this._keepCurrentTiles();
			this.redraw();
		}
		return this;
	}
	/**
	* Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
	* to return an `<img>` HTML element with the appropriate image URL given `coords`. The
	* `done` callback is called when the tile has been loaded.
	* @param {Point} coords
	* @param {TileDoneCallback} [done]
	* @returns {HTMLImageElement}
	*/
	createTile(coords, done) {
		const tile = document.createElement("img");
		on(tile, "load", this._tileOnLoad.bind(this, done, tile));
		on(tile, "error", this._tileOnError.bind(this, done, tile));
		if (this.options.crossOrigin || this.options.crossOrigin === "") tile.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
		if (typeof this.options.referrerPolicy === "string") tile.referrerPolicy = this.options.referrerPolicy;
		tile.alt = "";
		const url = this.getTileUrl(coords);
		if (this.options.fetchOptions) this._fetchTile(tile, url, done);
		else tile.src = url;
		return tile;
	}
	_fetchTile(tile, url, done) {
		const controller = new AbortController(), options = {
			signal: controller.signal,
			...this.options.fetchOptions
		};
		if (typeof this.options.referrerPolicy === "string") options.referrerPolicy ??= this.options.referrerPolicy;
		this._tileFetches ??= /* @__PURE__ */ new Map();
		this._tileFetches.set(tile, controller);
		fetch(url, options).then((response) => {
			if (!response.ok) throw new Error(`Failed to load the tile ${url}: HTTP ${response.status}`);
			return response.blob();
		}).then((blob) => {
			tile.src = URL.createObjectURL(blob);
		}).catch((error) => {
			if (!controller.signal.aborted) this._tileOnError(done, tile, error);
		}).finally(() => this._tileFetches.delete(tile));
	}
	_abortTileFetch(tile) {
		const controller = this._tileFetches?.get(tile);
		if (!controller) return false;
		controller.abort();
		this._tileFetches.delete(tile);
		return true;
	}
	/**
	* Called only internally, returns the URL for a tile given its coordinates.
	* Classes extending `TileLayer` can override this function to provide custom tile URL
	* naming schemes.
	* @group Extension methods
	* @param {Point} coords
	* @returns {string}
	*/
	getTileUrl(coords) {
		const data = Object.create(this.options);
		Object.assign(data, {
			r: window.devicePixelRatio > 1 ? "@2x" : "",
			s: this._getSubdomain(coords),
			x: coords.x,
			y: coords.y,
			z: this._getZoomForUrl()
		});
		if (this._map && !this._map.options.crs.infinite) {
			const invertedY = this._globalTileRange.max.y - coords.y;
			if (this.options.tms) data["y"] = invertedY;
			data["-y"] = invertedY;
		}
		return template(this._url, data);
	}
	_tileOnLoad(done, tile) {
		if (tile.src.startsWith("blob:")) URL.revokeObjectURL(tile.src);
		done(null, tile);
	}
	_tileOnError(done, tile, e) {
		const errorUrl = this.options.errorTileUrl, src = tile.getAttribute("src");
		if (errorUrl && src !== errorUrl && (src || tile.isConnected)) tile.src = errorUrl;
		done(e, tile);
	}
	_getZoomForUrl() {
		let zoom = this._tileZoom;
		const maxZoom = this.options.maxZoom, zoomReverse = this.options.zoomReverse, zoomOffset = this.options.zoomOffset;
		if (zoomReverse) zoom = maxZoom - zoom;
		return zoom + zoomOffset;
	}
	_getSubdomain(tilePoint) {
		const { subdomains } = this.options;
		return subdomains?.[Math.abs(tilePoint.x + tilePoint.y) % subdomains.length];
	}
	_abortLoading() {
		let i, tile;
		for (i of Object.keys(this._tiles)) if (this._tiles[i].coords.z !== this._tileZoom) {
			tile = this._tiles[i].el;
			if (this._abortTileFetch(tile) || !tile.complete) {
				tile.setAttribute("src", "");
				const coords = this._tiles[i].coords;
				tile.remove();
				delete this._tiles[i];
				this.fire("tileabort", {
					tile,
					coords
				});
			}
		}
	}
	_removeTile(key) {
		const tile = this._tiles[key];
		if (!tile) return;
		this._abortTileFetch(tile.el);
		tile.el.setAttribute("src", "");
		return super._removeTile(key);
	}
	_tileReady(coords, err, tile) {
		if (!this._map || tile && tile.getAttribute("src") === "") return;
		return super._tileReady(coords, err, tile);
	}
	_clampZoom(zoom) {
		return Math.round(super._clampZoom(zoom));
	}
};
// src/layer/tile/WMSTileLayer.js
/** @import {CRS} from '../../geo/crs/CRS.js' */
/** @import {Point} from '../../geometry/Point.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {TileLayerOptions} from './TileLayer.js' */
/**
* Options of `WMSTileLayer`. If any custom options not documented here are used, they
* will be sent to the WMS server as extra parameters in each request URL. This can be
* useful for
* [non-standard vendor WMS parameters](https://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
* @typedef {object} WMSTileLayerOptions
* @property {string} [layers=''] **(required)** Comma-separated list of WMS layers to
* show.
* @property {string} [styles=''] Comma-separated list of WMS styles.
* @property {string} [format='image/jpeg'] WMS image format (use `'image/png'` for
* layers with transparency).
* @property {boolean} [transparent=false] If `true`, the WMS service will return images
* with transparency.
* @property {string} [version='1.1.1'] Version of the WMS service to use.
* @property {CRS|null} [crs=null] Coordinate Reference System to use for the WMS
* requests, defaults to map CRS. Don't change this if you're not sure what it means.
* @property {boolean} [uppercase=false] If `true`, WMS request parameter keys will be
* uppercase.
* @extends TileLayerOptions
*/
/**
* Used to display [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services as tile
* layers on the map. Extends `TileLayer`.
*
* @example
* ```js
* const nexrad = new WMSTileLayer("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
* 	layers: 'nexrad-n0r-900913',
* 	format: 'image/png',
* 	transparent: true,
* 	attribution: "Weather data © 2012 IEM Nexrad"
* });
* ```
*/
var WMSTileLayer = class WMSTileLayer extends TileLayer {
	/**
	* The default WMS parameters, which the options override, see `WMSTileLayerOptions`.
	* @type {Record<string, any>}
	*/
	static defaultWmsParams = {
		service: "WMS",
		request: "GetMap",
		layers: "",
		styles: "",
		format: "image/jpeg",
		transparent: false,
		version: "1.1.1"
	};
	static defaultOptions = {
		crs: null,
		uppercase: false
	};
	/**
	* Instantiates a WMS tile layer object given a base URL of the WMS service and a WMS
	* parameters/options object.
	* @param {string} url The base URL of the WMS service.
	* @param {WMSTileLayerOptions & Record<string, unknown>} options The options and WMS
	* parameters.
	*/
	constructor(url, options) {
		super(url, options);
		const wmsParams = { ...WMSTileLayer.defaultWmsParams };
		for (const [key, value] of Object.entries(options)) if (!(key in WMSTileLayer.defaultOptions)) wmsParams[key] = value;
		/**
		* The parameters of the WMS requests, see `setParams()`.
		* @type {Record<string, any>}
		*/
		this.wmsParams = wmsParams;
		this._updateWmsSize();
		this.callInitHooks(WMSTileLayer);
	}
	_updateWmsSize() {
		const realRetina = this.options.detectRetina && window.devicePixelRatio > 1 ? 2 : 1;
		const tileSize = this.getTileSize();
		this.wmsParams.width = tileSize.x * realRetina;
		this.wmsParams.height = tileSize.y * realRetina;
	}
	_applyRetina() {
		super._applyRetina();
		if (this.wmsParams) this._updateWmsSize();
	}
	/**
	* Uses the CRS of the map (unless the `crs` option is set) and loads the tiles.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		this._updateCrs();
		super.onAdd(map);
	}
	_updateCrs() {
		this._crs = this.options.crs ?? this._map.options.crs;
		this._wmsVersion = parseFloat(this.wmsParams.version);
		delete this.wmsParams.srs;
		delete this.wmsParams.crs;
		this.wmsParams[this._wmsVersion >= 1.3 ? "crs" : "srs"] = this._crs.code;
	}
	/**
	* Returns the map events the layer listens to, see `Layer`.
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		const events = super.getEvents();
		events.crschange = this._updateCrs;
		return events;
	}
	/**
	* Called only internally, returns the URL of the `GetMap` request for a tile given its
	* coordinates.
	* @group Extension methods
	* @param {Point} coords
	* @returns {string}
	*/
	getTileUrl(coords) {
		const tileBounds = this._tileCoordsToNwSe(coords), crs = this._crs, bounds = new Bounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])), min = bounds.min, max = bounds.max, bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ? [
			min.y,
			min.x,
			max.y,
			max.x
		] : [
			min.x,
			min.y,
			max.x,
			max.y
		]).join(",");
		const url = new URL(super.getTileUrl(coords), document.baseURI);
		for (const [k, v] of Object.entries({
			...this.wmsParams,
			bbox
		})) url.searchParams.append(this.options.uppercase ? k.toUpperCase() : k, `${v}`);
		return url.toString();
	}
	/**
	* Returns the URL of the legend image (a `GetLegendGraphic` request) of the first
	* of the `layers` (with its style, if any), with the version, format and `uppercase`
	* option of the layer. `params` change or add parameters, e.g. `{layer: 'roads',
	* width: 20, height: 20}` or vendor parameters like `legend_options`.
	* @param {Record<string, any>} [params]
	* @returns {string}
	*/
	getLegendUrl(params) {
		const { version, format, layers, styles } = this.wmsParams, url = new URL(this._url, document.baseURI);
		for (const [k, v] of Object.entries({
			service: "WMS",
			request: "GetLegendGraphic",
			version,
			format,
			layer: layers.split(",")[0],
			style: styles?.split(",")[0] || void 0,
			sld_version: parseFloat(version) >= 1.3 ? "1.1.0" : void 0,
			...params
		})) if (v !== void 0) url.searchParams.set(this.options.uppercase ? k.toUpperCase() : k, v);
		return url.toString();
	}
	/**
	* Merges an object with the new parameters and re-requests tiles on the current screen
	* (unless `noRedraw` was set to true). The current tiles stay visible until the new
	* tiles have loaded, to avoid flickering.
	* @param {Record<string, any>} params
	* @param {boolean} [noRedraw]
	* @returns {this}
	*/
	setParams(params, noRedraw) {
		Object.assign(this.wmsParams, params);
		if (this._map) this._updateCrs();
		if (!noRedraw) {
			this._keepCurrentTiles();
			this.redraw();
		}
		return this;
	}
};
// src/layer/vector/Canvas.js
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {EventListener} from '../../core/Events.js' */
/** @import {RendererOptions} from './Renderer.js' */
const DASH_SEPARATOR_RE$1 = /[, ]+/;
/**
* Options of `Canvas`.
* @typedef {object} CanvasOptions
* @property {number} [tolerance=0] How much to extend the click tolerance around a
* path/object on the map.
* @extends RendererOptions
*/
/**
* Allows vector layers to be displayed with [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
* Inherits `Renderer`.
*
* @example
* Use Canvas by default for all paths in the map:
*
* ```js
* const map = new MaplairMap('map', {
* 	renderer: new Canvas()
* });
* ```
*
* Use a Canvas renderer with extra padding for specific vector geometries:
*
* ```js
* const map = new MaplairMap('map');
* const myRenderer = new Canvas({ padding: 0.5 });
* const line = new Polyline( coordinates, { renderer: myRenderer } );
* const circle =  new Circle( center, { renderer: myRenderer, radius: 100 } );
* ```
*/
var Canvas = class Canvas extends Renderer {
	static defaultOptions = { tolerance: 0 };
	/**
	* Creates a Canvas renderer with the given options.
	* @overload
	* @param {CanvasOptions} [options]
	*/
	/**
	* @param {...any} args
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(Canvas);
	}
	/**
	* Returns the map events the renderer listens to.
	* @returns {Record<string, EventListener>}
	*/
	getEvents() {
		const events = super.getEvents();
		events.viewprereset = this._onViewPreReset;
		events.pixelratiochange = this._onPixelRatioChange;
		return events;
	}
	_onPixelRatioChange() {
		this._resizeContainer();
		this._update();
	}
	_onViewPreReset() {
		this._postponeUpdatePaths = true;
	}
	/**
	* Adds the canvas to the map and draws the paths.
	* @param {MaplairMap} map
	*/
	onAdd(map) {
		super.onAdd(map);
		this._draw();
	}
	/**
	* Removes the canvas from the map.
	*/
	onRemove() {
		super.onRemove();
		clearTimeout(this._pointerHoverThrottleTimeout);
	}
	_initContainer() {
		const container = this._container = document.createElement("canvas");
		on(container, "pointermove", this._onPointerMove, this);
		on(container, "click dblclick pointerdown pointerup contextmenu", this._onClick, this);
		on(container, "pointerout", this._handlePointerOut, this);
		container["_maplair_disable_events"] = true;
		this._ctx = container.getContext("2d");
	}
	_destroyContainer() {
		cancelAnimationFrame(this._redrawRequest);
		this._redrawRequest = null;
		delete this._ctx;
		super._destroyContainer();
	}
	_resizeContainer() {
		const size = super._resizeContainer();
		const m = this._ctxScale = window.devicePixelRatio;
		this._container.width = m * size.x;
		this._container.height = m * size.y;
	}
	_updatePaths() {
		if (this._postponeUpdatePaths) return;
		this._redrawBounds = null;
		for (const layer of Object.values(this._layers)) layer._update();
		this._redraw();
	}
	_update() {
		if (this._map._animatingZoom && this._bounds) return;
		const b = this._bounds, s = this._ctxScale;
		this._ctx.setTransform(s, 0, 0, s, -b.min.x * s, -b.min.y * s);
		this.fire("update");
	}
	_reset() {
		super._reset();
		if (this._postponeUpdatePaths) {
			this._postponeUpdatePaths = false;
			this._updatePaths();
		}
	}
	_initPath(layer) {
		this._updateDashArray(layer);
		this._layers[stamp(layer)] = layer;
		const order = layer._order = {
			layer,
			prev: this._drawLast,
			next: null
		};
		if (this._drawLast) this._drawLast.next = order;
		this._drawLast = order;
		this._drawFirst ??= this._drawLast;
	}
	_addPath(layer) {
		this._requestRedraw(layer);
	}
	_removePath(layer) {
		const order = layer._order;
		const next = order.next;
		const prev = order.prev;
		if (next) next.prev = prev;
		else this._drawLast = prev;
		if (prev) prev.next = next;
		else this._drawFirst = next;
		delete layer._order;
		delete this._layers[stamp(layer)];
		this._requestRedraw(layer);
	}
	_updatePath(layer) {
		this._extendRedrawBounds(layer);
		layer._project();
		layer._update();
		this._requestRedraw(layer);
	}
	_updateStyle(layer) {
		this._updateDashArray(layer);
		this._requestRedraw(layer);
	}
	_updateDashArray(layer) {
		if (typeof layer.options.dashArray === "string") {
			const parts = layer.options.dashArray.split(DASH_SEPARATOR_RE$1);
			layer.options._dashArray = parts.map((n) => Number(n)).filter((n) => !isNaN(n));
		} else layer.options._dashArray = layer.options.dashArray;
	}
	_requestRedraw(layer) {
		if (!this._map) return;
		this._extendRedrawBounds(layer);
		this._redrawRequest ??= requestAnimationFrame(this._redraw.bind(this));
	}
	_extendRedrawBounds(layer) {
		if (layer._pxBounds) {
			const padding = (layer.options.weight ?? 0) + 1;
			this._redrawBounds ??= new Bounds();
			this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
			this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
		}
	}
	_redraw() {
		cancelAnimationFrame(this._redrawRequest);
		this._redrawRequest = null;
		if (this._redrawBounds) {
			this._redrawBounds.min._floor();
			this._redrawBounds.max._ceil();
		}
		this._clear();
		this._draw();
		this._redrawBounds = null;
	}
	_clear() {
		const bounds = this._redrawBounds;
		if (bounds) {
			const size = bounds.getSize();
			this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
		} else {
			this._ctx.save();
			this._ctx.setTransform(1, 0, 0, 1, 0, 0);
			this._ctx.clearRect(0, 0, this._container.width, this._container.height);
			this._ctx.restore();
		}
	}
	_draw() {
		let layer;
		const bounds = this._redrawBounds;
		this._ctx.save();
		if (bounds) {
			const size = bounds.getSize();
			this._ctx.beginPath();
			this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
			this._ctx.clip();
		}
		this._drawing = true;
		for (let order = this._drawFirst; order; order = order.next) {
			layer = order.layer;
			if (!bounds || layer._pxBounds && layer._pxBounds.intersects(bounds)) layer._updatePath();
		}
		this._drawing = false;
		this._ctx.restore();
	}
	_updatePoly(layer, closed) {
		if (!this._drawing) return;
		const parts = layer._parts, ctx = this._ctx;
		if (!parts.length) return;
		ctx.beginPath();
		parts.forEach((p0) => {
			p0.forEach((p, j) => {
				ctx[j ? "lineTo" : "moveTo"](p.x, p.y);
			});
			if (closed) ctx.closePath();
		});
		this._fillStroke(ctx, layer);
	}
	_updateCircle(layer) {
		if (!this._drawing || layer._empty()) return;
		const { x, y } = layer._point, ctx = this._ctx, r = Math.max(Math.round(layer._pxRadius), 1), ry = Math.max(Math.round(layer._pxRadiusY), 1) || r;
		ctx.beginPath();
		if (ry === r) ctx.arc(x, y, r, 0, Math.PI * 2);
		else ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
		this._fillStroke(ctx, layer);
	}
	_fillStroke(ctx, layer) {
		const options = layer.options;
		if (options.fill) {
			ctx.globalAlpha = options.fillOpacity;
			ctx.fillStyle = options.fillColor ?? options.color;
			ctx.fill(options.fillRule || "evenodd");
		}
		if (options.stroke && options.weight !== 0) {
			ctx.lineDashOffset = Number(options.dashOffset ?? 0);
			ctx.setLineDash(options._dashArray ?? []);
			ctx.globalAlpha = options.opacity;
			ctx.lineWidth = options.weight;
			ctx.strokeStyle = options.color;
			ctx.lineCap = options.lineCap;
			ctx.lineJoin = options.lineJoin;
			ctx.stroke();
		}
	}
	_updateInteractive() {}
	_onClick(e) {
		const point = this._map.pointerEventToLayerPoint(e);
		let layer, clickedLayer;
		for (let order = this._drawFirst; order; order = order.next) {
			layer = order.layer;
			if (layer.options.interactive && layer._containsPoint(point)) {
				if (!(e.type === "click" || e.type === "preclick") || !this._map._draggableMoved(layer)) clickedLayer = layer;
			}
		}
		this._fireEvent(clickedLayer ? [clickedLayer] : false, e);
	}
	_onPointerMove(e) {
		if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) return;
		const point = this._map.pointerEventToLayerPoint(e);
		this._handlePointerHover(e, point);
	}
	_handlePointerOut(e) {
		const layer = this._hoveredLayer;
		if (layer) {
			this._container.classList.remove("maplair-interactive");
			this._fireEvent([layer], e, "pointerout");
			this._hoveredLayer = null;
			this._pointerHoverThrottled = false;
		}
	}
	_handlePointerHover(e, point) {
		if (this._pointerHoverThrottled) return;
		let layer, candidateHoveredLayer;
		for (let order = this._drawFirst; order; order = order.next) {
			layer = order.layer;
			if (layer.options.interactive && layer._containsPoint(point)) candidateHoveredLayer = layer;
		}
		if (candidateHoveredLayer !== this._hoveredLayer) {
			this._handlePointerOut(e);
			if (candidateHoveredLayer) {
				this._container.classList.add("maplair-interactive");
				this._fireEvent([candidateHoveredLayer], e, "pointerover");
				this._hoveredLayer = candidateHoveredLayer;
			}
		}
		this._fireEvent(this._hoveredLayer ? [this._hoveredLayer] : false, e);
		this._pointerHoverThrottled = true;
		this._pointerHoverThrottleTimeout = setTimeout((() => {
			this._pointerHoverThrottled = false;
		}), 32);
	}
	_fireEvent(layers, e, type) {
		this._map._fireDOMEvent(e, type || e.type, layers);
	}
	_bringToFront(layer) {
		const order = layer._order;
		if (!order) return;
		const next = order.next;
		const prev = order.prev;
		if (next) next.prev = prev;
		else return;
		if (prev) prev.next = next;
		else if (next) this._drawFirst = next;
		order.prev = this._drawLast;
		this._drawLast.next = order;
		order.next = null;
		this._drawLast = order;
		this._requestRedraw(layer);
	}
	_bringToBack(layer) {
		const order = layer._order;
		if (!order) return;
		const next = order.next;
		const prev = order.prev;
		if (prev) prev.next = next;
		else return;
		if (next) next.prev = prev;
		else if (prev) this._drawLast = prev;
		order.prev = null;
		order.next = this._drawFirst;
		this._drawFirst.prev = order;
		this._drawFirst = order;
		this._requestRedraw(layer);
	}
};
// src/layer/vector/Circle.js
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {CircleMarkerOptions} from './CircleMarker.js' */
/**
* Options of `Circle`.
* @typedef {object} CircleOptions
* @property {number} [radius] Radius of the circle, in meters.
* @extends CircleMarkerOptions
*/
/**
* A class for drawing circle overlays on a map with radius specified in meters.
* Extends `CircleMarker`, its `setRadius()` and `getRadius()` use meters.
*
* It's an approximation and starts to diverge from a real circle closer to poles
* (due to projection distortion).
*
* @example
* ```js
* new Circle([50.5, 30.5], {radius: 200}).addTo(map);
* ```
*/
var Circle = class Circle extends CircleMarker {
	/**
	* Instantiates a circle object given a geographical point, and an options object
	* which contains the circle radius.
	* @param {LatLngExpression} latlng
	* @param {CircleOptions} [options]
	*/
	constructor(latlng, options) {
		super(latlng, options);
		if (isNaN(this.options.radius)) throw new Error("Circle radius cannot be NaN");
		this.callInitHooks(Circle);
	}
	/**
	* Returns the `LatLngBounds` of the path. When the circle isn't on a map, they're
	* approximated on a sphere.
	* @returns {LatLngBounds}
	*/
	getBounds() {
		if (!this._map) return this._latlng.toBounds(this._radius * 2);
		const half = [this._pxRadius, this._pxRadiusY ?? this._pxRadius];
		return new LatLngBounds(this._map.layerPointToLatLng(this._point.subtract(half)), this._map.layerPointToLatLng(this._point.add(half)));
	}
	_project() {
		const lng = this._latlng.lng, lat = this._latlng.lat, map = this._map, crs = map.options.crs;
		if (crs.distance === EarthCRS.distance) {
			const d = Math.PI / 180, latR = this._radius / EarthCRS.R / d, top = map.project([lat + latR, lng]), bottom = map.project([lat - latR, lng]), p = top.add(bottom).divideBy(2), lat2 = map.unproject(p).lat;
			let lngR = 2 * Math.asin(Math.sqrt((Math.sin(latR * d / 2) ** 2 - Math.sin((lat2 - lat) * d / 2) ** 2) / (Math.cos(lat * d) * Math.cos(lat2 * d)))) / d;
			if (isNaN(lngR) || lngR === 0) lngR = latR / Math.cos(Math.PI / 180 * lat);
			this._point = p.subtract(map.getPixelOrigin());
			this._pxRadius = isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x;
			this._pxRadiusY = p.y - top.y;
		} else {
			const latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._radius, 0]));
			this._point = map.latLngToLayerPoint(this._latlng);
			this._pxRadius = Math.abs(this._point.x - map.latLngToLayerPoint(latlng2).x);
		}
		this._updateBounds();
	}
};
// src/layer/vector/Rectangle.js
/** @import {LatLngBoundsExpression} from '../../geo/LatLngBounds.js' */
/** @import {PolygonOptions} from './Polygon.js' */
/**
* A class for drawing rectangle overlays on a map. Extends `Polygon`.
*
* @example
* ```js
* // define rectangle geographical bounds
* const bounds = [[54.559322, -5.767822], [56.1210604, -3.021240]];
*
* // create an orange rectangle
* new Rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
*
* // zoom the map to the rectangle bounds
* map.fitBounds(bounds);
* ```
*/
var Rectangle = class Rectangle extends Polygon {
	/**
	* Instantiates a rectangle object given the geographical bounds, and an optional
	* options object.
	* @param {LatLngBoundsExpression} latLngBounds
	* @param {PolygonOptions} [options]
	*/
	constructor(latLngBounds, options) {
		super(Rectangle._boundsToLatLngs(latLngBounds), options);
		this.callInitHooks(Rectangle);
	}
	/**
	* Redraws the rectangle with the passed bounds.
	* @param {LatLngBoundsExpression} latLngBounds
	* @returns {this}
	*/
	setBounds(latLngBounds) {
		return this.setLatLngs(Rectangle._boundsToLatLngs(latLngBounds));
	}
	static _boundsToLatLngs(latLngBounds) {
		latLngBounds = new LatLngBounds(latLngBounds);
		return [
			latLngBounds.getSouthWest(),
			latLngBounds.getNorthWest(),
			latLngBounds.getNorthEast(),
			latLngBounds.getSouthEast()
		];
	}
};
// src/map/Hash.js
/** @import {MaplairMap} from './Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
const leadingHashRe = /^#/;
const leadingQuestionMarkRe = /^\?/;
const queryParams = [
	"zoom",
	"lat",
	"lng",
	"bearing",
	"layers"
];
function parseLayers(query) {
	const raw = (query ?? "").split("&").find((param) => param.startsWith("layers="))?.slice(7);
	return raw === void 0 ? void 0 : raw.split(",").filter(Boolean).map(decodeURIComponent);
}
function viewOf(map, layers) {
	const center = map.getCenter(), precision = Math.max(0, Math.ceil(Math.log10(256 * 2 ** map.getZoom() / 360))), names = layers && Object.keys(layers).filter((name) => map.hasLayer(layers[name]));
	return {
		zoom: Math.round(map.getZoom() * 100) / 100,
		lat: center.lat.toFixed(precision),
		lng: center.lng.toFixed(precision),
		bearing: Math.round((map.getBearing?.() ?? 0) * 10) / 10,
		layers: names ? `layers=${names.map(encodeURIComponent).join(",")}` : ""
	};
}
/**
* Options of `Hash`.
* @typedef {object} HashOptions
* @property {'zoom/lat/lng'|'geo'} [format='zoom/lat/lng'] The format of the hash:
* `'zoom/lat/lng'` for `#13/47.2692/11.4041`, or `'geo'` for a
* [geo URI](https://www.rfc-editor.org/rfc/rfc5870) with the zoom as parameter `z` like
* in Android, `#geo:47.2692,11.4041?z=13`. The bearing of a rotated map is added as
* fourth number or parameter `bearing`.
* @property {Record<string, Layer>} [layers] The layers to keep in the hash by name,
* e.g. the base layers and overlays of a `LayersControl`: the names of those on the map
* are added as parameter `layers`, and restoring the hash adds the named layers to the
* map and removes the others.
* @property {'hash'|'query'} [mode='hash'] Where to keep the view: `'hash'` for the hash
* of the URL, or `'query'` for the parameters `zoom`, `lat`, `lng`, `bearing` (of a
* rotated map) and `layers` of the query string (the `format` option is ignored),
* keeping the other parameters, e.g. `?q=cafe&zoom=13&lat=47.2692&lng=11.4041`. The
* view is restored on navigating in the history of the browser (`popstate`).
*/
/**
* A view of the map parsed from a hash or query string by `Hash.parse()` and
* `Hash.parseQuery()`.
* @typedef {object} HashView
* @property {LatLng} center The center of the map.
* @property {number} [zoom] The zoom level, if any.
* @property {number} [bearing] The bearing of a rotated map, if any.
* @property {string[]} [layers] The names of the layers, if any.
* @property {string} hash The parsed hash or query string.
*/
/**
* Keeps the view of the map in the hash of the URL, e.g. `#13/47.2692/11.4041`
* (zoom, latitude, longitude, and the bearing of a rotated map) or as
* [geo URI](https://www.rfc-editor.org/rfc/rfc5870) `#geo:47.2692,11.4041?z=13`
* (see the `format` option), so that it can be bookmarked and shared. The view
* is restored from the hash (in either format) when creating the `Hash` and when
* the hash changes (e.g. with the back button of the browser).
*
* With the `layers` option, the hash also keeps the base layer and the overlays
* shown on the map, e.g. `#13/47.2692/11.4041?layers=OSM,Bike%20routes`.
*
* With the option `mode: 'query'`, the view is kept in the query string instead,
* e.g. `?zoom=13&lat=47.2692&lng=11.4041`, keeping the other parameters of the app.
*
* Inspired by the [leaflet-hash](https://github.com/mlevans/leaflet-hash) plugin.
*
* @example
* ```js
* const map = new MaplairMap('map').setView([47.27, 11.40], 13);
* new Hash(map);
*
* // with the layers of a layers control
* const baseLayers = {OSM: osm, Topo: topo}, overlays = {'Bike routes': bikes};
* new LayersControl(baseLayers, overlays).addTo(map);
* new Hash(map, {layers: {...baseLayers, ...overlays}});
*
* // in the query string, e.g. ?q=cafe&zoom=13&lat=47.2692&lng=11.4041
* new Hash(map, {mode: 'query'});
* ```
*/
var Hash = class Hash {
	/**
	* Synchronizes the view of `map` with the hash of the URL.
	* @param {MaplairMap} map
	* @param {HashOptions} [options]
	*/
	constructor(map, options) {
		/** @type {HashOptions} */
		this.options = {
			format: "zoom/lat/lng",
			layers: void 0,
			mode: "hash",
			...options
		};
		this._map = map;
		this._onHashChange = this._onHashChange.bind(this);
		this._event = this.options.mode === "query" ? "popstate" : "hashchange";
		window.addEventListener(this._event, this._onHashChange);
		map.on("moveend layeradd layerremove", this._onMoveEnd, this);
		if (!this._onHashChange() && map._loaded) this._onMoveEnd();
	}
	/**
	* Stops synchronizing the view with the hash of the URL.
	* @returns {this}
	*/
	remove() {
		window.removeEventListener(this._event, this._onHashChange);
		this._map.off("moveend layeradd layerremove", this._onMoveEnd, this);
		return this;
	}
	_onHashChange() {
		const view = this.options.mode === "query" ? Hash.parseQuery(location.search) : Hash.parse(location.hash);
		if (!view) return false;
		if (view.hash === this._hash) return true;
		this._hash = view.hash;
		this._restoring = true;
		const map = this._map;
		map.setView(view.center, view.zoom ?? map.getZoom(), { animate: false });
		if (map.setBearing && (view.bearing !== void 0 || map.getBearing())) map.setBearing(view.bearing ?? 0);
		if (view.layers && this.options.layers) {
			for (const [name, layer] of Object.entries(this.options.layers)) if (view.layers.includes(name)) map.addLayer(layer);
			else if (map.hasLayer(layer)) map.removeLayer(layer);
		}
		this._restoring = false;
		this._onMoveEnd();
		return true;
	}
	_onMoveEnd() {
		if (this._restoring || !this._map._loaded) return;
		const query = this.options.mode === "query", hash = query ? Hash.formatQuery(this._map, this.options.layers, location.search) : Hash.format(this._map, this.options.format, this.options.layers);
		if (hash === this._hash || hash === (query ? location.search : location.hash)) return;
		this._hash = hash;
		history.replaceState(history.state, "", query ? hash + location.hash : hash);
	}
	/**
	* Parses a hash like `#13/47.2692/11.4041[/30][?layers=A,B]` or
	* `#geo:47.2692,11.4041[?z=13][&layers=A,B]` to an object with the `center`
	* (`LatLng`), the `zoom` (if any), the optional `bearing` and the names of the
	* `layers` (if any), or returns `undefined` for other hashes.
	* @param {string} hash
	* @returns {HashView|undefined}
	*/
	static parse(hash) {
		const [path, query] = hash.replace(leadingHashRe, "").split("?"), params = new URLSearchParams(query), layers = parseLayers(query);
		let zoom, lat, lng, bearing;
		if (path.startsWith("geo:")) {
			const center = LatLng.parse(path);
			if (!center) return;
			({lat, lng} = center);
			zoom = params.has("z") ? Number(params.get("z")) : void 0;
			bearing = params.has("bearing") ? Number(params.get("bearing")) : void 0;
		} else {
			const parts = path.split("/");
			if (parts.length !== 3 && parts.length !== 4 || parts.includes("")) return;
			[zoom, lat, lng, bearing] = parts.map(Number);
		}
		if ([
			zoom,
			lat,
			lng,
			bearing
		].some(Number.isNaN)) return;
		return {
			zoom,
			center: new LatLng(lat, lng),
			bearing,
			layers,
			hash: `#${hash.replace(leadingHashRe, "")}`
		};
	}
	/**
	* Returns the hash for the view of the map in the given `format` (see the
	* options), with as many decimal places of the coordinates as needed for
	* the precision of a pixel, and the names of the given `layers` on the map.
	* @param {MaplairMap} map
	* @param {'zoom/lat/lng'|'geo'} [format='zoom/lat/lng']
	* @param {Record<string, Layer>} [layers]
	* @returns {string}
	*/
	static format(map, format = "zoom/lat/lng", layers = void 0) {
		const { zoom, lat, lng, bearing, layers: layerParam } = viewOf(map, layers);
		if (format === "geo") return `#geo:${lat},${lng}?z=${zoom}${bearing ? `&bearing=${bearing}` : ""}${layerParam ? `&${layerParam}` : ""}`;
		return `#${zoom}/${lat}/${lng}${bearing ? `/${bearing}` : ""}${layerParam ? `?${layerParam}` : ""}`;
	}
	/**
	* Parses the parameters `zoom`, `lat`, `lng`, `bearing` and `layers` of a query
	* string like `?q=cafe&zoom=13&lat=47.2692&lng=11.4041` like `parse()`, or
	* returns `undefined` without `lat` and `lng`.
	* @param {string} search
	* @returns {HashView|undefined}
	*/
	static parseQuery(search) {
		const query = search.replace(leadingQuestionMarkRe, ""), params = new URLSearchParams(query);
		if (!params.has("lat") || !params.has("lng")) return;
		const [zoom, bearing] = ["zoom", "bearing"].map((name) => params.has(name) ? Number(params.get(name)) : void 0), lat = Number(params.get("lat")), lng = Number(params.get("lng"));
		if ([
			zoom,
			lat,
			lng,
			bearing
		].some(Number.isNaN)) return;
		return {
			zoom,
			center: new LatLng(lat, lng),
			bearing,
			layers: parseLayers(query),
			hash: search
		};
	}
	/**
	* Returns the query string `search` with the parameters for the view of the map
	* (see `format()`) instead of the previous ones, keeping the other parameters.
	* @param {MaplairMap} map
	* @param {Record<string, Layer>} [layers]
	* @param {string} [search='']
	* @returns {string}
	*/
	static formatQuery(map, layers = void 0, search = "") {
		const view = viewOf(map, layers), params = new URLSearchParams(search);
		for (const name of queryParams) params.delete(name);
		return `?${[
			params.toString(),
			`zoom=${view.zoom}&lat=${view.lat}&lng=${view.lng}`,
			view.bearing ? `bearing=${view.bearing}` : "",
			view.layers
		].filter(Boolean).join("&")}`;
	}
};
// src/map/MapSync.js
/** @import {MaplairMap} from './Map.js' */
/**
* Options of `MapSync`.
* @typedef {object} MapSyncOptions
* @property {boolean} [bearing=true] Whether to synchronize the bearing of rotated maps
* (with the map rotation, see `MaplairMap.setBearing()`).
* @property {boolean} [oneWay=false] Whether only the first map leads and the other
* maps follow it, without moving the first map when they are moved.
* @property {'center'|'bounds'} [fit='center'] How the maps follow: `'center'` with the
* same center and zoom, or `'bounds'` with the same center, zoomed so that the bounds
* of the leading map fit (like `fitBounds()`), for maps of different sizes.
*/
/**
* Synchronizes the views (center, zoom and bearing) of several maps, e.g. to
* compare different layers side by side: whenever one of the maps moves (by the
* user or by code, including animations), the other maps follow.
*
* With the options `oneWay` and `fit: 'bounds'`, smaller maps can follow a main
* map showing its bounds, e.g. thumbnails next to it.
*
* Inspired by the [Leaflet.Sync](https://github.com/jieter/Leaflet.Sync) plugin.
*
* @example
* ```js
* const sync = new MapSync([map1, map2]);
* // later
* sync.remove();
*
* // a thumbnail showing the bounds of the main map
* new MapSync([map, thumbnail], {oneWay: true, fit: 'bounds'});
* ```
*/
var MapSync = class {
	/**
	* Synchronizes the views of the given maps, starting with the view of the first map.
	* @param {MaplairMap[]} maps
	* @param {MapSyncOptions} [options]
	*/
	constructor(maps, options) {
		/** @type {MapSyncOptions} */
		this.options = {
			bearing: true,
			oneWay: false,
			fit: "center",
			...options
		};
		this._maps = [...maps];
		this._listeners = /* @__PURE__ */ new Map();
		this._animating = /* @__PURE__ */ new Set();
		this._ended = /* @__PURE__ */ new Set();
		for (const map of this._maps) {
			const listeners = {
				movestart: () => this._onMoveStart(map),
				zoomstart: () => this._onZoomStart(map),
				move: () => this._onMove(map),
				zoomanim: (e) => this._onZoomAnim(map, e),
				moveend: () => this._onMoveEnd(map),
				rotate: () => this._onRotate(map)
			};
			map.on(listeners);
			this._listeners.set(map, listeners);
		}
		if (this._maps[0]?._loaded) this._syncAll(this._maps[0]);
	}
	/**
	* Stops synchronizing the maps.
	* @returns {this}
	*/
	remove() {
		for (const [map, listeners] of this._listeners) map.off(listeners);
		this._listeners.clear();
		this._maps = [];
		return this;
	}
	_followers(map) {
		return this._maps.filter((m) => m !== map && m._loaded);
	}
	_canLead(map) {
		return !this.options.oneWay || map === this._maps[0];
	}
	_zoomFor(other, map, zoom = map.getZoom(), end = true) {
		const size = other.getSize(), leaderSize = map.getSize();
		if (this.options.fit !== "bounds" || !size.x || !size.y || !leaderSize.x || !leaderSize.y) return zoom;
		let z = zoom + Math.log2(Math.min(size.x / leaderSize.x, size.y / leaderSize.y));
		const snap = other.options.zoomSnap;
		if (end && snap) z = Math.floor(z / snap + 1e-6) * snap;
		return Math.max(other.getMinZoom(), Math.min(other.getMaxZoom(), z));
	}
	_onMoveStart(map) {
		if (this._leader || !this._canLead(map)) return;
		this._leader = map;
		this._leaderEnded = false;
		this._ended.clear();
		for (const other of this._followers(map)) {
			other._stop();
			other._syncStartZoom = other.getZoom();
			other.fire("movestart");
		}
	}
	_onZoomStart(map) {
		this._onMoveStart(map);
		if (this._leader !== map) return;
		for (const other of this._followers(map)) other.fire("zoomstart");
	}
	_onMove(map) {
		if (!this._leader) {
			if (this._canLead(map)) this._syncAll(map);
			return;
		}
		if (this._leader !== map) return;
		for (const other of this._followers(map)) if (!this._animating.has(other)) this._follow(other, map, true);
	}
	_onZoomAnim(map, e) {
		if (this._leader !== map) return;
		for (const other of this._followers(map)) if (other._zoomAnimated) {
			this._animating.add(other);
			other._animateZoom(e.center, this._zoomFor(other, map, e.zoom), true, e.noUpdate);
		}
	}
	_onMoveEnd(map) {
		if (this._leader !== map) {
			if (this._animating.delete(map)) {
				this._ended.add(map);
				if (this._leaderEnded && !this._animating.size) this._leader = null;
			}
			return;
		}
		for (const other of this._followers(map)) if (!this._animating.has(other) && !this._ended.has(other)) {
			this._follow(other, map, false);
			other._moveEnd(other.getZoom() !== other._syncStartZoom);
		}
		this._leaderEnded = true;
		if (!this._animating.size) this._leader = null;
	}
	_onRotate(map) {
		if (!this.options.bearing || !this._canLead(map)) return;
		for (const other of this._followers(map)) if (other._rotate && other.getBearing() !== map.getBearing()) other._rotate(map.getBearing());
	}
	_follow(other, map, during) {
		const center = map.getCenter(), zoom = this._zoomFor(other, map, map.getZoom(), !during);
		if (zoom === other.getZoom()) {
			const offset = other.project(center, zoom).subtract(other.project(other.getCenter(), zoom)).round();
			if (offset.x || offset.y) {
				other._rawPanBy(offset);
				other.fire("move");
			}
		} else other._move(center, zoom, during ? {
			pinch: true,
			round: false
		} : void 0);
	}
	_syncAll(map) {
		for (const other of this._maps.filter((m) => m !== map)) {
			if (this.options.bearing && other._rotate && other.getBearing() !== map.getBearing()) other._rotate(map.getBearing());
			const zoom = this._zoomFor(other, map);
			if (!other._loaded || other.getZoom() !== zoom || other.latLngToContainerPoint(map.getCenter()).distanceTo(other.getSize()._divideBy(2)) >= 1) {
				this._leader = map;
				other.setView(map.getCenter(), zoom, { animate: false });
				this._leader = null;
			}
		}
	}
};
// src/map/handler/DisplaceHandler.js
/** @import {MaplairMap} from '../Map.js' */
/** @import {Layer} from '../../layer/Layer.js' */
/** @import {LayerEvent} from '../../core/Events.js' */
/** @import {LatLng} from '../../geo/LatLng.js' */
/**
* Options of `DisplaceHandler`.
* @typedef {object} DisplaceHandlerOptions
* @property {number} [gap=2] Additional pixel distance between the outlines of two
* markers.
* @property {number} [iterations=80] Maximum number of relaxation passes per relayout.
* @property {number} [maxDistance=Infinity] Maximum distance in meters a marker may be
* moved away from its true position. Markers which would have to move further stay
* overlapping. Meters rather than pixels, since the point of the limit is to bound the
* geographic error. A limit in meters also scales itself: it only bites at the zoom
* levels where a pixel is worth a lot of ground.
*/
/**
* Map options of `DisplaceHandler`, the interaction options for displacement.
* @typedef {object} DisplaceHandlerMapOptions
* @lends MaplairMapOptions
* @property {boolean|DisplaceHandlerOptions} [displace] Whether to displace
* overlapping `CircleMarker`s, either `true` or an object overriding the options of
* `DisplaceHandler`. Needs the `DisplaceHandler` to be added to the map, see there.
*/
/**
* Handler of `MaplairMap` for displacement, if added to the map (see `DisplaceHandler`).
* @typedef {object} DisplaceHandlerMapProperties
* @lends MaplairMap
* @property {DisplaceHandler} [displace] The displacement handler, if added with the
* name `displace`.
*/
/**
* Options of `CircleMarker` for the displacement by `DisplaceHandler`.
* @typedef {object} DisplaceCircleMarkerOptions
* @lends CircleMarkerOptions
* @property {boolean} [displace] Whether to include this marker in the displacement of
* the map, see `DisplaceHandler`.
* @property {string} [displaceId] Stable identifier shared across marker instances that
* represent the same thing on different layers, so that `DisplaceHandler` puts them at
* the same displaced position.
*/
/**
* Whether a layer takes part in the displacement. Only these change the layout, so layers
* that merely come and go on top of the markers — the highlight circle around a tapped or
* searched bobble, for one — must not trigger a relayout of all of them.
* @param {Layer} layer
* @returns {boolean}
*/
function displaceable(layer) {
	return layer instanceof CircleMarker && !!layer.options.displace;
}
/**
* Cartographic displacement of overlapping `CircleMarker`s: keeps all circle
* markers created with `displace: true` free of overlap.
*
* Overlap is a screen space phenomenon: whether two markers cover each other
* depends on their pixel radius and the current zoom level. The displacement is
* therefore computed in projected pixel space and recomputed on every zoom. The
* true position of each marker is kept by the handler, the displaced position is
* applied via `setLatLng`. Since every run starts over from the true position,
* markers never drift.
*
* `maxDistance` bounds how far a marker may be moved away from the truth, in
* meters. It is worth noting what such a limit costs at low zoom levels: if a
* marker is 11 km wide on the ground, separating two coincident ones moves each
* of them by some 6 km, so a limit below that leaves them overlapping.
*
* Unlike the default handlers, it isn't added to every map, so that bundlers can
* drop it from applications that don't use it. Add it to the map class (or to a
* single map with `DisplaceHandler.addTo(map, 'displace')`), then enable it with
* the map option `displace`, which is either `true` or an object overriding the
* handler's options. It can be toggled at runtime via `map.displace.enable()` /
* `map.displace.disable()`; disabling restores the true positions.
*
* @example
* ```js
* import { CircleMarker, DisplaceHandler, MaplairMap } from 'maplair';
*
* MaplairMap.addInitHook('addHandler', 'displace', DisplaceHandler);
*
* const map = new MaplairMap('map', {displace: { maxDistance: 10_000} });
* new CircleMarker(latlng, { displace: true, radius: 6 }).addTo(map);
* ```
*/
var DisplaceHandler = class DisplaceHandler extends Handler {
	static defaultOptions = {
		gap: 2,
		iterations: 80,
		maxDistance: Infinity
	};
	/**
	* @param {...MaplairMap} args The map.
	*/
	constructor(...args) {
		super(...args);
		setOptions(this, this._map.options.displace);
		/**
		* True (undisplaced) position per marker, kept outside of the marker so that
		* the displacement cannot clobber it and re-added markers keep their anchor.
		* @type {WeakMap<CircleMarker, LatLng>}
		*/
		this._trueLatLngs = /* @__PURE__ */ new WeakMap();
		/**
		* Displaced position per `marker.options.displaceId`, per zoom level. Different
		* layers (e.g. one per classification) may create separate `CircleMarker`
		* instances for the same thing; keying by id instead of by marker instance
		* keeps it at the same displaced position regardless of which layer triggered
		* the relayout. Cleared whenever a true position changes.
		* @type {Map<number, Map<string, LatLng>>}
		*/
		this._displacedPositions = /* @__PURE__ */ new Map();
		this.callInitHooks(DisplaceHandler);
	}
	/**
	* Called when the handler is enabled, adds the event hooks.
	*/
	addHooks() {
		this._map.on("zoomend", this.schedule, this);
		this._map.on("layeradd", this._onLayerAdd, this);
		this._map.on("layerremove", this._onLayerRemove, this);
		this._map.eachLayer((layer) => this._track(layer));
		this.schedule();
	}
	/**
	* Called when the handler is disabled, removes the event hooks and restores the
	* true positions of the markers.
	*/
	removeHooks() {
		this._map.off("zoomend", this.schedule, this);
		this._map.off("layeradd", this._onLayerAdd, this);
		this._map.off("layerremove", this._onLayerRemove, this);
		if (this._frame) cancelAnimationFrame(this._frame);
		this._frame = void 0;
		this._restore();
	}
	/**
	* Requests a relayout in the next animation frame, at most one per frame.
	*/
	schedule() {
		if (this._frame) return;
		this._frame = requestAnimationFrame(() => {
			this._frame = void 0;
			this.relayout();
		});
	}
	/**
	* Computes the displacement for all tracked markers in the pixel space of
	* the current zoom level and writes the displaced positions back.
	*/
	relayout() {
		const map = this._map;
		/** @type {CircleMarker[]} */
		const markers = [];
		map.eachLayer((layer) => {
			if (this._trueLatLngs.has(layer)) markers.push(layer);
		});
		if (markers.length < 2) return;
		const zoom = map.getZoom();
		let cache = this._displacedPositions.get(zoom);
		if (!cache) {
			cache = /* @__PURE__ */ new Map();
			this._displacedPositions.set(zoom, cache);
		}
		if (markers.every((marker) => marker.options.displaceId && cache.has(marker.options.displaceId))) {
			for (const marker of markers) this._moveTo(marker, cache.get(marker.options.displaceId));
			return;
		}
		const { gap, iterations, maxDistance } = this.options;
		const points = markers.map((marker) => map.project(this._trueLatLngs.get(marker), zoom));
		displace(points, 2 * markers.reduce((r, marker) => Math.max(r, marker.getRadius()), 0) + gap, {
			iterations,
			maxDisplacement: maxDistance * this._pixelsPerMeter(zoom)
		});
		for (let i = 0; i < markers.length; i++) {
			const latLng = map.unproject(points[i], zoom);
			this._moveTo(markers[i], latLng);
			if (markers[i].options.displaceId) cache.set(markers[i].options.displaceId, latLng);
		}
	}
	/**
	* Scale of the map at `zoom`, measured with the CRS of the map at its
	* center. Since a relayout only ever covers one screen, the scale variation
	* across the view is ignored.
	* @param {number} zoom
	* @returns {number}
	*/
	_pixelsPerMeter(zoom) {
		const map = this._map;
		const center = map.getCenter();
		const east = map.unproject(map.project(center, zoom).add(new Point(100, 0)), zoom);
		return 100 / map.distance(center, east);
	}
	/**
	* Moves a marker to its displaced (or true) position, without taking that
	* for a new true position, see `_onMarkerMove`.
	* @param {CircleMarker} marker
	* @param {LatLng} latLng
	*/
	_moveTo(marker, latLng) {
		this._moving = true;
		try {
			marker.setLatLng(latLng);
		} finally {
			this._moving = false;
		}
	}
	/**
	* A tracked marker was moved by the application: that is its new true position,
	* which invalidates the cached displaced positions.
	* @param {Event} event
	*/
	_onMarkerMove(event) {
		if (this._moving) return;
		this._trueLatLngs.set(event.target, event.latlng);
		this._displacedPositions.clear();
		if (this._enabled && this._map.hasLayer(event.target)) this.schedule();
	}
	/**
	* @param {LayerEvent} event
	*/
	_onLayerAdd(event) {
		this._track(event.layer);
		if (displaceable(event.layer)) this.schedule();
	}
	/**
	* @param {LayerEvent} event
	*/
	_onLayerRemove(event) {
		if (displaceable(event.layer)) this.schedule();
	}
	/**
	* Remembers the true position of a marker opted in via `displace: true`.
	* Markers seen before keep their previously stored position, so re-adding a
	* displaced marker does not anchor it to its displaced position.
	* @param {Layer} layer
	*/
	_track(layer) {
		if (!displaceable(layer)) return;
		if (!this._trueLatLngs.has(layer)) {
			this._trueLatLngs.set(layer, layer.getLatLng());
			layer.on("move", this._onMarkerMove, this);
		}
	}
	/**
	* Moves all tracked markers back to their true position.
	*/
	_restore() {
		this._map.eachLayer((layer) => {
			const latLng = this._trueLatLngs.get(layer);
			if (latLng) this._moveTo(layer, latLng);
		});
	}
};
/**
* Displaces overlapping points in pixel space until they are at least
* `minSeparation` apart. Iterative relaxation: every overlapping pair is pushed
* apart by half of its overlap per pass. Neighbour lookup uses a grid (cell
* size = separation) ⇒ O(n) per iteration.
*
* No point ends up further than `maxDisplacement` away from where it started.
* Points which hit that limit stay overlapping – the limit wins over the
* separation.
*
* @param {Point[]} points Pixel coordinates (modified in place)
* @param {number} minSeparation Minimum distance between centers, in pixels
* @param {{ iterations?: number, maxDisplacement?: number }} [options]
* @returns {Point[]} the same (displaced) points
*/
function displace(points, minSeparation, { iterations = DisplaceHandler.defaultOptions.iterations, maxDisplacement = Infinity } = {}) {
	const n = points.length;
	if (n < 2) return points;
	const sep = minSeparation;
	const sepSq = sep * sep;
	const cell = sep;
	const dx = new Float64Array(n);
	const dy = new Float64Array(n);
	const ax = Float64Array.from(points, (point) => point.x);
	const ay = Float64Array.from(points, (point) => point.y);
	for (let iter = 0; iter < iterations; iter++) {
		dx.fill(0);
		dy.fill(0);
		/** @type {Map<string, number[]>} */
		const grid = /* @__PURE__ */ new Map();
		for (let i = 0; i < n; i++) {
			const key = `${Math.floor(points[i].x / cell)},${Math.floor(points[i].y / cell)}`;
			const bucket = grid.get(key);
			if (bucket) bucket.push(i);
			else grid.set(key, [i]);
		}
		let overlaps = 0;
		for (let i = 0; i < n; i++) {
			const cx = Math.floor(points[i].x / cell);
			const cy = Math.floor(points[i].y / cell);
			for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
				const bucket = grid.get(`${gx},${gy}`);
				if (!bucket) continue;
				for (const j of bucket) {
					if (j <= i) continue;
					let vx = points[i].x - points[j].x;
					let vy = points[i].y - points[j].y;
					const distSq = vx * vx + vy * vy;
					if (distSq >= sepSq) continue;
					overlaps++;
					let dist;
					if (distSq === 0) {
						const angle = i * 2.399963229728653;
						vx = Math.cos(angle);
						vy = Math.sin(angle);
						dist = 1;
					} else {
						dist = Math.sqrt(distSq);
						vx /= dist;
						vy /= dist;
					}
					const push = (sep - dist) / 2;
					dx[i] += vx * push;
					dy[i] += vy * push;
					dx[j] -= vx * push;
					dy[j] -= vy * push;
				}
			}
		}
		if (overlaps === 0) break;
		for (let i = 0; i < n; i++) {
			points[i].x += dx[i];
			points[i].y += dy[i];
			const ox = points[i].x - ax[i];
			const oy = points[i].y - ay[i];
			const offsetSq = ox * ox + oy * oy;
			if (offsetSq > maxDisplacement * maxDisplacement) {
				const scale = maxDisplacement / Math.sqrt(offsetSq);
				points[i].x = ax[i] + ox * scale;
				points[i].y = ay[i] + oy * scale;
			}
		}
	}
	return points;
}
// src/Maplair.js
/**
* A constant that represents the Maplair version in use.
* @type {string}
*/
const version = version$1;
// src/control/RotateControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
const compass = "<svg aria-hidden=\"true\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><path d=\"M8 1 11 8H5z\" fill=\"#d22\"/><path d=\"M8 15 5 8h6z\" fill=\"#999\"/></svg>";
/**
* Options of `RotateControl`.
* @typedef {object} RotateControlOptions
* @property {string} [position='topleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @extends ControlOptions
*/
/**
* Map options of `RotateControl`.
* @typedef {object} RotateControlMapOptions
* @lends MaplairMapOptions
* @property {boolean} [rotateControl=false] Whether a [rotate control](#rotatecontrol)
* is added to the map by default.
*/
/**
* Properties of `MaplairMap` set by `RotateControl`.
* @typedef {object} RotateControlMapProperties
* @lends MaplairMap
* @property {RotateControl} rotateControl The default rotate control (only available if
* the [`rotateControl` option](#map-rotatecontrol) was `true` when creating the map).
*/
/**
* A compass showing the rotation of the map (see `MaplairMap.setBearing()`); clicking it
* rotates the map back to north up. It is put on the map if you set its
* [`rotateControl` option](#map-rotatecontrol) to `true`.
*
* @example
* ```js
* new RotateControl({position: 'topright'}).addTo(map);
* ```
*/
var RotateControl = class RotateControl extends Control {
	static defaultOptions = { position: "topleft" };
	/**
	* Creates a rotate control.
	* @param {...RotateControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(RotateControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-control-rotate maplair-bar"), button = this._button = create("button", "maplair-control-rotate-button", container), title = I18n.translate("Reset north");
		button.type = "button";
		button.title = title;
		button.setAttribute("aria-label", title);
		button.innerHTML = compass;
		disableClickPropagation(button);
		on(button, "click", stop);
		on(button, "click", this._resetNorth, this);
		on(button, "click", this._refocusOnMap, this);
		this._update();
		map.on("rotate", this._update, this);
		return container;
	}
	/**
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		map.off("rotate", this._update, this);
	}
	_resetNorth(e) {
		this._map._setUserEvent(e);
		this._map.setBearing(0, { animate: true });
	}
	_update() {
		this._button.firstChild.style.transform = `rotate(${-this._map.getBearing()}deg)`;
	}
	/**
	* Registers this default feature on the map class, called by `MaplairMap` itself.
	* @internal
	* @param {typeof MaplairMap} MaplairMap
	*/
	static register(MaplairMap) {
		MaplairMap.mergeOptions({ rotateControl: false });
		MaplairMap.addInitHook(function() {
			if (this.options.rotateControl) {
				this.rotateControl = new RotateControl();
				this.addControl(this.rotateControl);
			}
		});
	}
};
// src/map/Map.Rotation.js
function normalizeBearing(bearing) {
	return (Number(bearing) % 360 + 360) % 360;
}
function rotatePoint(point, degrees) {
	const angle = degrees * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
	return new Point(point.x * cos - point.y * sin, point.x * sin + point.y * cos);
}
const rotatedMaps = /* @__PURE__ */ new WeakMap();
const { panBy } = MaplairMap.prototype, { getEvents: getDivOverlayEvents } = DivOverlay.prototype, { _setPosition: setTooltipPosition } = Tooltip.prototype, { getEvents: getMarkerEvents, _positionElements: positionMarkerElements } = Marker.prototype, { _onDown: onDraggableDown, _updatePosition: updateDraggablePosition } = Draggable.prototype, { _onPointerStart: onPinchStart } = PinchZoomHandler.prototype, { _onDown: onTapDragDown } = TapDragZoomHandler.prototype, { _pinchTo: pinchTo } = ScrollWheelZoomHandler.prototype;
/**
* Map options of the map rotation (`maplair/map-rotation`).
* @typedef {object} RotationMapOptions
* @lends MaplairMapOptions
* @property {number} [bearing=0] Initial rotation of the map in degrees: the compass
* direction pointing up, clockwise from north (e.g. `90` for east up), see
* `setBearing()`.
* @property {boolean} [pinchRotate=false] Whether the map can be rotated by turning two
* fingers, see `setBearing()`.
*/
MaplairMap.mergeOptions({
	bearing: 0,
	pinchRotate: false
});
MaplairMap.addInitHook(function() {
	if (this.options.bearing || this.options.pinchRotate || this.options.rotateControl) {
		this._rotate(this.options.bearing);
		if (this._loaded) this.fire("moveend");
	}
});
RotateControl.register(MaplairMap);
/** @typedef {typeof mapRotationMethods} MapRotationMethods */
MaplairMap.include({
	/**
	* Rotates the map around the center of the view, so that the compass direction
	* `bearing` (in degrees, clockwise from north) points up. Markers, popups and
	* tooltips stay upright. With `{animate: true}`, the map rotates smoothly (the
	* shorter way round).
	* @group Map rotation
	* @param {number} bearing
	* @param {{animate?: boolean}} [options]
	* @returns {this}
	*/
	setBearing(bearing, options) {
		bearing = normalizeBearing(bearing);
		const from = this.getBearing();
		if (!this._rotatePane && !bearing) return this;
		if (bearing === from) return this;
		this._stop();
		if (!options?.animate || !this._loaded || this._prefersReducedMotion()) {
			this._rotate(bearing);
			return this._loaded ? this.fire("movestart").fire("move").fire("moveend") : this;
		}
		const delta = (bearing - from + 540) % 360 - 180, start = performance.now(), duration = 250;
		this.fire("movestart");
		const frame = () => {
			const t = Math.min(1, (performance.now() - start) / duration);
			this._rotate(from + delta * (1 - (1 - t) ** 2));
			this.fire("move");
			if (t < 1) this._flyToFrame = requestAnimationFrame(frame);
			else this.fire("moveend");
		};
		this._flyToFrame = requestAnimationFrame(frame);
		return this;
	},
	_rotate(bearing) {
		bearing = normalizeBearing(bearing);
		if (!this._rotatePane) {
			const rotatePane = this._rotatePane = create("div", "maplair-rotate-pane");
			rotatedMaps.set(rotatePane, this);
			this._container.insertBefore(rotatePane, this._mapPane);
			rotatePane.appendChild(this._mapPane);
		}
		if (bearing === this.getBearing()) return;
		this._bearing = bearing;
		this._rotatePane.style.transform = bearing ? `rotate(${-bearing}deg)` : "";
		if (this._loaded) this.fire("rotate");
	},
	/**
	* Returns the rotation of the map, see `setBearing()`.
	* @group Map rotation
	* @returns {number}
	*/
	getBearing() {
		return this._bearing ?? 0;
	},
	_rotateToPane(point) {
		return this._bearing ? rotatePoint(point, this._bearing) : point;
	},
	_rotateToContainer(point) {
		return this._bearing ? rotatePoint(point, -this._bearing) : point;
	},
	_getViewSize() {
		const size = this.getSize();
		if (!this._bearing) return size;
		const angle = this._bearing * Math.PI / 180, cos = Math.abs(Math.cos(angle)), sin = Math.abs(Math.sin(angle));
		return new Point(size.x * cos + size.y * sin, size.x * sin + size.y * cos);
	},
	_rotateUpright(el, transformOrigin) {
		if (this._bearing) {
			el.style.transform += ` rotate(${this._bearing}deg)`;
			el.style.transformOrigin = transformOrigin;
		} else if (el.style.transformOrigin) el.style.transformOrigin = "";
	},
	/**
	* Overrides `containerPointToLayerPoint()` of `MaplairMap` (documented there) to
	* account for the rotation.
	* @internal
	* @param {PointExpression} point
	* @returns {Point}
	*/
	containerPointToLayerPoint(point) {
		point = Point.from(point);
		if (this._bearing) {
			const center = this.getSize()._divideBy(2);
			point = this._rotateToPane(point.subtract(center))._add(center);
		}
		return point.subtract(this._getMapPanePos());
	},
	/**
	* Overrides `layerPointToContainerPoint()` of `MaplairMap` (documented there) to
	* account for the rotation.
	* @internal
	* @param {PointExpression} point
	* @returns {Point}
	*/
	layerPointToContainerPoint(point) {
		point = Point.from(point).add(this._getMapPanePos());
		if (this._bearing) {
			const center = this.getSize()._divideBy(2);
			point = this._rotateToContainer(point.subtract(center))._add(center);
		}
		return point;
	},
	/**
	* Overrides `getPixelBounds()` of `MaplairMap` (documented there): the bounding box
	* of the rotated view.
	* @internal
	* @param {LatLng} [center]
	* @param {number} [zoom]
	* @returns {Bounds}
	*/
	getPixelBounds(center, zoom) {
		const topLeftPoint = this._getTopLeftPoint(center, zoom);
		if (!this._bearing) return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
		const pixelCenter = topLeftPoint.add(this.getSize()._divideBy(2)), half = this._getViewSize()._divideBy(2);
		return new Bounds(pixelCenter.subtract(half), pixelCenter.add(half));
	},
	/**
	* Overrides `panBy()` of `MaplairMap` (documented there): `panBy()` takes offsets in
	* container pixels, the map pane moves in its rotated frame.
	* @internal
	* @param {PointExpression} offset
	* @param {PanOptions} [options]
	* @returns {this}
	*/
	panBy(offset, options) {
		return panBy.call(this, this._rotateToPane(Point.from(offset)), options);
	},
	_tryAnimatedPan(center, options) {
		const offset = this._rotateToContainer(this._getCenterOffset(center)._trunc());
		if (options?.animate !== true && !this.getSize().contains(offset)) return false;
		this.panBy(offset, options);
		return true;
	},
	/**
	* Overrides `invalidateSize()` of `MaplairMap` (documented there) to pan in container
	* pixels.
	* @internal
	* @param {boolean|InvalidateSizeOptions} [options]
	* @returns {this}
	*/
	invalidateSize(options) {
		if (!this._loaded) return this;
		options = {
			animate: false,
			pan: true,
			...options === true ? { animate: true } : options
		};
		const oldSize = this.getSize();
		this._sizeChanged = true;
		this._lastCenter = null;
		const newSize = this.getSize(), oldCenter = oldSize.divideBy(2).round(), newCenter = newSize.divideBy(2).round(), offset = oldCenter.subtract(newCenter);
		if (!offset.x && !offset.y) return this;
		if (options.animate && options.pan) this.panBy(this._rotateToContainer(offset));
		else {
			if (options.pan) this._rawPanBy(offset);
			this.fire("move");
			if (options.debounceMoveend) {
				clearTimeout(this._sizeTimer);
				this._sizeTimer = setTimeout(this.fire.bind(this, "moveend"), 200);
			} else this.fire("moveend");
		}
		return this.fire("resize", {
			oldSize,
			newSize
		});
	},
	_continuousZoom(center, zoom, offset, options) {
		const startZoom = this._zoom, originOffset = offset.multiplyBy(-1), origin = this.layerPointToLatLng(this._getCenterLayerPoint().add(offset)), start = performance.now(), duration = 250;
		this._moveStart(true, options.noMoveStart ?? false);
		const frame = () => {
			const t = Math.min(1, (performance.now() - start) / duration);
			if (t < 1) {
				const z = startZoom + (zoom - startZoom) * (1 - (1 - t) ** 2);
				this._move(this.unproject(this.project(origin, z).add(originOffset), z), z, { continuous: true });
				this._flyToFrame = requestAnimationFrame(frame);
			} else this._move(center, zoom)._moveEnd(true);
		};
		this._flyToFrame = requestAnimationFrame(frame);
	}
});
/** @typedef {typeof gridLayerRotationMethods} GridLayerMapRotationMethods */
GridLayer.include({ _getTiledPixelBounds(center) {
	const map = this._map, mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(), scale = map.getZoomScale(mapZoom, this._tileZoom), pixelCenter = map.project(center, this._tileZoom).floor(), halfSize = map._getViewSize().divideBy(scale * 2);
	return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
} });
/** @typedef {typeof blanketOverlayRotationMethods} BlanketOverlayMapRotationMethods */
BlanketOverlay.include({
	_updateTransform(center, zoom) {
		const scale = this._map.getZoomScale(zoom, this._zoom), viewHalf = this._map._getViewSize().multiplyBy(.5 + this.options.padding), currentCenterPoint = this._map.project(this._center, zoom), topLeftOffset = viewHalf.multiplyBy(-scale)._add(currentCenterPoint)._subtract(this._map._getNewPixelOrigin(center, zoom))._round();
		setTransform(this._container, topLeftOffset, scale);
	},
	_onMoveEnd(ev) {
		const p = this.options.padding, size = this._map._getViewSize();
		if (!size.multiplyBy(1 + p * 2).round().equals(this._containerSize)) this._resizeContainer();
		const min = this._map._getCenterLayerPoint().subtract(size.multiplyBy(.5 + p)).round();
		this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
		this._center = this._map.getCenter();
		this._zoom = this._map.getZoom();
		this._updateTransform(this._center, this._zoom);
		this._onSettled(ev);
	},
	_resizeContainer() {
		const p = this.options.padding, size = this._containerSize = this._map._getViewSize().multiplyBy(1 + p * 2).round();
		this._container.style.width = `${size.x}px`;
		this._container.style.height = `${size.y}px`;
		return size;
	}
});
/** @typedef {typeof divOverlayRotationMethods} DivOverlayMapRotationMethods */
DivOverlay.include({
	/**
	* Overrides `getEvents()` of `DivOverlay` to update the position on rotation.
	* @internal
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		return {
			...getDivOverlayEvents.call(this),
			rotate: this._updatePosition
		};
	},
	_updatePosition() {
		if (!this._map) return;
		const map = this._map, pos = map.latLngToLayerPoint(this._latlng)._round(), anchor = map._rotateToPane(new Point(this._getAnchor()));
		let offset = Point.from(this.options.offset);
		const transformed = this._zoomAnimated || this.options.overflow || map._bearing;
		if (!transformed) offset = offset.add(pos).add(anchor);
		const bottom = this._containerBottom = -offset.y, left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;
		if (this.options.overflow) {
			this._container.style.top = "auto";
			this._container.style.bottom = `calc(100% + ${bottom}px)`;
		} else this._container.style.bottom = `${bottom}px`;
		this._container.style.left = `${left}px`;
		if (transformed) this._setContainerPosition(pos.add(anchor), `${-left}px calc(100% + ${bottom + (this._containerMarginBottom ?? 0)}px)`);
	},
	_setContainerPosition(pos, transformOrigin) {
		this._containerPos = pos;
		if (this.options.overflow) {
			const mapContainer = this._map._container, rect = mapContainer.getBoundingClientRect();
			pos = this._map.layerPointToContainerPoint(pos)._add(new Point(rect.left + mapContainer.clientLeft, rect.top + mapContainer.clientTop));
		}
		setPosition(this._container, pos);
		if (!this.options.overflow) this._map._rotateUpright(this._container, transformOrigin);
	}
});
/** @typedef {typeof popupRotationMethods} PopupMapRotationMethods */
Popup.include({
	_animateZoom(e) {
		const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center), anchor = this._map._rotateToPane(new Point(this._getAnchor()));
		this._setContainerPosition(pos.add(anchor), this._container.style.transformOrigin);
	},
	_adjustPan() {
		if (!this.options.autoPan) return;
		this._map._panAnim?.stop();
		if (this._autopanning) {
			this._autopanning = false;
			return;
		}
		const map = this._map, marginBottom = this._containerMarginBottom ?? (parseInt(getComputedStyle(this._container).marginBottom, 10) || 0), containerHeight = this._containerHeight + marginBottom, containerWidth = this._containerWidth, topLeft = new Point(this._containerLeft, -containerHeight - this._containerBottom);
		const containerPos = map.layerPointToContainerPoint(this._getContainerPosition())._add(topLeft), padding = Point.from(this.options.autoPanPadding), paddingTL = Point.from(this.options.autoPanPaddingTopLeft ?? padding), paddingBR = Point.from(this.options.autoPanPaddingBottomRight ?? padding), size = map.getSize();
		let dx = 0, dy = 0;
		if (containerPos.x + containerWidth + paddingBR.x > size.x) dx = containerPos.x + containerWidth - size.x + paddingBR.x;
		if (containerPos.x - dx - paddingTL.x < 0) dx = containerPos.x - paddingTL.x;
		if (containerPos.y + containerHeight + paddingBR.y > size.y) dy = containerPos.y + containerHeight - size.y + paddingBR.y;
		if (containerPos.y - dy - paddingTL.y < 0) dy = containerPos.y - paddingTL.y;
		if (dx || dy) {
			if (this.options.keepInView) this._autopanning = true;
			map.fire("autopanstart").panBy([dx, dy]);
		}
	}
});
const tooltipMargins = {
	top: [0, -6],
	bottom: [0, 6],
	left: [-6, 0],
	right: [6, 0]
};
/** @typedef {typeof tooltipRotationMethods} TooltipMapRotationMethods */
Tooltip.include({ _setPosition(pos) {
	setTooltipPosition.call(this, pos);
	const container = this._container;
	if (this.options.overflow) return;
	if (!this._map._bearing) {
		container.style.left = container.style.top = "";
		return;
	}
	const delta = this._containerPos.subtract(pos), direction = Object.keys(tooltipMargins).find((d) => container.classList.contains(`maplair-tooltip-${d}`)), margin = tooltipMargins[direction] ?? [0, 0];
	container.style.left = `${delta.x}px`;
	container.style.top = `${delta.y}px`;
	this._setContainerPosition(pos, `${-delta.x - margin[0]}px ${-delta.y - margin[1]}px`);
} });
/**
* Options of `Marker` for the map rotation.
* @typedef {object} MarkerMapRotationOptions
* @lends MarkerOptions
* @property {boolean} [rotateWithView=false] On a rotated map (see
* `MaplairMap.setBearing()`), whether the icon rotates with the map (e.g. for arrows
* pointing in a geographic direction) instead of staying upright. The `rotation` of
* the marker is relative to the screen, or to north with `rotateWithView`.
*/
Marker.include({ options: { rotateWithView: false } });
/** @typedef {typeof markerRotationMethods} MarkerMapRotationMethods */
Marker.include({
	/**
	* Overrides `getEvents()` of `Marker` to update the marker on rotation.
	* @internal
	* @returns {Record<string, Function>}
	*/
	getEvents() {
		return {
			...getMarkerEvents.call(this),
			rotate: this.update
		};
	},
	_positionElements(pos) {
		positionMarkerElements.call(this, pos);
		const bearing = this.options.rotateWithView ? 0 : this._map?.getBearing() ?? 0;
		if (!bearing) return;
		for (const el of [this._icon, this._shadow]) if (el) el.style.transform += ` rotate(${bearing}deg)`;
	}
});
/** @typedef {typeof markerDragRotationMethods} MarkerDragMapRotationMethods */
MarkerDrag.include({ _adjustPan(e) {
	const marker = this._marker, map = marker._map, speed = this._marker.options.autoPanSpeed, padding = this._marker.options.autoPanPadding, iconPos = getPosition(marker._icon), bounds = map.getPixelBounds(), origin = map.getPixelOrigin();
	const panBounds = new Bounds(bounds.min._subtract(origin).add(padding), bounds.max._subtract(origin).subtract(padding));
	if (!panBounds.contains(iconPos)) {
		const movement = new Point((Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) - (Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x), (Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) - (Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)).multiplyBy(speed);
		map.panBy(map._rotateToContainer(movement), { animate: false });
		this._draggable._newPos._add(movement);
		this._draggable._startPos._add(movement);
		setPosition(marker._icon, this._draggable._newPos);
		this._onDrag(e);
		this._panRequest = requestAnimationFrame(this._adjustPan.bind(this, e));
	}
} });
/** @typedef {typeof draggableRotationMethods} DraggableMapRotationMethods */
Draggable.include({
	_onDown(e) {
		onDraggableDown.call(this, e);
		const rotatePane = this._element.closest?.(".maplair-rotate-pane");
		this._rotatedMap = rotatePane && rotatedMaps.get(rotatePane);
		if (this._rotatedMap && this._parentScale) this._parentScale = getScale(rotatePane.parentNode);
	},
	_updatePosition() {
		const map = this._rotatedMap;
		if (map?._bearing) this._newPos = this._startPos.add(map._rotateToPane(this._newPos.subtract(this._startPos)));
		updateDraggablePosition.call(this);
	}
});
/** @typedef {typeof dragHandlerRotationMethods} DragHandlerMapRotationMethods */
DragHandler.include({ _onDragEnd(e) {
	const map = this._map, options = map.options, noInertia = !options.inertia || e.noInertia || this._times.length < 2;
	map.fire("dragend", e);
	if (noInertia) map.fire("moveend");
	else {
		this._prunePositions(Date.now());
		const direction = this._lastPos.subtract(this._positions[0]), duration = (this._lastTime - this._times[0]) / 1e3, ease = options.easeLinearity, speedVector = direction.multiplyBy(ease / duration), speed = speedVector.distanceTo([0, 0]), limitedSpeed = Math.min(options.inertiaMaxSpeed, speed), limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed), maxOffset = map.getSize().divideBy(2);
		let decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease), offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();
		if (map._prefersReducedMotion() && !maxOffset.contains(offset)) {
			const k = Math.min(maxOffset.x / Math.abs(offset.x), maxOffset.y / Math.abs(offset.y));
			offset = offset.multiplyBy(k).round();
			decelerationDuration *= Math.sqrt(k);
		}
		if (!offset.x && !offset.y) map.fire("moveend");
		else {
			offset = map._limitOffset(offset, map.options.maxBounds);
			requestAnimationFrame(() => {
				map.panBy(map._rotateToContainer(offset), {
					duration: decelerationDuration,
					easeLinearity: ease,
					noMoveStart: true,
					animate: true
				});
			});
		}
	}
} });
const gestureEndDelay = 150;
const rotateThreshold = 15;
function angleOf(p1, p2) {
	return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}
/** @typedef {typeof pinchZoomHandlerRotationMethods} PinchZoomHandlerMapRotationMethods */
PinchZoomHandler.include({
	_onPointerStart(e) {
		onPinchStart.call(this, e);
		const pointers = getPointers();
		if (this._zooming && pointers.length === 2) {
			this._startAngle = angleOf(...pointers.map((p) => this._map.pointerEventToContainerPoint(p)));
			this._startBearing = this._map.getBearing();
			this._rotating = false;
		}
	},
	_onPointerMove(e) {
		const pointers = getPointers();
		if (pointers.length !== 2 || !this._zooming) return;
		const map = this._map, p1 = map.pointerEventToContainerPoint(pointers[0]), p2 = map.pointerEventToContainerPoint(pointers[1]), scale = p1.distanceTo(p2) / this._startDist;
		this._zoom = map.getScaleZoom(scale, this._startZoom);
		if (map.options.pinchRotate) {
			let delta = (angleOf(p1, p2) - this._startAngle + 540) % 360 - 180;
			if (!this._rotating && Math.abs(delta) > rotateThreshold) {
				this._rotating = true;
				this._startAngle += Math.sign(delta) * rotateThreshold;
				delta -= Math.sign(delta) * rotateThreshold;
			}
			if (this._rotating) map._rotate(this._startBearing - delta);
		}
		if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale < 1 || this._zoom > map.getMaxZoom() && scale > 1)) this._zoom = map._limitZoom(this._zoom);
		if (map.options.pinchZoom === "center") {
			this._center = this._startLatLng;
			if (scale === 1 && !this._rotating) return;
		} else {
			const delta = map._rotateToPane(p1._add(p2)._divideBy(2)._subtract(this._centerPoint));
			if (scale === 1 && delta.x === 0 && delta.y === 0 && !this._rotating) return;
			this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
		}
		if (!this._moved) {
			map._setUserEvent(e);
			map._moveStart(true, false);
			this._moved = true;
		}
		cancelAnimationFrame(this._animRequest);
		const moveFn = map._move.bind(map, this._center, this._zoom, {
			pinch: true,
			round: false
		}, void 0);
		this._animRequest = requestAnimationFrame(moveFn.bind(this));
		e.preventDefault();
	}
});
/** @typedef {typeof tapDragZoomHandlerRotationMethods} TapDragZoomHandlerMapRotationMethods */
TapDragZoomHandler.include({ _onDown(e) {
	onTapDragDown.call(this, e);
	if (this._zooming && this._aroundOffset) this._aroundOffset = this._map._rotateToPane(this._aroundOffset);
} });
/** @typedef {typeof scrollWheelZoomHandlerRotationMethods} ScrollWheelZoomHandlerMapRotationMethods */
ScrollWheelZoomHandler.include({
	_pinchTo(e, zoom, eased) {
		pinchTo.call(this, e, zoom, eased);
		if (this._pinch && !this._pinch.rotated) {
			this._pinch.offset = this._map._rotateToPane(this._pinch.offset);
			this._pinch.rotated = true;
		}
	},
	_panBy(e) {
		stop(e);
		const map = this._map;
		if (map._animatingZoom) return;
		const factor = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 60 : 1;
		let offset = new Point(e.deltaX * factor, e.deltaY * factor);
		if (e.shiftKey && !e.deltaX) offset = new Point(offset.y, 0);
		offset = map._rotateToPane(offset);
		if (map.options.maxBounds) offset = map._limitOffset(offset, map.options.maxBounds);
		if (!this._panning) {
			map._stop();
			this._panning = true;
			map._setUserEvent(e);
			map.fire("movestart");
		}
		map._rawPanBy(offset.round());
		map.fire("move");
		clearTimeout(this._panTimer);
		this._panTimer = setTimeout(this._endPan.bind(this), gestureEndDelay);
	}
});
// src/layer/marker/Marker.Move.js
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/**
* Options of the movement of markers, see `moveAlong()`.
* @typedef {object} MarkerMovementOptions
* @property {number} [duration=1000] The duration of the movement in milliseconds.
* @property {number} [speed] The speed in meters (or units of the CRS) per second
* instead of the `duration`.
* @property {boolean} [rotate=false] Whether to set the `rotation` of the marker to
* the heading of the movement (for icons pointing up).
*/
const { onRemove } = Marker.prototype;
/** @typedef {typeof markerMoveMethods} MarkerMoveMethods */
Marker.include({
	/**
	* Moves the marker smoothly to `latlng`, see `moveAlong()`.
	* @group Marker movement
	* @param {LatLngExpression} latlng
	* @param {MarkerMovementOptions} [options]
	* @returns {this}
	*/
	moveTo(latlng, options) {
		return this.moveAlong([latlng], options);
	},
	/**
	* Moves the marker smoothly along the given points, frame by frame at a constant
	* speed, e.g. to follow a vehicle or to replay a track. Fires `move` with each
	* frame and `moveend` at the end. A new movement or `stopMoving()` stops it; with
	* [reduced motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion),
	* the marker jumps to the end.
	* Inspired by the [Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker)
	* and [Leaflet.AnimatedMarker](https://github.com/openplans/Leaflet.AnimatedMarker) plugins.
	* @group Marker movement
	* @param {LatLngExpression[]} latlngs
	* @param {MarkerMovementOptions} [options]
	* @returns {this}
	*/
	moveAlong(latlngs, options = {}) {
		this.stopMoving();
		const points = [this._latlng, ...latlngs.map((latlng) => LatLng.from(latlng))], lengths = points.slice(1).map((point, i) => this._map?.distance(points[i], point) ?? points[i].distanceTo(point)), total = lengths.reduce((sum, length) => sum + length, 0), duration = options.speed ? total / options.speed * 1e3 : options.duration ?? 1e3, start = performance.now();
		const frame = () => {
			let distance = duration && !this._map?._prefersReducedMotion() ? Math.min(1, (performance.now() - start) / duration) * total : total, i = 0;
			const moved = distance;
			while (i < lengths.length - 1 && distance > lengths[i]) {
				distance -= lengths[i];
				i++;
			}
			const from = points[i], to = points[i + 1];
			if (options.rotate && !from.equals(to)) this.options.rotation = this._heading(from, to);
			this.setLatLng(this._interpolate(from, to, lengths[i] ? Math.min(1, distance / lengths[i]) : 1));
			if (moved < total) this._moveFrame = requestAnimationFrame(frame);
			else {
				this._moveFrame = null;
				this.fire("moveend");
			}
		};
		this._moveFrame = requestAnimationFrame(frame);
		return this;
	},
	/**
	* Stops the movement of `moveTo()` or `moveAlong()`.
	* @group Marker movement
	* @returns {this}
	*/
	stopMoving() {
		cancelAnimationFrame(this._moveFrame);
		this._moveFrame = null;
		return this;
	},
	/**
	* Returns `true` while the marker moves with `moveTo()` or `moveAlong()`.
	* @group Marker movement
	* @returns {boolean}
	*/
	isMoving() {
		return !!this._moveFrame;
	},
	_interpolate(from, to, t) {
		const crs = this._map?.options.crs;
		if (!crs) return new LatLng(from.lat + (to.lat - from.lat) * t, from.lng + (to.lng - from.lng) * t);
		const a = crs.projection.project(from), b = crs.projection.project(to);
		return crs.projection.unproject(a.add(b.subtract(a).multiplyBy(t)));
	},
	_heading(from, to) {
		const crs = this._map?.options.crs, a = crs ? crs.latLngToPoint(from, 0) : new Point(from.lng, -from.lat), b = crs ? crs.latLngToPoint(to, 0) : new Point(to.lng, -to.lat);
		return Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI - (this.options.rotateWithView ? 0 : this._map?.getBearing?.() ?? 0);
	},
	/**
	* Stops the movement when the marker is removed from the map.
	* @internal
	* @param {MaplairMap} map
	*/
	onRemove(map) {
		this.stopMoving();
		return onRemove.call(this, map);
	}
});
// src/layer/vector/Path.DashAnimation.js
const DASH_SEPARATOR_RE = /[ ,]+/;
const { _updateStyle: updateSvgStyle$1 } = SVG.prototype, { _fillStroke: fillStroke, _destroyContainer: destroyCanvasContainer } = Canvas.prototype;
/**
* Options of `Path` for the animation of dashes. The animation of dashes is an
* optional feature: import this module to add the `dashSpeed` option to `Path`.
*
* ```js
* import 'maplair/dash-animation';
*
* new Polyline(latlngs, {dashArray: '10, 10', dashSpeed: 20}).addTo(map);
* ```
*
* Inspired by the [leaflet-ant-path](https://github.com/rubenspgcavalcante/leaflet-ant-path) plugin.
* @typedef {object} DashAnimationPathOptions
* @lends PathOptions
* @property {number} [dashSpeed=0] Animates the dashes of the `dashArray` along the
* path ("marching ants"), e.g. to show the direction of a flow: the speed in pixels per
* second, negative for the opposite direction. Not animated with
* [reduced motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion).
*/
Path.include({
	options: { dashSpeed: 0 },
	_getDashLength() {
		const dashArray = this.options.dashArray, values = (Array.isArray(dashArray) ? dashArray : String(dashArray ?? "").split(DASH_SEPARATOR_RE)).map(Number).filter((n) => !Number.isNaN(n)), length = values.reduce((sum, value) => sum + value, 0);
		return values.length % 2 ? length * 2 : length;
	}
});
SVG.include({ _updateStyle(layer) {
	updateSvgStyle$1.call(this, layer);
	const path = layer._path;
	if (!path) return;
	const speed = layer.options.dashSpeed, dashLength = layer.options.stroke && speed && layer._getDashLength();
	path.classList.toggle("maplair-dash-animated", !!dashLength);
	if (dashLength) {
		path.style.setProperty("--maplair-dash-length", `${Math.sign(speed) * dashLength}px`);
		path.style.setProperty("--maplair-dash-duration", `${dashLength / Math.abs(speed)}s`);
	}
} });
Canvas.include({
	_fillStroke(ctx, layer) {
		const shift = this._getDashShift(layer);
		if (!shift) {
			fillStroke.call(this, ctx, layer);
			return;
		}
		const options = layer.options, own = Object.hasOwn(options, "dashOffset"), dashOffset = options.dashOffset;
		setOptions(layer, { dashOffset: Number(dashOffset ?? 0) - shift });
		fillStroke.call(this, ctx, layer);
		if (own) options.dashOffset = dashOffset;
		else delete options.dashOffset;
	},
	_destroyContainer() {
		cancelAnimationFrame(this._dashFrame);
		this._dashFrame = null;
		destroyCanvasContainer.call(this);
	},
	_getDashShift(layer) {
		const speed = layer.options.dashSpeed, length = speed && !this._map._prefersReducedMotion() && layer._getDashLength();
		if (!length) return 0;
		this._animatedDashes ??= /* @__PURE__ */ new Set();
		this._animatedDashes.add(layer);
		this._dashFrame ??= requestAnimationFrame(() => {
			this._dashFrame = null;
			for (const animated of this._animatedDashes) if (this._layers[stamp(animated)] && animated.options.dashSpeed) this._requestRedraw(animated);
			this._animatedDashes.clear();
		});
		return performance.now() / 1e3 * speed % length;
	}
});
// src/layer/vector/Polyline.Decorations.js
/**
* Options of `Path` for arrowheads and text along lines (for `Polyline`s and
* `Polygon`s). They are an optional feature: import this module to add the
* `arrowheads` and `text` options to `Path`.
*
* ```js
* import 'maplair/path-decorations';
*
* new Polyline(latlngs, {arrowheads: true, text: {content: 'Main Street', center: true}}).addTo(map);
* ```
*
* Inspired by the [Leaflet.PolylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator)
* and [Leaflet.TextPath](https://github.com/makinacorpus/Leaflet.TextPath) plugins.
* @typedef {object} PathDecorationsOptions
* @lends PathOptions
* @property {boolean|{size?: number, repeat?: number, color?: string}} [arrowheads=false]
* Arrowheads along a polyline: `true` for one at the end of each line, or an object
* with the `size` (in pixels, default `10`), `repeat` (an arrowhead every that many
* pixels instead) and `color` (default: the `color` of the path).
* @property {string|{content: string, repeat?: boolean, center?: boolean, offset?: number, fontSize?: number, color?: string}|null} [text=null]
* Text along a polyline, e.g. a street name: the text, or an object with the
* `content`, `repeat` (repeat the text along the whole line), `center` (center it on
* the line), `offset` (in pixels, perpendicular to the line), `fontSize` (in pixels,
* default `12`) and `color` (default: the `color` of the path).
*/
function pointAlong(ring, distance) {
	for (let i = 1; i < ring.length; i++) {
		const a = ring[i - 1], b = ring[i], length = a.distanceTo(b);
		if (distance <= length || i === ring.length - 1) {
			const t = length ? Math.min(1, distance / length) : 0;
			return {
				point: new Point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t),
				angle: Math.atan2(b.y - a.y, b.x - a.x)
			};
		}
		distance -= length;
	}
	return {
		point: ring[0],
		angle: 0
	};
}
function ringLength(ring) {
	let length = 0;
	for (let i = 1; i < ring.length; i++) length += ring[i - 1].distanceTo(ring[i]);
	return length;
}
const { _setPath: setSvgPath, _updateStyle: updateSvgStyle, _addPath: addSvgPath, _removePath: removeSvgPath, _bringToFront: bringSvgToFront, _bringToBack: bringSvgToBack } = SVG.prototype, { _updatePoly: updateCanvasPoly, _extendRedrawBounds: extendCanvasRedrawBounds } = Canvas.prototype;
Path.include({ options: {
	arrowheads: false,
	text: null
} });
Polyline.include({
	_getArrowheadOptions() {
		const arrowheads = this.options.arrowheads;
		return arrowheads ? {
			size: 10,
			repeat: 0,
			...arrowheads === true ? {} : arrowheads
		} : null;
	},
	_getTextOptions() {
		const text = this.options.text;
		return text ? {
			repeat: false,
			center: false,
			offset: 0,
			fontSize: 12,
			...typeof text === "string" ? { content: text } : text
		} : null;
	},
	_getDecorationPadding() {
		const text = this._getTextOptions();
		return (this._getArrowheadOptions()?.size ?? 0) + (text ? text.fontSize + Math.abs(text.offset) : 0);
	},
	_getArrowheads() {
		const { size, repeat } = this._getArrowheadOptions(), triangles = [];
		for (const ring of this._rings) {
			if (ring.length < 2) continue;
			const length = ringLength(ring), distances = [];
			if (repeat > 0) for (let d = repeat; d <= length; d += repeat) distances.push(d);
			else distances.push(length);
			for (const distance of distances) {
				const { point, angle } = pointAlong(ring, distance), dx = Math.cos(angle), dy = Math.sin(angle), base = new Point(point.x - dx * size, point.y - dy * size), half = size / 2;
				triangles.push([
					point,
					new Point(base.x - dy * half, base.y + dx * half),
					new Point(base.x + dy * half, base.y - dx * half)
				]);
			}
		}
		return triangles;
	},
	_getTextPlacements(measure) {
		const text = this._getTextOptions(), placements = [];
		if (!text) return placements;
		const width = measure(text.content);
		for (const ring of this._parts) {
			const length = ringLength(ring);
			if (!width || width > length) continue;
			let start = text.center ? (length - width) / 2 : 0;
			const end = text.repeat ? length - width : start;
			for (; start <= end + 1e-9; start += width) {
				let distance = start;
				for (const char of text.content) {
					const charWidth = measure(char);
					placements.push({
						char,
						width: charWidth,
						...pointAlong(ring, distance + charWidth / 2)
					});
					distance += charWidth;
				}
			}
		}
		return placements;
	}
});
SVG.include({
	_setPath(layer, path) {
		setSvgPath.call(this, layer, path);
		this._updateDecorations(layer);
	},
	_updateStyle(layer) {
		updateSvgStyle.call(this, layer);
		if (layer._rings) this._updateDecorations(layer);
	},
	_addPath(layer) {
		addSvgPath.call(this, layer);
		this._updateDecorations(layer);
	},
	_removePath(layer) {
		removeSvgPath.call(this, layer);
		layer._arrowheads?.remove();
		layer._text?.remove();
	},
	_bringToFront(layer) {
		bringSvgToFront.call(this, layer);
		this._placeDecorations(layer);
	},
	_bringToBack(layer) {
		bringSvgToBack.call(this, layer);
		this._placeDecorations(layer);
	},
	_updateDecorations(layer) {
		const path = layer._path, options = layer.options, arrowheads = layer._getArrowheadOptions?.(), text = layer._getTextOptions?.();
		if (!path) return;
		if (arrowheads) {
			const el = layer._arrowheads ??= SVG.create("path");
			el.setAttribute("class", "maplair-path-arrowheads");
			el.setAttribute("d", layer._getArrowheads().map(([a, b, c]) => `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}z`).join("") || "M0 0");
			el.setAttribute("fill", arrowheads.color ?? options.color);
			el.setAttribute("fill-opacity", options.opacity);
		} else {
			layer._arrowheads?.remove();
			layer._arrowheads = null;
		}
		if (text) {
			path.id ||= `maplair-path-${stamp(layer)}`;
			const el = layer._text ??= SVG.create("text"), textPath = el.firstChild ?? el.appendChild(SVG.create("textPath"));
			el.setAttribute("class", "maplair-path-text");
			el.setAttribute("fill", text.color ?? options.color);
			el.setAttribute("font-size", text.fontSize);
			el.setAttribute("dy", text.offset);
			textPath.setAttribute("href", `#${path.id}`);
			if (text.center) {
				textPath.setAttribute("startOffset", "50%");
				textPath.setAttribute("text-anchor", "middle");
			} else {
				textPath.removeAttribute("startOffset");
				textPath.removeAttribute("text-anchor");
			}
			textPath.textContent = text.content;
			this._placeDecorations(layer);
			if (text.repeat && path.isConnected) {
				const single = el.getComputedTextLength();
				textPath.textContent = text.content + text.content;
				const textLength = el.getComputedTextLength() - single, count = textLength > 0 ? Math.floor((path.getTotalLength() - single + textLength) / textLength) : 1;
				textPath.textContent = Array(Math.max(1, count)).fill(text.content).join("");
			}
		} else {
			layer._text?.remove();
			layer._text = null;
		}
		this._placeDecorations(layer);
	},
	_placeDecorations(layer) {
		const decorations = [layer._arrowheads, layer._text].filter(Boolean);
		if (decorations.length && layer._path.parentNode) layer._path.after(...decorations);
	}
});
Canvas.include({
	_updatePoly(layer, closed) {
		updateCanvasPoly.call(this, layer, closed);
		if (this._drawing && layer._parts.length) this._drawDecorations(this._ctx, layer);
	},
	_extendRedrawBounds(layer) {
		extendCanvasRedrawBounds.call(this, layer);
		const padding = layer._getDecorationPadding?.();
		if (padding && layer._pxBounds) {
			const extent = (layer.options.weight ?? 0) + 1 + padding;
			this._redrawBounds.extend(layer._pxBounds.min.subtract([extent, extent]));
			this._redrawBounds.extend(layer._pxBounds.max.add([extent, extent]));
		}
	},
	_drawDecorations(ctx, layer) {
		const options = layer.options, arrowheads = layer._getArrowheadOptions?.(), text = layer._getTextOptions?.();
		if (arrowheads) {
			ctx.beginPath();
			for (const [a, b, c] of layer._getArrowheads()) {
				ctx.moveTo(a.x, a.y);
				ctx.lineTo(b.x, b.y);
				ctx.lineTo(c.x, c.y);
				ctx.closePath();
			}
			ctx.globalAlpha = options.opacity;
			ctx.fillStyle = arrowheads.color ?? options.color;
			ctx.fill();
		}
		if (text) {
			ctx.globalAlpha = 1;
			ctx.fillStyle = text.color ?? options.color;
			ctx.font = `${text.fontSize}px sans-serif`;
			ctx.textBaseline = "alphabetic";
			for (const { char, width, point, angle } of layer._getTextPlacements((t) => ctx.measureText(t).width)) {
				ctx.save();
				ctx.translate(point.x, point.y);
				ctx.rotate(angle);
				ctx.fillText(char, -width / 2, text.offset);
				ctx.restore();
			}
		}
	}
});
// src/layer/GeoJSON.Load.js
/** @import {GeoJsonObject} from 'geojson' */
/** @import {MaplairEvent} from '../core/Events.js' */
/**
* Options of `GeoJSON` for loading GeoJSON from a URL, added by importing this module.
* @typedef {object} GeoJSONLoadOptions
* @lends GeoJSONOptions
* @property {string} [url=undefined] A URL to [load](#geojson-load) the GeoJSON data
* from when creating the layer.
* @property {RequestInit} [fetchOptions=undefined] Options for
* [`fetch()`](https://developer.mozilla.org/docs/Web/API/Window/fetch) when loading,
* e.g. `{headers: {Authorization: 'Bearer …'}}`.
* @property {boolean} [fitBounds=false] Whether to fit the map to the bounds of the
* data once loaded.
*/
GeoJSON.include({ options: {
	url: void 0,
	fetchOptions: void 0,
	fitBounds: false
} });
/** @typedef {typeof geoJSONLoadMethods} GeoJSONLoadMethods */
GeoJSON.include({ 
/**
* Loads GeoJSON data from a URL (or a promise of the data) and replaces the
* layers with it. A running load is aborted. Returns a promise of this layer.
* @group Loading GeoJSON
* @param {string|Promise<GeoJsonObject|GeoJsonObject[]>} source
* @param {RequestInit} [fetchOptions] Defaults to the `fetchOptions` option.
* @returns {Promise<this>}
*/
load(source, fetchOptions = this.options.fetchOptions) {
	this._loadAbort?.abort();
	const controller = this._loadAbort = new AbortController(), data = typeof source === "string" ? fetch(source, {
		...fetchOptions,
		signal: controller.signal
	}).then((response) => {
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		return response.json();
	}) : source;
	this.fire("loading");
	return Promise.resolve(data).then((geojson) => {
		if (controller.signal.aborted) return this;
		this._loadAbort = null;
		this.clearLayers().addData(geojson);
		if (this.options.fitBounds && this._map && this.getBounds().isValid()) this._map.fitBounds(this.getBounds());
		this.fire("load", { data: geojson });
		return this;
	}, (error) => {
		if (controller.signal.aborted) return this;
		this._loadAbort = null;
		this.fire("error", { error });
		throw error;
	});
} });
GeoJSON.addInitHook(function() {
	if (this.options.url) this.load(this.options.url).catch(() => {});
});
// src/layer/vector/Path.ZoomStyles.js
/**
* A zoom-dependent style value, of the `weight` option of paths and the `radius` of
* circle markers: either a function of the zoom or an object of zoom stops
* `{zoom: value}`, using the value of the highest stop not above the zoom (or of the
* lowest stop). The styles are updated on `zoomend`.
*
* Zoom-dependent styles are an optional feature, like the zoom expressions of
* MapLibre: import this module to let the `weight` and `radius` options depend on the
* zoom.
*
* ```js
* import 'maplair/zoom-styles';
*
* new CircleMarker(latlng, {radius: {5: 3, 10: 6, 15: 10}}).addTo(map);
* new Polyline(latlngs, {weight: zoom => zoom / 2}).addTo(map);
* ```
* @typedef {number|Record<number, number>|((zoom: number) => number)} ZoomStyle
*/
const zoomStyleNames = ["weight", "radius"];
function evaluate(stops, zoom) {
	if (typeof stops === "function") return stops(zoom);
	const zooms = Object.keys(stops).map(Number).sort((a, b) => a - b);
	return stops[zooms.findLast((z) => z <= zoom) ?? zooms[0]];
}
const { beforeAdd, setStyle } = Path.prototype, { setRadius } = CircleMarker.prototype;
Path.include({
	getEvents() {
		return { zoomend: this._updateZoomStyles };
	},
	beforeAdd(map) {
		beforeAdd.call(this, map);
		this._applyZoomStyles(map.getZoom());
	},
	setStyle(style) {
		this._takeZoomStyles(style);
		const zoom = this._map?.getZoom();
		if (style && this._zoomStyles && zoom !== void 0) {
			style = { ...style };
			for (const [name, stops] of Object.entries(this._zoomStyles)) if (Object.hasOwn(style, name)) style[name] = evaluate(stops, zoom);
		}
		return setStyle.call(this, style);
	},
	_takeZoomStyles(style) {
		for (const name of zoomStyleNames) {
			if (!style || !Object.hasOwn(style, name)) continue;
			const value = style[name];
			if (value && (typeof value === "function" || typeof value === "object")) this._zoomStyles = {
				...this._zoomStyles,
				[name]: value
			};
			else if (this._zoomStyles) delete this._zoomStyles[name];
		}
	},
	_applyZoomStyles(zoom) {
		if (!this._zoomStyles) return;
		const values = {};
		for (const [name, stops] of Object.entries(this._zoomStyles)) values[name] = evaluate(stops, zoom);
		setStyle.call(this, values);
		if (values.radius !== void 0 && this.setRadius) setRadius.call(this, values.radius);
	},
	_updateZoomStyles() {
		this._applyZoomStyles(this._map.getZoom());
	}
});
CircleMarker.include({ setRadius(radius) {
	this._takeZoomStyles({ radius });
	return this._zoomStyles?.radius && this._map ? setRadius.call(this, evaluate(radius, this._map.getZoom())) : setRadius.call(this, radius);
} });
Path.addInitHook(function() {
	this._takeZoomStyles(this.options);
});
export { AttributionControl, BlanketOverlay, Bounds, BoxZoomHandler, ButtonBarControl, ButtonControl, CRS, Canvas, Circle, CircleMarker, Class, Classification, ContextMenu, Control, DefaultIcon, DisplaceHandler, DivIcon, DivOverlay, DomEvent_exports as DomEvent, DomUtil_exports as DomUtil, DoubleClickZoomHandler, DragHandler, Draggable, EPSG3395, EPSG3857, EPSG4326, EPSG900913, EarthCRS, Evented, FeatureGroup, FullscreenControl, GeoJSON, GridLayer, Handler, Hash, HeatLayer, I18n, Icon, ImageOverlay, KeyboardHandler, LatLng, LatLngBounds, Layer, LayerGroup, LayersControl, MaplairMap as LeafletMap, MaplairMap as Map, MaplairMap, LegendControl, LineUtil_exports as LineUtil, MapSync, Marker, MarkerClusterGroup, MiniMapControl, Path, PinchZoomHandler, Point, PolyUtil_exports as PolyUtil, Polygon, Polyline, Popup, projection_exports as Projection, Rectangle, Renderer, RotateControl, SVG, SVGOverlay, ScaleControl, ScrollWheelZoomHandler, SearchControl, SideBySideControl, SimpleCRS, SvgIcon, TapDragZoomHandler, TapHoldHandler, TextControl, TileLayer, TimeControl, Tooltip, Transformation, Util_exports as Util, VideoOverlay, WMSTileLayer, ZoomControl, displace, version };

//# sourceMappingURL=maplair-src.js.map