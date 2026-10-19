import {Point} from './Point.js';
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
export class Bounds {
	/**
	 * Creates a Bounds object from two corners coordinate pairs. Alternatively, creates a
	 * Bounds object from the given array of points, or a copy of the given Bounds object.
	 * @param {PointExpression|BoundsExpression} [a] The first corner, the points or the
	 * bounds to copy.
	 * @param {PointExpression} [b] The opposite corner.
	 */
	constructor(a, b) {
		if (!a) { return; }

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
		for (const point of points) {
			this.extend(point);
		}
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
		if (!obj) { return this; }

		if (obj instanceof Point || typeof obj[0] === 'number' || 'x' in obj) {
			min2 = max2 = Point.from(obj);
		} else {
			obj = Bounds.from(obj);
			min2 = obj.min;
			max2 = obj.max;

			if (!min2 || !max2) { return this; }
		}

		if (!this.min && !this.max) {
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
		return new Point(
			(this.min.x + this.max.x) / 2,
			(this.min.y + this.max.y) / 2, round);
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
	getTopRight() { // -> Point
		return new Point(this.max.x, this.min.y);
	}

	/**
	 * Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
	 * @returns {Point}
	 */
	getTopLeft() {
		return this.min; // left, top
	}

	/**
	 * Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
	 * @returns {Point}
	 */
	getBottomRight() {
		return this.max; // right, bottom
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

		if (typeof obj[0] === 'number' || obj instanceof Point) {
			obj = Point.from(obj);
		} else {
			obj = Bounds.from(obj);
		}

		if (obj instanceof Bounds) {
			min = obj.min;
			max = obj.max;
		} else {
			min = max = obj;
		}

		return (min.x >= this.min.x) &&
		       (max.x <= this.max.x) &&
		       (min.y >= this.min.y) &&
		       (max.y <= this.max.y);
	}

	/**
	 * Returns `true` if the rectangle intersects the given bounds. Two bounds
	 * intersect if they have at least one point in common.
	 * @param {BoundsExpression} bounds
	 * @returns {boolean}
	 */
	intersects(bounds) { // (Bounds) -> Boolean
		bounds = Bounds.from(bounds);

		const min = this.min,
		max = this.max,
		min2 = bounds.min,
		max2 = bounds.max,
		xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
		yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

		return xIntersects && yIntersects;
	}

	/**
	 * Returns `true` if the rectangle overlaps the given bounds. Two bounds
	 * overlap if their intersection is an area.
	 * @param {BoundsExpression} bounds
	 * @returns {boolean}
	 */
	overlaps(bounds) { // (Bounds) -> Boolean
		bounds = Bounds.from(bounds);

		const min = this.min,
		max = this.max,
		min2 = bounds.min,
		max2 = bounds.max,
		xOverlaps = (max2.x > min.x) && (min2.x < max.x),
		yOverlaps = (max2.y > min.y) && (min2.y < max.y);

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
		const min = this.min,
		max = this.max,
		heightBuffer = Math.abs(min.x - max.x) * bufferRatio,
		widthBuffer = Math.abs(min.y - max.y) * bufferRatio;


		return new Bounds(
			new Point(min.x - heightBuffer, min.y - widthBuffer),
			new Point(max.x + heightBuffer, max.y + widthBuffer));
	}


	/**
	 * Returns `true` if the rectangle is equivalent to the given bounds.
	 * @param {BoundsExpression} bounds
	 * @returns {boolean}
	 */
	equals(bounds) {
		if (!bounds) { return false; }

		bounds = Bounds.from(bounds);

		return this.min.equals(bounds.getTopLeft()) &&
			this.max.equals(bounds.getBottomRight());
	}
}
