import {Layer} from '../Layer.js';
import {DefaultIcon} from './DefaultIcon.js';
import * as Util from '../../core/Util.js';
import {LatLng} from '../../geo/LatLng.js';
import {Point} from '../../geometry/Point.js';
import * as DomUtil from '../../dom/DomUtil.js';
import * as DomEvent from '../../dom/DomEvent.js';
import {MarkerDrag} from './Marker.Drag.js';
import {pointToGeoJSON} from '../GeoJSONUtil.js';
/** @import {Feature} from 'geojson' */
/** @import {Icon} from './Icon.js' */
/** @import {LatLngExpression} from '../../geo/LatLng.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/** @import {MaplairMap} from '../../map/Map.js' */
/** @import {MaplairEvent} from '../../core/Events.js' */
/** @import {InteractiveLayerOptions} from '../Layer.js' */

/**
 * Options of `Marker`.
 * @typedef {object} MarkerOptions
 * @property {Icon} [icon=new DefaultIcon()] Icon instance to use for rendering the
 * marker. See [Icon documentation](#Icon) for details on how to customize the marker
 * icon. If not specified, a common instance of `DefaultIcon` is used.
 * @property {boolean} [keyboard=true] Whether the marker can be tabbed to with a keyboard
 * and, if interactive, clicked by pressing Enter or Space.
 * @property {string} [title=''] Text for the browser tooltip that appear on marker hover
 * (no tooltip by default).
 * [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
 * @property {string} [alt='Marker'] Text for the `alt` attribute of the icon image.
 * [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
 * @property {number} [zIndexOffset=0] By default, marker images zIndex is set
 * automatically based on its latitude. Use this option if you want to put the marker on
 * top of all others (or below), specifying a high value like `1000` (or high negative
 * value, respectively).
 * @property {number} [opacity=1] The opacity of the marker.
 * @property {number|null} [rotation=null] Rotation of the marker icon in degrees,
 * clockwise, around the icon anchor, e.g. for the heading of a vehicle. A rotated
 * marker, even at 0°, has no shadow, since the shadow of an upright pin looks wrong
 * under a tilted one. `null` means no rotation.
 * @property {boolean} [riseOnHover=false] If `true`, the marker will get on top of
 * others when you hover the pointer over it.
 * @property {number} [riseOffset=250] The z-index offset used for the `riseOnHover`
 * feature.
 * @property {string} [pane='markerPane'] `Map pane` where the markers icon will be added.
 * @property {string} [shadowPane='shadowPane'] `Map pane` where the markers shadow will
 * be added.
 * @property {boolean} [shadow=true] Whether to show the shadow of the marker's icon. Each
 * shadow is an additional element on the page, so disabling shadows noticeably reduces
 * the browser's rendering work when showing many markers (e.g. several thousands),
 * especially while panning and zooming. To disable shadows for all markers, use
 * `Marker.mergeOptions({shadow: false})`.
 * @property {boolean} [bubblingPointerEvents=false] When `true`, a pointer event on this
 * marker will trigger the same event on the map (unless
 * [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
 * @property {boolean} [autoPanOnFocus=true] When `true`, the map will pan whenever the
 * marker is focused (via e.g. pressing `tab` on the keyboard) to ensure the marker is
 * visible within the map's bounds.
 * @property {boolean} [draggable=false] Whether the marker is draggable with pointer or
 * not.
 * @property {boolean} [autoPan=false] Whether to pan the map when dragging this marker
 * near its edge or not.
 * @property {PointExpression} [autoPanPadding=[50, 50]] Distance (in pixels to the
 * left/right and to the top/bottom) of the map edge to start panning the map.
 * @property {number} [autoPanSpeed=10] Number of pixels the map should pan by.
 * @extends InteractiveLayerOptions
 */

/**
 * The event object of `move` and `drag` of markers.
 * @typedef {object} MarkerMoveEvent
 * @property {LatLng} latlng The new position of the marker.
 * @property {LatLng} [oldLatLng] The previous position of the marker.
 * @extends MaplairEvent
 */

/**
 * Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
 *
 * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and
 * [popup methods](#Popup) like `bindPopup()` you can also use the methods below.
 *
 * @example
 * ```js
 * new Marker([50.5, 30.5]).addTo(map);
 * ```
 *
 * @fires move {MarkerMoveEvent} Fired when the marker is moved via
 * [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new
 * coordinates are included in event arguments as `oldLatLng`, `latlng`.
 */
export class Marker extends Layer {

