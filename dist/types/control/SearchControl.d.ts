import type { I18n } from '../core/I18n.js';
import type { Marker } from '../layer/marker/Marker.js';
import type { ControlOptions } from './Control.js';
import type { MaplairEvent } from '../core/Events.js';
/**
 * A result of a search, returned by a [geocoder](#searchcontrol-geocoder).
 * @typedef {object} SearchResult
 * @property {string} label The text shown in the list of results, e.g. an address.
 * @property {LatLngExpression} latlng The position of the result.
 * @property {LatLngBoundsExpression} [bounds] The extent of the result, e.g. of a city,
 * which the map fits to instead of zooming to the position.
 * @property {any} [raw] The original result of the service, for use in event listeners.
 * @property {Layer} [layer] The found layer, by [`SearchControl.layers()`](#searchcontrol-layers),
 * e.g. to open its tooltip in a `searchresult` listener.
 */
/**
 * A function searching places for a query, see the [`geocoder`](#searchcontrol-geocoder)
 * option. It should pass the `signal` to `fetch()`: searches are aborted when the user
 * starts another one. Optional properties of the function: `attribution`, an attribution
 * text which the control adds to the map, and `autoComplete: false` if the service
 * forbids searching while typing (overriding the
 * [`autoComplete`](#searchcontrol-autocomplete) option).
 * @typedef {((query: string, options: {signal: AbortSignal}) => Promise<SearchResult[]>) & {attribution?: string, autoComplete?: boolean}} Geocoder
 */
