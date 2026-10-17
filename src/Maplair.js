import pkg from '../package.json' with {type: 'json'};
/**
 * A constant that represents the Maplair version in use.
 * @type {string}
 */
export const version = pkg.version;

// control
export * from './control/index.js';

// core
export * from './core/index.js';

// dom
export * from './dom/index.js';

// geometry
export * from './geometry/index.js';

// geo
export * from './geo/index.js';

// layer
export * from './layer/index.js';

// map
export * from './map/index.js';