	static defaultOptions = {
		icon: /* @__PURE__ */ new DefaultIcon(),

		// Option inherited from "Interactive layer" abstract class
		interactive: true,

		keyboard: true,
		title: '',
		alt: 'Marker',
		zIndexOffset: 0,
		opacity: 1,
		rotation: null,
		riseOnHover: false,
		riseOffset: 250,
		pane: 'markerPane',
		shadowPane: 'shadowPane',
		shadow: true,
		bubblingPointerEvents: false,
		autoPanOnFocus: true,
		draggable: false,
		autoPan: false,
		autoPanPadding: [50, 50],
		autoPanSpeed: 10
	};

	/**
	 * Instantiates a Marker object given a geographical point and optionally an options
	 * object.
	 * @param {LatLngExpression} latlng
	 * @param {MarkerOptions} [options]
	 */
	constructor(latlng, options) {
		super();
		Util.setOptions(this, options);
		this._latlng = new LatLng(latlng);

		this.callInitHooks(Marker);
	}

	/**
	 * Adds the icon (and shadow) of the marker to the map.
	 * @param {MaplairMap} map
	 */
	onAdd(map) {
		this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;

		if (this._zoomAnimated) {
			map.on('zoomanim', this._animateZoom, this);
		}

		this._initIcon();
		this.update();

		if (map.options.markerCulling) {
			this._updateCulling();
		}
	}

	/**
	 * Removes the icon (and shadow) of the marker from the map.
	 * @param {MaplairMap} map
	 */
	onRemove(map) {
		if (this.dragging) {
			// remember whether dragging is on or off (`dragging.disable()`) for when the marker is added again
			this.options.draggable = this.dragging.enabled();
			if (this.options.draggable) { this.dragging.removeHooks(); }
		}
		delete this.dragging;

		if (this._zoomAnimated) {
			map.off('zoomanim', this._animateZoom, this);
		}

		this._removeIcon();
		this._removeShadow();
		this._culled = false;
	}

	/**
	 * Returns the map events the marker listens to, see `Layer`.
	 * @returns {Record<string, Function>}
	 */
	getEvents() {
		const events = {
			zoom: this.update,
			viewreset: this.update
		};
		if (this._map?.options.markerCulling) {
			events.moveend = this._updateCulling;
		}
		return events;
	}

	/**
	 * Returns the current geographical position of the marker.
	 * @returns {LatLng}
	 */
	getLatLng() {
		return this._latlng;
	}

	/**
	 * Changes the marker position to the given point.
	 * @param {LatLngExpression} latlng
	 * @returns {this}
	 */
	setLatLng(latlng) {
		const oldLatLng = this._latlng;
		this._latlng = new LatLng(latlng);
		if (this._map?.options.markerCulling) {
			this._updateCulling();
		}
		this.update();

		return this.fire('move', {oldLatLng, latlng: this._latlng});
	}

	/**
	 * Changes the [zIndex offset](#markeroptions-zindexoffset) of the marker.
	 * @param {number} offset
	 * @returns {this}
	 */
	setZIndexOffset(offset) {
		this.options.zIndexOffset = offset;
		return this.update();
	}

	/**
	 * Returns the current icon used by the marker.
	 * @returns {Icon}
	 */
	getIcon() {
		return this.options.icon;
	}

	/**
	 * Changes the marker icon.
	 * @param {Icon} icon
	 * @returns {this}
	 */
	setIcon(icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		return this;
	}

	/**
	 * Returns the instance of [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)
	 * used by Marker layer.
	 * @returns {HTMLElement}
	 */
	getElement() {
		return this._icon;
	}

	/**
	 * Updates the position of the marker on the map, e.g. after a change of its options.
	 * @returns {this}
	 */
	update() {

		if (this._icon && this._map && !this._culled) {
			const pos = this._map.latLngToLayerPoint(this._latlng)._round();
			this._setPos(pos);
		}

		return this;
	}

