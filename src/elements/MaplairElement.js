import {LatLng} from '../geo/LatLng.js';
import {LatLngBounds} from '../geo/LatLngBounds.js';
import {EPSG3395} from '../geo/crs/EPSG3395.js';
import {EPSG3857} from '../geo/crs/EPSG3857.js';
import {EPSG4326} from '../geo/crs/EPSG4326.js';
import {SimpleCRS} from '../geo/crs/SimpleCRS.js';

const tagPrefix = 'maplair-',
eventPrefix = 'maplair-',
ignoredAttributes = new Set(['id', 'class', 'style', 'slot', 'name', 'base', 'hidden', 'is', 'part', 'tabindex',
	'role', 'lang', 'dir', 'translate', 'inert', 'popover', 'nonce']),
ignoredPrefixes = /^(aria|data)-/;

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
export class MaplairElement extends (globalThis.HTMLElement ?? class {}) {
	/**
	 * The class of the instance, whose `defaultOptions` define the attributes.
	 * @type {any}
	 */
	static Class = null;

	/**
	 * Attributes that aren't options, e.g. constructor arguments like `latlng`.
	 * @type {string[]}
	 */
	static args = [];

	/**
	 * Events of the instance dispatched on the element (more are dispatched on demand,
	 * when listened to).
	 * @type {string[]}
	 */
	static events = [];

	/**
	 * Whether the element only works inside another Maplair element, e.g. a layer in a map.
	 * @type {boolean}
	 */
	static needsParent = true;

	static get observedAttributes() {
		const defaults = defaultsOf(this.Class),
		names = [];
		for (const key in defaults) { names.push(kebabCase(key)); }
		return [...names, ...this.args];
	}

	constructor() {
		super();
		this._instance = null;
		this._parent = null;
		// child elements waiting for this element's instance, in document order
		this._pending = new Set();
		this._children = new Set();
		this._subscribed = new Set();
		this._resetReady();
	}

	/**
	 * The Maplair instance of the element, or `null` while it isn't created (e.g. not
	 * connected).
	 * @type {any}
	 */
	get instance() {
		return this._instance;
	}

	/**
	 * Returns a promise resolving with the instance, once it has been created.
	 * @returns {Promise<any>}
	 */
	whenReady() {
		return this._ready;
	}

	connectedCallback() {
		this._connect();
	}

	disconnectedCallback() {
		this._disconnect(false);
	}

	attributeChangedCallback(name, oldValue, value) {
		if (!this._instance || oldValue === value || this._reflecting) { return; }
		if (!this.update(name, value)) { this.recreate(); }
	}

	// e.g. with `addEventListener('maplair-tileload', …)`, the instance's events are forwarded on demand
	addEventListener(type, listener, options) {
		super.addEventListener(type, listener, options);
		if (typeof type === 'string' && type.startsWith(eventPrefix)) {
			this._subscribe(type.slice(eventPrefix.length));
		}
	}

	/**
	 * Recreates the instance, e.g. after changing an attribute without a setter; the
	 * child elements are recreated with it.
	 */
	recreate() {
		if (!this.isConnected) { return; }
		this._disconnect(true);
		this._connect();
	}

	/**
	 * Returns the options of the instance from the attributes.
	 * @returns {Object}
	 */
	getOptions() {
		const Class = this.constructor,
		defaults = defaultsOf(Class.Class),
		options = {};
		for (const {name, value} of this.attributes) {
			if (Class.args.includes(name) || ignoredAttributes.has(name) || name.includes('-') && ignoredPrefixes.test(name)) { continue; }
			const key = camelCase(name);
			options[key] = parseOption(key, value, defaults[key]);
		}
		return options;
	}

	/**
	 * Returns the attribute parsed as an option, e.g. a `LatLng` for `latlng`, or
	 * `undefined` if it's missing.
	 * @param {string} name
	 * @returns {any}
	 */
	getArg(name) {
		const value = this.getAttribute(name);
		if (value === null) { return undefined; }
		const key = camelCase(name);
		return parseOption(key, value, defaultsOf(this.constructor.Class)[key]);
	}

	// Subclass interface:

	/**
	 * Creates the instance; returning `null` waits for the content of the element (e.g. an
	 * inline `<svg>`), retried when the children change.
	 * @param {MaplairElement|null} parent
	 * @returns {any}
	 */
	createInstance(parent) { // eslint-disable-line no-unused-vars
		return new this.constructor.Class(this.getOptions());
	}

	/**
	 * Adds the instance to the parent element's instance.
	 * @param {MaplairElement|null} parent
	 */
	attach(parent) {
		parent?.attachChild(this);
	}

	/**
	 * Removes the instance from the parent element's instance.
	 * @param {MaplairElement|null} parent
	 */
	detach(parent) {
		parent?.detachChild(this);
	}

