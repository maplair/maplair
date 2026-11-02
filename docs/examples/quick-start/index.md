---
layout: tutorial_v2
title: Maplair Quick Start Guide
---

## Maplair Quick Start Guide

This step-by-step guide will quickly get you started on Maplair basics, including setting up a Maplair map, working with markers, polylines and popups, and dealing with events.

{% include frame.html url="example.html" %}

### Preparing your page

Maplair is an [ES module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), and the quickest way to start is to load it from a CDN. Save this page as an HTML file and open it in a browser:

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplair@{{ site.latest_maplair_version}}/dist/maplair.css">
	<script type="importmap">
		{"imports": {"maplair": "https://cdn.jsdelivr.net/npm/maplair@{{ site.latest_maplair_version}}/dist/maplair.js"}}
	</script>
</head>
<body>
	<div id="map" style="height: 400px"></div>
	<script type="module">
		import {MaplairMap, TileLayer} from 'maplair';
		// the map code goes here
	</script>
</body>
</html>
```

Here's what each part does:

 * The `<link>` loads Maplair's CSS.
 * The [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) tells the browser where to load `'maplair'` from when your code imports it.
 * The `div` is where the map goes. It needs a height.
 * Your code goes in the script with `type="module"`. Module scripts run after the page is parsed, so the map `div` already exists.

Once your code grows, you may want to move it to its own file, like `<script type="module" src="app.js"></script>`. Browsers don't load module files from pages opened directly from disk, so you'll then need to open the page through a local web server, for example by running `npx serve` or `python3 -m http.server` in its folder.

#### Using a bundler

If you build your app with a bundler such as [Vite](https://vite.dev/), install Maplair from npm instead:

```bash
npm install maplair@{{ site.latest_maplair_version}}
```

Then import Maplair's classes and its CSS in your code. You don't need the import map or the `<link>` then, and the bundler only includes the parts of Maplair your app uses:

```javascript
import {MaplairMap, TileLayer} from 'maplair';
import 'maplair/styles.css';
```

The rest of this guide works the same either way. If you can't use modules at all, see the [download page](/download.html) for `maplair-global.js`, a classic script that puts Maplair in the global `L` variable.

### Setting up the map


{% include frame.html url="example-basic.html" %}

Let's create a map of the center of London with pretty OpenStreetMap tiles. From here on, the code goes in the module script. First we'll initialize the map and set its view to our chosen geographical coordinates and a zoom level:

```javascript
const map = new MaplairMap('map').setView([51.505, -0.09], 13);
```

By default (as we didn't pass any options when creating the map instance), all mouse and touch interactions on the map are enabled, and it has zoom and attribution controls.

Note that the `setView` call also returns the map object --- most Maplair methods act like this when they don't return an explicit value, which allows method chaining.

Next, we'll add a tile layer to add to our map, in this case it's a OpenStreetMap tile layer. Creating a tile layer usually involves setting the [URL template](/reference.html#tilelayer-example) for the tile images, the attribution text, and the maximum zoom level of the layer. OpenStreetMap tiles are fine for programming your Maplair map, but read the [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) of OpenStreetMap if you're going to use the tiles in production.

```javascript
new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

That's it! You have a working Maplair map now.

It's worth noting that Maplair is provider-agnostic, meaning that it doesn't enforce a particular choice of providers for tiles. Also, Maplair doesn't even contain a single provider-specific line of code, so you're free to use other providers if you need to.

Whenever using anything based on OpenStreetMap, an *attribution* is obligatory as per the [copyright notice](https://www.openstreetmap.org/copyright). Most other tile providers (such as [Mapbox](https://docs.mapbox.com/help/how-mapbox-works/attribution/) or [Thunderforest](https://www.thunderforest.com/terms/)) require an attribution as well. Make sure to give credit where credit is due.


### Markers, circles, and polygons

{% include frame.html url="example-overlays.html" %}


Besides tile layers, you can easily add other things to your map, including markers, polylines, polygons, circles, and popups. Add the classes you use to the `import` line at the top of the script:

```javascript
import {MaplairMap, TileLayer, Marker, Circle, Polygon} from 'maplair';
```

Let's add a marker:

```javascript
const marker = new Marker([51.5, -0.09]).addTo(map);
```

Adding a circle is similar, except that you set its radius in meters with the `radius` option. Options also control how it looks:

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

You can also use popups as layers (when you need something more than attaching a popup to an object). This one needs `Popup` in the imports:

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
