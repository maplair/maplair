import {expect, vi} from 'vite-plus/test';
import {Canvas, EPSG3395, EPSG3857, EPSG4326, GridLayer, MaplairMap, Marker, Polyline, SimpleCRS, WMSTileLayer} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

const srsRe = /srs=EPSG(%3A|:)4326/i;

describe('Map: setCrs', () => {
	let container, map;
	const center = [48, 11];

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false, zoomSnap: 0});
		map.setView(center, 8);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	// meters per pixel at the center of the map
	function resolution() {
		return map._getResolution(map.getCenter());
	}

	it('changes the CRS and keeps the center and the scale', () => {
		const before = resolution();
		map.setCrs(EPSG4326);
		expect(map.options.crs).to.equal(EPSG4326);
		expect(map.getCenter()).to.be.nearLatLng(center, 1e-6);
		expect(resolution()).to.be.closeTo(before, before * 1e-6);
		// zoom 0 of EPSG:4326 has twice as many pixels for the longitudes as of EPSG:3857
		expect(map.getZoom()).to.be.closeTo(7, 1e-6);
	});

	it('snaps the zoom to zoomSnap', () => {
		map.options.zoomSnap = 1;
		map.setCrs(EPSG4326);
		expect(Number.isInteger(map.getZoom())).to.be.true;
		expect(map.getCenter()).to.be.nearLatLng(center, 1e-6);
	});

	it('fires crschange and resets the view', () => {
		const events = [];
		map.on('crschange viewreset moveend', e => events.push(e));
		map.setCrs(EPSG3395);
		expect(events.map(e => e.type)).to.eql(['crschange', 'moveend', 'viewreset']);
		expect(events[0].oldCrs).to.equal(EPSG3857);
		expect(events[0].crs).to.equal(EPSG3395);
	});

	it('does nothing for the same CRS', () => {
		const spy = vi.fn();
		map.on('crschange viewreset', spy);
		map.setCrs(EPSG3857);
		expect(spy).not.toHaveBeenCalled();
	});

	it('only sets the CRS before the view is set', () => {
		map.remove();
		map = new MaplairMap(container);
		map.setCrs(SimpleCRS);
		map.setView([0, 0], 0);
		expect(map.options.crs).to.equal(SimpleCRS);
		expect(map.latLngToLayerPoint([10, 10]).y).to.equal(map.latLngToLayerPoint([0, 0]).y - 10);
	});

	it('repositions markers and paths', () => {
		const latlng = [48.1, 11.1];
		const marker = new Marker(latlng).addTo(map);
		const polyline = new Polyline([center, latlng]).addTo(map);
		const canvasLine = new Polyline([center, latlng], {renderer: new Canvas()}).addTo(map);

		map.setCrs(EPSG4326);

		const expected = map.latLngToLayerPoint(latlng);
		const rect = marker.getElement().getBoundingClientRect(),
		containerRect = container.getBoundingClientRect(),
		point = map.latLngToContainerPoint(latlng);
		// the icon's anchor is at the bottom center
		expect(rect.left + rect.width / 2 - containerRect.left).to.be.closeTo(point.x, 1);
		expect(rect.bottom - containerRect.top).to.be.closeTo(point.y, 1);

		expect(polyline._parts[0][1].round()).to.eql(expected.round());
		expect(canvasLine._parts[0][1].round()).to.eql(expected.round());
	});

	it('resets the grid of tile layers', () => {
		const grid = new GridLayer();
		grid.createTile = () => document.createElement('div');
		grid.addTo(map);
		const range = grid._globalTileRange;

		map.setCrs(EPSG4326);
		expect(grid._tileZoom).to.equal(Math.round(map.getZoom()));
		expect(grid._globalTileRange).not.to.eql(range);
		const tiles = Object.values(grid._tiles);
		expect(tiles.length).to.be.greaterThan(0);
		expect(tiles.every(t => t.coords.z === grid._tileZoom)).to.be.true;
	});

	it('updates the CRS of WMS layers', () => {
		const wms = new WMSTileLayer('https://example.com/wms', {layers: 'test'}).addTo(map);
		expect(wms.wmsParams.srs).to.equal('EPSG:3857');
		map.setCrs(EPSG4326);
		expect(wms.wmsParams.srs).to.equal('EPSG:4326');
		const src = Object.values(wms._tiles)[0].el.src;
		expect(src).to.match(srsRe);
	});
});
