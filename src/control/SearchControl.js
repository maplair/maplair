import {Control} from './Control.js';
import * as Util from '../core/Util.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {I18n} from '../core/I18n.js';
import {LatLng} from '../geo/LatLng.js';
import {LatLngBounds} from '../geo/LatLngBounds.js';
import {Marker} from '../layer/marker/Marker.js';
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
/** @import {LatLngExpression} from '../geo/LatLng.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */

const searchIcon = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4.5 4.5"/></svg>';

/**
 * A result of a search, returned by a [geocoder](#searchcontrol-geocoder).
 * @typedef {object} SearchResult
 * @property {string} label The text shown in the list of results, e.g. an address.
 * @property {LatLngExpression} latlng The position of the result.
 * @property {LatLngBoundsExpression} [bounds] The extent of the result, e.g. of a city,
 * which the map fits to instead of zooming to the position.
 * @property {any} [raw] The original result of the service, for use in event listeners.
 */

/**
 * A function searching places for a query, see the [`geocoder`](#searchcontrol-geocoder)
 * option. It should pass the `signal` to `fetch()`: searches are aborted when the user
 * starts another one.
 * @typedef {(query: string, options: {signal: AbortSignal}) => Promise<SearchResult[]>} Geocoder
 */

/**
 * Options of `SearchControl`.
 * @typedef {object} SearchControlOptions
 * @property {string} [position='topleft'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {Geocoder} [geocoder] The function searching places, by default
 * [Nominatim](#searchcontrol-nominatim) of OpenStreetMap. Coordinates (see
 * [`LatLng.parse()`](#latlng-parse)) are found without it.
 * @property {boolean} [collapsed=true] If `true`, the control is collapsed into a button
 * and expanded on click.
 * @property {boolean} [autoComplete=false] Whether to search while typing instead of
 * on <kbd>Enter</kbd>. Do not enable it with the public Nominatim service, its
 * [usage policy](https://operations.osmfoundation.org/policies/nominatim/) forbids
 * auto-complete.
 * @property {number} [autoCompleteDelay=250] The delay in milliseconds after typing
 * before searching with [`autoComplete`](#searchcontrol-autocomplete).
 * @property {number} [minLength=3] The minimum length of queries searched with
 * [`autoComplete`](#searchcontrol-autocomplete).
 * @property {number} [zoom=16] The zoom level for results without bounds, and the
 * maximum zoom level for fitting the bounds of results.
 * @property {boolean} [marker=true] Whether to show a marker at the selected result.
 * @property {string} [placeholder] The placeholder of the search field, by default
 * the translation of "Search".
 * @extends ControlOptions
 */

/**
 * The event object of `searchresult`.
 * @typedef {object} SearchResultEvent
 * @property {SearchResult} result The selected result.
 * @property {LatLng} latlng The position of the result.
 * @property {LatLngBounds|undefined} bounds The extent of the result, if any.
 * @extends MaplairEvent
 */

/**
 * A control with a search field for places, showing the results in a list to select
 * one with the pointer or the keyboard. The selected result is shown on the map with a
 * marker. It searches with [Nominatim](https://nominatim.org/) of OpenStreetMap by
 * default, or any other service with a custom [`geocoder`](#searchcontrol-geocoder).
 * Coordinates like `47.27, 11.4` or `geo:47.27,11.4` are found without a service.
 *
 * @example
 * ```js
 * new SearchControl().addTo(map);
 *
 * // Photon of Komoot, which allows auto-complete
 * new SearchControl({
 *     autoComplete: true,
 *     async geocoder(query, {signal}) {
 *         const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`, {signal});
 *         const {features} = await response.json();
 *         return features.map(({geometry, properties}) => ({
 *             label: [properties.name, properties.city, properties.country].filter(Boolean).join(', '),
 *             latlng: [geometry.coordinates[1], geometry.coordinates[0]],
 *             raw: properties
 *         }));
 *     }
 * }).addTo(map);
 * ```
 *
 * @fires MaplairMap#searchresult {SearchResultEvent} Fired when a result of the
 * [search control](#searchcontrol) is selected.
 */
export class SearchControl extends Control {

	static {
		this.setDefaultOptions({
			position: 'topleft',
			geocoder: this.nominatim(),
			collapsed: true,
			autoComplete: false,
			autoCompleteDelay: 250,
			minLength: 3,
			zoom: 16,
			marker: true,
			placeholder: undefined
		});
	}

