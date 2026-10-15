import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite-plus';
import {playwright} from 'vite-plus/test/browser-playwright';
import pkg from './package.json' with {type: 'json'};

const touch = process.env.VITE_TOUCH === '1';

// Vitest's tester iframe defaults to a small viewport (414x896) under Playwright's
// touch context, which truncates `document.elementFromPoint` beyond that range and
// breaks specs simulating pointer events at desktop coordinates. Pin a desktop
// viewport so behavior is identical between touch and non-touch runs.
const viewport = {width: 1280, height: 720};

const banner = `/* @preserve
 * Maplair ${pkg.version}, a JS library for interactive maps. https://leafletjs.com
 * (c) 2010-${new Date().getFullYear()} Volodymyr Agafonkin, (c) 2010-2011 CloudMade
 */
`;

/** Options shared by all library bundles built with `vp pack`. */
const packOptions = {
	platform: 'browser',
	target: false,
	sourcemap: true,
	banner,
	clean: false,
	dts: false,
	exports: false,
	publint: false,
	attw: false,
	outExtensions: () => ({js: '.js'}),
};

/**
 * Builds the UMD bundle exposing `L` as a global. Rolldown has no `noConflict`
 * option (unlike Rollup), so wrap the bundle to remember the previous global `L`
 * and add `L.noConflict()` to restore it when loaded via a plain script tag.
 */
const globalPackOptions = {
	...packOptions,
	format: 'umd',
	globalName: 'L',
	outputOptions: {
		entryFileNames: '[name].js',
		postBanner: `${banner}(function (previousL) {`,
		postFooter: `if (!(typeof exports === 'object' && typeof module !== 'undefined') && !(typeof define === 'function' && define.amd)) {
	var L = globalThis.L;
	L.noConflict = function () { globalThis.L = previousL; return L; };
}
})(globalThis.L);`,
	},
};

export default defineConfig({
	pack: [
		{
			...packOptions,
			entry: {'maplair-src': 'src/Maplair.js'},
			copy: [
				'src/maplair.css',
				{from: 'src/images/{logo,layers,marker-icon,marker-shadow}.svg', to: 'dist/images'},
			],
		},
		{...packOptions, entry: {maplair: 'src/Maplair.js'}, minify: true},
		{...globalPackOptions, entry: {'maplair-global-src': 'src/Maplair.js'}},
		{...globalPackOptions, entry: {'maplair-global': 'src/Maplair.js'}, minify: true},
	],
	build: {
		assetsInlineLimit: 0,
	},
	resolve: {
		alias: {
			maplair: fileURLToPath(new URL('./src/Maplair.js', import.meta.url)),
		},
	},
	staged: {
		'*.{js,mjs,md}': 'eslint --cache --fix',
	},
	test: {
		globals: true,
		include: ['spec/suites/**/*Spec.js'],
		setupFiles: ['spec/setup.js'],
		// Bound individual test/hook/teardown durations so a stuck spec fails
		// fast with a useful stack instead of hanging the whole worker. Long
		// flyTo specs (~2-3s normally) set their own higher timeout per-test.
		testTimeout: 8000,
		hookTimeout: 8000,
		teardownTimeout: 5000,
		browser: {
			enabled: true,
			provider: playwright({contextOptions: {hasTouch: touch}}),
			headless: true,
			screenshotFailures: false,
			viewport,
			instances: [
				{browser: 'chromium'},
				{browser: 'firefox'},
				{browser: 'webkit'},
				{
					browser: 'chromium',
					name: 'chromium-retina',
					provider: playwright({contextOptions: {hasTouch: touch, deviceScaleFactor: 2}}),
				},
			],
		},
		coverage: {
			provider: 'v8',
			include: ['src/**/*.js'],
			reporter: ['text-summary', 'html'],
			reportsDirectory: 'coverage',
		},
	},
});
