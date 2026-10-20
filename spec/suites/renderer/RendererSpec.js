import {expect, vi} from 'vite-plus/test';
import {Canvas, Circle, MaplairMap, SVG} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Renderer', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('default renderer', () => {
		it('is SVG by default', () => {
			map = new MaplairMap(container);
			map.setView([55.8, 37.6], 6);

			const circle = new Circle([55.8, 37.6]).addTo(map);

			expect(map.getRenderer(circle)).to.be.instanceOf(SVG);
			expect(container.querySelector('.maplair-pane svg path')).to.be.instanceOf(SVGPathElement);
			expect(container.querySelector('.maplair-pane canvas')).to.be.null;
		});

		it('uses the map renderer option', () => {
			map = new MaplairMap(container, {renderer: new Canvas()});
			map.setView([55.8, 37.6], 6);

			new Circle([55.8, 37.6]).addTo(map);

			expect(container.querySelector('.maplair-pane svg path')).to.be.null;
			expect(container.querySelector('.maplair-pane canvas')).to.be.instanceOf(HTMLCanvasElement);
		});

		it('creates custom pane renderers of the same kind as the map renderer', () => {
			map = new MaplairMap(container, {renderer: new Canvas({tolerance: 5})});
			map.setView([55.8, 37.6], 6);
			map.createPane('custom');

			const circle = new Circle([55.8, 37.6], {pane: 'custom'}).addTo(map);
			const renderer = map.getRenderer(circle);

			expect(renderer).to.be.instanceOf(Canvas);
			expect(renderer).to.not.equal(map.options.renderer);
			expect(renderer.options.pane).to.equal('custom');
			expect(renderer.options.tolerance).to.equal(5);
			expect(map.getPane('custom').querySelector('canvas')).to.be.instanceOf(HTMLCanvasElement);
		});

		it('creates SVG custom pane renderers by default', () => {
			map = new MaplairMap(container);
			map.setView([55.8, 37.6], 6);
			map.createPane('custom');

			const circle = new Circle([55.8, 37.6], {pane: 'custom'}).addTo(map);

			expect(map.getRenderer(circle)).to.be.instanceOf(SVG);
			expect(map.getPane('custom').querySelector('svg')).to.be.instanceOf(SVGElement);
		});

		it('logs an error for the removed preferCanvas option', () => {
			const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
			try {
				map = new MaplairMap(container, {preferCanvas: true});
				expect(spy).toHaveBeenCalledOnce();
				expect(spy.mock.calls[0][0]).to.contain('preferCanvas');
			} finally {
				spy.mockRestore();
			}
		});
	});
});
