import { formatNum } from "../core/Util.js";
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
export { Point };

//# sourceMappingURL=Point.js.map