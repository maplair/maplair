import {expect, vi} from 'vite-plus/test';
import {Canvas, MaplairMap, Point, Polyline, SVG} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';
import 'maplair/path-decorations';

describe('Path decorations', () => {
	let container, map;
	const latlngs = [[0, -20], [0, 0], [10, 10]];

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false});
		map.setView([0, 0], 3);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('geometry', () => {
		const ring = [new Point(0, 0), new Point(100, 0), new Point(100, 50)];

		function line(options) {
			const polyline = new Polyline([], options);
			polyline._rings = polyline._parts = [ring];
			return polyline;
		}

		it('puts an arrowhead at the end', () => {
			const [triangle, ...rest] = line({arrowheads: {size: 10}})._getArrowheads();
			expect(rest).to.have.length(0);
			const [tip, left, right] = triangle;
			expect(tip.equals([100, 50])).to.be.true;
			// pointing down
			expect(left.y).to.be.closeTo(40, 1e-9);
			expect(right.y).to.be.closeTo(40, 1e-9);
			expect(Math.abs(left.x - right.x)).to.be.closeTo(10, 1e-9);
		});

		it('repeats arrowheads', () => {
			expect(line({arrowheads: {repeat: 40}})._getArrowheads()).to.have.length(3);
			const twice = line({arrowheads: true});
			twice._rings = [ring, ring];
			expect(twice._getArrowheads()).to.have.length(2);
		});

		it('places the characters of the text along the line', () => {
			// characters 10 pixels wide
			const placements = line({text: {content: 'abc', center: true}})._getTextPlacements(t => t.length * 10);
			expect(placements.map(p => p.char)).to.eql(['a', 'b', 'c']);
			// centered on the line of 150 pixels: from 60 to 90
			expect(placements[0].point.equals([65, 0])).to.be.true;
			expect(placements[2].point.equals([85, 0])).to.be.true;
			expect(placements[0].angle).to.equal(0);

			const around = line({text: {content: 'x', repeat: true}})._getTextPlacements(t => t.length * 10);
			expect(around).to.have.length(15);
			expect(around[12].point.equals([100, 25])).to.be.true;
			expect(around[12].angle).to.be.closeTo(Math.PI / 2, 1e-9);
		});
	});

	describe('SVG', () => {
		it('draws arrowheads after the path', () => {
			const line = new Polyline(latlngs, {renderer: new SVG(), color: 'red', arrowheads: {size: 12}}).addTo(map),
			arrowheads = line.getElement().nextSibling;
			expect(arrowheads.getAttribute('class')).to.equal('maplair-path-arrowheads');
			expect(arrowheads.getAttribute('fill')).to.equal('red');
			expect(getComputedStyle(arrowheads).pointerEvents).to.equal('none');
			// one triangle at the end
			expect(arrowheads.getAttribute('d').match(/M/g)).to.have.length(1);
			const end = map.latLngToLayerPoint(latlngs[2]);
			expect(arrowheads.getAttribute('d').startsWith(`M${end.x} ${end.y}`)).to.be.true;
		});

		it('draws text along the path', () => {
			const line = new Polyline(latlngs, {renderer: new SVG(), text: {content: 'Main Street', center: true, offset: -5}}).addTo(map),
			path = line.getElement(),
			text = path.nextSibling,
			textPath = text.firstChild;
			expect(text.tagName).to.equal('text');
			expect(getComputedStyle(text).pointerEvents).to.equal('none');
			expect(textPath.getAttribute('href')).to.equal(`#${path.id}`);
			expect(textPath.textContent).to.equal('Main Street');
			expect(textPath.getAttribute('startOffset')).to.equal('50%');
			expect(text.getAttribute('dy')).to.equal('-5');
			expect(text.getComputedTextLength()).to.be.greaterThan(30);
		});

		it('repeats text along the path', () => {
			const line = new Polyline(latlngs, {renderer: new SVG(), text: {content: 'ab ', repeat: true}}).addTo(map),
			text = line.getElement().nextSibling;
			const count = text.textContent.length / 3;
			expect(count).to.be.greaterThan(5);
			expect(text.getComputedTextLength()).to.be.at.most(line.getElement().getTotalLength() + 1);
		});

		it('accepts a string as text', () => {
			const line = new Polyline(latlngs, {renderer: new SVG(), text: 'Name'}).addTo(map);
			expect(line.getElement().nextSibling.textContent).to.equal('Name');
		});

		it('updates and removes the decorations', () => {
			const line = new Polyline(latlngs, {renderer: new SVG(), arrowheads: true, text: 'Name'}).addTo(map),
			path = line.getElement();
			line.setStyle({text: 'Other'});
			expect(path.parentNode.querySelector('text').textContent).to.equal('Other');

			line.bringToBack();
			expect(path.nextSibling.getAttribute('class')).to.equal('maplair-path-arrowheads');
			expect(path.nextSibling.nextSibling.tagName).to.equal('text');

			line.setStyle({arrowheads: false, text: null});
			expect(path.parentNode.querySelector('.maplair-path-arrowheads, text')).to.equal(null);

			line.setStyle({arrowheads: true});
			const svg = path.parentNode;
			line.remove();
			expect(svg.querySelector('.maplair-path-arrowheads')).to.equal(null);
		});

		it('follows the map', () => {
			const line = new Polyline(latlngs, {renderer: new SVG(), arrowheads: true}).addTo(map);
			map.setZoom(5);
			const end = map.latLngToLayerPoint(latlngs[2]);
			expect(line.getElement().nextSibling.getAttribute('d').startsWith(`M${end.x} ${end.y}`)).to.be.true;
		});
	});

	describe('Canvas', () => {
		function nextFrame() {
			return new Promise((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(resolve));
			});
		}

		it('draws arrowheads and text', async () => {
			const renderer = new Canvas();
			new Polyline([[0, 0], [0, 1]], {renderer}).addTo(map);
			await nextFrame();
			const ctx = renderer._ctx,
			fillText = vi.spyOn(ctx, 'fillText'),
			fill = vi.spyOn(ctx, 'fill');

			new Polyline(latlngs, {renderer, color: 'red', arrowheads: {repeat: 50}, text: {content: 'Main', center: true}}).addTo(map);
			await nextFrame();

			// a fill for the arrowheads, a character after the other
			expect(fill).toHaveBeenCalled();
			expect(fillText.mock.calls.map(c => c[0])).to.eql(['M', 'a', 'i', 'n']);
		});

		it('repeats text', async () => {
			const renderer = new Canvas();
			new Polyline([[0, 0], [0, 1]], {renderer}).addTo(map);
			await nextFrame();
			const fillText = vi.spyOn(renderer._ctx, 'fillText');
			new Polyline(latlngs, {renderer, text: {content: 'ab', repeat: true}}).addTo(map);
			await nextFrame();
			expect(fillText.mock.calls.length).to.be.greaterThan(10);
		});

		it('redraws the area of the decorations', () => {
			const renderer = new Canvas();
			const line = new Polyline(latlngs, {renderer, weight: 3, arrowheads: {size: 20}}).addTo(map);
			renderer._redrawBounds = null;
			renderer._extendRedrawBounds(line);
			const bounds = renderer._redrawBounds;
			expect(bounds.min.x).to.be.at.most(line._pxBounds.min.x - 24);
		});
	});
});
