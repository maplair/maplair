// Checks that bundlers drop the optional features (see `exports` in package.json)
// and the controls unless they are imported: bundles small apps against the ES modules
// in dist/esm (run `pnpm run build` first) with Vite+, and looks for code of each feature.
import {build} from 'vite-plus';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const dir = fileURLToPath(new URL('./.tree-shaking/', import.meta.url));

// code which only the respective feature contains
const features = {
	'map-rotation': 'maplair-rotate-pane',
	'marker-movement': 'moveAlong',
	'dash-animation': 'maplair-dash-animated',
	'path-decorations': 'maplair-path-arrowheads',
	'geojson-loading': '_loadAbort',
	'zoom-styles': '_zoomStyles'
};

// code which only the respective control or layer contains
const controls = {
	'search-control': 'nominatim.openstreetmap.org',
	'time-control': 'maplair-control-time',
	'marker-cluster': 'maplair-cluster'
};
const markers = {...features, ...controls};

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
		expected: [feature]
	}])),
	'search-control': {
		code: `import {SearchControl} from 'maplair';\n${base}new SearchControl({geocoder: SearchControl.nominatim({acceptUsagePolicy: true})}).addTo(map);\n`,
		expected: ['search-control']
	},
	'time-control': {
		code: `import {TimeControl} from 'maplair';\n${base}new TimeControl({interval: '2026-10-17T00:00Z/P1D', period: 'PT1H'}).addTo(map);\n`,
		expected: ['time-control']
	},
	'marker-cluster': {
		code: `import {MarkerClusterGroup} from 'maplair';\n${base}new MarkerClusterGroup([new Marker([0, 0]), new Marker([0, 0])]).addTo(map);\n`,
		expected: ['marker-cluster']
	}
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
		const found = Object.keys(markers).filter(feature => bundle.includes(markers[feature]));
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
