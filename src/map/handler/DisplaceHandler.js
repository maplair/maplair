import {Handler} from '../../core/Handler.js';
import * as Util from '../../core/Util.js';
import {Point} from '../../geometry/Point.js';
import {CircleMarker} from '../../layer/vector/CircleMarker.js';
/** @import {MaplairMap} from '../Map.js' */
/** @import {Layer} from '../../layer/Layer.js' */
/** @import {LayerEvent} from '../../core/Events.js' */
/** @import {LatLng} from '../../geo/LatLng.js' */

/**
 * Options of `DisplaceHandler`.
 * @typedef {object} DisplaceHandlerOptions
 * @property {number} [gap=2] Additional pixel distance between the outlines of two
 * markers.
 * @property {number} [iterations=80] Maximum number of relaxation passes per relayout.
 * @property {number} [maxDistance=Infinity] Maximum distance in meters a marker may be
 * moved away from its true position. Markers which would have to move further stay
 * overlapping. Meters rather than pixels, since the point of the limit is to bound the
 * geographic error. A limit in meters also scales itself: it only bites at the zoom
 * levels where a pixel is worth a lot of ground.
 */

/**
 * Map options of `DisplaceHandler`, the interaction options for displacement.
 * @typedef {object} DisplaceHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean|DisplaceHandlerOptions} [displace] Whether to displace
 * overlapping `CircleMarker`s, either `true` or an object overriding the options of
 * `DisplaceHandler`. Needs the `DisplaceHandler` to be added to the map, see there.
 */

/**
 * Handler of `MaplairMap` for displacement, if added to the map (see `DisplaceHandler`).
 * @typedef {object} DisplaceHandlerMapProperties
 * @lends MaplairMap
 * @property {DisplaceHandler} [displace] The displacement handler, if added with the
 * name `displace`.
 */

/**
 * Options of `CircleMarker` for the displacement by `DisplaceHandler`.
 * @typedef {object} DisplaceCircleMarkerOptions
 * @lends CircleMarkerOptions
 * @property {boolean} [displace] Whether to include this marker in the displacement of
 * the map, see `DisplaceHandler`.
 * @property {string} [displaceId] Stable identifier shared across marker instances that
 * represent the same thing on different layers, so that `DisplaceHandler` puts them at
 * the same displaced position.
 */

/**
 * Whether a layer takes part in the displacement. Only these change the layout, so layers
 * that merely come and go on top of the markers — the highlight circle around a tapped or
 * searched bobble, for one — must not trigger a relayout of all of them.
 * @param {Layer} layer
 * @returns {boolean}
 */
function displaceable(layer) {
	return layer instanceof CircleMarker && !!layer.options.displace;
}

/**
 * Cartographic displacement of overlapping `CircleMarker`s: keeps all circle
 * markers created with `displace: true` free of overlap.
 *
 * Overlap is a screen space phenomenon: whether two markers cover each other
 * depends on their pixel radius and the current zoom level. The displacement is
 * therefore computed in projected pixel space and recomputed on every zoom. The
 * true position of each marker is kept by the handler, the displaced position is
 * applied via `setLatLng`. Since every run starts over from the true position,
 * markers never drift.
 *
 * `maxDistance` bounds how far a marker may be moved away from the truth, in
 * meters. It is worth noting what such a limit costs at low zoom levels: if a
 * marker is 11 km wide on the ground, separating two coincident ones moves each
 * of them by some 6 km, so a limit below that leaves them overlapping.
 *
 * Unlike the default handlers, it isn't added to every map, so that bundlers can
 * drop it from applications that don't use it. Add it to the map class (or to a
 * single map with `DisplaceHandler.addTo(map, 'displace')`), then enable it with
 * the map option `displace`, which is either `true` or an object overriding the
 * handler's options. It can be toggled at runtime via `map.displace.enable()` /
 * `map.displace.disable()`; disabling restores the true positions.
 *
 * @example
 * ```js
 * import { CircleMarker, DisplaceHandler, MaplairMap } from 'maplair';
 *
 * MaplairMap.addInitHook('addHandler', 'displace', DisplaceHandler);
 *
 * const map = new MaplairMap('map', {displace: { maxDistance: 10_000} });
 * new CircleMarker(latlng, { displace: true, radius: 6 }).addTo(map);
 * ```
 */
export class DisplaceHandler extends Handler {
	static {
		this.setDefaultOptions({
			gap: 2,
			iterations: 80,
			maxDistance: Infinity
		});
	}

