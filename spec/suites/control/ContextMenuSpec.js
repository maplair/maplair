import {expect, vi} from 'vite-plus/test';
import {ContextMenu, MaplairMap, Marker} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('ContextMenu', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false});
		map.setView([0, 0], 3);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	function contextmenu(target, x, y) {
		const rect = container.getBoundingClientRect();
		return UIEventSimulator.fire('contextmenu', target, {clientX: rect.left + x, clientY: rect.top + y});
	}

	function menu() {
		return container.querySelector('.maplair-contextmenu');
	}

	function items() {
		return [...menu().querySelectorAll('.maplair-contextmenu-item')];
	}

	it('opens at the pointer on contextmenu on the map', () => {
		new ContextMenu([{text: 'A'}, '-', {text: 'B', disabled: true}]).addTo(map);
		contextmenu(container, 100, 50);

		expect(menu().matches(':popover-open')).to.be.true;
		expect(menu().getAttribute('role')).to.equal('menu');
		const rect = menu().getBoundingClientRect(),
		origin = container.getBoundingClientRect();
		expect(rect.left - origin.left).to.be.closeTo(100, 1);
		expect(rect.top - origin.top).to.be.closeTo(50, 1);

		expect(items().map(i => i.textContent)).to.eql(['A', 'B']);
		expect(items()[0].getAttribute('role')).to.equal('menuitem');
		expect(items()[1].disabled).to.be.true;
		expect(menu().querySelector('[role=separator]')).to.be.ok;
		expect(document.activeElement).to.equal(items()[0]);
	});

	it('calls the callback with the location and closes', () => {
		const callback = vi.fn();
		const contextMenu = new ContextMenu([{text: 'Here', callback}]).addTo(map);
		contextmenu(container, 100, 50);
		UIEventSimulator.fire('click', items()[0]);

		expect(callback).toHaveBeenCalledOnce();
		const e = callback.mock.calls[0][0];
		expect(e.latlng).to.be.nearLatLng(map.containerPointToLatLng([100, 50]));
		expect(e.containerPoint.equals([100, 50])).to.be.true;
		expect(e.relatedTarget).to.be.undefined;
		expect(contextMenu.isOpen()).to.be.false;
	});

	it('opens the menu of a layer instead of the one of the map', () => {
		const mapCallback = vi.fn(), layerCallback = vi.fn();
		new ContextMenu([{text: 'Map', callback: mapCallback}]).addTo(map);
		const marker = new Marker([0, 0]).addTo(map);
		new ContextMenu([{text: 'Marker', callback: layerCallback}]).addTo(marker);

		UIEventSimulator.fire('contextmenu', marker.getElement());
		const shown = [...container.querySelectorAll('.maplair-contextmenu')].filter(m => m.matches(':popover-open'));
		expect(shown).to.have.length(1);
		UIEventSimulator.fire('click', shown[0].querySelector('button'));
		expect(layerCallback).toHaveBeenCalledOnce();
		expect(layerCallback.mock.calls[0][0].relatedTarget).to.equal(marker);
		expect(mapCallback).not.toHaveBeenCalled();
	});

	it('moves the focus with the arrow keys', () => {
		new ContextMenu([{text: 'A'}, {text: 'B', disabled: true}, {text: 'C'}]).addTo(map);
		contextmenu(container, 10, 10);
		UIEventSimulator.fire('keydown', items()[0], {key: 'ArrowDown'});
		expect(document.activeElement).to.equal(items()[2]);
		UIEventSimulator.fire('keydown', items()[2], {key: 'ArrowDown'});
		expect(document.activeElement).to.equal(items()[0]);
		UIEventSimulator.fire('keydown', items()[0], {key: 'ArrowUp'});
		expect(document.activeElement).to.equal(items()[2]);
	});

	it('stays within the viewport', () => {
		new ContextMenu([{text: 'A'}]).addTo(map);
		container.style.left = `${document.documentElement.clientWidth - 400}px`;
		contextmenu(container, 395, 10);
		expect(menu().getBoundingClientRect().right).to.be.at.most(document.documentElement.clientWidth);
	});

	it('closes when the map moves', () => {
		const contextMenu = new ContextMenu([{text: 'A'}]).addTo(map);
		contextmenu(container, 10, 10);
		map.panBy([10, 10], {animate: false});
		expect(contextMenu.isOpen()).to.be.false;
	});

	it('prevents the browser menu', () => {
		new ContextMenu([{text: 'A'}]).addTo(map);
		const rect = container.getBoundingClientRect(),
		e = new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: rect.left + 10, clientY: rect.top + 10});
		container.dispatchEvent(e);
		expect(e.defaultPrevented).to.be.true;
	});

	it('is removed', () => {
		const contextMenu = new ContextMenu([{text: 'A'}]).addTo(map);
		contextmenu(container, 10, 10);
		contextMenu.remove();
		expect(menu()).to.equal(null);
		contextmenu(container, 10, 10);
		expect(menu()).to.equal(null);
	});
});
