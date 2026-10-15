// The entry point of the `maplair` package for bundlers: Maplair with its plugins.
// Bundlers drop the plugins that an application doesn't use (see `sideEffects`
// in package.json); the plugins are also available on their own, e.g. `maplair/markercluster`.
export * from './Maplair.js';
export * from '../plugins/markercluster/src/index.js';
