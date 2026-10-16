import {expect, vi} from 'vite-plus/test';
import {Canvas, FeatureGroup, ImageOverlay, MaplairMap, Marker, Polygon, SVG, Tooltip} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Layer: setInteractive', () => {
	let container, map;
	const bounds = [[-10, -10], [10, 10]];

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView([0, 0], 3);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	// A position whose marker icon covers the center of the map
	function belowCenter() {
		return map.containerPointToLatLng([200, 220]);
	}

	// Clicks the map at the center, where all layers of the tests are.
	function clickCenter() {
		const rect = container.getBoundingClientRect(),
		clientX = rect.left + rect.width / 2,
		clientY = rect.top + rect.height / 2,
		target = document.elementFromPoint(clientX, clientY);
		UIEventSimulator.fire('click', target, {clientX, clientY});
		return target;
	}

	function expectClicks(layer, expected) {
		const layerClick = vi.fn(), mapClick = vi.fn();
		layer.on('click', layerClick);
		map.on('click', mapClick);
		clickCenter();
		layer.off('click', layerClick);
		map.off('click', mapClick);
		expect(layerClick).toHaveBeenCalledTimes(expected ? 1 : 0);
		if (!expected) {
			// clicking the map below
			expect(mapClick).toHaveBeenCalledOnce();
		}
	}

	it('toggles a marker', () => {
		const marker = new Marker(belowCenter()).addTo(map);
		expectClicks(marker, true);

		expect(marker.setInteractive(false)).to.equal(marker);
		expect(marker.options.interactive).to.be.false;
		expect(marker.getElement().classList.contains('maplair-interactive')).to.be.false;
		expectClicks(marker, false);

		marker.setInteractive(true);
		expect(marker.getElement().classList.contains('maplair-interactive')).to.be.true;
		expectClicks(marker, true);
	});

	it('does not change the options of other markers', () => {
		const marker = new Marker([0, 0]).addTo(map);
		marker.setInteractive(false);
		expect(new Marker([0, 0]).options.interactive).to.be.true;
	});

	it('disables and restores dragging of a marker', () => {
		const marker = new Marker([0, 0], {draggable: true}).addTo(map);
		expect(marker.dragging.enabled()).to.be.true;

		marker.setInteractive(false);
		expect(marker.dragging.enabled()).to.be.false;

		marker.setInteractive(true);
		expect(marker.dragging.enabled()).to.be.true;
	});

	it('applies the option when adding a marker later', () => {
		const marker = new Marker(belowCenter()).setInteractive(false).addTo(map);
		expect(marker.getElement().classList.contains('maplair-interactive')).to.be.false;
		expectClicks(marker, false);
	});

	it('toggles an SVG path', () => {
		const polygon = new Polygon(bounds, {renderer: new SVG()}).addTo(map);
		expectClicks(polygon, true);

		polygon.setInteractive(false);
		expect(polygon.getElement().classList.contains('maplair-interactive')).to.be.false;
		expect(clickCenter()).not.to.equal(polygon.getElement());
		expectClicks(polygon, false);

		polygon.setInteractive(true);
		expect(clickCenter()).to.equal(polygon.getElement());
		expectClicks(polygon, true);
	});

	it('toggles a canvas path', () => {
		const polygon = new Polygon(bounds, {renderer: new Canvas()}).addTo(map);
		expectClicks(polygon, true);

		polygon.setInteractive(false);
		expectClicks(polygon, false);

		polygon.setInteractive(true);
		expectClicks(polygon, true);
	});

	it('toggles an image overlay', () => {
		const overlay = new ImageOverlay('data:image/gif;base64,R0lGODlhAQABAAAAACw=', bounds, {interactive: true}).addTo(map);
		expectClicks(overlay, true);

		overlay.setInteractive(false);
		expect(overlay.getElement().classList.contains('maplair-interactive')).to.be.false;
		expectClicks(overlay, false);

		overlay.setInteractive(true);
		expectClicks(overlay, true);
	});

	it('toggles a tooltip', () => {
		const tooltip = new Tooltip([0, 0], {permanent: true, direction: 'center', content: 'Tooltip'}).addTo(map);
		expectClicks(tooltip, false);

		tooltip.setInteractive(true);
		expect(tooltip.getElement().classList.contains('maplair-interactive')).to.be.true;
		expectClicks(tooltip, true);

		tooltip.setInteractive(false);
		expectClicks(tooltip, false);
	});

	it('toggles the layers of a feature group', () => {
		const marker = new Marker(belowCenter()),
		polygon = new Polygon(bounds),
		group = new FeatureGroup([marker, polygon]).addTo(map);

		group.setInteractive(false);
		expect(marker.options.interactive).to.be.false;
		expect(polygon.options.interactive).to.be.false;
		expectClicks(group, false);

		group.setInteractive(true);
		expect(marker.options.interactive).to.be.true;
		expect(polygon.options.interactive).to.be.true;
		expectClicks(group, true);
	});
});
