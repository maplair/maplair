---
layout: tutorial_frame
title: No Zoom Snap Example
---
<script type="module">
	import {MaplairMap, TileLayer, Control, DomUtil} from 'maplair';

	const map = new MaplairMap('map', {
		minZoom: 0,
		maxZoom: 18,
		zoomSnap: 0,
		zoomDelta: 0.25
	});

	const osmAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	const osm = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: osmAttribution
	}).addTo(map);

	class ZoomViewer extends Control {
		onAdd() {
			const container = DomUtil.create('div');
			const gauge = DomUtil.create('div');
			container.style.width = '200px';
			container.style.background = 'rgba(255,255,255,0.5)';
			container.style.textAlign = 'left';
			map.on('zoomstart zoom zoomend', (ev) => {
				gauge.innerHTML = `Zoom level: ${map.getZoom()}`;
			});
			container.appendChild(gauge);
			return container;
		}
	}

	const zoomViewerControl = (new ZoomViewer()).addTo(map);

	map.setView([0, 0], 0);
</script>
