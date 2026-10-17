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
  (tooltips), OverlappingMarkerSpiderfier (`DisplaceHandler`)
* Too large or specialized: drawing and editing (leaflet-geoman, Leaflet.draw,
  Leaflet.Editable), routing and geocoding (external services), esri-leaflet,
  vector tiles (VectorGrid, protomaps-leaflet), WebGL renderers (Leaflet.glify,
  Leaflet.PixiOverlay), image export (leaflet-image, leaflet-easyPrint),
  Leaflet.TimeDimension, elevation profiles (d3)
* Near misses: grouped layers control (leaflet-groupedlayercontrol,
  leaflet-panel-layers), measuring (leaflet-measure), geometry utilities
  (Leaflet.GeometryUtil), GPX/KML loading (leaflet-gpx, leaflet-omnivore)

## Also implemented

Features done in this fork besides the ideas above:

* `TapDragZoomHandler`: zooming by double tapping and dragging up/down (9fc23279)
* DivOverlay option `overflow` for popups and tooltips extending beyond the map (6dae829d)
* Tooltip `direction: 'auto'` choosing the direction by the available space (5f53d46b)
* `FullscreenControl` (f5e563cb)
