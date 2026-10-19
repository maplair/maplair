JSDoc conventions
=================

The doc comments in `src/` are JSDoc with TypeScript types. They are the source of

* the type declarations, `pnpm run types` (`build/types.js`, into `dist/types/`), and
* the API reference, `pnpm run docs` (`build/docs.js`, into `docs/reference.html`).

TypeScript emits the declarations from the JSDoc of the exported classes, functions
and typedefs; `build/types.js` then turns the typedefs of options and the mixins
described below into interfaces and merges them into their classes.

## Types

TypeScript syntax: `string`, `number`, `boolean`, `object`, `any`, `unknown`,
`T[]`, tuples `[number, number]`, unions `string|HTMLElement`, function types
`(event: MaplairEvent) => void`, `Record<string, Layer>`, `this` for chaining.
Types of other modules are imported at the top of the module (no runtime import):

```js
/** @import {LatLng, LatLngExpression} from '../geo/LatLng.js' */
```

Common types:

| Type | Defined in |
|---|---|
| `LatLngExpression` (`LatLng`, `[lat, lng]`, `[lat, lng, alt]`, `{lat, lng, alt?}`) | `geo/LatLng.js` |
| `LatLngBoundsExpression` (`LatLngBounds`, `LatLngExpression[]`) | `geo/LatLngBounds.js` |
| `PointExpression` (`Point`, `[x, y]`, `{x, y}`) | `geometry/Point.js` |
| `BoundsExpression` (`Bounds`, `PointExpression[]`) | `geometry/Bounds.js` |
| `MaplairEvent`, `MaplairPointerEvent`, `MaplairKeyboardEvent`, `LayerEvent`, … (the event objects) | `core/Events.js` |
| `EventListener` (`(event: MaplairEvent & Record<string, any>) => void`) | `core/Events.js` |
| `ZoomOptions`, `PanOptions`, `ZoomPanOptions`, `FitBoundsOptions`, `InvalidateSizeOptions`, `LocateOptions` | `map/Map.js` |
| GeoJSON: `import('geojson').Feature`, `GeoJsonObject`, `Geometry`, … | `@types/geojson` |

## Classes

The doc comment of a class sits right above `export class`: a description in
Markdown, `@example`s (with a ```` ```js ```` fence), and the events (see below).
Links to other parts of the reference keep the anchors of the reference, e.g.
`[overlay pane](#map-overlaypane)`.

```js
/**
 * Used to put markers on the map.
 *
 * @example
 * ```js
 * new Marker([50.5, 30.5]).addTo(map);
 * ```
 *
 * @fires move {MaplairEvent} Fired when the marker is moved via `setLatLng()` or by dragging.
 * @fires dragstart {MaplairEvent} Fired when the user starts dragging the marker.
 */
export class Marker extends Layer {
	/**
	 * @param {LatLngExpression} latlng The position of the marker.
	 * @param {MarkerOptions} [options]
	 */
	constructor(latlng, options) {
```

The superclass comes from `extends`; Leafdoc's `@class`, `@inherits`, `@aka`,
`@namespace`, `@constructor`, `@section` and `@uninheritable` are gone.

## Methods and functions

```js
/**
 * Changes the marker position to the given point.
 * @group Methods for modifying the marker
 * @param {LatLngExpression} latlng
 * @returns {this}
 */
setLatLng(latlng) {
```

* Optional parameters `[name]`, with default `[name=0]`; rest parameters
  `@param {...Layer} layers`.
* `@returns {this}` for chainable methods.
* Leafdoc `@alternative` signatures: union types, or `@overload` blocks when the
  return type differs.
* `@group` names the section of the reference (Leafdoc's `@section`), e.g.
  `@group Methods for modifying map state`; without it, methods are listed under
  "Methods".
* Methods starting with `_` are private: plain comments, no JSDoc needed, they are
  left out of the declarations.
* Public methods which Leafdoc left undocumented get JSDoc with types too, with
  `@internal` if they are only meant for Maplair itself (they are left out of the
  declarations and the reference).
* Functions of utility modules (`Util`, `DomUtil`, `DomEvent`, `LineUtil`, …) are
  documented the same way, on the `export function`.
* Static methods and functions: the same, on the `static` method.

## Properties

On the assignment, usually in the constructor:

```js
/**
 * Marker dragging handler, see `Handler`.
 * @type {Handler}
 */
this.dragging = …
this._latlng = …            // private: no JSDoc
```

## Options

Options are documented by a typedef next to the class, mirroring the defaults
of the static `defaultOptions` (which stays as it is, without option comments).
It extends the options of the superclass with `@extends`, which comes after the
`@property` tags (TypeScript ignores the properties after it):

```js
/**
 * Options of `Marker`.
 * @typedef {object} MarkerOptions
 * @property {Icon} [icon=new DefaultIcon()] Icon instance to use for rendering
 * the marker. See [Icon documentation](#icon) for details.
 * @property {boolean} [keyboard=true] Whether the marker can be tabbed to with a
 * keyboard and clicked by pressing enter.
 * @property {number} [maxZoom] Without default.
 * @extends InteractiveLayerOptions
 */
```

* Name: `<ClassName>Options`; `build/types.js` adds `options: <ClassName>Options`
  to the declaration of the class.
* All options are optional (`[name]`), with the default value `[name=…]` as in
  the code (or a description in the text when it is computed, e.g. "the
  `marker` pane").
* Options which another module adds to a class (e.g. the map options of handlers
  and controls, registered with `MaplairMap.mergeOptions()`) are a typedef in
  that module with `@lends` naming the options to add them to:

```js
/**
 * Map options of `DragHandler`.
 * @typedef {object} DragHandlerMapOptions
 * @lends MaplairMapOptions
 * @property {boolean} [dragging=true] Whether the map is draggable with mouse/touch or not.
 */
```

Other option objects (of methods, e.g. `ZoomOptions`) and event objects are
typedefs the same way, with `@extends` for their base.

## Mixins

Methods which a module adds to another class with `include()` are an object of
their own, documented with `@lends <Class>.prototype` and named by a typedef:

```js
/**
 * Methods of `Layer` for binding tooltips.
 * @lends Layer.prototype
 */
const tooltipMethods = {
	/**
	 * Binds a tooltip to the layer.
	 * @group Tooltip methods
	 * @param {string|HTMLElement|Tooltip} content
	 * @param {TooltipOptions} [options]
	 * @returns {this}
	 */
	bindTooltip(content, options) {
		…
	}
};
/** @typedef {typeof tooltipMethods} LayerTooltipMethods */

Layer.include(tooltipMethods);
```

The constant is defined before its first use (above the class when the class
uses it in `register()`). `build/types.js` turns the typedef into an interface and
merges it into the class,
so that `new Marker(…).bindTooltip(…)` has the right type. Objects passed to
`include()` inline are moved into such a constant (also out of `static register()`),
without changing what the code does. Mixins of options (`include({options: …})`)
are documented as options with `@lends` instead.

## Events

Events are listed on the class with `@fires`:

```
@fires <name> {<event type>} <description>
@fires <Class>#<name> {<event type>} <description>
```

The second form documents events of another class, e.g. the map events which a
handler fires: `@fires MaplairMap#boxzoomend {BoxZoomEndEvent} Fired when …`. It
may sit on the class, a mixin or an options typedef of the module.

## Other documentables

* Constants (CRS, projections, `Browser` properties): JSDoc with description and
  `@type` on the `export const`.
* Map panes, the extension methods of layers and similar lists are Markdown
  (tables, lists) in the description of the class.
* `@example` and Markdown links work everywhere.
