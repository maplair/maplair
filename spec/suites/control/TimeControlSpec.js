import {expect, vi} from 'vite-plus/test';
import {Evented, I18n, MaplairMap, TimeControl, WMSTileLayer} from 'maplair';
import UIEventSimulator from 'ui-event-simulator';
import {createContainer, removeMapContainer} from '../SpecHelper.js';

describe('TimeControl', () => {
	let container, map;

	beforeEach(() => {
		container = createContainer();
		map = new MaplairMap(container, {zoomControl: false, fadeAnimation: false, zoomAnimation: false});
		map.setView([0, 0], 2);
	});

	afterEach(() => {
		removeMapContainer(map, container);
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	const iso = control => control.getTimes().map(t => t.toISOString());
	const button = (control, name) => control.getContainer().querySelector(`.maplair-control-time-${name}`);

	// a layer on the map which loads after calling `finish()`
	function fakeLayer() {
		const layer = new Evented();
		layer._map = map;
		layer.setTime = vi.fn(() => { layer.loading = true; });
		layer.isLoading = () => layer.loading;
		layer.finish = () => {
			layer.loading = false;
			layer.fire('load');
		};
		return layer;
	}

	describe('interval', () => {
		it('steps from the start to the end', () => {
			const control = new TimeControl({interval: '2026-10-17T00:00Z/2026-10-18T00:00Z', period: 'PT1H'});
			const times = iso(control);
			expect(times).to.have.length(25);
			expect(times[0]).to.equal('2026-10-17T00:00:00.000Z');
			expect(times[1]).to.equal('2026-10-17T01:00:00.000Z');
			expect(times.at(-1)).to.equal('2026-10-18T00:00:00.000Z');
		});

		it('excludes the end if it is not on a step', () => {
			const control = new TimeControl({interval: '2026-10-17T00:00Z/2026-10-17T01:00Z', period: 'PT25M'});
			expect(iso(control)).to.deep.equal(['2026-10-17T00:00:00.000Z', '2026-10-17T00:25:00.000Z', '2026-10-17T00:50:00.000Z']);
		});

		it('accepts start/duration and duration/end', () => {
			const end = new TimeControl({interval: 'PT2H/2026-10-17T12:00Z', period: 'PT1H'});
			expect(iso(end)).to.deep.equal(['2026-10-17T10:00:00.000Z', '2026-10-17T11:00:00.000Z', '2026-10-17T12:00:00.000Z']);
			const start = new TimeControl({interval: '2026-10-17T12:00Z/P1DT12H', period: 'PT12H'});
			expect(iso(start)).to.deep.equal(['2026-10-17T12:00:00.000Z', '2026-10-18T00:00:00.000Z', '2026-10-18T12:00:00.000Z', '2026-10-19T00:00:00.000Z']);
		});

		it('takes the period from a third part', () => {
			const control = new TimeControl({interval: '2026-10-16T00:00:00.000Z/2026-10-16T00:15:00.000Z/PT5M'});
			expect(iso(control)).to.have.length(4);
		});

		it('steps by days by default, by weeks, months and years', () => {
			expect(iso(new TimeControl({interval: '2026-10-17/2026-10-19'}))).to.deep.equal(['2026-10-17T00:00:00.000Z', '2026-10-18T00:00:00.000Z', '2026-10-19T00:00:00.000Z']);
			expect(iso(new TimeControl({interval: '2026-10-01/P2W', period: 'P1W'}))).to.have.length(3);
			const months = iso(new TimeControl({interval: '2026-01-01/2026-12-31', period: 'P1M'}));
			expect(months).to.have.length(12);
			expect(months[1]).to.equal('2026-02-01T00:00:00.000Z');
			expect(months[11]).to.equal('2026-12-01T00:00:00.000Z');
			expect(iso(new TimeControl({interval: 'P2Y/2026-01-01', period: 'P1Y'}))).to.deep.equal(['2024-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
		});

		it('throws for invalid or unsupported intervals and durations', () => {
			for (const [interval, period] of [
				['2026-10-17', 'PT1H'],
				['2026-10-17/2026-10-18', 'P'],
				['2026-10-17/2026-10-18', 'PT'],
				['2026-10-17/2026-10-18', 'PT0.5H'],
				['2026-10-17/2026-10-18', 'P0D'],
				['2026-10-17/2026-10-18', '1H'],
				['yesterday/2026-10-18', 'PT1H'],
				['2026-10-17/P1X', 'PT1H']
			]) {
				expect(() => new TimeControl({interval, period}), `${interval} ${period}`).to.throw();
			}
		});
	});

	describe('times', () => {
		const times = ['2026-10-17T00:00Z', '2026-10-17T01:00Z', '2026-10-17T02:00Z'];

		it('accepts dates, timestamps and strings', () => {
			const control = new TimeControl({times: [new Date(times[0]), Date.parse(times[1]), times[2]]});
			expect(iso(control)).to.deep.equal(['2026-10-17T00:00:00.000Z', '2026-10-17T01:00:00.000Z', '2026-10-17T02:00:00.000Z']);
		});

		it('shows the nearest time to the current time by default', () => {
			vi.useFakeTimers({toFake: ['Date']});
			vi.setSystemTime(new Date('2026-10-17T01:20Z'));
			expect(new TimeControl({times}).getTime().toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			vi.setSystemTime(new Date('2027-01-01T00:00Z'));
			expect(new TimeControl({times}).getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
		});

		it('shows the nearest time to the time option and to setTime()', () => {
			const control = new TimeControl({times, time: '2026-10-16T00:00Z'});
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
			control.setTime(Date.parse('2026-10-17T01:40Z'));
			expect(control.getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
		});

		it('keeps the nearest time with setTimes()', () => {
			const control = new TimeControl({times, time: times[1]});
			control.setTimes(['2026-10-17T00:50Z', '2026-10-17T03:00Z']);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:50:00.000Z');
			control.setTimes([]);
			expect(control.getTime()).to.be.undefined;
		});
	});

	describe('stepping', () => {
		const times = ['2026-10-17T00:00Z', '2026-10-17T01:00Z', '2026-10-17T02:00Z'];

		it('stops at the first and last time', () => {
			const control = new TimeControl({times, time: times[0]}).addTo(map);
			expect(button(control, 'previous').getAttribute('aria-disabled')).to.equal('true');
			control.previous();
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
			control.next().next().next();
			expect(control.getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
			expect(button(control, 'next').getAttribute('aria-disabled')).to.equal('true');
			expect(button(control, 'previous').getAttribute('aria-disabled')).to.equal('false');
		});

		it('wraps around with loop', () => {
			const control = new TimeControl({times, time: times[2], loop: true}).addTo(map);
			expect(button(control, 'next').getAttribute('aria-disabled')).to.equal('false');
			control.next();
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
			control.previous();
			expect(control.getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
		});

		it('steps with the buttons', () => {
			const control = new TimeControl({times, time: times[0]}).addTo(map);
			UIEventSimulator.fire('click', button(control, 'next'));
			expect(control.getTime().toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			UIEventSimulator.fire('click', button(control, 'previous'));
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
		});

		it('fires timechange on the map when the time changes', () => {
			const control = new TimeControl({times, time: times[0]}).addTo(map);
			const onChange = vi.fn();
			map.on('timechange', onChange);
			control.next();
			control.setTime(times[1]);
			expect(onChange).toHaveBeenCalledOnce();
			expect(onChange.mock.calls[0][0].time.toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			expect(onChange.mock.calls[0][0].index).to.equal(1);
		});

		it('sets the time with the slider and labels it', () => {
			const formatTime = date => `${date.getUTCHours()} h`;
			const control = new TimeControl({times, time: times[0], formatTime}).addTo(map);
			const slider = control.getContainer().querySelector('input[type="range"]');
			expect(slider.max).to.equal('2');
			expect(slider.getAttribute('aria-label')).to.equal('Time');
			expect(slider.getAttribute('aria-valuetext')).to.equal('0 h');
			slider.value = '2';
			slider.dispatchEvent(new Event('input'));
			expect(control.getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
			expect(control.getContainer().querySelector('.maplair-control-time-label').textContent).to.equal('2 h');
		});

		it('translates the labels of the buttons', () => {
			I18n.registerLocale('de-x-test', {Play: 'Abspielen', Pause: 'Pausieren'});
			I18n.setLocale('de-x-test');
			try {
				const control = new TimeControl({times}).addTo(map);
				const play = button(control, 'play');
				expect(play.getAttribute('aria-label')).to.equal('Abspielen');
				control.play();
				expect(play.getAttribute('aria-label')).to.equal('Pausieren');
				control.pause();
			} finally {
				I18n.setLocale(null);
			}
		});
	});

	describe('playing', () => {
		const times = ['2026-10-17T00:00Z', '2026-10-17T01:00Z', '2026-10-17T02:00Z'];

		beforeEach(() => {
			vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']});
		});

		it('advances every transitionTime and stops at the last time', () => {
			const control = new TimeControl({times, time: times[0], transitionTime: 500}).addTo(map);
			control.play();
			expect(control.isPlaying()).to.be.true;
			vi.advanceTimersByTime(499);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
			vi.advanceTimersByTime(1);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			vi.advanceTimersByTime(500);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
			vi.advanceTimersByTime(500);
			expect(control.isPlaying()).to.be.false;
			expect(control.getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
		});

		it('starts over from the last time and loops', () => {
			const control = new TimeControl({times, time: times[2], transitionTime: 500, loop: true}).addTo(map);
			UIEventSimulator.fire('click', button(control, 'play'));
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
			vi.advanceTimersByTime(1500);
			expect(control.isPlaying()).to.be.true;
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
			UIEventSimulator.fire('click', button(control, 'play'));
			expect(control.isPlaying()).to.be.false;
			vi.advanceTimersByTime(1500);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
		});

		it('waits for the layers to load', () => {
			const layer = fakeLayer();
			const control = new TimeControl({times, time: times[0], transitionTime: 500, layers: [layer]}).addTo(map);
			expect(layer.setTime).toHaveBeenCalledWith(new Date(times[0]));
			control.play();
			vi.advanceTimersByTime(1000);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
			layer.finish();
			expect(control.getTime().toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			expect(layer.setTime).toHaveBeenLastCalledWith(new Date(times[1]));

			// loaded before the transition time is over
			layer.finish();
			vi.advanceTimersByTime(499);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			vi.advanceTimersByTime(1);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T02:00:00.000Z');
		});

		it('does not wait for removed layers', () => {
			const layer = fakeLayer();
			const control = new TimeControl({times, time: times[0], transitionTime: 500, layers: [layer]}).addTo(map);
			control.play();
			vi.advanceTimersByTime(500);
			control.removeLayer(layer);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			expect(layer.setTime).toHaveBeenCalledOnce();
		});

		it('stops when removed from the map', () => {
			const control = new TimeControl({times, time: times[0], transitionTime: 500}).addTo(map);
			control.play();
			control.remove();
			vi.advanceTimersByTime(1000);
			expect(control.isPlaying()).to.be.false;
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');
		});
	});

	describe('WMSTileLayer', () => {
		// a transparent 1×1 GIF
		const gif = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));
		let pending;

		beforeEach(() => {
			pending = [];
			// The tiles load when calling `respondAll()`, see the `fetchOptions` option.
			vi.spyOn(window, 'fetch').mockImplementation((url, init) => new Promise((resolve, reject) => {
				pending.push({url, respond: () => resolve(new Response(gif))});
				init.signal.addEventListener('abort', () => reject(init.signal.reason));
			}));
		});

		function respondAll() {
			for (const request of pending.splice(0)) {
				request.respond();
			}
		}

		it('sets the time parameter and advances after the tiles have loaded', async () => {
			vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout']});
			const layer = new WMSTileLayer('https://wms.example.com/', {layers: 'radar', fetchOptions: {}});
			const control = new TimeControl({
				interval: '2026-10-17T00:00Z/2026-10-17T02:00Z',
				period: 'PT1H',
				time: 0,
				transitionTime: 100,
				layers: [layer]
			}).addTo(map);
			layer.addTo(map);
			expect(pending.length).to.be.greaterThan(0);
			expect(pending.every(r => new URL(r.url).searchParams.get('time') === '2026-10-17T00:00:00.000Z')).to.be.true;

			control.play();
			vi.advanceTimersByTime(100);
			expect(control.getTime().toISOString()).to.equal('2026-10-17T00:00:00.000Z');

			const load = new Promise((resolve) => { layer.once('load', resolve); });
			respondAll();
			await load;
			expect(control.getTime().toISOString()).to.equal('2026-10-17T01:00:00.000Z');
			expect(layer.wmsParams.time).to.equal('2026-10-17T01:00:00.000Z');
			expect(pending.every(r => new URL(r.url).searchParams.get('time') === '2026-10-17T01:00:00.000Z')).to.be.true;
			control.pause();
		});
	});
});
