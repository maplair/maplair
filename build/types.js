// Generates the type declarations of src/ into dist/types/ (see build/JSDOC.md):
// TypeScript emits them from the JSDoc, then they are completed here:
// * typedefs of objects (options, event objects) become interfaces, with the
//   members of `@extends` and the defaults of the properties as `@default`,
// * typedefs with `@lends Target` and objects with `@lends Target.prototype`
//   (mixins passed to `include()`) are merged into their target,
// * classes get their `options` (`<Class>Options`),
// * private (`_name`) and `@internal` members are left out.
// With `--check`, the generated declarations are type-checked (strictly), optionally
// only those of the given files, e.g. `--check=layer/marker`. The environment
// variable TYPES_OUT changes the output directory (default dist/types).
import ts from 'typescript';
import {existsSync, readFileSync, writeFileSync, globSync} from 'node:fs';
import {dirname, relative} from 'node:path';

// regular expressions
const arrayTypeRe = /^(\w+)\[\]$/;
const commaRe = /\s*,\s*/;
const defaultImportRe = /\{ default as (\w+) \}/;
const dtsExtensionRe = /\.d\.ts$/;
const functionKeywordRe = /^function /;
const jsExtensionRe = /\.js$/;
const leadingDashRe = /^\s*-?\s*/;
const leadingNewlinesRe = /^\n+/;
const nameRe = /^[\w$.]+/;
const objectTypeRe = /^\{?\s*object\s*\}?$/i;
const prototypeRe = /\.prototype$/;
const spaceRe = /\s/;
const variableKeywordRe = /^(let|const|var) /;

const outDir = process.env.TYPES_OUT ?? 'dist/types',
checkArg = process.argv.find(arg => arg.startsWith('--check'));

const configFile = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, '.');
config.options.outDir = outDir;
const program = ts.createProgram(config.fileNames, config.options);
const result = program.emit(undefined, undefined, undefined, true);
const diagnostics = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics]
	.filter(d => d.category === ts.DiagnosticCategory.Error);
if (diagnostics.length) {
	console.error(ts.formatDiagnostics(diagnostics, {
		getCanonicalFileName: f => f,
		getCurrentDirectory: () => process.cwd(),
		getNewLine: () => '\n'
	}));
	process.exitCode = 1;
}

const sources = globSync('src/**/*.js').map(file => analyzeSource(file));

// where each class, interface and typedef is declared
const declaredIn = new Map();
for (const source of sources) {
	for (const name of source.declared) {
		declaredIn.set(name, source.dts);
	}
}

let count = 0;
for (const source of sources) {
	if (!existsSync(source.dts)) { continue; } // not emitted due to errors
	writeFileSync(source.dts, completeDeclarations(source));
	count++;
}
// the modules merging members into other classes (mixins, `@lends`), imported by the
// entry points so that the merged members are known wherever Maplair is imported
const pkg = JSON.parse(readFileSync('package.json', 'utf8')),
optional = new Set(Object.values(pkg.exports).map(value => value.default ?? value)
	.filter(target => typeof target === 'string' && target.startsWith('./dist/esm/'))
	.map(target => `${outDir}/${target.slice('./dist/esm/'.length).replace(jsExtensionRe, '.d.ts')}`));
const augmenting = sources.map(s => s.dts).filter(file => existsSync(file) && readFileSync(file, 'utf8').includes('declare module'));
for (const [entry, files] of [
	['Maplair.d.ts', augmenting.filter(file => !optional.has(file))],
	['Maplair.all.d.ts', augmenting]
]) {
	const path = `${outDir}/${entry}`;
	const imports = files.map(file => `import '${specifier(path, file)}';`).join('\n');
	writeFileSync(path, `${imports}\n${readFileSync(path, 'utf8')}`);
}

console.log(`Generated ${count} declaration files in ${outDir}`);

