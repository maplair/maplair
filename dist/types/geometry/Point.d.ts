import type { formatNum } from '../core/Util.js';
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
export class Point {
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
    static from(x: number | PointExpression, y?: number, round?: boolean): Point;
    /**
     * Returns `true` if the Point object can be properly initialized with the given
     * arguments (the same as of the constructor).
     * @param {any} x
     * @param {any} [y]
     * @returns {boolean}
     */
    static validate(x: any, y?: any): boolean;
    /**
     * Creates a Point object with the given `x` and `y` coordinates. If optional `round`
     * is set to true, rounds the `x` and `y` values. Alternatively, expects a Point
     * object, an array of the form `[x, y]` or a plain object of the form `{x, y}`
     * instead.
     * @param {number|PointExpression} x The `x` coordinate, or the coordinates.
     * @param {number} [y] The `y` coordinate.
     * @param {boolean} [round]
     */
    constructor(x: number | PointExpression, y?: number, round?: boolean);
    /**
     * The `x` coordinate of the point.
     * @type {number}
     */
    x: number;
    /**
     * The `y` coordinate of the point.
     * @type {number}
     */
    y: number;
    /**
     * Returns the result of addition of the current and the given points.
     * @param {PointExpression} point
     * @returns {Point}
     */
    add(point: PointExpression): Point;
    /**
     * Returns the result of subtraction of the given point from the current.
     * @param {PointExpression} point
     * @returns {Point}
     */
    subtract(point: PointExpression): Point;
    /**
     * Returns the result of division of the current point by the given number.
     * @param {number} num
     * @returns {Point}
     */
    divideBy(num: number): Point;
    /**
     * Returns the result of multiplication of the current point by the given number.
     * @param {number} num
     * @returns {Point}
     */
    multiplyBy(num: number): Point;
    /**
     * Multiply each coordinate of the current point by each coordinate of
     * `scale`. In linear algebra terms, multiply the point by the
     * [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
     * defined by `scale`.
     * @param {Point} point The scale.
     * @returns {Point}
     */
    scaleBy(point: Point): Point;
    /**
     * Inverse of `scaleBy`. Divide each coordinate of the current point by
     * each coordinate of `scale`.
     * @param {Point} point The scale.
     * @returns {Point}
     */
    unscaleBy(point: Point): Point;
    /**
     * Returns a copy of the current point with rounded coordinates.
     * @returns {Point}
     */
    round(): Point;
    /**
     * Returns a copy of the current point with floored coordinates (rounded down).
     * @returns {Point}
     */
    floor(): Point;
    /**
     * Returns a copy of the current point with ceiled coordinates (rounded up).
     * @returns {Point}
     */
    ceil(): Point;
    /**
     * Returns a copy of the current point with truncated coordinates (rounded towards
     * zero).
     * @returns {Point}
     */
    trunc(): Point;
    /**
     * Returns the cartesian distance between the current and the given points.
     * @param {PointExpression} point
     * @returns {number}
     */
    distanceTo(point: PointExpression): number;
    /**
     * Returns `true` if the given point has the same coordinates.
     * @param {PointExpression} point
     * @returns {boolean}
     */
    equals(point: PointExpression): boolean;
    /**
     * Returns `true` if both coordinates of the given point are less than the
     * corresponding current point coordinates (in absolute values).
     * @param {PointExpression} point
     * @returns {boolean}
     */
    contains(point: PointExpression): boolean;
    /**
     * Returns a string representation of the point for debugging purposes.
     * @returns {string}
     */
    toString(): string;
}
/**
 * A point in pixels: a `Point`, an array of the form `[x, y]`, or a plain object of
 * the form `{x, y}`. Accepted by all Maplair methods and options which accept `Point`
 * objects (unless noted otherwise).
 */
export type PointExpression = Point | [number, number] | number[] | {
    x: number;
    y: number;
};
