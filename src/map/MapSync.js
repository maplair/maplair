/** @import {MaplairMap} from './Map.js' */

/**
 * Options of `MapSync`.
 * @typedef {object} MapSyncOptions
 * @property {boolean} [bearing=true] Whether to synchronize the bearing of rotated maps
 * (with the map rotation, see `MaplairMap.setBearing()`).
 * @property {boolean} [oneWay=false] Whether only the first map leads and the other
 * maps follow it, without moving the first map when they are moved.
 * @property {'center'|'bounds'} [fit='center'] How the maps follow: `'center'` with the
 * same center and zoom, or `'bounds'` with the same center, zoomed so that the bounds
 * of the leading map fit (like `fitBounds()`), for maps of different sizes.
 */

/**
 * Synchronizes the views (center, zoom and bearing) of several maps, e.g. to
 * compare different layers side by side: whenever one of the maps moves (by the
 * user or by code, including animations), the other maps follow.
 *
 * With the options `oneWay` and `fit: 'bounds'`, smaller maps can follow a main
 * map showing its bounds, e.g. thumbnails next to it.
 *
 * Inspired by the [Leaflet.Sync](https://github.com/jieter/Leaflet.Sync) plugin.
 *
 * @example
 * ```js
 * const sync = new MapSync([map1, map2]);
 * // later
 * sync.remove();
 *
 * // a thumbnail showing the bounds of the main map
 * new MapSync([map, thumbnail], {oneWay: true, fit: 'bounds'});
 * ```
 */
export class MapSync {
	/**
	 * Synchronizes the views of the given maps, starting with the view of the first map.
	 * @param {MaplairMap[]} maps
	 * @param {MapSyncOptions} [options]
	 */
	constructor(maps, options) {
		/** @type {MapSyncOptions} */
		this.options = {
			bearing: true,
			oneWay: false,
			fit: 'center',
			...options
		};
		this._maps = [...maps];
		this._listeners = new Map();
		this._animating = new Set();
		// following maps which ended their zoom animation already
		this._ended = new Set();

		for (const map of this._maps) {
			const listeners = {
				movestart: () => this._onMoveStart(map),
				zoomstart: () => this._onZoomStart(map),
				move: () => this._onMove(map),
				zoomanim: e => this._onZoomAnim(map, e),
				moveend: () => this._onMoveEnd(map),
				rotate: () => this._onRotate(map)
			};
			map.on(listeners);
			this._listeners.set(map, listeners);
		}

		if (this._maps[0]?._loaded) {
			this._syncAll(this._maps[0]);
		}
	}

	/**
	 * Stops synchronizing the maps.
	 * @returns {this}
	 */
	remove() {
		for (const [map, listeners] of this._listeners) {
			map.off(listeners);
		}
		this._listeners.clear();
		this._maps = [];
		return this;
	}

	// The other maps, which follow `map`
	_followers(map) {
		return this._maps.filter(m => m !== map && m._loaded);
	}

	// Whether `map` may lead, see the `oneWay` option
	_canLead(map) {
		return !this.options.oneWay || map === this._maps[0];
	}

	// The zoom of `other` following `map` at `zoom`, see the `fit` option; snapped to
	// the `zoomSnap` of `other` at the `end` of a movement
	_zoomFor(other, map, zoom = map.getZoom(), end = true) {
		const size = other.getSize(),
		leaderSize = map.getSize();
		if (this.options.fit !== 'bounds' || !size.x || !size.y || !leaderSize.x || !leaderSize.y) { return zoom; }
		let z = zoom + Math.log2(Math.min(size.x / leaderSize.x, size.y / leaderSize.y));
		const snap = other.options.zoomSnap;
		if (end && snap) {
			// down, so that the bounds fit
			z = Math.floor(z / snap + 1e-6) * snap;
		}
		return Math.max(other.getMinZoom(), Math.min(other.getMaxZoom(), z));
	}

	// A map starting to move leads until it (and all following animations) ended,
	// the events of the following maps are ignored meanwhile.
	_onMoveStart(map) {
		if (this._leader || !this._canLead(map)) { return; }
		this._leader = map;
		this._leaderEnded = false;
		this._ended.clear();
		for (const other of this._followers(map)) {
			other._stop();
			other._syncStartZoom = other.getZoom();
			other.fire('movestart');
		}
	}

	_onZoomStart(map) {
		// `_resetView()` fires zoomstart before movestart
		this._onMoveStart(map);
		if (this._leader !== map) { return; }
		for (const other of this._followers(map)) {
			other.fire('zoomstart');
		}
	}

	_onMove(map) {
		if (!this._leader) {
			// e.g. invalidateSize(), which fires move without movestart
			if (this._canLead(map)) {
				this._syncAll(map);
			}
			return;
		}
		if (this._leader !== map) { return; }
		for (const other of this._followers(map)) {
			if (!this._animating.has(other)) {
				this._follow(other, map, true);
			}
		}
	}

	// Mirrors the CSS zoom animation, the following map ends it itself
	_onZoomAnim(map, e) {
		if (this._leader !== map) { return; }
		for (const other of this._followers(map)) {
			if (other._zoomAnimated) {
				this._animating.add(other);
				other._animateZoom(e.center, this._zoomFor(other, map, e.zoom), true, e.noUpdate);
			}
		}
	}

	_onMoveEnd(map) {
		if (this._leader !== map) {
			// the end of a following zoom animation
			if (this._animating.delete(map)) {
				this._ended.add(map);
				if (this._leaderEnded && !this._animating.size) {
					this._leader = null;
				}
			}
			return;
		}
		for (const other of this._followers(map)) {
			if (!this._animating.has(other) && !this._ended.has(other)) {
				this._follow(other, map, false);
				other._moveEnd(other.getZoom() !== other._syncStartZoom);
			}
		}
		this._leaderEnded = true;
		if (!this._animating.size) {
			this._leader = null;
		}
	}

	_onRotate(map) {
		if (!this.options.bearing || !this._canLead(map)) { return; }
		for (const other of this._followers(map)) {
			if (other._rotate && other.getBearing() !== map.getBearing()) {
				other._rotate(map.getBearing());
			}
		}
	}

	// Moves `other` to the view of `map`, during or at the end of a movement
	_follow(other, map, during) {
		const center = map.getCenter(),
		zoom = this._zoomFor(other, map, map.getZoom(), !during);
		if (zoom === other.getZoom()) {
			// panning, by whole pixels like dragging
			const offset = other.project(center, zoom).subtract(other.project(other.getCenter(), zoom)).round();
			if (offset.x || offset.y) {
				other._rawPanBy(offset);
				other.fire('move');
			}
		} else {
			// zooming frame by frame (pinch, flyTo, continuousZoom) or at the end
			other._move(center, zoom, during ? {pinch: true, round: false} : undefined);
		}
	}

	// Sets the view of all other maps to the one of `map`, without animation
	_syncAll(map) {
		for (const other of this._maps.filter(m => m !== map)) {
			if (this.options.bearing && other._rotate && other.getBearing() !== map.getBearing()) {
				other._rotate(map.getBearing());
			}
			const zoom = this._zoomFor(other, map);
			if (!other._loaded || other.getZoom() !== zoom ||
				other.latLngToContainerPoint(map.getCenter()).distanceTo(other.getSize()._divideBy(2)) >= 1) {
				this._leader = map;
				other.setView(map.getCenter(), zoom, {animate: false});
				this._leader = null;
			}
		}
	}
}
