---
layout: tutorial_frame
title: Fractional Zoom Example
---
<script type="module">
	import {MaplairMap, TileLayer, Control, DomUtil} from 'maplair';

	const map = new MaplairMap('map', {
		minZoom: 0,
		maxZoom: 1,
		zoomSnap: 0.25,
		dragging: false
	});

	const osmAttribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

	const osm = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: osmAttribution
	}).addTo(map);

	function zoomCycle() {
		map.setZoom(0);
		const timeouts = [];
		timeouts.push(setTimeout(() => { map.setZoom(0.25); }, 1000));
		timeouts.push(setTimeout(() => { map.setZoom(0.50); }, 2000));
		timeouts.push(setTimeout(() => { map.setZoom(0.75); }, 3000));
		timeouts.push(setTimeout(() => { map.setZoom(1.00); }, 4000));
		timeouts.push(setTimeout(() => { map.setZoom(0.75); }, 5000));
		timeouts.push(setTimeout(() => { map.setZoom(0.50); }, 6000));
		timeouts.push(setTimeout(() => { map.setZoom(0.25); }, 7000));
	}
	zoomCycle();

	const zoomingInterval = setInterval(zoomCycle, 8000);

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
