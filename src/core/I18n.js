import * as Util from './Util.js';

/**
 * Utility functions to deal with translations.
 *
 * Translations of Maplair's built-in strings are maintained on
 * [Transifex](https://app.transifex.com/simon04/maplair/) and published in the
 * `i18n` directory of the package. Load one before creating the map, see the example.
 *
 * @example
 * ```js
 * import {I18n} from 'maplair';
 * import de from 'maplair/i18n/de.json' with {type: 'json'};
 *
 * I18n.registerLocale('de', de);
 * I18n.setLocale('de');
 * ```
 */
export class I18n {
	// All localized strings, by locale.
	static #messages = {};

	// The current locale code, that will be used when translating strings.
	static #locale = null;

	/**
	 * Define localized strings for a given locale, defined by `locale`.
	 * @param {string} locale
	 * @param {Record<string, string>} [messages]
	 * @returns {void}
	 */
	static registerLocale(locale, messages) {
		this.#messages[locale] = {...this.#messages[locale], ...messages};
	}

	/**
	 * Define or change the locale code to be used when translating strings.
	 * Note that changing the locale does not affect already instantiated objects.
	 * @param {string|null} locale
	 * @returns {void}
	 */
	static setLocale(locale) {
		this.#locale = locale;
	}

	/**
	 * Returns the current locale code, that will be used when translating strings.
	 * @returns {string|null}
	 */
	static getLocale() {
		return this.#locale;
	}

	/**
	 * Actually try to translate the `string`, with optional variable passed in `data`.
	 * @param {string} string
	 * @param {Record<string, any>} [data]
	 * @returns {string}
	 */
	static translate(string, data = {}) {
		// If the locale is not set, localization is not enabled.
		if (this.#locale === null) {
			return Util.template(string, data);
		}

		const translation = this.#messages[this.#locale]?.[string];

		if (!translation) {
			console.warn(`No translation found for "${string}", falling back to the original string.`);
			return Util.template(string, data);
		}

		try {
			// Do not fail if some data is missing
			// a bad translation should not break the app
			return Util.template(translation, data);
		} catch (err) {
			console.error(`Error while translating "${translation}".`, err);
			return translation;
		}
	}

}
