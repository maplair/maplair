import {expect} from 'vite-plus/test';
import {MaplairMap, Marker, Popup, Tooltip} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('DivOverlay overflow', () => {
	let container, map;
	const center = [55.8, 37.6];

	beforeEach(() => {
		container = createContainer('200px', '200px');
		container.style.left = container.style.top = '50px';
		container.style.border = '3px solid black';
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView(center, 6);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function expectSameRect(el1, el2) {
		const r1 = el1.getBoundingClientRect(),
		r2 = el2.getBoundingClientRect();
		for (const key of ['left', 'top', 'width', 'height']) {
			expect(r1[key]).to.be.closeTo(r2[key], 1);
		}
	}

	function nextScroll(el) {
		return new Promise((resolve) => {
			el.addEventListener('scroll', resolve, {once: true});
		});
	}

	function expectSamePosition(direction) {
		const latlng = map.containerPointToLatLng([190, 100]);
		const options = {direction, permanent: true, content: 'A tooltip with some longer text'};
		const regular = new Tooltip(latlng, options).addTo(map);
		const overflowing = new Tooltip(latlng, {...options, overflow: true}).addTo(map);

		expect(overflowing.getElement().matches(':popover-open')).to.be.true;
		expect(regular.getElement().matches(':popover-open')).to.be.false;
		expectSameRect(overflowing.getElement(), regular.getElement());
	}

	for (const direction of ['auto', 'top', 'bottom', 'left', 'right']) {
		it(`positions an overflowing tooltip like a regular one (direction: ${direction})`, () => expectSamePosition(direction));
	}

	it('positions an overflowing tooltip of a marker like a regular one', () => {
		const latlng = map.containerPointToLatLng([195, 195]);
		const regular = new Marker(latlng).addTo(map)
			.bindTooltip('Tooltip', {permanent: true, direction: 'bottom'});
		const overflowing = new Marker(latlng).addTo(map)
			.bindTooltip('Tooltip', {permanent: true, direction: 'bottom', overflow: true});

		expectSameRect(overflowing.getTooltip().getElement(), regular.getTooltip().getElement());
	});

	it('positions a sticky overflowing tooltip like a regular one', () => {
		const latlng = map.containerPointToLatLng([150, 150]);
		const regular = new Tooltip(latlng, {sticky: true, content: 'Tooltip'}).addTo(map);
		const overflowing = new Tooltip(latlng, {sticky: true, content: 'Tooltip', overflow: true}).addTo(map);
		regular._setPosition(map.latLngToLayerPoint(map.containerPointToLatLng([160, 120])));
		overflowing._setPosition(map.latLngToLayerPoint(map.containerPointToLatLng([160, 120])));

		expectSameRect(overflowing.getElement(), regular.getElement());

		expectSameRect(overflowing.getElement(), regular.getElement());
	});

	it('positions an overflowing popup like a regular one', () => {
		const latlng = map.containerPointToLatLng([100, 20]);
		const options = {autoPan: false, content: '<p>A popup<br>with some lines<br>of text</p>'};
		const regular = new Popup(latlng, options);
		const overflowing = new Popup(latlng, {...options, overflow: true});
		map.addLayer(regular).addLayer(overflowing);

		expect(overflowing.getElement().matches(':popover-open')).to.be.true;
		expectSameRect(overflowing.getElement(), regular.getElement());
	});

	it('lets an overflowing tooltip extend beyond the map container', () => {
		const tooltip = new Tooltip(map.containerPointToLatLng([190, 100]), {
			direction: 'right', permanent: true, interactive: true, overflow: true, content: 'Beyond the map'
		}).addTo(map);
		const mapRect = container.getBoundingClientRect(),
		rect = tooltip.getElement().getBoundingClientRect();

		expect(rect.right).to.be.greaterThan(mapRect.right);
		expect(document.elementFromPoint(rect.right - 5, rect.top + rect.height / 2)).to.equal(tooltip.getElement());
	});

	it('follows the map when panning', () => {
		const latlng = map.containerPointToLatLng([100, 100]);
		const regular = new Tooltip(latlng, {permanent: true, direction: 'top', content: 'A'}).addTo(map);
		const overflowing = new Tooltip(latlng, {permanent: true, direction: 'top', content: 'A', overflow: true}).addTo(map);

		map.panBy([30, 40], {animate: false});
		expectSameRect(overflowing.getElement(), regular.getElement());

		map.setZoom(8);
		expectSameRect(overflowing.getElement(), regular.getElement());
	});

	it('follows the page when scrolling', async () => {
		const scroller = document.createElement('div');
		scroller.style.cssText = 'position: absolute; top: 0; left: 0; width: 300px; height: 300px; overflow: auto;';
		document.body.appendChild(scroller);
		scroller.appendChild(container);
		const spacer = document.createElement('div');
		spacer.style.height = '1000px';
		scroller.appendChild(spacer);

		const latlng = map.containerPointToLatLng([100, 100]);
		const regular = new Tooltip(latlng, {permanent: true, content: 'A'}).addTo(map);
		const overflowing = new Tooltip(latlng, {permanent: true, content: 'A', overflow: true}).addTo(map);

		const scrolled = nextScroll(scroller);
		scroller.scrollTop = 30;
		await scrolled;
		expectSameRect(overflowing.getElement(), regular.getElement());

		document.body.appendChild(container);
		scroller.remove();
	});

	it('stops following the page once closed', async () => {
		const tooltip = new Tooltip(map.getCenter(), {permanent: true, content: 'A', overflow: true}).addTo(map);
		const element = tooltip.getElement();
		tooltip.close();
		expect(element.isConnected).to.be.false;

		const before = element.style.transform;
		const scrolled = nextScroll(document);
		document.documentElement.style.height = '5000px';
		window.scrollTo(0, 20);
		await scrolled;
		expect(element.style.transform).to.equal(before);

		window.scrollTo(0, 0);
		document.documentElement.style.height = '';

		// opens again
		tooltip.addTo(map);
		expect(element.matches(':popover-open')).to.be.true;
	});

	it('keeps the stacking order on bringToFront/bringToBack', () => {
		const latlng = map.getCenter();
		const options = {permanent: true, interactive: true, overflow: true, direction: 'center'};
		const t1 = new Tooltip(latlng, {...options, content: 'First tooltip'}).addTo(map);
		const t2 = new Tooltip(latlng, {...options, content: 'Second tooltip'}).addTo(map);
		const rect = t1.getElement().getBoundingClientRect(),
		x = rect.left + rect.width / 2,
		y = rect.top + rect.height / 2;

		expect(document.elementFromPoint(x, y)).to.equal(t2.getElement());

		t1.bringToFront();
		expect(t1.getElement().matches(':popover-open')).to.be.true;
		expect(t2.getElement().matches(':popover-open')).to.be.true;
		expect(document.elementFromPoint(x, y)).to.equal(t1.getElement());

		t1.bringToBack();
		expect(t1.getElement().matches(':popover-open')).to.be.true;
		expect(document.elementFromPoint(x, y)).to.equal(t2.getElement());
	});
});
