import { disableClickPropagation, disableScrollPropagation, on } from "../dom/DomEvent.js";
import { create } from "../dom/DomUtil.js";
import { Control } from "./Control.js";
import { I18n } from "../core/I18n.js";
import { ButtonControl } from "./ButtonControl.js";
// src/control/TimeControl.js
/** @import {ControlOptions} from './Control.js' */
/** @import {MaplairMap} from '../map/Map.js' */
/** @import {Layer} from '../layer/Layer.js' */
/** @import {MaplairEvent} from '../core/Events.js' */
const icon = (path) => `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="${path}"/></svg>`;
const previousIcon = icon("M3 3h2v10H3zm10 0v10L6 8z");
const playIcon = icon("M4 2v12l10-6z");
const pauseIcon = icon("M4 3h3v10H4zm5 0h3v10H9z");
const nextIcon = icon("M11 3h2v10h-2zM3 3v10l7-5z");
const durationRe = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
function parseDuration(duration) {
	const match = durationRe.exec(duration);
	if (!match || duration === "P" || duration.endsWith("T")) throw new Error(`Invalid or unsupported ISO 8601 duration "${duration}".`);
	const [years, months, weeks, days, hours, minutes, seconds] = match.slice(1).map((n) => Number(n ?? 0));
	return {
		years,
		months,
		ms: ((((weeks * 7 + days) * 24 + hours) * 60 + minutes) * 60 + seconds) * 1e3
	};
}
function addDuration(time, duration, n) {
	const date = new Date(time);
	date.setUTCFullYear(date.getUTCFullYear() + n * duration.years, date.getUTCMonth() + n * duration.months);
	return new Date(+date + n * duration.ms);
}
function parseDate(date) {
	const time = Date.parse(date);
	if (Number.isNaN(time)) throw new Error(`Invalid date "${date}".`);
	return new Date(time);
}
function intervalTimes(interval, period) {
	const parts = interval.split("/");
	if (parts.length === 3) period = parts.pop();
	if (parts.length !== 2) throw new Error(`Invalid ISO 8601 interval "${interval}".`);
	const [first, second] = parts, step = parseDuration(period);
	let start, end;
	if (first.startsWith("P")) {
		end = parseDate(second);
		start = addDuration(end, parseDuration(first), -1);
	} else {
		start = parseDate(first);
		end = second.startsWith("P") ? addDuration(start, parseDuration(second), 1) : parseDate(second);
	}
	if (!(addDuration(start, step, 1) > start)) throw new Error(`The period "${period}" has to be positive.`);
	const times = [];
	for (let i = 0, time = start; time <= end; time = addDuration(start, step, ++i)) times.push(time);
	return times;
}
/**
* Options of `TimeControl`.
* @typedef {object} TimeControlOptions
* @property {string} [position='bottomleft'] The position of the control (one of the map
* corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
* `'bottomright'`.
* @property {(Date|number|string)[]} [times] The times to step through in ascending
* order: dates, timestamps or date strings (parsed with `Date.parse()`).
* @property {string} [interval] Instead of `times`, an ISO 8601 time interval whose times
* every [`period`](#timecontrol-period) from the start up to the end are stepped
* through: `start/end` (e.g. `'2026-10-17T00:00Z/2026-10-18T00:00Z'`), `start/duration`
* (e.g. `'2026-10-17T00:00Z/P1D'`) or `duration/end` (e.g. `'PT24H/2026-10-18T00:00Z'`).
* A third part is the period, as in the time dimension of WMS capabilities (e.g.
* `'2026-10-17T00:00Z/2026-10-18T00:00Z/PT5M'`). Start and end are parsed with
* `Date.parse()`, e.g. `2026-10-17`, `2026-10-17T12:00Z` or
* `2026-10-17T12:00:00.000+02:00` (without a time zone, times are local times).
* @property {string} [period='P1D'] The ISO 8601 duration between the times of the
* `interval`: integer numbers of years, months, weeks, days, hours, minutes and seconds,
* e.g. `'PT1H'`, `'PT5M'`, `'P1DT12H'` or `'P1M'` (years and months are added in UTC).
* @property {Date|number|string} [time] The initial time (the nearest of the times), by
* default the current time.
* @property {(Layer & TimeLayer)[]} [layers=[]] The layers showing the current time, see
* `addLayer()`.
* @property {number} [transitionTime=1000] The minimum time in milliseconds a time is
* shown while playing. The next time is shown only after the layers have loaded, too.
* @property {boolean} [loop=false] Whether playing starts over after the last time
* instead of stopping, and the buttons step from the last time to the first one and
* back.
* @property {(date: Date) => string} [formatTime] Returns the text of the label for a
* time, by default the date and time by `Intl.DateTimeFormat` in the [locale](#i18n)
* (or the browser's language) and the browser's time zone.
* @extends ControlOptions
*/
/**
* A layer showing a given time, see `TimeControl`.
* @typedef {object} TimeLayer
* @property {(date: Date) => any} [setTime] Shows the given time.
*/
/**
* The event object of `timechange`.
* @typedef {object} TimeChangeEvent
* @property {Date} time The current time.
* @property {number} index The index of the current time in the times of the control.
* @extends MaplairEvent
*/
/**
* A control to step through or play the times of time-dependent layers, e.g. an
* animated weather radar from a WMS with a `TIME` dimension. It has buttons for the
* previous and next time and to play or pause, a slider (usable with the arrow, Home
* and End keys) and a label with the current time.
*
* Each of the `layers` shows the current time: by its method `setTime(date)` if it has
* one, otherwise by the parameter `time` set to the time in ISO 8601 format
* (`date.toISOString()`): the WMS parameter of a `WMSTileLayer` (with `setParams()`) or
* the variable of the URL template of a `TileLayer` (e.g.
* `'https://…/{time}/{z}/{x}/{y}.png'`, with `setUrl()`). The tiles of the previous
* time stay visible until the new ones have loaded, and playing waits for them (the
* `load` event), so that no time is skipped with slow servers.
*
* Replaces the [Leaflet.TimeDimension](https://github.com/socib/Leaflet.TimeDimension)
* plugin for the common use cases.
*
* @example
* ```js
* const radar = new WMSTileLayer('https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi', {
* 	layers: 'nexrad-n0r-wmst',
* 	format: 'image/png',
* 	transparent: true
* }).addTo(map);
*
* new TimeControl({
* 	interval: '2013-05-20T18:00Z/2013-05-20T22:00Z',
* 	period: 'PT5M',
* 	layers: [radar],
* 	loop: true
* }).addTo(map);
*
* map.on('timechange', e => console.log(e.time));
* ```
*
* @fires MaplairMap#timechange {TimeChangeEvent} Fired when the current time of a
* `TimeControl` changes.
*/
var TimeControl = class TimeControl extends Control {
	static defaultOptions = {
		position: "bottomleft",
		times: void 0,
		interval: void 0,
		period: "P1D",
		time: void 0,
		layers: [],
		transitionTime: 1e3,
		loop: false,
		formatTime: void 0
	};
	/**
	* Creates a time control.
	* @param {...TimeControlOptions} args The options.
	*/
	constructor(...args) {
		super(...args);
		const { times, interval, period, time, layers } = this.options;
		this._layers = [];
		this._playing = false;
		this._times = [];
		this._index = -1;
		this.setTimes(interval ? intervalTimes(interval, period) : times ?? [], time);
		for (const layer of layers) this.addLayer(layer);
		this.callInitHooks(TimeControl);
	}
	/**
	* @internal
	* @param {MaplairMap} map
	* @returns {HTMLElement}
	*/
	onAdd(map) {
		const container = create("div", "maplair-bar maplair-control-time");
		disableClickPropagation(container);
		disableScrollPropagation(container);
		this._previousButton = new ButtonControl({
			className: "maplair-control-time-previous",
			content: previousIcon,
			title: I18n.translate("Step back"),
			onClick: () => this.previous()
		});
		this._playButton = new ButtonControl({
			className: "maplair-control-time-play",
			states: [{
				name: "play",
				content: playIcon,
				title: I18n.translate("Play"),
				onClick: () => this.play()
			}, {
				name: "pause",
				content: pauseIcon,
				title: I18n.translate("Pause"),
				onClick: () => this.pause()
			}]
		});
		this._nextButton = new ButtonControl({
			className: "maplair-control-time-next",
			content: nextIcon,
			title: I18n.translate("Step forward"),
			onClick: () => this.next()
		});
		for (const button of [
			this._previousButton,
			this._playButton,
			this._nextButton
		]) {
			button._map = map;
			button._createButton(container);
		}
		const slider = this._slider = create("input", "maplair-control-time-slider", container);
		slider.type = "range";
		slider.min = "0";
		slider.step = "1";
		slider.setAttribute("aria-label", I18n.translate("Time"));
		on(slider, "input", this._onSliderInput, this);
		this._label = create("span", "maplair-control-time-label", container);
		this._formatter = new Intl.DateTimeFormat(I18n.getLocale() ?? void 0, {
			dateStyle: "short",
			timeStyle: "short"
		});
		this._updateControl();
		return container;
	}
	/**
	* @internal
	*/
	onRemove() {
		this.pause();
		this._slider = null;
	}
	_onSliderInput() {
		this.pause();
		this._setIndex(Number(this._slider.value));
	}
	_updateControl() {
		if (!this._slider) return;
		const index = this._index, last = this._times.length - 1, time = this.getTime(), text = time ? (this.options.formatTime ?? this._formatter.format)(time) : "", loop = this.options.loop;
		this._slider.max = String(Math.max(last, 0));
		this._slider.value = String(Math.max(index, 0));
		this._slider.disabled = last < 1;
		this._slider.setAttribute("aria-valuetext", text);
		this._label.textContent = text;
		this._playButton.setState(this._playing ? "pause" : "play");
		this._setDisabled(this._playButton, last < 1);
		this._setDisabled(this._previousButton, last < 1 || index === 0 && !loop);
		this._setDisabled(this._nextButton, last < 1 || index === last && !loop);
	}
	_setDisabled(button, disabled) {
		if (disabled) button.disable();
		else button.enable();
	}
	/**
	* Sets the times to step through, see the [`times` option](#timecontrol-times), and
	* shows the nearest of them to `time`, by default to the current time of the control.
	* @param {(Date|number|string)[]} times
	* @param {Date|number|string} [time]
	* @returns {this}
	*/
	setTimes(times, time = this.getTime()) {
		this._times = times.map((t) => new Date(t));
		this._index = -1;
		if (this._times.length < 2) this.pause();
		return this.setTime(time ?? Date.now());
	}
	/**
	* Returns the times to step through.
	* @returns {Date[]}
	*/
	getTimes() {
		return this._times;
	}
	/**
	* Shows the nearest of the times to the given time.
	* @param {Date|number|string} time
	* @returns {this}
	*/
	setTime(time) {
		const ms = +new Date(time);
		let index = this._times.length ? 0 : -1;
		this._times.forEach((t, i) => {
			if (Math.abs(+t - ms) < Math.abs(+this._times[index] - ms)) index = i;
		});
		return this._setIndex(index);
	}
	/**
	* Returns the current time.
	* @returns {Date|undefined}
	*/
	getTime() {
		return this._times[this._index];
	}
	_setIndex(index) {
		if (index !== this._index) {
			this._index = index;
			for (const layer of this._layers) this._updateLayer(layer);
			if (index >= 0) this._map?.fire("timechange", {
				time: this.getTime(),
				index
			});
			if (this._playing) this._schedule();
		}
		this._updateControl();
		return this;
	}
	/**
	* Shows the next time (or the first one after the last one if looping).
	* @returns {this}
	*/
	next() {
		if (this._index < this._times.length - 1) this._setIndex(this._index + 1);
		else if (this.options.loop && this._times.length > 1) this._setIndex(0);
		return this;
	}
	/**
	* Shows the previous time (or the last one before the first one if looping).
	* @returns {this}
	*/
	previous() {
		if (this._index > 0) this._setIndex(this._index - 1);
		else if (this.options.loop && this._times.length > 1) this._setIndex(this._times.length - 1);
		return this;
	}
	/**
	* Plays the times one after the other, each for at least the
	* [`transitionTime`](#timecontrol-transitiontime) and until the layers have loaded.
	* Starts at the first time if the last one is shown. Stops at the last time unless
	* [looping](#timecontrol-loop).
	* @returns {this}
	*/
	play() {
		if (this._playing || this._times.length < 2) return this;
		this._playing = true;
		if (this._index === this._times.length - 1) this._setIndex(0);
		else {
			this._schedule();
			this._updateControl();
		}
		return this;
	}
	/**
	* Stops playing.
	* @returns {this}
	*/
	pause() {
		clearTimeout(this._timeout);
		this._timeout = null;
		if (this._playing) {
			this._playing = false;
			this._updateControl();
		}
		return this;
	}
	/**
	* Returns `true` while playing.
	* @returns {boolean}
	*/
	isPlaying() {
		return this._playing;
	}
	_schedule() {
		clearTimeout(this._timeout);
		this._timeout = setTimeout(() => {
			this._timeout = null;
			this._advance();
		}, this.options.transitionTime);
	}
	_advance() {
		if (!this._playing || this._timeout || this._layers.some((layer) => layer._map && layer.isLoading?.())) return;
		if (this._index < this._times.length - 1 || this.options.loop) this.next();
		else this.pause();
	}
	_updateLayer(layer) {
		const time = this.getTime();
		if (!time) return;
		if (typeof layer.setTime === "function") layer.setTime(time);
		else if (typeof layer.setParams === "function") layer.setParams({ time: time.toISOString() });
		else if (typeof layer.setUrl === "function") {
			layer.options.time = time.toISOString();
			layer.setUrl(layer._url, false);
		}
	}
	/**
	* Adds a layer showing the current time, see the [`layers` option](#timecontrol-layers).
	* The layer still has to be added to the map.
	* @param {Layer & TimeLayer} layer
	* @returns {this}
	*/
	addLayer(layer) {
		if (this._layers.includes(layer)) return this;
		this._layers.push(layer);
		layer.on("load remove", this._advance, this);
		this._updateLayer(layer);
		return this;
	}
	/**
	* Removes a layer from the layers showing the current time.
	* @param {Layer} layer
	* @returns {this}
	*/
	removeLayer(layer) {
		this._layers = this._layers.filter((l) => l !== layer);
		layer.off("load remove", this._advance, this);
		this._advance();
		return this;
	}
};
export { TimeControl };

//# sourceMappingURL=TimeControl.js.map