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

// Maplair was forked from Leaflet in 2026
const year = new Date().getFullYear();
const maplairYears = year > 2026 ? `2026-${year}` : '2026';

const banner = `/* @preserve
 * Maplair ${pkg.version}, a JS library for interactive maps. https://maplair.org
 * (c) ${maplairYears} Maplair contributors, (c) 2010-2026 Volodymyr Agafonkin, (c) 2010-2011 CloudMade
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
	lint: {
		plugins: ['eslint', 'import', 'oxc', 'unicorn'],
		jsPlugins: ['@e18e/eslint-plugin', 'eslint-plugin-baseline-js', '@stylistic/eslint-plugin'],
		env: {browser: true, node: true, es2024: true},
		ignorePatterns: [
			'dist/**',
			'coverage/**',
			'docs/_site/**',
			'debug/local/**',
			'docs/docs/highlight/**',
			'docs/examples/choropleth/us-states.js',
			'docs/examples/geojson/sample-geojson.js',
			'docs/examples/map-panes/eu-countries.js',
		],
		rules: {
			// eslint-config-mourner: possible problems
			'array-callback-return': 'error',
			'no-await-in-loop': 'error',
			'no-constructor-return': 'error',
			'no-duplicate-imports': 'error',
			'no-promise-executor-return': 'error',
			'no-self-compare': 'error',
			'no-template-curly-in-string': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-unreachable-loop': 'error',
			'no-use-before-define': ['error', 'nofunc'],

			// eslint-config-mourner: suggestions
			'accessor-pairs': 'error',
			'arrow-body-style': 'error',
			'eqeqeq': ['error', 'smart'],
			'func-name-matching': 'error',
			'grouped-accessor-pairs': 'error',
			'new-cap': 'error',
			'no-caller': 'error',
			'no-else-return': 'error',
			'no-extend-native': 'error',
			'no-extra-bind': 'error',
			'no-extra-label': 'error',
			'no-iterator': 'error',
			'no-labels': 'error',
			'no-lone-blocks': 'error',
			'no-lonely-if': 'error',
			'no-loop-func': 'error',
			'no-new': 'error',
			'no-object-constructor': 'error',
			'no-proto': 'error',
			'no-return-assign': 'error',
			'no-sequences': 'error',
			'no-throw-literal': 'error',
			'no-unneeded-ternary': 'error',
			'no-useless-call': 'error',
			'no-useless-computed-key': 'error',
			'no-useless-concat': 'error',
			'no-useless-constructor': 'error',
			'no-useless-rename': 'error',
			'no-useless-return': 'error',
			'no-var': 'error',
			'no-void': 'error',
			'object-shorthand': 'error',
			'prefer-arrow-callback': 'error',
			'prefer-const': 'error',
			'prefer-promise-reject-errors': 'error',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'prefer-template': 'error',
			'prefer-regex-literals': 'error',
			'require-await': 'error',
			'yoda': 'error',

			// project rules
			'curly': 'error',
			'no-undef': 'error',
			'no-unused-expressions': ['error', {allowShortCircuit: true}],
			'no-unused-vars': ['error', {caughtErrors: 'none'}],
			'prefer-exponentiation-operator': 'error',
			'prefer-object-has-own': 'error',

			// eslint-plugin-import-x
			'import/extensions': ['error', 'ignorePackages'],
			'import/named': 'error',
			'import/namespace': 'error',
			'import/default': 'error',
			'import/export': 'error',
			'import/no-named-as-default': 'warn',
			'import/no-named-as-default-member': 'warn',
			'import/no-duplicates': 'warn',

			// @e18e/eslint-plugin (recommended, minus prefer-array-at: Safari 15.4+)
			'e18e/prefer-array-fill': 'error',
			'e18e/prefer-includes': 'error',
			'e18e/prefer-array-to-reversed': 'error',
			'e18e/prefer-array-to-sorted': 'error',
			'e18e/prefer-array-to-spliced': 'error',
			'e18e/prefer-nullish-coalescing': 'error',
			'e18e/prefer-object-has-own': 'error',
			'e18e/prefer-spread-syntax': 'error',
			'e18e/prefer-url-canparse': 'error',
			'e18e/ban-dependencies': 'error',
			'e18e/prefer-array-from-map': 'error',
			'e18e/prefer-timer-args': 'error',
			'e18e/prefer-date-now': 'error',
			'e18e/prefer-regex-test': 'error',
			'e18e/prefer-array-some': 'error',
			'e18e/prefer-static-regex': 'error',
			'e18e/prefer-string-fromcharcode': 'error',

			// @stylistic/eslint-plugin
			'@stylistic/indent': ['error', 'tab', {VariableDeclarator: 0, flatTernaryExpressions: true, SwitchCase: 0}],
			'@stylistic/array-bracket-spacing': 'error',
			'@stylistic/arrow-parens': ['error', 'as-needed', {requireForBlockBody: true}],
			'@stylistic/arrow-spacing': 'error',
			'@stylistic/block-spacing': 'error',
			'@stylistic/brace-style': ['error', '1tbs', {allowSingleLine: true}],
			'@stylistic/comma-spacing': 'error',
			'@stylistic/comma-style': 'error',
			'@stylistic/computed-property-spacing': 'error',
			'@stylistic/dot-location': ['error', 'property'],
			'@stylistic/eol-last': 'error',
			'@stylistic/function-call-spacing': 'error',
			'@stylistic/key-spacing': 'error',
			'@stylistic/keyword-spacing': 'error',
			'@stylistic/new-parens': 'error',
			'@stylistic/no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
			'@stylistic/no-trailing-spaces': 'error',
			'@stylistic/no-whitespace-before-property': 'error',
			'@stylistic/object-curly-spacing': 'error',
			'@stylistic/operator-linebreak': ['error', 'after'],
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/linebreak-style': ['error', 'unix'],
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/semi-spacing': 'error',
			'@stylistic/generator-star-spacing': 'error',
			'@stylistic/rest-spread-spacing': 'error',
			'@stylistic/yield-star-spacing': 'error',
			'@stylistic/template-tag-spacing': 'error',
			'@stylistic/implicit-arrow-linebreak': 'error',
			'@stylistic/space-before-blocks': 'error',
			'@stylistic/space-before-function-paren': ['error', {anonymous: 'always', named: 'never'}],
			'@stylistic/space-in-parens': 'error',
			'@stylistic/space-infix-ops': 'error',
			'@stylistic/space-unary-ops': 'error',
			'@stylistic/switch-colon-spacing': 'error',
			'@stylistic/spaced-comment': 'error',
		},
		overrides: [
			{
				files: ['src/**/*.js'],
				rules: {
					'baseline-js/use-baseline': ['error', {
						available: 'widely',
						// According to https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio, the feature is only partially supported in Safari:
						// In Safari on iOS, the devicePixelRatio does not change when the page is zoomed. See bug https://webkit.org/b/124862.
						includeWebApis: {preset: 'auto', ignore: ['devicepixelratio']},
						includeJsBuiltins: {preset: 'auto'},
					}],
				},
			},
			{
				files: ['spec/**'],
				globals: {
					describe: 'readonly',
					it: 'readonly',
					beforeEach: 'readonly',
					afterEach: 'readonly',
					expect: 'readonly',
				},
				rules: {
					'no-unused-expressions': 'off',
					'no-new': 'off',
				},
			},
			{
				files: ['docs/docs/js/docs.js'],
				globals: {hljs: 'readonly'},
			},
		],
	},
	pack: [
		// the bundles contain all optional features
		{
			...packOptions,
			entry: {'maplair-src': 'src/Maplair.all.js'},
			copy: [
				'src/maplair.css',
				{from: 'src/images/{logo,layers,marker-icon,marker-shadow}.svg', to: 'dist/images'},
			],
		},
		{...packOptions, entry: {maplair: 'src/Maplair.all.js'}, minify: true},
		// one module per source file, so that bundlers can drop unused modules (see `sideEffects` in package.json)
		{...packOptions, entry: ['src/Maplair.js', 'src/map/Map.Rotation.js', 'src/layer/marker/Marker.Rotation.js', 'src/layer/marker/Marker.Move.js', 'src/layer/vector/Path.DashAnimation.js'], unbundle: true, outDir: 'dist/esm', banner: undefined},
		{...globalPackOptions, entry: {'maplair-global-src': 'src/Maplair.all.js'}},
		{...globalPackOptions, entry: {'maplair-global': 'src/Maplair.all.js'}, minify: true},
	],
	build: {
		assetsInlineLimit: 0,
	},
	resolve: {
		alias: [
			// the optional features, see `exports` in package.json
			{find: 'maplair/map-rotation', replacement: fileURLToPath(new URL('./src/map/Map.Rotation.js', import.meta.url))},
			{find: 'maplair/marker-rotation', replacement: fileURLToPath(new URL('./src/layer/marker/Marker.Rotation.js', import.meta.url))},
			{find: 'maplair/marker-movement', replacement: fileURLToPath(new URL('./src/layer/marker/Marker.Move.js', import.meta.url))},
			{find: 'maplair/dash-animation', replacement: fileURLToPath(new URL('./src/layer/vector/Path.DashAnimation.js', import.meta.url))},
			{find: /^maplair$/, replacement: fileURLToPath(new URL('./src/Maplair.js', import.meta.url))},
		],
	},
	staged: {
		'*.{js,mjs}': 'vp lint --fix',
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