/**
 * Options of `SearchControl`.
 * @typedef {object} SearchControlOptions
 * @property {string} [position='topleft'] The position of the control (one of the map
 * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
 * `'bottomright'`.
 * @property {Geocoder} geocoder The function searching places (required), e.g.
 * [Nominatim](#searchcontrol-nominatim). Coordinates (see
 * [`LatLng.parse()`](#latlng-parse)) are found without it.
 * @property {boolean} [collapsed=true] If `true`, the control is collapsed into a button
 * and expanded on click.
 * @property {boolean} [autoComplete=false] Whether to search while typing instead of
 * on <kbd>Enter</kbd>. Not with the public Nominatim service, its
 * [usage policy](https://operations.osmfoundation.org/policies/nominatim/) forbids
 * auto-complete.
 * @property {number} [autoCompleteDelay=250] The delay in milliseconds after typing
 * before searching with [`autoComplete`](#searchcontrol-autocomplete).
 * @property {number} [minLength=3] The minimum length of queries searched with
 * [`autoComplete`](#searchcontrol-autocomplete).
 * @property {number} [zoom=16] The zoom level for results without bounds, and the
 * maximum zoom level for fitting the bounds of results.
 * @property {boolean|((result: SearchResult) => Layer|null|undefined)} [marker=true] Whether
 * to show a marker at the selected result, or a function returning the layer to show
 * instead, e.g. a `CircleMarker` highlighting the result (or nothing for none). The
 * layer is removed when the search is cleared or another result is selected.
 * @property {boolean} [clearOnMapClick=false] If `true`, a click on the map clears the
 * search (the field, the results and the marker) and collapses the control. By
 * default, the click only hides the results and the marker stays.
 * @property {string} [placeholder] The placeholder of the search field, by default
 * the translation of "Search".
 * @property {string} [noResultsText] The message shown if nothing is found, by
 * default the translation of "No results".
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
 * marker. It searches with a [`geocoder`](#searchcontrol-geocoder), e.g.
 * [Nominatim](#searchcontrol-nominatim) of OpenStreetMap or any other service.
 * Coordinates like `47.27, 11.4` or `geo:47.27,11.4` are found without a service.
 *
 * The public Nominatim service is free, but limited by its
 * [usage policy](https://operations.osmfoundation.org/policies/nominatim/): it is for
 * occasional searches of users, not for heavy use (an absolute maximum of one request
 * per second for all users of an app), and forbids auto-complete. The
 * [Nominatim geocoder](#searchcontrol-nominatim) follows the technical requirements,
 * but you are responsible for your use of the service, which you confirm with the
 * `acceptUsagePolicy` option: for more traffic, use your own Nominatim server or a
 * commercial provider.
 *
 * @example
 * ```js
 * new SearchControl({
 *     geocoder: SearchControl.nominatim({acceptUsagePolicy: true})
 * }).addTo(map);
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
    static defaultOptions: Partial<SearchControlOptions>;
    /**
     * Returns a [geocoder](#searchcontrol-geocoder) searching with
     * [Nominatim](https://nominatim.org/release-docs/latest/api/Search/), by default the
     * public service of OpenStreetMap. Using it requires that you read and accept its
     * [usage policy](https://operations.osmfoundation.org/policies/nominatim/) with the
     * `acceptUsagePolicy` option, otherwise this throws an error. The geocoder sends at most one request per second, caches the results of the last 100
     * queries, adds the OpenStreetMap attribution to the map and does not search while
     * typing with the public service. For more traffic, use your own Nominatim server or a
     * commercial provider.
     *
     * @example
     * ```js
     * new SearchControl({
     *     geocoder: SearchControl.nominatim({acceptUsagePolicy: true, params: {countrycodes: 'at,de'}})
     * }).addTo(map);
     * ```
     * @param {object} [options]
     * @param {string} [options.url='https://nominatim.openstreetmap.org/search'] The URL
     * of the search endpoint.
     * @param {Record<string, string>} [options.params] Further query parameters, e.g.
     * `countrycodes`, `viewbox` or `limit` (5 by default).
     * @param {boolean} [options.acceptUsagePolicy=false] Confirms that your use of the
     * public service complies with its
     * [usage policy](https://operations.osmfoundation.org/policies/nominatim/), required
     * for the public service.
     * @returns {Geocoder}
     */
    static nominatim({ url, params, acceptUsagePolicy }?: {
        url?: string | undefined;
        params?: Record<string, string> | undefined;
        acceptUsagePolicy?: boolean | undefined;
    }): Geocoder;
    /**
     * Returns a [geocoder](#searchcontrol-geocoder) searching the layers of a layer group,
     * e.g. the markers of a `FeatureGroup` or the features of a `GeoJSON` layer, by their
     * label: a property of their GeoJSON feature (`layer.feature.properties`) or the
     * result of a function. The group is searched at the time of the search, so layers
     * added later are found as well, and nested groups without a label are searched
     * recursively. The search ignores the case and finds the query anywhere in the
     * label; labels starting with it come first, then in alphabetical order. The results
     * contain the found `layer` and its GeoJSON feature as `raw`; layers without a
     * single position (e.g. polygons) have the `bounds` and their center as `latlng`.
     * Combine it with [`autoComplete`](#searchcontrol-autocomplete) to search while
     * typing, and with [`marker`](#searchcontrol-marker) `false` or a function to not
     * cover the found marker with another one.
     *
     * @example
     * ```js
     * const stations = new GeoJSON(data, {
     *     onEachFeature: (feature, layer) => layer.bindTooltip(feature.properties.name)
     * }).addTo(map);
     * new SearchControl({
     *     geocoder: SearchControl.layers(stations, {property: 'name'}),
     *     autoComplete: true,
     *     minLength: 1,
     *     marker: false
     * }).addTo(map);
     * map.on('searchresult', ({result}) => result.layer.openTooltip());
     * ```
     * @param {LayerGroup} group The layer group to search.
     * @param {object} [options]
     * @param {string} [options.property='name'] The property of the GeoJSON features to
     * search.
     * @param {(layer: Layer) => string|number|null|undefined} [options.label] A function
     * returning the label of a layer instead of the `property`, nothing to skip the
     * layer (or to search its layers, if it is a group).
     * @param {number} [options.limit=10] The maximum number of results.
     * @returns {Geocoder}
     */
    static layers(group: LayerGroup, { property, label, limit }?: {
        property?: string | undefined;
        label?: ((layer: Layer) => string | number | null | undefined) | undefined;
        limit?: number | undefined;
    }): Geocoder;
    /**
     * Creates a search control.
     * @param {...SearchControlOptions} args The options.
     */
    constructor(options?: SearchControlOptions);
    /**
     * Expands the search field of a [collapsed](#searchcontrol-collapsed) control and
     * focuses it.
     * @returns {this}
     */
    expand(): this;
    /**
     * Collapses the control into its button, if [collapsed](#searchcontrol-collapsed),
     * and hides the results.
     * @returns {this}
     */
    collapse(): this;
    /**
     * Searches the given text and shows the results in the list. Resolves to the results.
     * @param {string} query
     * @returns {Promise<SearchResult[]>}
     */
    search(query: string): Promise<SearchResult[]>;
    /**
     * Shows the given result on the map: zooms to it, shows a
     * [marker](#searchcontrol-marker) and fires `searchresult` on the map.
     * @param {SearchResult} result
     * @returns {this}
     */
    select(result: SearchResult): this;
    /**
     * Clears the search field, the results and the marker.
     * @returns {this}
     */
    clear(): this;
    /** The options of the SearchControl, see [the options](#searchcontroloptions). */
    options: SearchControlOptions;
}
/**
 * A result of a search, returned by a [geocoder](#searchcontrol-geocoder).
 */
