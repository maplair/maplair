Feature Ideas
=============

Widely desired features of Leaflet that Maplair does not have yet, with a plan
for each. Collected from the open issues of [Leaflet](https://github.com/Leaflet/Leaflet/issues)
by 👍 reactions and comments. Votes are given as 👍/💬.

Implemented in this order: quick wins first (4, 5, 6, 3, 12, 11), then 8, 7, 10,
and the large ones last (2, 9, 1).

## 1. Map rotation (bearing)

**Status:** implemented in a0186215, an optional module `maplair/map-rotation` since d5c59a1c (see the comment there on possible size savings). Not yet rotation-aware: `maxBounds` viscosity, `worldCopyJump` and box zoom (zooms to the bounding box of the drawn box).

[#9537](https://github.com/Leaflet/Leaflet/issues/9537) 8/2,
[#268](https://github.com/Leaflet/Leaflet/issues/268) 2/66,
[#2342](https://github.com/Leaflet/Leaflet/issues/2342) · effort: large

Map option `bearing`, `setBearing()`/`getBearing()`. Wrap the map pane in a
rotated pane, route the container↔layer point conversions in `Map.js` through a
rotation matrix, load tiles for the bounding box of the rotated view
(`GridLayer._getTiledPixelBounds`), keep markers/tooltips/popups upright, rotate
drag offsets in `DragHandler`, add two-finger rotation to `PinchZoomHandler` and
a compass control resetting north. Prior art: the leaflet-rotate plugin. Keep
`bearing: 0` a zero-cost path.

## 2. Continuous zoom

**Status:** implemented in 2a8f009c. Opt-in with the map option `continuousZoom`. The tile gaps of #3575 remain.

[#4696](https://github.com/Leaflet/Leaflet/issues/4696) 37/11,
[#4610](https://github.com/Leaflet/Leaflet/issues/4610) 9/4 · effort: medium–large

Zoom through fractional levels and switch tile levels delayed, like MapLibre.
Drive zoom animations frame by frame with `_move(center, fractionalZoom)` (as
pinch and tap-drag zoom do), let the scroll wheel accumulate into an eased
target zoom, and let `GridLayer` keep the current level scaled until zooming
pauses. Goes along with the tile gaps on fractional zoom levels
([#3575](https://github.com/Leaflet/Leaflet/issues/3575) 35/203).

## 3. Touchpad gestures

**Status:** implemented in ed9b0db9.

[#7046](https://github.com/Leaflet/Leaflet/issues/7046) 13/7 · effort: small–medium

Touchpad pinch arrives as `wheel` with `ctrlKey` (Chrome, Firefox, Edge) or as
`gesturestart`/`gesturechange` (Safari): zoom proportionally to the gesture.
Two-finger scrolling (pixel-mode `deltaX`/`deltaY`) pans the map with the new
option `scrollWheelZoom: 'trackpad'`.

## 4. User-initiated vs. programmatic view changes

**Status:** implemented in 5573d390.

[#2934](https://github.com/Leaflet/Leaflet/issues/2934) 24/12 · effort: small

`movestart`/`move`/`moveend`/`zoomstart`/`zoom`/`zoomend` carry the
`originalEvent` of the user interaction that caused them (as in MapLibre), so
that apps syncing the view (e.g. to the URL) can avoid feedback loops. Handlers
set an interaction context on the map while changing the view.

## 5. Map `idle` event

**Status:** implemented in 2bd7f356.

[#3178](https://github.com/Leaflet/Leaflet/issues/3178) 3/42 · effort: small

Fire `idle` once the view is not moving or animating and all grid layers have
loaded their tiles. Useful for screenshots, tests and prerendering.

## 6. `setInteractive()` for layers

**Status:** implemented in 4bc21f7c.

[#5442](https://github.com/Leaflet/Leaflet/issues/5442) 11/8 · effort: small

Toggle `options.interactive` at runtime: (re)register interactive targets and
the `maplair-interactive` class for markers and SVG paths; the canvas renderer
checks the option when hit-testing.

## 7. Flicker-free tile swapping, placeholder tiles

**Status:** implemented in b199cb10.

[#6659](https://github.com/Leaflet/Leaflet/issues/6659) 10/29,
[#4866](https://github.com/Leaflet/Leaflet/issues/4866) 0/18 · effort: medium

`setUrl(url)` loads the new tiles into a fresh level and keeps the old level
until the new one has loaded. A `placeholder` option styles tiles while loading.

## 8. Fetch-based tiles: custom headers and aborting

**Status:** implemented in 513627c2.

[#7560](https://github.com/Leaflet/Leaflet/issues/7560) 16/5 · effort: medium

TileLayer option `fetchOptions` (e.g. `{headers: {Authorization: …}}`): load
tiles with `fetch()` and an `AbortController`, show them via object URLs, abort
requests of pruned tiles and revoke the object URLs.

## 9. Changing the CRS at runtime

**Status:** implemented in 62b809df.

[#2553](https://github.com/Leaflet/Leaflet/issues/2553) 3/39 · effort: medium

`map.setCrs(crs)` keeping the center (and the scale): swap `options.crs`, reset
the view, let grid layers reset their grid and vectors re-project, fire
`crschange`.

## 10. Accessibility

**Status:** implemented in 9884f3b6.

[#9119](https://github.com/Leaflet/Leaflet/issues/9119),
[#7193](https://github.com/Leaflet/Leaflet/issues/7193),
[#9131](https://github.com/Leaflet/Leaflet/issues/9131),
[#7821](https://github.com/Leaflet/Leaflet/issues/7821),
[#8115](https://github.com/Leaflet/Leaflet/issues/8115) · effort: medium

Map option `ariaLabel` (`role="region"` with an accessible name); keyboard
shortcuts help on `?`; `<button>` instead of `<a href="#">` in controls; return
the focus to the source layer when closing its popup.

## 11. Dynamic `devicePixelRatio`

**Status:** implemented in be0ff4d6.

[#8188](https://github.com/Leaflet/Leaflet/issues/8188),
[#7095](https://github.com/Leaflet/Leaflet/issues/7095),
[#8850](https://github.com/Leaflet/Leaflet/issues/8850) · effort: small–medium

Watch `matchMedia('(resolution: …dppx)')`, so that retina tiles and canvas
resolution follow when moving the window to another screen or zooming the page.

## 12. Pixelated (nearest-neighbour) zooming

**Status:** implemented in c2f3209d.

[#5883](https://github.com/Leaflet/Leaflet/issues/5883) 4/7 · effort: small

Option `pixelated` for grid layers and image/video overlays setting
`image-rendering: pixelated`, for raster data, game maps and scientific imagery.

## Round 2

More widely desired features of Leaflet, after implementing 1–12. Suggested
order: quick wins first (15, 21, 19, 23, 13, 17), then 22, 16, 18, 20, and the
large ones last (14, 24).

## 13. Cooperative gestures

**Status:** open.

[#9448](https://github.com/Leaflet/Leaflet/issues/9448),
[#2501](https://github.com/Leaflet/Leaflet/issues/2501) · effort: small–medium

Map option `cooperativeGestures`, so that the map does not hijack page scrolling
(like Google Maps): the mouse wheel zooms only with Ctrl/⌘, otherwise the page
scrolls and a translated hint ("Use Ctrl + scroll to zoom") shows briefly; on
touch screens, one finger scrolls the page (`touch-action: pan-y`, `DragHandler`
ignores single touches) and two fingers pan and zoom (`PinchZoomHandler` also
pans with the midpoint). Touchpad pinching keeps working.

## 14. Vectors and markers across the antimeridian

**Status:** open.

[#5179](https://github.com/Leaflet/Leaflet/issues/5179),
[#82](https://github.com/Leaflet/Leaflet/issues/82) 3/18 · effort: medium

Option `worldCopies` for paths and markers: paths are projected once and drawn
again offset by the world width in pixels; markers get icons for the visible
world copies. Option `wrapLongitudes` shifts each coordinate to within 180° of
the previous one, so that lines crossing ±180° take the short way. Events on a
copy report the latlng of that copy.

## 15. `setStyle({className})` and a `change` event for paths

**Status:** open.

[#2662](https://github.com/Leaflet/Leaflet/issues/2662) 8/21,
[#2235](https://github.com/Leaflet/Leaflet/issues/2235) 5/1 · effort: small

`SVG._updateStyle()` replaces the classes previously added from `className` (the
canvas renderer ignores it). `setLatLngs()`, `addLatLng()`, `setRadius()` and
`setLatLng()` fire `change`.

## 16. Accessible vectors and markers

**Status:** open.

[#7822](https://github.com/Leaflet/Leaflet/issues/7822),
[#4179](https://github.com/Leaflet/Leaflet/issues/4179),
[#8116](https://github.com/Leaflet/Leaflet/issues/8116),
[#3472](https://github.com/Leaflet/Leaflet/issues/3472) 1/8 · effort: medium

Path options `title`/`ariaLabel` (SVG `<title>` and `aria-label`); interactive
SVG paths are focusable (`tabindex`, `role="button"`) and fire `click` on Enter;
canvas paths get a hidden, focusable list mirroring them. Non-interactive
markers get no tab stop, and changing `keyboard` takes effect via a setter.

## 17. Updating markers in place

**Status:** open.

[#4259](https://github.com/Leaflet/Leaflet/issues/4259),
[#3788](https://github.com/Leaflet/Leaflet/issues/3788),
[#4484](https://github.com/Leaflet/Leaflet/issues/4484) 3/13 · effort: small–medium

`DivIcon` option `html` as function of the marker; `marker.setIconContent(html)`
and `marker.setStyle({className, opacity, zIndexOffset})` change the existing
element. `setIcon()` keeps the element when the icon type and size are the same,
which also keeps drag listeners alive during dragging (#4484).

## 18. Decluttering and culling of tooltips

**Status:** open.

[#5104](https://github.com/Leaflet/Leaflet/issues/5104) 0/8,
[#6734](https://github.com/Leaflet/Leaflet/issues/6734) · effort: medium

Map option `tooltipCollision: 'hide'`: on `moveend`, sort permanent tooltips by
a `priority` option and hide those whose screen boxes overlap a higher-priority
one (reusing the measured sizes of the `auto` placement). Extend `markerCulling`
to take tooltips far outside of the view off the page.

## 19. Control layout: center positions, no overlap

**Status:** open.

[#791](https://github.com/Leaflet/Leaflet/issues/791),
[#4658](https://github.com/Leaflet/Leaflet/issues/4658),
[#10075](https://github.com/Leaflet/Leaflet/issues/10075) · effort: small

Positions `topcenter`, `bottomcenter`, `centerleft` and `centerright`; lay out
the control corners with a CSS grid, so that controls of different corners do
not overlap; the layers control limits its height to the space left.

## 20. Trusted Types and strict CSP

**Status:** open.

[#9773](https://github.com/Leaflet/Leaflet/issues/9773) 1/16,
[#8423](https://github.com/Leaflet/Leaflet/issues/8423),
[#9168](https://github.com/Leaflet/Leaflet/issues/9168) 0/7 · effort: medium

Build internal markup (control buttons, icons) with DOM APIs instead of
`innerHTML`; pass user HTML strings through an optional `sanitizer` or a
configured Trusted Types policy; replace inline `style` attributes in generated
SVG with classes, so that pages don't need `'unsafe-inline'` styles.

## 21. Richer event data

**Status:** open.

[#1509](https://github.com/Leaflet/Leaflet/issues/1509),
[#6953](https://github.com/Leaflet/Leaflet/issues/6953),
[#8641](https://github.com/Leaflet/Leaflet/issues/8641) · effort: small

`zoomstart`/`movestart` carry the target `zoom` and `center` (known in
`setView()`, `flyTo()` and pinch zoom, passed to `_moveStart()`); marker
`dragstart` has the `originalEvent` (already provided by `Draggable`); map
pointer events carry the clicked `layer` (from `propagatedFrom`).

## 22. Fallback for missing tiles

**Status:** open.

[#3127](https://github.com/Leaflet/Leaflet/issues/3127) 1/14,
[#6802](https://github.com/Leaflet/Leaflet/issues/6802) · effort: small–medium

TileLayer option `errorTileFallback: 'parent'`: on `tileerror`, keep or load the
parent tile and show the matching quarter, scaled up (reusing the parent tile
retention of `GridLayer._retainParent()`); optionally a list of URL templates
tried in turn.

## 23. Locate control

**Status:** open.

[#10097](https://github.com/Leaflet/Leaflet/issues/10097), leaflet-locatecontrol
(875 ⭐) · effort: small

`LocateControl` (map option `locateControl`) on top of `map.locate()`: a position
marker with an accuracy circle, following the position until the user pans,
translated error messages; uses the new `<geolocation>` element where available
for an explicit permission prompt.

## 24. Marker clustering

**Status:** open.

Leaflet.markercluster (4172 ⭐, the most used plugin; upstream it is left to
plugins) · effort: large

`MarkerClusterGroup` layer group with a per-zoom index (grid or kd-tree like
supercluster) of the projected marker positions; on `moveend`/`zoomend` it shows
cluster markers (`DivIcon` with the count) for the visible bounds, zooms to the
cluster bounds on click, culls like `markerCulling`, and animates splitting and
merging with CSS transitions.

## Near misses

* [#3575](https://github.com/Leaflet/Leaflet/issues/3575) gaps between tiles on fractional zoom levels (a bug, see 2)
* [#9115](https://github.com/Leaflet/Leaflet/issues/9115) dark mode for controls and popups (`prefers-color-scheme`)
* [#7117](https://github.com/Leaflet/Leaflet/issues/7117) requesting tiles via POST (partly possible with `fetchOptions`)
* [#8277](https://github.com/Leaflet/Leaflet/issues/8277) `ImageOverlay.redraw()`

## Round 3: features of popular plugins

Widely used Leaflet plugins (by GitHub stars) whose features fit into Maplair
core without exploding complexity or bundle size. Each is an opt-in,
tree-shakeable module (not registered as default feature in `Map.js`), so maps
not using it pay nothing; sizes are minified estimates. Suggested order: the
smallest first (33, 27, 28, 35, 26, 31), then 30, 34, 29, 32, 25, 36.

All but 36 are implemented. Features extending existing classes (32, 33, 34,
and the map rotation 1) are optional modules adding themselves with
`Class.include()`, so that bundlers only include them when imported;
`pnpm run test:tree-shaking` checks this. The other features are classes of
their own.

## 25. Heatmap layer

**Status:** implemented in 991ec651 (`HeatLayer`).

[Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) (1.7k ⭐) · ~2 kB

`HeatLayer(latlngs, {radius, blur, gradient, max})` extending `BlanketOverlay`
(canvas, padding and pan/zoom handling for free). Like simpleheat: draw a
pre-blurred circle per point into a grayscale canvas with alpha = intensity,
then colorize the pixels with a 256-entry gradient lookup table. Merge points per
grid cell for speed; redraw on `moveend`/`zoomend`, scale the canvas while
pinching or with `continuousZoom`.

## 26. Colored markers with glyphs

**Status:** implemented in 21ab5408 as `SvgIcon` (the default icon has no `color` option).

[Leaflet.awesome-markers](https://github.com/lennardv2/Leaflet.awesome-markers) (1.3k ⭐),
[leaflet-color-markers](https://github.com/pointhi/leaflet-color-markers) (0.7k ⭐),
[Leaflet.ExtraMarkers](https://github.com/coryasilva/Leaflet.ExtraMarkers) (0.35k ⭐) · ~1 kB

`SvgIcon({color, glyph, size})` and a `color` option for the default icon: the
marker is SVG already, so generate it inline with `currentColor` and an optional
centered glyph (text, emoji or SVG path) – no image per color, retina-sharp. The
shadow stays `marker-shadow.svg`.

## 27. View in the URL hash

**Status:** implemented in cf209a53 as `new Hash(map)`, with geo URIs (`format: 'geo'`) in 21ff83f0 and the base layer and overlays (`layers` option) in 2aedd723.

[leaflet-hash](https://github.com/mlevans/leaflet-hash) (0.3k ⭐) · ~0.5 kB

Map option `hash: true` (or a `Hash` helper): on `moveend` with `originalEvent`
(see 4, avoiding feedback loops), write `#zoom/lat/lng[/bearing]` with
`history.replaceState`; on `hashchange`, `setView()`. Precision depends on the
zoom like in the plugin.

## 28. Generic button control

**Status:** implemented in 70137c45 (`ButtonControl`, `ButtonBarControl`); `FullscreenControl` and `RotateControl` don't reuse it yet.

[Leaflet.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton) (0.5k ⭐) · ~0.5 kB

`ButtonControl({content, title, onClick, states: […]})` with the `<button>` and
`maplair-bar` markup of the zoom and fullscreen controls (keyboard and ARIA for
free); optional states switch content and title; `ButtonControl.bar([…])` groups
buttons. `FullscreenControl` and `RotateControl` could reuse it.

## 29. Overview map

**Status:** implemented in 2d1ac007 (`MiniMapControl`).

[Leaflet-MiniMap](https://github.com/Norkart/Leaflet-MiniMap) (0.4k ⭐) · ~1.5 kB

`MiniMapControl(layer, {zoomOffset: -5, toggleable})`: a second, non-interactive
map in the control following `move` of the main map; the view's bounds drawn as
rectangle (as polygon of the rotated corners on a rotated map); dragging it pans
the main map; a toggle button collapses it.

## 30. Side-by-side comparison

**Status:** implemented in db7c2fb1 (`SideBySideControl`, divider position via `setRatio()`).

[leaflet-side-by-side](https://github.com/digidem/leaflet-side-by-side) (0.4k ⭐) · ~1 kB

`SideBySideControl(leftLayers, rightLayers)`: a draggable divider whose position
clips the layer containers with `clip-path: inset()`, updated on `move`,
`resize` and dragging; the divider is a `role="slider"` moved with arrow keys.

## 31. Context menu

**Status:** implemented in 362b7c85 as `new ContextMenu(items).addTo(mapOrLayer)` instead of an option.

[Leaflet.contextmenu](https://github.com/aratcliffe/Leaflet.contextmenu) (0.4k ⭐) · ~1.5 kB

Map and layer option `contextmenu: [{text, callback, icon}, '-']`: on the
`contextmenu` event (also simulated on long tap), show a `popover="auto"` menu
(light dismiss and Escape for free) at the pointer, kept within the viewport;
callbacks get `{latlng, containerPoint, relatedTarget}`; arrow-key navigation
with `role="menu"`.

## 32. Arrowheads and text along paths

**Status:** implemented in 133c2488 as optional module `maplair/path-decorations`.

[Leaflet.PolylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator) (0.5k ⭐),
[Leaflet.TextPath](https://github.com/makinacorpus/Leaflet.TextPath) (0.3k ⭐) · ~1.5 kB

Path options `arrowheads: {size, frequency}` and `text: {content, repeat,
offset}`. SVG: a shared `<marker>` in `<defs>` and `<textPath>` referring to the
path's `id`. Canvas: walk the projected segments and draw arrowheads and text at
the given distances and angles. Recomputed in `_update()`.

## 33. Rotated marker icons

**Status:** implemented in 34e47b5c, an optional module `maplair/marker-rotation` since d5c59a1c.

[Leaflet.RotatedMarker](https://github.com/bbecquet/Leaflet.RotatedMarker) (0.27k ⭐) · ~0.3 kB

Marker option `rotationAngle` and `setRotationAngle()`, rotating around the icon
anchor (or `rotationOrigin`), e.g. for vehicle headings: extends the upright
rotation of `_setPos()` (angle + bearing, or the angle only with
`rotateWithView`).

## 34. Animated markers and paths

**Status:** implemented in 857bf79d as optional modules `maplair/marker-movement` and `maplair/dash-animation` (the option is `dashSpeed`).

[Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker) (0.35k ⭐),
[Leaflet.AnimatedMarker](https://github.com/openplans/Leaflet.AnimatedMarker) (0.38k ⭐),
[leaflet-ant-path](https://github.com/rubenspgcavalcante/leaflet-ant-path) (0.48k ⭐) · ~1 kB

`marker.moveTo(latlng, {duration})` and `marker.moveAlong(latlngs, {speed})`
interpolating in projected coordinates frame by frame, firing `move`,
cancellable, with an `end` event. Path option `animate: {dashArray, speed}` for
"marching ants" with a CSS animation of `stroke-dashoffset` (canvas: redraw with
`lineDashOffset`). Both respect `prefers-reduced-motion`.

## 35. Synchronized maps

**Status:** implemented in d9660db3 as `new MapSync([map1, map2])` instead of `map.sync()`.

[Leaflet.Sync](https://github.com/jieter/Leaflet.Sync) (0.25k ⭐) · ~0.7 kB

`map.sync(otherMap, {offset})`/`unsync()`: on user-caused `move`/`zoom` (see 4),
call `_move()` on the other maps without animation and mirror
`movestart`/`moveend`; changes by code on the synced maps are ignored, so there
are no loops. Optionally sync the bearing.

## 36. Tile provider presets

**Status:** open.

[leaflet-providers](https://github.com/leaflet-extras/leaflet-providers) (2.4k ⭐) · ~0.5 kB per provider

`TileLayer.provider('OpenStreetMap.HOT', {apikey})` backed by a separate data
module (`maplair/providers`) mapping names to `{url, attribution, options}`; a
small curated set of free providers in core, the full list could be a separate
package. Documents the required attributions.

## Covered elsewhere or left out

* Already covered: Leaflet.markercluster (24), leaflet-locatecontrol (23),
  Leaflet.GestureHandling (13), Leaflet.fullscreen (done), Leaflet.label
  (tooltips), OverlappingMarkerSpiderfier (`DisplaceHandler`), `mix-blend-mode`
  for overlays (`className` option)
* Too large or specialized: drawing and editing (leaflet-geoman, Leaflet.draw,
  Leaflet.Editable), routing and geocoding (external services), esri-leaflet,
  vector tiles (VectorGrid, protomaps-leaflet), WebGL renderers (Leaflet.glify,
  Leaflet.PixiOverlay), image export (leaflet-image, leaflet-easyPrint),
  elevation profiles (d3), geometry libraries (Turf; `LatLngBounds.intersects()`
  covers simple pre-filters)
* Near misses: measuring (leaflet-measure), geometry utilities
  (Leaflet.GeometryUtil), GPX/KML loading (leaflet-gpx, leaflet-omnivore)

## Round 4: public API instead of patching

Features that Leaflet apps and plugins commonly build by monkey-patching or with
private API (`_limitOffset`, `_controlCorners`, `_layers`, `_openTooltip`, …).
Suggested order: quick wins first (47, 43, 42, 49, 48, 45, 46, 50), then 37, 44,
41, 38, 51, and the large ones last (39, 40).

## 37. Tooltip auto-panning and placement preferences

Effort: small–medium

Tooltip option `autoPan` (today `Tooltip._adjustPan()` is a no-op): pan the map
so that an opened tooltip is in view, like popups, but limited by `maxBounds`
(public `map.limitOffset(offset)` instead of `_limitOffset()`; `panBy()` itself
overshoots and snaps back on `moveend`). The `auto` placement counts the space
gained by panning. Option `autoDirections: ['top', 'bottom', 'right', 'left']`
sets the order of preference (e.g. above/below first, sides only as
fallback). `overflow: 'horizontal'` lets the tooltip extend beyond the map
sideways only, so that it stays below page headers.

## 38. Tap-to-pin tooltips on touch screens

Effort: small–medium

Tooltip option `pinOnTap` (default: `matchMedia('(hover: none)')`): without
hover, a tap opens and pins the tooltip instead of firing `click`; tapping
elsewhere (also outside of the map) or Escape closes it; at most one pinned
tooltip per map; a pinned tooltip is `interactive`, so links in it work. With
hover, the default stays: hover opens, click acts. Events `tooltippin`/
`tooltipunpin`. Replaces switching off the private `_openTooltip` and
`_addFocusListeners` listeners.

## 39. Search control

[leaflet-search](https://github.com/stefanocudini/leaflet-search) · effort: medium

`SearchControl({layer, property, zoom, placeholder})` searching the features of
a layer group by a property, or with a `search(text) → Promise<[{label, latlng,
layer}]>` callback (geocoders). An expanding `<input type="search">` with an
ARIA combobox and listbox, keyboard navigation and translated texts. On
selection: `setView()`/`fitBounds()`, a highlight ring and `searchfound` with
the layer (the app opens its tooltip). The ring is a standalone
`HighlightMarker` (pulsing circle, still with `prefers-reduced-motion`), also
used for tapped markers.

## 40. Time dimension: animated WMS time series

[Leaflet.TimeDimension](https://github.com/socib/Leaflet.TimeDimension) (with
iso8601-js-period), e.g. an hourly animation of a day · effort: medium–large

Opt-in module. `WMSTileLayer` option `time` and `setTime(date)` setting the
`TIME` parameter with the flicker-free swapping of 7, prefetching the tiles of
the next step. `TimeControl({times | interval: 'P1D/2026-10-17T12:00Z',
period: 'PT1H', loop, transitionTime})`: play/pause/step buttons (reusing 28)
and a range slider; advances only once the frame has loaded (`load`), fires
`timechange`. Parses ISO 8601 intervals and durations itself; formats dates with
`Intl.DateTimeFormat` or an option `formatTime` (instead of overriding
`_getDisplayDateFormat`). `ImageOverlay` takes part via a URL function of the
time.

## 41. Layers control: inline layout, groups and public API

Effort: small–medium

Option `layout: 'inline'`: never collapsed, entries next to each other, styled
like the attribution. `addBaseLayer(layer, name, {group})` (also for overlays)
renders the entries of a group under the group name once
(`<fieldset>`/`<legend>`); covers leaflet-groupedlayercontrol. `getLayers()`
returning `{layer, name, overlay, group}` instead of `_layers`;
`selectLayer(layer)` behaving like a user click (`baselayerchange` with
`originalEvent`, see 4); option `toggleContent` for a custom toggle icon (e.g. a
filter) instead of styling `_layersLink`.

## 42. Control order, text control and access keys

**Status:** implemented in a407f79c (`TextControl`, the Control option `order`, the `ButtonControl` option `accessKey`).

Effort: small

Control option `order`: controls in a corner are sorted by it instead of by the
order of adding (instead of inserting into `_controlCorners` to put controls
first). `TextControl({content})` with `setContent(html | element)`, hidden while
empty (content passed through the sanitizer of 20). `ButtonControl` option
`accessKey`, shown in the title and as `aria-keyshortcuts`.

## 43. Changing attributions and their order

**Status:** implemented in 61a21f7b (`setAttribution()`, the layer option `attributionOrder`).

Effort: small

`layer.setAttribution(text)` updates the attribution control while the layer is
on the map (instead of `removeAttribution()`, mutating `options.attribution` and
`addAttribution()`). Layer option `attributionOrder` (a number, default 0):
attributions are sorted by it, then by the order of adding, so that e.g. a
legend stays last when another layer's attribution changes (today needs deleting
from `_attributions`).

## 44. Refreshing layers

Effort: small–medium

`refresh()` for `TileLayer` (incl. WMS), `ImageOverlay` and URL-backed `GeoJSON`
(45): reload the current data without flickering, the old tiles or image staying
until the new ones have loaded (as 7; solves #8277 `ImageOverlay.redraw()`),
with a cache-busting parameter. Option `refreshInterval`, paused while the page
is hidden (`visibilitychange`), refreshing once on return.

## 45. GeoJSON from a URL

**Status:** implemented in cda6946a as optional module `maplair/geojson-loading` (`load()`, options `url`, `fetchOptions`, `fitBounds`; no URL as first constructor argument).

[leaflet-ajax](https://github.com/calvinmetcalf/leaflet-ajax) · effort: small

`geoJSON(url | Promise, options)` and `layer.load(url, {fetchOptions})`
returning a promise: replaces the data (`clearLayers()` + `addData()`), aborts a
running load with an `AbortController`, fires `load`/`error`; option
`fitBounds` zooms to the data once loaded.

## 46. Zoom-dependent styles

**Status:** implemented in d6126dda as optional module `maplair/zoom-styles`; interpolation with `Path.interpolate(stops)` instead of an option.

Effort: small–medium

Path options `radius` and `weight` as zoom stops, e.g. `radius: {5: 3, 10: 6,
15: 10}` (stepped, or interpolated with `interpolate: true`, like MapLibre's
zoom expressions), or as function `(zoom) => number`. Re-evaluated on
`zoomend` (and while zooming with `continuousZoom`), before the relayout of
`DisplaceHandler`.

## 47. Hidden maps keep their view

**Status:** implemented in a4ff5f18.

Effort: small

The `ResizeObserver` of `trackResize` ignores a zero size, i.e. a container
hidden with `display: none` (tabs, collapsed panels): the map keeps its size,
view and `getBounds()` of the last visible state and updates when shown again.
Today hiding a map collapses its bounds to a point.

## 48. Following another map by bounds

**Status:** implemented in 45f739e6.

Effort: small

`MapSync` options `oneWay: true` (only follow the other map) and `fit:
'bounds'`: fit the bounds of the other map instead of copying center and zoom,
for maps of different sizes such as thumbnails next to the main map.

## 49. Hash: query parameters

**Status:** implemented in 9e653ccb.

Effort: small

`Hash` option `mode: 'query'` (`?zoom=&lat=&lng=` with `history.replaceState`,
keeping the other parameters of the app). The base layer and the overlays are
already kept with the `layers` option (2aedd723); in query mode as parameter
`layers` too.

## 50. WMS legend URL

**Status:** implemented in dfe859bb (also adds `sld_version` for WMS 1.3).

Effort: small

`wmsLayer.getLegendUrl({layer, width, height})` building the `GetLegendGraphic`
request with the layer's URL, version and format (e.g. for an `<img>` in the
attribution or a legend control).

## 51. Categorized and graduated symbology with a legend

Effort: medium · ~2 kB

Thematic maps style features by class, in QGIS terms with a *categorized*
renderer (one symbol per distinct value, e.g. an API code `'S2'`) or a
*graduated* renderer (one symbol per range of a numeric value, e.g. `< 15 min`,
`< 30 min`, …), and explain the classes in the *legend*, optionally with the
*feature count* per class. Apps build this by hand: style each marker from its
class, render the legend into the attribution, and rebuild it whenever the data
changes. Common requirements:

* classes by value (categorized) or by range (graduated), the value given by an
  attribute or a function of the feature, with a tolerant lookup (legend label
  instead of value, whitespace variants) and an *all other values* class
* several values sharing one legend label or symbol appear once in the legend
* classes such as "no data" are rendered but excluded from the feature count
* legend patches in the shape of the feature (circle, square, line), like QGIS
  legend patch shapes
* the feature count as text (`42 stations, < 15 min: 30 (71.4 %)`) and as a
  stacked bar, accessible (`role="img"`, `aria-label`)
* the symbol colors reused elsewhere (charts, tables, filters)

Wa**Legend protocol and `LegendControl`.** Like `getAttribution()` collected by
the attribution control, layers may implement `getLegend() → HTMLElement`, and a
`LegendControl` (a plain `Control` with flat options like `position` and
`collapsed`) collects the legends of all layers on the map, updated on
`layeradd`/`layerremove` and a `legendchange` event (like `crschange`). It
renders in a control or inside the attribution (`<details>` to collapse it). A
checkbox per class toggles it, hovering highlights its features. Layers with a
classification, WMS layers (the `GetLegendGraphic` image of 50), heat layers
(the gradient of 25) and image overlays all plug into it, like QGIS layers
providing legend nodes to the layer tree.

**One `Classification` for categories and ranges.** The classes are the
constructor argument (like the layers of `new LayersControl(baseLayers,
overlays, options)`), each class either by value or by range, so both kinds mix
in one list (e.g. a "no data" class next to temperature ranges):

* `{value: 'S2'}` or `{value: ['S1', 'S2']}`: one class for one or several
  values (QGIS merged categories); an array always means several values, never a
  range, so `[15, 30]` is not ambiguous
* `{lower: 15, upper: 30}`: a range `lower ≤ v < upper`, either bound left out
  for an open end (no `[-Infinity, -10]`), the names of QGIS `QgsRendererRange`
  (`min`/`max` would leave open whether `max` is included)
* later `{filter: f => …}` for rule-based classes, without changing the format

Lookup first by exact value (`Map`), then by range (binary search over the
sorted bounds), then `otherValues`; option `normalize` for tolerant matching
(legend label instead of value, whitespace variants). Methods: `classify(feature)
→ class`, `style(feature) → PathOptions` (bound, for the `style` option),
`legendItems()` (merged by legend label and symbol), `featureCount(features) →
[{legend, count, share}]`. Classification methods (equal interval, quantile,
pretty breaks) as static methods computing ranges, e.g.
`Classification.quantile(values, n)` (like `Hash.parse`), not as exported
helpers.

Naming: the terms differ between tools. QGIS *categorized* / *graduated*,
ArcGIS *unique values* / *class breaks*, MapLibre `match` / `step`, d3
`scaleOrdinal` / `scaleThreshold`, and OGC SLD/SE `Recode` / `Categorize`, where
*categorize* means ranges, the opposite of QGIS. "Graduated" is shared by QGIS
and ArcGIS, "categorized" is QGIS only. One `Classification` class avoids
picking either, and reads naturally next to `classify()`.

The option `classification` of `FeatureGroup` (and so `GeoJSON`) connects both:
the group implements `getLegend()` from the classification and the feature
count of its layers, and fires `legendchange` on `layeradd`/`layerremove`, so
refreshing the data updates the legend without app code. Example, weather
stations classified by air temperature, as circle markers:

```js
import {Classification, LegendControl} from 'maplair/classification';

const temperature = new Classification([
	{value: null, symbol: {fillColor: '#000000'}, legend: 'No data', counted: false},
	{upper: -10, symbol: {fillColor: '#1f78b4'}, legend: '< -10 °C'},
	{lower: -10, upper: 0, symbol: {fillColor: '#5bc0de'}, legend: '-10–0 °C'},
	{lower: 0, upper: 10, symbol: {fillColor: '#33ee33'}, legend: '0–10 °C'},
	{lower: 10, symbol: {fillColor: '#f0a030'}, legend: '≥ 10 °C'},
], {
	value: f => f.properties.temperature, // or an attribute name
	otherValues: {symbol: {fillColor: '#cccccc'}, legend: 'All other values'},
});

const stations = new GeoJSON(data, {
	classification: temperature, // getLegend() and the feature count of this layer
	pointToLayer: (feature, latlng) => new CircleMarker(latlng, {radius: 6, color: '#ffffff'}),
	style: temperature.style, // fillColor of the class
}).addTo(map);

// collects getLegend() of all layers, here inside the attribution
new LegendControl({container: 'attribution', featureCount: true}).addTo(map);

// refreshing the data restyles the markers and fires legendchange
stations.clearLayers().addData(newData);

// the same symbol for the class column of a table
const {legend, symbol} = temperature.classify(feature);

// any other layer may provide a legend
wmsLayer.addTo(map); // GetLegendGraphic image
const CustomLayer = Layer.extend({
	getLegend() {
		const el = document.createElement('div');
		el.textContent = 'Custom';
		return el;
	},
});
```

Implementation: an opt-in module `maplair/classification` exporting
`Classification` and `LegendControl`, adding `Layer.getLegend()` (documented
next to `getAttribution()`) and the `classification` option to `FeatureGroup`
with `include()`, leaving the core classes untouched. Legend patches as small
inline SVG (circle for `CircleMarker`, square for polygons, line for
polylines) with the class symbol, so that they match the map, also in dark mode
via CSS variables. The feature count as text and as a bar of flex `<div>`s with
`flex-grow` = count. Translated texts ("{n} features", "Legend", "All other
values") via `I18n`. Specs: lookup by value, merged values, range, open ranges
and legend label; mixed values and ranges; all other values; merging in the
legend; classes excluded from the count; counts after adding and removing
layers; legend update in the attribution and the control; toggling classes.

 Also implemented

Features done in this fork besides the ideas above:

* `TapDragZoomHandler`: zooming by double tapping and dragging up/down (9fc23279)
* DivOverlay option `overflow` for popups and tooltips extending beyond the map (6dae829d)
* Tooltip `direction: 'auto'` choosing the direction by the available space (5f53d46b)
* `FullscreenControl` (f5e563cb)
