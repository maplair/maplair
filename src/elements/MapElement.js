import {MaplairMap} from '../map/Map.js';
import {Hash} from '../map/Hash.js';
import {MapSync} from '../map/MapSync.js';
import {Marker} from '../layer/marker/Marker.js';
import {MaplairElement, define, parseLatLng} from './MaplairElement.js';

/** @import {LatLng} from '../geo/LatLng.js' */

const handlers = ['dragging', 'scrollWheelZoom', 'doubleClickZoom', 'boxZoom', 'keyboard', 'pinchZoom', 'tapHold',
	'tapDragZoom'];

/**
 * `<maplair-map>`: a map ([`MaplairMap`](#map)), rendered into the element itself, with the
 * layers and controls of its child elements. Attributes: `center` (`lat,lng`) and `zoom`, or
 * `bounds` (`south,west north,east`), and the [options of the map](#map-option), e.g.
 * `min-zoom`, `max-bounds`, `crs` (the name of a built-in CRS like `EPSG4326`, or one
 * registered with `registerCRS()`), `bearing`, `scroll-wheel-zoom="false"`.
 *
 * * `hash`: keeps the view in the URL hash ([`Hash`](#hash)), `hash="query"` in its query
 *   parameters.
 * * `sync-with`: the selector of another `<maplair-map>` whose view is kept in sync
 *   ([`MapSync`](#mapsync)).
 * * `reflect-view`: updates the `center` and `zoom` attributes after each move.
 * * `name` and `pick`: a form control picking a location, whose value is `lat,lng`, with
 *   `value` as the initial location, and `required`.
 *
 * Without `height` in the page's CSS, the map is 400 pixels high. Content other than Maplair
 * elements (e.g. a static image) is the fallback shown until the map is created.
 *
 * Events: `maplair-click`, `maplair-moveend` and the other [events of the map](#map-event).
 */
export class MapElement extends MaplairElement {
	static Class = MaplairMap;
	static args = ['center', 'zoom', 'bounds', 'hash', 'sync-with', 'reflect-view', 'pick', 'value', 'required'];
	static needsParent = false;
	static formAssociated = true;
	static events = ['click', 'dblclick', 'contextmenu', 'movestart', 'move', 'moveend', 'zoomstart', 'zoom', 'zoomend',
		'resize', 'baselayerchange', 'overlayadd', 'overlayremove', 'rotate'];

	constructor() {
		super();
		this._internals = this.attachInternals?.();
		// the layer elements with a `name`, for the layers control, and the classifications, for the legend
		this._registry = {layers: new Set(), classifications: new Set()};
		this._watchers = new Set();
	}

	/**
	 * The map.
	 * @type {MaplairMap|null}
	 */
	get map() {
		return this._instance;
	}

	/**
	 * The center of the map; setting it pans the map.
	 * @type {LatLng}
	 */
	get center() {
		return this._instance?.getCenter() ?? this.getArg('center');
	}

	set center(center) {
		if (this._instance) { this._instance.panTo(center); } else { this.setAttribute('center', `${center.lat ?? center[0]},${center.lng ?? center[1]}`); }
	}

	/**
	 * The zoom of the map; setting it zooms the map.
	 * @type {number}
	 */
	get zoom() {
		return this._instance?.getZoom() ?? Number(this.getAttribute('zoom'));
	}

	set zoom(zoom) {
		if (this._instance) { this._instance.setZoom(zoom); } else { this.setAttribute('zoom', zoom); }
	}

	createInstance() {
		const map = new MaplairMap(this, this.getOptions());
		this._setView(map);
		map.on('moveend', this._onMoveEnd, this);

		if (this.hasAttribute('hash')) {
			this._hash = new Hash(map, this.getAttribute('hash') === 'query' ? {mode: 'query'} : {});
		}
		const syncWith = this.getAttribute('sync-with');
		if (syncWith) {
			const other = document.querySelector(syncWith);
			other?.whenReady?.().then((otherMap) => {
				if (this._instance === map) { this._sync = new MapSync([map, otherMap]); }
			});
		}
		if (this.hasAttribute('pick')) { this._initPicker(map); }
		return map;
	}

	destroy() {
		this._hash?.remove?.();
		this._sync?.remove?.();
		this._hash = this._sync = this._pickMarker = null;
		this._instance.remove();
	}

	_setView(map) {
		const bounds = this.getArg('bounds');
		if (bounds) {
			map.fitBounds(bounds);
		} else {
			map.setView(this.getArg('center') ?? [0, 0], this.getArg('zoom') ?? 0);
		}
	}

