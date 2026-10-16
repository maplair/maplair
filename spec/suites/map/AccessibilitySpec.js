import {expect} from 'vite-plus/test';
import {FullscreenControl, I18n, LayersControl, MaplairMap, Marker, Popup} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Accessibility', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {fadeAnimation: false, zoomAnimation: false});
		map.setView([0, 0], 3);
	});

	afterEach(() => {
		removeMapContainer(map, container);
	});

	describe('accessible name of the map', () => {
		it('is a region labelled "Map" by default', () => {
			expect(container.getAttribute('role')).to.equal('region');
			expect(container.getAttribute('aria-label')).to.equal('Map');
		});

		it('uses the ariaLabel option', () => {
			map.remove();
			map = new MaplairMap(container, {ariaLabel: 'Bus stops'});
			expect(container.getAttribute('aria-label')).to.equal('Bus stops');
		});

		it('keeps an existing role and label', () => {
			map.remove();
			container.setAttribute('role', 'application');
			container.removeAttribute('aria-label');
			container.setAttribute('aria-labelledby', 'heading');
			map = new MaplairMap(container);
			expect(container.getAttribute('role')).to.equal('application');
			expect(container.hasAttribute('aria-label')).to.be.false;
		});

		it('is translated', () => {
			map.remove();
			container.removeAttribute('aria-label');
			I18n.registerLocale('xx', {Map: 'Karte'});
			I18n.setLocale('xx');
			try {
				map = new MaplairMap(container);
				expect(container.getAttribute('aria-label')).to.equal('Karte');
			} finally {
				I18n.setLocale(null);
			}
		});
	});

	describe('keyboard shortcuts help', () => {
		beforeEach(() => {
			map.keyboard._onFocus();
		});

		function help() {
			return container.querySelector('.maplair-keyboard-help');
		}

		it('opens and closes on "?"', () => {
			const zoom = map.getZoom();
			UIEventSimulator.fire('keydown', document, {key: '?', code: 'Slash', shiftKey: true});
			expect(help().matches(':popover-open')).to.be.true;
			expect(help().getAttribute('role')).to.equal('dialog');
			expect(help().getAttribute('aria-label')).to.equal('Keyboard shortcuts');
			expect(help().querySelectorAll('dt').length).to.equal(6);
			expect(help().textContent).to.contain('Pan the map');
			// "?" is Shift+Slash, which would zoom out
			expect(map.getZoom()).to.equal(zoom);

			UIEventSimulator.fire('keydown', document, {key: '?', code: 'Slash', shiftKey: true});
			expect(help().matches(':popover-open')).to.be.false;
		});

		it('is removed with the keyboard handler', () => {
			UIEventSimulator.fire('keydown', document, {key: '?'});
			expect(help()).not.to.equal(null);
			map.keyboard.disable();
			expect(help()).to.equal(null);
		});
	});

	describe('buttons', () => {
		it('uses buttons for the zoom control', () => {
			for (const button of container.querySelectorAll('.maplair-control-zoom-in, .maplair-control-zoom-out')) {
				expect(button.tagName).to.equal('BUTTON');
				expect(button.type).to.equal('button');
				expect(button.hasAttribute('aria-label')).to.be.true;
			}
		});

		it('uses buttons for the fullscreen and layers controls', () => {
			new FullscreenControl().addTo(map);
			new LayersControl({}, {}, {collapsed: true}).addTo(map);
			expect(container.querySelector('.maplair-control-fullscreen-button').tagName).to.equal('BUTTON');
			const toggle = container.querySelector('.maplair-control-layers-toggle');
			expect(toggle.tagName).to.equal('BUTTON');
			expect(toggle.getAttribute('aria-label')).to.equal('Layers');
		});

		it('keeps the size of the control buttons', () => {
			const button = container.querySelector('.maplair-control-zoom-in'),
			style = getComputedStyle(button);
			expect(button.offsetWidth).to.equal(30);
			expect(button.offsetHeight).to.equal(31);
			expect(style.fontWeight).to.equal('700');
			expect(style.fontSize).to.equal('22px');
			expect(style.borderTopWidth).to.equal('0px');
		});

		it('uses a button to close popups', () => {
			const popup = new Popup([0, 0], {content: 'Hello'}).openOn(map);
			const button = popup.getElement().querySelector('.maplair-popup-close-button');
			expect(button.tagName).to.equal('BUTTON');
			UIEventSimulator.fire('click', button);
			expect(map.hasLayer(popup)).to.be.false;
		});
	});

	describe('focus of popups', () => {
		let marker;

		beforeEach(() => {
			marker = new Marker([0, 0]).addTo(map).bindPopup('<a href="#">A link</a>');
			marker.getElement().focus();
		});

		function pressEnter() {
			UIEventSimulator.fire('keypress', marker.getElement(), {code: 'Enter'});
		}

		it('moves the focus into a popup opened with the keyboard', () => {
			pressEnter();
			expect(marker.isPopupOpen()).to.be.true;
			expect(document.activeElement).to.equal(marker.getPopup()._closeButton);
		});

		it('returns the focus to the marker when closing the popup', () => {
			pressEnter();
			UIEventSimulator.fire('click', marker.getPopup()._closeButton);
			expect(marker.isPopupOpen()).to.be.false;
			expect(document.activeElement).to.equal(marker.getElement());
		});

		it('closes the popup with Escape while the focus is in it', () => {
			pressEnter();
			UIEventSimulator.fire('keydown', document.activeElement, {key: 'Escape'});
			expect(marker.isPopupOpen()).to.be.false;
			expect(document.activeElement).to.equal(marker.getElement());
		});

		it('focuses a popup without close button', () => {
			marker.bindPopup('Text', {closeButton: false});
			pressEnter();
			expect(document.activeElement).to.equal(marker.getPopup().getElement());
		});

		it('does not move the focus for popups opened by clicking or by code', () => {
			UIEventSimulator.fire('click', marker.getElement());
			expect(marker.isPopupOpen()).to.be.true;
			expect(document.activeElement).to.equal(marker.getElement());
			marker.closePopup();
			marker.openPopup();
			expect(document.activeElement).to.equal(marker.getElement());
		});
	});
});
