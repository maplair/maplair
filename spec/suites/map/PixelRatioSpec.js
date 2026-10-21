import {expect, vi} from 'vite-plus/test';
import {Canvas, MaplairMap, Polygon, TileLayer, WMSTileLayer} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Map: devicePixelRatio changes', () => {
	let container, map, pixelRatio;
	const tileUrl = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=#{z}/{x}/{y}{r}';

	beforeEach(() => {
		pixelRatio = 1;
		vi.spyOn(window, 'devicePixelRatio', 'get').mockImplementation(() => pixelRatio);
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView([0, 0], 3);
	});

	afterEach(() => {
		removeMapContainer(map, container);
		vi.restoreAllMocks();
	});

	// Simulates moving the window to a screen with the given ratio
	function changePixelRatio(ratio) {
		pixelRatio = ratio;
		map._pixelRatioQuery.dispatchEvent(new Event('change'));
	}

	function tileUrls(layer) {
		return Object.values(layer._tiles).map(t => t.el.src.split('#')[1]);
	}

	it('fires pixelratiochange and watches the new ratio', () => {
		const spy = vi.fn();
		map.on('pixelratiochange', spy);
		expect(map._pixelRatioQuery.media).to.contain('1dppx');

		changePixelRatio(2);
		expect(spy).toHaveBeenCalledOnce();
		expect(map._pixelRatioQuery.media).to.contain('2dppx');

		changePixelRatio(1);
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('stops watching when the map is removed', () => {
		const query = map._pixelRatioQuery,
		spy = vi.fn();
		map.on('pixelratiochange', spy);
		map.remove();
		query.dispatchEvent(new Event('change'));
		expect(spy).not.toHaveBeenCalled();
		map = null;
	});

	it('switches a tile layer with detectRetina to retina tiles and back', () => {
		const layer = new TileLayer(tileUrl, {detectRetina: true, maxZoom: 18}).addTo(map);
		expect(layer.getTileSize().x).to.equal(256);
		expect(map.getMaxZoom()).to.equal(18);
		expect(tileUrls(layer)).to.include('3/3/3');

		changePixelRatio(2);
		expect(layer.getTileSize().x).to.equal(128);
		expect(layer.options.zoomOffset).to.equal(1);
		expect(map.getMaxZoom()).to.equal(17);
		const urls = tileUrls(layer);
		expect(urls.length).to.be.greaterThan(0);
		expect(urls.every(url => url.startsWith('4/') && url.endsWith('@2x'))).to.be.true;

		changePixelRatio(1);
		expect(layer.getTileSize().x).to.equal(256);
		expect(layer.options.zoomOffset).to.equal(0);
		expect(map.getMaxZoom()).to.equal(18);
		expect(tileUrls(layer).every(url => url.startsWith('3/') && !url.endsWith('@2x'))).to.be.true;
	});

	it('loads {r} tiles of a tile layer without detectRetina', () => {
		const layer = new TileLayer(tileUrl).addTo(map);
		changePixelRatio(2);
		const urls = tileUrls(layer);
		expect(urls.every(url => url.startsWith('3/') && url.endsWith('@2x'))).to.be.true;
		expect(layer.getTileSize().x).to.equal(256);
	});

	it('does not request retina tiles beyond maxNativeZoom', () => {
		pixelRatio = 2;
		const layer = new TileLayer(tileUrl, {detectRetina: true, maxNativeZoom: 3, maxZoom: 18}).addTo(map);
		map.setZoom(10);
		const urls = tileUrls(layer);
		expect(urls.length).to.be.greaterThan(0);
		expect(urls.every(url => url.startsWith('3/'))).to.be.true;
	});

	it('updates the image size of a WMS layer with detectRetina', () => {
		const layer = new WMSTileLayer('https://example.com/wms', {detectRetina: true}).addTo(map);
		expect(layer.wmsParams.width).to.equal(256);

		changePixelRatio(2);
		expect(layer.wmsParams.width).to.equal(256);
		expect(layer.getTileSize().x).to.equal(128);

		changePixelRatio(1);
		expect(layer.wmsParams.width).to.equal(256);
		expect(layer.getTileSize().x).to.equal(256);
	});

	it('resizes the canvas of a canvas renderer', () => {
		const renderer = new Canvas();
		new Polygon([[-10, -10], [10, 10], [-10, 10]], {renderer}).addTo(map);
		const canvas = renderer._container,
		width = canvas.width;

		const update = vi.fn();
		renderer.on('update', update);
		changePixelRatio(2);
		expect(canvas.width).to.equal(width * 2);
		expect(update).toHaveBeenCalled();
	});
});
