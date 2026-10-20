import {expect, vi} from 'vite-plus/test';
import {FeatureGroup, Layer, MaplairMap, Marker, Polygon, Popup} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Layer', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);
		map.setView([0, 0], 1);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('lifecycle of a plugin layer', () => {
		class MyLayer extends Layer {
			constructor(log) {
				super();
				this.log = log;
			}
			beforeAdd(map) { this.log.push(['beforeAdd', map]); }
			onAdd(map) { this.log.push(['onAdd', map]); }
			onRemove(map) { this.log.push(['onRemove', map]); }
			getEvents() { return {zoom: this._onZoom}; }
			_onZoom() { this.log.push(['zoom']); }
		}

		it('calls the extension methods and fires add and remove in order', () => {
			const log = [];
			const layer = new MyLayer(log);
			layer.on('add', () => log.push(['add']));
			layer.on('remove', () => log.push(['remove']));

			layer.addTo(map);
			map.setZoom(2, {animate: false});
			layer.remove();
			map.setZoom(3, {animate: false});

			expect(log).to.eql([['beforeAdd', map], ['onAdd', map], ['add'], ['zoom'], ['onRemove', map], ['remove']]);
		});

		it('calls beforeAdd before the map has a view', () => {
			const otherContainer = createContainer();
			const otherMap = new MaplairMap(otherContainer);
			const log = [];

			new MyLayer(log).addTo(otherMap);
			expect(log).to.eql([['beforeAdd', otherMap]]);

			otherMap.setView([0, 0], 1);
			expect(log).to.eql([['beforeAdd', otherMap], ['onAdd', otherMap]]);

			removeMapContainer(otherMap, otherContainer);
		});
	});

	describe('extending the prototype', () => {
		afterEach(() => {
			delete Layer.prototype.myPlugin;
			delete Layer.prototype.myMethod;
		});

		it('reaches built-in layers through methods and accessors', () => {
			Layer.include({myMethod() { return this; }});
			Object.defineProperty(Layer.prototype, 'myPlugin', {
				configurable: true,
				get() { return (this._myPlugin ??= {layer: this}); }
			});

			const marker = new Marker([0, 0]);
			const polygon = new Polygon([[0, 0], [0, 1], [1, 1]]);

			expect(marker.myMethod()).to.equal(marker);
			expect(polygon.myPlugin.layer).to.equal(polygon);
			expect(polygon.myPlugin).to.equal(polygon.myPlugin);
		});

		it('lets a plugin wrap bindPopup for all layers', () => {
			const bindPopup = vi.spyOn(Layer.prototype, 'bindPopup');
			try {
				const marker = new Marker([0, 0]).bindPopup('Hi');
				expect(bindPopup).toHaveBeenCalledExactlyOnceWith('Hi');
				expect(marker.getPopup()).to.be.instanceOf(Popup);
			} finally {
				bindPopup.mockRestore();
			}
		});
	});

	describe('popups and tooltips', () => {
		it('still share the layer lifecycle', () => {
			const popup = new Popup([0, 0], {content: 'Hi'});
			const add = vi.fn();
			popup.on('add', add);

			popup.addTo(map);
			expect(add).toHaveBeenCalledOnce();
			expect(map.hasLayer(popup)).to.be.true;
			expect(popup.getPane()).to.equal(map.getPane('popupPane'));

			popup.remove();
			expect(map.hasLayer(popup)).to.be.false;
		});

		it('open on a layer of a feature group that is on the map', () => {
			const hidden = new Marker([0, 0]);
			const shown = new Marker([10, 10]).addTo(map);
			const group = new FeatureGroup([hidden, shown]);
			map.addLayer(group);
			map.removeLayer(hidden);

			group.bindTooltip('Hi', {permanent: false}).openTooltip();
			expect(group.getTooltip()._source).to.equal(shown);
			expect(group.getTooltip().getLatLng()).to.eql(shown.getLatLng());
		});
	});
});
