// Extracts the strings passed to `I18n.translate()` in src/ into i18n/en.json,
// the source file for translations on Transifex (see .tx/config).
import {readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const pattern = /I18n\.translate\(\s*'((?:[^'\\]|\\.)*)'/g;
const strings = new Set();

for (const file of readdirSync('src', {recursive: true})) {
	if (!file.endsWith('.js')) { continue; }
	for (const [, string] of readFileSync(join('src', file), 'utf8').matchAll(pattern)) {
		strings.add(string.replaceAll(/\\(.)/g, '$1'));
	}
}

const messages = Object.fromEntries([...strings].toSorted().map(s => [s, s]));
writeFileSync('i18n/en.json', `${JSON.stringify(messages, null, '\t')}\n`);
console.log(`Extracted ${strings.size} strings to i18n/en.json`);
