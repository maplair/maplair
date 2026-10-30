import type { MaplairMap } from './Map.js';
import type { Draggable } from '../dom/Draggable.js';
import type { BlanketOverlay } from '../layer/BlanketOverlay.js';
import type { GridLayer } from '../layer/tile/GridLayer.js';
import type { DivOverlay } from '../layer/DivOverlay.js';
import type { Popup } from '../layer/Popup.js';
import type { Tooltip } from '../layer/Tooltip.js';
import type { Marker } from '../layer/marker/Marker.js';
import type { MarkerDrag } from '../layer/marker/Marker.Drag.js';
import type { DragHandler } from './handler/DragHandler.js';
import type { PinchZoomHandler } from './handler/PinchZoomHandler.js';
import type { ScrollWheelZoomHandler } from './handler/ScrollWheelZoomHandler.js';
import type { TapDragZoomHandler } from './handler/TapDragZoomHandler.js';
import type { MaplairEvent } from '../core/Events.js';
export { RotateControl };
/**
 * Map options of the map rotation (`maplair/map-rotation`).
 */
export interface RotationMapOptions {
    /**
     * Initial rotation of the map in degrees: the compass
     * direction pointing up, clockwise from north (e.g. `90` for east up), see
     * `setBearing()`.
     * @default 0
     */
    bearing?: number;
    /**
     * Whether the map can be rotated by turning two
     * fingers, see `setBearing()`.
     * @default false
     */
    pinchRotate?: boolean;
}
/**
 * Methods of `MaplairMap` for the map rotation. The rotation of the map is an optional
 * feature: import this module (`maplair/map-rotation`) to add the `bearing`,
 * `pinchRotate` and `rotateControl` options, `setBearing()`, `getBearing()` and the
 * `rotate` event to `MaplairMap`, and the `RotateControl`. Maps not using it don't
 * contain its code.
 *
 * The map pane is wrapped in a pane rotated around the center of the container.
 * Container/layer point conversions, `getPixelBounds()` and `getBounds()` account
 * for the rotation; grid layers and vector renderers cover the bounding box of
 * the rotated view; markers, popups and tooltips stay upright (see the Marker
 * option `rotateWithView`); dragging, `panBy()`, the keyboard, pinch, tap-drag,
 * touchpad and continuous zoom work in container pixels.
 * @example ```js
 * import {MaplairMap} from 'maplair';
 * import {RotateControl} from 'maplair/map-rotation';
 *
 * const map = new MaplairMap('map', {bearing: 30, pinchRotate: true, rotateControl: true});
 * ```
 * @fires MaplairMap#rotate {MaplairEvent} Fired when the bearing of the map changes,
 * see `setBearing()`.
 */
export interface MapRotationMethods {
    /**
     * Rotates the map around the center of the view, so that the compass direction
     * `bearing` (in degrees, clockwise from north) points up. Markers, popups and
     * tooltips stay upright. With `{animate: true}`, the map rotates smoothly (the
     * shorter way round).
     * @group Map rotation
     * @param {number} bearing
     * @param {{animate?: boolean}} [options]
     * @returns {this}
     */
    setBearing(bearing: number, options?: {
        animate?: boolean;
    }): this;
    /**
     * Returns the rotation of the map, see `setBearing()`.
     * @group Map rotation
     * @returns {number}
     */
    getBearing(): number;
}
/**
 * Methods of `GridLayer` for the map rotation: the tiles cover the bounding box of the
 * rotated view.
 */
export interface GridLayerMapRotationMethods {
}
/**
 * Methods of `BlanketOverlay` for the map rotation: the overlay covers the bounding
 * box of the rotated view.
 */
export interface BlanketOverlayMapRotationMethods {
}
/**
 * Methods of `DivOverlay` for the map rotation: the overlays stay upright.
 */
export interface DivOverlayMapRotationMethods {
}
/**
 * Methods of `Popup` for the map rotation: the popup stays upright, autopanning in
 * container pixels.
 */
export interface PopupMapRotationMethods {
}
/**
 * Methods of `Tooltip` for the map rotation: the tooltip stays upright.
 */
