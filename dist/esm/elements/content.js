import { Popup } from "../layer/Popup.js";
import { Tooltip } from "../layer/Tooltip.js";
import { Icon } from "../layer/marker/Icon.js";
import { Marker } from "../layer/marker/Marker.js";
import { DivIcon } from "../layer/marker/DivIcon.js";
import { SvgIcon } from "../layer/marker/SvgIcon.js";
import { MaplairElement, define } from "./MaplairElement.js";
import { MapElement } from "./MapElement.js";
// src/elements/content.js
function contentOf(el) {
	if (!el._content) {
		el._content = document.createElement("div");
		el._content.className = "maplair-element-content";
	}
	const move = () => {
		if (el.firstChild) el._content.append(...el.childNodes);
	};
	move();
	el._observeContent(move);
	return el._content;
}
var OverlayElement = class extends MaplairElement {
	static args = ["latlng", "open"];
	static events = ["add", "remove"];
	createInstance() {
		const overlay = new this.constructor.Class(this.getOptions()).setContent(contentOf(this)), latlng = this.getArg("latlng");
		if (latlng) overlay.setLatLng(latlng);
		overlay.on("add", () => this._reflectAttribute("open", true));
		overlay.on("remove", () => this._reflectAttribute("open", false));
		return overlay;
	}
	attach(parent) {
		const overlay = this._instance;
		if (parent instanceof MapElement) {
			if (this.hasAttribute("open")) this._open();
			return;
		}
		const layer = parent?.layer;
		if (!layer) return;
		layer[this.constructor.bind](overlay);
		if (this.hasAttribute("open")) this._open();
	}
	detach(parent) {
		const overlay = this._instance, layer = parent?.layer;
		if (layer && layer[this.constructor.property] === overlay) layer[this.constructor.unbind]();
		overlay.remove();
	}
	update(name, value) {
		const overlay = this._instance;
		if (name === "open") {
			if (value === null) overlay.close();
			else this._open();
			return true;
		}
		if (name === "latlng" && value) {
			overlay.setLatLng(this.getArg("latlng"));
			return true;
		}
		return false;
	}
	_open() {
		const overlay = this._instance, parent = this._parent;
		if (parent instanceof MapElement) {
			if (overlay._latlng) overlay.openOn(parent.map);
		} else if (parent?.layer?._map) parent.layer[this.constructor.open](this.getArg("latlng"));
	}
};
/**
* `<maplair-popup>`: a [`Popup`](#popup) with the content of the element (moved into the
* popup), bound to the layer of the parent element (e.g. `<maplair-marker>`), or inside
* `<maplair-map>` at `latlng`. `open` opens it, and reflects whether it's open.
*/
var PopupElement = class extends OverlayElement {
	static Class = Popup;
	static bind = "bindPopup";
	static unbind = "unbindPopup";
	static open = "openPopup";
	static property = "_popup";
	/**
	* The popup.
	* @type {Popup|null}
	*/
	get popup() {
		return this._instance;
	}
};
/**
* `<maplair-tooltip>`: a [`Tooltip`](#tooltip) with the content of the element, bound to the
* layer of the parent element, or inside `<maplair-map>` at `latlng`; e.g. `permanent`,
* `direction="top"`.
*/
var TooltipElement = class extends OverlayElement {
	static Class = Tooltip;
	static bind = "bindTooltip";
	static unbind = "unbindTooltip";
	static open = "openTooltip";
	static property = "_tooltip";
	/**
	* The tooltip.
	* @type {Tooltip|null}
	*/
	get tooltip() {
		return this._instance;
	}
};
var IconElement = class extends MaplairElement {
	attach(parent) {
		parent?.layer?.setIcon?.(this._instance);
	}
	detach(parent) {
		const marker = parent?.layer;
		if (marker?.options.icon === this._instance) marker.setIcon(Marker.defaultOptions.icon);
	}
	update() {
		return false;
	}
	/**
	* The icon.
	* @type {Icon|null}
	*/
	get icon() {
		return this._instance;
	}
};
/** `<maplair-icon>`: the [`Icon`](#icon) of the parent marker, e.g. `icon-url`, `icon-size="32,32"`. */
var ImageIconElement = class extends IconElement {
	static Class = Icon;
};
/** `<maplair-div-icon>`: a [`DivIcon`](#divicon) of the parent marker, with the content of the element. */
var DivIconElement = class extends IconElement {
	static Class = DivIcon;
	createInstance() {
		return new DivIcon({
			...this.getOptions(),
			html: contentOf(this)
		});
	}
};
/** `<maplair-svg-icon>`: an [`SvgIcon`](#svgicon) of the parent marker, e.g. `color`, `glyph`. */
var SvgIconElement = class extends IconElement {
	static Class = SvgIcon;
};
define("maplair-popup", PopupElement);
define("maplair-tooltip", TooltipElement);
define("maplair-icon", ImageIconElement);
define("maplair-div-icon", DivIconElement);
define("maplair-svg-icon", SvgIconElement);
export { DivIconElement, ImageIconElement, PopupElement, SvgIconElement, TooltipElement };

//# sourceMappingURL=content.js.map