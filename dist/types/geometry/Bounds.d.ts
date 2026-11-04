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
     * Returns the given `Bounds` object as it is, or else a new `Bounds` object created
     * from the given arguments (the same as of the constructor) — unlike the
     * constructor, which always creates a new object.
     * @param {PointExpression|BoundsExpression} [a] The first corner, the points or the
     * bounds.
     * @param {PointExpression} [b] The opposite corner.
     * @returns {Bounds}
     */
    static from(a?: PointExpression | BoundsExpression, b?: PointExpression): Bounds;
    /**
     * Creates a Bounds object from two corners coordinate pairs. Alternatively, creates a
     * Bounds object from the given array of points, or a copy of the given Bounds object.
     * @param {PointExpression|BoundsExpression} [a] The first corner, the points or the
     * bounds to copy.
     * @param {PointExpression} [b] The opposite corner.
     */
    constructor(a?: PointExpression | BoundsExpression, b?: PointExpression);
    /**
     * The top left corner of the rectangle.
     * @type {Point}
     */
    min: Point;
    /**
     * The bottom right corner of the rectangle.
     * @type {Point}
     */
    max: Point;
    /**
     * Extends the bounds to contain the given point or bounds.
     * @param {PointExpression|BoundsExpression} obj
     * @returns {this}
     */
    extend(obj: PointExpression | BoundsExpression): this;
    /**
     * Returns the center point of the bounds.
     * @param {boolean} [round]
     * @returns {Point}
     */
    getCenter(round?: boolean): Point;
    /**
     * Returns the bottom-left point of the bounds.
     * @returns {Point}
     */
    getBottomLeft(): Point;
    /**
     * Returns the top-right point of the bounds.
     * @returns {Point}
     */
    getTopRight(): Point;
    /**
     * Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
     * @returns {Point}
     */
    getTopLeft(): Point;
    /**
     * Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
     * @returns {Point}
     */
    getBottomRight(): Point;
    /**
     * Returns the size of the given bounds.
     * @returns {Point}
     */
    getSize(): Point;
    /**
     * Returns `true` if the rectangle contains the given bounds or point.
     * @param {BoundsExpression|PointExpression} obj
     * @returns {boolean}
     */
    contains(obj: BoundsExpression | PointExpression): boolean;
    /**
     * Returns `true` if the rectangle intersects the given bounds. Two bounds
     * intersect if they have at least one point in common.
     * @param {BoundsExpression} bounds
     * @returns {boolean}
     */
    intersects(bounds: BoundsExpression): boolean;
    /**
     * Returns `true` if the rectangle overlaps the given bounds. Two bounds
     * overlap if their intersection is an area.
     * @param {BoundsExpression} bounds
     * @returns {boolean}
     */
    overlaps(bounds: BoundsExpression): boolean;
    /**
     * Returns `true` if the bounds are properly initialized.
     * @returns {boolean}
     */
    isValid(): boolean;
    /**
     * Returns bounds created by extending or retracting the current bounds by a given
     * ratio in each direction. For example, a ratio of 0.5 extends the bounds by 50% in
     * each direction. Negative values will retract the bounds.
     * @param {number} bufferRatio
     * @returns {Bounds}
     */
    pad(bufferRatio: number): Bounds;
    /**
     * Returns `true` if the rectangle is equivalent to the given bounds.
     * @param {BoundsExpression} bounds
     * @returns {boolean}
     */
    equals(bounds: BoundsExpression): boolean;
}
/**
 * A rectangular area in pixel coordinates: a `Bounds`, or an array of points (usually
 * two diagonally opposite corners), e.g. `[[10, 10], [40, 60]]`. Accepted by all
 * Maplair methods which accept `Bounds` objects (unless noted otherwise).
 */
export type BoundsExpression = Bounds | PointExpression[];
import { Point } from './Point.js';
import type { PointExpression } from './Point.js';
