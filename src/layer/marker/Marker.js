import {Layer} from '../Layer.js';
import {DefaultIcon} from './DefaultIcon.js';
import * as Util from '../../core/Util.js';
import {LatLng} from '../../geo/LatLng.js';
import {Point} from '../../geometry/Point.js';
import * as DomUtil from '../../dom/DomUtil.js';
import * as DomEvent from '../../dom/DomEvent.js';
import {MarkerDrag} from './Marker.Drag.js';

/*
 * @class Marker
 * @inherits Interactive layer
 * Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
 *
 * @example
 *
 * ```js
 * new Marker([50.5, 30.5]).addTo(map);
 * ```
 */

// @constructor Marker(latlng: LatLng, options? : Marker options)
// Instantiates a Marker object given a geographical point and optionally an options object.
export class Marker extends Layer {

	static {
		// @section
		// @aka Marker options
		this.setDefaultOptions({
			// @option icon: Icon = *
			// Icon instance to use for rendering the marker.
			// See [Icon documentation](#Icon) for details on how to customize the marker icon.
			// If not specified, a common instance of `DefaultIcon` is used.
			icon: new DefaultIcon(),

			// Option inherited from "Interactive layer" abstract class
			interactive: true,

			// @option keyboard: Boolean = true
			// Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
			keyboard: true,

			// @option title: String = ''
			// Text for the browser tooltip that appear on marker hover (no tooltip by default).
			// [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
			title: '',

			// @option alt: String = 'Marker'
			// Text for the `alt` attribute of the icon image.
			// [Useful for accessibility](https://maplair.org/examples/accessibility/#markers-must-be-labelled).
			alt: 'Marker',

			// @option zIndexOffset: Number = 0
			// By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
			zIndexOffset: 0,

			// @option opacity: Number = 1.0
			// The opacity of the marker.
			opacity: 1,

			// @option riseOnHover: Boolean = false
			// If `true`, the marker will get on top of others when you hover the pointer over it.
			riseOnHover: false,

			// @option riseOffset: Number = 250
			// The z-index offset used for the `riseOnHover` feature.
			riseOffset: 250,

			// @option rotateWithView: Boolean = false
			// On a rotated map (see `MaplairMap.setBearing()`), whether the icon rotates
			// with the map (e.g. for arrows pointing in a geographic direction) instead
			// of staying upright.
			rotateWithView: false,

			// @option rotationAngle: Number = 0
			// Rotation of the icon in degrees, clockwise, e.g. for the heading of a
			// vehicle. On a rotated map, the angle is relative to the screen, or to
			// north with `rotateWithView`. The shadow is not rotated.
			// Inspired by the [Leaflet.RotatedMarker](https://github.com/bbecquet/Leaflet.RotatedMarker) plugin.
			rotationAngle: 0,

			// @option rotationOrigin: String = undefined
			// The CSS [`transform-origin`](https://developer.mozilla.org/docs/Web/CSS/transform-origin)
			// to rotate the icon around, e.g. `'center'`. By default the anchor of the icon.
			rotationOrigin: undefined,

			// @option pane: String = 'markerPane'
			// `Map pane` where the markers icon will be added.
			pane: 'markerPane',

			// @option shadowPane: String = 'shadowPane'
			// `Map pane` where the markers shadow will be added.
			shadowPane: 'shadowPane',

			// @option shadow: Boolean = true
			// Whether to show the shadow of the marker's icon. Each shadow is an
			// additional element on the page, so disabling shadows noticeably reduces
			// the browser's rendering work when showing many markers (e.g. several
			// thousands), especially while panning and zooming. To disable shadows
			// for all markers, use `Marker.mergeOptions({shadow: false})`.
			shadow: true,

			// @option bubblingPointerEvents: Boolean = false
			// When `true`, a pointer event on this marker will trigger the same event on the map
			// (unless [`DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
			bubblingPointerEvents: false,

			// @option autoPanOnFocus: Boolean = true
			// When `true`, the map will pan whenever the marker is focused (via
			// e.g. pressing `tab` on the keyboard) to ensure the marker is
			// visible within the map's bounds
			autoPanOnFocus: true,

			// @section Draggable marker options
			// @option draggable: Boolean = false
			// Whether the marker is draggable with pointer or not.
			draggable: false,

			// @option autoPan: Boolean = false
			// Whether to pan the map when dragging this marker near its edge or not.
			autoPan: false,

			// @option autoPanPadding: Point = Point(50, 50)
			// Distance (in pixels to the left/right and to the top/bottom) of the
			// map edge to start panning the map.
			autoPanPadding: [50, 50],

			// @option autoPanSpeed: Number = 10
			// Number of pixels the map should pan by.
			autoPanSpeed: 10
		});
	}

	/* @section
	 *
	 * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
	 */

	constructor(latlng, options) {
		super();
		Util.setOptions(this, options);
		this._latlng = new LatLng(latlng);

		this.callInitHooks(Marker);
	}

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

	onRemove(map) {
		if (this.dragging?.enabled()) {
			this.options.draggable = true;
			this.dragging.removeHooks();
		}
		delete this.dragging;

		if (this._zoomAnimated) {
			map.off('zoomanim', this._animateZoom, this);
		}

		this._removeIcon();
		this._removeShadow();
		this._culled = false;
	}

