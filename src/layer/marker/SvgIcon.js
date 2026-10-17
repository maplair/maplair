import {DefaultIcon} from './DefaultIcon.js';
/** @import {DefaultIconOptions} from './DefaultIcon.js' */

const svgNS = 'http://www.w3.org/2000/svg';

// The outline of the marker in a 500×820 view box (see images/marker-icon.svg)
const markerPath = 'M416.500 542.096L420.919 533.569L422.024 531.437L424.460 529.996L424.233 527.174L426.670 525.732L426.382 522.881L428.720 521.213L428.075 518.393L429.979 516.125L428.342 513.639L429.080 510.777L426.581 509.207L426.168 506.292L423.266 505.773L421.781 503.221L418.898 503.859L416.511 502.112L414.131 503.870L411.248 503.241L409.766 505.793L406.865 506.302L406.439 509.216L403.933 510.775L404.661 513.641L403.023 516.136L404.935 518.393L404.271 521.204L406.590 522.896L406.299 525.752L408.738 527.189L408.516 530.011L410.956 531.448L412.065 533.578Z',
markerTransform = 'translate(-7889.1 -9807.44)scale(19.5417)',
leafPath = 'm-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z',
leafTransform = 'translate(250 258)scale(.068)',
// The center of the glyph and its size in the view box
glyphX = 250,
glyphY = 270,
glyphSize = 230;

function svgElement(name, attributes, parent) {
	const el = document.createElementNS(svgNS, name);
	for (const [key, value] of Object.entries(attributes)) {
		el.setAttribute(key, value);
	}
	parent?.appendChild(el);
	return el;
}

/**
 * Options of `SvgIcon`.
 * @typedef {object} SvgIconOptions
 * @property {string} [color='#d4462c'] The fill color of the marker, any CSS color. The
 * outline is a darker shade of it.
 * @property {string} [glyph] A character or emoji (or short text) shown in the marker
 * instead of the maple leaf.
 * @property {string} [glyphPath] The path data of an SVG glyph in a 24×24 view box (like
 * Material Design Icons), shown in the marker instead of the maple leaf.
 * @property {string} [glyphColor='white'] The color of the glyph or the maple leaf.
 * @extends DefaultIconOptions
 */

/**
 * A marker icon in the shape of the default marker (with its shadow), drawn as
 * inline SVG in any color and with an optional glyph – a character, an emoji or an
 * SVG path (e.g. of an icon set) – instead of the white maple leaf. No image per
 * color is needed, and it stays sharp on any screen.
 *
 * Inspired by the [Leaflet.awesome-markers](https://github.com/lennardv2/Leaflet.awesome-markers),
 * [leaflet-color-markers](https://github.com/pointhi/leaflet-color-markers) and
 * [Leaflet.ExtraMarkers](https://github.com/coryasilva/Leaflet.ExtraMarkers) plugins.
 *
 * @example
 * ```js
 * new Marker([47.27, 11.40], {icon: new SvgIcon({color: '#2a81cb', glyph: 'P'})}).addTo(map);
 * new Marker([47.28, 11.41], {icon: new SvgIcon({color: 'green', glyph: '🚲'})}).addTo(map);
 * // a 24×24 SVG path, e.g. from Material Design Icons
 * new Marker([47.29, 11.42], {icon: new SvgIcon({color: 'purple', glyphPath: 'M12 2L2 22h20z'})}).addTo(map);
 * ```
 */
export class SvgIcon extends DefaultIcon {

	static {
		this.setDefaultOptions({
			color: '#d4462c',
			glyph: undefined,
			glyphPath: undefined,
			glyphColor: 'white'
		});
	}

	/**
	 * Creates an `SvgIcon` with the given options.
	 * @param {[options?: SvgIconOptions]} args The options.
	 */
	constructor(...args) {
		super(...args);
		this.callInitHooks(SvgIcon);
	}

	/**
	 * Called internally when the icon has to be shown, returns a `<div>` element with
	 * the SVG of the marker, styled according to the options.
	 * @param {HTMLElement} [oldIcon] The current element of the icon, to be reused if possible.
	 * @returns {HTMLElement}
	 */
	createIcon(oldIcon) {
		const div = oldIcon?.tagName === 'DIV' ? oldIcon : document.createElement('div'),
		options = this.options,
		svg = svgElement('svg', {viewBox: '0 0 500 820', width: '100%', height: '100%', 'aria-hidden': 'true'});

		svgElement('path', {
			d: markerPath,
			transform: markerTransform,
			fill: options.color,
			stroke: `color-mix(in srgb, ${options.color}, black 30%)`,
			'stroke-width': '1.1',
			'stroke-linejoin': 'miter'
		}, svg);

		if (options.glyphPath) {
			const scale = glyphSize / 24;
			svgElement('path', {
				d: options.glyphPath,
				fill: options.glyphColor,
				transform: `translate(${glyphX - glyphSize / 2} ${glyphY - glyphSize / 2})scale(${scale})`
			}, svg);
		} else if (options.glyph) {
			svgElement('text', {
				x: glyphX,
				y: glyphY,
				fill: options.glyphColor,
				'font-size': glyphSize,
				'font-family': 'sans-serif',
				'font-weight': 'bold',
				'text-anchor': 'middle',
				'dominant-baseline': 'central'
			}, svg).textContent = options.glyph;
		} else {
			svgElement('path', {d: leafPath, transform: leafTransform, fill: options.glyphColor}, svg);
		}

		div.replaceChildren(svg);
		this._setIconStyles(div, 'icon');
		return div;
	}
}