export interface TooltipMapRotationMethods {
}
/**
 * Options of `Marker` for the map rotation.
 */
export interface MarkerMapRotationOptions {
    /**
     * On a rotated map (see
     * `MaplairMap.setBearing()`), whether the icon rotates with the map (e.g. for arrows
     * pointing in a geographic direction) instead of staying upright. The `rotation` of
     * the marker is relative to the screen, or to north with `rotateWithView`.
     * @default false
     */
    rotateWithView?: boolean;
}
/**
 * Methods of `Marker` for the map rotation: the marker is updated on rotation, and
 * its icon and shadow stay upright.
 */
export interface MarkerMapRotationMethods {
}
/**
 * Methods of `MarkerDrag` for the map rotation: autopanning in container pixels.
 */
export interface MarkerDragMapRotationMethods {
}
/**
 * Methods of `Draggable` for the map rotation: dragging in the rotated frame of the
 * map pane.
 */
export interface DraggableMapRotationMethods {
}
/**
 * Methods of `DragHandler` for the map rotation: the inertia in container pixels.
 */
export interface DragHandlerMapRotationMethods {
}
/**
 * Methods of `PinchZoomHandler` for the map rotation: rotating by turning two fingers
 * (see the map option `pinchRotate`), pinching in the rotated frame.
 */
export interface PinchZoomHandlerMapRotationMethods {
}
/**
 * Methods of `TapDragZoomHandler` for the map rotation: the zoom origin in the rotated
 * frame.
 */
export interface TapDragZoomHandlerMapRotationMethods {
}
/**
 * Methods of `ScrollWheelZoomHandler` for the map rotation: zooming and panning in the
 * rotated frame.
 */
export interface ScrollWheelZoomHandlerMapRotationMethods {
}
import { RotateControl } from '../control/RotateControl.js';
import type { PointExpression } from '../geometry/Point.js';
import { Point } from '../geometry/Point.js';
import type { LatLng } from '../geo/LatLng.js';
import { Bounds } from '../geometry/Bounds.js';
import type { PanOptions } from './Map.js';
import type { InvalidateSizeOptions } from './Map.js';
declare module './Map.js' {
    interface MaplairMapOptions extends RotationMapOptions {
    }
}
declare module './Map.js' {
    interface MaplairMap extends MapRotationMethods {
    }
}
declare module '../layer/tile/GridLayer.js' {
    interface GridLayer extends GridLayerMapRotationMethods {
    }
}
declare module '../layer/BlanketOverlay.js' {
    interface BlanketOverlay extends BlanketOverlayMapRotationMethods {
    }
}
declare module '../layer/DivOverlay.js' {
    interface DivOverlay extends DivOverlayMapRotationMethods {
    }
}
declare module '../layer/Popup.js' {
    interface Popup extends PopupMapRotationMethods {
    }
}
declare module '../layer/Tooltip.js' {
    interface Tooltip extends TooltipMapRotationMethods {
    }
}
declare module '../layer/marker/Marker.js' {
    interface MarkerOptions extends MarkerMapRotationOptions {
    }
}
declare module '../layer/marker/Marker.js' {
    interface Marker extends MarkerMapRotationMethods {
    }
}
declare module '../layer/marker/Marker.Drag.js' {
    interface MarkerDrag extends MarkerDragMapRotationMethods {
    }
}
declare module '../dom/Draggable.js' {
    interface Draggable extends DraggableMapRotationMethods {
    }
}
declare module './handler/DragHandler.js' {
    interface DragHandler extends DragHandlerMapRotationMethods {
    }
}
declare module './handler/PinchZoomHandler.js' {
    interface PinchZoomHandler extends PinchZoomHandlerMapRotationMethods {
    }
}
declare module './handler/TapDragZoomHandler.js' {
    interface TapDragZoomHandler extends TapDragZoomHandlerMapRotationMethods {
    }
}
declare module './handler/ScrollWheelZoomHandler.js' {
    interface ScrollWheelZoomHandler extends ScrollWheelZoomHandlerMapRotationMethods {
    }
}
