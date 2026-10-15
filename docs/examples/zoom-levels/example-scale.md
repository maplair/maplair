---
layout: tutorial_frame
title: Zoom Scale Example
---
<script type="module">
	import {MaplairMap, TileLayer, ScaleControl} from 'maplair';

	const map = new MaplairMap('map', {
		minZoom: 1,
		maxZoom: 1,
		dragging: false
	});

	const osmAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	const osm = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: osmAttribution
	}).addTo(map);

	const scaleControl = new ScaleControl({maxWidth: 150}).addTo(map);

	setInterval(() => {
		map.setView([0, 0], 0, {duration: 1, animate: true});
		setTimeout(() => {
			map.setView([60, 0], 0, {duration: 1, animate: true});
		}, 2000);
	}, 4000);

	map.setView([0, 0], 0);
</script>
