// Type-checks the scripts of the debug pages (debug/**/*.html) against the type
// declarations in dist/types/ (run build/types.js first): the inline module scripts
// are extracted into tmp/debug-check/ next to copies of the other files of debug/,
// and checked as JavaScript with the declarations of `maplair` and its optional
// modules (see `exports` in package.json).
import ts from 'typescript';
import {cpSync, globSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const dir = 'tmp/debug-check',
pkg = JSON.parse(readFileSync('package.json', 'utf8'));

rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});
cpSync('debug', dir, {recursive: true, filter: src => !src.endsWith('.html')});

const files = [];
for (const page of globSync('debug/**/*.html')) {
	const html = readFileSync(page, 'utf8');
	let n = 0;
	for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
		const [, attributes, code] = match;
		if (!/type="module"/.test(attributes) || /\bsrc=/.test(attributes) || !code.trim()) { continue; }
		// keep the line numbers of the page
		const line = html.slice(0, match.index + match[0].indexOf('>') + 1).split('\n').length - 1;
		const file = `${dir}/${page.slice('debug/'.length).replace(/\.html$/, '')}.script${n++ || ''}.js`;
		mkdirSync(dirname(file), {recursive: true});
		writeFileSync(file, '\n'.repeat(line) + code);
		files.push(file);
	}
}

// globals of the pages with the script bundles
writeFileSync(`${dir}/globals.d.ts`, `import * as Maplair from 'maplair';
declare global {
	const L: typeof Maplair;
	function require(modules: string[], callback: (...modules: any[]) => void): void;
}
`);

const paths = {maplair: [resolve('dist/types/Maplair.all.d.ts')]};
for (const [entry, value] of Object.entries(pkg.exports)) {
	const target = value.default ?? value;
	if (typeof target === 'string' && target.startsWith('./dist/esm/') && entry !== '.') {
		paths[`maplair/${entry.slice(2)}`] = [resolve(target.replace('./dist/esm/', 'dist/types/').replace(/\.js$/, '.d.ts'))];
	}
}

const program = ts.createProgram([...files, ...globSync(`${dir}/**/*.js`), `${dir}/globals.d.ts`], {
	allowJs: true,
	checkJs: true,
	noEmit: true,
	strict: false,
	skipLibCheck: true,
	target: ts.ScriptTarget.ES2024,
	lib: ['lib.es2024.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	types: [],
	paths
});

const errors = ts.getPreEmitDiagnostics(program).filter(d => !d.file || d.file.fileName.includes(dir));
if (errors.length) {
	// report the errors with the page they belong to
	const host = {
		getCanonicalFileName: f => f,
		getCurrentDirectory: () => process.cwd(),
		getNewLine: () => '\n'
	};
	console.error(ts.formatDiagnostics(errors, host).replaceAll(`${dir}/`, 'debug/').replace(/\.script(\d*)\.js/g, '.html'));
	console.error(`${errors.length} type errors in the debug pages`);
	process.exitCode = 1;
} else {
	console.log(`The scripts of ${files.length} debug pages are free of type errors`);
}
