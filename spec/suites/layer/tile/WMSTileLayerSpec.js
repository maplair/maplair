import {expect} from 'vite-plus/test';
import {MaplairMap, WMSTileLayer} from 'maplair';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('WMSTileLayer', () => {
	describe('constructor', () => {
		it('sets wmsParams', () => {
			const layer = new WMSTileLayer('https://example.com/map', {opacity: 0.5, attribution: 'foo'});
			expect(layer.wmsParams).to.eql({
				...WMSTileLayer.defaultWmsParams,
				width: 256,
				height: 256
			});
		});
	});

	describe('#getLegendUrl', () => {
		function params(url) {
			return Object.fromEntries(new URL(url).searchParams);
		}

		it('requests the legend of the first layer', () => {
			const layer = new WMSTileLayer('https://example.com/wms?map=demo', {layers: 'roads,rivers', styles: 'thin,blue', format: 'image/png'});
			expect(params(layer.getLegendUrl())).to.eql({
				map: 'demo',
				service: 'WMS',
				request: 'GetLegendGraphic',
				version: '1.1.1',
				format: 'image/png',
				layer: 'roads',
				style: 'thin'
			});
		});

		it('adds the SLD version for WMS 1.3 and changes or adds parameters', () => {
			const layer = new WMSTileLayer('https://example.com/wms', {layers: 'roads', version: '1.3.0'});
			expect(params(layer.getLegendUrl({layer: 'rivers', width: 20, height: 20, legend_options: 'fontSize:9'}))).to.eql({
				service: 'WMS',
				request: 'GetLegendGraphic',
				version: '1.3.0',
				format: 'image/jpeg',
				layer: 'rivers',
				sld_version: '1.1.0',
				width: '20',
				height: '20',
				legend_options: 'fontSize:9'
			});
		});

		it('uses uppercase parameters with the uppercase option', () => {
			const layer = new WMSTileLayer('https://example.com/wms', {layers: 'roads', uppercase: true});
			const url = new URL(layer.getLegendUrl());
			expect(url.searchParams.get('REQUEST')).to.equal('GetLegendGraphic');
			expect(url.searchParams.get('LAYER')).to.equal('roads');
		});
	});

	describe('#getTileUrl', () => {
		let container, map;

		beforeEach(() => {
			container = createContainer();
			map = new MaplairMap(container).setView([0, 0], 0);
		});

		afterEach(() => {
			removeMapContainer(map, container);
		});

		it('accepts a relative service URL', () => {
			const layer = new WMSTileLayer('/wms?map=foo', {layers: 'roads'}).addTo(map);
			const url = new URL(layer.getContainer().querySelector('img').src);

			expect(url.origin).to.equal(location.origin);
			expect(url.pathname).to.equal('/wms');
			expect(url.searchParams.get('map')).to.equal('foo');
			expect(url.searchParams.get('layers')).to.equal('roads');
		});
	});
});
