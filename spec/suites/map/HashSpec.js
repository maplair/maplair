import {expect} from 'vite-plus/test';
import {Hash, MaplairMap} from 'maplair';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('Hash', () => {
	let container, map, hash;

	beforeEach(() => {
		history.replaceState(null, '', location.pathname + location.search);
		container = createContainer();
		map = new MaplairMap(container, {zoomAnimation: false, fadeAnimation: false});
	});

	afterEach(() => {
		hash?.remove();
		hash = null;
		removeMapContainer(map, container);
		history.replaceState(null, '', location.pathname + location.search);
	});

	function setHash(value) {
		return new Promise((resolve) => {
			window.addEventListener('hashchange', resolve, {once: true});
			location.hash = value;
		});
	}

	describe('parse and format', () => {
		it('parses hashes', () => {
			const view = Hash.parse('#13/47.2692/11.4041');
			expect(view.zoom).to.equal(13);
			expect(view.center).to.be.nearLatLng([47.2692, 11.4041]);
			expect(view.bearing).to.be.undefined;
			expect(Hash.parse('#5.5/1/2/30').bearing).to.equal(30);
		});

		it('rejects other hashes', () => {
			for (const value of ['', '#', '#about', '#1/2', '#1/2/x', '#1//2', '#1/2/3/4/5', '#1/2/3/x']) {
				expect(Hash.parse(value), value).to.be.undefined;
			}
		});

		it('formats the view with a precision of about a pixel', () => {
			map.setView([47.26923456, 11.40412345], 13);
			expect(Hash.format(map)).to.equal('#13/47.2692/11.4041');
			map.setView([47.26923456, 11.40412345], 3);
			expect(Hash.format(map)).to.equal('#3/47.3/11.4');
			map.options.zoomSnap = 0;
			map.setZoom(3.256);
			expect(Hash.format(map).startsWith('#3.26/')).to.be.true;
		});

		it('adds the bearing of a rotated map', () => {
			map.setView([1, 2], 4);
			map.setBearing(30.04);
			expect(Hash.format(map)).to.equal('#4/1.00/2.00/30');
		});
	});

	it('writes the view to the hash when it changes', () => {
		map.setView([47.27, 11.40], 13);
		hash = new Hash(map);
		expect(location.hash).to.equal('#13/47.2700/11.4000');

		const historyLength = history.length;
		map.setView([48, 12], 10);
		expect(location.hash).to.equal('#10/48.000/12.000');
		// without adding to the history
		expect(history.length).to.equal(historyLength);
	});

	it('restores the view from the hash when created', () => {
		history.replaceState(null, '', '#10/48.0000/12.0000/90');
		hash = new Hash(map);
		expect(map.getZoom()).to.equal(10);
		expect(map.getCenter()).to.be.nearLatLng([48, 12]);
		expect(map.getBearing()).to.equal(90);
	});

	it('follows changes of the hash', async () => {
		map.setView([0, 0], 2);
		hash = new Hash(map);
		await setHash('#7/10.000/20.000');
		expect(map.getZoom()).to.equal(7);
		expect(map.getCenter()).to.be.nearLatLng([10, 20]);
	});

	it('ignores other hashes', async () => {
		map.setView([0, 0], 2);
		hash = new Hash(map);
		await setHash('#about');
		expect(map.getZoom()).to.equal(2);
	});

	it('stops when removed', async () => {
		map.setView([0, 0], 2);
		hash = new Hash(map);
		hash.remove();
		map.setView([10, 10], 5);
		expect(location.hash).to.equal('#2/0.0/0.0');
		await setHash('#7/10.000/20.000');
		expect(map.getZoom()).to.equal(5);
	});
});
