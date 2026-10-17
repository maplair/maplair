import {expect, vi} from 'vite-plus/test';
import {LatLng, MaplairMap, SearchControl} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('SearchControl', () => {
	let container, map;

	const places = [
		{label: 'Innsbruck, Tyrol, Austria', latlng: [47.2692, 11.4041], bounds: [[47.21, 11.30], [47.36, 11.46]]},
		{label: 'Innsbrucker Platz, Berlin', latlng: {lat: 52.478, lng: 13.343}}
	];

	function geocoder() {
		return vi.fn(() => Promise.resolve(places));
	}

	function keydown(control, key) {
		UIEventSimulator.fire('keydown', control._input, {key});
	}

	function type(control, value) {
		control._input.value = value;
		control._input.dispatchEvent(new InputEvent('input'));
	}

	function submit(control, value) {
		control._input.value = value;
		control._input.form.requestSubmit();
	}

	function items(control) {
		return [...control.getContainer().querySelectorAll('[role="option"]')];
	}

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container);
		map.setView([0, 0], 1);
	});

	afterEach(() => {
		removeMapContainer(map, container);
		vi.restoreAllMocks();
	});

	it('expands from a button and collapses on map click', () => {
		const control = new SearchControl({geocoder: geocoder()}).addTo(map);
		const el = control.getContainer();
		expect(el.parentNode).to.equal(map._controlCorners.topleft);
		expect(el.classList.contains('maplair-control-search-expanded')).to.be.false;
		expect(getComputedStyle(control._input).display).to.equal('none');

		UIEventSimulator.fire('click', control._toggle);
		expect(el.classList.contains('maplair-control-search-expanded')).to.be.true;
		expect(control._toggle.getAttribute('aria-expanded')).to.equal('true');
		expect(document.activeElement).to.equal(control._input);

		map.fire('click');
		expect(el.classList.contains('maplair-control-search-expanded')).to.be.false;
	});

	it('stays expanded with collapsed: false', () => {
		const control = new SearchControl({geocoder: geocoder(), collapsed: false}).addTo(map);
		control.collapse();
		expect(control.getContainer().classList.contains('maplair-control-search-expanded')).to.be.true;
	});

	it('searches on submit and lists the results', async () => {
		const search = geocoder();
		const control = new SearchControl({geocoder: search}).addTo(map).expand();
		submit(control, ' Innsbruck ');
		await vi.waitFor(() => expect(items(control)).to.have.length(2));

		expect(search).toHaveBeenCalledOnce();
		expect(search.mock.calls[0][0]).to.equal('Innsbruck');
		expect(search.mock.calls[0][1].signal).to.be.instanceOf(AbortSignal);
		expect(items(control).map(li => li.textContent)).to.eql(places.map(p => p.label));
		expect(control._input.getAttribute('aria-expanded')).to.equal('true');
	});

	it('selects a result with the keyboard', async () => {
		const control = new SearchControl({geocoder: geocoder()}).addTo(map).expand();
		const onResult = vi.fn();
		map.on('searchresult', onResult);
		await control.search('Innsbruck');

		keydown(control, 'ArrowDown');
		keydown(control, 'ArrowDown');
		expect(control._input.getAttribute('aria-activedescendant')).to.equal(items(control)[1].id);
		expect(items(control)[1].getAttribute('aria-selected')).to.equal('true');
		keydown(control, 'ArrowDown');
		expect(control._input.getAttribute('aria-activedescendant')).to.equal(items(control)[0].id);
		keydown(control, 'ArrowUp');
		keydown(control, 'ArrowUp');
		expect(control._input.getAttribute('aria-activedescendant')).to.equal(items(control)[0].id);

		control._input.form.requestSubmit();
		expect(onResult).toHaveBeenCalledOnce();
		expect(onResult.mock.calls[0][0].result).to.equal(places[0]);
		expect(map.getBounds().contains([47.2692, 11.4041])).to.be.true;
		expect(control._input.value).to.equal(places[0].label);
		expect(items(control)).to.have.length(0);
	});

	it('selects a result on click, zooms to it and shows a marker', async () => {
		const control = new SearchControl({geocoder: geocoder(), zoom: 14}).addTo(map).expand();
		await control.search('Innsbruck');
		UIEventSimulator.fire('click', items(control)[1]);

		expect(map.getZoom()).to.equal(14);
		expect(map.getCenter()).to.be.nearLatLng([52.478, 13.343]);
		expect(control._marker.getLatLng()).to.be.nearLatLng([52.478, 13.343]);
		expect(map.hasLayer(control._marker)).to.be.true;

		const marker = control._marker;
		control.clear();
		expect(map.hasLayer(marker)).to.be.false;
		expect(control._input.value).to.equal('');
	});

	it('fits the bounds of results up to the zoom option', () => {
		const control = new SearchControl({geocoder: geocoder(), zoom: 10, marker: false}).addTo(map);
		control.select(places[0]);
		expect(map.getZoom()).to.be.at.most(10);
		expect(map.getBounds().contains(places[0].bounds)).to.be.true;
		expect(control._marker).to.be.undefined;
	});

	it('finds coordinates without the geocoder', async () => {
		const search = geocoder();
		const control = new SearchControl({geocoder: search}).addTo(map).expand();
		const onResult = vi.fn();
		map.on('searchresult', onResult);

		submit(control, '47.27 N, 11.4 E');
		expect(search).not.toHaveBeenCalled();
		expect(onResult).toHaveBeenCalledOnce();
		expect(onResult.mock.calls[0][0].latlng).to.be.nearLatLng([47.27, 11.4]);

		const results = await control.search('geo:47.27,11.4');
		expect(results[0].latlng).to.be.instanceOf(LatLng);
		expect(search).not.toHaveBeenCalled();
	});

	it('shows a message for no results and for errors', async () => {
		const search = vi.fn(() => Promise.resolve([]));
		const control = new SearchControl({geocoder: search}).addTo(map).expand();
		const message = control.getContainer().querySelector('[role="status"]');

		await control.search('nowhere');
		expect(message.textContent).to.equal('No results');
		expect(message.hidden).to.be.false;

		search.mockRejectedValueOnce(new Error('offline'));
		await control.search('nowhere').then(() => expect.fail('resolved'), error => expect(error.message).to.equal('offline'));
		expect(message.textContent).to.equal('The search failed');

		keydown(control, 'Escape');
		expect(message.hidden).to.be.true;
	});

	it('aborts the previous search', async () => {
		const signals = [];
		const control = new SearchControl({
			geocoder: (query, {signal}) => {
				signals.push(signal);
				return query === 'slow' ? new Promise(() => {}) : Promise.resolve(places);
			}
		}).addTo(map).expand();

		control.search('slow');
		expect(control.getContainer().classList.contains('maplair-control-search-loading')).to.be.true;
		await control.search('fast');
		expect(signals[0].aborted).to.be.true;
		expect(signals[1].aborted).to.be.false;
		expect(items(control)).to.have.length(2);
		expect(control.getContainer().classList.contains('maplair-control-search-loading')).to.be.false;
	});

	it('searches while typing with autoComplete', () => {
		vi.useFakeTimers();
		try {
			const search = geocoder();
			const control = new SearchControl({geocoder: search, autoComplete: true}).addTo(map).expand();
			type(control, 'In');
			vi.advanceTimersByTime(300);
			expect(search).not.toHaveBeenCalled();

			type(control, 'Inns');
			type(control, 'Innsb');
			vi.advanceTimersByTime(300);
			expect(search).toHaveBeenCalledOnce();
			expect(search.mock.calls[0][0]).to.equal('Innsb');
		} finally {
			vi.useRealTimers();
		}
	});

	it('does not search while typing by default', () => {
		vi.useFakeTimers();
		try {
			const search = geocoder();
			const control = new SearchControl({geocoder: search}).addTo(map).expand();
			type(control, 'Innsbruck');
			vi.advanceTimersByTime(1000);
			expect(search).not.toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});

	it('clears with Escape, then collapses', async () => {
		const control = new SearchControl({geocoder: geocoder()}).addTo(map).expand();
		await control.search('Innsbruck');
		keydown(control, 'Escape');
		expect(items(control)).to.have.length(0);
		expect(control._input.value).to.equal('Innsbruck');
		keydown(control, 'Escape');
		expect(control._input.value).to.equal('');
		keydown(control, 'Escape');
		expect(control.getContainer().classList.contains('maplair-control-search-expanded')).to.be.false;
	});

	it('removes the marker with the control', () => {
		const control = new SearchControl({geocoder: geocoder()}).addTo(map);
		control.select(places[1]);
		const marker = control._marker;
		control.remove();
		expect(map.hasLayer(marker)).to.be.false;
	});

	describe('nominatim', () => {
		it('searches with Nominatim', async () => {
			const fetch = vi.spyOn(window, 'fetch').mockResolvedValue(Response.json([{
				display_name: 'Innsbruck, Tirol, Österreich',
				lat: '47.2654296',
				lon: '11.3927685',
				boundingbox: ['47.2100', '47.3600', '11.3000', '11.4600']
			}]));
			const signal = new AbortController().signal;
			const results = await SearchControl.nominatim({params: {countrycodes: 'at'}})('Innsbruck', {signal});

			const [url, init] = fetch.mock.calls[0];
			expect(url).to.equal('https://nominatim.openstreetmap.org/search?q=Innsbruck&format=jsonv2&limit=5&countrycodes=at');
			expect(init.signal).to.equal(signal);
			expect(results).to.have.length(1);
			expect(results[0].label).to.equal('Innsbruck, Tirol, Österreich');
			expect(results[0].latlng).to.eql([47.2654296, 11.3927685]);
			expect(results[0].bounds).to.eql([[47.21, 11.3], [47.36, 11.46]]);
		});

		it('rejects on HTTP errors', async () => {
			vi.spyOn(window, 'fetch').mockResolvedValue(new Response('', {status: 429}));
			const search = SearchControl.nominatim({url: 'https://example.org/search'});
			await search('x', {signal: new AbortController().signal}).then(() => expect.fail('resolved'), error => expect(error.message).to.contain('429'));
		});

		it('is the default geocoder', async () => {
			const fetch = vi.spyOn(window, 'fetch').mockResolvedValue(Response.json([]));
			const control = new SearchControl().addTo(map);
			await control.search('Innsbruck');
			expect(fetch.mock.calls[0][0]).to.contain('nominatim.openstreetmap.org');
		});
	});
});
