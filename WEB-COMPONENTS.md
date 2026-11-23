Maplair as Web Components (draft)
=================================

Maps written in HTML, without JavaScript:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/maplair/dist/elements.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplair/dist/maplair.css">

<maplair-map center="47.26,11.39" zoom="10" style="height: 400px">
	<maplair-tile-layer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"></maplair-tile-layer>

	<maplair-marker latlng="47.26,11.39">
		<maplair-popup open>Innsbruck</maplair-popup>
	</maplair-marker>

	<maplair-geojson src="huts.geojson" tooltip="{name}"></maplair-geojson>

	<maplair-scale-control></maplair-scale-control>
	<maplair-layers-control></maplair-layers-control>
</maplair-map>
```

The goal is to cover about 80% of what maps on the web do (a basemap, markers, shapes, GeoJSON, popups,
tooltips and the usual controls) declaratively, and to keep the remaining 20% one property away: every element
exposes its Maplair instance, so code can take over where HTML ends.

## Why

- **CMS and no-code users**: WordPress, Drupal, static site generators, Markdown with HTML. Leaflet's easiest
  audience copies a snippet; a snippet of HTML elements is easier still, and safe to paste where scripts are not
  allowed.
- **Every framework at once**: React 19, Vue, Svelte, Angular, Solid, Lit and plain HTML use custom elements
  natively. One set of elements instead of react-leaflet, vue-leaflet and friends, released with Maplair itself.
- **Reactive by nature**: frameworks bind attributes and properties; changing `zoom`, `latlng` or `url` updates the
  map, removing an element removes its layer.
- **Positioning**: no other web map library offers a complete set of web components. It's the "Leaflet's
  simplicity" pitch taken one step further (see IDEAS.md, round 6).

## Design principles

1. **Thin layer over the classes.** An element creates its Maplair instance, adds it to the map or group of its
   nearest ancestor, and maps attributes to options and setters. No second API to learn: the attributes are the
   options of the reference, in kebab-case.
2. **Generic, not hand-written per class.** Maplair classes declare `static defaultOptions`; the type of each
   default tells how to parse the attribute (number, boolean, string, JSON). One base class covers most elements in
   a few lines each, which is how 80% coverage stays small (see "Implementation").
3. **Light DOM.** The map renders into the `<maplair-map>` element itself, styled by `maplair.css` like any map
   container, so the page's CSS, the dark mode (`color-scheme`) and CSS custom properties keep working. Child
   elements are configuration only and not rendered, like `<source>` in `<video>`.
4. **Opt-in and tree-shakeable.** A separate entry `maplair/elements` registers all elements; `maplair/elements/*`
   registers single ones. The core library doesn't grow.
5. **Escape hatch everywhere.** `element.map`, `element.layer`, `element.control` return the instances, and
   `whenReady()` resolves once they exist.

## Syntax conventions

| Value | Attribute syntax | Example |
|---|---|---|
| LatLng | `lat,lng` | `latlng="47.26,11.39"` |
| LatLngs | space-separated pairs; rings separated by `|` | `latlngs="47,11 48,12 47,13"` |
| Bounds | `south,west north,east` | `bounds="46.4,9.5 47.8,13.0"` |
| Point (pixels) | `x,y` | `icon-anchor="12,41"` |
| Boolean | presence, or `="false"` | `no-wrap`, `zoom-control="false"` |
| Number | as is | `max-zoom="18"` |
| Option objects | JSON | `fetch-options='{"headers": {...}}'` |
| CRS | name of a built-in CRS | `crs="EPSG4326"` |
| Path style | attributes, or CSS custom properties | `color="#c00" weight="2"` |

Attribute names are the option names in kebab-case (`maxZoom` → `max-zoom`); the same options also work as
properties (`el.maxZoom = 18`), which frameworks prefer for non-string values.

## Elements

### Map

`<maplair-map>`: center, zoom, bounds (instead of center and zoom), min-/max-zoom, max-bounds, crs, bearing (with
`maplair/map-rotation`), zoom-snap, and all interaction options (`dragging`, `scroll-wheel-zoom`, `keyboard`, …).

- `hash` attribute: keep the view in the URL hash (`Hash`); `hash="query"` for query parameters.
- `sync-with="#other-map"`: synchronize the view with another map (`MapSync`).
- Reflects the view back: after a move, `center` and `zoom` properties are updated (attributes only on request,
  `reflect-view`), so `<maplair-map>` can be bound two-way in frameworks.
- Fallback content: anything inside not being a Maplair element, e.g. a static image or a link, is shown until the
  element is defined (`maplair-map:not(:defined)`) and for browsers without JavaScript.

### Layers

| Element | Class | Notes |
|---|---|---|
| `<maplair-tile-layer>` | `TileLayer` | `url`, `provider="osm"` presets, attribution, `placeholder`, `fetch-options` |
| `<maplair-wms-layer>` | `WMSTileLayer` | WMS params as attributes (`layers`, `styles`, `format`, `time`) |
| `<maplair-marker>` | `Marker` | `latlng`, `draggable`, `title`, `alt`, `rotation-angle`; icon from a child |
| `<maplair-icon>`, `<maplair-div-icon>`, `<maplair-svg-icon>` | icons | child of a marker; div icon content from the element's HTML |
| `<maplair-circle-marker>`, `<maplair-circle>` | | `latlng`, `radius` |
| `<maplair-polyline>`, `<maplair-polygon>`, `<maplair-rectangle>` | | `latlngs`, `bounds`; decorations with `maplair/path-decorations` |
| `<maplair-geojson>` | `GeoJSON` | `src` (with `maplair/geojson-loading`) or inline `<script type="application/geo+json">` |
| `<maplair-image-overlay>`, `<maplair-video-overlay>`, `<maplair-svg-overlay>` | | `url`/`bounds`; SVG overlay from an inline `<svg>` child |
| `<maplair-heat-layer>` | `HeatLayer` | points from `latlngs` or GeoJSON `src` |
| `<maplair-layer-group>`, `<maplair-feature-group>` | | children are its members |
| `<maplair-marker-cluster>` | `MarkerClusterGroup` | children are its markers |

Common to all layers: `name` (the label in the layers control), `base` (a base layer instead of an overlay),
`hidden` (not added to the map, but listed in the layers control), `pane`, `attribution`, `interactive`, `z-index`,
`opacity`.

### Popups and tooltips

`<maplair-popup>` and `<maplair-tooltip>` as children of a layer bind to it; as children of the map they stand
alone with `latlng`. Their content is the element's own HTML, moved into the popup when it opens, so it can contain
links, images and other elements (and even another map). `open` opens them; `permanent`, `direction`, `offset`,
`max-width` etc. map to the options.

For GeoJSON, `popup` and `tooltip` attributes take a template of feature properties: `tooltip="{name} ({ele} m)"`,
escaped as text; a `<template>` child allows HTML templates.

### Styling and classification

- Path styles from attributes (`color`, `weight`, `fill-color`, `dash-array`, …), or from CSS custom properties on
  the element (`--maplair-path-color`), so styles can come from the page's CSS and media queries such as
  `prefers-color-scheme`.
- Zoom-dependent styles (with `maplair/zoom-styles`): `<maplair-zoom-style min-zoom="12" weight="4">` children.
- `Classification` declaratively, styling GeoJSON by a property, with the legend for free:

  ```html
  <maplair-geojson src="districts.geojson">
  	<maplair-classification property="danger" legend-control>
  		<maplair-class value="1" fill-color="#ccff66" legend="low"></maplair-class>
  		<maplair-class value="2" fill-color="#ffff00" legend="moderate"></maplair-class>
  		<maplair-class lower="3" fill-color="#ff9900" legend="considerable or higher"></maplair-class>
  	</maplair-classification>
  </maplair-geojson>
  ```

### Controls

One element per control, children of the map; `position` maps to the option.

| Element | Notes |
|---|---|
| `<maplair-zoom-control>`, `<maplair-scale-control>`, `<maplair-attribution-control>` | the defaults of the map can be turned off with `zoom-control="false"` etc. on the map |
| `<maplair-layers-control>` | lists the layers with a `name`, no configuration needed; `collapsed` |
| `<maplair-fullscreen-control>`, `<maplair-rotate-control>`, `<maplair-minimap-control>` | the minimap's layer as a child layer element |
| `<maplair-search-control>` | `provider="nominatim"` (with `accept-usage-policy`), or `layers="#huts"` to search a GeoJSON layer by `property` |
| `<maplair-legend-control>` | the legends of classifications on the map |
| `<maplair-time-control>` | `times` or `interval`, `period`, `loop`; time-aware children (WMS `time`) |
| `<maplair-side-by-side-control>` | `left` and `right` take selectors of layer elements |
| `<maplair-text-control>` | its HTML content |
| `<maplair-button-control>` | a `<button>` child; clicking it is handled by the page as any button |
| `<maplair-context-menu>` | `<button>` children as the menu items |

### Events

Maplair events are dispatched on the elements as DOM events prefixed with `maplair-` (`maplair-click`,
`maplair-moveend`, `maplair-popupopen`), bubbling, with the Maplair event as `detail`. Bubbling means one listener
on `<maplair-map>` sees the events of all its layers, and frameworks bind them like any event
(`@maplair-click`, `onMaplair-click`). Native DOM events (`click`, `keydown`) still work as they do now.

`maplair-ready` fires when the instance of an element is created and added.

### Forms

`<maplair-map name="location" pick>` as a form-associated custom element (`ElementInternals`): a click or a dragged
marker sets the form value to `lat,lng`, `required` works with constraint validation, and the form's reset
restores the initial position. A location picker in plain HTML, accessible with the keyboard by the existing marker
keyboard support. Possibly also `pick="bounds"` (box) and `pick="polygon"` later, with drawing tools (IDEAS.md).

## What stays in JavaScript (the other 20%)

- Function options: `pointToLayer`, `style` and `filter` functions of GeoJSON, `onEachFeature`, `formatTime`,
  custom search providers. Set them as properties (`el.style = feature => ({...})`), which frameworks do anyway; the
  property templates and classification cover the common cases declaratively.
- Custom CRSs (`ProjectedCRS` with a proj4 projection): registered once in JS (`registerCRS('EPSG:2056', MyCRS)`),
  then used by name in `crs`.
- Subclassing layers and controls, custom renderers, handlers.
- Plugins: they work on `el.layer` and `el.map`; a plugin can ship its own element with the base class.

## Implementation

A base class `MaplairElement` (about 150 lines) does the work for all elements:

```js
class MaplairElement extends HTMLElement {
	static Class; // e.g. Marker
	static get observedAttributes() { return Object.keys(this.Class.defaultOptions).map(kebabCase).concat(this.args); }

	connectedCallback() {
		// created on connect, so attributes and children are parsed; added to the closest
		// <maplair-map> or group element, which may itself not be ready yet (await parent.whenReady())
	}
	disconnectedCallback() { /* removed from the map; kept for a re-connect (moveBefore) */ }
	attributeChangedCallback(name, old, value) {
		// a setter if there is one (setLatLng, setStyle, setUrl, setOpacity, setZIndex, setRadius, setBounds,
		// setContent, setView), otherwise the instance is recreated
	}
}

