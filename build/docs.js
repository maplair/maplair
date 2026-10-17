// Generates the API reference docs/reference.html from the type declarations in
// dist/types/ (run build/types.js first), i.e. from the JSDoc of src/, see
// build/JSDOC.md. The order of the reference is defined in build/docs-index.json.
import ts from 'typescript';
import MarkdownIt from 'markdown-it';
import {globSync, readFileSync, writeFileSync} from 'node:fs';
import {relative} from 'node:path';

// regular expressions
const firesRe = /^(?:([\w$]+)#)?([\w:.-]+)\s*(?:\{([^}]*)\})?\s*([\s\S]*)$/;
const leadingDashRe = /^-\s*/;
const typeArgumentsRe = /<.*$/;

const typesDir = 'dist/types',
outFile = 'docs/reference.html',
pkg = JSON.parse(readFileSync('package.json', 'utf8')),
index = JSON.parse(readFileSync('build/docs-index.json', 'utf8'));

// anchors of earlier versions of the reference, kept as aliases
const idAliases = {
	MaplairMap: ['map'],
	ZoomControl: ['control-zoom'],
	AttributionControl: ['control-attribution'],
	LayersControl: ['control-layers'],
	ScaleControl: ['control-scale']
};

// the optional modules (package exports), by declaration file
const optionalModules = new Map();
for (const [entry, value] of Object.entries(pkg.exports)) {
	const target = value.default ?? value;
	if (typeof target === 'string' && target.startsWith('./dist/esm/') && entry !== '.') {
		optionalModules.set(target.replace('./dist/esm/', '').replace(/\.js$/, ''), `maplair/${entry.slice(2)}`);
	}
}

// ---------------------------------------------------------------- declarations

const classes = new Map(), // name → class
interfaces = new Map(), // name → {name, file, decls: [...]}
aliases = new Map(), // name → type alias
modules = new Map(), // module path → {functions, consts, defaultMembers}
mixinsOf = new Map(), // class or interface name → [{name, file}] of interfaces merged into it
fires = []; // {target, name, type, text, file}

for (const file of globSync(`${typesDir}/**/*.d.ts`).sort()) {
	const modulePath = relative(typesDir, file).replace(/\.d\.ts$/, ''),
	text = readFileSync(file, 'utf8'),
	sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2024, true, ts.ScriptKind.TS),
	mod = {functions: [], consts: [], defaultMembers: [], path: modulePath};
	modules.set(modulePath, mod);

	const visitStatements = (statements, inAugmentation) => {
		for (const node of statements) {
			if (ts.isModuleDeclaration(node) && node.body && ts.isModuleBlock(node.body)) {
				visitStatements(node.body.statements, ts.isStringLiteral(node.name));
			} else if (ts.isClassDeclaration(node) && node.name) {
				const cls = readClass(node, modulePath);
				classes.set(cls.name, cls);
				collectFires(cls.doc, cls.name, modulePath);
			} else if (ts.isInterfaceDeclaration(node)) {
				const decl = readInterface(node, modulePath),
				isAugmentation = inAugmentation || (!node.members.length && node.heritageClauses &&
					(classes.has(decl.name) || hasDeclaration(sf, decl.name, node)));
				if (isAugmentation) {
					for (const ext of decl.extends) {
						addMixin(decl.name, ext, modulePath);
					}
				} else {
					const entry = interfaces.get(decl.name) ?? {name: decl.name, file: modulePath, decls: []};
					entry.decls.push(decl);
					interfaces.set(decl.name, entry);
				}
			} else if (ts.isTypeAliasDeclaration(node)) {
				aliases.set(node.name.text, {
					name: node.name.text,
					file: modulePath,
					type: node.type.getText(sf),
					doc: readDoc(node)
				});
			} else if (ts.isFunctionDeclaration(node) && node.name && isExported(node)) {
				mod.functions.push(readSignature(node, node.name.text));
			} else if (ts.isVariableStatement(node) && isExported(node)) {
				for (const decl of node.declarationList.declarations) {
					mod.consts.push({name: decl.name.getText(), type: decl.type?.getText() ?? '', doc: readDoc(node)});
				}
			} else if (ts.isVariableStatement(node)) {
				// `declare const _default: {…}; export default _default;`
				const decl = node.declarationList.declarations[0];
				if (decl.name.getText() === '_default' && decl.type && ts.isTypeLiteralNode(decl.type)) {
					mod.defaultDoc = readDoc(node);
					mod.defaultMembers = decl.type.members.map(m => readMember(m));
				}
			}
		}
	};
	visitStatements(sf.statements, false);
}

