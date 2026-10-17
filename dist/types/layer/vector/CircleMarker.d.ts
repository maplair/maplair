import type { MaplairEvent } from '../../core/Events.js';
import type { PathOptions } from './Path.js';
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {PathOptions} from './Path.js' */
/**
 * Options of `CircleMarker`.
 * @typedef {object} CircleMarkerOptions
 * @property {boolean} [fill=true] Whether to fill the circle with color.
 * @property {number} [radius=10] Radius of the circle marker, in CSS pixels.
 * @extends PathOptions
 */
/**
 * The event object of `move` of circle markers.
 * @typedef {object} CircleMarkerMoveEvent
 * @property {LatLng} oldLatLng The previous position of the circle marker.
 * @property {LatLng} latlng The new position of the circle marker.
 * @extends MaplairEvent
 */
/**
 * A circle of a fixed size with radius specified in CSS pixels. Extends `Path`.
 *
 * @fires move {CircleMarkerMoveEvent} Fired when the marker is moved via
 * [`setLatLng`](#circlemarker-setlatlng). Old and new coordinates are included in
 * event arguments as `oldLatLng`, `latlng`.
 */
export class CircleMarker extends Path {
    /**
     * Instantiates a circle marker object given a geographical point, and an optional
     * options object.
     * @param {LatLngExpression} latlng
     * @param {CircleMarkerOptions} [options]
     */
    constructor(latlng: LatLngExpression, options?: CircleMarkerOptions);
    /**
     * Sets the position of a circle marker to a new location.
     * @param {LatLngExpression} latlng
     * @returns {this}
     */
    setLatLng(latlng: LatLngExpression): this;
    /**
     * Returns the current geographical position of the circle marker.
     * @returns {LatLng}
     */
    getLatLng(): LatLng;
    /**
     * Sets the radius of a circle marker. Units are in CSS pixels.
     * @param {number} radius
     * @returns {this}
     */
    setRadius(radius: number): this;
    /**
     * Returns the current radius of the circle. Units are in CSS pixels.
     * @returns {number}
     */
    getRadius(): number;
    /**
     * Changes the appearance of the circle marker, also its `radius`.
     * @param {CircleMarkerOptions} options
     * @returns {this}
     */
    setStyle(options: CircleMarkerOptions): this;
    /** The options of the CircleMarker, see [the options](#circlemarkeroptions). */
    options: CircleMarkerOptions;
}
/**
 * Options of `CircleMarker`.
 */
export interface CircleMarkerOptions extends PathOptions {
    /**
     * Whether to fill the circle with color.
     * @default true
     */
    fill?: boolean;
    /**
     * Radius of the circle marker, in CSS pixels.
     * @default 10
     */
    radius?: number;
}
/**
 * The event object of `move` of circle markers.
 */
export interface CircleMarkerMoveEvent extends MaplairEvent {
    /**
     * The previous position of the circle marker.
     */
    oldLatLng: LatLng;
    /**
     * The new position of the circle marker.
     */
    latlng: LatLng;
}
import { Path } from './Path.js';
import { LatLng } from '../../geo/LatLng.js';
import type { LatLngExpression } from '../../geo/LatLng.js';
import { Bounds } from '../../geometry/Bounds.js';