define('maplair-marker', class extends MaplairElement {
	static Class = Marker;
	static args = ['latlng'];
});
```

- **Parsing** by the type of the default option, plus a small table for the types defaults don't tell (LatLng,
  bounds, points, CRS names, functions).
- **Setters** from a table per attribute; everything else recreates the instance, which is correct, if slower.
- **Order**: children are added in document order, which defines the drawing order and the order in the layers
  control; `moveBefore()` (used already in `DomUtil`) keeps popups open when elements are reordered.
- **Upgrades**: elements may be defined after they are parsed, and children before parents; every element awaits
  its parent's `whenReady()`.
- **Types and docs**: the attribute lists are generated from `defaultOptions` and the JSDoc of the options into a
  Custom Elements Manifest (`custom-elements.json`) and `HTMLElementTagNameMap` types, for autocompletion in
  editors and JSX, and for an "Elements" section of the reference.
- **Size**: about 3 kB gzipped for the base class and the parsers, plus a few hundred bytes per element;
  importing single elements keeps the rest out.
- **Tests**: a spec per element in the existing vitest browser setup, plus a generic spec that every option of every
  class round-trips through its attribute.

## Phases

1. Base class, `<maplair-map>`, tile and WMS layers, markers with icons, vectors, popups, tooltips, layer groups,
   zoom/scale/attribution/layers controls, events. That's the 80% of Leaflet's quick start and tutorials:
   rewrite the quick start example in HTML to prove it.
2. GeoJSON with `src` and templates, classification and legend, marker clusters, heat layer, overlays, search,
   fullscreen, minimap, hash and map sync.
3. Time control, side-by-side, context menu, button and text controls, rotation, forms (location picker),
   Custom Elements Manifest and types.
4. Docs: an "HTML" tab on every example, a playground (IDEAS.md), a WordPress/Markdown guide.

## Open questions

- Element prefix: `maplair-` (clear, long) or a shorter `ml-` (risk of clashes)?
- Should `<maplair-map>` reflect the view into its attributes by default? Convenient for debugging and for
  serializing the page, but it causes attribute mutations on every move.
- Inline coordinates in `lat,lng` order (as the API) or `lng,lat` (as GeoJSON)? `lat,lng` matches Maplair's API
  and Leaflet habits.
- Shadow DOM for controls only? It would isolate the controls' CSS, but break theming with page CSS and the dark
  mode custom properties; light DOM seems the better trade-off.
- Server-side rendering: emit the fallback (a static map image) from the same attributes?
