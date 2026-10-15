import pkg from '../package.json' with {type: 'json'};
export const version = pkg.version;

// control
export * from './control/index.js';

// core
export * from './core/index.js';

// dom
export * from './dom/index.js';

// geometry
export * from './geometry/index.js';

// geo
export * from './geo/index.js';

// layer
export * from './layer/index.js';

// map
export * from './map/index.js';

// register mixins
import {AttributionControl, Control, ZoomControl} from './control/index.js';
import {DivOverlay, Layer, Popup, Tooltip} from './layer/index.js';
import {
	BoxZoomHandler,
	DoubleClickZoomHandler,
	DragHandler,
	KeyboardHandler,
	PinchZoomHandler,
	ScrollWheelZoomHandler,
	TapHoldHandler
} from './map/index.js';

AttributionControl.register();
Control.register();
DivOverlay.register();
Layer.register();
BoxZoomHandler.register();
DoubleClickZoomHandler.register();
DragHandler.register();
KeyboardHandler.register();
PinchZoomHandler.register();
ScrollWheelZoomHandler.register();
TapHoldHandler.register();
Popup.register();
Tooltip.register();
ZoomControl.register();
