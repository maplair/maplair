import {Control} from './Control.js';
import * as DomUtil from '../dom/DomUtil.js';
import * as DomEvent from '../dom/DomEvent.js';
import {I18n} from '../core/I18n.js';

/*
 * @class FullscreenControl
 * @inherits Control
 *
 * A control with a button to view the map in fullscreen and to exit it again. It is
 * put on the map if you set its [`fullscreenControl` option](#map-fullscreencontrol)
 * to `true`. Where the browser does not support the
 * [Fullscreen API](https://developer.mozilla.org/docs/Web/API/Fullscreen_API)
 * (e.g. Safari on iPhone) or refuses fullscreen (e.g. in an iframe without
 * `allow="fullscreen"`), the map is enlarged to the size of the window instead.
 * Extends `Control`.
 *
 * @example
 * ```js
 * new FullscreenControl({position: 'topright'}).addTo(map);
 * ```
 */

const enterIcon = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v2H4v3H2zm7 0h5v5h-2V4H9zM2 9h2v3h3v2H2zm10 0h2v5H9v-2h3z"/></svg>';
const exitIcon = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h2v5H2V5h3zm4 0h2v3h3v2H9zM2 9h5v5H5v-3H2zm7 0h5v2h-3v3H9z"/></svg>';

// @namespace FullscreenControl
// @constructor FullscreenControl(options?: FullscreenControl options)
// Creates a fullscreen control.
export class FullscreenControl extends Control {

	static {
		// @section
		// @aka FullscreenControl options
		this.setDefaultOptions({
			// @option position: String = 'topleft'
			// The position of the control (one of the map corners). Possible values are `'topleft'`,
			// `'topright'`, `'bottomleft'` or `'bottomright'`
			position: 'topleft',

			// @option enterText: String = (expand icon)
			// The HTML content of the button while the map is not in fullscreen.
			enterText: enterIcon,

			// @option exitText: String = (collapse icon)
			// The HTML content of the button while the map is in fullscreen.
			exitText: exitIcon
		});
	}

	constructor(...args) {
		super(...args);
		this.callInitHooks(FullscreenControl);
	}

	onAdd(map) {
		const container = DomUtil.create('div', 'maplair-control-fullscreen maplair-bar'),
		button = this._button = DomUtil.create('button', 'maplair-control-fullscreen-button', container);
		button.type = 'button';

		DomEvent.disableClickPropagation(button);
		DomEvent.on(button, 'click', DomEvent.stop);
		DomEvent.on(button, 'click', this._toggleFullscreen, this);
		DomEvent.on(button, 'click', this._refocusOnMap, this);

		this._update();
		map.on('fullscreenchange', this._update, this);

		return container;
	}

	onRemove(map) {
		map.off('fullscreenchange', this._update, this);
	}

	_toggleFullscreen() {
		this._map.toggleFullscreen();
	}

	_update() {
		const fullscreen = this._map.isFullscreen(),
		title = fullscreen ? I18n.translate('Exit fullscreen') : I18n.translate('View fullscreen');

		this._button.innerHTML = fullscreen ? this.options.exitText : this.options.enterText;
		this._button.title = title;
		this._button.setAttribute('aria-label', title);
		this._button.setAttribute('aria-pressed', fullscreen);
	}

	// Registers this default feature on the map class, called by `MaplairMap` itself.
	static register(MaplairMap) {
		// @namespace MaplairMap
		// @section Control options
		// @option fullscreenControl: Boolean = false
		// Whether a [fullscreen control](#fullscreencontrol) is added to the map by default.
		MaplairMap.mergeOptions({
			fullscreenControl: false
		});

		MaplairMap.include({
			// @section Methods for modifying map state
			// @method toggleFullscreen(): this
			// Enters or exits the fullscreen view of the map, see `FullscreenControl`.
			// Browsers allow entering fullscreen only in response to a user interaction,
			// e.g. a click.
			toggleFullscreen() {
				const container = this._container;

				if (this._fullscreen === 'pseudo') {
					this._setFullscreen(false);
				} else if (this._fullscreen) {
					document.exitFullscreen();
				} else if (document.fullscreenEnabled && container.requestFullscreen) {
					DomEvent.on(document, 'fullscreenchange', this._onFullscreenChange, this);
					container.requestFullscreen().catch(() => {
						DomEvent.off(document, 'fullscreenchange', this._onFullscreenChange, this);
						this._setFullscreen('pseudo');
					});
				} else {
					this._setFullscreen('pseudo');
				}
				return this;
			},

			// @section Other methods
			// @method isFullscreen(): Boolean
			// Returns `true` if the map is viewed in fullscreen.
			isFullscreen() {
				return !!this._fullscreen;
			},

			_onFullscreenChange() {
				const fullscreen = document.fullscreenElement === this._container;
				if (!fullscreen) {
					DomEvent.off(document, 'fullscreenchange', this._onFullscreenChange, this);
				}
				if (fullscreen !== this.isFullscreen()) {
					this._setFullscreen(fullscreen && 'native');
				}
			},

			_onFullscreenKeyDown(e) {
				if (e.key === 'Escape') {
					this._setFullscreen(false);
				}
			},

			// `mode` is `'native'` (Fullscreen API), `'pseudo'` (CSS) or `false`
			_setFullscreen(mode) {
				const container = this._container;
				this._fullscreen = mode;

				container.classList.toggle('maplair-fullscreen', !!mode);
				container.classList.toggle('maplair-pseudo-fullscreen', mode === 'pseudo');
				if (mode === 'pseudo') {
					DomEvent.on(document, 'keydown', this._onFullscreenKeyDown, this);
				} else {
					DomEvent.off(document, 'keydown', this._onFullscreenKeyDown, this);
				}

				this.invalidateSize();

				// @section Fullscreen events
				// @event enterfullscreen: Event
				// Fired when the map enters fullscreen.
				// @event exitfullscreen: Event
				// Fired when the map exits fullscreen.
				// @event fullscreenchange: Event
				// Fired when the map enters or exits fullscreen.
				this.fire(mode ? 'enterfullscreen' : 'exitfullscreen');
				this.fire('fullscreenchange');
			}
		});

		MaplairMap.addInitHook(function () {
			this.on('unload', function () {
				if (this._fullscreen === 'native') {
					DomEvent.off(document, 'fullscreenchange', this._onFullscreenChange, this);
					document.exitFullscreen();
				}
				this._container.classList.remove('maplair-fullscreen', 'maplair-pseudo-fullscreen');
				DomEvent.off(document, 'keydown', this._onFullscreenKeyDown, this);
				this._fullscreen = false;
			});

			if (this.options.fullscreenControl) {
				// @section Controls
				// @property fullscreenControl: FullscreenControl
				// The default fullscreen control (only available if the
				// [`fullscreenControl` option](#map-fullscreencontrol) was `true` when creating the map).
				this.fullscreenControl = new FullscreenControl();
				this.addControl(this.fullscreenControl);
			}
		});
	}
}
