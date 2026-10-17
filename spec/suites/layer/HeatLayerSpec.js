import {expect} from 'vite-plus/test';
import {HeatLayer, LatLng, MaplairMap} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('HeatLayer', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false, maxZoom: 10});
		map.setView([0, 0], 10);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function nextFrame() {
		return new Promise((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(resolve));
		});
	}

	// The RGBA color of the heatmap at the container point `point`
	function colorAt(heat, point) {
		const layerPoint = map.containerPointToLayerPoint(point).subtract(heat._bounds.min).round();
		return [...heat._ctx.getImageData(layerPoint.x, layerPoint.y, 1, 1).data];
	}

	// The last color of the gradient, sampled from a gradient of 256 pixels
	function expectRed(color) {
		expect(color[0]).to.equal(255);
		expect(color[1]).to.be.below(10);
		expect(color[2]).to.equal(0);
		expect(color[3]).to.equal(255);
	}

	it('draws the points in a canvas covering the view', () => {
		const heat = new HeatLayer([[0, 0]]).addTo(map),
		canvas = heat._container;
		expect(canvas.tagName).to.equal('CANVAS');
		expect(canvas.parentNode).to.equal(map.getPane('overlayPane'));
		expect(canvas.width).to.equal(Math.round(400 * 1.2));

		// red at full intensity, transparent far away
		expectRed(colorAt(heat, [200, 200]));
		expect(colorAt(heat, [50, 50])[3]).to.equal(0);
		// fading out with the gradient
		const edge = colorAt(heat, [200 + 30, 200]);
		expect(edge[3]).to.be.within(1, 254);
		expect(edge.slice(0, 3)).not.to.eql([255, 0, 0]);
	});

	it('scales by the intensity', () => {
		const heat = new HeatLayer([[0, 0, 0.5], new LatLng(0.01, 0, 0.1)], {max: 1}).addTo(map),
		strong = colorAt(heat, [200, 200]),
		weak = colorAt(heat, map.latLngToContainerPoint([0.01, 0]));
		expect(strong[3]).to.be.greaterThan(weak[3]);
	});

	it('adds up nearby points', () => {
		const single = new HeatLayer([[0, 0, 0.2]]).addTo(map),
		alphaSingle = colorAt(single, [200, 200])[3];
		single.remove();
		const many = new HeatLayer(Array(5).fill([0, 0, 0.2])).addTo(map);
		expect(colorAt(many, [200, 200])[3]).to.be.greaterThan(alphaSingle);
	});

	it('weakens the points below maxZoom', async () => {
		map.setZoom(9);
		const heat = new HeatLayer([[0, 0, 1]], {minOpacity: 0}).addTo(map);
		expect(colorAt(heat, [200, 200])[3]).to.be.closeTo(128, 3);
		heat.setOptions({maxZoom: 9});
		await nextFrame();
		expect(colorAt(heat, [200, 200])[3]).to.equal(255);
	});

	it('uses the gradient', async () => {
		const heat = new HeatLayer([[0, 0]], {gradient: {0: 'black', 1: 'rgb(0, 128, 0)'}}).addTo(map);
		expect(colorAt(heat, [200, 200])[1]).to.be.closeTo(128, 2);
		heat.setOptions({gradient: {0: 'black', 1: 'rgb(0, 0, 255)'}});
		await nextFrame();
		expect(colorAt(heat, [200, 200])[2]).to.be.closeTo(255, 2);
	});

	it('follows the map', () => {
		const heat = new HeatLayer([[0, 0]]).addTo(map);
		map.panBy([60, 0], {animate: false});
		const point = map.latLngToContainerPoint([0, 0]);
		expect(point.x).to.equal(140);
		expectRed(colorAt(heat, point));
	});

	it('changes the points', async () => {
		const heat = new HeatLayer([]).addTo(map);
		expect(colorAt(heat, [200, 200])[3]).to.equal(0);
		heat.addLatLng([0, 0]);
		await nextFrame();
		expect(colorAt(heat, [200, 200])[3]).to.equal(255);
		heat.setLatLngs([]);
		await nextFrame();
		expect(colorAt(heat, [200, 200])[3]).to.equal(0);
		expect(heat.getLatLngs()).to.eql([]);
	});

	it('changes the radius', async () => {
		const heat = new HeatLayer([[0, 0]], {radius: 5, blur: 5}).addTo(map);
		expect(colorAt(heat, [200 + 20, 200])[3]).to.equal(0);
		heat.setOptions({radius: 30});
		await nextFrame();
		expect(colorAt(heat, [200 + 20, 200])[3]).to.be.greaterThan(0);
	});
});
