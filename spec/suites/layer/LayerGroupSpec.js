import {expect, vi} from 'vite-plus/test';
import {GeoJSON, Layer, Marker, LayerGroup} from 'maplair';

describe('LayerGroup', () => {
	describe('#hasLayer', () => {
		it('throws when called without proper argument', () => {
			const lg = new LayerGroup();
			const hasLayer = lg.hasLayer.bind(lg);
			expect(() => hasLayer(new Layer())).to.not.throw(); // control case

			expect(() => hasLayer(undefined)).to.throw();
			expect(() => hasLayer(null)).to.throw();
			expect(() => hasLayer(false)).to.throw();
			expect(() => hasLayer()).to.throw();
		});
	});

	describe('#addLayer', () => {
		it('adds a layer', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]);

			expect(lg.addLayer(marker)).to.eql(lg);

			expect(lg.hasLayer(marker)).to.be.true;
		});
	});

	describe('layeradd and layerremove events', () => {
		it('fires layeradd when a layer is added, once', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]),
			spy = vi.fn();
			lg.on('layeradd', spy);

			expect(lg.addLayer(marker)).to.equal(lg);
			lg.addLayer(marker);
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0].layer).to.equal(marker);
			expect(spy.mock.calls[0][0].target).to.equal(lg);
		});

		it('fires layerremove when a layer is removed, also by its id', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]),
			spy = vi.fn();
			lg.addLayer(marker).on('layerremove', spy);

			expect(lg.removeLayer(lg.getLayerId(marker))).to.equal(lg);
			lg.removeLayer(marker);
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0].layer).to.equal(marker);
		});
	});

	describe('#removeLayer', () => {
		it('removes a layer', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]);

			lg.addLayer(marker);
			expect(lg.removeLayer(marker)).to.eql(lg);

			expect(lg.hasLayer(marker)).to.be.false;
		});

		it('removes a layer by id and ignores an unknown id', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]);

			lg.addLayer(marker);
			expect(lg.removeLayer(12345)).to.eql(lg);
			expect(lg.hasLayer(marker)).to.be.true;

			lg.removeLayer(lg.getLayerId(marker));
			expect(lg.hasLayer(marker)).to.be.false;
		});
	});

	describe('#clearLayers', () => {
		it('removes all layers', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]);

			lg.addLayer(marker);
			expect(lg.clearLayers()).to.eql(lg);

			expect(lg.hasLayer(marker)).to.be.false;
		});
	});

	describe('#getLayers', () => {
		it('gets all layers', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]);

			lg.addLayer(marker);

			expect(lg.getLayers()).to.eql([marker]);
		});
	});

	describe('#eachLayer', () => {
		it('iterates over all layers', () => {
			const lg = new LayerGroup(),
			marker = new Marker([0, 0]),
			ctx = {foo: 'bar'};

			lg.addLayer(marker);

			lg.eachLayer(function (layer) {
				expect(layer).to.eql(marker);
				expect(this).to.eql(ctx);
			}, ctx);
		});
	});

	describe('#toGeoJSON', () => {
		it('should return valid GeoJSON for a layer with a FeatureCollection', () => {
			const geoJSON = {
				'type': 'FeatureCollection',
				'features': [
					{
						'type': 'Feature',
						'properties': {},
						'geometry': {
							'type': 'Point',
							'coordinates': [78.3984375, 56.9449741808516]
						}
					}
				]
			};

			const lg = new LayerGroup();
			const layer = new GeoJSON(geoJSON);
			lg.addLayer(layer);

			new GeoJSON(lg.toGeoJSON());
		});
	});
});