	/**
	 * Returns a [geocoder](#searchcontrol-geocoder) searching with
	 * [Nominatim](https://nominatim.org/release-docs/latest/api/Search/), by default the
	 * public service of OpenStreetMap. Respect its
	 * [usage policy](https://operations.osmfoundation.org/policies/nominatim/).
	 *
	 * @example
	 * ```js
	 * new SearchControl({
	 *     geocoder: SearchControl.nominatim({params: {countrycodes: 'at,de'}})
	 * }).addTo(map);
	 * ```
	 * @param {object} [options]
	 * @param {string} [options.url='https://nominatim.openstreetmap.org/search'] The URL
	 * of the search endpoint.
	 * @param {Record<string, string>} [options.params] Further query parameters, e.g.
	 * `countrycodes`, `viewbox` or `limit` (5 by default).
	 * @returns {Geocoder}
	 */
	static nominatim({url = 'https://nominatim.openstreetmap.org/search', params = {}} = {}) {
		return async (query, {signal}) => {
			const search = new URLSearchParams({q: query, format: 'jsonv2', limit: '5', ...params}),
			response = await fetch(`${url}?${search}`, {signal});
			if (!response.ok) {
				throw new Error(`Nominatim: ${response.status} ${response.statusText}`);
			}
			return (await response.json()).map((place) => {
				// [south, north, west, east]
				const [s, n, w, e] = place.boundingbox.map(Number);
				return {
					label: place.display_name,
					latlng: [Number(place.lat), Number(place.lon)],
					bounds: [[s, w], [n, e]],
					raw: place
				};
			});
		};
	}

	/**
	 * Creates a search control.
	 * @param {...SearchControlOptions} args The options.
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(SearchControl);
	}

	/**
	 * @internal
	 * @param {MaplairMap} map
	 * @returns {HTMLElement}
	 */
	onAdd(map) {
		const className = 'maplair-control-search',
		container = this._container = DomUtil.create('div', `${className} maplair-bar`),
		form = DomUtil.create('form', `${className}-form`, container),
		toggle = this._toggle = DomUtil.create('button', `${className}-toggle`, form),
		input = this._input = DomUtil.create('input', `${className}-input`, form),
		reset = DomUtil.create('button', `${className}-reset`, form),
		list = this._list = DomUtil.create('ul', `${className}-results`, container),
		listId = `${className}-results-${Util.stamp(this)}`,
		title = I18n.translate('Search');

		form.role = 'search';
		toggle.type = 'button';
		toggle.innerHTML = searchIcon;
		toggle.title = title;
		toggle.setAttribute('aria-label', title);

		input.type = 'search';
		input.placeholder = this.options.placeholder ?? title;
		input.autocomplete = 'off';
		input.enterKeyHint = 'search';
		input.role = 'combobox';
		input.setAttribute('aria-label', title);
		input.setAttribute('aria-autocomplete', 'list');
		input.setAttribute('aria-controls', listId);

		reset.type = 'reset';
		reset.innerHTML = '<span aria-hidden="true">&times;</span>';
		reset.title = I18n.translate('Clear the search');
		reset.setAttribute('aria-label', reset.title);

		list.id = listId;
		list.role = 'listbox';
		list.setAttribute('aria-label', I18n.translate('Search results'));

		this._message = DomUtil.create('div', `${className}-message`, container);
		this._message.role = 'status';

		DomEvent.disableClickPropagation(container);
		DomEvent.disableScrollPropagation(container);
		DomEvent.on(toggle, 'click', this._onToggle, this);
		DomEvent.on(form, 'submit', this._onSubmit, this);
		DomEvent.on(form, 'reset', this._onReset, this);
		DomEvent.on(input, 'input', this._onInput, this);
		DomEvent.on(input, 'keydown', this._onKeyDown, this);
		DomEvent.on(list, 'click', this._onListClick, this);
		map.on('click', this._onMapClick, this);

		this._showResults([]);
		this._setExpanded(!this.options.collapsed);
		return container;
	}

	/**
	 * @internal
	 * @param {MaplairMap} map
	 */
	onRemove(map) {
		map.off('click', this._onMapClick, this);
		this._abort();
		this._marker?.remove();
	}

	/**
	 * Expands the search field of a [collapsed](#searchcontrol-collapsed) control and
	 * focuses it.
	 * @returns {this}
	 */
	expand() {
		this._setExpanded(true);
		this._input.focus();
		return this;
	}

	/**
	 * Collapses the control into its button, if [collapsed](#searchcontrol-collapsed),
	 * and hides the results.
	 * @returns {this}
	 */
	collapse() {
		this._showResults([]);
		this._setExpanded(!this.options.collapsed);
		return this;
	}

	/**
	 * Searches the given text and shows the results in the list. Resolves to the results.
	 * @param {string} query
	 * @returns {Promise<SearchResult[]>}
	 */
	async search(query) {
		this._abort();
		this._input.value = query;
		query = query.trim();
		if (!query) {
			this._showResults([]);
			return [];
		}

		const latlng = LatLng.parse(query);
		if (latlng) {
			const results = [{label: query, latlng}];
			this._showResults(results);
			return results;
		}

		const controller = this._controller = new AbortController();
		this._container.classList.add('maplair-control-search-loading');
		try {
			const results = await this.options.geocoder(query, {signal: controller.signal});
			if (!controller.signal.aborted) {
				this._showResults(results, I18n.translate('No results'));
			}
			return results;
		} catch (error) {
			if (controller.signal.aborted) { return []; }
			this._showResults([], I18n.translate('The search failed'));
			throw error;
		} finally {
			if (this._controller === controller) {
				this._controller = null;
				this._container.classList.remove('maplair-control-search-loading');
			}
		}
	}

