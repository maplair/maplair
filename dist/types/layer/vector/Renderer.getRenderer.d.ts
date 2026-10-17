import type { Canvas } from './Canvas.js';
import type { SVG } from './SVG.js';
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
     * Whether `Path`s should be rendered on a
     * `Canvas` renderer. By default, all `Path`s are rendered in a `SVG` renderer.
     * @default false
     */
    preferCanvas?: boolean;
    /**
     * The default method for drawing vector layers on the
     * map. `SVG` or `Canvas` by default depending on the `preferCanvas` option.
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
