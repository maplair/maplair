// Checks that bundlers drop the optional features (see `exports` in package.json)
// unless they are imported: bundles small apps against the ES modules in dist/esm
// (run `pnpm run build` first) with Vite+, and looks for code of each feature.
import {build} from 'vite-plus';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const dir = fileURLToPath(new URL('./.tree-shaking/', import.meta.url));

// code which only the respective feature contains
const features = {
	'map-rotation': 'maplair-rotate-pane',
	'marker-rotation': 'setRotationAngle',
	'marker-movement': 'moveAlong',
	'dash-animation': 'maplair-dash-animated',
	'path-decorations': 'maplair-path-arrowheads',
	'geojson-loading': '_loadAbort'
};

const base = `import {MaplairMap, TileLayer, Marker, Polyline, GeoJSON} from 'maplair';
const map = new MaplairMap('map').setView([0, 0], 2);
new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
new Marker([0, 0]).addTo(map).bindPopup('Hello');
new Polyline([[0, 0], [1, 1]]).addTo(map);
new GeoJSON({type: 'Point', coordinates: [0, 0]}).addTo(map);
`;

// the features expected in the bundle of each app
const apps = {
	'without features': {code: base, expected: []},
	...Object.fromEntries(Object.keys(features).map(feature => [feature, {
		code: `import 'maplair/${feature}';\n${base}`,
		// the map rotation keeps markers upright with the marker rotation
		expected: feature === 'map-rotation' ? [feature, 'marker-rotation'] : [feature]
	}]))
};

let failed = false;
mkdirSync(dir, {recursive: true});
try {
	for (const [name, {code, expected}] of Object.entries(apps)) {
		const file = `${name.replaceAll(' ', '-')}.js`;
		writeFileSync(`${dir}${file}`, code);
		// one after the other, into the same directory
		// eslint-disable-next-line no-await-in-loop
		await build({
			logLevel: 'silent',
			configFile: false,
			root: dir,
			build: {
				outDir: `${dir}dist`,
				emptyOutDir: true,
				minify: true,
				rolldownOptions: {output: {minify: true}},
				lib: {entry: `${dir}${file}`, formats: ['es'], fileName: () => 'app.js'}
			}
		});
		const bundle = readFileSync(`${dir}dist/app.js`, 'utf8');
		const found = Object.keys(features).filter(feature => bundle.includes(features[feature]));
		const ok = found.length === expected.length && expected.every(feature => found.includes(feature));
		failed ||= !ok;
		console.log(`${ok ? '✔' : '✘'} ${name}: ${(bundle.length / 1024).toFixed(1)} kB, features: ${found.join(', ') || 'none'}`);
	}
} finally {
	rmSync(dir, {recursive: true, force: true});
}

if (failed) {
	console.error('Tree-shaking check failed: unexpected features in the bundles.');
	process.exit(1);
}
