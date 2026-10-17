import {Marker} from './Marker.js';
import {MarkerDrag} from './Marker.Drag.js';

// The methods extended below
const {_setPos: setPos} = Marker.prototype,
{_onDrag: onDrag} = MarkerDrag.prototype;

/**
 * Options of `Marker` for the rotation of marker icons, see the
 * [marker rotation](#marker-setrotationangle).
 * @typedef {object} MarkerRotationOptions
 * @lends MarkerOptions
 * @property {number} [rotationAngle=0] Rotation of the icon in degrees, clockwise, e.g.
 * for the heading of a vehicle. On a rotated map, the angle is relative to the screen,
 * or to north with `rotateWithView`. The shadow is not rotated.
 * @property {string} [rotationOrigin] The CSS
 * [`transform-origin`](https://developer.mozilla.org/docs/Web/CSS/transform-origin) to
 * rotate the icon around, e.g. `'center'`. By default the anchor of the icon.
 * @property {boolean} [rotateWithView=false] On a rotated map (see
 * `MaplairMap.setBearing()`), whether the icon rotates with the map (e.g. for arrows
 * pointing in a geographic direction) instead of staying upright.
 */
Marker.include({
	options: {
		rotationAngle: 0,
		rotationOrigin: undefined,
		rotateWithView: false
	}
});

/**
 * Methods of `Marker` for the rotation of marker icons, an optional feature: import
 * this module to add the `rotationAngle`, `rotationOrigin` and `rotateWithView` options
 * and `setRotationAngle()`/`setRotationOrigin()` to `Marker` (it is also part of the
 * map rotation, see `MaplairMap.setBearing()`).
 *
 * ```js
 * import 'maplair/marker-rotation';
 *
 * new Marker([47.27, 11.40], {rotationAngle: 45}).addTo(map);
 * ```
 *
 * Inspired by the [Leaflet.RotatedMarker](https://github.com/bbecquet/Leaflet.RotatedMarker) plugin.
 * @lends Marker.prototype
 */
const markerRotationMethods = {
	/**
	 * Changes the [`rotationAngle`](#markeroptions-rotationangle) of the icon.
	 * @group Marker rotation
	 * @param {number} angle
	 * @returns {this}
	 */
	setRotationAngle(angle) {
		this.options.rotationAngle = angle;
		return this.update();
	},

	/**
	 * Changes the [`rotationOrigin`](#markeroptions-rotationorigin) of the icon.
	 * @group Marker rotation
	 * @param {string} origin
	 * @returns {this}
	 */
	setRotationOrigin(origin) {
		this.options.rotationOrigin = origin;
		return this.update();
	},

	_setPos(pos) {
		setPos.call(this, pos);
		this._rotateIcon();
	},

	// Rotates the icon by the `rotationAngle`, and keeps the icon and the shadow
	// upright on a rotated map
	_rotateIcon() {
		const bearing = this.options.rotateWithView ? 0 : (this._map?.getBearing?.() ?? 0);
		this._rotateElement(this._icon, bearing + (this.options.rotationAngle || 0), this.options.rotationOrigin);
		this._rotateElement(this._shadow, bearing);
	},

	// Rotates an element positioned with `DomUtil.setPosition()` around its anchor (or `origin`)
	_rotateElement(el, angle, origin) {
		if (!el) { return; }
		if (angle % 360) {
			el.style.transform += ` rotate(${angle}deg)`;
			el.style.transformOrigin = origin ?? `${-parseFloat(el.style.marginLeft) || 0}px ${-parseFloat(el.style.marginTop) || 0}px`;
		} else if (el.style.transformOrigin) {
			el.style.transformOrigin = '';
		}
	}
};
/** @typedef {typeof markerRotationMethods} MarkerRotationMethods */

Marker.include(markerRotationMethods);

MarkerDrag.include({
	_onDrag(e) {
		onDrag.call(this, e);
		// dragging positions the icon without the rotation
		this._marker._rotateIcon();
	}
});
