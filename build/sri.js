// Computes the Subresource Integrity hashes of the published files of `latest_maplair_version` in build/site.json,
// for the CDN snippets in the docs, and writes them to build/site.json. Run after a release is on npm:
// `node build/sri.js`
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';

const file = 'build/site.json',
site = JSON.parse(readFileSync(file, 'utf8')),
version = site.latest_maplair_version,
files = {css: 'maplair.css', js: 'maplair.js', global: 'maplair-global.js'};

site.latest_maplair_integrity = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, name]) => {
	const url = `https://cdn.jsdelivr.net/npm/maplair@${version}/dist/${name}`,
	response = await fetch(url);
	if (!response.ok) { throw new Error(`${url}: ${response.status}`); }
	const hash = createHash('sha384').update(Buffer.from(await response.arrayBuffer())).digest('base64');
	return [key, `sha384-${hash}`];
})));

writeFileSync(file, `${JSON.stringify(site, null, '\t')}\n`);
console.log(`Wrote the integrity hashes of maplair@${version} to ${file}`);
