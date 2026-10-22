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
export class Transformation {
    /**
     * Instantiates a Transformation object with the given coefficients. Alternatively,
     * expects a coefficients array of the form `[a, b, c, d]`.
     * @param {number|[number, number, number, number]} a
     * @param {number} [b]
     * @param {number} [c]
     * @param {number} [d]
     */
    constructor(a: number | [number, number, number, number], b?: number, c?: number, d?: number);
    /**
     * Returns a transformed point, optionally multiplied by the given scale.
     * Only accepts actual `Point` instances, not arrays.
     * @param {Point} point
     * @param {number} [scale]
     * @returns {Point}
     */
    transform(point: Point, scale?: number): Point;
    /**
     * Returns the reverse transformation of the given point, optionally divided
     * by the given scale. Only accepts actual `Point` instances, not arrays.
     * @param {Point} point
     * @param {number} [scale]
     * @returns {Point}
     */
    untransform(point: Point, scale?: number): Point;
}
import { Point } from './Point.js';
