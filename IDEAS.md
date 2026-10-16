Feature Ideas
=============

Widely desired features of Leaflet that Maplair does not have yet, with a plan
for each. Collected from the open issues of [Leaflet](https://github.com/Leaflet/Leaflet/issues)
by 👍 reactions and comments. Votes are given as 👍/💬.

Implemented in this order: quick wins first (4, 5, 6, 3, 12, 11), then 8, 7, 10,
and the large ones last (2, 9, 1).

## 1. Map rotation (bearing)

**Status:** implemented in a0186215. Not yet rotation-aware: `maxBounds` viscosity, `worldCopyJump` and box zoom (zooms to the bounding box of the drawn box).

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

## Near misses

* [#3575](https://github.com/Leaflet/Leaflet/issues/3575) gaps between tiles on fractional zoom levels (a bug, see 2)
* [#4259](https://github.com/Leaflet/Leaflet/issues/4259) `DivIcon` `setContent`
* [#2235](https://github.com/Leaflet/Leaflet/issues/2235) `change` event for paths
* [#4179](https://github.com/Leaflet/Leaflet/issues/4179) `title` option for paths
* [#6734](https://github.com/Leaflet/Leaflet/issues/6734) culling of off-screen tooltips
