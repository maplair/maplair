const chrome = userAgentContains('chrome');

const safari = !chrome && userAgentContains('safari');

const mobile = typeof orientation !== 'undefined';

const reducedMotion = typeof navigator !== 'undefined' && navigator.preferences?.reducedMotion?.value ?
	navigator.preferences.reducedMotion.value === 'reduce' :
	typeof window === 'undefined' ? true : window?.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pointer = typeof window === 'undefined' ? false : !!window.PointerEvent;

const touchNative = typeof window === 'undefined' ? false : 'ontouchstart' in window || !!(window.TouchEvent);

const touch = touchNative || pointer;

function isRetina() {
	return typeof window === 'undefined' || typeof window.devicePixelRatio === 'undefined' ? false : window.devicePixelRatio > 1;
}

const mac = typeof navigator === 'undefined' || typeof navigator.platform === 'undefined' ? false : navigator.platform.startsWith('Mac');

const linux = typeof navigator === 'undefined' || typeof navigator.platform === 'undefined' ? false : navigator.platform.startsWith('Linux');

function userAgentContains(str) {
	if (typeof navigator === 'undefined' || typeof navigator.userAgent === 'undefined') {
		return false;
	}
	return navigator.userAgent.toLowerCase().includes(str);
}

/**
 * A namespace with static properties for browser/feature detection used by Maplair
 * internally.
 *
 * @example
 * ```js
 * if (Browser.chrome) {
 *   alert('You are running Chrome!');
 * }
 * ```
 * @type {Readonly<Record<string, boolean>>}
 */
export default {
	/**
	 * `true` for the Chrome browser.
	 * @type {boolean}
	 */
	chrome,
	/**
	 * `true` for the Safari browser.
	 * @type {boolean}
	 */
	safari,
	/**
	 * `true` for all browsers running in a mobile device.
	 * @type {boolean}
	 */
	mobile,
	/**
	 * `true` if the user has
	 * [configured their environment for reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion#user_preferences).
	 * Determines whether animations should play or not.
	 * @type {boolean}
	 */
	reducedMotion,
	/**
	 * `true` for all browsers supporting
	 * [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
	 * @type {boolean}
	 */
	pointer,
	/**
	 * `true` for all browsers supporting either [touch](#browser-touch) or
	 * [pointer](#browser-pointer) events.
	 * Note: pointer events will be preferred (if available), and processed for all
	 * `touch*` listeners.
	 * @type {boolean}
	 */
	touch,
	/**
	 * `true` for all browsers supporting
	 * [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
	 * **This does not necessarily mean** that the browser is running in a computer with
	 * a touchscreen, it only means that the browser is capable of understanding
	 * touch events.
	 * @type {boolean}
	 */
	touchNative,
	/**
	 * `true` for browsers on a high-resolution "retina" screen or on any screen when
	 * browser's display zoom is more than 100%. Follows changes of the
	 * `devicePixelRatio`, e.g. when moving the window to another screen (see the map's
	 * `pixelratiochange` event).
	 * @type {boolean}
	 */
	get retina() {
		return isRetina();
	},
	/**
	 * `true` when the browser is running in a Mac platform.
	 * @type {boolean}
	 */
	mac,
	/**
	 * `true` when the browser is running in a Linux platform.
	 * @type {boolean}
	 */
	linux
};