// the interfaces merged into a class or interface (mixins, `@lends`)
function addMixin(target, name, file) {
	const list = mixinsOf.get(target) ?? [];
	if (!list.some(m => m.name === name)) { list.push({name, file}); }
	mixinsOf.set(target, list);
}

function hasDeclaration(sf, name, except) {
	return sf.statements.some(s => s !== except && (ts.isClassDeclaration(s) || ts.isInterfaceDeclaration(s)) &&
		s.name?.text === name && (ts.isClassDeclaration(s) || s.members.length));
}

function isExported(node) {
	return node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
}

function readDoc(node) {
	const docs = node.jsDoc ?? [];
	const doc = docs.at(-1);
	const result = {text: '', params: new Map(), returns: '', group: '', examples: [], fires: [], defaultValue: undefined, deprecated: undefined, tags: []};
	if (!doc) { return result; }
	result.text = ts.getTextOfJSDocComment(doc.comment) ?? '';
	for (const tag of doc.tags ?? []) {
		const name = tag.tagName.text,
		comment = (ts.getTextOfJSDocComment(tag.comment) ?? '').trim();
		if (ts.isJSDocParameterTag(tag)) {
			result.params.set(tag.name.getText(), comment.replace(leadingDashRe, ''));
		} else if (name === 'returns' || name === 'return') {
			result.returns = comment;
		} else if (name === 'group') {
			result.group = comment;
		} else if (name === 'example') {
			result.examples.push(comment);
		} else if (name === 'fires') {
			result.fires.push(comment);
		} else if (name === 'default') {
			result.defaultValue = comment;
		} else if (name === 'deprecated') {
			result.deprecated = comment || 'Deprecated.';
		} else {
			result.tags.push({name, comment});
		}
	}
	return result;
}

function readSignature(node, name) {
	const sf = node.getSourceFile();
	return {
		name,
		kind: 'method',
		params: node.parameters.filter(p => p.name.getText() !== 'this').map(p => ({
			name: p.name.getText(sf),
			rest: !!p.dotDotDotToken,
			optional: !!p.questionToken || !!p.initializer,
			type: p.type?.getText(sf) ?? 'any'
		})),
		returns: node.type?.getText(sf) ?? (ts.isConstructorDeclaration(node) ? '' : 'void'),
		isStatic: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
		doc: readDoc(node)
	};
}

function readMember(node) {
	const sf = node.getSourceFile(),
	name = node.name?.getText(sf) ?? '';
	if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
		return readSignature(node, name);
	}
	if (ts.isConstructorDeclaration(node)) {
		return {...readSignature(node, 'constructor'), kind: 'constructor'};
	}
	if (ts.isGetAccessorDeclaration(node)) {
		return {name, kind: 'property', type: node.type?.getText(sf) ?? 'any', optional: false, doc: readDoc(node),
			isStatic: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)};
	}
	if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
		const type = node.type?.getText(sf) ?? 'any';
		// properties holding functions are documented like methods
		return {name, kind: 'property', type, optional: !!node.questionToken, doc: readDoc(node),
			isStatic: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)};
	}
	return {name, kind: 'other', doc: readDoc(node)};
}

