import {expect, vi} from 'vite-plus/test';
import {DefaultIcon, MaplairMap, Marker} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('DefaultIcon', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);

		map.setView([0, 0], 0);
		new Marker([0, 0]).addTo(map);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	it('icon measures 25x41px', () => {
		const img = map.getPane('markerPane').querySelector('img');
		expect(img.clientHeight).to.equal(41);
		expect(img.clientWidth).to.equal(25);
	});

	it('shadow measures 41x41px', () => {
		const img = map.getPane('shadowPane').querySelector('img');
		expect(img.clientHeight).to.equal(41);
		expect(img.clientWidth).to.equal(41);
	});

	it('don\'t set shadow icon if null', () => {
		const oldShadowUrl = DefaultIcon.defaultOptions.shadowUrl;
		DefaultIcon.defaultOptions.shadowUrl = null;
		const marker = new Marker([0, 0]).addTo(map);

		expect(marker._shadow).to.be.null;

		// This is needed because else other tests will fail
		DefaultIcon.defaultOptions.shadowUrl = oldShadowUrl;
	});

	it('don\'t set retina shadow icon if null', () => {
		const oldShadowRetinaUrl = DefaultIcon.defaultOptions.shadowRetinaUrl;
		const oldShadowUrl = DefaultIcon.defaultOptions.shadowUrl;
		vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
		DefaultIcon.defaultOptions.shadowRetinaUrl = null;
		DefaultIcon.defaultOptions.shadowUrl = null;
		const marker = new Marker([0, 0]).addTo(map);

		expect(marker._shadow).to.be.null;

		// This is needed because else other tests will fail
		DefaultIcon.defaultOptions.shadowRetinaUrl = oldShadowRetinaUrl;
		DefaultIcon.defaultOptions.shadowUrl = oldShadowUrl;
		vi.restoreAllMocks();
	});

	it('paints the pin in the given color', () => {
		const icon = new DefaultIcon({iconUrl: 'red.png', color: '#c00'});
		expect(icon._getIconUrl('icon')).to.contain('stop-color="%23c00"');
		expect(icon._getIconUrl('icon')).to.contain('<path fill="%23FFF"'); // still the maple leaf
		expect(icon._getIconUrl('shadow')).to.equal(DefaultIcon.defaultOptions.shadowUrl);
	});

	it('encodes colors for the data URI', () => {
		const src = new DefaultIcon({color: 'hsl(280 60% 50%)'})._getIconUrl('icon');
		expect(src).to.contain('stop-color="hsl(280%2060%25%2050%25)"');
		expect(() => decodeURIComponent(src)).not.to.throw();
	});
});