if (checkArg) {
	const filter = checkArg.split('=')[1],
	files = globSync(`${outDir}/**/*.d.ts`),
	checkProgram = ts.createProgram(files, {
		noEmit: true,
		strict: true,
		skipLibCheck: false,
		target: ts.ScriptTarget.ES2024,
		lib: ['lib.es2024.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		types: []
	}),
	errors = ts.getPreEmitDiagnostics(checkProgram)
		.filter(d => !filter || d.file?.fileName.includes(filter));
	if (errors.length) {
		console.error(ts.formatDiagnostics(errors, {
			getCanonicalFileName: f => f,
			getCurrentDirectory: () => process.cwd(),
			getNewLine: () => '\n'
		}));
		console.error(`${errors.length} errors in the declarations`);
		process.exitCode = 1;
	} else {
		console.log('The declarations are free of type errors');
	}
}

// The typedefs, mixins and imports of a source file.
function analyzeSource(file) {
	const text = readFileSync(file, 'utf8'),
	sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2024, true, ts.ScriptKind.JS),
	typedefs = [],
	mixins = [],
	imports = [],
	declared = [];

	for (const statement of sf.statements) {
		if (ts.isImportDeclaration(statement) && statement.importClause) {
			const clause = statement.importClause,
			module = statement.moduleSpecifier.text,
			names = [];
			if (clause.name) { names.push(['default', clause.name.text]); }
			if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
				for (const el of clause.namedBindings.elements) {
					names.push([(el.propertyName ?? el.name).text, el.name.text]);
				}
			}
			imports.push({module, names});
		}
		if (ts.isClassDeclaration(statement) && statement.name) {
			declared.push(statement.name.text);
		}

		for (const doc of statement.jsDoc ?? []) {
			for (const tag of doc.tags ?? []) {
				if (ts.isJSDocImportTag(tag)) {
					const clause = tag.importClause, names = [];
					for (const el of clause?.namedBindings?.elements ?? []) {
						names.push([(el.propertyName ?? el.name).text, el.name.text]);
					}
					imports.push({module: tag.moduleSpecifier.text, names});
				}
			}
			const typedef = doc.tags?.find(ts.isJSDocTypedefTag);
			if (typedef) {
				declared.push(typedef.name.text);
				const info = analyzeTypedef(doc, typedef, text);
				if (info) { typedefs.push(info); }
			}
			const lends = findTag(doc, 'lends');
			if (lends && !typedef && ts.isVariableStatement(statement)) {
				const decl = statement.declarationList.declarations[0];
				mixins.push({
					name: decl.name.text,
					target: lends.replace(prototypeRe, ''),
					object: decl.initializer,
					doc: docComment(doc, ['lends'])
				});
			}
		}
		// typedefs in comments not attached to a statement
	}
	for (const comment of detachedDocs(sf, text)) {
		const typedef = comment.tags?.find(ts.isJSDocTypedefTag);
		if (typedef && !typedefs.some(t => t.name === typedef.name.text)) {
			declared.push(typedef.name.text);
			const info = analyzeTypedef(comment, typedef, text);
			if (info) { typedefs.push(info); }
		}
	}

	// the alias naming a mixin, `@typedef {typeof mixin} Name`
	for (const mixin of mixins) {
		const alias = [...findTypedefs(sf)].find(t => t.typeExpression &&
			slice(t.typeExpression, text).replace(/[{}\s]/g, '') === `typeof${mixin.name}`);
		mixin.alias = alias?.name.text;
		if (!mixin.alias) {
			console.error(`${file}: the mixin ${mixin.name} needs a typedef "@typedef {typeof ${mixin.name}} Name"`);
			process.exitCode = 1;
		}
	}

	return {file, dts: `${outDir}/${relative('src', file).replace(jsExtensionRe, '.d.ts')}`, typedefs, mixins, imports, declared};
}

function *findTypedefs(sf) {
	const visit = function *(node) {
		for (const doc of node.jsDoc ?? []) {
			for (const tag of doc.tags ?? []) {
				if (ts.isJSDocTypedefTag(tag)) { yield tag; }
			}
		}
		for (const child of node.getChildren(sf)) {
			yield* visit(child);
		}
	};
	yield* visit(sf);
	yield* detachedDocs(sf, sf.text).flatMap(doc => (doc.tags ?? []).filter(ts.isJSDocTypedefTag));
}

