import { MarkerDrag } from "./Marker.Drag.js";
import { Marker } from "./Marker.js";
//#region src/layer/marker/Marker.Rotation.js
const { _setPos: setPos } = Marker.prototype, { _onDrag: onDrag } = MarkerDrag.prototype;
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
Marker.include({ options: {
	rotationAngle: 0,
	rotationOrigin: void 0,
	rotateWithView: false
} });
/** @typedef {typeof markerRotationMethods} MarkerRotationMethods */
Marker.include({
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
	_rotateIcon() {
		const bearing = this.options.rotateWithView ? 0 : this._map?.getBearing?.() ?? 0;
		this._rotateElement(this._icon, bearing + (this.options.rotationAngle || 0), this.options.rotationOrigin);
		this._rotateElement(this._shadow, bearing);
	},
	_rotateElement(el, angle, origin) {
		if (!el) return;
		if (angle % 360) {
			el.style.transform += ` rotate(${angle}deg)`;
			el.style.transformOrigin = origin ?? `${-parseFloat(el.style.marginLeft) || 0}px ${-parseFloat(el.style.marginTop) || 0}px`;
		} else if (el.style.transformOrigin) el.style.transformOrigin = "";
	}
});
MarkerDrag.include({ _onDrag(e) {
	onDrag.call(this, e);
	this._marker._rotateIcon();
} });
//#endregion

//# sourceMappingURL=Marker.Rotation.js.map