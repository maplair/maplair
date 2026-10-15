import {expect} from 'chai';
import {MaplairMap, Circle} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Renderer', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('preferCanvas', () => {
		it('when false → there\'s a SVG in a map pane', () => {
			map = new MaplairMap(container, {preferCanvas: false});
			map.setView([55.8, 37.6], 6);

			new Circle([55.8, 37.6]).addTo(map);

			expect(container.querySelector('.maplair-pane svg path')).to.be.instanceOf(SVGPathElement);
			expect(container.querySelector('.maplair-pane canvas')).to.be.null;
		});

		it('when true → there\'s a canvas in a map pane', () => {
			map = new MaplairMap(container, {preferCanvas: true});
			map.setView([55.8, 37.6], 6);

			new Circle([55.8, 37.6]).addTo(map);

			expect(container.querySelector('.maplair-pane svg path')).to.be.null;
			expect(container.querySelector('.maplair-pane canvas')).to.be.instanceOf(HTMLCanvasElement);
		});
	});
});
