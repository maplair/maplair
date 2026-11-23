import type { define, parseLatLng } from './MaplairElement.js';
/**
 * `<maplair-map>`: a map ([`MaplairMap`](#maplairmap)), rendered into the element itself, with the
 * layers and controls of its child elements. Attributes: `center` (`lat,lng`) and `zoom`, or
 * `bounds` (`south,west north,east`), and the [options of the map](#maplairmap-option), e.g.
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
 * Events: `maplair-click`, `maplair-moveend` and the other [events of the map](#maplairmap-event).
 */
export class MapElement extends MaplairElement {
    static Class: typeof MaplairMap;
    static formAssociated: boolean;
    /**
     * The map.
     * @type {MaplairMap|null}
     */
    get map(): MaplairMap | null;
    set center(center: LatLng);
    /**
     * The center of the map; setting it pans the map.
     * @type {LatLng}
     */
    get center(): LatLng;
    set zoom(zoom: number);
    /**
     * The zoom of the map; setting it zooms the map.
     * @type {number}
     */
    get zoom(): number;
    createInstance(): MaplairMap;
    destroy(): void;
    update(name: any, value: any): boolean;
    attachChild(child: any): void;
    detachChild(child: any): void;
    set value(value: string);
    /**
     * The picked location as `lat,lng` (with `pick`), or `''`.
     * @type {string}
     */
    get value(): string;
    /** @type {HTMLFormElement|null} */
    get form(): HTMLFormElement | null;
    /** @type {string} */
    get name(): string;
    formResetCallback(): void;
    formStateRestoreCallback(state: any): void;
}
import { MaplairElement } from './MaplairElement.js';
import { MaplairMap } from '../map/Map.js';
import type { LatLng } from '../geo/LatLng.js';
import { Hash } from '../map/Hash.js';
import { MapSync } from '../map/MapSync.js';
import { Marker } from '../layer/marker/Marker.js';
