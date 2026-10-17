import { create } from "../../dom/DomUtil.js";
import { Icon } from "./Icon.js";
//#region src/layer/marker/DefaultIcon.js
/** @import {IconOptions} from './Icon.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
const URL_RE = /^url\((['"])?(.+)\1\)$/;
const MARKER_ICON_RE = /^(.*)marker-icon\.svg$/;
/**
* Options of `DefaultIcon`.
* @typedef {object} DefaultIconOptions
* @property {string} [iconUrl='marker-icon.svg']
* @property {string} [iconRetinaUrl='marker-icon.svg']
* @property {string} [shadowUrl='marker-shadow.svg']
* @property {PointExpression|number} [iconSize=[25, 41]]
* @property {PointExpression} [iconAnchor=[12, 41]]
* @property {PointExpression} [popupAnchor=[1, -34]]
* @property {PointExpression} [tooltipAnchor=[16, -28]]
* @property {PointExpression|number} [shadowSize=[41, 41]]
* @property {string} [imagePath] `DefaultIcon` will try to auto-detect the location of
* the blue icon images. If you are placing these images in a non-standard way, set this
* option to point to the right path.
* @extends IconOptions
*/
/**
* A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
* no icon is specified. Points to the blue marker image distributed with Maplair
* releases.
*
* In order to customize the default icon, just change the properties of
* `DefaultIcon.prototype.options` (which is a set of `Icon options`).
*
* If you want to _completely_ replace the default icon, override the
* `Marker.prototype.options.icon` with your own icon instead.
*/
var DefaultIcon = class DefaultIcon extends Icon {
	static {
		this.setDefaultOptions({
			iconUrl: "marker-icon.svg",
			iconRetinaUrl: "marker-icon.svg",
			shadowUrl: "marker-shadow.svg",
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			tooltipAnchor: [16, -28],
			shadowSize: [41, 41]
		});
	}
	/**
	* Creates the default icon, optionally with changed options.
	* @param {[options?: DefaultIconOptions]} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(DefaultIcon);
	}
	_getIconUrl(name) {
		if (!DefaultIcon.imagePath) DefaultIcon.imagePath = this._detectIconPath();
		const url = super._getIconUrl(name);
		if (!url) return null;
		return (this.options.imagePath ?? DefaultIcon.imagePath) + url;
	}
	_stripUrl(path) {
		const strip = function(str, re, idx) {
			const match = re.exec(str);
			return match && match[idx];
		};
		path = strip(path, URL_RE, 2);
		return path && strip(path, MARKER_ICON_RE, 1);
	}
	_detectIconPath() {
		const el = create("div", "maplair-default-icon-path", document.body);
		const path = this._stripUrl(getComputedStyle(el).backgroundImage);
		document.body.removeChild(el);
		if (path) return path;
		const link = document.querySelector("link[href$=\"maplair.css\"]");
		if (!link) return "";
		return link.href.substring(0, link.href.length - 11 - 1);
	}
};
//#endregion
export { DefaultIcon };

//# sourceMappingURL=DefaultIcon.js.map