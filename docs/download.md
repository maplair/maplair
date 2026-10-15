---
layout: v2
title: Download
bodyclass: download-page
---

## Download Maplair

<table>
	<tr>
		<th>Version</th>
		<th>Description</th>
	</tr>
	<tr>
		<td><a href="https://github.com/Leaflet/Leaflet/releases/download/v1.9.4/leaflet.zip">Maplair 1.9.4</a></td>
		<td>Stable version, released on May 18, 2023.</td>
	</tr>
	<tr>
		<td><a href="https://github.com/Leaflet/Leaflet/releases/download/v2.0.0-alpha.1/leaflet.zip">Maplair 2.0.0-alpha.1</a></td>
		<td>Prerelease version, released on August 16, 2025.</td>
	</tr>
		<tr>
		<td><a href="https://github.com/Leaflet/Leaflet/releases/download/dev/leaflet.zip">Development Snapshot</a> / (<a href="https://github.com/Leaflet/Leaflet/releases/tag/dev" target="_blank">Single files</a>)</td>
		<td>In-progress version, developed on the <code>main</code> branch.</td>
	</tr>
</table>

[View Changelog](https://github.com/Leaflet/Leaflet/blob/main/CHANGELOG.md)

Note that the main version can contain incompatible changes,
so please read the changelog carefully when upgrading to it.

### Using a Hosted Version of Maplair

The latest stable Maplair release is available on several CDNs. To start using it with an [importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap), place the following in the `head` of your HTML code:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@{{ site.latest_maplair_version }}/dist/maplair.css" />

<script type="importmap">
{
	"imports": {
		"maplair": "https://cdn.jsdelivr.net/npm/leaflet@{{ site.latest_maplair_version }}/dist/maplair.js"
	}
}
</script>
```

A [**`importmap`**](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) allows defining module specifiers (`import` paths) in the browser without relying on a bundler. It enables the use of named imports directly from a CDN or local files, making module resolution more flexible and readable.


Then, in your script, import the needed Maplair Classes as follows:

```js
<script type="module">
	import {MaplairMap, TileLayer} from 'maplair';

	const map = new MaplairMap('map').setView([51.505, -0.09], 13);
	
	new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
</script>
```
#### Including Maplair with a Global Scope

The old (and no longer recommended) way to include Maplair in your project without using modules is by relying on the global variable `L`.

```html
<script src="https://unpkg.com/leaflet@{{ site.latest_maplair_version}}/dist/maplair-global.js"></script>
```

Maplair is available on the following free CDNs: [jsDelivr](https://www.jsdelivr.com/package/npm/leaflet?path=dist), [cdnjs](https://cdnjs.com/libraries/leaflet), [unpkg](https://unpkg.com/leaflet/dist/).

_Disclaimer: These services are external to Maplair; for questions or support, please contact them directly._

### Using a Downloaded Version of Maplair

Inside the archives downloaded from the above links, you will see four things:

- `maplair.js` - This is the minified Maplair JavaScript code.
- `maplair.js.map` - This is a source map file for `maplair.js`, allowing browser developer tools to map minified code back to the original source for easier debugging.
- `maplair-src.js` - This is the readable, unminified Maplair JavaScript, which is sometimes helpful for debugging.
- `maplair-src.js.map` - This is a source map file for `maplair-src.js`, providing debugging support for the unminified version of Maplair.
- `maplair.css` - This is the stylesheet for Maplair.
- `images` - This is a folder that contains images referenced by `maplair.css`. It must be in the same directory as `maplair.css`.

Unzip the downloaded archive to your website's directory and add this to the `head` of your HTML code:

```html
<link rel="stylesheet" href="/path/to/maplair.css" />
<script type="importmap">
{
  "imports": {
    "maplair": "/path/to/maplair.js"
  }
}
</script>
```

Then, import Maplair in your JavaScript file:

```js
import {MaplairMap, TileLayer} from 'maplair';

const map = new MaplairMap('map').setView([51.505, -0.09], 13);

new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

### Using a JavaScript Package Manager

If you use the [`npm` package manager](https://www.npmjs.com/), you can fetch a local copy of Maplair by running:

```sh
npm install maplair
```

Then, import Maplair in your JavaScript file:

```js
import {MaplairMap, TileLayer} from 'maplair';

const map = new MaplairMap('map').setView([51.505, -0.09], 13);

new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
```

You will find a copy of the Maplair release files in `node_modules/maplair/dist`.

### Maplair Source Code

These download packages above only contain the library itself.
If you want to download the full source code, including unit tests, files for debugging, build scripts, etc.,
you can <a href="https://github.com/Leaflet/Leaflet/releases">download it</a>
from the <a href="https://github.com/Leaflet/Leaflet">GitHub repository</a>.

### Building Maplair from the Source

Maplair's build system is powered by the [Node.js](http://nodejs.org) platform,
which installs easily and works well across all major platforms.
Here are the steps to set it up:

1. [Download and install Node](http://nodejs.org)
2. Run the following command in the command line:

```sh
npm install
```

Now that you have everything installed, run `npm run build` inside the Maplair directory.
This will combine and compress the Maplair source files, saving the build to the `dist` folder.
