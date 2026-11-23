import type { EPSG3395 } from '../geo/crs/EPSG3395.js';
import type { EPSG3857 } from '../geo/crs/EPSG3857.js';
import type { EPSG4326 } from '../geo/crs/EPSG4326.js';
import type { SimpleCRS } from '../geo/crs/SimpleCRS.js';
/**
 * Converts a kebab-case attribute name to the camelCase name of the option.
 * @param {string} name
 * @returns {string}
 */
export function camelCase(name: string): string;
/**
 * Converts a camelCase option name to the kebab-case name of the attribute.
 * @param {string} name
 * @returns {string}
 */
export function kebabCase(name: string): string;
/**
 * Returns the default options of a class, including the inherited ones.
 * @param {any} Class
 * @returns {Object}
 */
export function defaultsOf(Class: any): Object;
/**
 * Registers a CRS for the `crs` attribute of `<maplair-map>`, e.g. a `ProjectedCRS` of a
 * national grid: `registerCRS('EPSG2056', SwissCRS)`.
 * @param {string} name
 * @param {any} crs
 */
export function registerCRS(name: string, crs: any): void;
/**
 * Parses `lat,lng`.
 * @param {string} value
 * @returns {LatLng}
 */
export function parseLatLng(value: string): LatLng;
/**
 * Parses space-separated `lat,lng` pairs, or rings of them separated by `|` (e.g. holes of a
 * polygon); JSON arrays work too.
 * @param {string} value
 * @returns {LatLng[]|LatLng[][]}
 */
export function parseLatLngs(value: string): LatLng[] | LatLng[][];
/**
 * Parses `south,west north,east`.
 * @param {string} value
 * @returns {LatLngBounds}
 */
export function parseBounds(value: string): LatLngBounds;
/**
 * Parses `x,y` (or a single number for both).
 * @param {string} value
 * @returns {[number, number]}
 */
export function parsePoint(value: string): [number, number];
/**
 * Parses an attribute value as the option `key`, by the type of its default.
 * @param {string} key
 * @param {string} value
 * @param {any} [def] The default of the option.
 * @returns {any}
 */
export function parseOption(key: string, value: string, def?: any): any;
/**
 * Defines the custom element `name` (if not defined yet), e.g. `maplair-marker`.
 * @param {string} name
 * @param {any} Element
 */
export function define(name: string, Element: any): void;
/**
 * The base class of Maplair's [custom elements](https://developer.mozilla.org/docs/Web/API/Web_components),
 * which build maps from HTML, without JavaScript:
 *
 * ```html
 * <script type="module" src="https://cdn.jsdelivr.net/npm/maplair/dist/maplair-elements.js"></script>
 * <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplair/dist/maplair.css">
 *
 * <maplair-map center="47.26,11.39" zoom="10">
 * 	<maplair-tile-layer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"></maplair-tile-layer>
 * 	<maplair-marker latlng="47.26,11.39">
 * 		<maplair-popup open>Innsbruck</maplair-popup>
 * 	</maplair-marker>
 * </maplair-map>
 * ```
 *
 * An element creates its Maplair instance (e.g. a `Marker`) when connected, adds it to the
 * map or layer of the nearest Maplair element around it, and removes it when disconnected.
 * The attributes are the options of the class in kebab-case (`maxZoom` → `max-zoom`),
 * parsed by the type of their default: numbers, booleans (present, or `"false"`), strings,
 * and JSON for objects and arrays. Coordinates are written as `lat,lng`, lists of them
 * separated by spaces, bounds as `south,west north,east`, pixel points as `x,y`. Changing
 * an attribute updates the instance (with a setter like `setLatLng()`, or by recreating it).
 *
 * Maplair events are dispatched on the element as bubbling DOM events prefixed with
 * `maplair-` (e.g. `maplair-click`), with the Maplair event as `detail`;
 * `maplair-ready` is dispatched once the instance has been created.
 *
 * Where HTML ends, code takes over: [`instance`](#maplairelement-instance) (also `map`,
 * `layer` or `control`, depending on the element) is the Maplair instance, and
 * [`whenReady()`](#maplairelement-whenready) resolves with it.
 */
export class MaplairElement extends HTMLElement {
    /**
     * The class of the instance, whose `defaultOptions` define the attributes.
     * @type {any}
     */
    static Class: any;
    /**
     * Attributes that aren't options, e.g. constructor arguments like `latlng`.
     * @type {string[]}
     */
    static args: string[];
    /**
     * Events of the instance dispatched on the element (more are dispatched on demand,
     * when listened to).
     * @type {string[]}
     */
    static events: string[];
    /**
     * Whether the element only works inside another Maplair element, e.g. a layer in a map.
     * @type {boolean}
     */
    static needsParent: boolean;
    static get observedAttributes(): string[];
    /**
     * The Maplair instance of the element, or `null` while it isn't created (e.g. not
     * connected).
     * @type {any}
     */
    get instance(): any;
    /**
     * Returns a promise resolving with the instance, once it has been created.
     * @returns {Promise<any>}
     */
    whenReady(): Promise<any>;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: any, oldValue: any, value: any): void;
    addEventListener(type: any, listener: any, options: any): void;
    /**
     * Recreates the instance, e.g. after changing an attribute without a setter; the
     * child elements are recreated with it.
     */
    recreate(): void;
    /**
     * Returns the options of the instance from the attributes.
     * @returns {Object}
     */
    getOptions(): Object;
    /**
     * Returns the attribute parsed as an option, e.g. a `LatLng` for `latlng`, or
     * `undefined` if it's missing.
     * @param {string} name
     * @returns {any}
     */
    getArg(name: string): any;
    /**
     * Creates the instance; returning `null` waits for the content of the element (e.g. an
     * inline `<svg>`), retried when the children change.
     * @param {MaplairElement|null} parent
     * @returns {any}
     */
    createInstance(parent: MaplairElement | null): any;
    /**
     * Adds the instance to the parent element's instance.
     * @param {MaplairElement|null} parent
     */
    attach(parent: MaplairElement | null): void;
    /**
     * Removes the instance from the parent element's instance.
     * @param {MaplairElement|null} parent
     */
    detach(parent: MaplairElement | null): void;
    /**
     * Adds the instance of a child element, e.g. a layer to a map.
     * @param {MaplairElement} child
     */
    attachChild(child: MaplairElement): void;
    /**
     * Removes the instance of a child element.
     * @param {MaplairElement} child
     */
    detachChild(child: MaplairElement): void;
    /**
     * Applies a changed attribute to the instance; returning `false` recreates it.
     * @param {string} name
     * @param {string|null} value
     * @returns {boolean}
     */
    update(name: string, value: string | null): boolean;
}
/**
 * The custom elements of Maplair, by name.
 * @type {Map<string, any>}
 */
export const elements: Map<string, any>;
import { LatLng } from '../geo/LatLng.js';
import { LatLngBounds } from '../geo/LatLngBounds.js';