	getEvents() {
		const events = {
			zoom: this.update,
			viewreset: this.update,
			rotate: this.update
		};
		if (this._map?.options.markerCulling) {
			events.moveend = this._updateCulling;
		}
		return events;
	}

	// @method getLatLng: LatLng
	// Returns the current geographical position of the marker.
	getLatLng() {
		return this._latlng;
	}

	// @method setLatLng(latlng: LatLng): this
	// Changes the marker position to the given point.
	setLatLng(latlng) {
		const oldLatLng = this._latlng;
		this._latlng = new LatLng(latlng);
		if (this._map?.options.markerCulling) {
			this._updateCulling();
		}
		this.update();

		// @event move: Event
		// Fired when the marker is moved via [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.
		return this.fire('move', {oldLatLng, latlng: this._latlng});
	}

	// @method setZIndexOffset(offset: Number): this
	// Changes the [zIndex offset](#marker-zindexoffset) of the marker.
	setZIndexOffset(offset) {
		this.options.zIndexOffset = offset;
		return this.update();
	}

	// @method getIcon: Icon
	// Returns the current icon used by the marker
	getIcon() {
		return this.options.icon;
	}

	// @method setIcon(icon: Icon): this
	// Changes the marker icon.
	setIcon(icon) {

		this.options.icon = icon;

		if (this._map) {
			this._initIcon();
			this.update();
		}

		if (this._popup) {
			this.bindPopup(this._popup, this._popup.options);
		}

		return this;
	}

	// @method getElement(): HTMLElement
	// Returns the instance of [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)
	// used by Marker layer.
	getElement() {
		return this._icon;
	}

	update() {

		if (this._icon && this._map && !this._culled) {
			const pos = this._map.latLngToLayerPoint(this._latlng).round();
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

			if (icon.tagName === 'IMG') {
				icon.alt = options.alt ?? '';
			}
		}

		icon.classList.add(classToAdd);

		if (options.keyboard) {
			icon.tabIndex = '0';
			icon.setAttribute('role', 'button');
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

		const newShadow = options.shadow ? options.icon.createShadow(this._shadow) : null;
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

		const visible = this._map.getBounds().pad(0.5).contains(this._latlng) ||
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

		if (this._icon) {
			DomUtil.setPosition(this._icon, pos);
		}

		if (this._shadow) {
			DomUtil.setPosition(this._shadow, pos);
		}
		this._rotateUpright();

		this._zIndex = pos.y + this.options.zIndexOffset;

		this._resetZIndex();
	}

	// Keeps the icon and shadow upright on a rotated map, rotating them around their anchor
	_rotateUpright() {
		const bearing = this.options.rotateWithView ? 0 : this._map.getBearing();
		this._rotateElement(this._icon, bearing + (this.options.rotationAngle || 0), this.options.rotationOrigin);
		this._rotateElement(this._shadow, bearing);
	}

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

	// @method setRotationAngle(angle: Number): this
	// Changes the [`rotationAngle`](#marker-rotationangle) of the icon.
	setRotationAngle(angle) {
		this.options.rotationAngle = angle;
		return this.update();
	}

	// @method setRotationOrigin(origin: String): this
	// Changes the [`rotationOrigin`](#marker-rotationorigin) of the icon.
	setRotationOrigin(origin) {
		this.options.rotationOrigin = origin;
		return this.update();
	}

	_updateZIndex(offset) {
		const zIndex = String(this._zIndex + offset);
		if (this._icon && this._icon.style.zIndex !== zIndex) {
			this._icon.style.zIndex = zIndex;
		}
	}

	_animateZoom(opt) {
		if (this._culled) { return; }
		const pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

		this._setPos(pos);
	}

	_updateInteractive() {
		if (!this._icon) { return; }
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
			let draggable = this.options.draggable;
			if (this.dragging) {
				draggable = this.dragging.enabled();
				this.dragging.disable();
			}

			this.dragging = new MarkerDrag(this);

			if (draggable) {
				this.dragging.enable();
			}
		}
	}

	// @method setOpacity(opacity: Number): this
	// Changes the opacity of the marker.
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
			this._icon.style.opacity = opacity;
		}

		if (this._shadow) {
			this._shadow.style.opacity = opacity;
		}
	}

	_bringToFront() {
		this._updateZIndex(this.options.riseOffset);
	}

	_resetZIndex() {
		this._updateZIndex(0);
	}

	_panOnFocus() {
		const map = this._map;
		if (!map) { return; }

		const iconOpts = this.options.icon.options;
		const size = iconOpts.iconSize ? new Point(iconOpts.iconSize) : new Point(0, 0);
		const anchor = iconOpts.iconAnchor ? new Point(iconOpts.iconAnchor) : new Point(0, 0);

		map.panInside(this._latlng, {
			paddingTopLeft: anchor,
			paddingBottomRight: size.subtract(anchor)
		});
	}

	_getPopupAnchor() {
		return this.options.icon.options.popupAnchor;
	}

	_getTooltipAnchor() {
		return this.options.icon.options.tooltipAnchor;
	}
}
