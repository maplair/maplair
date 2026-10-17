import {Evented} from '../core/Events.js';
import * as DomUtil from '../dom/DomUtil.js';
/** @import {Point} from '../geometry/Point.js' */
/** @import {MaplairEvent} from '../core/Events.js' */

/**
 * Used internally for panning animations and utilizing CSS Transitions for modern
 * browsers.
 *
 * @example
 * ```js
 * const myPositionMarker = new Marker([48.864716, 2.294694]).addTo(map);
 *
 * myPositionMarker.on("click", function() {
 * 	const pos = map.latLngToLayerPoint(myPositionMarker.getLatLng());
 * 	pos.y -= 25;
 * 	const fx = new PosAnimation();
 *
 * 	fx.once('end',function() {
 * 		pos.y += 25;
 * 		fx.run(myPositionMarker._icon, pos, 0.8);
 * 	});
 *
 * 	fx.run(myPositionMarker._icon, pos, 0.3);
 * });
 *
 * ```
 *
 * @fires start {MaplairEvent} Fired when the animation starts.
 * @fires step {MaplairEvent} Fired continuously during the animation.
 * @fires end {MaplairEvent} Fired when the animation ends.
 */
export class PosAnimation extends Evented {
	/**
	 * Creates a `PosAnimation` object.
	 * @param {...any} args
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(PosAnimation);
	}

	/**
	 * Run an animation of a given element to a new position, optionally setting
	 * duration in seconds (`0.25` by default) and easing linearity factor (3rd
	 * argument of the [cubic bezier curve](https://cubic-bezier.com/#0,0,.5,1),
	 * `0.5` by default).
	 * @param {HTMLElement} el
	 * @param {Point} newPos
	 * @param {number} [duration=0.25]
	 * @param {number} [easeLinearity=0.5]
	 * @returns {void}
	 */
	run(el, newPos, duration, easeLinearity) {
		this.stop();

		this._el = el;
		this._inProgress = true;
		this._duration = duration ?? 0.25;
		this._easeOutPower = 1 / Math.max(easeLinearity ?? 0.5, 0.2);

		this._startPos = DomUtil.getPosition(el);
		this._offset = newPos.subtract(this._startPos);
		this._startTime = Date.now();

		this.fire('start');

		this._animate();
	}

	/**
	 * Stops the animation (if currently running).
	 * @returns {void}
	 */
	stop() {
		if (!this._inProgress) { return; }

		this._step(true);
		this._complete();
	}

	_animate() {
		// animation loop
		this._animId = requestAnimationFrame(this._animate.bind(this));
		this._step();
	}

	_step(round) {
		const elapsed = (Date.now()) - this._startTime,
		duration = this._duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._easeOut(elapsed / duration), round);
		} else {
			this._runFrame(1);
			this._complete();
		}
	}

	_runFrame(progress, round) {
		const pos = this._startPos.add(this._offset.multiplyBy(progress));
		if (round) {
			pos._round();
		}
		DomUtil.setPosition(this._el, pos);

		this.fire('step');
	}

	_complete() {
		cancelAnimationFrame(this._animId);

		this._inProgress = false;
		this.fire('end');
	}

	_easeOut(t) {
		return 1 - (1 - t) ** this._easeOutPower;
	}
}