	/**
	 * Shows the given result on the map: zooms to it, shows a
	 * [marker](#searchcontrol-marker) and fires `searchresult` on the map.
	 * @param {SearchResult} result
	 * @returns {this}
	 */
	select(result) {
		const map = this._map,
		latlng = new LatLng(result.latlng),
		bounds = result.bounds ? new LatLngBounds(result.bounds) : undefined;

		this._input.value = result.label;
		this._showResults([]);

		if (bounds?.isValid() && !bounds.getNorthWest().equals(bounds.getSouthEast())) {
			map.fitBounds(bounds, {maxZoom: this.options.zoom});
		} else {
			map.setView(latlng, this.options.zoom);
		}

		this._marker?.remove();
		if (this.options.marker) {
			this._marker = new Marker(latlng, {title: result.label}).addTo(map);
		}

		map.fire('searchresult', {result, latlng, bounds});
		return this;
	}

	/**
	 * Clears the search field, the results and the marker.
	 * @returns {this}
	 */
	clear() {
		this._abort();
		this._input.value = '';
		this._showResults([]);
		this._marker?.remove();
		this._marker = null;
		return this;
	}

	_setExpanded(expanded) {
		this._container.classList.toggle('maplair-control-search-expanded', expanded);
		this._toggle.setAttribute('aria-expanded', expanded);
	}

	_abort() {
		clearTimeout(this._autoCompleteTimeout);
		this._controller?.abort();
		this._controller = null;
		this._container?.classList.remove('maplair-control-search-loading');
	}

	// Shows the results, or the message if there are none
	_showResults(results, message = '') {
		this._results = results;
		this._list.replaceChildren(...results.map((result, i) => {
			const item = DomUtil.create('li', 'maplair-control-search-result');
			item.id = `${this._list.id}-${i}`;
			item.role = 'option';
			item.textContent = result.label;
			return item;
		}));
		this._list.hidden = !results.length;
		this._message.textContent = results.length ? '' : message;
		this._message.hidden = !this._message.textContent;
		this._input.setAttribute('aria-expanded', !!results.length);
		this._setActive(-1);
	}

	_setActive(index) {
		this._active = index;
		for (const [i, item] of [...this._list.children].entries()) {
			item.setAttribute('aria-selected', i === index);
		}
		if (index < 0) {
			this._input.removeAttribute('aria-activedescendant');
		} else {
			const item = this._list.children[index];
			this._input.setAttribute('aria-activedescendant', item.id);
			item.scrollIntoView({block: 'nearest'});
		}
	}

	_onToggle() {
		if (this.options.collapsed && !this._container.classList.contains('maplair-control-search-expanded')) {
			this.expand();
		} else {
			this._onSubmit();
		}
	}

	_onSubmit(e) {
		if (e) { DomEvent.preventDefault(e); }
		const query = this._input.value,
		result = this._results[this._active],
		latlng = LatLng.parse(query);
		if (result) {
			this.select(result);
		} else if (latlng) {
			this.select({label: query.trim(), latlng});
		} else {
			// errors are shown in the control
			this.search(query).catch(Util.falseFn);
		}
	}

	_onReset() {
		this.clear();
		this._input.focus();
	}

	_onInput() {
		clearTimeout(this._autoCompleteTimeout);
		const query = this._input.value.trim();
		if (!this.options.autoComplete) {
			this._showResults([]);
		} else if (query.length >= this.options.minLength || LatLng.parse(query)) {
			this._autoCompleteTimeout = setTimeout(() => {
				this.search(this._input.value).catch(Util.falseFn);
			}, this.options.autoCompleteDelay);
		} else {
			this._abort();
			this._showResults([]);
		}
	}

	_onKeyDown(e) {
		const n = this._results.length;
		if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && n) {
			DomEvent.preventDefault(e);
			const step = e.key === 'ArrowDown' ? 1 : -1;
			// from no active result, the first or the last one
			this._setActive(((this._active < 0 && step < 0 ? n : this._active) + step + n) % n);
		} else if (e.key === 'Escape') {
			DomEvent.preventDefault(e);
			if (n || !this._message.hidden) {
				this._showResults([]);
			} else if (this._input.value) {
				this.clear();
			} else if (this.options.collapsed) {
				this.collapse();
				this._map.getContainer().focus();
			}
		}
	}

	_onListClick(e) {
		const item = e.target.closest('.maplair-control-search-result'),
		index = [...this._list.children].indexOf(item);
		if (index >= 0) {
			this.select(this._results[index]);
		}
	}

	_onMapClick() {
		if (this._input.value) {
			this._showResults([]);
		} else {
			this.collapse();
		}
	}
}