	/**
	 * @param {...MaplairMap} args The map.
	 */
	constructor(...args) {
		super(...args);
		// the map option `displace` is either `true` or an object overriding the defaults
		Util.setOptions(this, this._map.options.displace);

		/**
		 * True (undisplaced) position per marker, kept outside of the marker so that
		 * the displacement cannot clobber it and re-added markers keep their anchor.
		 * @type {WeakMap<CircleMarker, LatLng>}
		 */
		this._trueLatLngs = new WeakMap();

		/**
		 * Displaced position per `marker.options.displaceId`, per zoom level. Different
		 * layers (e.g. one per classification) may create separate `CircleMarker`
		 * instances for the same thing; keying by id instead of by marker instance
		 * keeps it at the same displaced position regardless of which layer triggered
		 * the relayout. Cleared whenever a true position changes.
		 * @type {Map<number, Map<string, LatLng>>}
		 */
		this._displacedPositions = new Map();

		this.callInitHooks(DisplaceHandler);
	}

	/**
	 * Called when the handler is enabled, adds the event hooks.
	 */
	addHooks() {
		this._map.on('zoomend', this.schedule, this);
		this._map.on('layeradd', this._onLayerAdd, this);
		this._map.on('layerremove', this._onLayerRemove, this);
		this._map.eachLayer(layer => this._track(layer));
		this.schedule();
	}

	/**
	 * Called when the handler is disabled, removes the event hooks and restores the
	 * true positions of the markers.
	 */
	removeHooks() {
		this._map.off('zoomend', this.schedule, this);
		this._map.off('layeradd', this._onLayerAdd, this);
		this._map.off('layerremove', this._onLayerRemove, this);
		if (this._frame) { cancelAnimationFrame(this._frame); }
		this._frame = undefined;
		this._restore();
	}

	/**
	 * Requests a relayout in the next animation frame, at most one per frame.
	 */
	schedule() {
		if (this._frame) {
			return;
		}
		this._frame = requestAnimationFrame(() => {
			this._frame = undefined;
			this.relayout();
		});
	}

	/**
	 * Computes the displacement for all tracked markers in the pixel space of
	 * the current zoom level and writes the displaced positions back.
	 */
	relayout() {
		const map = this._map;
		/** @type {CircleMarker[]} */
		const markers = [];
		map.eachLayer((layer) => {
			if (this._trueLatLngs.has(layer)) {
				markers.push(layer);
			}
		});
		if (markers.length < 2) {
			return;
		}

		const zoom = map.getZoom();
		let cache = this._displacedPositions.get(zoom);
		if (!cache) {
			cache = new Map();
			this._displacedPositions.set(zoom, cache);
		}

		// If every currently visible marker already has a cached position for
		// this zoom (e.g. the same stations shown on a different layer), reuse
		// it as-is instead of recomputing the relaxation.
		if (markers.every(marker => marker.options.displaceId && cache.has(marker.options.displaceId))) {
			for (const marker of markers) {
				this._moveTo(marker, cache.get(marker.options.displaceId));
			}
			return;
		}

		const {gap, iterations, maxDistance} = this.options;
		const points = markers.map(marker => map.project(this._trueLatLngs.get(marker), zoom));

		// Usually a uniform radius per zoom level; max() as a safeguard.
		const radius = markers.reduce((r, marker) => Math.max(r, marker.getRadius()), 0);
		displace(points, 2 * radius + gap, {iterations, maxDisplacement: maxDistance * this._pixelsPerMeter(zoom)});

		for (let i = 0; i < markers.length; i++) {
			const latLng = map.unproject(points[i], zoom);
			this._moveTo(markers[i], latLng);
			if (markers[i].options.displaceId) {
				cache.set(markers[i].options.displaceId, latLng);
			}
		}
	}

	/**
	 * Scale of the map at `zoom`, measured with the CRS of the map at its
	 * center. Since a relayout only ever covers one screen, the scale variation
	 * across the view is ignored.
	 * @param {number} zoom
	 * @returns {number}
	 */
	_pixelsPerMeter(zoom) {
		const map = this._map;
		const center = map.getCenter();
		const east = map.unproject(map.project(center, zoom).add(new Point(100, 0)), zoom);
		return 100 / map.distance(center, east);
	}

	/**
	 * Moves a marker to its displaced (or true) position, without taking that
	 * for a new true position, see `_onMarkerMove`.
	 * @param {CircleMarker} marker
	 * @param {LatLng} latLng
	 */
	_moveTo(marker, latLng) {
		this._moving = true;
		try {
			marker.setLatLng(latLng);
		} finally {
			this._moving = false;
		}
	}

	/**
	 * A tracked marker was moved by the application: that is its new true position,
	 * which invalidates the cached displaced positions.
	 * @param {Event} event
	 */
	_onMarkerMove(event) {
		if (this._moving) { return; }
		this._trueLatLngs.set(event.target, event.latlng);
		this._displacedPositions.clear();
		if (this._enabled && this._map.hasLayer(event.target)) { this.schedule(); }
	}

	/**
	 * @param {LayerEvent} event
	 */
	_onLayerAdd(event) {
		this._track(event.layer);
		if (displaceable(event.layer)) { this.schedule(); }
	}

