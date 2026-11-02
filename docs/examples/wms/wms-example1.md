---
layout: tutorial_frame
title: WMS Example 1
---
<script type="module">
	import {MaplairMap, CRS, WMSTileLayer} from 'maplair';

	const map = new MaplairMap('map', {
		center: [-17, -67],
		zoom: 3
	});

	const wmsLayer = new WMSTileLayer('https://ows.mundialis.de/osm/service?', {
		layers: 'TOPO-OSM-WMS'
	}).addTo(map);
</script>
