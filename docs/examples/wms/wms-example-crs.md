---
layout: tutorial_frame
title: WMS CRS Example
---
<script type="module">
	import {MaplairMap, EPSG4326, WMSTileLayer} from 'maplair';

	const map = new MaplairMap('map', {
		center: [0, 0],
		zoom: 1,
		crs: EPSG4326
	});

	const wmsLayer = new WMSTileLayer('http://ows.mundialis.de/services/service?', {
		layers: 'TOPO-OSM-WMS'
	}).addTo(map);
</script>