	/**
	 * @param {LayerEvent} event
	 */
	_onLayerRemove(event) {
		if (displaceable(event.layer)) { this.schedule(); }
	}

	/**
	 * Remembers the true position of a marker opted in via `displace: true`.
	 * Markers seen before keep their previously stored position, so re-adding a
	 * displaced marker does not anchor it to its displaced position.
	 * @param {Layer} layer
	 */
	_track(layer) {
		if (!displaceable(layer)) {
			return;
		}
		if (!this._trueLatLngs.has(layer)) {
			this._trueLatLngs.set(layer, layer.getLatLng());
			layer.on('move', this._onMarkerMove, this);
		}
	}

	/**
	 * Moves all tracked markers back to their true position.
	 */
	_restore() {
		this._map.eachLayer((layer) => {
			const latLng = this._trueLatLngs.get(layer);
			if (latLng) { this._moveTo(layer, latLng); }
		});
	}
}

/**
 * Displaces overlapping points in pixel space until they are at least
 * `minSeparation` apart. Iterative relaxation: every overlapping pair is pushed
 * apart by half of its overlap per pass. Neighbour lookup uses a grid (cell
 * size = separation) ⇒ O(n) per iteration.
 *
 * No point ends up further than `maxDisplacement` away from where it started.
 * Points which hit that limit stay overlapping – the limit wins over the
 * separation.
 *
 * @param {Point[]} points Pixel coordinates (modified in place)
 * @param {number} minSeparation Minimum distance between centers, in pixels
 * @param {{ iterations?: number, maxDisplacement?: number }} [options]
 * @returns {Point[]} the same (displaced) points
 */
export function displace(
	points,
	minSeparation,
	{iterations = DisplaceHandler.prototype.options.iterations, maxDisplacement = Infinity} = {},
) {
	const n = points.length;
	if (n < 2) { return points; }

	const sep = minSeparation;
	const sepSq = sep * sep;
	const cell = sep;
	const dx = new Float64Array(n);
	const dy = new Float64Array(n);
	// Anchors for `maxDisplacement`, the true positions of the points.
	const ax = Float64Array.from(points, point => point.x);
	const ay = Float64Array.from(points, point => point.y);

	for (let iter = 0; iter < iterations; iter++) {
		dx.fill(0);
		dy.fill(0);

		// Sort the points into a grid (cell size = separation).
		/** @type {Map<string, number[]>} */
		const grid = new Map();
		for (let i = 0; i < n; i++) {
			const key = `${Math.floor(points[i].x / cell)},${Math.floor(points[i].y / cell)}`;
			const bucket = grid.get(key);
			if (bucket) {
				bucket.push(i);
			} else {
				grid.set(key, [i]);
			}
		}

		let overlaps = 0;
		for (let i = 0; i < n; i++) {
			const cx = Math.floor(points[i].x / cell);
			const cy = Math.floor(points[i].y / cell);
			// Only the 3×3 neighbouring cells can be closer than `sep`.
			for (let gx = cx - 1; gx <= cx + 1; gx++) {
				for (let gy = cy - 1; gy <= cy + 1; gy++) {
					const bucket = grid.get(`${gx},${gy}`);
					if (!bucket) { continue; }
					for (const j of bucket) {
						if (j <= i) { continue; } // visit every pair once
						let vx = points[i].x - points[j].x;
						let vy = points[i].y - points[j].y;
						const distSq = vx * vx + vy * vy;
						if (distSq >= sepSq) { continue; }
						overlaps++;

						let dist;
						if (distSq === 0) {
							// Coincident points: deterministic direction derived
							// from the index (golden angle) instead of random.
							const angle = i * 2.399963229728653;
							vx = Math.cos(angle);
							vy = Math.sin(angle);
							dist = 1;
						} else {
							dist = Math.sqrt(distSq);
							vx /= dist;
							vy /= dist;
						}

						const push = (sep - dist) / 2;
						dx[i] += vx * push;
						dy[i] += vy * push;
						dx[j] -= vx * push;
						dy[j] -= vy * push;
					}
				}
			}
		}

		if (overlaps === 0) {
			break; // converged – nothing left to do
		}
		for (let i = 0; i < n; i++) {
			points[i].x += dx[i];
			points[i].y += dy[i];

			// Pull the point back onto the circle of radius `maxDisplacement`
			// around its anchor. Clamping inside the loop (instead of once at
			// the end) lets the following iterations redistribute along that
			// circle rather than piling up against it.
			const ox = points[i].x - ax[i];
			const oy = points[i].y - ay[i];
			const offsetSq = ox * ox + oy * oy;
			if (offsetSq > maxDisplacement * maxDisplacement) {
				const scale = maxDisplacement / Math.sqrt(offsetSq);
				points[i].x = ax[i] + ox * scale;
				points[i].y = ay[i] + oy * scale;
			}
		}
	}

	return points;
}

