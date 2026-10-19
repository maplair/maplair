import {expect, vi} from 'vite-plus/test';
import {LayersControl, MaplairMap, Marker, TileLayer, Util} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, pointerType, removeMapContainer} from '../SpecHelper.js';

const groupPattern = /^([^<>()]+) \((.+)\)$/;

function groupBy(name) {
	const [, group, label] = groupPattern.exec(name) ?? [];
	return group ? {group: `${group}:`, label} : undefined;
}

// labels of the entries of a layers control as text, groups in square brackets
function labels(control) {
	return Array.from(control.getContainer().querySelectorAll('.maplair-control-layers-list > * > *'), el => (
		el.classList.contains('maplair-control-layers-group') ?
			`[${Array.from(el.children, child => child.textContent.trim()).join(' ')}]` :
			el.textContent.trim()
	)).join(' ');
}

describe('LayersControl', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);

		map.setView([0, 0], 14);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('baselayerchange event', () => {
		it('is fired on input that changes the base layer', () => {
			const baseLayers = {'Layer 1': new TileLayer(''), 'Layer 2': new TileLayer('')},
			layers = new LayersControl(baseLayers).addTo(map),
			spy = vi.fn();

			map.on('baselayerchange', spy);
			UIEventSimulator.fire('click', layers._baseLayersList.getElementsByTagName('input')[0]);
			expect(spy).toHaveBeenCalled();
			expect(spy.mock.calls[0][0].name).to.equal('Layer 1');
			expect(spy.mock.calls[0][0].layer).to.equal(baseLayers['Layer 1']);
			UIEventSimulator.fire('click', layers._baseLayersList.getElementsByTagName('input')[1]);
			expect(spy).toHaveBeenCalledTimes(2);
			expect(spy.mock.calls[1][0].name).to.equal('Layer 2');
			expect(spy.mock.calls[1][0].layer).to.equal(baseLayers['Layer 2']);
		});

		it('works after removing and readding the LayersControl to the map', () => {
			const baseLayers = {'Layer 1': new TileLayer(''), 'Layer 2': new TileLayer('')},
			layers = new LayersControl(baseLayers).addTo(map),
			spy = vi.fn();

			map.on('baselayerchange', spy);

			map.removeControl(layers);
			map.addControl(layers);

			UIEventSimulator.fire('click', layers._baseLayersList.getElementsByTagName('input')[0]);
			expect(spy).toHaveBeenCalled();
			expect(spy.mock.calls[0][0].name).to.equal('Layer 1');
			expect(spy.mock.calls[0][0].layer).to.equal(baseLayers['Layer 1']);
			UIEventSimulator.fire('click', layers._baseLayersList.getElementsByTagName('input')[1]);
			expect(spy).toHaveBeenCalledTimes(2);
			expect(spy.mock.calls[1][0].name).to.equal('Layer 2');
			expect(spy.mock.calls[1][0].layer).to.equal(baseLayers['Layer 2']);
		});

		it('is not fired on input that doesn\'t change the base layer', () => {
			const overlays = {'Marker 1': new Marker([0, 0]), 'Marker 2': new Marker([0, 0])},
			layers = new LayersControl({}, overlays).addTo(map),
			spy = vi.fn();

			map.on('baselayerchange', spy);
			UIEventSimulator.fire('click', layers._overlaysList.getElementsByTagName('input')[0]);

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('updates', () => {
		it('when an included layer is added or removed from the map', () => {
			const baseLayer = new TileLayer(),
			overlay = new Marker([0, 0]),
			layers = new LayersControl({'Base': baseLayer}, {'Overlay': overlay}).addTo(map);

			const spy = vi.spyOn(layers, '_update');

			map.addLayer(overlay);
			map.removeLayer(overlay);

			expect(spy).toHaveBeenCalled();
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('when an included layer is added or removed from the map, it\'s (un)checked', () => {
			const baseLayer = new TileLayer(),
			overlay = new Marker([0, 0]);
			new LayersControl({'Baselayer': baseLayer}, {'Overlay': overlay}).addTo(map);

			function isChecked() {
				return !!(map._container.querySelector('.maplair-control-layers-overlays input').checked);
			}

			expect(isChecked()).to.be.false;
			map.addLayer(overlay);
			expect(isChecked()).to.be.true;
			map.removeLayer(overlay);
			expect(isChecked()).to.be.false;
		});

		it('not when a non-included layer is added or removed', () => {
			const baseLayer = new TileLayer(),
			overlay = new Marker([0, 0]),
			layers = new LayersControl({'Base': baseLayer}).addTo(map);

			const spy = vi.spyOn(layers, '_update');

			map.addLayer(overlay);
			map.removeLayer(overlay);

			expect(spy).not.toHaveBeenCalled();
		});

		it('updates when an included layer is removed from the control', () => {
			const baseLayer = new TileLayer(),
			overlay = new Marker([0, 0]),
			layers = new LayersControl({'Base': baseLayer}, {'Overlay': overlay}).addTo(map);

			layers.removeLayer(overlay);
			expect(map._container.querySelector('.maplair-control-layers-overlays').children.length)
				.to.be.equal(0);
		});

		it('silently returns when trying to remove a non-existing layer from the control', () => {
			const layers = new LayersControl({'base': new TileLayer()}).addTo(map);

			expect(() => {
				layers.removeLayer(new Marker([0, 0]));
			}).to.not.throw();

			expect(layers._layers.length).to.be.equal(1);
		});

		it('having repeated layers works as expected', () => {
			const layerA = new TileLayer(''), layerB = new TileLayer(''),
			baseLayers = {'Layer 1': layerA, 'Layer 2': layerB, 'Layer 3': layerA},
			layers = new LayersControl(baseLayers).addTo(map);

			function checkInputs(idx) {
				const inputs = map._container.querySelectorAll('.maplair-control-layers-base input');
				for (let i = 0; i < inputs.length; i++) {
					expect(inputs[i].checked === (idx === i)).to.be.true;
				}
			}

			UIEventSimulator.fire('click', layers._baseLayersList.getElementsByTagName('input')[1]);
			checkInputs(1);
			expect(map._layers[Util.stamp(layerB)]).to.be.equal(layerB);
			expect(map._layers[Util.stamp(layerA)]).to.be.equal(undefined);
			UIEventSimulator.fire('click', layers._baseLayersList.getElementsByTagName('input')[0]);
			checkInputs(0);
			expect(map._layers[Util.stamp(layerA)]).to.be.equal(layerA);
			expect(map._layers[Util.stamp(layerB)]).to.be.equal(undefined);
			UIEventSimulator.fire('click', layers._baseLayersList.getElementsByTagName('input')[2]);
			checkInputs(2);
			expect(map._layers[Util.stamp(layerA)]).to.be.equal(layerA);
			expect(map._layers[Util.stamp(layerB)]).to.be.equal(undefined);
		});
	});

	describe('is removed cleanly', () => {
		it('and layers in the control can still be removed', () => {
			const baseLayer = new TileLayer('').addTo(map);
			const layersCtrl = new LayersControl({'Base': baseLayer}).addTo(map);
			map.removeControl(layersCtrl);

			expect(() => {
				map.removeLayer(baseLayer);
			}).to.not.throw();
		});

		it('and layers in the control can still be removed when added after removing control from map', () => {
			const baseLayer = new TileLayer('').addTo(map);
			const layersCtrl = new LayersControl().addTo(map);
			map.removeControl(layersCtrl);
			layersCtrl.addBaseLayer(baseLayer, 'Base');

			expect(() => {
				map.removeLayer(baseLayer);
			}).to.not.throw();
		});
	});

	describe('is created with an expand link', ()  => {
		it('when collapsed', () => {
			new LayersControl(null, null, {collapsed: true}).addTo(map);
			expect(map._container.querySelector('.maplair-control-layers-toggle')).to.be.ok;
		});

		it('when not collapsed', () => {
			new LayersControl(null, null, {collapsed: false}).addTo(map);
			expect(map._container.querySelector('.maplair-control-layers-toggle')).to.be.ok;
		});
	});

	describe('collapse when collapsed: true', () => {
		it('expands on "Enter" keydown when toggle is focused', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: true}).addTo(map);
			const toggle = layersCtrl._container.querySelector('.maplair-control-layers-toggle');
			UIEventSimulator.fire('keydown', toggle, {code: 'Enter'});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.ok;
		});

		it('expands on click', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: true}).addTo(map);
			const toggle = layersCtrl._container.querySelector('.maplair-control-layers-toggle');
			UIEventSimulator.fire('click', toggle);
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.ok;
		});

		it('does not expand on "Enter" keydown when toggle is not focused', () => {
			new LayersControl(null, null, {collapsed: true}).addTo(map);
			UIEventSimulator.fire('keydown', document, {code: 'Enter'});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.null;
		});

		it('expands when mouse is over', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: true}).addTo(map);
			UIEventSimulator.fire('pointerenter', layersCtrl._container, {pointerType});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.ok;
		});

		it.skipIfTouch('collapses when mouse is out', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: true}).addTo(map);
			UIEventSimulator.fire('pointerenter', layersCtrl._container, {pointerType});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).not.to.be.null;
			UIEventSimulator.fire('pointerleave', layersCtrl._container, {pointerType});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.null;
		});

		it('collapses when map is clicked', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: true}).addTo(map);
			UIEventSimulator.fire('pointerenter', layersCtrl._container, {pointerType});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).not.to.be.null;
			UIEventSimulator.fire('click', map._container);
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.null;
		});

		it('should collapse with a delay', (done) => {
			const layersCtrl = new LayersControl(null, null, {collapsed: true, collapseDelay: 8}).addTo(map);
			UIEventSimulator.fire('pointerenter', layersCtrl._container, {pointerType});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).not.to.be.null;
			UIEventSimulator.fire('click', map._container);
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.ok;
			setTimeout(() => {
				expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.ok;
			}, 5);
			setTimeout(() => {
				expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.null;
				done();
			}, 10);
		});
	});

	describe('does not collapse when collapsed: false', () => {
		it('does not collapse when mouse enters or leaves', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: false}).addTo(map);
			expect(map._container.querySelector('.maplair-control-layers-expanded')).not.to.be.null;
			UIEventSimulator.fire('pointerenter', layersCtrl._container, {pointerType});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).not.to.be.null;
			UIEventSimulator.fire('pointerleave', layersCtrl._container, {pointerType});
			expect(map._container.querySelector('.maplair-control-layers-expanded')).not.to.be.null;
		});

		it('does not collapse when map is clicked', () => {
			new LayersControl(null, null, {collapsed: false}).addTo(map);
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.ok;
			UIEventSimulator.fire('click', map._container);
			expect(map._container.querySelector('.maplair-control-layers-expanded')).to.be.ok;
		});

		it('is scrollable if necessary when added on map', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: false});
			let i = 0;

			// Need to create a DIV with specified height and insert it into DOM, so that the browser
			// gives it an actual size.
			map.remove();
			container.style.height = container.style.width = '200px';
			map = new MaplairMap(container);

			for (; i < 20; i += 1) {
				// Default text size: 12px => 12 * 20 = 240px height (not even considering padding/margin).
				layersCtrl.addOverlay(new Marker([0, 0]), i);
			}

			layersCtrl.addTo(map);

			expect(container.clientHeight).to.be.greaterThan(0); // Make sure first that the map container has a height, otherwise this test is useless.
			expect(container.clientHeight).to.be.greaterThan(layersCtrl._container.clientHeight);
			expect(layersCtrl._section.classList.contains('maplair-control-layers-scrollbar')).to.be.true;
		});

		it('becomes scrollable if necessary when too many layers are added while it is already on map', () => {
			const layersCtrl = new LayersControl(null, null, {collapsed: false});
			let i = 0;

			// Need to create a DIV with specified height and insert it into DOM, so that the browser
			// gives it an actual size.
			map.remove();
			container.style.height = container.style.width = '200px';
			map = new MaplairMap(container);

			layersCtrl.addTo(map);
			expect(layersCtrl._section.classList.contains('maplair-control-layers-scrollbar')).to.be.false;

			for (; i < 20; i += 1) {
				// Default text size: 12px => 12 * 20 = 240px height (not even considering padding/margin).
				layersCtrl.addOverlay(new Marker([0, 0]), i);
			}

			expect(container.clientHeight).to.be.greaterThan(layersCtrl._container.clientHeight);
			expect(layersCtrl._section.classList.contains('maplair-control-layers-scrollbar')).to.be.true;
		});
	});

	describe('sortLayers', () => {
		it('keeps original order by default', () => {
			const baseLayerOne = new TileLayer('').addTo(map);
			const baseLayerTwo = new TileLayer('').addTo(map);
			const markerC = new Marker([0, 2]).addTo(map);
			const markerB = new Marker([0, 1]).addTo(map);
			const markerA = new Marker([0, 0]).addTo(map);

			new LayersControl({
				'Base One': baseLayerOne,
				'Base Two': baseLayerTwo
			}, {
				'Marker C': markerC,
				'Marker B': markerB,
				'Marker A': markerA
			}).addTo(map);

			const elems = map.getContainer().querySelectorAll('div.maplair-control-layers label span span');
			expect(elems[0].innerHTML.trim()).to.be.equal('Base One');
			expect(elems[1].innerHTML.trim()).to.be.equal('Base Two');
			expect(elems[2].innerHTML.trim()).to.be.equal('Marker C');
			expect(elems[3].innerHTML.trim()).to.be.equal('Marker B');
			expect(elems[4].innerHTML.trim()).to.be.equal('Marker A');
		});

		it('sorts alphabetically if no function is specified', () => {
			const baseLayerOne = new TileLayer('').addTo(map);
			const baseLayerTwo = new TileLayer('').addTo(map);
			const markerA = new Marker([0, 0]).addTo(map);
			const markerB = new Marker([0, 1]).addTo(map);
			const markerC = new Marker([0, 2]).addTo(map);

			new LayersControl({
				'Base Two': baseLayerTwo,
				'Base One': baseLayerOne
			}, {
				'Marker A': markerA,
				'Marker C': markerC,
				'Marker B': markerB
			}, {
				sortLayers: true
			}).addTo(map);

			const elems = map.getContainer().querySelectorAll('div.maplair-control-layers label span span');
			expect(elems[0].innerHTML.trim()).to.be.equal('Base One');
			expect(elems[1].innerHTML.trim()).to.be.equal('Base Two');
			expect(elems[2].innerHTML.trim()).to.be.equal('Marker A');
			expect(elems[3].innerHTML.trim()).to.be.equal('Marker B');
			expect(elems[4].innerHTML.trim()).to.be.equal('Marker C');
		});

		it('uses the compare function to sort layers', () => {
			const baseLayerOne = new TileLayer('', {customOption: 999}).addTo(map);
			const baseLayerTwo = new TileLayer('', {customOption: 998}).addTo(map);
			const markerA = new Marker([0, 0], {customOption: 102}).addTo(map);
			const markerB = new Marker([0, 1], {customOption: 100}).addTo(map);
			const markerC = new Marker([0, 2], {customOption: 101}).addTo(map);

			new LayersControl({
				'Base One': baseLayerOne,
				'Base Two': baseLayerTwo
			}, {
				'Marker A': markerA,
				'Marker B': markerB,
				'Marker C': markerC
			}, {
				sortLayers: true,
				sortFunction(a, b) { return a.options.customOption - b.options.customOption; }
			}).addTo(map);

			const elems = map.getContainer().querySelectorAll('div.maplair-control-layers label span span');
			expect(elems[0].innerHTML.trim()).to.be.equal('Base Two');
			expect(elems[1].innerHTML.trim()).to.be.equal('Base One');
			expect(elems[2].innerHTML.trim()).to.be.equal('Marker B');
			expect(elems[3].innerHTML.trim()).to.be.equal('Marker C');
			expect(elems[4].innerHTML.trim()).to.be.equal('Marker A');
		});
	});

	describe('inline', () => {
		it('is always expanded and has no toggle', () => {
			const layersCtrl = new LayersControl(null, null, {inline: true}).addTo(map);
			const container = layersCtrl.getContainer();
			expect(container.classList.contains('maplair-control-layers-inline')).to.be.true;
			expect(container.classList.contains('maplair-control-layers-expanded')).to.be.true;
			expect(container.querySelector('.maplair-control-layers-toggle')).to.be.null;
		});

		it('ignores collapsed: true and does not collapse', () => {
			const layersCtrl = new LayersControl(null, null, {inline: true, collapsed: true}).addTo(map);
			const container = layersCtrl.getContainer();
			UIEventSimulator.fire('pointerenter', container, {pointerType});
			UIEventSimulator.fire('pointerleave', container, {pointerType});
			UIEventSimulator.fire('click', map._container);
			layersCtrl.collapse();
			expect(container.classList.contains('maplair-control-layers-expanded')).to.be.true;
		});

		it('is not inline by default', () => {
			const layersCtrl = new LayersControl().addTo(map);
			expect(layersCtrl.getContainer().classList.contains('maplair-control-layers-inline')).to.be.false;
		});
	});

	describe('groupBy', () => {
		describe.each([false, true])('inline: %s', (inline) => {
			it('groups consecutive entries with names of the form "Group (label)"', () => {
				const control = new LayersControl({
					'Meldestufen (aktuell)': new TileLayer(''),
					'Meldestufen (aktuell bis 24 h)': new TileLayer(''),
					'Meldestufen (max. letzte 24 h)': new TileLayer(''),
					'Jährlichkeit (aktuell)': new TileLayer(''),
					'Datenaktualität (aktuell)': new TileLayer('')
				}, {'Extra (Landkreise)': new Marker([0, 0])}, {inline, groupBy}).addTo(map);

				expect(labels(control)).to.equal('[Meldestufen: aktuell aktuell bis 24 h max. letzte 24 h] [Jährlichkeit: aktuell] [Datenaktualität: aktuell] [Extra: Landkreise]');
			});

			it('keeps names without group and allows HTML in the label', () => {
				const control = new LayersControl(
					{'N-Radar': new TileLayer('')},
					{'Extra (<span class="gray">DWD-Wetterwarnungen (0)</span>)': new Marker([0, 0])},
					{inline, groupBy}
				).addTo(map);

				expect(labels(control)).to.equal('N-Radar [Extra: DWD-Wetterwarnungen (0)]');
				expect(control.getContainer().querySelector('label .gray')).not.to.be.null;
			});
		});

		it('renders the group name as text and labels the group', () => {
			const control = new LayersControl({}, {
				'<b>A</b> (1)': new Marker([0, 0])
			}, {groupBy: () => ({group: '<b>A</b>', label: 'one'})}).addTo(map);

			const group = control.getContainer().querySelector('.maplair-control-layers-group');
			const name = group.querySelector('.maplair-control-layers-group-name');
			expect(name.textContent).to.equal('<b>A</b>');
			expect(group.getAttribute('role')).to.equal('group');
			expect(group.getAttribute('aria-labelledby')).to.equal(name.id);
			expect(group.querySelector('label').textContent.trim()).to.equal('one');
		});

		it('passes name, layer and overlay to the function', () => {
			const base = new TileLayer(''), overlay = new Marker([0, 0]);
			const spy = vi.fn();
			new LayersControl({'Base': base}, {'Overlay': overlay}, {groupBy: spy}).addTo(map);
			expect(spy).toHaveBeenCalledWith('Base', base, false);
			expect(spy).toHaveBeenCalledWith('Overlay', overlay, true);
		});

		it('starts a new group for non-consecutive entries of the same group', () => {
			const control = new LayersControl({
				'A (1)': new TileLayer(''),
				'B': new TileLayer(''),
				'A (2)': new TileLayer('')
			}, null, {groupBy}).addTo(map);

			expect(labels(control)).to.equal('[A: 1] B [A: 2]');
		});

		it('groups base layers and overlays separately', () => {
			const control = new LayersControl(
				{'A (1)': new TileLayer('')},
				{'A (2)': new Marker([0, 0])},
				{groupBy}
			).addTo(map);

			expect(labels(control)).to.equal('[A: 1] [A: 2]');
		});

		it('groups after sorting', () => {
			const control = new LayersControl({
				'B (2)': new TileLayer(''),
				'A (1)': new TileLayer(''),
				'B (1)': new TileLayer('')
			}, null, {groupBy, sortLayers: true}).addTo(map);

			expect(labels(control)).to.equal('[A: 1] [B: 1 2]');
		});

		it('regroups when layers are added and removed', () => {
			const layerA2 = new TileLayer('');
			const control = new LayersControl({'A (1)': new TileLayer('')}, null, {groupBy}).addTo(map);
			control.addBaseLayer(layerA2, 'A (2)');
			expect(labels(control)).to.equal('[A: 1 2]');
			control.removeLayer(layerA2);
			expect(labels(control)).to.equal('[A: 1]');
		});

		it('hides a single grouped base layer with hideSingleBase', () => {
			const control = new LayersControl(
				{'A (1)': new TileLayer('')},
				{'B (1)': new Marker([0, 0])},
				{groupBy, hideSingleBase: true}
			).addTo(map);

			expect(control._baseLayersList.style.display).to.equal('none');
			expect(control._separator.style.display).to.equal('none');
		});

		it('fires baselayerchange with the full name', () => {
			const baseLayers = {'A (1)': new TileLayer(''), 'A (2)': new TileLayer('')},
			control = new LayersControl(baseLayers, null, {groupBy}).addTo(map),
			spy = vi.fn();

			map.on('baselayerchange', spy);
			UIEventSimulator.fire('click', control._baseLayersList.getElementsByTagName('input')[1]);
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0].name).to.equal('A (2)');
			expect(spy.mock.calls[0][0].layer).to.equal(baseLayers['A (2)']);
		});
	});

	describe('getLayers', () => {
		it('returns the entries in display order', () => {
			const baseB = new TileLayer(''), baseA = new TileLayer(''), overlay = new Marker([0, 0]);
			const control = new LayersControl({'B': baseB, 'A': baseA}, {'O': overlay}, {sortLayers: true});

			expect(control.getLayers()).to.deep.equal([
				{layer: baseA, name: 'A', overlay: false},
				{layer: baseB, name: 'B', overlay: false},
				{layer: overlay, name: 'O', overlay: true}
			]);

			control.removeLayer(baseB);
			expect(control.getLayers().map(({name}) => name)).to.deep.equal(['A', 'O']);
		});

		it('returns copies of the entries', () => {
			const control = new LayersControl({'A': new TileLayer('')});
			control.getLayers()[0].name = 'B';
			control.getLayers().pop();
			expect(control.getLayers()[0].name).to.equal('A');
		});
	});

	describe('selectLayer', () => {
		it('replaces the base layer and fires baselayerchange', () => {
			const base1 = new TileLayer('').addTo(map), base2 = new TileLayer('');
			const control = new LayersControl({'1': base1, '2': base2}).addTo(map);
			const spy = vi.fn();
			map.on('baselayerchange', spy);

			expect(control.selectLayer(base2)).to.equal(control);
			expect(map.hasLayer(base1)).to.be.false;
			expect(map.hasLayer(base2)).to.be.true;
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0].name).to.equal('2');
			expect(spy.mock.calls[0][0].layer).to.equal(base2);
			expect(spy.mock.calls[0][0].originalEvent).to.be.undefined;
			const inputs = control._baseLayersList.getElementsByTagName('input');
			expect(Array.from(inputs, input => input.checked)).to.deep.equal([false, true]);
		});

		it('adds an overlay and fires overlayadd', () => {
			const overlay1 = new Marker([0, 0]).addTo(map), overlay2 = new Marker([0, 0]);
			const control = new LayersControl({}, {'1': overlay1, '2': overlay2}).addTo(map);
			const spy = vi.fn();
			map.on('overlayadd overlayremove', spy);

			control.selectLayer(overlay2);
			expect(map.hasLayer(overlay1)).to.be.true;
			expect(map.hasLayer(overlay2)).to.be.true;
			expect(spy).toHaveBeenCalledOnce();
			expect(spy.mock.calls[0][0].type).to.equal('overlayadd');
			expect(spy.mock.calls[0][0].layer).to.equal(overlay2);
			expect(control._overlaysList.getElementsByTagName('input')[1].checked).to.be.true;
		});

		it('does nothing for a selected layer, a layer not in the control or without map', () => {
			const base = new TileLayer('').addTo(map), other = new TileLayer('');
			const control = new LayersControl({'1': base});
			const spy = vi.fn();
			map.on('baselayerchange', spy);

			control.selectLayer(other);
			control.addTo(map);
			control.selectLayer(base);
			control.selectLayer(other);
			expect(map.hasLayer(base)).to.be.true;
			expect(map.hasLayer(other)).to.be.false;
			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('originalEvent', () => {
		it('is the click event for changes by the user', () => {
			const base1 = new TileLayer('').addTo(map), base2 = new TileLayer(''), overlay = new Marker([0, 0]).addTo(map);
			const control = new LayersControl({'1': base1, '2': base2}, {'O': overlay}).addTo(map);
			const spy = vi.fn();
			map.on('baselayerchange overlayadd overlayremove', spy);

			UIEventSimulator.fire('click', control._baseLayersList.getElementsByTagName('input')[1]);
			UIEventSimulator.fire('click', control._overlaysList.getElementsByTagName('input')[0]);
			expect(spy.mock.calls.map(([e]) => e.type)).to.deep.equal(['baselayerchange', 'overlayremove']);
			for (const [e] of spy.mock.calls) {
				expect(e.originalEvent).to.be.instanceOf(MouseEvent);
				expect(e.originalEvent.type).to.equal('click');
			}
		});

		it('is undefined for changes by code', () => {
			const overlay = new Marker([0, 0]);
			new LayersControl({}, {'O': overlay}).addTo(map);
			const spy = vi.fn();
			map.on('overlayadd overlayremove', spy);

			map.addLayer(overlay);
			map.removeLayer(overlay);
			expect(spy).toHaveBeenCalledTimes(2);
			expect(spy.mock.calls[0][0].originalEvent).to.be.undefined;
			expect(spy.mock.calls[1][0].originalEvent).to.be.undefined;
		});
	});

	describe('toggleContent', () => {
		it('is empty by default', () => {
			const control = new LayersControl().addTo(map);
			expect(control.getContainer().querySelector('.maplair-control-layers-toggle').childNodes).to.have.length(0);
		});

		it('renders HTML', () => {
			const control = new LayersControl(null, null, {toggleContent: '<b>F</b>'}).addTo(map);
			const toggle = control.getContainer().querySelector('.maplair-control-layers-toggle');
			expect(toggle.innerHTML).to.equal('<b>F</b>');
			expect(toggle.getAttribute('aria-label')).to.equal('Layers');
		});

		it('renders an element', () => {
			const icon = document.createElement('span');
			const control = new LayersControl(null, null, {toggleContent: icon}).addTo(map);
			expect(control.getContainer().querySelector('.maplair-control-layers-toggle').firstChild).to.equal(icon);
		});
	});

	it('labels the list of layers', () => {
		const control = new LayersControl(null, null, {inline: true}).addTo(map);
		const list = control.getContainer().querySelector('.maplair-control-layers-list');
		expect(list.getAttribute('aria-label')).to.equal('Layers');
	});

	it('refocus map after interaction', () => {
		const baseLayers = {'Layer 1': new TileLayer(''), 'Layer 2': new TileLayer('')},
		control = new LayersControl(baseLayers).addTo(map);

		const spy = vi.spyOn(map.getContainer(), 'focus');
		map.getContainer().focus();
		expect(spy).toHaveBeenCalledOnce();

		// simulate keyboard-click event
		spy.mockClear();
		UIEventSimulator.fire('click', control._baseLayersList.getElementsByTagName('input')[0], {
			screenX: 0,
			screenY: 0,
		});
		expect(spy).not.toHaveBeenCalledOnce();

		// simulate MouseEvent at 0, 1
		spy.mockClear();
		UIEventSimulator.fire('click', control._baseLayersList.getElementsByTagName('input')[0], {
			screenX: 0,
			screenY: 1,
		});
		expect(spy).toHaveBeenCalledOnce();

		// simulate MouseEvent
		spy.mockClear();
		UIEventSimulator.fire('click', control._baseLayersList.getElementsByTagName('input')[0], {
			screenX: 100, // random number - not 0
			screenY: 100, // random number - not 0
		});
		expect(spy).toHaveBeenCalledOnce();
	});
});
