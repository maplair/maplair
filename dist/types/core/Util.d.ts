/**
 * Returns the unique ID of an object, assigning it one if it doesn't have it.
 * @param {object} obj
 * @returns {number}
 */
export function stamp(obj: object): number;
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
export function throttle(fn: (...args: any[]) => void, time: number, context?: object): (...args: any[]) => void;
/**
 * Returns the number `x` modulo `range` in such a way so it lies within
 * `range[0]` and `range[1]`. The returned value will be always smaller than
 * `range[1]` unless `includeMax` is set to `true`.
 * @param {number} x
 * @param {[number, number]} range
 * @param {boolean} [includeMax]
 * @returns {number}
 */
export function wrapNum(x: number, range: [number, number], includeMax?: boolean): number;
/**
 * A function which always returns `false`.
 * @returns {false}
 */
export function falseFn(): false;
/**
 * Returns the number `num` rounded with specified `precision`.
 * The default `precision` value is 6 decimal places.
 * `false` can be passed to skip any processing (can be useful to avoid round-off errors).
 * @param {number} num
 * @param {number|false} [precision]
 * @returns {number}
 */
export function formatNum(num: number, precision?: number | false): number;
/**
 * Trims and splits the string on whitespace and returns the array of parts.
 * @param {string} str
 * @returns {string[]}
 */
export function splitWords(str: string): string[];
/**
 * Merges the given properties to the `options` of the `obj` object, returning the
 * resulting options. See `Class options`.
 * @param {object} obj
 * @param {object} [options]
 * @returns {object}
 */
export function setOptions(obj: object, options?: object): object;
/**
 * Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
 * and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
 * `('Hello foo, bar')`. You can also specify functions instead of strings for
 * data values — they will be evaluated passing `data` as an argument.
 * @param {string} str
 * @param {Record<string, any>} data
 * @returns {string}
 */
export function template(str: string, data: Record<string, any>): string;
/**
 * Last unique ID used by [`stamp()`](#util-stamp).
 * @type {number}
 */
export let lastId: number;