function readClass(node, file) {
	const ext = node.heritageClauses?.find(h => h.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
	return {
		name: node.name.text,
		file,
		doc: readDoc(node),
		extends: ext ? ext.expression.getText() : undefined,
		members: node.members.filter(m => !ts.isSetAccessorDeclaration(m) && !ts.isIndexSignatureDeclaration(m) &&
			!ts.isClassStaticBlockDeclaration(m)).map(m => readMember(m))
	};
}

function readInterface(node, file) {
	const ext = node.heritageClauses?.find(h => h.token === ts.SyntaxKind.ExtendsKeyword);
	return {
		name: node.name.text,
		file,
		doc: readDoc(node),
		extends: ext ? ext.types.map(t => t.getText()) : [],
		members: node.members.map(m => readMember(m))
	};
}

// `@fires [Target#]name {Type} description`
function collectFires(doc, defaultTarget, file) {
	for (const text of doc.fires) {
		const match = firesRe.exec(text);
		if (!match) { continue; }
		fires.push({target: match[1] ?? defaultTarget, name: match[2], type: match[3] ?? 'MaplairEvent', text: match[4], file});
	}
}

// events documented on interfaces: of the class whose options or mixin they are
for (const [name, entry] of interfaces) {
	for (const decl of entry.decls) {
		const optionsOf = name.endsWith('Options') && classes.has(name.slice(0, -7)) ? name.slice(0, -7) : undefined,
		mixinOf = [...mixinsOf].find(([, list]) => list.some(m => m.name === name))?.[0];
		collectFires(decl.doc, optionsOf ?? mixinOf ?? name, decl.file);
	}
}

// ---------------------------------------------------------------- items and anchors

const items = [], // {name, kind, id, section}
itemByName = new Map(),
listed = new Set();

for (const section of index.sections) {
	section.entries = [];
	for (const item of section.items) {
		const name = typeof item === 'string' ? item : item.name,
		entry = resolveItem(name, typeof item === 'string' ? undefined : item.module);
		if (!entry) {
			console.warn(`docs-index.json: ${name} is not declared`);
			continue;
		}
		section.entries.push(entry);
		items.push(entry);
		itemByName.set(name, entry);
		listed.add(name);
	}
}

for (const name of classes.keys()) {
	if (!listed.has(name) && !name.startsWith('_')) {
		console.warn(`docs-index.json: class ${name} is not listed`);
	}
}

function resolveItem(name, module) {
	const id = name.toLowerCase();
	if (module) {
		return modules.has(module) ? {name, kind: 'module', id, module: modules.get(module)} : undefined;
	}
	if (classes.has(name)) { return {name, kind: 'class', id, cls: classes.get(name)}; }
	if (interfaces.has(name)) { return {name, kind: 'interface', id, iface: interfaces.get(name)}; }
	if (aliases.has(name)) { return {name, kind: 'alias', id, alias: aliases.get(name)}; }
	return undefined;
}

// documented types which are not items of their own link to the item documenting them
const typeLinks = new Map();
for (const item of items) { typeLinks.set(item.name, `#${item.id}`); }
for (const name of interfaces.keys()) {
	const cls = name.endsWith('Options') ? name.slice(0, -7) : undefined;
	if (!typeLinks.has(name) && cls && itemByName.has(cls)) {
		typeLinks.set(name, `#${itemByName.get(cls).id}-option`);
	}
}

// ---------------------------------------------------------------- rendering

const md = new MarkdownIt({html: true});
const defaultCodeInline = md.renderer.rules.code_inline;
md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
	const html = defaultCodeInline(tokens, idx, options, env, self),
	link = typeLinks.get(tokens[idx].content);
	return link && !env.inLink ? `<a href="${link}">${html}</a>` : html;
};
md.core.ruler.push('track_links', (state) => {
	for (const token of state.tokens) {
		if (token.type !== 'inline') { continue; }
		let depth = 0;
		for (const child of token.children) {
			if (child.type === 'link_open') { depth++; }
			if (child.type === 'link_close') { depth--; }
			if (child.type === 'code_inline') { child.meta = {inLink: depth > 0}; }
		}
	}
});
md.renderer.rules.code_inline = (render => (tokens, idx, options, env, self) => render(tokens, idx, options, {...env, inLink: tokens[idx].meta?.inLink}, self))(md.renderer.rules.code_inline);

