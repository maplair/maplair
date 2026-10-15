---
layout: tutorial_v2
title: Maplair Quick Start Guide
---

## Maplair Quick Start Guide

This step-by-step guide will quickly get you started on Maplair basics, including setting up a Maplair map, working with markers, polylines and popups, and dealing with events.

{% include frame.html url="example.html" %}

### Preparing your page

Before writing any code for the map, you need to do the following preparation steps on your page:

 * Include Maplair CSS file in the head section of your document:

	```html
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@{{ site.latest_maplair_version}}/dist/maplair.css"/>
	```

 * Include Maplair JavaScript file **after** Maplair's CSS:

	```html
	<!-- Make sure you put this AFTER Maplair's CSS -->
	<script type="importmap">
	{
		"imports": {
			"maplair": "https://cdn.jsdelivr.net/npm/leaflet@{{ site.latest_maplair_version}}/dist/maplair.js"
		}
	}
	</script>
	```
	
	A [**`importmap`**](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) allows defining module specifiers (`import` paths) in the browser without relying on a bundler. It enables the use of named imports directly from a CDN or local files, making module resolution more flexible and readable.

 * Put a `div` element with a certain `id` where you want your map to be:

	```html
	<div id="map"></div>
	```

 * Make sure the map container has a defined height, for example by setting it in CSS:

	<pre><code class="css">#map { height: 180px; }</code></pre>

Now you're ready to initialize the map and do some stuff with it.


### Setting up the map


{% include frame.html url="example-basic.html" %}

Let's create a map of the center of London with pretty OpenStreetMap tiles. From here on, we'll be working in JS. First we'll initialize the map and set its view to our chosen geographical coordinates and a zoom level:

```javascript
<script type="module">
	import {MaplairMap, TileLayer, Marker, Circle, Polygon, Popup} from 'maplair';
	const map = new MaplairMap('map').setView([51.505, -0.09], 13);

	// ...
</script>
```

By default (as we didn't pass any options when creating the map instance), all mouse and touch interactions on the map are enabled, and it has zoom and attribution controls.

Note that the `setView` call also returns the map object --- most Maplair methods act like this when they don't return an explicit value, which allows convenient jQuery-like method chaining.

Next, we'll add a tile layer to add to our map, in this case it's a OpenStreetMap tile layer. Creating a tile layer usually involves setting the [URL template](/reference.html#tilelayer-url-template) for the tile images, the attribution text, and the maximum zoom level of the layer. OpenStreetMap tiles are fine for programming your Maplair map, but read the [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) of OpenStreetMap if you're going to use the tiles in production.

```javascript
new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

Make sure all the code is called after the `div` and `maplair.js` inclusion. That's it! You have a working Maplair map now.

It's worth noting that Maplair is provider-agnostic, meaning that it doesn't enforce a particular choice of providers for tiles. Also, Maplair doesn't even contain a single provider-specific line of code, so you're free to use other providers if you need to.

Whenever using anything based on OpenStreetMap, an *attribution* is obligatory as per the [copyright notice](https://www.openstreetmap.org/copyright). Most other tile providers (such as [Mapbox](https://docs.mapbox.com/help/how-mapbox-works/attribution/), [Stamen](http://maps.stamen.com/) or [Thunderforest](https://www.thunderforest.com/terms/)) require an attribution as well. Make sure to give credit where credit is due.


### Markers, circles, and polygons

{% include frame.html url="example-overlays.html" %}


Besides tile layers, you can easily add other things to your map, including markers, polylines, polygons, circles, and popups. Let's add a marker:

```javascript
const marker = new Marker([51.5, -0.09]).addTo(map);
```

Adding a circle is the same (except for specifying the radius in meters as a second argument), but lets you control how it looks by passing options as the last argument when creating the object:

```javascript
const circle = new Circle([51.508, -0.11], {
	color: 'red',
	fillColor: '#f03',
	fillOpacity: 0.5,
	radius: 500
}).addTo(map);
```

Adding a polygon is as easy:

```javascript
const polygon = new Polygon([
	[51.509, -0.08],
	[51.503, -0.06],
	[51.51, -0.047]
]).addTo(map);
```

### Working with popups

{% include frame.html url="example.html" %}

Popups are usually used when you want to attach some information to a particular object on a map. Maplair has a very handy shortcut for this:

```javascript
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");
```

Try clicking on our objects. The `bindPopup` method attaches a popup with the specified HTML content to your marker so the popup appears when you click on the object, and the `openPopup` method (for markers only) immediately opens the attached popup.

Note that popup content is rendered as HTML, so don't pass untrusted user input to it directly.

You can also use popups as layers (when you need something more than attaching a popup to an object):

```javascript
const popup = new Popup()
	.setLatLng([51.513, -0.09])
	.setContent("I am a standalone popup.")
	.openOn(map);
```

Here we use `openOn` instead of `addTo` because it handles automatic closing of a previously opened popup when opening a new one which is good for usability.


### Dealing with events

Every time something happens in Maplair, e.g. user clicks on a marker or map zoom changes, the corresponding object sends an event which you can subscribe to with a function. It allows you to react to user interaction:

```javascript
function onMapClick(e) {
	alert("You clicked the map at " + e.latlng);
}

map.on('click', onMapClick);
```

Each object has its own set of events --- see [documentation](/reference.html) for details. The first argument of the listener function is an event object --- it contains useful information about the event that happened. For example, map click event object (`e` in the example above) has `latlng` property which is a location at which the click occurred.

Let's improve our example by using a popup instead of an alert:

```javascript
const popup = new Popup();

function onMapClick(e) {
	popup
		.setLatLng(e.latlng)
		.setContent("You clicked the map at " + e.latlng.toString())
		.openOn(map);
}

map.on('click', onMapClick);
```

Try clicking on the map and you will see the coordinates in a popup. <a target="_blank" href="example.html">View the full example →</a>

Now you've learned Maplair basics and can start building map apps straight away! Don't forget to take a look at the detailed <a href="/reference.html">documentation</a> or <a href="../../examples.html">other examples</a>.
