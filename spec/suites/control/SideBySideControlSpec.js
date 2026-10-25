import {expect, vi} from 'vite-plus/test';
import {GridLayer, ImageOverlay, MaplairMap, SideBySideControl} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer, Finger} from '../SpecHelper.js';
import 'maplair/map-rotation';

describe('SideBySideControl', () => {
	let container, map, left, right, style;

	function gridLayer(color) {
		const grid = new GridLayer();
		grid.createTile = () => {
			const tile = document.createElement('div');
			tile.style.background = color;
			return tile;
		};
		return grid.addTo(map);
	}

	beforeEach(() => {
		// for hit-testing the clipped layers with elementsFromPoint()
		style = document.createElement('style');
		style.textContent = '.maplair-tile-container, .maplair-image-layer { pointer-events: auto !important; } .maplair-tile { visibility: inherit !important; }';
		document.head.appendChild(style);
		container = createContainer('400px', '300px');
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false, inertia: false});
		map.setView([0, 0], 3);
		left = gridLayer('rgb(255, 0, 0)');
		right = gridLayer('rgb(0, 0, 255)');
	});

	afterEach(() => {
		removeMapContainer(map, container);
		style.remove();
	});

	// The layer shown at the container point `[x, y]`
	function layerAt(x, y) {
		const rect = container.getBoundingClientRect(),
		el = document.elementsFromPoint(rect.left + x, rect.top + y).find(e => e.classList.contains('maplair-tile'));
		return [left, right].find(l => l.getContainer()?.contains(el));
	}

	function divider() {
		return container.querySelector('.maplair-sidebyside-divider');
	}

	it('shows the left layers left and the right layers right of the divider', () => {
		new SideBySideControl(left, right).addTo(map);
		expect(divider().parentNode).to.equal(container);
		expect(divider().style.left).to.equal('200px');
		expect(layerAt(150, 100)).to.equal(left);
		expect(layerAt(250, 100)).to.equal(right);
	});

	it('takes the initial ratio', () => {
		new SideBySideControl([left], [right], {ratio: 0.25}).addTo(map);
		expect(layerAt(90, 100)).to.equal(left);
		expect(layerAt(110, 100)).to.equal(right);
		expect(divider().getAttribute('aria-valuenow')).to.equal('25');
	});

	it('keeps the division when the map moves or rotates', () => {
		new SideBySideControl(left, right).addTo(map);
		map.panBy([120, 50], {animate: false});
		expect(layerAt(190, 100)).to.equal(left);
		expect(layerAt(210, 100)).to.equal(right);
		map.setZoom(5);
		map.setBearing(30);
		expect(layerAt(190, 250)).to.equal(left);
		expect(layerAt(210, 20)).to.equal(right);
	});

	it('moves the divider by dragging it', async () => {
		new SideBySideControl(left, right).addTo(map);
		const center = map.getCenter(),
		dividermove = vi.fn();
		map.on('dividermove', dividermove);

		await new Finger().moveTo(200, 150).down().moveTo(300, 160).up();
		expect(divider().style.left).to.equal('300px');
		expect(layerAt(290, 100)).to.equal(left);
		expect(dividermove).toHaveBeenCalled();
		expect(dividermove.mock.lastCall[0].ratio).to.equal(0.75);
		// without dragging the map
		expect(map.getCenter()).to.be.nearLatLng(center);
	});

	it('moves the divider with the arrow keys', () => {
		const control = new SideBySideControl(left, right).addTo(map);
		UIEventSimulator.fire('keydown', divider(), {key: 'ArrowRight'});
		expect(control.getRatio()).to.be.closeTo(0.55, 1e-9);
		UIEventSimulator.fire('keydown', divider(), {key: 'ArrowLeft', shiftKey: true});
		expect(control.getRatio()).to.be.closeTo(0.54, 1e-9);
		control.setRatio(2);
		expect(control.getRatio()).to.equal(1);
	});

	it('clips image overlays', () => {
		const image = new ImageOverlay('data:image/gif;base64,R0lGODlhAQABAAAAACw=', [[-30, -60], [30, 60]]).addTo(map);
		new SideBySideControl([], image).addTo(map);
		const rect = container.getBoundingClientRect();
		const at = x => document.elementsFromPoint(rect.left + x, rect.top + 150).includes(image.getElement());
		expect(at(150)).to.be.false;
		expect(at(250)).to.be.true;
	});

	it('replaces the layers', () => {
		const control = new SideBySideControl(left, right).addTo(map);
		control.setLeftLayers([]).setRightLayers(left);
		expect(right.getContainer().style.clipPath).to.equal('');
		right.remove();
		expect(layerAt(150, 100)).to.equal(undefined);
		expect(layerAt(250, 100)).to.equal(left);
	});

	it('removes the clipping when removed', () => {
		const control = new SideBySideControl(left, right).addTo(map);
		control.remove();
		expect(divider()).to.equal(null);
		expect(left.getContainer().style.clipPath).to.equal('');
		expect(right.getContainer().style.clipPath).to.equal('');
	});
});
