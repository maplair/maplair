import {expect, vi} from 'vite-plus/test';
import {Canvas, Circle, CircleMarker, DomEvent, LayerGroup, MaplairMap, Marker, Polygon, Polyline, SVG, Util} from 'maplair';
import Hand from 'prosthetic-hand';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('Canvas', () => {
	let container, map, latLngs;

	function p2ll(x, y) {
		return map.layerPointToLatLng([x, y]);
	}

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {renderer: new Canvas(), zoomControl: false});
		map.setView([0, 0], 6);
		latLngs = [p2ll(0, 0), p2ll(0, 100), p2ll(100, 100), p2ll(100, 0)];
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('#events', () => {
		let layer;

		beforeEach(() => {
			layer = new Polygon(latLngs).addTo(map);
		});

		it('should fire event when layer contains mouse', () => {
			const spy = vi.fn();
			layer.on('click', spy);
			UIEventSimulator.fireAt('click', 50, 50);  // Click on the layer.
			expect(spy).toHaveBeenCalledTimes(1);
			UIEventSimulator.fireAt('click', 150, 150);  // Click outside layer.
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('DOM events propagate from canvas polygon to map', () => {
			const spy = vi.fn();
			map.on('click', spy);
			UIEventSimulator.fireAt('click', 50, 50);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('DOM events fired on canvas polygon can be cancelled before being caught by the map', () => {
			const mapSpy = vi.fn();
			const layerSpy = vi.fn();
			map.on('click', mapSpy);
			layer.on('click', DomEvent.stopPropagation).on('click', layerSpy);
			UIEventSimulator.fireAt('click', 50, 50);
			expect(layerSpy).toHaveBeenCalledTimes(1);
			expect(mapSpy).toHaveBeenCalledTimes(0);
		});

		it('DOM events fired on canvas polygon are propagated only once to the map even when two layers contains the event', () => {
			const spy = vi.fn();
			new Polygon(latLngs).addTo(map); // layer 2
			map.on('click', spy);
			UIEventSimulator.fireAt('click', 50, 50);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('should be transparent for DOM events going to non-canvas features', () => {
			const marker = new Marker(map.layerPointToLatLng([150, 150]))
				.addTo(map);
			const circle = new Circle(map.layerPointToLatLng([200, 200]), {
				radius: 20000,
				renderer: new SVG()
			}).addTo(map);

			const spyPolygon = vi.fn();
			const spyMap = vi.fn();
			const spyMarker = vi.fn();
			const spyCircle = vi.fn();
			layer.on('click', spyPolygon);
			map.on('click', spyMap);
			marker.on('click', spyMarker);
			circle.on('click', spyCircle);

			UIEventSimulator.fireAt('click', 50, 50);   // polygon (canvas)
			UIEventSimulator.fireAt('click', 151, 151); // empty space
			UIEventSimulator.fireAt('click', 150, 148); // marker
			UIEventSimulator.fireAt('click', 200, 200); // circle (svg)
			expect(spyPolygon).toHaveBeenCalledTimes(1);
			expect(spyMap).toHaveBeenCalledTimes(3); // except marker
			expect(spyMarker).toHaveBeenCalledTimes(1);
			expect(spyCircle).toHaveBeenCalledTimes(1);
		});

		it('should not block pointermove event going to non-canvas features', () => {
			const spyMap = vi.fn();
			map.on('pointermove', spyMap);
			UIEventSimulator.fireAt('pointermove', 151, 151); // empty space
			expect(spyMap).toHaveBeenCalledOnce();
		});

		it('should fire preclick before click', () => {
			const clickSpy = vi.fn();
			const preclickSpy = vi.fn();
			layer.on('click', clickSpy);
			layer.on('preclick', preclickSpy);
			layer.once('preclick', () => {
				expect(clickSpy).not.toHaveBeenCalled();
			});
			UIEventSimulator.fireAt('click', 50, 50);  // Click on the layer.
			expect(clickSpy).toHaveBeenCalledTimes(1);
			expect(preclickSpy).toHaveBeenCalledTimes(1);
			UIEventSimulator.fireAt('click', 150, 150);  // Click outside layer.
			expect(clickSpy).toHaveBeenCalledTimes(1);
			expect(preclickSpy).toHaveBeenCalledTimes(1);
		});

		it('should not fire click when dragging the map on top of it', (done) => {
			const downSpy = vi.fn();
			const clickSpy = vi.fn();
			const preclickSpy = vi.fn();
			layer.on('click', clickSpy);
			layer.on('preclick', preclickSpy);
			layer.on('pointerdown', downSpy);
			const hand = new Hand({
				timing: 'fastframe',
				onStop() {
					// Prosthetic does not fire a click when we down+up, but it real world
					// browsers would, so let's simulate it.
					UIEventSimulator.fireAt('click', 70, 60);
					expect(downSpy).toHaveBeenCalled();
					expect(clickSpy).not.toHaveBeenCalled();
					expect(preclickSpy).not.toHaveBeenCalled();
					done();
				}
			});
			const mouse = hand.growFinger('pointer');

			// We move 5 pixels first to overcome the 3-pixel threshold of Draggable.
			mouse.moveTo(50, 50, 0)
				.down().moveBy(20, 10, 200).up();
		});

		it('does fire pointerdown on layer after dragging map', (done) => { // #7775
			const spy = vi.fn();
			const center = p2ll(300, 300);
			const radius = p2ll(200, 200).distanceTo(center);
			const circle = new Circle(center, {radius}).addTo(map);
			circle.on('pointerdown', spy);

			const hand = new Hand({
				timing: 'fastframe',
				onStop() {
					expect(spy).toHaveBeenCalledTimes(2);
					done();
				}
			});
			const mouse = hand.growFinger('pointer');

			mouse.wait(100)
				.moveTo(300, 300, 0).down().moveBy(5, 0, 20).up()  // control case
				.moveTo(100, 100, 0).down().moveBy(5, 0, 20).up()  // drag the map (outside of circle)
				.moveTo(300, 300, 0).down().moveBy(5, 0, 20).up(); // expect pointerdown ok
		});
	});

	describe('#events(interactive=false)', () => {
		it('should not fire click when not interactive', () => {
			const layer = new Polygon(latLngs, {interactive: false}).addTo(map);
			const spy = vi.fn();
			layer.on('click', spy);
			UIEventSimulator.fireAt('click', 50, 50);  // Click on the layer.
			expect(spy).toHaveBeenCalledTimes(0);
			UIEventSimulator.fireAt('click', 150, 150);  // Click outside layer.
			expect(spy).toHaveBeenCalledTimes(0);
		});
	});

	describe('#dashArray', () => {
		it('can add polyline with dashArray', () => {
			new Polygon(latLngs, {
				dashArray: '5,5'
			}).addTo(map);
		});

		it('can setStyle with dashArray', () => {
			const layer = new Polygon(latLngs).addTo(map);
			layer.setStyle({
				dashArray: '5,5'
			});
		});
	});

	it('removes vector on next animation frame', (done) => {
		const layer = new Circle([0, 0]).addTo(map),
		layerId = Util.stamp(layer),
		canvas = map.getRenderer(layer);

		expect(canvas._layers).to.have.property(layerId);

		map.removeLayer(layer);
		// Defer check due to how Canvas renderer manages layer removal.
		requestAnimationFrame(() => {
			expect(canvas._layers).to.not.have.property(layerId);
			done();
		});
	});

	it('adds vectors even if they have been removed just before', (done) => {
		const layer = new Circle([0, 0]).addTo(map),
		layerId = Util.stamp(layer),
		canvas = map.getRenderer(layer);

		expect(canvas._layers).to.have.property(layerId);

		map.removeLayer(layer);
		map.addLayer(layer);
		expect(canvas._layers).to.have.property(layerId);
		// Re-perform a deferred check due to how Canvas renderer manages layer removal.
		requestAnimationFrame(() => {
			expect(canvas._layers).to.have.property(layerId);
			done();
		});
	});

	it('adds vectors even if the canvas container was removed', (done) => {
		const layer = new Circle([0, 0]).addTo(map);
		map.eachLayer((layer) => {
			map.removeLayer(layer);
		});

		const spy = vi.fn();
		const canvas = map.getRenderer(layer);
		canvas._redraw = spy;

		map.addLayer(layer);

		// Double requestAnimationFrame needed: first to schedule the _redraw, second to verify it executed
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				expect(spy).toHaveBeenCalledTimes(1);
				done();
			});
		});
	});

	describe('#bringToBack', () => {
		it('is a no-op for layers not on a map', () => {
			const path = new Polyline([[1, 2], [3, 4], [5, 6]]);
			expect(path.bringToBack()).to.equal(path);
		});

		it('is a no-op for layers no longer in a LayerGroup', () => {
			const group = new LayerGroup().addTo(map);
			const path = new Polyline([[1, 2], [3, 4], [5, 6]]).addTo(group);

			group.clearLayers();

			expect(path.bringToBack()).to.equal(path);
		});
	});

	describe('#bringToFront', () => {
		it('is a no-op for layers not on a map', () => {
			const path = new Polyline([[1, 2], [3, 4], [5, 6]]);
			expect(path.bringToFront()).to.equal(path);
		});

		it('is a no-op for layers no longer in a LayerGroup', () => {
			const group = new LayerGroup().addTo(map);
			const path = new Polyline([[1, 2], [3, 4], [5, 6]]).addTo(group);

			group.clearLayers();

			expect(path.bringToFront()).to.equal(path);
		});
	});

	describe('Canvas #remove', () => {
		it('can remove the map without errors', (done) => {
			new Polygon(latLngs).addTo(map);
			map.remove();
			map = null;
			requestAnimationFrame(() => { done(); });
		});

		it('can remove renderer without errors', (done) => {
			map.remove();

			const canvas = new Canvas();
			map = new MaplairMap(container, {renderer: canvas});
			map.setView([0, 0], 6);
			new Polygon(latLngs).addTo(map);

			canvas.remove();
			map.remove();
			map = null;
			requestAnimationFrame(() => { done(); });
		});
	});

	describe('#_containsPoint', () => {
		it('detects point inside polygon', () => {
			const polygon = new Polygon([
				[-5, -5],
				[-5, 5],
				[5, 5],
				[5, -5]
			]).addTo(map);

			expect(polygon._containsPoint(map.latLngToLayerPoint([5, 5]))).to.be.true;
			expect(polygon._containsPoint(map.latLngToLayerPoint([-5, -5]))).to.be.true;
			expect(polygon._containsPoint(map.latLngToLayerPoint([0, 0]))).to.be.true;
			expect(polygon._containsPoint(map.latLngToLayerPoint([-5, 5]))).to.be.true;
		});

		it('does not detect point outside polygon', () => {
			const polygon = new Polygon([
				[-5, -5],
				[-5, 5],
				[5, 5],
				[5, -5]
			]).addTo(map);

			expect(polygon._containsPoint(map.latLngToLayerPoint([-5.1, 5]))).to.be.false;
			expect(polygon._containsPoint(map.latLngToLayerPoint([0, 7]))).to.be.false;
		});

		it('does not detect point which is outside of rendered polygon but is inside of polygon coords', () => {
			// TODO: Is this a wanted behavior? The point is inside the polygon but outside of the rendered area, so it is not detected as inside. Maybe we should detect it as inside anyway?
			const polygon = new Polygon([
				[0, 0],
				[0, 10],
				[10, 10], // outside of rendered area
				[10, 0]
			]).addTo(map);

			expect(polygon._containsPoint(map.latLngToLayerPoint([9, 9]))).to.be.false;
		});

		it('does detect point in multi-polygon correctly', () => {
			const polygon = new Polygon([
				[
					[-5, -5],
					[-5, 5],
					[5, 5],
					[5, -5]
				],
				[
					[3, 3],
					[3, 7],
					[7, 7],
					[7, 3]
				]
			]).addTo(map);

			expect(polygon._containsPoint(map.latLngToLayerPoint([4, 4]))).to.be.false; // inside the hole
			expect(polygon._containsPoint(map.latLngToLayerPoint([5, 5]))).to.be.true;
		});

		it('detects point on the line', () => {
			const line = new Polyline([[-5, -5], [0, -5]]).addTo(map);
			expect(line._containsPoint(map.latLngToLayerPoint([-5, -5]))).to.be.true;
			expect(line._containsPoint(map.latLngToLayerPoint([-2.5, -5]))).to.be.true;
			expect(line._containsPoint(map.latLngToLayerPoint([0, -5]))).to.be.true;
		});

		it('does not detect point on the line', () => {
			const line = new Polyline([[-5, -5], [0, -5]]).addTo(map);
			expect(line._containsPoint(map.latLngToLayerPoint([-10, -5]))).to.be.false;
			expect(line._containsPoint(map.latLngToLayerPoint([0, 0]))).to.be.false;
			expect(line._containsPoint(map.latLngToLayerPoint([-5.1, -5]))).to.be.false;
			expect(line._containsPoint(map.latLngToLayerPoint([-5, -5.1]))).to.be.false;
		});

		it('detects point in circle marker', () => {
			const circlemarker = new CircleMarker([0, 0], {radius: 10}).addTo(map);
			expect(circlemarker._containsPoint(map.latLngToLayerPoint([0, 0]))).to.be.true;
			expect(circlemarker._containsPoint(map.latLngToLayerPoint([20, 0]))).to.be.false;
		});
	});
});
