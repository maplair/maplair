import {expect, vi} from 'vite-plus/test';
import {CircleMarker, DivIcon, LatLng, MaplairMap, Marker, MarkerClusterGroup, Polyline} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('MarkerClusterGroup', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false, maxZoom: 18});
		// about 728 pixels per degree of longitude at zoom 10
		map.setView([0, 0], 10);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function isCluster(layer) {
		return !!layer.getElement?.()?.classList.contains('maplair-cluster');
	}

	function clusterMarkers(group) {
		return [...group._shown].filter(isCluster);
	}

	// the layers of the group on the map, cluster markers as their counts
	function shown(group) {
		return Array.from(group._shown, layer => (isCluster(layer) ? Number(layer.getElement().textContent) : layer));
	}

	it('clusters nearby markers and shows the others', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0.01]), c = new Marker([0, 0.02]), far = new Marker([0, 0.2]);
		const group = new MarkerClusterGroup([a, b, c, far]).addTo(map);

		expect(shown(group)).to.have.members([3, far]);
		expect(map.hasLayer(a)).to.be.false;
		expect(map.hasLayer(far)).to.be.true;
		const [cluster] = clusterMarkers(group);
		expect(cluster.getLatLng()).to.be.nearLatLng([0, 0.01]);
		expect(cluster.getElement().title).to.equal('3 markers');
		expect(cluster.getElement().classList.contains('maplair-cluster-small')).to.be.true;
	});

	it('splits the clusters when zooming in and merges them when zooming out', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0.05]);
		const group = new MarkerClusterGroup([a, b]).addTo(map);
		expect(shown(group)).to.have.members([2]);

		map.setZoom(12);
		expect(shown(group)).to.have.members([a, b]);

		map.setZoom(8);
		expect(shown(group)).to.have.members([2]);
	});

	it('uses maxClusterRadius', () => {
		// 0.05 degrees are about 36 pixels
		const group = new MarkerClusterGroup([new Marker([0, 0]), new Marker([0, 0.05])], {maxClusterRadius: 20}).addTo(map);
		expect(clusterMarkers(group)).to.have.length(0);
	});

	it('shows the markers without clustering from disableClusteringAtZoom', () => {
		const group = new MarkerClusterGroup([new Marker([0, 0]), new Marker([0, 0.01])], {disableClusteringAtZoom: 11}).addTo(map);
		expect(clusterMarkers(group)).to.have.length(1);
		map.setZoom(11);
		expect(clusterMarkers(group)).to.have.length(0);
		expect(group._shown.size).to.equal(2);
	});

	it('updates the clusters when adding and removing layers', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0.01]), c = new Marker([0, 0.02]);
		const group = new MarkerClusterGroup([a]).addTo(map);
		const layeradd = vi.fn(), layerremove = vi.fn();
		group.on({layeradd, layerremove});

		group.addLayers([b, c]);
		expect(shown(group)).to.have.members([3]);
		expect(layeradd).toHaveBeenCalledTimes(2);

		group.removeLayer(b).removeLayer(c);
		expect(shown(group)).to.have.members([a]);
		expect(map.hasLayer(a)).to.be.true;
		expect(layerremove).toHaveBeenCalledTimes(2);
		expect(group.getLayers()).to.eql([a]);

		group.clearLayers();
		expect(group._shown.size).to.equal(0);
		expect(map.hasLayer(a)).to.be.false;
		expect(group.getLayers()).to.eql([]);
	});

	it('removes its layers from the map when removed', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0.01]), c = new Marker([0, 1]);
		const group = new MarkerClusterGroup([a, b, c]).addTo(map);
		map.removeLayer(group);
		expect(map.hasLayer(c)).to.be.false;
		expect(container.querySelectorAll('.maplair-cluster')).to.have.length(0);
	});

	it('shows only the clusters near the view', () => {
		// 10 degrees are about 7000 pixels away
		const near = new Marker([0, 0]), far = new Marker([0, 10]);
		const group = new MarkerClusterGroup([near, far]).addTo(map);
		expect(shown(group)).to.have.members([near]);

		map.setView([0, 10], 10);
		expect(shown(group)).to.have.members([far]);
	});

	it('keeps the cluster markers when panning', () => {
		const group = new MarkerClusterGroup([new Marker([0, 0]), new Marker([0, 0.01])]).addTo(map);
		const element = clusterMarkers(group)[0].getElement();
		map.panBy([50, 50], {animate: false});
		expect(clusterMarkers(group)[0].getElement()).to.equal(element);
		map.setZoom(9);
		expect(clusterMarkers(group)[0].getElement()).not.to.equal(element);
	});

	it('refreshes the clusters for moved markers', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0.01]);
		const group = new MarkerClusterGroup([a, b]).addTo(map);
		b.setLatLng([0, 0.2]);
		expect(clusterMarkers(group)).to.have.length(1);
		group.refreshClusters();
		expect(shown(group)).to.have.members([a, b]);
	});

	it('clusters circle markers and shows other layers without clustering', () => {
		const a = new CircleMarker([0, 0]), b = new CircleMarker([0, 0.01]), line = new Polyline([[0, 0], [0, 0.01]]);
		const group = new MarkerClusterGroup([a, b, line]).addTo(map);
		expect(shown(group)).to.have.members([2, line]);
	});

	it('zooms to the bounds of a clicked cluster and fires clusterclick', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0.02]);
		const group = new MarkerClusterGroup([a, b]).addTo(map);
		const clusterclick = vi.fn();
		group.on('clusterclick', clusterclick);

		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());
		expect(clusterclick).toHaveBeenCalledOnce();
		const {cluster} = clusterclick.mock.calls[0][0];
		expect(cluster.count).to.equal(2);
		expect(cluster.markers).to.have.members([a, b]);
		expect(cluster.bounds.getSouthWest()).to.be.nearLatLng([0, 0]);
		expect(map.getZoom()).to.be.greaterThan(10);
		expect(shown(group)).to.have.members([a, b]);
	});

	it('zooms to a cluster on Enter', () => {
		const group = new MarkerClusterGroup([new Marker([0, 0]), new Marker([0, 0.02])]).addTo(map);
		const element = clusterMarkers(group)[0].getElement();
		UIEventSimulator.fire('keydown', element, {key: 'Enter'});
		expect(map.getZoom()).to.be.greaterThan(10);
	});

	it('does not zoom without zoomToBoundsOnClick', () => {
		const group = new MarkerClusterGroup([new Marker([0, 0]), new Marker([0, 0.02])], {zoomToBoundsOnClick: false}).addTo(map);
		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());
		expect(map.getZoom()).to.equal(10);
	});

	it('spiderfies markers at the same position and moves them back', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0]), c = new Marker([0, 0]);
		const group = new MarkerClusterGroup([a, b, c]).addTo(map);

		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());
		expect(map.getZoom()).to.equal(10);
		for (const marker of [a, b, c]) {
			expect(map.hasLayer(marker)).to.be.true;
			const distance = map.latLngToLayerPoint(marker.getLatLng()).distanceTo(map.latLngToLayerPoint([0, 0]));
			expect(distance).to.be.closeTo(30, 1);
		}
		expect(container.querySelectorAll('.maplair-cluster-leg')).to.have.length(3);
		expect(container.querySelectorAll('.maplair-cluster')).to.have.length(0);

		map.fire('click');
		for (const marker of [a, b, c]) {
			expect(map.hasLayer(marker)).to.be.false;
			expect(marker.getLatLng()).to.eql(new LatLng(0, 0));
		}
		expect(container.querySelectorAll('.maplair-cluster-leg')).to.have.length(0);
		expect(container.querySelectorAll('.maplair-cluster')).to.have.length(1);
	});

	it('keeps the markers spiderfied when panning, e.g. for the auto-pan of a popup', () => {
		const a = new Marker([0, 0]).bindPopup('A'), b = new Marker([0, 0]);
		const group = new MarkerClusterGroup([a, b]).addTo(map);
		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());
		const spread = a.getLatLng();

		map.panBy([100, 0], {animate: false});
		a.openPopup();
		map.panBy([0, 100], {animate: false});
		expect(map.hasLayer(a)).to.be.true;
		expect(a.getLatLng()).to.equal(spread);
		expect(a.isPopupOpen()).to.be.true;
		expect(container.querySelectorAll('.maplair-cluster')).to.have.length(0);

		map.setZoom(9);
		expect(a.getLatLng()).to.eql(new LatLng(0, 0));
		expect(container.querySelectorAll('.maplair-cluster')).to.have.length(1);
	});

	it('spiderfies at the maximum zoom', () => {
		map.setZoom(18);
		const a = new Marker([0, 0]), b = new Marker([0, 0.00001]);
		const group = new MarkerClusterGroup([a, b]).addTo(map);
		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());
		expect(map.getZoom()).to.equal(18);
		expect(map.hasLayer(a)).to.be.true;
		expect(map.hasLayer(b)).to.be.true;
		map.setZoom(17);
		expect(a.getLatLng()).to.eql(new LatLng(0, 0));
		expect(b.getLatLng()).to.eql(new LatLng(0, 0.00001));
	});

	it('does not spiderfy without spiderfyOnMaxZoom', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0]);
		const group = new MarkerClusterGroup([a, b], {spiderfyOnMaxZoom: false}).addTo(map);
		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());
		expect(map.hasLayer(a)).to.be.false;
	});

	it('moves spiderfied markers back when removed', () => {
		const a = new Marker([0, 0]), b = new Marker([0, 0]);
		const group = new MarkerClusterGroup([a, b]).addTo(map);
		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());
		group.removeLayer(a);
		expect(a.getLatLng()).to.eql(new LatLng(0, 0));
		expect(map.hasLayer(a)).to.be.false;
		expect(shown(group)).to.have.members([b]);
		expect(b.getLatLng()).to.eql(new LatLng(0, 0));
	});

	it('reclusters after dragging a marker, also a spiderfied one', () => {
		const a = new Marker([0, 0], {draggable: true}), b = new Marker([0, 0]);
		const group = new MarkerClusterGroup([a, b]).addTo(map);
		UIEventSimulator.fire('click', clusterMarkers(group)[0].getElement());

		a.setLatLng([0, 0.5]);
		a.fire('dragend', {distance: 100});
		expect(a.getLatLng()).to.eql(new LatLng(0, 0.5));
		expect(shown(group)).to.have.members([a, b]);
		expect(b.getLatLng()).to.eql(new LatLng(0, 0));
	});

	it('uses iconCreateFunction', () => {
		const iconCreateFunction = vi.fn(cluster => new DivIcon({html: `${cluster.count}!`, className: 'my-cluster'}));
		new MarkerClusterGroup([new Marker([0, 0]), new Marker([0, 0.01])], {iconCreateFunction}).addTo(map);
		expect(iconCreateFunction).toHaveBeenCalledOnce();
		expect(container.querySelector('.my-cluster').textContent).to.equal('2!');
	});

	it('uses the medium and large classes for more markers', () => {
		const markers = Array.from({length: 100}, (_, i) => new Marker([0, i / 10000]));
		const group = new MarkerClusterGroup(markers.slice(0, 10)).addTo(map);
		expect(clusterMarkers(group)[0].getElement().classList.contains('maplair-cluster-medium')).to.be.true;
		group.addLayers(markers.slice(10));
		expect(clusterMarkers(group)[0].getElement().classList.contains('maplair-cluster-large')).to.be.true;
	});

	it('propagates the events of its markers', () => {
		const a = new Marker([0, 0]);
		const group = new MarkerClusterGroup([a, new Marker([0, 1])]).addTo(map);
		const click = vi.fn();
		group.on('click', click);
		UIEventSimulator.fire('click', a.getElement());
		expect(click).toHaveBeenCalledOnce();
		expect(click.mock.calls[0][0].propagatedFrom).to.equal(a);
	});

	it('returns the bounds of its markers', () => {
		const group = new MarkerClusterGroup([new Marker([0, 0]), new Marker([1, 2])]);
		expect(group.getBounds().getNorthEast()).to.be.nearLatLng([1, 2]);
	});
});
