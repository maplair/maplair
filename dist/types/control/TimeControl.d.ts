import type { I18n } from '../core/I18n.js';
import type { ControlOptions } from './Control.js';
import type { MaplairEvent } from '../core/Events.js';
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
export class TimeControl extends Control {
    static defaultOptions: Partial<TimeControlOptions>;
    /**
     * Creates a time control.
     * @param {...TimeControlOptions} args The options.
     */
    constructor(options?: TimeControlOptions);
    /**
     * Sets the times to step through, see the [`times` option](#timecontrol-times), and
     * shows the nearest of them to `time`, by default to the current time of the control.
     * @param {(Date|number|string)[]} times
     * @param {Date|number|string} [time]
     * @returns {this}
     */
    setTimes(times: (Date | number | string)[], time?: Date | number | string): this;
    /**
     * Returns the times to step through.
     * @returns {Date[]}
     */
    getTimes(): Date[];
    /**
     * Shows the nearest of the times to the given time.
     * @param {Date|number|string} time
     * @returns {this}
     */
    setTime(time: Date | number | string): this;
    /**
     * Returns the current time.
     * @returns {Date|undefined}
     */
    getTime(): Date | undefined;
    /**
     * Shows the next time (or the first one after the last one if looping).
     * @returns {this}
     */
    next(): this;
    /**
     * Shows the previous time (or the last one before the first one if looping).
     * @returns {this}
     */
    previous(): this;
    /**
     * Plays the times one after the other, each for at least the
     * [`transitionTime`](#timecontrol-transitiontime) and until the layers have loaded.
     * Starts at the first time if the last one is shown. Stops at the last time unless
     * [looping](#timecontrol-loop).
     * @returns {this}
     */
    play(): this;
    /**
     * Stops playing.
     * @returns {this}
     */
    pause(): this;
    /**
     * Returns `true` while playing.
     * @returns {boolean}
     */
    isPlaying(): boolean;
    /**
     * Adds a layer showing the current time, see the [`layers` option](#timecontrol-layers).
     * The layer still has to be added to the map.
     * @param {Layer & TimeLayer} layer
     * @returns {this}
     */
    addLayer(layer: Layer & TimeLayer): this;
    /**
     * Removes a layer from the layers showing the current time.
     * @param {Layer} layer
     * @returns {this}
     */
    removeLayer(layer: Layer): this;
    /** The options of the TimeControl, see [the options](#timecontroloptions). */
    options: TimeControlOptions;
}
/**
 * Options of `TimeControl`.
 */
export interface TimeControlOptions extends ControlOptions {
    /**
     * The position of the control (one of the map
     * corners). Possible values are `'topleft'`, `'topright'`, `'bottomleft'` or
     * `'bottomright'`.
     * @default 'bottomleft'
     */
    position?: string;
    /**
     * The times to step through in ascending
     * order: dates, timestamps or date strings (parsed with `Date.parse()`).
     */
    times?: (Date|number|string)[];
    /**
     * Instead of `times`, an ISO 8601 time interval whose times
     * every [`period`](#timecontrol-period) from the start up to the end are stepped
     * through: `start/end` (e.g. `'2026-10-17T00:00Z/2026-10-18T00:00Z'`), `start/duration`
     * (e.g. `'2026-10-17T00:00Z/P1D'`) or `duration/end` (e.g. `'PT24H/2026-10-18T00:00Z'`).
     * A third part is the period, as in the time dimension of WMS capabilities (e.g.
     * `'2026-10-17T00:00Z/2026-10-18T00:00Z/PT5M'`). Start and end are parsed with
     * `Date.parse()`, e.g. `2026-10-17`, `2026-10-17T12:00Z` or
     * `2026-10-17T12:00:00.000+02:00` (without a time zone, times are local times).
     */
    interval?: string;
    /**
     * The ISO 8601 duration between the times of the
     * `interval`: integer numbers of years, months, weeks, days, hours, minutes and seconds,
     * e.g. `'PT1H'`, `'PT5M'`, `'P1DT12H'` or `'P1M'` (years and months are added in UTC).
     * @default 'P1D'
     */
    period?: string;
    /**
     * The initial time (the nearest of the times), by
     * default the current time.
     */
    time?: Date|number|string;
    /**
     * The layers showing the current time, see
     * `addLayer()`.
     * @default []
     */
    layers?: (Layer & TimeLayer)[];
    /**
     * The minimum time in milliseconds a time is
     * shown while playing. The next time is shown only after the layers have loaded, too.
     * @default 1000
     */
    transitionTime?: number;
    /**
     * Whether playing starts over after the last time
     * instead of stopping, and the buttons step from the last time to the first one and
     * back.
     * @default false
     */
    loop?: boolean;
    /**
     * Returns the text of the label for a
     * time, by default the date and time by `Intl.DateTimeFormat` in the [locale](#i18n)
     * (or the browser's language) and the browser's time zone.
     */
    formatTime?: (date: Date) => string;
}
/**
 * A layer showing a given time, see `TimeControl`.
 */
export interface TimeLayer {
    /**
     * Shows the given time.
     */
    setTime?: (date: Date) => any;
}
/**
 * The event object of `timechange`.
 */
export interface TimeChangeEvent extends MaplairEvent {
    /**
     * The current time.
     */
    time: Date;
    /**
     * The index of the current time in the times of the control.
     */
    index: number;
}
import { Control } from './Control.js';
import type { MaplairMap } from '../map/Map.js';
import { ButtonControl } from './ButtonControl.js';
import type { Layer } from '../layer/Layer.js';