const usedIds = new Set();

function uniqueId(id) {
	let result = id, i = 2;
	while (usedIds.has(result)) { result = `${id}-${i++}`; }
	usedIds.add(result);
	return result;
}

function escape(text) {
	return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function markdown(text) {
	return text ? md.render(text) : '';
}

function markdownInline(text) {
	return text ? md.renderInline(text.replace(/\s*\n\s*/g, ' ')) : '';
}

// a type with links to the documented types
function type(text) {
	return escape(text.replace(/\s+/g, ' ')).replace(/\b[A-Z][\w$]*\b/g, name => (typeLinks.has(name) ? `<a href="${typeLinks.get(name)}">${name}</a>` : name));
}

function signature(member, ownerName) {
	const params = member.params.map(p => `${p.rest ? '…' : ''}${escape(p.name)}${p.optional ? '?' : ''}: ${type(p.type)}`).join(', ');
	return member.kind === 'constructor' ?
		`<code>new ${escape(ownerName)}(${params})</code>` :
		`<code>${escape(member.name)}(${params})</code>`;
}

function paramList(member) {
	const documented = (member.params ?? []).filter(p => member.doc.params.get(p.name));
	if (!documented.length) { return ''; }
	return `<dl class="params">${documented.map(p => `<dt><code>${escape(p.name)}</code></dt><dd>${markdownInline(member.doc.params.get(p.name))}</dd>`).join('')}</dl>`;
}

function description(member) {
	let html = markdown(member.doc.text);
	if (member.doc.deprecated) {
		html = `<p class="deprecated">${markdownInline(member.doc.deprecated)}</p>${html}`;
	}
	html += paramList(member);
	if (member.doc.returns) {
		html += `<p class="returns">Returns ${markdownInline(member.doc.returns)}</p>`;
	}
	for (const example of member.doc.examples) {
		html += markdown(example);
	}
	if (member.module) {
		html += `<p class="module">Added by the optional module <code>${escape(member.module)}</code>.</p>`;
	}
	return html;
}

function memberId(prefix, name, aliasPrefixes) {
	const id = uniqueId(`${prefix}-${name.toLowerCase()}`);
	const extra = aliasPrefixes.map(a => `${a}-${name.toLowerCase()}`).filter(a => !usedIds.has(a));
	for (const a of extra) { usedIds.add(a); }
	return {id, aliases: extra};
}

function anchorAliases(list) {
	return list.map(a => `<span id="${a}"></span>`).join('');
}

function methodTable(members, prefix, aliasPrefixes, ownerName) {
	const rows = members.map((m) => {
		const {id, aliases: extra} = memberId(prefix, m.name, aliasPrefixes);
		return `<tr id="${id}">${anchorAliases(extra)}<td>${signature(m, ownerName)}</td><td><code>${type(m.returns || '')}</code></td><td>${description(m)}</td></tr>`;
	});
	return table(['Method', 'Returns', 'Description'], rows);
}

function propertyTable(members, prefix, aliasPrefixes, withDefault) {
	const rows = members.map((m) => {
		const {id, aliases: extra} = memberId(prefix, m.name, aliasPrefixes);
		const cells = [`<td><code>${escape(m.name)}</code></td>`, `<td><code>${type(m.type)}</code></td>`];
		if (withDefault) { cells.push(`<td>${m.doc.defaultValue !== undefined ? `<code>${escape(m.doc.defaultValue)}</code>` : ''}</td>`); }
		cells.push(`<td>${description(m)}</td>`);
		return `<tr id="${id}">${anchorAliases(extra)}${cells.join('')}</tr>`;
	});
	return table(withDefault ? ['Option', 'Type', 'Default', 'Description'] : ['Property', 'Type', 'Description'], rows);
}

function eventTable(events, prefix, aliasPrefixes) {
	const rows = events.map((e) => {
		const {id, aliases: extra} = memberId(prefix, e.name, aliasPrefixes);
		const module = optionalModules.get(e.file);
		return `<tr id="${id}">${anchorAliases(extra)}<td><code>${escape(e.name)}</code></td><td><code>${type(e.type)}</code></td><td>${markdownInline(e.text)}${module ? ` <span class="module">(<code>${escape(module)}</code>)</span>` : ''}</td></tr>`;
	});
	return table(['Event', 'Data', 'Description'], rows);
}

function table(headers, rows) {
	return `<div class="table"><table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('\n')}</tbody></table></div>`;
}

// the members of a class or interface including its mixins, without inherited ones
function ownMembers(name) {
	const members = [];
	const cls = classes.get(name);
	if (cls) { members.push(...cls.members); }
	for (const decl of interfaces.get(name)?.decls ?? []) {
		members.push(...decl.members);
	}
	for (const mixin of mixinsOf.get(name) ?? []) {
		const module = optionalModules.get(mixin.file);
		for (const decl of interfaces.get(mixin.name)?.decls ?? []) {
			members.push(...decl.members.map(m => ({...m, module})));
		}
	}
	return members;
}

// the ancestors of a class or interface, nearest first
function ancestors(name) {
	const result = [];
	const queue = [name];
	while (queue.length) {
		const current = queue.shift();
		const parents = classes.has(current) ?
			[classes.get(current).extends].filter(Boolean) :
			(interfaces.get(current)?.decls ?? []).flatMap(d => d.extends);
		for (const parent of parents) {
			const parentName = parent.replace(typeArgumentsRe, '');
			if (!result.includes(parentName) && (classes.has(parentName) || interfaces.has(parentName))) {
				result.push(parentName);
				queue.push(parentName);
			}
		}
	}
	return result;
}

function eventsOf(name) {
	return fires.filter(e => e.target === name);
}

function inheritedDetails(label, ancestorName, html) {
	const link = typeLinks.get(ancestorName);
	return `<details class="inherited"><summary>${label} inherited from ${link ? `<a href="${link}">${ancestorName}</a>` : ancestorName}</summary>${html}</details>`;
}

function renderClass(item) {
	const {cls} = item,
	id = item.id,
	aliasPrefixes = idAliases[item.name] ?? [],
	parts = [];
	const members = ownMembers(cls.name).filter(m => !m.name.startsWith('_'));

	parts.push(`<h2>${escape(cls.name)}${cls.extends ? ` <small>extends ${type(cls.extends)}</small>` : ''}</h2>`);
	parts.push(markdown(cls.doc.text));
	for (const tag of cls.doc.tags.filter(t => t.name === 'see')) {
		parts.push(`<p>See ${markdownInline(tag.comment)}</p>`);
	}
	if (cls.doc.examples.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-example`)}">Usage example</h3>${cls.doc.examples.map(markdown).join('')}`);
	}

	const ctors = members.filter(m => m.kind === 'constructor');
	if (ctors.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-constructor`)}">Constructor</h3>`);
		parts.push(table(['Constructor', 'Description'], ctors.map(c => `<tr><td>${signature(c, cls.name)}</td><td>${description(c)}</td></tr>`)));
	}

	// options
	const optionsName = `${cls.name}Options`;
	if (interfaces.has(optionsName)) {
		usedIds.add(optionsName.toLowerCase());
		parts.push(`<h3 id="${uniqueId(`${id}-option`)}"><span id="${optionsName.toLowerCase()}"></span>Options</h3>`);
		const own = ownMembers(optionsName).filter(m => m.kind === 'property');
		// options are also linked as `#markeroptions-icon`
		if (own.length) { parts.push(propertyTable(own, id, [...aliasPrefixes, optionsName.toLowerCase()], true)); }
		for (const ancestor of ancestors(optionsName)) {
			const inherited = ownMembers(ancestor).filter(m => m.kind === 'property');
			if (inherited.length) {
				parts.push(inheritedDetails('Options', classOfOptions(ancestor), propertyTable(inherited, `${id}-inherited`, [], true)));
			}
		}
	}

	// events
	const events = eventsOf(cls.name);
	const inheritedEvents = ancestors(cls.name).map(a => [a, eventsOf(a)]).filter(([, list]) => list.length);
	if (events.length || inheritedEvents.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-event`)}">Events</h3>`);
		if (events.length) { parts.push(eventTable(events, id, aliasPrefixes)); }
		for (const [ancestor, list] of inheritedEvents) {
			parts.push(inheritedDetails('Events', ancestor, eventTable(list, `${id}-inherited`, [])));
		}
	}

	// methods, by group
	const methods = members.filter(m => m.kind === 'method' && !m.isStatic),
	shown = new Set(methods.map(m => m.name));
	const inheritedMethods = ancestors(cls.name).map((a) => {
		const list = ownMembers(a).filter(m => m.kind === 'method' && !m.isStatic && !m.name.startsWith('_') && !shown.has(m.name));
		for (const m of list) { shown.add(m.name); }
		return [a, list];
	}).filter(([, list]) => list.length);
	if (methods.length || inheritedMethods.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-method`)}">Methods</h3>`);
		const groups = Map.groupBy(methods, m => (m.doc.group === 'Other methods' ? '' : m.doc.group));
		for (const [group, list] of [...groups].toSorted(([a], [b]) => (a === '') - (b === ''))) {
			if (group && groups.size > 1) {
				parts.push(`<h4 id="${uniqueId(`${id}-${slug(group)}`)}">${escape(group)}</h4>`);
			} else if (!group && groups.size > 1) {
				parts.push(`<h4 id="${uniqueId(`${id}-other-methods`)}">Other methods</h4>`);
			}
			parts.push(methodTable(list, id, aliasPrefixes, cls.name));
		}
		for (const [ancestor, list] of inheritedMethods) {
			parts.push(inheritedDetails('Methods', ancestor, methodTable(list, `${id}-inherited`, [], ancestor)));
		}
	}

	// properties
	const properties = members.filter(m => m.kind === 'property' && !m.isStatic && m.name !== 'options');
	if (properties.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-property`)}">Properties</h3>`);
		parts.push(propertyTable(properties, id, aliasPrefixes, false));
	}

	// static members
	const statics = members.filter(m => m.isStatic);
	if (statics.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-function`)}">Static members</h3>`);
		const fns = statics.filter(m => m.kind === 'method'), props = statics.filter(m => m.kind === 'property');
		if (fns.length) { parts.push(methodTable(fns, id, aliasPrefixes, cls.name)); }
		if (props.length) { parts.push(propertyTable(props, id, aliasPrefixes, false)); }
	}

	return parts.join('\n');
}

