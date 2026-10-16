import {expect} from 'vite-plus/test';
import {MaplairMap, Marker, Tooltip} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Tooltip direction: auto', () => {
	let container, map;

	function createMap(width, height) {
		container = createContainer(width, height);
		container.style.left = container.style.top = '50px';
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView([0, 0], 6);
	}

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function openTooltip(containerPoint, options) {
		return new Tooltip(map.containerPointToLatLng(containerPoint), {
			permanent: true,
			content: 'An auto tooltip',
			...options
		}).addTo(map);
	}

	function directionOf(tooltip) {
		return ['top', 'bottom', 'left', 'right'].find(d => tooltip.getElement().classList.contains(`maplair-tooltip-${d}`));
	}

	function tipShiftOf(tooltip) {
		return parseFloat(tooltip.getElement().style.getPropertyValue('--maplair-tooltip-tip-shift') || '0');
	}

	function expectWithin(tooltip, rect) {
		const r = tooltip.getElement().getBoundingClientRect();
		expect(r.left).to.be.at.least(rect.left - 1);
		expect(r.top).to.be.at.least(rect.top - 1);
		expect(r.right).to.be.at.most(rect.right + 1);
		expect(r.bottom).to.be.at.most(rect.bottom + 1);
	}

	describe('on a large map', () => {
		beforeEach(() => {
			createMap('400px', '400px');
		});

		it('opens to the right on the left half of the map', () => {
			const tooltip = openTooltip([100, 200]);
			expect(directionOf(tooltip)).to.equal('right');
			expect(tipShiftOf(tooltip)).to.equal(0);
		});

		it('opens to the left on the right half of the map', () => {
			const tooltip = openTooltip([300, 200]);
			expect(directionOf(tooltip)).to.equal('left');
			const rect = tooltip.getElement().getBoundingClientRect();
			expect(rect.right).to.be.closeTo(container.getBoundingClientRect().left + 300 - 6, 1);
		});

		it('mirrors the tooltip anchor of a marker on the left side', () => {
			const latlng = map.containerPointToLatLng([300, 200]);
			const marker = new Marker(latlng).addTo(map).bindTooltip('Marker', {permanent: true});
			const tooltip = marker.getTooltip();
			expect(directionOf(tooltip)).to.equal('left');
			const anchorX = marker.options.icon.options.tooltipAnchor[0];
			const rect = tooltip.getElement().getBoundingClientRect();
			expect(rect.right).to.be.closeTo(container.getBoundingClientRect().left + 300 - anchorX - 6, 1);
		});

		it('opens above a tooltip too wide for both sides', () => {
			const tooltip = openTooltip([190, 200], {content: 'A rather long tooltip text that needs space'});
			expect(directionOf(tooltip)).to.equal('top');
			expectWithin(tooltip, container.getBoundingClientRect());
		});

		it('shifts a side tooltip along the edge of the map and its tip towards the source', () => {
			const tooltip = openTooltip([100, 2]);
			expect(directionOf(tooltip)).to.equal('right');
			expectWithin(tooltip, container.getBoundingClientRect());
			expect(tipShiftOf(tooltip)).to.be.lessThan(0);
		});

		it('keeps the direction while the map moves', () => {
			const tooltip = openTooltip([190, 200]);
			expect(directionOf(tooltip)).to.equal('right');
			map.setZoom(7);
			map.panBy([-100, 0], {animate: false});
			map.setZoom(6);
			expect(directionOf(tooltip)).to.equal('right');
		});

		it('chooses the direction again on update', () => {
			const tooltip = openTooltip([190, 200]);
			expect(directionOf(tooltip)).to.equal('right');
			tooltip.setContent('A rather long tooltip text that needs space');
			expect(directionOf(tooltip)).to.equal('top');
		});

		it('does not change explicit directions', () => {
			const tooltip = openTooltip([395, 200], {direction: 'right'});
			expect(directionOf(tooltip)).to.equal('right');
			expect(tipShiftOf(tooltip)).to.equal(0);
		});
	});

	describe('on a narrow map', () => {
		beforeEach(() => {
			createMap('120px', '300px');
		});

		it('opens above if there is no space on the sides', () => {
			const tooltip = openTooltip([100, 150]);
			expect(directionOf(tooltip)).to.equal('top');
			expectWithin(tooltip, container.getBoundingClientRect());
			// shifted to the left, so the tip points to the right
			expect(tipShiftOf(tooltip)).to.be.greaterThan(0);
		});

		it('opens below if there is no space on the sides and above', () => {
			const tooltip = openTooltip([20, 10]);
			expect(directionOf(tooltip)).to.equal('bottom');
			expectWithin(tooltip, container.getBoundingClientRect());
			expect(tipShiftOf(tooltip)).to.be.lessThan(0);
		});

		it('stays on the side for overflowing tooltips, within the viewport', () => {
			const tooltip = openTooltip([100, 150], {overflow: true});
			expect(directionOf(tooltip)).to.equal('right');
			const rect = tooltip.getElement().getBoundingClientRect();
			expect(rect.right).to.be.greaterThan(container.getBoundingClientRect().right);
			expectWithin(tooltip, document.documentElement.getBoundingClientRect());
		});
	});
});