	/**
	 * Adds the instance of a child element, e.g. a layer to a map.
	 * @param {MaplairElement} child
	 */
	attachChild(child) {} // eslint-disable-line no-unused-vars

	/**
	 * Removes the instance of a child element.
	 * @param {MaplairElement} child
	 */
	detachChild(child) {} // eslint-disable-line no-unused-vars

	/**
	 * Applies a changed attribute to the instance; returning `false` recreates it.
	 * @param {string} name
	 * @param {string|null} value
	 * @returns {boolean}
	 */
	update(name, value) { // eslint-disable-line no-unused-vars
		return false;
	}

	// Lifecycle:

	_connect() {
		if (this._instance || !this.isConnected) { return; }
		const parent = this._findParent();
		if (this.constructor.needsParent) {
			if (!parent) { return; }
			if (!(parent instanceof MaplairElement)) {
				// defined later
				customElements.whenDefined(parent.localName).then(() => this._connect());
				return;
			}
			if (!parent._instance) {
				parent._pending.add(this);
				return;
			}
		}
		this._create(parent);
	}

	_create(parent) {
		this._retryObserver?.disconnect();
		this._retryObserver = null;
		const instance = this.createInstance(parent);
		if (!instance) {
			// e.g. waiting for the parser to add the content
			this._retryObserver = new MutationObserver(() => this._connect());
			this._retryObserver.observe(this, {childList: true, subtree: true});
			return;
		}
		this._instance = instance;
		instance._maplairElement = this;
		this._parent = parent;
		parent?._children.add(this);
		this.attach(parent);

		this._subscribed.clear();
		for (const type of this.constructor.events) { this._subscribe(type); }
		for (const type of this._listenedTypes ?? []) { this._subscribe(type); }

		this._resolveReady(instance);
		this.dispatchEvent(new CustomEvent(`${eventPrefix}ready`, {detail: instance}));

		const pending = [...this._pending];
		this._pending.clear();
		for (const child of pending) { child._connect(); }
	}

	// `keepChildren`: the children are created again with the instance (on recreate)
	_disconnect(keepChildren) {
		this._retryObserver?.disconnect();
		this._retryObserver = null;
		this._contentObserver?.disconnect();
		this._contentObserver = null;
		this._parent?._pending.delete(this);
		if (!this._instance) { return; }

		for (const child of this._children) { // deleting while iterating a Set is fine
			child._disconnect(true);
			this._pending.add(child);
		}
		if (!keepChildren) { this._pending.clear(); }

		this.detach(this._parent);
		this._parent?._children.delete(this);
		this.destroy?.();
		this._instance = null;
		this._parent = null;
		this._resetReady();
	}

	_findParent() {
		for (let el = this.parentElement; el; el = el.parentElement) {
			if (el.localName.startsWith(tagPrefix)) { return el; }
		}
		return null;
	}

	_resetReady() {
		this._ready = new Promise((resolve) => { this._resolveReady = resolve; });
	}

	// Calls `fn` when the children of the element change, e.g. while the parser adds them.
	_observeContent(fn) {
		if (this._contentObserver) { return; }
		this._contentObserver = new MutationObserver(fn);
		this._contentObserver.observe(this, {childList: true, subtree: true, characterData: true});
	}

	_subscribe(type) {
		(this._listenedTypes ??= new Set()).add(type);
		if (!this._instance || this._subscribed.has(type)) { return; }
		this._subscribed.add(type);
		this._instance.on?.(type, this._forward, this);
	}

	_forward(e) {
		// events of layers with an element of their own are dispatched there, e.g. clicks on
		// the markers of a feature group, and bubble from there
		const source = e.sourceTarget;
		if (source && source !== this._instance && source._maplairElement && source._maplairElement !== this) { return; }
		this.dispatchEvent(new CustomEvent(eventPrefix + e.type, {bubbles: true, detail: e}));
	}

	// Sets an attribute without applying it to the instance, e.g. reflecting its state.
	_reflectAttribute(name, value) {
		this._reflecting = true;
		if (value === null || value === false) {
			this.removeAttribute(name);
		} else {
			this.setAttribute(name, value === true ? '' : value);
		}
		this._reflecting = false;
	}
}

/**
 * Converts a kebab-case attribute name to the camelCase name of the option.
 * @param {string} name
 * @returns {string}
 */
