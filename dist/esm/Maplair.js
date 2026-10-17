import { version as version$1 } from "./package.js";
import { Util_exports } from "./core/Util.js";
import { Class } from "./core/Class.js";
import { Point } from "./geometry/Point.js";
import Browser_default from "./core/Browser.js";
import { DomEvent_exports } from "./dom/DomEvent.js";
import { DomUtil_exports } from "./dom/DomUtil.js";
import { Control } from "./control/Control.js";
import { I18n } from "./core/I18n.js";
import { AttributionControl } from "./control/AttributionControl.js";
import { ButtonBarControl, ButtonControl } from "./control/ButtonControl.js";
import { Evented } from "./core/Events.js";
import { Layer } from "./layer/Layer.js";
import { ContextMenu } from "./control/ContextMenu.js";
import { FullscreenControl } from "./control/FullscreenControl.js";
import { LayersControl } from "./control/LayersControl.js";
import { Path } from "./layer/vector/Path.js";
import { Bounds } from "./geometry/Bounds.js";
import { LatLngBounds } from "./geo/LatLngBounds.js";
import { CRS } from "./geo/crs/CRS.js";
import { EarthCRS } from "./geo/crs/EarthCRS.js";
import { LatLng } from "./geo/LatLng.js";
import { CircleMarker } from "./layer/vector/CircleMarker.js";
import { LegendControl } from "./control/LegendControl.js";
import { Transformation } from "./geometry/Transformation.js";
import { EPSG3857, EPSG900913 } from "./geo/crs/EPSG3857.js";
import { PosAnimation } from "./dom/PosAnimation.js";
import { ZoomControl } from "./control/ZoomControl.js";
import { LayerGroup } from "./layer/LayerGroup.js";
import { FeatureGroup } from "./layer/FeatureGroup.js";
import { DivOverlay } from "./layer/DivOverlay.js";
import { Popup } from "./layer/Popup.js";
import { Tooltip } from "./layer/Tooltip.js";
import { BlanketOverlay } from "./layer/BlanketOverlay.js";
import { Renderer } from "./layer/vector/Renderer.js";
import { Canvas } from "./layer/vector/Canvas.js";
import { SVG } from "./layer/vector/SVG.js";
import { Handler } from "./core/Handler.js";
import { BoxZoomHandler } from "./map/handler/BoxZoomHandler.js";
import { DoubleClickZoomHandler } from "./map/handler/DoubleClickZoomHandler.js";
import { Draggable } from "./dom/Draggable.js";
import { DragHandler } from "./map/handler/DragHandler.js";
import { KeyboardHandler } from "./map/handler/KeyboardHandler.js";
import { PinchZoomHandler } from "./map/handler/PinchZoomHandler.js";
import { ScrollWheelZoomHandler } from "./map/handler/ScrollWheelZoomHandler.js";
import { TapHoldHandler } from "./map/handler/TapHoldHandler.js";
import { TapDragZoomHandler } from "./map/handler/TapDragZoomHandler.js";
import { Map, MaplairMap } from "./map/Map.js";
import { PolyUtil_exports } from "./geometry/PolyUtil.js";
import { LineUtil_exports } from "./geometry/LineUtil.js";
import { Polyline } from "./layer/vector/Polyline.js";
import { Polygon } from "./layer/vector/Polygon.js";
import { MiniMapControl } from "./control/MiniMapControl.js";
import { ScaleControl } from "./control/ScaleControl.js";
import { SideBySideControl } from "./control/SideBySideControl.js";
import { TextControl } from "./control/TextControl.js";
import { projection_exports } from "./geo/projection/index.js";
import { EPSG3395 } from "./geo/crs/EPSG3395.js";
import { EPSG4326 } from "./geo/crs/EPSG4326.js";
import { SimpleCRS } from "./geo/crs/SimpleCRS.js";
import { Icon } from "./layer/marker/Icon.js";
import { DefaultIcon } from "./layer/marker/DefaultIcon.js";
import { Marker } from "./layer/marker/Marker.js";
import { Circle } from "./layer/vector/Circle.js";
import { GeoJSON } from "./layer/GeoJSON.js";
import { Classification } from "./layer/Classification.js";
import { HeatLayer } from "./layer/HeatLayer.js";
import { ImageOverlay } from "./layer/ImageOverlay.js";
import { VideoOverlay } from "./layer/VideoOverlay.js";
import { SVGOverlay } from "./layer/SVGOverlay.js";
import { DivIcon } from "./layer/marker/DivIcon.js";
import { SvgIcon } from "./layer/marker/SvgIcon.js";
import { GridLayer } from "./layer/tile/GridLayer.js";
import { TileLayer } from "./layer/tile/TileLayer.js";
import { WMSTileLayer } from "./layer/tile/WMSTileLayer.js";
import { Rectangle } from "./layer/vector/Rectangle.js";
import { Hash } from "./map/Hash.js";
import { MapSync } from "./map/MapSync.js";
import { DisplaceHandler, displace } from "./map/handler/DisplaceHandler.js";
//#region src/Maplair.js
/**
* A constant that represents the Maplair version in use.
* @type {string}
*/
const version = version$1;
//#endregion
export { AttributionControl, BlanketOverlay, Bounds, BoxZoomHandler, Browser_default as Browser, ButtonBarControl, ButtonControl, CRS, Canvas, Circle, CircleMarker, Class, Classification, ContextMenu, Control, DefaultIcon, DisplaceHandler, DivIcon, DivOverlay, DomEvent_exports as DomEvent, DomUtil_exports as DomUtil, DoubleClickZoomHandler, DragHandler, Draggable, EPSG3395, EPSG3857, EPSG4326, EPSG900913, EarthCRS, Evented, FeatureGroup, FullscreenControl, GeoJSON, GridLayer, Handler, Hash, HeatLayer, I18n, Icon, ImageOverlay, KeyboardHandler, LatLng, LatLngBounds, Layer, LayerGroup, LayersControl, LegendControl, LineUtil_exports as LineUtil, Map, MapSync, MaplairMap, Marker, MiniMapControl, Path, PinchZoomHandler, Point, PolyUtil_exports as PolyUtil, Polygon, Polyline, Popup, PosAnimation, projection_exports as Projection, Rectangle, Renderer, SVG, SVGOverlay, ScaleControl, ScrollWheelZoomHandler, SideBySideControl, SimpleCRS, SvgIcon, TapDragZoomHandler, TapHoldHandler, TextControl, TileLayer, Tooltip, Transformation, Util_exports as Util, VideoOverlay, WMSTileLayer, ZoomControl, displace, version };

//# sourceMappingURL=Maplair.js.map