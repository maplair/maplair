---
layout: tutorial_frame
title: Single Custom Icon Example
---
<script type="module">
	import {MaplairMap, TileLayer, Marker, Icon} from 'maplair';
	const map = new MaplairMap('map').setView([51.5, -0.09], 13);

	new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	class LeafIcon extends Icon {
		static defaultOptions = {
			shadowUrl: 'leaf-shadow.png',
			iconSize:     [38, 95],
			shadowSize:   [50, 64],
			iconAnchor:   [22, 94],
			shadowAnchor: [4, 62],
			popupAnchor:  [-3, -76]
		};
	}

	const greenIcon = new LeafIcon({iconUrl: 'leaf-green.png'});

	const mGreen = new Marker([51.5, -0.09], {icon: greenIcon}).addTo(map);
</script>
