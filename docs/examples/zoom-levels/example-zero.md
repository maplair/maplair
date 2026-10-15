---
layout: tutorial_frame
title: Zoom Level Zero Example
---
<script type="module">
	import {MaplairMap, TileLayer} from 'maplair';

	const map = new MaplairMap('map', {
		minZoom: 0,
		maxZoom: 0
	});

	const osmAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	const osm = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: osmAttribution
	}).addTo(map);

	map.setView([0, 0], 0);
</script>
