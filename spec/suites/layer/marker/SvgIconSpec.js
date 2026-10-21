import {expect} from 'vite-plus/test';
import {DefaultIcon, MaplairMap, Marker, SvgIcon} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('SvgIcon', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);
		map.setView([0, 0], 3);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function addMarker(options) {
		return new Marker([0, 0], {icon: new SvgIcon(options)}).addTo(map);
	}

	it('draws the marker as inline SVG in the given color', () => {
		const marker = addMarker({color: 'rgb(42, 129, 203)'}),
		icon = marker.getElement(),
		svg = icon.querySelector('svg');

		expect(icon.tagName).to.equal('DIV');
		expect(icon.classList.contains('maplair-marker-icon')).to.be.true;
		expect(svg.getAttribute('aria-hidden')).to.equal('true');
		const outline = svg.querySelector('path');
		expect(getComputedStyle(outline).fill).to.equal('rgb(42, 129, 203)');
		// darker outline
		expect(outline.getAttribute('stroke')).to.contain('color-mix');
		// the maple leaf
		expect(svg.querySelectorAll('path')).to.have.length(2);
	});

	it('has the size, anchor and shadow of the default marker', () => {
		const marker = addMarker(),
		icon = marker.getElement(),
		rect = icon.getBoundingClientRect();
		expect(rect.width).to.equal(25);
		expect(rect.height).to.equal(41);
		expect(icon.style.marginLeft).to.equal('-12px');
		expect(icon.style.marginTop).to.equal('-41px');
		expect(marker._shadow.src).to.equal(DefaultIcon.defaultOptions.shadowUrl);
	});

	it('shows a glyph as text', () => {
		const svg = addMarker({glyph: '<b>P</b>', glyphColor: 'black'}).getElement().querySelector('svg'),
		text = svg.querySelector('text');
		// not parsed as HTML
		expect(text.textContent).to.equal('<b>P</b>');
		expect(text.getAttribute('fill')).to.equal('black');
		expect(svg.querySelectorAll('path')).to.have.length(1);
	});

	it('shows a glyph path', () => {
		const svg = addMarker({glyphPath: 'M12 2 2 22h20z'}).getElement().querySelector('svg'),
		paths = svg.querySelectorAll('path');
		expect(paths).to.have.length(2);
		expect(paths[1].getAttribute('d')).to.equal('M12 2 2 22h20z');
		// centered in the head of the marker
		const box = paths[1].getBoundingClientRect(),
		iconBox = svg.getBoundingClientRect();
		expect(box.left + box.width / 2).to.be.closeTo(iconBox.left + iconBox.width / 2, 1);
		expect(box.top + box.height / 2).to.be.lessThan(iconBox.top + iconBox.height / 2);
	});

	it('reuses the icon element when changing the icon', () => {
		const marker = addMarker({color: 'red'}),
		icon = marker.getElement();
		marker.setIcon(new SvgIcon({color: 'blue'}));
		expect(marker.getElement()).to.equal(icon);
		expect(icon.querySelector('path').getAttribute('fill')).to.equal('blue');
	});
});
