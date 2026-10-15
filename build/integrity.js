// This script calculates the integrity hashes of the files in dist/ , and
// **overwrites** the values in the documentation.
import {readFileSync, writeFileSync} from 'node:fs';
import https from 'node:https';
import ssri from 'ssri';
import pkg from '../package.json' with {type: 'json'};

const getIntegrity = path => new Promise((resolve) => {
	https.get(`https://cdn.jsdelivr.net/npm/leaflet@${pkg.version}/dist/${path}`, (res) => {
		ssri.fromStream(res, {algorithms: ['sha256']}).then(integrity => resolve(integrity.toString()));
	});
});

const integrityUglified = await getIntegrity('maplair.js');
const integritySrc = await getIntegrity('maplair-src.js');
const integrityUglifiedGlobal = await getIntegrity('maplair-global.js');
const integritySrcGlobal = await getIntegrity('maplair-global-src.js');
const integrityCss = await getIntegrity('maplair.css');

console.log(`Integrity hashes for ${pkg.version}:`);
console.log(`dist/maplair.js:            ${integrityUglified}`);
console.log(`dist/maplair-src.js:        ${integritySrc}`);
console.log(`dist/maplair-global.js:     ${integrityUglifiedGlobal}`);
console.log(`dist/maplair-global-src.js: ${integritySrcGlobal}`);
console.log(`dist/maplair.css:           ${integrityCss}`);

let docConfig = readFileSync('docs/_config.yml', 'utf8');

docConfig = docConfig
	.replace(/latest_maplair_version:.*/,  `latest_maplair_version: ${pkg.version}`)
	.replace(/integrity_hash_source:.*/,   `integrity_hash_source: "${integritySrc}"`)
	.replace(/integrity_hash_uglified:.*/, `integrity_hash_uglified: "${integrityUglified}"`)
	.replace(/integrity_hash_global_source:.*/,   `integrity_hash_global_source: "${integritySrcGlobal}"`)
	.replace(/integrity_hash_global_uglified:.*/, `integrity_hash_global_uglified: "${integrityUglifiedGlobal}"`)
	.replace(/integrity_hash_css:.*/,      `integrity_hash_css: "${integrityCss}"`);

writeFileSync('docs/_config.yml', docConfig);
