import {Marker} from './Marker.js';
import {MarkerDrag} from './Marker.Drag.js';

/*
 * @namespace Marker
 * @section Marker rotation
 *
 * The rotation of marker icons is an optional feature: import this module to add
 * the `rotationAngle`, `rotationOrigin` and `rotateWithView` options and
 * `setRotationAngle()`/`setRotationOrigin()` to `Marker` (it is also part of the
 * map rotation, see `MaplairMap.setBearing()`).
 *
 * ```js
 * import 'maplair/marker-rotation';
 *
 * new Marker([47.27, 11.40], {rotationAngle: 45}).addTo(map);
 * ```
 *
 * Inspired by the [Leaflet.RotatedMarker](https://github.com/bbecquet/Leaflet.RotatedMarker) plugin.
 */

// The methods extended below
const {_setPos: setPos} = Marker.prototype,
{_onDrag: onDrag} = MarkerDrag.prototype;

Marker.include({
	options: {
		// @section
		// @aka Marker options
		// @option rotationAngle: Number = 0
		// Rotation of the icon in degrees, clockwise, e.g. for the heading of a
		// vehicle. On a rotated map, the angle is relative to the screen, or to
		// north with `rotateWithView`. The shadow is not rotated.
		rotationAngle: 0,

		// @option rotationOrigin: String = undefined
		// The CSS [`transform-origin`](https://developer.mozilla.org/docs/Web/CSS/transform-origin)
		// to rotate the icon around, e.g. `'center'`. By default the anchor of the icon.
		rotationOrigin: undefined,

		// @option rotateWithView: Boolean = false
		// On a rotated map (see `MaplairMap.setBearing()`), whether the icon rotates
		// with the map (e.g. for arrows pointing in a geographic direction) instead
		// of staying upright.
		rotateWithView: false
	},

	// @method setRotationAngle(angle: Number): this
	// Changes the [`rotationAngle`](#marker-rotationangle) of the icon.
	setRotationAngle(angle) {
		this.options.rotationAngle = angle;
		return this.update();
	},

	// @method setRotationOrigin(origin: String): this
	// Changes the [`rotationOrigin`](#marker-rotationorigin) of the icon.
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
});

MarkerDrag.include({
	_onDrag(e) {
		onDrag.call(this, e);
		// dragging positions the icon without the rotation
		this._marker._rotateIcon();
	}
});