export interface SearchResult {
    /**
     * The text shown in the list of results, e.g. an address.
     */
    label: string;
    /**
     * The position of the result.
     */
    latlng: LatLngExpression;
    /**
     * The extent of the result, e.g. of a city,
     * which the map fits to instead of zooming to the position.
     */
    bounds?: LatLngBoundsExpression;
    /**
     * The original result of the service, for use in event listeners.
     */
    raw?: any;
    /**
     * The found layer, by [`SearchControl.layers()`](#searchcontrol-layers),
     * e.g. to open its tooltip in a `searchresult` listener.
     */
    layer?: Layer;
}
/**
 * A function searching places for a query, see the [`geocoder`](#searchcontrol-geocoder)
 * option. It should pass the `signal` to `fetch()`: searches are aborted when the user
 * starts another one. Optional properties of the function: `attribution`, an attribution
 * text which the control adds to the map, and `autoComplete: false` if the service
 * forbids searching while typing (overriding the
 * [`autoComplete`](#searchcontrol-autocomplete) option).
 */
export type Geocoder = ((query: string, options: {
    signal: AbortSignal;
}) => Promise<SearchResult[]>) & {
    attribution?: string;
    autoComplete?: boolean;
};
/**
 * Options of `SearchControl`.
 */
export interface SearchControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'topleft'
     */
    position?: string;
    /**
     * The function searching places (required), e.g.
     * [Nominatim](#searchcontrol-nominatim). Coordinates (see
     * [`LatLng.parse()`](#latlng-parse)) are found without it.
     */
    geocoder: Geocoder;
    /**
     * If `true`, the control is collapsed into a button
     * and expanded on click.
     * @default true
     */
    collapsed?: boolean;
    /**
     * Whether to search while typing instead of
     * on <kbd>Enter</kbd>. Not with the public Nominatim service, its
     * [usage policy](https://operations.osmfoundation.org/policies/nominatim/) forbids
     * auto-complete.
     * @default false
     */
    autoComplete?: boolean;
    /**
     * The delay in milliseconds after typing
     * before searching with [`autoComplete`](#searchcontrol-autocomplete).
     * @default 250
     */
    autoCompleteDelay?: number;
    /**
     * The minimum length of queries searched with
     * [`autoComplete`](#searchcontrol-autocomplete).
     * @default 3
     */
    minLength?: number;
    /**
     * The zoom level for results without bounds, and the
     * maximum zoom level for fitting the bounds of results.
     * @default 16
     */
    zoom?: number;
    /**
     * Whether
     * to show a marker at the selected result, or a function returning the layer to show
     * instead, e.g. a `CircleMarker` highlighting the result (or nothing for none). The
     * layer is removed when the search is cleared or another result is selected.
     * @default true
     */
    marker?: boolean|((result: SearchResult) => Layer|null|undefined);
    /**
     * If `true`, a click on the map clears the
     * search (the field, the results and the marker) and collapses the control. By
     * default, the click only hides the results and the marker stays.
     * @default false
     */
    clearOnMapClick?: boolean;
    /**
     * The placeholder of the search field, by default
     * the translation of "Search".
     */
    placeholder?: string;
    /**
     * The message shown if nothing is found, by
     * default the translation of "No results".
     */
    noResultsText?: string;
}
/**
 * The event object of `searchresult`.
 */
export interface SearchResultEvent extends MaplairEvent {
    /**
     * The selected result.
     */
    result: SearchResult;
    /**
     * The position of the result.
     */
    latlng: LatLng;
    /**
     * The extent of the result, if any.
     */
    bounds: LatLngBounds|undefined;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
import type { LayerGroup } from '../layer/LayerGroup.js';
import type { Layer } from '../layer/Layer.js';
import type { LatLngExpression } from '../geo/LatLng.js';
import type { LatLngBoundsExpression } from '../geo/LatLngBounds.js';
import { LatLng } from '../geo/LatLng.js';
import { LatLngBounds } from '../geo/LatLngBounds.js';
