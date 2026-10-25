import {expect} from 'vite-plus/test';
import {GridLayer, MaplairMap, MiniMapControl} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer, Finger} from '../SpecHelper.js';
import 'maplair/map-rotation';

describe('MiniMapControl', () => {
	let container, map, control;

	function gridLayer() {
		const grid = new GridLayer();
		grid.createTile = () => document.createElement('div');
		return grid;
	}

	beforeEach(() => {
		container = createContainer('500px', '400px');
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false, inertia: false});
		map.setView([20, 10], 8);
		control = new MiniMapControl(gridLayer(), {width: 160, height: 120}).addTo(map);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function miniMapRect() {
		return control.getMiniMap().getContainer().getBoundingClientRect();
	}

	it('shows an overview map at a smaller zoom', () => {
		const miniMap = control.getMiniMap();
		expect(control.getContainer().parentNode.classList.contains('maplair-right')).to.be.true;
		expect(miniMap.getSize().equals([160, 120])).to.be.true;
		expect(miniMap.getZoom()).to.equal(3);
		expect(miniMap.getCenter()).to.be.nearLatLng([20, 10], 0.5);
		expect(miniMap.attributionControl).to.be.undefined;
		expect(miniMap.scrollWheelZoom.enabled()).to.be.false;
		expect(miniMap.getContainer().getAttribute('aria-label')).to.equal('Overview map');
	});

	it('shows the view of the map as rectangle', () => {
		const rectangle = control._rectangle,
		bounds = map.getBounds();
		expect(control.getMiniMap().hasLayer(rectangle)).to.be.true;
		expect(rectangle.getBounds().getSouthWest()).to.be.nearLatLng(bounds.getSouthWest());
		expect(rectangle.getBounds().getNorthEast()).to.be.nearLatLng(bounds.getNorthEast());
	});

	it('follows the map', () => {
		map.setView([30, 20], 9);
		const miniMap = control.getMiniMap();
		expect(miniMap.getZoom()).to.equal(4);
		expect(miniMap.getCenter()).to.be.nearLatLng([30, 20], 0.5);
		expect(control._rectangle.getBounds().getCenter()).to.be.nearLatLng(map.getCenter(), 0.01);
	});

	it('shows the rotated view of a rotated map', () => {
		map.setBearing(30);
		const latlngs = control._rectangle.getLatLngs()[0];
		expect(latlngs[0]).to.be.nearLatLng(map.containerPointToLatLng([0, 0]));
		expect(latlngs[2]).to.be.nearLatLng(map.containerPointToLatLng([500, 400]));
	});

	it('pans the map when dragging the overview map', async () => {
		const rect = miniMapRect(),
		before = map.getCenter();
		const moveend = new Promise((resolve) => {
			map.once('moveend', resolve);
		});
		await new Finger().moveTo(rect.left + 80, rect.top + 60).down().moveBy(-20, 0).up();
		await moveend;
		// dragging the overview to the left moves the view to the east
		expect(map.getCenter().lng).to.be.greaterThan(before.lng + 1);
		expect(map.getCenter()).to.be.nearLatLng(control.getMiniMap().getCenter(), 0.5);
	});

	it('centers the map when clicking the overview map', () => {
		const rect = miniMapRect(),
		latlng = control.getMiniMap().containerPointToLatLng([40, 30]);
		UIEventSimulator.fire('click', control.getMiniMap().getContainer(), {clientX: rect.left + 40, clientY: rect.top + 30});
		expect(map.getCenter()).to.be.nearLatLng(latlng, 0.1);
	});

	it('collapses and expands', () => {
		const toggle = control.getContainer().querySelector('.maplair-control-minimap-toggle');
		expect(toggle.getAttribute('aria-expanded')).to.equal('true');
		UIEventSimulator.fire('click', toggle);
		expect(control.getContainer().offsetWidth).to.be.lessThan(40);
		expect(toggle.getAttribute('aria-expanded')).to.equal('false');
		expect(toggle.title).to.equal('Show the overview map');

		map.setView([0, 0], 5);
		UIEventSimulator.fire('click', toggle);
		expect(control.getMiniMap().getSize().equals([160, 120])).to.be.true;
		expect(control.getMiniMap().getCenter()).to.be.nearLatLng([0, 0], 0.5);
	});

	it('removes the overview map', () => {
		const miniMap = control.getMiniMap();
		control.remove();
		expect(control.getMiniMap()).to.equal(null);
		expect(miniMap.getContainer().querySelector('.maplair-map-pane')).to.equal(null);
		expect(control.getContainer().isConnected).to.be.false;
		map.setView([0, 0], 5);
	});
});
