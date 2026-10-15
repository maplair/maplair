---
layout: tutorial_frame
title: Maplair Class Diagram
css: "#map {
            width: 100vw;
            height: 100%;
        }"
---
<script type="module">
	import {MaplairMap, SimpleCRS, ImageOverlay} from 'maplair';

	const bounds = [[0, 0], [1570, 1910]];

	const map = new MaplairMap('map', {
		crs: SimpleCRS,
		maxZoom: 0,
		minZoom: -4,
		maxBounds: bounds
	});

	const image = new ImageOverlay('class-diagram.png', bounds).addTo(map);

	map.fitBounds(bounds);
</script>
