// Describes Maplair's custom elements (src/elements/) for editors and tools, after `vp pack` and build/types.js:
// * dist/custom-elements.json, a Custom Elements Manifest (https://custom-elements-manifest.open-wc.org/) with the
//   attributes of each element and their defaults,
// * the `HTMLElementTagNameMap` of the elements, added to dist/types/elements/index.d.ts, so that
//   `document.querySelector('maplair-map')` is a `MapElement`.
import {appendFileSync, existsSync, writeFileSync} from 'node:fs';
import {elements, defaultsOf} from '../src/elements/index.js';

const camelRe = /-([a-z])/g,
camel = name => name.replace(camelRe, (_, c) => c.toUpperCase());

function typeOf(value) {
	if (value === undefined || value === null) { return undefined; }
	if (Array.isArray(value)) { return 'array'; }
	return typeof value;
}

const declarations = [];
for (const [tagName, Element] of elements) {
	const defaults = defaultsOf(Element.Class),
	attributes = [];
	for (const name of Element.observedAttributes ?? []) {
		const value = defaults[camel(name)],
		type = typeOf(value);
		attributes.push({
			name,
			...(type ? {type: {text: type}} : {}),
			...(type && type !== 'object' && type !== 'function' ? {default: JSON.stringify(value)} : {})
		});
	}
	declarations.push({
		kind: 'class',
		name: Element.name,
		tagName,
		customElement: true,
		...(Element.Class ? {description: `The element of \`${Element.Class.name}\`, with its options as attributes in kebab-case (e.g. ${attributes.slice(0, 2).map(a => `\`${a.name}\``).join(', ')}).`} : {}),
		attributes,
		events: (Element.events ?? []).map(type => ({name: `maplair-${type}`, type: {text: 'CustomEvent'}}))
	});
}

const manifest = {
	schemaVersion: '2.1.0',
	modules: [{
		kind: 'javascript-module',
		path: 'src/elements/index.js',
		declarations,
		exports: declarations.map(d => ({kind: 'custom-element-definition', name: d.tagName, declaration: {name: d.name, module: 'src/elements/index.js'}}))
	}]
};
writeFileSync('dist/custom-elements.json', `${JSON.stringify(manifest, null, '\t')}\n`);

const dts = 'dist/types/elements/index.d.ts';
if (existsSync(dts)) {
	const lines = declarations.map(d => `\t\t'${d.tagName}': import('./index.js').${d.name};`);
	appendFileSync(dts, `\ndeclare global {\n\tinterface HTMLElementTagNameMap {\n${lines.join('\n')}\n\t}\n}\n`);
}
console.log(`Described ${declarations.length} custom elements in dist/custom-elements.json and ${dts}`);
