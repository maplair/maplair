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
    /**
     * Define localized strings for a given locale, defined by `locale`.
     * @param {string} locale
     * @param {Record<string, string>} [messages]
     * @returns {void}
     */
    static registerLocale(locale: string, messages?: Record<string, string>): void;
    /**
     * Define or change the locale code to be used when translating strings.
     * Note that changing the locale does not affect already instantiated objects.
     * @param {string|null} locale
     * @returns {void}
     */
    static setLocale(locale: string | null): void;
    /**
     * Returns the current locale code, that will be used when translating strings.
     * @returns {string|null}
     */
    static getLocale(): string | null;
    /**
     * Actually try to translate the `string`, with optional variable passed in `data`.
     * @param {string} string
     * @param {Record<string, any>} [data]
     * @returns {string}
     */
    static translate(string: string, data?: Record<string, any>): string;
}
