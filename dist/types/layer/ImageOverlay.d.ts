import type { Bounds } from '../geometry/Bounds.js';
import type { InteractiveLayerOptions } from './Layer.js';
import type { MaplairEvent } from '../core/Events.js';
/** @import {InteractiveLayerOptions} from './Layer.js' */
/** @import {LatLng} from '../geo/LatLng.js' */
/** @import {LatLngBoundsExpression} from '../geo/LatLngBounds.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {EventListener, MaplairEvent} from '../core/Events.js' */
/**
 * Options of `ImageOverlay`.
 * @typedef {object} ImageOverlayOptions
 * @property {number} [opacity=1] The opacity of the image overlay.
 * @property {string} [alt=''] Text for the `alt` attribute of the image (useful for
 * accessibility).
 * @property {boolean} [interactive=false] If `true`, the image overlay will emit
 * [pointer events](#interactivelayeroptions) when clicked or hovered.
 * @property {boolean|string} [crossOrigin=false] Whether the crossOrigin attribute
 * will be added to the image. If a String is provided, the image will have its
 * crossOrigin attribute set to the String provided. This is needed if you want to
 * access image pixel data. Refer to
 * [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
 * for valid String values.
 * @property {string} [errorOverlayUrl=''] URL to the overlay image to show in place
 * of the overlay that failed to load.
 * @property {number} [zIndex=1] The explicit
 * [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index)
 * of the overlay layer.
 * @property {string} [className=''] A custom class name to assign to the image. Empty
 * by default.
 * @property {boolean} [pixelated=false] Whether to scale the image with
 * nearest-neighbour interpolation (`image-rendering: pixelated`) instead of smoothing
 * it, so that its pixels stay crisp when zoomed in. Useful for raster data, pixel art
 * or scientific imagery.
 * @property {string} [decoding='auto'] Tells the browser whether to decode the image
 * in a synchronous fashion, as per the
 * [`decoding` HTML attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding).
 * If the image overlay is flickering when being added/removed, set this option to
 * `'sync'`.
 * @extends InteractiveLayerOptions
 */
/**
 * Used to load and display a single image over specific bounds of the map. Extends `Layer`.
 *
 * @example
 * ```js
 * const imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
 * 	imageBounds = [[40.712216, -74.22655], [40.773941, -74.12544]];
 * new ImageOverlay(imageUrl, imageBounds).addTo(map);
 * ```
 *
 * @fires load {MaplairEvent} Fired when the ImageOverlay layer has loaded its image.
 * @fires error {MaplairEvent} Fired when the ImageOverlay layer fails to load its image.
 */
export class ImageOverlay extends Layer {
    static defaultOptions: Partial<ImageOverlayOptions>;
    /**
     * Instantiates an image overlay object given the URL of the image (or an image
     * element) and the geographical bounds it is tied to.
     * @param {string|HTMLImageElement} url
     * @param {LatLngBoundsExpression} bounds
     * @param {ImageOverlayOptions} [options]
     */
    constructor(url: string | HTMLImageElement, bounds: LatLngBoundsExpression, options?: ImageOverlayOptions);
    onAdd(map: MaplairMap): void;
    onRemove(map: MaplairMap): void;
    /**
     * Sets the opacity of the overlay.
     * @param {number} opacity
     * @returns {this}
     */
    setOpacity(opacity: number): this;
    /**
     * Sets the opacity of the overlay from the given style options, e.g. by
     * `FeatureGroup.setStyle()`.
     * @param {{opacity?: number}} styleOpts
     * @returns {this}
     */
    setStyle(styleOpts: {
        opacity?: number;
    }): this;
    /**
     * Brings the layer to the top of all overlays.
     * @returns {this}
     */
    bringToFront(): this;
    /**
     * Brings the layer to the bottom of all overlays.
     * @returns {this}
     */
    bringToBack(): this;
    /**
     * Changes the URL of the image.
     * @param {string} url
     * @returns {this}
     */
    setUrl(url: string): this;
    /**
     * Update the bounds that this ImageOverlay covers.
     * @param {LatLngBoundsExpression} bounds
     * @returns {this}
     */
    setBounds(bounds: LatLngBoundsExpression): this;
    /**
     * Returns the map events the overlay listens to.
     * @returns {Record<string, EventListener>}
     */
    getEvents(): Record<string, EventListener>;
    /**
     * Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
     * @param {number} value
     * @returns {this}
     */
    setZIndex(value: number): this;
    /**
     * Get the bounds that this ImageOverlay covers.
     * @returns {LatLngBounds}
     */
    getBounds(): LatLngBounds;
    /**
     * Returns the instance of
     * [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
     * used by this overlay (`HTMLVideoElement` for `VideoOverlay`, `SVGElement` for
     * `SVGOverlay`).
     * @returns {HTMLElement|SVGElement}
     */
    getElement(): HTMLElement | SVGElement;
    /**
     * Returns the center of the ImageOverlay.
     * @returns {LatLng}
     */
    getCenter(): LatLng;
    /** The options of the ImageOverlay, see [the options](#imageoverlayoptions). */
    options: ImageOverlayOptions;
}
/**
 * Options of `ImageOverlay`.
 */
export interface ImageOverlayOptions extends InteractiveLayerOptions {
    /**
     * The opacity of the image overlay.
     * @default 1
     */
    opacity?: number;
    /**
     * Text for the `alt` attribute of the image (useful for
     * accessibility).
     * @default ''
     */
    alt?: string;
    /**
     * If `true`, the image overlay will emit
     * [pointer events](#interactivelayeroptions) when clicked or hovered.
     * @default false
     */
    interactive?: boolean;
    /**
     * Whether the crossOrigin attribute
     * will be added to the image. If a String is provided, the image will have its
     * crossOrigin attribute set to the String provided. This is needed if you want to
     * access image pixel data. Refer to
     * [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
     * for valid String values.
     * @default false
     */
    crossOrigin?: boolean|string;
    /**
     * URL to the overlay image to show in place
     * of the overlay that failed to load.
     * @default ''
     */
    errorOverlayUrl?: string;
    /**
     * The explicit
     * [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index)
     * of the overlay layer.
     * @default 1
     */
    zIndex?: number;
    /**
     * A custom class name to assign to the image. Empty
     * by default.
     * @default ''
     */
    className?: string;
    /**
     * Whether to scale the image with
     * nearest-neighbour interpolation (`image-rendering: pixelated`) instead of smoothing
     * it, so that its pixels stay crisp when zoomed in. Useful for raster data, pixel art
     * or scientific imagery.
     * @default false
     */
    pixelated?: boolean;
    /**
     * Tells the browser whether to decode the image
     * in a synchronous fashion, as per the
     * [`decoding` HTML attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding).
     * If the image overlay is flickering when being added/removed, set this option to
     * `'sync'`.
     * @default 'auto'
     */
    decoding?: string;
}
import { Layer } from './Layer.js';
import { LatLngBounds } from '../geo/LatLngBounds.js';
import type { MaplairMap } from '../map/Map.js';
import type { LatLngBoundsExpression } from '../geo/LatLngBounds.js';
import type { EventListener } from '../core/Events.js';
import type { LatLng } from '../geo/LatLng.js';
