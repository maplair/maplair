import {expect, vi} from 'vite-plus/test';
import {DivIcon, DefaultIcon, DomUtil, LatLng, LayerGroup, MaplairMap, Marker, Point} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../../SpecHelper.js';

describe('Marker', () => {
	let map,
	container,
	icon1,
	icon2;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);

		map.setView([0, 0], 0);
		icon1 = new DefaultIcon();
		icon2 = new DefaultIcon({
			iconUrl: `${icon1.options.iconUrl}?2`,
			shadowUrl: `${icon1.options.shadowUrl}?2`
		});
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('markerCulling map option', () => {
		let cullingMap, cullingContainer;

		beforeEach(() => {
			cullingContainer = createContainer();
			cullingContainer.style.width = '400px';
			cullingContainer.style.height = '400px';
			cullingMap = new MaplairMap(cullingContainer, {markerCulling: true, zoomAnimation: false, fadeAnimation: false}).setView([0, 0], 5);
		});

		afterEach(() => {
			removeMapContainer(cullingMap, cullingContainer);
		});

		it('keeps markers on the page by default', () => {
			const marker = new Marker([60, 60]).addTo(map);
			expect(marker.getElement().parentNode).to.equal(map._panes.markerPane);
		});

		it('takes markers far outside of the view off the page', () => {
			const near = new Marker([0, 0]).addTo(cullingMap);
			const far = new Marker([60, 60]).addTo(cullingMap);
			expect(near.getElement().parentNode).to.equal(cullingMap._panes.markerPane);
			expect(near._shadow.parentNode).to.equal(cullingMap._panes.shadowPane);
			expect(far.getElement().parentNode).to.equal(null);
			expect(far._shadow.parentNode).to.equal(null);
		});

		it('puts markers back on the page when moving the map close to them', () => {
			const marker = new Marker([60, 60]).addTo(cullingMap);
			cullingMap.setView([60, 60], 5);
			expect(marker.getElement().parentNode).to.equal(cullingMap._panes.markerPane);
			expect(marker._shadow.parentNode).to.equal(cullingMap._panes.shadowPane);
			expect(DomUtil.getPosition(marker.getElement())).to.eql(cullingMap.latLngToLayerPoint([60, 60]).round());

			cullingMap.setView([0, 0], 5);
			expect(marker.getElement().parentNode).to.equal(null);
		});

		it('puts a marker back on the page when moving it into the view', () => {
			const marker = new Marker([60, 60]).addTo(cullingMap);
			marker.setLatLng([1, 1]);
			expect(marker.getElement().parentNode).to.equal(cullingMap._panes.markerPane);
			expect(DomUtil.getPosition(marker.getElement())).to.eql(cullingMap.latLngToLayerPoint([1, 1]).round());
		});

		it('keeps a focused marker on the page', () => {
			const marker = new Marker([0, 0], {autoPanOnFocus: false}).addTo(cullingMap);
			marker.getElement().focus();
			cullingMap.setView([60, 60], 5);
			expect(marker.getElement().parentNode).to.equal(cullingMap._panes.markerPane);
		});

		it('removes culled markers cleanly', () => {
			const marker = new Marker([60, 60]).addTo(cullingMap);
			marker.remove();
			expect(cullingMap._panes.markerPane.children.length).to.equal(0);
			marker.addTo(cullingMap);
			cullingMap.setView([60, 60], 5);
			expect(marker.getElement().parentNode).to.equal(cullingMap._panes.markerPane);
		});
	});

	describe('shadow option', () => {
		it('adds the icon shadow by default', () => {
			const marker = new Marker([0, 0]).addTo(map);
			expect(marker._shadow.parentNode).to.equal(map._panes.shadowPane);
		});

		it('doesn\'t add a shadow if disabled', () => {
			const marker = new Marker([0, 0], {shadow: false}).addTo(map);
			expect(marker._shadow).to.equal(null);
			expect(map._panes.shadowPane.children.length).to.equal(0);
		});

		it('doesn\'t add a shadow when changing the icon if disabled', () => {
			const marker = new Marker([0, 0], {shadow: false}).addTo(map);
			marker.setIcon(new DefaultIcon());
			expect(map._panes.shadowPane.children.length).to.equal(0);
		});
	});

	describe('#setIcon', () => {

		it('set the correct x and y size attributes', () => {
			const expectedX = 96;
			const expectedY = 100;
			const sizedIcon = new DefaultIcon({
				iconUrl: `${icon1.options.iconUrl}?3`,
				iconSize: [expectedX, expectedY]
			});

			const marker = new Marker([0, 0], {icon: sizedIcon});
			map.addLayer(marker);

			const icon = marker._icon;

			expect(icon.style.width).to.equal(`${expectedX}px`);
			expect(icon.style.height).to.equal(`${expectedY}px`);
		});

		it('set the correct x and y size attributes passing only one value', () => {
			const expectedXY = 96;
			const sizedIcon = new DefaultIcon({
				iconUrl: `${icon1.options.iconUrl}?3`,
				iconSize: expectedXY
			});

			const marker = new Marker([0, 0], {icon: sizedIcon});
			map.addLayer(marker);

			const icon = marker._icon;

			expect(icon.style.width).to.equal(`${expectedXY}px`);
			expect(icon.style.height).to.equal(`${expectedXY}px`);
		});

		it('set the correct x and y size attributes passing a Point instance', () => {
			const expectedXY = 96;
			const sizedIcon = new DefaultIcon({
				iconUrl: `${icon1.options.iconUrl}?3`,
				iconSize: new Point(expectedXY, expectedXY)
			});

			const marker = new Marker([0, 0], {icon: sizedIcon});
			map.addLayer(marker);

			const icon = marker._icon;

			expect(icon.style.width).to.equal(`${expectedXY}px`);
			expect(icon.style.height).to.equal(`${expectedXY}px`);
		});

		it('changes the icon to another image while re-using the IMG element', () => {
			const marker = new Marker([0, 0], {icon: icon1});
			map.addLayer(marker);

			const beforeIcon = marker._icon;
			marker.setIcon(icon2);
			const afterIcon = marker._icon;

			expect(beforeIcon).to.equal(afterIcon); // Check that the <IMG> element is re-used
			expect(afterIcon.src).to.contain(icon2._getIconUrl('icon'));
		});

		it('preserves draggability', () => {
			const marker = new Marker([0, 0], {icon: icon1});
			map.addLayer(marker);

			marker.dragging.disable();
			marker.setIcon(icon2);

			expect(marker.dragging.enabled()).to.be.false;

			marker.dragging.enable();

			marker.setIcon(icon1);

			expect(marker.dragging.enabled()).to.be.true;

			map.removeLayer(marker);
			map.addLayer(marker);

			expect(marker.dragging.enabled()).to.be.true;

			map.removeLayer(marker);
			// Dragging is still enabled, we should be able to disable it,
			// even if marker is off the map.
			expect(marker.dragging).to.equal(undefined);
			marker.options.draggable = false;
			map.addLayer(marker);

			map.removeLayer(marker);

			// We should also be able to enable dragging while off the map
			expect(marker.dragging).to.equal(undefined);
			marker.options.draggable = true;

			map.addLayer(marker);
			expect(marker.dragging.enabled()).to.be.true;
		});

		it('keeps the draggable class on the icon', () => {
			const marker = new Marker([0, 0], {icon: icon1, draggable: true});
			map.addLayer(marker);

			marker.setIcon(icon2);

			expect(marker._icon.classList.contains('maplair-marker-draggable')).to.be.true;

			marker.dragging.disable();
			marker.setIcon(icon1);

			expect(marker._icon.classList.contains('maplair-marker-draggable')).to.be.false;
		});

		it('changes the DivIcon to another DivIcon, while re-using the DIV element', () => {
			const marker = new Marker([0, 0], {icon: new DivIcon({html: 'Inner1Text'})});
			map.addLayer(marker);

			const beforeIcon = marker._icon;
			marker.setIcon(new DivIcon({html: 'Inner2Text'}));
			const afterIcon = marker._icon;

			expect(beforeIcon).to.equal(afterIcon); // Check that the <DIV> element is re-used
			expect(afterIcon.innerHTML).to.contain('Inner2Text');
		});

		it('removes text when changing to a blank DivIcon', () => {
			const marker = new Marker([0, 0], {icon: new DivIcon({html: 'Inner1Text'})});
			map.addLayer(marker);

			marker.setIcon(new DivIcon());

			expect(marker._icon.innerHTML).to.not.contain('Inner1Text');
		});

		it('changes a DivIcon to an image', () => {
			const marker = new Marker([0, 0], {icon: new DivIcon({html: 'Inner1Text'})});
			map.addLayer(marker);
			const oldIcon = marker._icon;

			marker.setIcon(icon1);

			expect(oldIcon).to.not.equal(marker._icon); // Check that the _icon is NOT re-used
			expect(oldIcon.parentNode).to.equal(null);

			expect(marker._icon.src).to.equal(DefaultIcon.defaultOptions.iconUrl);
			expect(marker._icon.parentNode).to.equal(map._panes.markerPane);
		});

		it('changes an image to a DivIcon', () => {
			const marker = new Marker([0, 0], {icon: icon1});
			map.addLayer(marker);
			const oldIcon = marker._icon;

			marker.setIcon(new DivIcon({html: 'Inner1Text'}));

			expect(oldIcon).to.not.equal(marker._icon); // Check that the _icon is NOT re-used
			expect(oldIcon.parentNode).to.equal(null);

			expect(marker._icon.innerHTML).to.contain('Inner1Text');
			expect(marker._icon.parentNode).to.equal(map._panes.markerPane);
		});

		it('reuses the icon/shadow when changing icon', () => {
			const marker = new Marker([0, 0], {icon: icon1});
			map.addLayer(marker);
			const oldIcon = marker._icon;
			const oldShadow = marker._shadow;

			marker.setIcon(icon2);

			expect(oldIcon).to.equal(marker._icon);
			expect(oldShadow).to.equal(marker._shadow);

			expect(marker._icon.parentNode).to.equal(map._panes.markerPane);
			expect(marker._shadow.parentNode).to.equal(map._panes.shadowPane);
		});

		it('sets the alt attribute to a default value when no alt text is passed', () => {
			const marker = new Marker([0, 0], {icon: icon1});
			map.addLayer(marker);
			const icon = marker._icon;
			expect(icon.hasAttribute('alt')).to.be.true;
			expect(icon.alt).to.equal('Marker');
		});

		it('doesn\'t set the alt attribute for DivIcons', () => {
			const marker = new Marker([0, 0], {icon: new DivIcon(), alt: 'test'});
			map.addLayer(marker);
			const icon = marker._icon;
			expect(icon.hasAttribute('alt')).to.be.false;
		});

		it('pan map to focus marker', () => {
			const marker = new Marker([70, 0], {icon: new DivIcon()});
			map.addLayer(marker);

			expect(() => {
				marker._icon.focus();
			}).to.not.throw();
		});

		it('pan map to focus marker with no iconSize', () => {
			const marker = new Marker([70, 0], {icon: new DivIcon({iconSize: null})});
			map.addLayer(marker);

			expect(() => {
				marker._panOnFocus();
			}).to.not.throw();
		});
	});

	describe('dragging', () => {
		it('keeps dragging switched off when the marker is removed and added again', () => {
			const marker = new Marker([0, 0], {icon: icon1, draggable: true});
			map.addLayer(marker);
			expect(marker.dragging.enabled()).to.be.true;

			marker.dragging.disable();
			map.removeLayer(marker);
			map.addLayer(marker);

			expect(marker.dragging.enabled()).to.be.false;
		});

		it('keeps dragging switched off when the layer group of the marker is toggled', () => {
			const marker = new Marker([0, 0], {icon: icon1, draggable: true}),
			group = new LayerGroup([marker]).addTo(map);

			marker.dragging.disable();
			map.removeLayer(group);
			map.addLayer(group);

			expect(marker.dragging.enabled()).to.be.false;
		});
	});

	describe('#setLatLng', () => {
		it('fires a move event', () => {

			const marker = new Marker([0, 0], {icon: icon1});
			map.addLayer(marker);

			const beforeLatLng = marker._latlng;
			const afterLatLng = new LatLng(1, 2);

			let eventArgs = null;
			marker.on('move', (e) => {
				eventArgs = e;
			});

			marker.setLatLng(afterLatLng);

			expect(eventArgs).to.not.equal(null);
			expect(eventArgs.oldLatLng).to.equal(beforeLatLng);
			expect(eventArgs.latlng).to.eql(afterLatLng);
			expect(marker.getLatLng()).to.eql(afterLatLng);
		});
	});

	describe('events', () => {
		it('fires click event when clicked', () => {
			const spy = vi.fn();

			const marker = new Marker([0, 0]).addTo(map);

			marker.on('click', spy);
			UIEventSimulator.fire('click', marker._icon);

			expect(spy).toHaveBeenCalled();
		});

		it('fires click event when clicked with DivIcon', () => {
			const spy = vi.fn();

			const marker = new Marker([0, 0], {icon: new DivIcon()}).addTo(map);

			marker.on('click', spy);
			UIEventSimulator.fire('click', marker._icon);

			expect(spy).toHaveBeenCalled();
		});

		it('fires click event when clicked on DivIcon child element', () => {
			const spy = vi.fn();

			const marker = new Marker([0, 0], {icon: new DivIcon({html: '<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" />'})}).addTo(map);

			marker.on('click', spy);

			UIEventSimulator.fire('click', marker._icon);
			expect(spy).toHaveBeenCalled();

			UIEventSimulator.fire('click', marker._icon.querySelector('img'));
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('fires click event when clicked on DivIcon child element set using setIcon', () => {
			const spy = vi.fn();

			const marker = new Marker([0, 0]).addTo(map);
			marker.setIcon(new DivIcon({html: '<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" />'}));

			marker.on('click', spy);

			UIEventSimulator.fire('click', marker._icon);
			expect(spy).toHaveBeenCalled();

			UIEventSimulator.fire('click', marker._icon.querySelector('img'));
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('do not propagate click event', () => {
			const spy = vi.fn();
			const spy2 = vi.fn();
			const mapSpy = vi.fn();
			const marker = new Marker([55.8, 37.6]);
			map.addLayer(marker);
			marker.on('click', spy);
			marker.on('click', spy2);
			map.on('click', mapSpy);
			UIEventSimulator.fire('click', marker._icon);
			expect(spy).toHaveBeenCalled();
			expect(spy2).toHaveBeenCalled();
			expect(mapSpy).not.toHaveBeenCalled();
		});

		it('do not propagate dblclick event', () => {
			const spy = vi.fn();
			const spy2 = vi.fn();
			const mapSpy = vi.fn();
			const marker = new Marker([55.8, 37.6]);
			map.addLayer(marker);
			marker.on('dblclick', spy);
			marker.on('dblclick', spy2);
			map.on('dblclick', mapSpy);
			UIEventSimulator.fire('dblclick', marker._icon);
			expect(spy).toHaveBeenCalled();
			expect(spy2).toHaveBeenCalled();
			expect(mapSpy).not.toHaveBeenCalled();
		});

		it('do not catch event if it does not listen to it', (done) => {
			const marker = new Marker([55, 37]);
			map.addLayer(marker);
			marker.once('pointermove', (e) => {
				// It should be the marker coordinates
				expect(e.latlng.equals(marker.getLatLng())).to.be.equal(true);
			});
			UIEventSimulator.fire('pointermove', marker._icon);

			map.once('pointermove', (e) => {
				// It should be the pointer coordinates, not the marker ones
				expect(e.latlng.equals(marker.getLatLng())).to.be.equal(false);
				done();
			});
			UIEventSimulator.fire('pointermove', marker._icon);
		});
	});
});