export function camelCase(name) {
	return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Converts a camelCase option name to the kebab-case name of the attribute.
 * @param {string} name
 * @returns {string}
 */
export function kebabCase(name) {
	return name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
}

const defaultsCache = new WeakMap();

/**
 * Returns the default options of a class, including the inherited ones.
 * @param {any} Class
 * @returns {Object}
 */
export function defaultsOf(Class) {
	if (!Class) { return {}; }
	let defaults = defaultsCache.get(Class);
	if (!defaults) {
		const chain = [];
		for (let c = Class; c?.defaultOptions; c = Object.getPrototypeOf(c)) {
			if (Object.hasOwn(c, 'defaultOptions')) { chain.unshift(c.defaultOptions); }
		}
		defaults = Object.assign({}, ...chain);
		defaultsCache.set(Class, defaults);
	}
	return defaults;
}

const crsByName = {EPSG3395, EPSG3857, EPSG4326, SimpleCRS};

/**
 * Registers a CRS for the `crs` attribute of `<maplair-map>`, e.g. a `ProjectedCRS` of a
 * national grid: `registerCRS('EPSG2056', SwissCRS)`.
 * @param {string} name
 * @param {any} crs
 */
export function registerCRS(name, crs) {
	crsByName[name] = crs;
}

const numberRe = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i,
listRe = /\s+/;

/**
 * Parses `lat,lng`.
 * @param {string} value
 * @returns {LatLng}
 */
export function parseLatLng(value) {
	const [lat, lng, alt] = value.split(',').map(Number);
	return new LatLng(lat, lng, alt);
}

/**
 * Parses space-separated `lat,lng` pairs, or rings of them separated by `|` (e.g. holes of a
 * polygon); JSON arrays work too.
 * @param {string} value
 * @returns {LatLng[]|LatLng[][]}
 */
export function parseLatLngs(value) {
	value = value.trim();
	if (value.startsWith('[')) { return JSON.parse(value); }
	const ring = s => s.trim().split(listRe).filter(Boolean).map(parseLatLng);
	return value.includes('|') ? value.split('|').map(ring) : ring(value);
}

/**
 * Parses `south,west north,east`.
 * @param {string} value
 * @returns {LatLngBounds}
 */
export function parseBounds(value) {
	return new LatLngBounds(parseLatLngs(value));
}

/**
 * Parses `x,y` (or a single number for both).
 * @param {string} value
 * @returns {[number, number]}
 */
export function parsePoint(value) {
	const [x, y = x] = value.split(',').map(Number);
	return [x, y];
}

const latLngOptions = new Set(['latlng', 'center']),
boundsOptions = new Set(['bounds', 'maxBounds']),
pointOptions = new Set(['iconSize', 'iconAnchor', 'popupAnchor', 'tooltipAnchor', 'shadowSize', 'shadowAnchor',
	'offset', 'autoPanPadding', 'autoPanPaddingTopLeft', 'autoPanPaddingBottomRight']);

/**
 * Parses an attribute value as the option `key`, by the type of its default.
 * @param {string} key
 * @param {string} value
 * @param {any} [def] The default of the option.
 * @returns {any}
 */
export function parseOption(key, value, def) {
	if (latLngOptions.has(key)) { return parseLatLng(value); }
	if (key === 'latlngs') { return parseLatLngs(value); }
	if (boundsOptions.has(key)) { return parseBounds(value); }
	if (key === 'crs') { return crsByName[value] ?? crsByName[value.replace(':', '')]; }
	switch (typeof def) {
	case 'number': return value === '' ? def : Number(value);
	case 'boolean': return value !== 'false';
	case 'string': return value;
	}
	if (pointOptions.has(key) || Array.isArray(def) && def.length === 2 && typeof def[0] === 'number' || def?.x !== undefined) {
		return parsePoint(value);
	}
	return guessValue(value);
}

function guessValue(value) {
	const trimmed = value.trim();
	if (trimmed === '' || trimmed === 'true') { return true; }
	if (trimmed === 'false') { return false; }
	if (trimmed === 'null') { return null; }
	if (numberRe.test(trimmed)) { return Number(trimmed); }
	if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
		try { return JSON.parse(trimmed); } catch { /* a string after all */ }
	}
	return value;
}

const styleText = `
:where(maplair-map) { display: block; height: 400px; }
/* the child elements are configuration, their content is shown by the instances (e.g. popups); other content
   is the fallback until the map is created */
maplair-map.maplair-container > :not([class*="maplair-"]) { display: none; }
`;
let styleAdopted = false;

/**
 * The custom elements of Maplair, by name.
 * @type {Map<string, any>}
 */
export const elements = new Map();

/**
 * Defines the custom element `name` (if not defined yet), e.g. `maplair-marker`.
 * @param {string} name
 * @param {any} Element
 */
export function define(name, Element) {
	elements.set(name, Element);
	// not in server-side rendering
	if (typeof customElements === 'undefined') { return; }
	if (!styleAdopted) {
		styleAdopted = true;
		const style = new CSSStyleSheet();
		style.replaceSync(styleText);
		document.adoptedStyleSheets = [style, ...document.adoptedStyleSheets];
	}
	if (!customElements.get(name)) { customElements.define(name, Element); }
}
