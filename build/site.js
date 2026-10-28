// Builds the website maplair.org into _site/ from docs/, covering the part of Jekyll the site uses:
// front matter, Liquid, Markdown, chained layouts, posts, the plugins collection and redirects.
// Adapted from build/site.js of Leaflet (https://github.com/Leaflet/Leaflet/pull/10484).
import {Liquid} from 'liquidjs';
import MarkdownIt from 'markdown-it';
import {parse as parseYaml} from 'yaml';
import {copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';

const SITE_DIR = 'docs',
DEST = '_site';

const POST_FILE = /^(\d{4})-(\d\d)-(\d\d)-(.+)\.md$/;
const MARKDOWN_EXT = /\.md$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?\r?\n)?---\r?\n/;
// tab indentation, which Ruby's YAML parser accepts in multiline strings, unlike the spec
const LEADING_TABS = /^\t+/gm;
const NON_ID_CHAR = /[^\p{L}\p{N}_\- ]/gu;

let headerIds;
const md = new MarkdownIt({html: true, typographer: true});
// code blocks without a language aren't highlighted, as with Jekyll
md.core.ruler.push('plaintext', (state) => {
	for (const token of state.tokens) {
		if (token.type === 'code_block' || token.type === 'fence' && !token.info) {
			Object.assign(token, {type: 'fence', info: 'plaintext'});
		}
	}
});
// kramdown-style header ids, which the site's anchors link to
md.renderer.rules.heading_open = (tokens, i, options, env, self) => {
	const text = tokens[i + 1].children
		.filter(t => t.type === 'text' || t.type === 'code_inline')
		.map(t => t.content).join('');
	let id = text.replace(NON_ID_CHAR, '').replaceAll(' ', '-').toLowerCase() || 'section';
	const n = headerIds.get(id) ?? 0;
	headerIds.set(id, n + 1);
	if (n) { id += `-${n}`; }
	tokens[i].attrSet('id', id);
	return self.renderToken(tokens, i, options);
};

const start = performance.now();
const site = {...JSON.parse(readFileSync('build/site.json', 'utf8')), time: new Date()};

const liquid = new Liquid({
	root: join(SITE_DIR, '_includes'),
	jekyllInclude: true,
	dynamicPartials: false,
	extname: '',
	timezoneOffset: 0
});

// Jekyll's date filters, e.g. "01 Sep 2015" and "01 September 2015"
const formatDate = (date, month) => {
	date = new Date(date);
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${day} ${date.toLocaleString('en-US', {month, timeZone: 'UTC'})} ${date.getUTCFullYear()}`;
};
liquid.registerFilter('date_to_string', date => formatDate(date, 'short'));
liquid.registerFilter('date_to_long_string', date => formatDate(date, 'long'));

const layouts = new Map();
function getLayout(name) {
	if (!layouts.has(name)) {
		const file = join(SITE_DIR, '_layouts', `${name}.html`);
		const {data, body} = readPage(file) ?? {data: {}, body: readFileSync(file, 'utf8')};
		layouts.set(name, {data, template: liquid.parse(body, file)});
	}
	return layouts.get(name);
}

// the plugins collection: rendered, but not written
site.plugins = walk(join(SITE_DIR, '_plugins')).map((file) => {
	const {data, body} = readPage(join(SITE_DIR, '_plugins', file));
	data.content = renderContent(body, true, data);
	return data;
});

// posts, newest first
site.posts = readdirSync(join(SITE_DIR, '_posts')).sort().reverse().map((file) => {
	const [, y, m, d, slug] = file.match(POST_FILE);
	const {data, body} = readPage(join(SITE_DIR, '_posts', file));
	const url = `/${y}/${m}/${d}/${slug}.html`;
	Object.assign(data, {url, id: url.slice(0, -5), date: new Date(`${y}-${m}-${d}`)});
	data.content = renderContent(body, true, data);
	return data;
});

rmSync(DEST, {recursive: true, force: true});

let count = 0;
for (const post of site.posts) {
	write(post.url, renderLayouts(post.content, post));
	for (const from of [post.redirect_from ?? []].flat()) {
		write(from, redirectPage(post.url));
	}
}
for (const file of walk(SITE_DIR)) {
	const path = join(SITE_DIR, file),
	page = readPage(path),
	out = `/${file.replace(MARKDOWN_EXT, '.html')}`;
	if (!page) {
		mkdirSync(dirname(join(DEST, out)), {recursive: true});
		copyFileSync(path, join(DEST, out));
		count++;
	} else if (page.data.redirect_to) {
		write(out, redirectPage(page.data.redirect_to));
	} else {
		page.data.url = out;
		write(out, renderLayouts(renderContent(page.body, MARKDOWN_EXT.test(file), page.data), page.data));
	}
}

console.log(`Built ${count} files in ${Math.round(performance.now() - start)} ms`);

// Jekyll's order: Liquid first, then Markdown
function renderContent(body, markdown, page) {
	const text = liquid.parseAndRenderSync(body, {site, page});
	if (!markdown) { return text; }
	headerIds = new Map();
	return md.render(text);
}

function renderLayouts(content, page) {
	const layoutData = {};
	for (let name = page.layout; name;) {
		const layout = getLayout(name);
		// the innermost layout's values win, as in Jekyll
		for (const key in layout.data) {
			if (!(key in layoutData)) { layoutData[key] = layout.data[key]; }
		}
		content = liquid.renderSync(layout.template, {site, page, layout: layoutData, content});
		name = layout.data.layout;
	}
	return content;
}

// the page of jekyll-redirect-from
function redirectPage(url) {
	return `<!DOCTYPE html>
<html lang="en-US">
  <meta charset="utf-8">
  <title>Redirecting&hellip;</title>
  <link rel="canonical" href="${url}">
  <script>location="${url}"</script>
  <meta http-equiv="refresh" content="0; url=${url}">
  <meta name="robots" content="noindex">
  <h1>Redirecting&hellip;</h1>
  <a href="${url}">Click here if you are not redirected.</a>
</html>
`;
}

// Splits front matter off a file; returns null for files without it (static files)
function readPage(path) {
	const buf = readFileSync(path);
	if (buf.toString('latin1', 0, 3) !== '---') { return null; }
	const text = buf.toString('utf8');
	const match = text.match(FRONT_MATTER);
	if (!match) { return null; }
	return {data: parseYaml((match[1] ?? '').replace(LEADING_TABS, ' ')) ?? {}, body: text.slice(match[0].length)};
}

// Lists files under dir recursively, skipping _ and . prefixed entries, as Jekyll does
function walk(dir, prefix = '') {
	return readdirSync(join(dir, prefix)).sort().flatMap((name) => {
		const rel = prefix ? `${prefix}/${name}` : name;
		if (name[0] === '_' || name[0] === '.') { return []; }
		return statSync(join(dir, rel)).isDirectory() ? walk(dir, rel) : [rel];
	});
}

function write(url, content) {
	const path = join(DEST, url);
	mkdirSync(dirname(path), {recursive: true});
	writeFileSync(path, content);
	count++;
}
