import {expect, vi} from 'vite-plus/test';
import {Canvas, GridLayer, MaplairMap, Marker, Point, Polygon, Popup, SVG, Tooltip} from 'maplair';
import Hand from 'prosthetic-hand';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';
import {RotateControl} from 'maplair/map-rotation';

describe('Map: rotation', () => {
	let container, map;
	const center = new Point(200, 150);

	function createMap(options) {
		container = createContainer('400px', '300px');
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false, inertia: false, ...options});
		map.setView([10, 20], 5);
	}

	afterEach(() => {
		vi.restoreAllMocks();
		removeMapContainer(map, container);
	});

	function expectNear(point, expected, delta = 1) {
		expect(point.distanceTo(expected)).to.be.lessThan(delta);
	}

	// The position of an element's box relative to a container point
	function relativeRect(el, containerPoint) {
		const rect = el.getBoundingClientRect(),
		origin = container.getBoundingClientRect();
		return new Point(rect.left - origin.left, rect.top - origin.top).subtract(containerPoint);
	}

	describe('setBearing', () => {
		beforeEach(() => {
			createMap();
		});

		it('is not rotated by default', () => {
			expect(map.getBearing()).to.equal(0);
			expect(container.querySelector('.maplair-rotate-pane')).to.equal(null);
		});

		it('rotates the map around the center', () => {
			const latlng = map.getCenter();
			const events = [];
			map.on('rotate movestart moveend', e => events.push(e.type));
			map.setBearing(90);

			expect(map.getBearing()).to.equal(90);
			expect(events).to.eql(['rotate', 'movestart', 'moveend']);
			expect(map.getCenter()).to.be.nearLatLng(latlng);
			expect(container.querySelector('.maplair-rotate-pane').style.transform).to.equal('rotate(-90deg)');
			// east is up
			const east = map.latLngToContainerPoint([10, 25]);
			expect(east.x).to.be.closeTo(center.x, 1);
			expect(east.y).to.be.lessThan(center.y - 50);
		});

		it('normalizes the bearing', () => {
			map.setBearing(-90);
			expect(map.getBearing()).to.equal(270);
			map.setBearing(720 + 45);
			expect(map.getBearing()).to.equal(45);
		});

		it('converts between container and geographic coordinates', () => {
			map.setBearing(33);
			for (const point of [new Point(0, 0), new Point(400, 0), new Point(123, 245)]) {
				// latLngToLayerPoint() rounds
				expectNear(map.latLngToContainerPoint(map.containerPointToLatLng(point)), point, 1);
				expectNear(map.layerPointToContainerPoint(map.containerPointToLayerPoint(point)), point, 1e-6);
			}
		});

		it('covers the rotated view with the bounds', () => {
			map.setBearing(45);
			const bounds = map.getBounds();
			for (const corner of [[0, 0], [400, 0], [0, 300], [400, 300]]) {
				expect(bounds.contains(map.containerPointToLatLng(corner))).to.be.true;
			}
		});

		it('rotates with an animation', async () => {
			const bearings = [], moveend = vi.fn();
			map.on('rotate', () => bearings.push(map.getBearing()));
			map.on('moveend', moveend);
			// advance the clock in fixed steps, independent of slow CI runners
			let now = performance.now();
			vi.spyOn(performance, 'now').mockImplementation(() => (now += 25));
			map.setBearing(350, {animate: true});
			await new Promise((resolve) => {
				map.once('moveend', resolve);
			});
			expect(map.getBearing()).to.equal(350);
			expect(moveend).toHaveBeenCalledOnce();
			// the shorter way round, through 355
			expect(bearings.length).to.be.greaterThan(2);
			expect(bearings.every(b => b === 0 || b > 340)).to.be.true;
		});

		it('takes the bearing option', () => {
			map.remove();
			map = new MaplairMap(container, {bearing: 90, center: [10, 20], zoom: 5});
			expect(map.getBearing()).to.equal(90);
			expect(map.latLngToContainerPoint([10, 25]).y).to.be.lessThan(center.y - 50);
		});
	});

	describe('interaction', () => {
		beforeEach(() => {
			createMap();
			map.setBearing(60);
		});

		it('pans in container pixels', () => {
			const latlng = map.containerPointToLatLng(center.add([30, 40]));
			map.panBy([30, 40], {animate: false});
			expectNear(map.latLngToContainerPoint(latlng), center);
		});

		it('pans to a location', () => {
			map.panTo([12, 22], {animate: false});
			// panning is rounded to whole pixels
			expect(map.getCenter()).to.be.nearLatLng([12, 22], 0.05);
		});

		it('keeps the location below the pointer while dragging', async () => {
			const start = new Point(100, 100),
			latlng = map.containerPointToLatLng(start);
			const moveend = new Promise((resolve) => {
				map.once('moveend', resolve);
			});
			const hand = new Hand({timing: 'fastframe'});
			const finger = hand.growFinger('pointer', {pointerType: 'mouse'});
			finger.wait(100).moveTo(start.x, start.y, 0).down().moveBy(80, 50, 200).up();
			await moveend;
			expectNear(map.latLngToContainerPoint(latlng), start.add([80, 50]), 2);
		});

		it('keeps the location below the pointer when zooming around it', () => {
			const point = new Point(100, 250),
			latlng = map.containerPointToLatLng(point);
			map.setZoomAround(point, 7);
			expectNear(map.latLngToContainerPoint(latlng), point);
		});

		it('keeps the location below the pointer when pinching on a touchpad', async () => {
			const point = new Point(100, 250),
			latlng = map.containerPointToLatLng(point),
			rect = container.getBoundingClientRect();
			const zoomend = new Promise((resolve) => {
				map.once('zoomend', resolve);
			});
			container.dispatchEvent(new WheelEvent('wheel', {
				bubbles: true, cancelable: true, ctrlKey: true, deltaY: -100,
				clientX: rect.left + point.x, clientY: rect.top + point.y
			}));
			await zoomend;
			expect(map.getZoom()).to.equal(6);
			expectNear(map.latLngToContainerPoint(latlng), point);
		});

		it('keeps the zoom origin with continuousZoom', async () => {
			map.options.continuousZoom = true;
			map.options.zoomAnimation = true;
			map._zoomAnimated = true;
			const point = new Point(300, 80),
			latlng = map.containerPointToLatLng(point);
			let maxDistance = 0;
			map.on('zoom', () => {
				maxDistance = Math.max(maxDistance, map.latLngToContainerPoint(latlng).distanceTo(point));
			});
			const zoomend = new Promise((resolve) => {
				map.once('zoomend', resolve);
			});
			map.setZoomAround(point, 6);
			await zoomend;
			// the pixel origin and layer points are rounded
			expect(maxDistance).to.be.lessThan(2);
		});

		it('does not rotate by turning two fingers by default', async () => {
			const moveend = new Promise((resolve) => {
				map.once('moveend', resolve);
			});
			const hand = new Hand({timing: 'fastframe'});
			const f1 = hand.growFinger('pointer', {pointerType: 'touch'});
			const f2 = hand.growFinger('pointer', {pointerType: 'touch'});
			hand.sync(5);
			f1.wait(100).moveTo(100, 150, 0).down().moveTo(200, 50, 400).up(100);
			f2.wait(100).moveTo(300, 150, 0).down().moveTo(200, 250, 400).up(100);
			await moveend;
			expect(map.getBearing()).to.equal(60);
		});

		it('rotates by turning two fingers with pinchRotate', async () => {
			map.remove();
			createMap({pinchRotate: true});
			const zoomend = new Promise((resolve) => {
				map.once('moveend', resolve);
			});
			const hand = new Hand({timing: 'fastframe'});
			const f1 = hand.growFinger('pointer', {pointerType: 'touch'});
			const f2 = hand.growFinger('pointer', {pointerType: 'touch'});
			hand.sync(5);
			// turn by 90° clockwise around the center, without changing the distance
			f1.wait(100).moveTo(100, 150, 0).down().moveTo(200, 50, 400).up(100);
			f2.wait(100).moveTo(300, 150, 0).down().moveTo(200, 250, 400).up(100);
			await zoomend;
			// the threshold of 15° is not rotated
			expect(map.getBearing()).to.be.closeTo(360 - 75, 5);
		});
	});

	describe('upright overlays', () => {
		beforeEach(() => {
			createMap();
		});

		it('keeps markers upright at their position', () => {
			const latlng = [11, 21],
			marker = new Marker(latlng).addTo(map),
			before = relativeRect(marker.getElement(), map.latLngToContainerPoint(latlng));

			map.setBearing(70);
			expect(marker.getElement().style.transform).to.contain('rotate(70deg)');
			expectNear(relativeRect(marker.getElement(), map.latLngToContainerPoint(latlng)), before);
		});

		it('rotates markers with rotateWithView', () => {
			const marker = new Marker([11, 21], {rotateWithView: true}).addTo(map);
			map.setBearing(70);
			expect(marker.getElement().style.transform).not.to.contain('rotate');
		});

		it('keeps popups upright above their source', () => {
			const latlng = [11, 21],
			marker = new Marker(latlng).addTo(map).bindPopup('Popup', {autoPan: false}).openPopup(),
			before = relativeRect(marker.getPopup().getElement(), map.latLngToContainerPoint(latlng));

			map.setBearing(130);
			expectNear(relativeRect(marker.getPopup().getElement(), map.latLngToContainerPoint(latlng)), before);
		});

		function expectUprightTooltip(direction) {
			const latlng = [11, 21],
			tooltip = new Tooltip(latlng, {permanent: true, direction, content: 'Tooltip'}).addTo(map),
			before = relativeRect(tooltip.getElement(), map.latLngToContainerPoint(latlng));

			map.setBearing(200);
			expectNear(relativeRect(tooltip.getElement(), map.latLngToContainerPoint(latlng)), before);
		}

		for (const direction of ['top', 'bottom', 'left', 'right']) {
			it(`keeps tooltips upright (direction: ${direction})`, () => expectUprightTooltip(direction));
		}

		it('keeps marker tooltips upright', () => {
			const latlng = [11, 21],
			marker = new Marker(latlng).addTo(map).bindTooltip('Tooltip', {permanent: true, direction: 'right'}),
			before = relativeRect(marker.getTooltip().getElement(), map.latLngToContainerPoint(latlng));

			map.setBearing(250);
			expectNear(relativeRect(marker.getTooltip().getElement(), map.latLngToContainerPoint(latlng)), before);
		});

		it('positions popups opened on a rotated map', () => {
			const latlng = [11, 21],
			popup = new Popup(latlng, {content: 'Popup', autoPan: false}).openOn(map),
			before = relativeRect(popup.getElement(), map.latLngToContainerPoint(latlng));
			popup.close();

			map.setBearing(45);
			popup.openOn(map);
			expectNear(relativeRect(popup.getElement(), map.latLngToContainerPoint(latlng)), before);
		});
	});

	describe('layers', () => {
		beforeEach(() => {
			createMap();
		});

		it('loads the tiles of the whole rotated view', () => {
			const grid = new GridLayer();
			grid.createTile = () => document.createElement('div');
			grid.addTo(map);
			map.setBearing(45);

			const zoom = grid._tileZoom,
			tileSize = grid.getTileSize();
			for (const corner of [[0, 0], [400, 0], [0, 300], [400, 300]]) {
				const coords = map.project(map.containerPointToLatLng(corner), zoom).unscaleBy(tileSize).floor();
				expect(grid._tiles[`${coords.x}:${coords.y}:${zoom}`], `tile at ${corner}`).to.be.ok;
			}
		});

		function expectRendererCoversView(Renderer) {
			const renderer = new Renderer({padding: 0});
			new Polygon([[0, 0], [20, 20], [0, 20]], {renderer}).addTo(map);
			map.setBearing(45);

			for (const corner of [[0, 0], [400, 0], [0, 300], [400, 300]]) {
				expect(renderer._bounds.contains(map.containerPointToLayerPoint(corner).round())).to.be.true;
			}
			const size = renderer._bounds.getSize();
			expect(renderer._container.style.width).to.equal(`${size.x}px`);
		}

		for (const Renderer of [SVG, Canvas]) {
			it(`covers the rotated view with the ${Renderer.name} renderer`, () => expectRendererCoversView(Renderer));
		}
	});

	describe('RotateControl', () => {
		it('shows the north and resets it', async () => {
			createMap({rotateControl: true});
			expect(map.rotateControl).to.be.instanceOf(RotateControl);
			const button = container.querySelector('.maplair-control-rotate-button');
			expect(button.tagName).to.equal('BUTTON');

			map.setBearing(40);
			expect(button.firstChild.style.transform).to.equal('rotate(-40deg)');

			const moveend = new Promise((resolve) => {
				map.once('moveend', resolve);
			});
			UIEventSimulator.fire('click', button);
			expect((await moveend).originalEvent.type).to.equal('click');
			expect(map.getBearing()).to.equal(0);
			expect(button.firstChild.style.transform).to.equal('rotate(0deg)');
		});
	});
});
