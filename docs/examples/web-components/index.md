---
layout: tutorial_v2
title: Maps in HTML with Web Components
---

## Maps in HTML with Web Components

Maplair's custom elements build maps from HTML, without writing JavaScript. They work in plain HTML pages, in content management systems and Markdown that allow HTML, and in every framework that renders HTML: React, Vue, Svelte, Angular and others.

{% include frame.html url="example.html" %}

### Getting started

Load Maplair's CSS and the bundle of the elements, then write the map as elements:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplair@{{ site.latest_maplair_version }}/dist/maplair.css" integrity="{{ site.latest_maplair_integrity.css }}" crossorigin="anonymous">
<script type="module" src="https://cdn.jsdelivr.net/npm/maplair@{{ site.latest_maplair_version }}/dist/maplair-elements.js"{% if site.latest_maplair_integrity.elements %} integrity="{{ site.latest_maplair_integrity.elements }}" crossorigin="anonymous"{% endif %}></script>

<maplair-map center="47.27,11.39" zoom="11">
	<maplair-tile-layer provider="osm"></maplair-tile-layer>
	<maplair-marker latlng="47.2692,11.4041">
		<maplair-popup open><b>Innsbruck</b><br>Capital of the Alps</maplair-popup>
	</maplair-marker>
</maplair-map>
```

With a bundler, import `maplair/elements` (and `maplair/styles.css`) instead.

The map is drawn into `<maplair-map>` itself. Without a height in your CSS, it's 400 pixels high. Anything inside it that isn't a Maplair element, like a paragraph saying that the map needs JavaScript, is shown until the map is ready.

### Attributes are options

Every element stands for a Maplair class, and its attributes are the [options](../../reference.html) of the class, written in kebab-case: the option `maxZoom` of `TileLayer` is the attribute `max-zoom` of `<maplair-tile-layer>`. Numbers, strings and booleans are written as usual (`no-wrap`, or `scroll-wheel-zoom="false"`), coordinates as `lat,lng`, lists of coordinates separated by spaces, and bounds as `south,west north,east`:

```html
<maplair-map bounds="47.1,11.2 47.4,11.6" max-zoom="16" scroll-wheel-zoom="false">
	<maplair-polyline latlngs="47.26,11.39 47.27,11.42 47.30,11.44" color="#c0392b" weight="5"></maplair-polyline>
	<maplair-rectangle bounds="47.2,11.3 47.25,11.35" fill-color="#2a7ab0"></maplair-rectangle>
</maplair-map>
```

Changing an attribute changes the map: setting `zoom` zooms, setting `latlng` of a marker moves it, and removing an element removes its layer. That's why the elements work with frameworks: they just render HTML.

### Popups, tooltips and icons

A `<maplair-popup>` or `<maplair-tooltip>` inside a layer element belongs to that layer, with the content of the element. `open` opens a popup and tells whether it's open; a tooltip with `permanent` is always shown. Icons are elements inside the marker:

```html
<maplair-marker latlng="47.3078,11.3797">
	<maplair-svg-icon color="#2a7ab0" glyph="⛰"></maplair-svg-icon>
	<maplair-tooltip permanent direction="right">Hafelekar</maplair-tooltip>
</maplair-marker>
```

### GeoJSON

`<maplair-geojson>` loads data from `src`, or takes it from a script inside it. The `tooltip` and `popup` attributes are templates filled with the properties of each feature:

```html
<maplair-geojson src="huts.geojson" tooltip="{name} ({ele} m)" fit-bounds></maplair-geojson>
```

A `<maplair-classification>` styles the features by a property, and a `<maplair-legend-control>` explains the colors:

```html
<maplair-geojson src="regions.geojson">
	<maplair-classification property="danger" name="Danger level">
		<maplair-class value="1" fill-color="#ccff66" legend="low"></maplair-class>
		<maplair-class value="2" fill-color="#ffff00" legend="moderate"></maplair-class>
		<maplair-class lower="3" fill-color="#ff9900" legend="considerable or higher"></maplair-class>
	</maplair-classification>
</maplair-geojson>
<maplair-legend-control></maplair-legend-control>
```

### Controls and the layers control

Controls are elements in the map, like `<maplair-scale-control>`, `<maplair-fullscreen-control>`, `<maplair-search-control>` or `<maplair-minimap-control>`. The layers control lists every layer with a `name`, those with `base` as base layers, of which only one is shown; `hidden` layers are listed but not shown:

```html
<maplair-tile-layer provider="osm" name="OpenStreetMap" base></maplair-tile-layer>
<maplair-tile-layer provider="opentopomap" name="OpenTopoMap" base></maplair-tile-layer>
<maplair-geojson src="huts.geojson" name="Huts" hidden></maplair-geojson>
<maplair-layers-control></maplair-layers-control>
```

### Events and code

Maplair's events are dispatched on the elements as DOM events starting with `maplair-`, and they bubble, so one listener on the map hears the clicks on all its layers. The Maplair event is in `detail`:

```js
const mapElement = document.querySelector('maplair-map');
mapElement.addEventListener('maplair-click', (e) => {
	console.log(e.target, e.detail.latlng);
});
```

Where HTML ends, code takes over: `mapElement.map` is the `MaplairMap`, and every layer element has its `layer` (`control` for controls). They exist once the element is ready, which `whenReady()` waits for. Options that are functions go to the `options` property:

```js
const huts = document.querySelector('maplair-geojson');
huts.options = {pointToLayer: (feature, latlng) => new CircleMarker(latlng, {radius: 6})};
const layer = await huts.whenReady();
```

### A location picker for forms

With `name` and `pick`, a map is a form field: clicking the map places a marker, which can be dragged, and the form sends its position as `lat,lng`. `required` and resetting the form work as with any input:

```html
<form>
	<maplair-map name="location" pick required center="47.27,11.39" zoom="10">
		<maplair-tile-layer provider="osm"></maplair-tile-layer>
	</maplair-map>
	<button>Send</button>
</form>
```

{% include frame.html url="example-form.html" %}

All elements and their attributes are listed in the [reference](../../reference.html#maplairelement).