	update(name, value) {
		const map = this._instance;
		switch (name) {
		case 'center':
		case 'zoom':
		case 'bounds':
			this._setView(map);
			return true;
		case 'min-zoom':
			map.setMinZoom(Number(value));
			return true;
		case 'max-zoom':
			map.setMaxZoom(Number(value));
			return true;
		case 'max-bounds':
			map.setMaxBounds(value === null ? null : this.getArg('max-bounds'));
			return true;
		case 'bearing':
			map.setBearing?.(Number(value));
			return true;
		case 'reflect-view':
		case 'required':
			this._updateFormValue();
			return true;
		case 'value':
			this._setPicked(value ? parseLatLng(value) : null);
			return true;
		}
		const handler = handlers.find(h => name === h.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`));
		if (handler && map[handler]) {
			map.options[handler] = value !== 'false';
			if (value === 'false') { map[handler].disable(); } else { map[handler].enable(); }
			return true;
		}
		return false;
	}

	attachChild(child) {
		child.addToMap?.(this._instance, this);
	}

	detachChild(child) {
		child.removeFromMap?.(this._instance, this);
	}

	_onMoveEnd() {
		if (!this.hasAttribute('reflect-view')) { return; }
		const map = this._instance,
		center = map.getCenter(),
		precision = Math.max(0, Math.ceil(Math.log10(256 * 2 ** map.getZoom() / 360)));
		this._reflectAttribute('center', `${center.lat.toFixed(precision)},${center.lng.toFixed(precision)}`);
		this._reflectAttribute('zoom', `${map.getZoom()}`);
	}

	// Registry of layers and classifications, watched by the layers control and the legend

	_register(kind, el) {
		this._registry[kind].add(el);
		for (const watcher of this._watchers) { watcher.onRegister?.(kind, el); }
	}

	_unregister(kind, el) {
		this._registry[kind].delete(el);
		for (const watcher of this._watchers) { watcher.onUnregister?.(kind, el); }
	}

	_watch(watcher) {
		this._watchers.add(watcher);
		for (const [kind, els] of Object.entries(this._registry)) {
			for (const el of els) { watcher.onRegister?.(kind, el); }
		}
	}

	_unwatch(watcher) {
		this._watchers.delete(watcher);
	}

	// Form control picking a location

	/**
	 * The picked location as `lat,lng` (with `pick`), or `''`.
	 * @type {string}
	 */
	get value() {
		const latlng = this._picked;
		return latlng ? `${round(latlng.lat)},${round(latlng.lng)}` : '';
	}

	set value(value) {
		this._setPicked(value ? parseLatLng(value) : null);
	}

	/** @type {HTMLFormElement|null} */
	get form() {
		return this._internals?.form ?? null;
	}

	/** @type {string} */
	get name() {
		return this.getAttribute('name') ?? '';
	}

	_initPicker(map) {
		const initial = this.getAttribute('value');
		this._picked = initial ? parseLatLng(initial) : null;
		map.on('click', (e) => { this._setPicked(e.latlng, true); });
		this._updatePicker();
	}

	_setPicked(latlng, byUser) {
		this._picked = latlng;
		this._updatePicker();
		if (byUser) {
			this.dispatchEvent(new Event('input', {bubbles: true}));
			this.dispatchEvent(new Event('change', {bubbles: true}));
		}
	}

	_updatePicker() {
		const map = this._instance;
		if (map && this.hasAttribute('pick')) {
			if (this._picked && !this._pickMarker) {
				this._pickMarker = new Marker(this._picked, {draggable: true, title: this.getAttribute('aria-label') ?? ''})
					.on('dragend', e => this._setPicked(e.target.getLatLng(), true))
					.addTo(map);
			} else if (this._picked) {
				this._pickMarker.setLatLng(this._picked);
			} else if (this._pickMarker) {
				this._pickMarker.remove();
				this._pickMarker = null;
			}
		}
		this._updateFormValue();
	}

	_updateFormValue() {
		if (!this._internals || !this.hasAttribute('pick')) { return; }
		this._internals.setFormValue(this.value || null);
		if (this.hasAttribute('required') && !this._picked) {
			this._internals.setValidity({valueMissing: true}, 'Pick a location on the map.', this);
		} else {
			this._internals.setValidity({});
		}
	}

	formResetCallback() {
		const initial = this.getAttribute('value');
		this._setPicked(initial ? parseLatLng(initial) : null);
	}

	formStateRestoreCallback(state) {
		if (typeof state === 'string' && state) { this._setPicked(parseLatLng(state)); }
	}
}

function round(value) {
	return Math.round(value * 1e6) / 1e6;
}

define('maplair-map', MapElement);
