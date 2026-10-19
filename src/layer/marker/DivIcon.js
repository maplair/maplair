import {Icon} from './Icon.js';
import {Point} from '../../geometry/Point.js';
/** @import {IconOptions} from './Icon.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */

/**
 * Options of `DivIcon`.
 * @typedef {object} DivIconOptions
 * @property {PointExpression|number} [iconSize=[12, 12]] Size of the icon in pixels,
 * also can be set through CSS.
 * @property {string|HTMLElement|false} [html=false] Custom HTML code to put inside the
 * div element, empty by default. Alternatively, an instance of `HTMLElement`.
 * @property {PointExpression|null} [bgPos=null] Optional relative position of the
 * background, in pixels.
 * @property {string} [className='maplair-div-icon']
 * @extends IconOptions
 */

/**
 * Represents a lightweight icon for markers that uses a simple `<div>`
 * element instead of an image. Inherits from `Icon` but ignores the `iconUrl` and
 * shadow options.
 *
 * By default, it has a 'maplair-div-icon' CSS class and is styled as a little white
 * square with a shadow.
 *
 * @example
 * ```js
 * const myIcon = new DivIcon({className: 'my-div-icon'});
 * // you can set .my-div-icon styles in CSS
 *
 * new Marker([50.505, 30.57], {icon: myIcon}).addTo(map);
 * ```
 */
export class DivIcon extends Icon {

	static defaultOptions = {
		iconSize: [12, 12], // also can be set through CSS

		// iconAnchor: (Point),
		// popupAnchor: (Point),

		html: false,
		bgPos: null,
		className: 'maplair-div-icon'
	};

	/**
	 * Creates a `DivIcon` instance with the given options.
	 * @param {[options?: DivIconOptions]} args The options.
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(DivIcon);
	}

	/**
	 * Called internally when the icon has to be shown, returns a `<div>` element
	 * styled according to the options.
	 * @param {HTMLElement} [oldIcon] The current element of the icon, to be reused if possible.
	 * @returns {HTMLElement}
	 */
	createIcon(oldIcon) {
		const div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		options = this.options;

		if (options.html instanceof Element) {
			div.replaceChildren();
			div.appendChild(options.html);
		} else {
			div.innerHTML = options.html !== false ? options.html : '';
		}

		if (options.bgPos) {
			const bgPos = Point.from(options.bgPos);
			div.style.backgroundPosition = `${-bgPos.x}px ${-bgPos.y}px`;
		}
		this._setIconStyles(div, 'icon');

		return div;
	}

	/**
	 * Returns `null`, a `DivIcon` has no shadow.
	 * @returns {null}
	 */
	createShadow() {
		return null;
	}
}
