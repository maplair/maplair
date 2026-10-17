import { setOptions } from "../../core/Util.js";
import { Path } from "./Path.js";
import { Bounds } from "../../geometry/Bounds.js";
import { LatLng } from "../../geo/LatLng.js";
//#region src/layer/vector/CircleMarker.js
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
var CircleMarker = class CircleMarker extends Path {
	static {
		this.setDefaultOptions({
			fill: true,
			radius: 10
		});
	}
	/**
	* Instantiates a circle marker object given a geographical point, and an optional
	* options object.
	* @param {LatLngExpression} latlng
	* @param {CircleMarkerOptions} [options]
	*/
	constructor(latlng, options) {
		super();
		setOptions(this, options);
		this._latlng = new LatLng(latlng);
		this._radius = this.options.radius;
		this.callInitHooks(CircleMarker);
	}
	/**
	* Sets the position of a circle marker to a new location.
	* @param {LatLngExpression} latlng
	* @returns {this}
	*/
	setLatLng(latlng) {
		const oldLatLng = this._latlng;
		this._latlng = new LatLng(latlng);
		this.redraw();
		return this.fire("move", {
			oldLatLng,
			latlng: this._latlng
		});
	}
	/**
	* Returns the current geographical position of the circle marker.
	* @returns {LatLng}
	*/
	getLatLng() {
		return this._latlng;
	}
	/**
	* Sets the radius of a circle marker. Units are in CSS pixels.
	* @param {number} radius
	* @returns {this}
	*/
	setRadius(radius) {
		this.options.radius = this._radius = radius;
		return this.redraw();
	}
	/**
	* Returns the current radius of the circle. Units are in CSS pixels.
	* @returns {number}
	*/
	getRadius() {
		return this._radius;
	}
	/**
	* Changes the appearance of the circle marker, also its `radius`.
	* @param {CircleMarkerOptions} options
	* @returns {this}
	*/
	setStyle(options) {
		super.setStyle(options);
		if (options?.radius !== void 0) this.setRadius(options.radius);
		return this;
	}
	_project() {
		this._point = this._map.latLngToLayerPoint(this._latlng);
		this._pxRadius = this._radius;
		this._updateBounds();
	}
	_updateBounds() {
		const r = this._pxRadius, r2 = this._pxRadiusY ?? r, w = this._clickTolerance(), p = [r + w, r2 + w];
		this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
	}
	_update() {
		if (this._map) this._updatePath();
	}
	_updatePath() {
		this._renderer._updateCircle(this);
	}
	_empty() {
		return this._pxRadius && !this._renderer._bounds.intersects(this._pxBounds);
	}
	_containsPoint(p) {
		return p.distanceTo(this._point) <= this._pxRadius + this._clickTolerance();
	}
};
//#endregion
export { CircleMarker };

//# sourceMappingURL=CircleMarker.js.map