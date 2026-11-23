// Maplair's custom elements, building maps from HTML: importing this module defines them all. It also exports all
// of Maplair, with its optional features (e.g. `maplair/map-rotation`), so that scripts of a page using the bundle
// `dist/maplair-elements.js` work with the same classes.
export * from '../Maplair.all.js';
export {MaplairElement, registerCRS, defaultsOf, parseOption, parseLatLng, parseLatLngs, parseBounds, parsePoint} from './MaplairElement.js';
export {MapElement} from './MapElement.js';
export * from './layers.js';
export * from './content.js';
export * from './controls.js';
