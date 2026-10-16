import {expect, vi} from 'vite-plus/test';
import {FullscreenControl, I18n, MaplairMap} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('FullscreenControl', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer('200px', '100px');
		map = new MaplairMap(container);
		map.setView([0, 0], 1);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		removeMapContainer(map, container);
	});

	// Mocks the Fullscreen API, since browsers allow fullscreen only on user interaction.
	function mockFullscreenApi() {
		let fullscreenElement = null;
		vi.spyOn(document, 'fullscreenEnabled', 'get').mockReturnValue(true);
		vi.spyOn(document, 'fullscreenElement', 'get').mockImplementation(() => fullscreenElement);
		vi.spyOn(Element.prototype, 'requestFullscreen').mockImplementation(function () {
			fullscreenElement = this;
			document.dispatchEvent(new Event('fullscreenchange'));
			return Promise.resolve();
		});
		vi.spyOn(document, 'exitFullscreen').mockImplementation(() => {
			fullscreenElement = null;
			document.dispatchEvent(new Event('fullscreenchange'));
			return Promise.resolve();
		});
	}

	function button() {
		return container.querySelector('.maplair-control-fullscreen-button');
	}

	it('is not added by default', () => {
		expect(map.fullscreenControl).to.be.undefined;
		expect(button()).to.equal(null);
	});

	it('is added with the fullscreenControl option', () => {
		map.remove();
		map = new MaplairMap(container, {fullscreenControl: true});
		expect(map.fullscreenControl).to.be.instanceOf(FullscreenControl);
		expect(button()).not.to.equal(null);
		expect(button().title).to.equal('View fullscreen');
		expect(button().getAttribute('aria-pressed')).to.equal('false');
	});

	it('enters and exits fullscreen using the Fullscreen API', () => {
		mockFullscreenApi();
		new FullscreenControl().addTo(map);
		const enter = vi.fn(), exit = vi.fn(), change = vi.fn();
		map.on({enterfullscreen: enter, exitfullscreen: exit, fullscreenchange: change});

		UIEventSimulator.fire('click', button());
		expect(Element.prototype.requestFullscreen).toHaveBeenCalledOnce();
		expect(document.fullscreenElement).to.equal(container);
		expect(map.isFullscreen()).to.be.true;
		expect(container.classList.contains('maplair-fullscreen')).to.be.true;
		expect(container.classList.contains('maplair-pseudo-fullscreen')).to.be.false;
		expect(enter).toHaveBeenCalledOnce();
		expect(button().title).to.equal('Exit fullscreen');
		expect(button().getAttribute('aria-pressed')).to.equal('true');

		UIEventSimulator.fire('click', button());
		expect(document.exitFullscreen).toHaveBeenCalledOnce();
		expect(map.isFullscreen()).to.be.false;
		expect(container.classList.contains('maplair-fullscreen')).to.be.false;
		expect(exit).toHaveBeenCalledOnce();
		expect(change).toHaveBeenCalledTimes(2);
		expect(button().title).to.equal('View fullscreen');
	});

	it('notices exiting fullscreen by the browser (e.g. Escape key)', () => {
		mockFullscreenApi();
		map.toggleFullscreen();
		expect(map.isFullscreen()).to.be.true;

		document.exitFullscreen();
		expect(map.isFullscreen()).to.be.false;
	});

	it('ignores other elements in fullscreen', () => {
		mockFullscreenApi();
		const spy = vi.fn();
		map.on('fullscreenchange', spy);

		document.body.requestFullscreen();
		document.exitFullscreen();
		expect(spy).not.toHaveBeenCalled();
		expect(map.isFullscreen()).to.be.false;
	});

	it('enlarges the map to the window without the Fullscreen API', () => {
		vi.spyOn(document, 'fullscreenEnabled', 'get').mockReturnValue(false);
		new FullscreenControl().addTo(map);
		const enter = vi.fn(), exit = vi.fn();
		map.on({enterfullscreen: enter, exitfullscreen: exit});

		UIEventSimulator.fire('click', button());
		expect(map.isFullscreen()).to.be.true;
		expect(container.classList.contains('maplair-pseudo-fullscreen')).to.be.true;
		expect(map.getSize().x).to.equal(document.documentElement.clientWidth);
		expect(map.getSize().y).to.equal(document.documentElement.clientHeight);
		expect(enter).toHaveBeenCalledOnce();

		UIEventSimulator.fire('click', button());
		expect(map.isFullscreen()).to.be.false;
		expect(container.classList.contains('maplair-pseudo-fullscreen')).to.be.false;
		expect(map.getSize().x).to.equal(200);
		expect(map.getSize().y).to.equal(100);
		expect(exit).toHaveBeenCalledOnce();
	});

	it('exits the enlarged map with the Escape key', () => {
		vi.spyOn(document, 'fullscreenEnabled', 'get').mockReturnValue(false);
		map.toggleFullscreen();
		expect(map.isFullscreen()).to.be.true;

		UIEventSimulator.fire('keydown', document, {key: 'Escape'});
		expect(map.isFullscreen()).to.be.false;
	});

	it('enlarges the map to the window if the browser refuses fullscreen', async () => {
		vi.spyOn(document, 'fullscreenEnabled', 'get').mockReturnValue(true);
		vi.spyOn(Element.prototype, 'requestFullscreen').mockRejectedValue(new TypeError('Permissions check failed'));
		const entered = new Promise((resolve) => {
			map.once('enterfullscreen', resolve);
		});

		map.toggleFullscreen();
		await entered;
		expect(map.isFullscreen()).to.be.true;
		expect(container.classList.contains('maplair-pseudo-fullscreen')).to.be.true;
	});

	it('keeps the center when entering and exiting fullscreen', () => {
		vi.spyOn(document, 'fullscreenEnabled', 'get').mockReturnValue(false);
		map.setView([10, 20], 5, {animate: false});
		map.toggleFullscreen();
		expect(map.getCenter()).to.be.nearLatLng([10, 20], 0.1);
		map.toggleFullscreen();
		expect(map.getCenter()).to.be.nearLatLng([10, 20], 0.1);
	});

	it('exits fullscreen when the map is removed', () => {
		mockFullscreenApi();
		map.toggleFullscreen();
		map.remove();
		expect(document.exitFullscreen).toHaveBeenCalledOnce();
		expect(document.fullscreenElement).to.equal(null);
		map = null;
	});

	it('translates the button title', () => {
		I18n.registerLocale('xx', {'View fullscreen': 'Vollbild anzeigen'});
		I18n.setLocale('xx');
		try {
			new FullscreenControl().addTo(map);
			expect(button().title).to.equal('Vollbild anzeigen');
		} finally {
			I18n.setLocale(null);
		}
	});
});