// JSDoc comments which TypeScript does not attach to a node, e.g. at the end of a file
function detachedDocs(sf, text) {
	const docs = [];
	for (const match of text.matchAll(/\/\*\*[\s\S]*?\*\//g)) {
		if (!match[0].includes('@typedef')) { continue; }
		const parsed = ts.parseIsolatedJSDocComment(text, match.index, match[0].length);
		if (parsed?.jsDoc) { docs.push(parsed.jsDoc); }
	}
	return docs;
}

// A typedef of an object type: the interface to generate.
function analyzeTypedef(doc, typedef, text) {
	const literal = typedef.typeExpression,
	isObject = literal && (ts.isJSDocTypeLiteral(literal) || objectTypeRe.test(slice(literal, text))),
	extendsTag = findTag(doc, 'extends', text) ?? findTag(doc, 'augments', text);
	if (!isObject) { return undefined; }
	// the properties; TypeScript does not parse those after other tags like `@extends`
	const unparsed = (doc.tags ?? []).filter(tag => tag.tagName.text === 'property' && !ts.isJSDocPropertyTag(tag))
		.map(tag => parsePropertyTag(ts.getTextOfJSDocComment(tag.comment) ?? ''));
	const propertyTags = [...(literal.jsDocPropertyTags ?? []), ...(doc.tags ?? []).filter(ts.isJSDocPropertyTag)];
	const properties = propertyTags.map((tag) => {
		const source = text.slice(tag.pos, tag.end);
		const name = slice(tag.name, text);
		return {
			name,
			type: tag.typeExpression ? slice(tag.typeExpression.type, text) : 'any',
			optional: tag.isBracketed,
			defaultValue: tag.isBracketed ? findDefault(source, name) : undefined,
			comment: ts.getTextOfJSDocComment(tag.comment)?.trim() ?? ''
		};
	});
	properties.push(...unparsed);
	return {
		name: typedef.name.text,
		extends: extendsTag ? extendsTag.split(commaRe) : [],
		lends: findTag(doc, 'lends', text),
		properties,
		doc: docComment(doc, ['typedef', 'property', 'extends', 'augments', 'lends'])
	};
}

// `{type} [name=default] description`, with balanced braces and brackets
function parsePropertyTag(comment) {
	let i = 0;
	const balanced = (open, close) => {
		let depth = 0;
		const from = i;
		for (; i < comment.length; i++) {
			if (comment[i] === open) { depth++; }
			if (comment[i] === close && !--depth) { i++; break; }
		}
		return comment.slice(from, i);
	};
	const skipSpace = () => { while (spaceRe.test(comment[i] ?? '')) { i++; } };
	skipSpace();
	const type = comment[i] === '{' ? balanced('{', '}').slice(1, -1).trim() : 'any';
	skipSpace();
	let name, optional = false, defaultValue;
	if (comment[i] === '[') {
		const inner = balanced('[', ']').slice(1, -1);
		optional = true;
		const eq = inner.indexOf('=');
		name = (eq < 0 ? inner : inner.slice(0, eq)).trim();
		defaultValue = eq < 0 ? undefined : inner.slice(eq + 1).replace(/\s*\n\s*/g, ' ').trim();
	} else {
		name = nameRe.exec(comment.slice(i))?.[0] ?? '';
		i += name.length;
	}
	return {name, type, optional, defaultValue, comment: comment.slice(i).replace(leadingDashRe, '').trim()};
}

// the default value of a bracketed property, `[name=default]`, which may contain brackets
function findDefault(source, name) {
	const start = source.indexOf(`[${name}=`);
	if (start < 0) { return undefined; }
	let depth = 0, i = start + name.length + 2;
	const from = i;
	for (; i < source.length; i++) {
		const c = source[i];
		if (c === '[' || c === '(' || c === '{') { depth++; }
		if (c === ')' || c === '}') { depth--; }
		if (c === ']') {
			if (!depth) { break; }
			depth--;
		}
	}
	return source.slice(from, i).replace(/\s*\n\s*\*?\s*/g, ' ').trim();
}

// the source text of a node, also of nodes without parent source file
function slice(node, text) {
	return text.slice(node.pos, node.end).trim();
}

function findTag(doc, name, text) {
	const tag = doc.tags?.find(t => t.tagName.text === name);
	if (!tag) { return undefined; }
	if (ts.isJSDocAugmentsTag(tag)) {
		// `@extends A, B`: TypeScript only parses the first type
		const rest = ts.getTextOfJSDocComment(tag.comment)?.trim() ?? '';
		return `${slice(tag.class, text)}${rest}`.replace(/^,\s*|,\s*$/g, '');
	}
	return ts.getTextOfJSDocComment(tag.comment)?.trim();
}

// the text of a JSDoc comment without the given tags, as lines
function docComment(doc, skipTags) {
	const lines = [];
	const comment = ts.getTextOfJSDocComment(doc.comment)?.trim();
	if (comment) { lines.push(...comment.split('\n')); }
	for (const tag of doc.tags ?? []) {
		if (skipTags.includes(tag.tagName.text) || ts.isJSDocTypedefTag(tag) || ts.isJSDocImportTag(tag)) { continue; }
		lines.push(...`@${tag.tagName.text} ${ts.getTextOfJSDocComment(tag.comment)?.trim() ?? ''}`.trim().split('\n'));
	}
	return lines;
}

function formatDoc(lines, indent) {
	if (!lines.length) { return ''; }
	return `${indent}/**\n${lines.map(l => `${indent} * ${l}`.trimEnd()).join('\n')}\n${indent} */\n`;
}

function isPrivate(node) {
	const name = node.name?.getText();
	if (name?.startsWith('_') || name?.startsWith('#')) { return true; }
	return ts.getJSDocTags(node).some(tag => tag.tagName.text === 'internal');
}

// the module specifier of `target` declared in the file `to`, seen from the file `from`
function specifier(from, to) {
	let path = relative(dirname(from), to).replace(dtsExtensionRe, '.js');
	if (!path.startsWith('.')) { path = `./${path}`; }
	return path;
}

function completeDeclarations(source) {
	const text = readFileSync(source.dts, 'utf8'),
	sf = ts.createSourceFile(source.dts, text, ts.ScriptTarget.ES2024, true, ts.ScriptKind.TS),
	edits = [],
	appended = [],
	interfaces = new Set(),
	typedefByName = new Map(source.typedefs.map(t => [t.name, t])),
	mixinByAlias = new Map(source.mixins.filter(m => m.alias).map(m => [m.alias, m])),
	mixinByName = new Map(source.mixins.map(m => [m.name, m])),
	localNames = new Set();

	const remove = node => edits.push({start: node.getFullStart(), end: node.getEnd(), text: ''});

	for (const statement of sf.statements) {
		// typedefs of objects
		if (ts.isTypeAliasDeclaration(statement) && typedefByName.has(statement.name.text)) {
			const typedef = typedefByName.get(statement.name.text);
			edits.push({start: statement.getFullStart(), end: statement.getEnd(), text: `\n${interfaceOf(typedef)}`});
			interfaces.add(typedef.name);
			if (typedef.lends && typedef.lends !== typedef.name) {
				appended.push(augmentation(source, typedef.lends, typedef.name));
			}
		// mixins: the alias becomes an interface with the members of the object
		} else if (ts.isTypeAliasDeclaration(statement) && mixinByAlias.has(statement.name.text)) {
			const mixin = mixinByAlias.get(statement.name.text),
			members = mixinMembers(sf, mixin);
			edits.push({
				start: statement.getFullStart(),
				end: statement.getEnd(),
				text: `\n${formatDoc(mixin.doc, '')}export interface ${mixin.alias} {\n${members}}`
			});
			interfaces.add(mixin.alias);
			appended.push(augmentation(source, mixin.target, mixin.alias));
		} else if ((ts.isModuleDeclaration(statement) || ts.isVariableStatement(statement)) && mixinByName.has(declarationName(statement))) {
			remove(statement);
		} else if (ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
			for (const member of statement.members) {
				if (isPrivate(member)) {
					remove(member);
				} else if (ts.isConstructorDeclaration(member) && member.parameters.length === 1) {
					// `constructor(...args)` documented with `@param {...XOptions} args` (or `MaplairMap`)
					const param = member.parameters[0], match = param.dotDotDotToken && arrayTypeRe.exec(param.type?.getText() ?? '');
					if (match?.[1].endsWith('Options')) {
						edits.push({start: param.getStart(), end: param.getEnd(), text: `options?: ${match[1]}`});
					} else if (match?.[1] === 'MaplairMap') {
						edits.push({start: param.getStart(), end: param.getEnd(), text: 'map: MaplairMap'});
					}
				}
			}
		} else if (isPrivate(statement) && !ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) {
			remove(statement);
		}
		for (const name of declaredNames(statement)) {
			localNames.add(name);
		}
	}

	// the options of classes
	for (const statement of sf.statements) {
		if (ts.isClassDeclaration(statement) && statement.name) {
			const optionsName = `${statement.name.text}Options`;
			if ((interfaces.has(optionsName) || localNames.has(optionsName)) && !statement.members.some(m => m.name?.getText() === 'options')) {
				edits.push({
					start: statement.getEnd() - 1,
					end: statement.getEnd() - 1,
					text: `    /** The options of the ${statement.name.text}, see [the options](#${optionsName.toLowerCase()}). */\n    options: ${optionsName};\n`
				});
			}
		}
	}

	// the types used by the generated interfaces, imported like in the source
	const imported = new Set();
	for (const statement of sf.statements) {
		if (ts.isImportDeclaration(statement)) {
			for (const name of declaredNames(statement)) { imported.add(name); }
		}
	}
	const importLines = [];
	for (const {module, names} of source.imports) {
		if (module.endsWith('.json')) { continue; }
		const missing = names.filter(([, local]) => !imported.has(local) && !localNames.has(local));
		if (!missing.length) { continue; }
		const target = module.startsWith('.') ? module : module;
		importLines.push(`import type { ${missing.map(([name, local]) => (name === local ? name : `${name} as ${local}`)).join(', ')} } from '${target}';`);
		for (const [, local] of missing) { imported.add(local); }
	}
	// default imports as named
	for (let i = 0; i < importLines.length; i++) {
		importLines[i] = importLines[i].replace(defaultImportRe, '$1');
	}

	edits.sort((a, b) => b.start - a.start);
	let out = text;
	for (const edit of edits) {
		out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
	}
	out = importLines.join('\n') + (importLines.length ? '\n' : '') + out;
	if (appended.length) {
		out = `${out.trimEnd()}\n${appended.join('\n')}\n`;
	}
	return out;
}

function declarationName(statement) {
	if (ts.isModuleDeclaration(statement)) { return statement.name.text; }
	if (ts.isVariableStatement(statement)) { return statement.declarationList.declarations[0]?.name.getText(); }
	return undefined;
}

function declaredNames(statement) {
	if (ts.isImportDeclaration(statement)) {
		const clause = statement.importClause, names = [];
		if (clause?.name) { names.push(clause.name.text); }
		if (clause?.namedBindings) {
			if (ts.isNamedImports(clause.namedBindings)) {
				names.push(...clause.namedBindings.elements.map(el => el.name.text));
			} else {
				names.push(clause.namedBindings.name.text);
			}
		}
		return names;
	}
	if (statement.name && ts.isIdentifier(statement.name)) { return [statement.name.text]; }
	if (ts.isVariableStatement(statement)) { return statement.declarationList.declarations.map(d => d.name.getText()); }
	return [];
}

function interfaceOf(typedef) {
	// properties lent to a class with a function type are methods, which subclasses may implement
	const lentToClass = typedef.lends && !typedef.lends.endsWith('Options'),
	ext = typedef.extends.length ? ` extends ${typedef.extends.join(', ')}` : '',
	members = typedef.properties.map((p) => {
		const lines = p.comment ? p.comment.split('\n') : [];
		if (p.defaultValue !== undefined) { lines.push(`@default ${p.defaultValue}`); }
		const method = lentToClass ? asMethod(p.type) : undefined;
		return `${formatDoc(lines, '    ')}    ${p.name}${p.optional ? '?' : ''}${method ?? `: ${p.type}`};\n`;
	}).join('');
	return `${formatDoc(typedef.doc, '')}export interface ${typedef.name}${ext} {\n${members}}`;
}

// `(params) => result` as the parameters and result of a method, `(params): result`
function asMethod(type) {
	if (!type.startsWith('(')) { return undefined; }
	let depth = 0, i = 0;
	for (; i < type.length; i++) {
		if (type[i] === '(') { depth++; }
		if (type[i] === ')' && !--depth) { break; }
	}
	const rest = type.slice(i + 1).trim();
	return rest.startsWith('=>') ? `${type.slice(0, i + 1)}: ${rest.slice(2).trim()}` : undefined;
}

// the members of a mixin, from the namespace or the constant TypeScript emitted for it
function mixinMembers(sf, mixin) {
	for (const statement of sf.statements) {
		if (declarationName(statement) !== mixin.name) { continue; }
		const out = [];
		if (ts.isModuleDeclaration(statement)) {
			for (const member of statement.body.statements) {
				if (isPrivate(member) || (member.name && member.name.getText().startsWith('_'))) { continue; }
				// the comment and the declaration, without the keyword
				const comment = sf.text.slice(member.getFullStart(), member.getStart());
				let declaration = sf.text.slice(member.getStart(), member.getEnd());
				if (ts.isVariableStatement(member)) {
					if (member.declarationList.declarations[0].name.getText().startsWith('_')) { continue; }
					declaration = declaration.replace(variableKeywordRe, '');
				} else {
					declaration = declaration.replace(functionKeywordRe, '');
				}
				out.push(`${`${comment}${declaration}`.replace(leadingNewlinesRe, '')}\n`);
			}
		} else {
			const type = statement.declarationList.declarations[0].type;
			for (const member of type.members ?? []) {
				if (isPrivate(member)) { continue; }
				out.push(`${sf.text.slice(member.getFullStart(), member.getEnd()).replace(leadingNewlinesRe, '')}\n`);
			}
		}
		return out.join('');
	}
	return '';
}

// merges the interface `name` into the class or interface `target`
function augmentation(source, target, name) {
	const file = declaredIn.get(target);
	if (!file) {
		console.error(`${source.file}: unknown @lends target ${target}`);
		process.exitCode = 1;
		return '';
	}
	if (file === source.dts) {
		return `export interface ${target} extends ${name} {\n}`;
	}
	return `declare module '${specifier(source.dts, file)}' {\n    interface ${target} extends ${name} {\n    }\n}`;
}
