import {Path} from './Path.js';
import {SVG} from './SVG.js';
import {Canvas} from './Canvas.js';
import * as Util from '../../core/Util.js';
import Browser from '../../core/Browser.js';

const DASH_SEPARATOR_RE = /[ ,]+/;

// The methods extended below
const {_updateStyle: updateSvgStyle} = SVG.prototype,
{_fillStroke: fillStroke, _destroyContainer: destroyCanvasContainer} = Canvas.prototype;

/**
 * Options of `Path` for the animation of dashes. The animation of dashes is an
 * optional feature: import this module to add the `dashSpeed` option to `Path`.
 *
 * ```js
 * import 'maplair/dash-animation';
 *
 * new Polyline(latlngs, {dashArray: '10, 10', dashSpeed: 20}).addTo(map);
 * ```
 *
 * Inspired by the [leaflet-ant-path](https://github.com/rubenspgcavalcante/leaflet-ant-path) plugin.
 * @typedef {object} DashAnimationPathOptions
 * @lends PathOptions
 * @property {number} [dashSpeed=0] Animates the dashes of the `dashArray` along the
 * path ("marching ants"), e.g. to show the direction of a flow: the speed in pixels per
 * second, negative for the opposite direction. Not animated with
 * [reduced motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion).
 */

Path.include({
	options: {
		dashSpeed: 0
	},

	// The length of the dash pattern (repeated if it has an odd number of values)
	_getDashLength() {
		const dashArray = this.options.dashArray,
		values = (Array.isArray(dashArray) ? dashArray : String(dashArray ?? '').split(DASH_SEPARATOR_RE))
			.map(Number).filter(n => !Number.isNaN(n)),
		length = values.reduce((sum, value) => sum + value, 0);
		return values.length % 2 ? length * 2 : length;
	}
});

SVG.include({
	// a CSS animation of the dash offset by the length of the dash pattern
	_updateStyle(layer) {
		updateSvgStyle.call(this, layer);
		const path = layer._path;
		if (!path) { return; }
		const speed = layer.options.dashSpeed,
		dashLength = layer.options.stroke && speed && layer._getDashLength();
		path.classList.toggle('maplair-dash-animated', !!dashLength);
		if (dashLength) {
			path.style.setProperty('--maplair-dash-length', `${Math.sign(speed) * dashLength}px`);
			path.style.setProperty('--maplair-dash-duration', `${dashLength / Math.abs(speed)}s`);
		}
	}
});

Canvas.include({
	// drawing with the dash offset shifted by the time
	_fillStroke(ctx, layer) {
		const shift = this._getDashShift(layer);
		if (!shift) {
			fillStroke.call(this, ctx, layer);
			return;
		}
		const options = layer.options,
		own = Object.hasOwn(options, 'dashOffset'),
		dashOffset = options.dashOffset;
		Util.setOptions(layer, {dashOffset: Number(dashOffset ?? 0) - shift});
		fillStroke.call(this, ctx, layer);
		if (own) {
			options.dashOffset = dashOffset;
		} else {
			delete options.dashOffset;
		}
	},

	_destroyContainer() {
		cancelAnimationFrame(this._dashFrame);
		this._dashFrame = null;
		destroyCanvasContainer.call(this);
	},

	// The shift of the dashes of an animated path, and keeps redrawing it
	_getDashShift(layer) {
		const speed = layer.options.dashSpeed,
		length = speed && !Browser.reducedMotion && layer._getDashLength();
		if (!length) { return 0; }

		this._animatedDashes ??= new Set();
		this._animatedDashes.add(layer);
		this._dashFrame ??= requestAnimationFrame(() => {
			this._dashFrame = null;
			for (const animated of this._animatedDashes) {
				if (this._layers[Util.stamp(animated)] && animated.options.dashSpeed) {
					this._requestRedraw(animated);
				}
			}
			this._animatedDashes.clear();
		});
		return (performance.now() / 1000 * speed) % length;
	}
});
