import {expect} from 'vite-plus/test';
import {GridLayer, ImageOverlay, MaplairMap, VideoOverlay} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('pixelated option', () => {
	let container, map;
	const bounds = [[-10, -10], [10, 10]];
	const image = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView([0, 0], 3);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function imageGridLayer(options) {
		const grid = new GridLayer(options);
		grid.createTile = function () {
			const tile = document.createElement('img');
			tile.src = image;
			return tile;
		};
		return grid.addTo(map);
	}

	function imageRendering(el) {
		return getComputedStyle(el).imageRendering;
	}

	it('scales the tiles of a grid layer pixelated', () => {
		const grid = imageGridLayer({pixelated: true});
		const tiles = grid.getContainer().querySelectorAll('.maplair-tile');
		expect(tiles.length).to.be.greaterThan(0);
		for (const tile of tiles) {
			expect(imageRendering(tile)).to.equal('pixelated');
		}
	});

	it('keeps the default scaling of grid layers', () => {
		const grid = imageGridLayer();
		expect(grid.getContainer().classList.contains('maplair-pixelated')).to.be.false;
		expect(imageRendering(grid.getContainer().querySelector('.maplair-tile'))).to.equal('auto');
	});

	it('overrides the image rendering for Safari', () => {
		container.classList.add('maplair-safari');
		const grid = imageGridLayer({pixelated: true});
		expect(imageRendering(grid.getContainer().querySelector('.maplair-tile'))).to.equal('pixelated');
	});

	it('scales an image overlay pixelated', () => {
		const overlay = new ImageOverlay(image, bounds, {pixelated: true}).addTo(map);
		expect(imageRendering(overlay.getElement())).to.equal('pixelated');

		const regular = new ImageOverlay(image, bounds).addTo(map);
		expect(imageRendering(regular.getElement())).to.equal('auto');
	});

	it('scales a video overlay pixelated', () => {
		const overlay = new VideoOverlay([], bounds, {pixelated: true}).addTo(map);
		expect(imageRendering(overlay.getElement())).to.equal('pixelated');
	});
});
