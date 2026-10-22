import type { DefaultIconOptions } from './DefaultIcon.js';
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
    static defaultOptions: Partial<SvgIconOptions>;
    /**
     * Creates an `SvgIcon` with the given options.
     * @param {[options?: SvgIconOptions]} args The options.
     */
    constructor(options?: SvgIconOptions | undefined);
    /** The options of the SvgIcon, see [the options](#svgiconoptions). */
    options: SvgIconOptions;
}
/**
 * Options of `SvgIcon`.
 */
export interface SvgIconOptions extends DefaultIconOptions {
    /**
     * The fill color of the marker, any CSS color. The
     * outline is a darker shade of it.
     * @default '#d4462c'
     */
    color?: string;
    /**
     * A character or emoji (or short text) shown in the marker
     * instead of the maple leaf.
     */
    glyph?: string;
    /**
     * The path data of an SVG glyph in a 24×24 view box (like
     * Material Design Icons), shown in the marker instead of the maple leaf.
     */
    glyphPath?: string;
    /**
     * The color of the glyph or the maple leaf.
     * @default 'white'
     */
    glyphColor?: string;
}
import { DefaultIcon } from './DefaultIcon.js';