	_initIcon() {
		const options = this.options,
		classToAdd = `maplair-zoom-${this._zoomAnimated ? 'animated' : 'hide'}`;

		const icon = options.icon.createIcon(this._icon);
		let addIcon = false;

		// if we're not reusing the icon, remove the old one and init new one
		if (icon !== this._icon) {
			if (this._icon) {
				this._removeIcon();
			}
			addIcon = true;

			if (options.title) {
				icon.title = options.title;
			}

			if (icon instanceof HTMLImageElement) {
				icon.alt = options.alt ?? '';
			}
		}

		icon.classList.add(classToAdd);

		if (options.keyboard) {
			icon.tabIndex = 0;
			if (options.interactive) {
				icon.setAttribute('role', 'button');
			}
			DomEvent.on(icon, 'keydown', this._onKeyDown, this);
		}

		this._icon = icon;

		if (options.riseOnHover) {
			this.on({
				pointerover: this._bringToFront,
				pointerout: this._resetZIndex
			});
		}

		if (this.options.autoPanOnFocus) {
			DomEvent.on(icon, 'focus', this._panOnFocus, this);
		}

		const newShadow = options.shadow ? options.icon.createShadow?.(this._shadow) ?? null : null;
		let addShadow = false;

		if (newShadow !== this._shadow) {
			this._removeShadow();
			addShadow = true;
		}

		if (newShadow) {
			newShadow.classList.add(classToAdd);
			newShadow.alt = '';
		}
		this._shadow = newShadow;


		if (options.opacity < 1) {
			this._updateOpacity();
		}


		if (addIcon) {
			this.getPane().appendChild(this._icon);
		}
		this._initInteraction();
		if (newShadow && addShadow) {
			this.getPane(options.shadowPane).appendChild(this._shadow);
		}
	}

	_removeIcon() {
		if (this.options.riseOnHover) {
			this.off({
				pointerover: this._bringToFront,
				pointerout: this._resetZIndex
			});
		}

		if (this.options.autoPanOnFocus) {
			DomEvent.off(this._icon, 'focus', this._panOnFocus, this);
		}
		DomEvent.off(this._icon, 'keydown', this._onKeyDown, this);

		this._icon.remove();
		this.removeInteractiveTarget(this._icon);

		this._icon = null;
	}

	// With the map's `markerCulling` option, takes the icon and shadow of a marker
	// far outside of the map view off the page (and puts them back when needed),
	// so that the browser doesn't need to render, and the marker doesn't need
	// to reposition, them while panning and zooming.
	_updateCulling() {
		if (!this._icon || !this._map) { return; }

		const map = this._map,
		// computed once per view for all markers, reset by the map on `move`
		bounds = map._cullingBounds ??= map.getBounds().pad(0.5),
		visible = bounds.contains(this._latlng) ||
			!!this.dragging?._draggable?._moving ||
			this._icon.contains(document.activeElement);

		if (visible === !this._culled) { return; }
		this._culled = !visible;

		if (visible) {
			this.getPane().appendChild(this._icon);
			if (this._shadow) {
				this.getPane(this.options.shadowPane).appendChild(this._shadow);
			}
			this.update();
		} else {
			this._icon.remove();
			this._shadow?.remove();
		}
	}

	_removeShadow() {
		this._shadow?.remove();
		this._shadow = null;
	}

	_setPos(pos) {
		this._positionElements(pos);

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	}

	_positionElements(pos) {
		const rotation = this.options.rotation;

		if (this._icon) {
			DomUtil.setPosition(this._icon, pos);
			if (rotation != null) {
				this._icon.style.transform += ` rotate(${rotation}deg)`;
			}
		}

		if (this._shadow) {
			DomUtil.setPosition(this._shadow, pos);
			this._shadow.style.display = rotation == null ? '' : 'none';
		}
	}

	_updateZIndex(offset) {
		const zIndex = String(this._zIndex + offset);
		if (this._icon && this._icon.style.zIndex !== zIndex) {
			this._icon.style.zIndex = zIndex;
		}
	}

	_animateZoom(opt) {
		if (this._culled) { return; }
		const pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center)._round();