// the class whose options an interface describes, for the headings of inherited options
function classOfOptions(name) {
	const cls = name.endsWith('Options') ? name.slice(0, -7) : undefined;
	return cls && classes.has(cls) ? cls : name;
}

function renderInterface(item) {
	const decls = item.iface.decls,
	id = item.id,
	doc = decls.find(d => d.doc.text)?.doc ?? decls[0].doc,
	ext = decls.flatMap(d => d.extends),
	parts = [];
	parts.push(`<h2>${escape(item.name)}${ext.length ? ` <small>extends ${ext.map(type).join(', ')}</small>` : ''}</h2>`);
	parts.push(markdown(doc.text));
	for (const example of doc.examples) { parts.push(markdown(example)); }
	const members = ownMembers(item.name),
	properties = members.filter(m => m.kind === 'property'),
	methods = members.filter(m => m.kind === 'method');
	const withDefault = properties.some(p => p.doc.defaultValue !== undefined);
	if (properties.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-property`)}">Properties</h3>`);
		parts.push(propertyTable(properties, id, [], withDefault));
	}
	if (methods.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-method`)}">Methods</h3>`);
		parts.push(methodTable(methods, id, [], item.name));
	}
	for (const ancestor of ancestors(item.name)) {
		const inherited = ownMembers(ancestor).filter(m => m.kind === 'property');
		if (inherited.length) {
			parts.push(inheritedDetails('Properties', ancestor, propertyTable(inherited, `${id}-inherited`, [], withDefault)));
		}
	}
	const events = eventsOf(item.name);
	if (events.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-event`)}">Events</h3>`);
		parts.push(eventTable(events, id, []));
	}
	return parts.join('\n');
}

