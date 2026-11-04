import type { MaplairMap } from '../../map/Map.js';

/**
 * Methods of `MaplairMap` for the renderers of vector layers.
 */
export interface MapRendererMethods {
}
/**
 * Map options of the vector renderers.
 */
export interface RendererMapOptions {
    /**
     * The default method for drawing vector layers on the
     * map. A new `SVG` renderer by default; pass `new Canvas()` to draw them on a canvas
     * instead.
     */
    renderer?: Renderer;
}
import type { Path } from './Path.js';
import type { Renderer } from './Renderer.js';
export {};
declare module '../../map/Map.js' {
    interface MaplairMap extends MapRendererMethods {
    }
}
declare module '../../map/Map.js' {
    interface MaplairMapOptions extends RendererMapOptions {
    }
}
