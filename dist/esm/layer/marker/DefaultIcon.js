import { Icon } from "./Icon.js";
// src/layer/marker/DefaultIcon.js
/** @import {IconOptions} from './Icon.js' */
/** @import {PointExpression} from '../../geometry/Point.js' */
/**
* Options of `DefaultIcon`.
* @typedef {object} DefaultIconOptions
* @property {string} [iconUrl] The maple leaf marker, inlined as an SVG data URI.
* @property {string} [shadowUrl] Its shadow, inlined as an SVG data URI.
* @property {PointExpression|number} [iconSize=[25, 41]]
* @property {PointExpression} [iconAnchor=[12, 41]]
* @property {PointExpression} [popupAnchor=[1, -34]]
* @property {PointExpression} [tooltipAnchor=[16, -28]]
* @property {PointExpression|number} [shadowSize=[41, 41]]
* @extends IconOptions
*/
/**
* A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
* no icon is specified. The maple leaf marker and its shadow are inlined as SVG data
* URIs, so they work with any bundler and need no image files.
*
* In order to customize the default icon, just change the properties of
* `DefaultIcon.defaultOptions` (which is a set of `Icon options`).
*
* If you want to _completely_ replace the default icon, override the
* `Marker.defaultOptions.icon` with your own icon instead.
*/
var DefaultIcon = class DefaultIcon extends Icon {
	static defaultOptions = {
		iconUrl: "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" style=\"fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round\" viewBox=\"0 0 500 820\"><defs><linearGradient id=\"a\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"0\" gradientTransform=\"rotate(-90 478.727 62.272)scale(37.566)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"%23C2331B\"/><stop offset=\"1\" stop-color=\"%23E2603F\"/></linearGradient><linearGradient id=\"b\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"0\" gradientTransform=\"rotate(-90 468.484 54.002)scale(19.053)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"%238F2D20\"/><stop offset=\"1\" stop-color=\"%23B23A27\"/></linearGradient></defs><path fill=\"url(%23a)\" stroke=\"url(%23b)\" stroke-width=\"1.1\" stroke-linejoin=\"miter\" stroke-miterlimit=\"10\" d=\"M416.500 542.096L420.919 533.569L422.024 531.437L424.460 529.996L424.233 527.174L426.670 525.732L426.382 522.881L428.720 521.213L428.075 518.393L429.979 516.125L428.342 513.639L429.080 510.777L426.581 509.207L426.168 506.292L423.266 505.773L421.781 503.221L418.898 503.859L416.511 502.112L414.131 503.870L411.248 503.241L409.766 505.793L406.865 506.302L406.439 509.216L403.933 510.775L404.661 513.641L403.023 516.136L404.935 518.393L404.271 521.204L406.590 522.896L406.299 525.752L408.738 527.189L408.516 530.011L410.956 531.448L412.065 533.578Z\" transform=\"translate(-7889.1 -9807.44)scale(19.5417)\"/><path fill=\"%23FFF\" d=\"m-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z\" transform=\"translate(250 258)scale(.068)\"/></svg>",
		shadowUrl: "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" viewBox=\"0 0 817.2 820\"><radialGradient id=\"a\" cx=\"526.6\" cy=\"486.836\" r=\"478.154\" fx=\"275.876\" fy=\"893.983\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" style=\"stop-color:%235c5c5c;stop-opacity:.9477\"/><stop offset=\".112\" style=\"stop-color:%23474747;stop-opacity:.7805\"/><stop offset=\".34\" style=\"stop-color:%23202020;stop-opacity:.4413\"/><stop offset=\".523\" style=\"stop-color:%23090909;stop-opacity:.1692\"/><stop offset=\".637\" style=\"stop-color:%23000;stop-opacity:0\"/></radialGradient><path d=\"M254.7 820.0L430.1 664.9L473.9 626.1L541.3 599.9L561.5 548.6L629.0 522.4L648.1 470.5L715.4 440.2L726.3 388.9L789.2 347.6L774.9 302.4L817.1 250.3L775.4 221.8L792.3 168.8L732.1 159.3L721.8 112.9L651.7 124.5L614.0 92.7L545.0 124.7L486.2 113.3L430.2 159.7L360.8 169.0L325.1 222.0L255.1 250.3L245.6 302.4L186.6 347.8L209.1 388.9L169.0 440.0L205.6 470.8L173.5 522.7L215.1 548.9L184.8 600.2L226.4 626.3L232.1 665.1Z\" style=\"fill-rule:evenodd;clip-rule:evenodd;fill:url(%23a);fill-opacity:.7;filter:blur(15px)\"/></svg>",
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		tooltipAnchor: [16, -28],
		shadowSize: [41, 41]
	};
	/**
	* Creates the default icon, optionally with changed options.
	* @param {[options?: DefaultIconOptions]} args The options.
	*/
	constructor(...args) {
		super(...args);
		this.callInitHooks(DefaultIcon);
	}
};
export { DefaultIcon };

//# sourceMappingURL=DefaultIcon.js.map