		this._setPos(pos);
	}

	_updateInteractive() {
		if (!this._icon) { return; }
		if (this.options.keyboard) {
			if (this.options.interactive) {
				this._icon.setAttribute('role', 'button');
			} else {
				this._icon.removeAttribute('role');
			}
		}
		if (this.options.interactive) {
			this._initInteraction();
			if (this._draggableBeforeNonInteractive) {
				this.dragging?.enable();
			}
		} else {
			this._icon.classList.remove('maplair-interactive');
			this.removeInteractiveTarget(this._icon);
			this._draggableBeforeNonInteractive = this.dragging?.enabled();
			this.dragging?.disable();
		}
	}

	_initInteraction() {

		if (!this.options.interactive) { return; }

		this._icon.classList.add('maplair-interactive');

		this.addInteractiveTarget(this._icon);

		if (MarkerDrag) {
			// When the icon element is reused, the drag handler still refers to it. Keep that handler, because
			// replacing it ends a drag in progress and forgets that the marker has just been dragged.
			if (this.dragging?._draggable?._element === this._icon) {
				// the icon has reset the class names of the element
				this._icon.classList.toggle('maplair-marker-draggable', this.dragging.enabled());
				return;
			}

			let draggable = this.options.draggable;
			if (this.dragging) {
				draggable = this.dragging.enabled();
				this.dragging.disable();
			}

			/**
			 * Marker dragging handler, see `Handler`. Only valid when the marker is on the
			 * map (otherwise set [`marker.options.draggable`](#markeroptions-draggable)).
			 *
			 * Interaction handlers are properties of a marker instance that allow you to
			 * control interaction behavior in runtime, enabling or disabling certain
			 * features such as dragging (see `Handler` methods). Example:
			 *
			 * ```js
			 * marker.dragging.disable();
			 * ```
			 * @group Interaction handlers
			 * @type {MarkerDrag}
			 */
			this.dragging = new MarkerDrag(this);

			if (draggable) {
				this.dragging.enable();
			}
		}
	}

	/**
	 * Returns the current [rotation](#markeroptions-rotation) of the marker in degrees.
	 * @returns {number|null}
	 */
	getRotation() {
		return this.options.rotation;
	}

	/**
	 * Changes the [rotation](#markeroptions-rotation) of the marker; `null` removes it.
	 * @param {number|null} rotation
	 * @returns {this}
	 */
	setRotation(rotation) {
		this.options.rotation = rotation;
		// mid-zoom, the icon is transitioning to a position that update() can't compute yet; the zoom end applies it
		if (this._icon && !this._map._animatingZoom) {
			this._positionElements(DomUtil.getPosition(this._icon));
			this._popup?._updatePosition();
			this._tooltip?._updatePosition();
		}
		return this;
	}

	/**
	 * Changes the opacity of the marker.
	 * @param {number} opacity
	 * @returns {this}
	 */
	setOpacity(opacity) {
		this.options.opacity = opacity;
		if (this._map) {
			this._updateOpacity();
		}

		return this;
	}

	_updateOpacity() {
		const opacity = this.options.opacity;

		if (this._icon) {
			this._icon.style.opacity = `${opacity}`;
		}

		if (this._shadow) {
			this._shadow.style.opacity = `${opacity}`;
		}
	}

	_bringToFront() {
		this._updateZIndex(this.options.riseOffset);
	}

	_resetZIndex() {
		this._updateZIndex(0);
	}

	_onKeyDown(e) {
		// a key pressed on a focusable element inside a DivIcon (e.g. a <button>) already clicks it natively
		if (this.options.interactive && e.target === this._icon && !e.repeat && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault(); // stop Space from scrolling the page
			// lets a popup opened by the click take the focus, see Popup.onAdd()
			this._clickedByKeyboard = true;
			this._icon.click();
			this._clickedByKeyboard = false;
		}
	}

	_panOnFocus() {
		const map = this._map;
		if (!map) { return; }

		const icon = this._icon,
		style = getComputedStyle(icon),
		anchor = new Point(-parseFloat(style.marginLeft) || 0, -parseFloat(style.marginTop) || 0),
		size = new Point(icon.offsetWidth, icon.offsetHeight);

		map.panInside(this._latlng, {
			paddingTopLeft: anchor,
			paddingBottomRight: size.subtract(anchor)
		});
	}

	_getPopupAnchor() {
		return this._rotateAnchor(this.options.icon.options.popupAnchor);
	}

	_getTooltipAnchor() {
		return this._rotateAnchor(this.options.icon.options.tooltipAnchor);
	}

	// anchors are offsets from the icon anchor, which is also the rotation origin
	_rotateAnchor(anchor) {
		const angle = this.options.rotation * Math.PI / 180;
		if (!angle || !anchor) { return anchor; }

		const {x, y} = Point.from(anchor),
		cos = Math.cos(angle),
		sin = Math.sin(angle);
		return new Point(x * cos - y * sin, x * sin + y * cos);
	}

	/**
	 * Coordinates values are rounded with [`formatNum`](#util-formatnum) to the
	 * given `precision`. Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON)
	 * representation of the marker (as a GeoJSON `Point` Feature).
	 * @group Other methods
	 * @param {number|false} [precision]
	 * @returns {Feature}
	 */
	toGeoJSON(precision) {
		return pointToGeoJSON(this, precision);
	}
}
