import {Handler} from '../../core/Handler.js';
/** @import {MaplairMap} from '../Map.js' */

/**
 * Map options of `DoubleClickZoomHandler`.
 * @typedef {object} DoubleClickZoomHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean|'center'} [doubleClickZoom=true] Whether the map can be zoomed in
 * by double clicking on it and zoomed out by double clicking while holding shift. If
 * passed `'center'`, double-click zoom will zoom to the center of the view regardless
 * of where the pointer was.
 */

/**
 * Handler of `MaplairMap` for double-click zoom.
 *
 * Map properties include interaction handlers that allow you to control interaction
 * behavior in runtime, enabling or disabling certain features such as dragging or
 * touch zoom (see `Handler` methods). For example:
 *
 * ```js
 * map.doubleClickZoom.disable();
 * ```
 *
 * @typedef {object} DoubleClickZoomHandlerMapProperties
 * @lends MaplairMap
 * @property {DoubleClickZoomHandler} doubleClickZoom Double click zoom handler.
 */

/**
 * Handles double-click zoom on the map, enabled by default, see the map option
 * `doubleClickZoom`.
 */
export class DoubleClickZoomHandler extends Handler {
	/**
	 * @param {...MaplairMap} args The map.
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(DoubleClickZoomHandler);
	}

	/**
	 * Called when the handler is enabled, adds the event hooks.
	 */
	addHooks() {
		this._map.on('dblclick', this._onDoubleClick, this);
	}

	/**
	 * Called when the handler is disabled, removes the event hooks.
	 */
	removeHooks() {
		this._map.off('dblclick', this._onDoubleClick, this);
	}

	_onDoubleClick(e) {
		const map = this._map,
		oldZoom = map.getZoom(),
		delta = map.options.zoomDelta,
		zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;

		map._setUserEvent(e.originalEvent);
		if (map.options.doubleClickZoom === 'center') {
			map.setZoom(zoom);
		} else {
			map.setZoomAround(e.containerPoint, zoom);
		}
	}

	/**
	 * Registers this default feature on the map class, called by `MaplairMap` itself.
	 * @internal
	 * @param {typeof MaplairMap} MaplairMap
	 */
	static register(MaplairMap) {
		MaplairMap.mergeOptions({
			doubleClickZoom: true
		});

		MaplairMap.addInitHook('addHandler', 'doubleClickZoom', DoubleClickZoomHandler);
	}
}