function renderAlias(item) {
	const {alias} = item;
	return `<h2>${escape(item.name)}</h2>\n${markdown(alias.doc.text)}<pre><code>type ${escape(item.name)} = ${type(alias.type)}</code></pre>`;
}

function renderModule(item) {
	const mod = item.module,
	id = item.id,
	parts = [`<h2>${escape(item.name)}</h2>`];
	const doc = mod.defaultDoc ?? mod.consts.find(c => c.name === item.name)?.doc;
	if (doc) { parts.push(markdown(doc.text)); }
	const consts = mod.consts.filter(c => c.name !== item.name || !mod.functions.length);
	if (mod.functions.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-function`)}">Functions</h3>`);
		parts.push(methodTable(mod.functions, id, [], item.name));
	}
	const properties = [...mod.defaultMembers, ...consts.map(c => ({...c, kind: 'property'}))];
	if (properties.length) {
		parts.push(`<h3 id="${uniqueId(`${id}-property`)}">Properties</h3>`);
		parts.push(propertyTable(properties, id, [], false));
	}
	return parts.join('\n');
}

function slug(text) {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const main = items.map((item) => {
	usedIds.add(item.id);
	const aliasIds = (idAliases[item.name] ?? []).map(a => `<span id="${a}"></span>`).join('');
	const body = {class: renderClass, interface: renderInterface, alias: renderAlias, module: renderModule}[item.kind](item);
	return `<section id="${item.id}" class="api-${item.kind}">${aliasIds}\n${body}\n</section>`;
}).join('\n\n');

const nav = index.sections.map(section => `<h2>${escape(section.title)}</h2>\n<ul>${section.entries.map(e => `<li><a href="#${e.id}">${escape(e.name)}</a></li>`).join('')}</ul>`).join('\n');

let html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>API reference – Maplair ${escape(pkg.version)}</title>
<link rel="icon" type="image/svg+xml" href="docs/images/favicon.svg">
<style>
${readFileSync('build/docs.css', 'utf8')}
</style>
</head>
<body>
<header class="page-header">
	<a class="home" href="./">Maplair</a>
	<h1>API reference</h1>
	<p>Version ${escape(pkg.version)}. Generated from the JSDoc of the sources.</p>
</header>
<div class="layout">
<nav class="toc" aria-label="Contents">
${nav}
</nav>
<main>
${main}
</main>
</div>
</body>
</html>
`;

// anchors are lowercase
html = html.replace(/href="#([^"]+)"/g, (match, id) => `href="#${id.toLowerCase()}"`);

// check the links within the reference
const ids = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), m => m[1]));
const broken = [...new Set(Array.from(html.matchAll(/href="#([^"]+)"/g), m => m[1]))].filter(id => !ids.has(id));
if (broken.length) {
	console.warn(`${broken.length} broken links in the reference: ${broken.join(', ')}`);
}

writeFileSync(outFile, html);
console.log(`Generated ${outFile}: ${items.length} items`);
