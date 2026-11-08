# Maplair plugin authoring guide

One of the greatest things about Maplair is its plugin ecosystem. The
[Maplair plugins page](https://maplair.org/plugins.html) lists hundreds of plugins, and more are added every week.

This guide lists best practices for publishing a Maplair plugin that meets the quality standards of Maplair itself.

1. [Presentation](#presentation)
	- [Repository](#repository)
	- [Name](#name)
	- [Demo](#demo)
	- [Readme](#readme)
	- [License](#license)
2. [Code](#code)
	- [File structure](#file-structure)
	- [Code conventions](#code-conventions)
	- [Plugin API](#plugin-api)
	- [Adding to Maplair classes](#adding-to-maplair-classes)
	- [Script tags and the global build](#script-tags-and-the-global-build)
3. [Accessibility](#accessibility)
4. [Publishing on npm](#publishing-on-npm)
5. [Adding to the plugins list](#adding-to-the-plugins-list)

## Presentation

### Repository

The best place for a Maplair plugin is its own [GitHub](https://github.com) repository. If you write several plugins
for different uses, don't put them in one repo: small, self-contained plugins in separate repositories are easier to
work with.

### Name

Most plugins and their repos are named like `maplair-my-plugin-name`. Whatever name you pick, include the word
"Maplair" so that it's obvious it's a Maplair plugin.

### Demo

The most important thing to publish with a plugin is a demo that shows what it does. It's usually the first thing
people look for.

The easiest way to host a demo is [GitHub Pages](https://pages.github.com/). Add an `index.html` page to your repo
and [publish it from a branch or folder](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site),
and it'll be available at `https://<user>.github.io/<repo>`.

### Readme

Next, write a [good `README.md`](https://github.com/noffle/art-of-readme) in the root of the repo, or link to a
website with similar content. At a minimum, it should have:

- the name of the plugin
- a short description of what it does
- requirements:
	- the Maplair versions it supports
	- other dependencies, if any
	- browser and device support
- links to demos
- how to install and load the plugin
- a simple usage example
- an API reference (methods, options, events)

### License

Every open source repository should have a license. If you don't know which one to choose,
the [MIT License](https://opensource.org/licenses/MIT) and the
[BSD 2-Clause License](https://opensource.org/licenses/BSD-2-Clause) are both good choices. Put it in the repo as a
`LICENSE` file, or link to it from the readme.

## Code

### File structure

Keep the file structure simple, so that someone new can find their way around your repo. A minimal plugin needs only
this:

```
maplair-my-plugin.js
README.md
```

A larger plugin might look like this:

```
/src        - JS source files
/dist       - built JS and CSS
/test       - tests
/demo       - HTML examples of plugin usage
README.md
LICENSE
package.json
```

### Code conventions

Everyone's tastes differ, but be consistent with whatever conventions you choose.

Write your plugin as an ES module using modern JavaScript (classes, `const`/`let`, arrow functions). Maplair itself
uses tabs for indentation and [Oxlint](https://oxc.rs/) to keep its code consistent.

### Plugin API

- Import what you need from Maplair with named imports (`import {Marker, Util} from 'maplair'`), and use named exports
  in your plugin too, so that it can be imported as `import {MyLayer} from 'maplair-my-plugin'`.
- Export your classes, whether they extend a Maplair class or not, so that users can create and subclass them.
- Don't set global variables from your module. A separate script build can add your classes to `L` (see
  [below](#script-tags-and-the-global-build)).
- Name functions, methods and properties in `camelCase`, and classes in `PascalCase`. Users create objects with
  `new`, so don't add lowercase factory functions.
- Maplair ships its own types. Ship types for your plugin too, and declare anything you add to Maplair classes with
  TypeScript's [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation).

If a function takes many arguments, accept an options object instead, with defaults for everything that can have
one:

```js
// bad
marker.myPlugin('bla', 'foo', null, {}, 5, 0);

// good
marker.myPlugin('bla', {
	optionOne: 'foo',
	optionThree: 5
});
```

And most importantly, keep it simple. Maplair is all about *simplicity*.

### Adding to Maplair classes

Add methods to a Maplair class with `include()`: `Marker.include({myMethod() {…}})`.

Plugins often also need something per instance, like an editor on every polyline or a new marker option. An
`addInitHook` works, but it runs for every instance whether or not your plugin is used on it, and it misses instances
created before your plugin loaded. Two patterns are often simpler.

**A lazy getter** for a per-instance helper. It's created on first access, costs nothing for layers that never use
it, and works on layers created before your plugin was imported:

```js
import {Polyline} from 'maplair';

const editors = new WeakMap();

Object.defineProperty(Polyline.prototype, 'editor', {
	configurable: true,
	get() {
		let editor = editors.get(this);
		if (!editor) {
			editor = new PolylineEditor(this);
			editors.set(this, editor);
		}
		return editor;
	}
});
```

**A default for a new option**, either read with a fallback where you use it, or added once to the class defaults,
instead of filled into `this.options` by a hook:

```js
const angle = marker.options.rotationAngle ?? 0;

// or
Marker.mergeOptions({rotationAngle: 0});
```

A module that changes Maplair classes when imported, with `include()`, `mergeOptions()`, `addInitHook()` or a
prototype getter, has side effects. List it in [`sideEffects`](#publishing-on-npm), or a bundler may drop the import.

### Script tags and the global build

Your plugin's module imports from `'maplair'`. That works with a bundler, and in a page that loads Maplair as a
module through an import map:

```html
<script type="importmap">
	{
		"imports": {
			"maplair": "https://cdn.jsdelivr.net/npm/maplair@4/dist/maplair.js",
			"maplair-my-plugin": "https://cdn.jsdelivr.net/npm/maplair-my-plugin@1.0.0/dist/maplair-my-plugin.js"
		}
	}
</script>
<script type="module">
	import {MaplairMap} from 'maplair';
	import {MyLayer} from 'maplair-my-plugin';
</script>
```

Pages that use the global `L` from Maplair's `maplair-global.js` can't import modules. For
them, publish a script build next to the module: an entry file that adds your classes to `L`, bundled as an IIFE with
`maplair` mapped to the global `L`.

```js
// build/global.js
import {MyLayer} from '../src/MyLayer.js';

window.L.MyLayer = MyLayer;
```

```js
// rolldown.config.js (Rollup takes the same options)
export default [
	{input: './src/MyLayer.js', external: ['maplair'], output: {file: './dist/maplair-my-plugin.js'}},
	{
		input: './build/global.js',
		external: ['maplair'],
		output: {file: './dist/maplair-my-plugin-global.js', format: 'iife', globals: {maplair: 'L'}}
	}
];
```

Load the script build after `maplair-global.js`. Don't mix the two kinds in one page: a plugin module that imports
`maplair` next to `maplair-global.js` loads a second copy of Maplair, and checks like `instanceof LatLng` fail between
the two.

## Accessibility

Make sure your plugin is accessible to everyone. Some people navigate only with a keyboard, and some rely on a screen
reader to convey visual information. Make your controls work with the keyboard, and give non-text content (such as
icon fonts and images) a text alternative, or hide it from screen readers if it's purely decorative.

### Automated testing

These tools find common accessibility issues:

- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [axe](https://www.deque.com/axe/)
- [WAVE](https://wave.webaim.org/)
- [Accessibility Insights](https://accessibilityinsights.io/)
- [webhint](https://webhint.io/)

### Manual testing

Test your plugin with only the keyboard, and with a screen reader such as Narrator, NVDA, VoiceOver or JAWS.

### Learn about web accessibility

Beginner-friendly documentation:

- [What is accessibility?](https://web.dev/what-is-accessibility/)
- [Make your site keyboard accessible](https://web.dev/accessible/#make-your-site-keyboard-accessible)
- [Understand semantics and basic screen reader support](https://web.dev/accessible/#understand-semantics-and-basic-screen-reader-support)
- More guides at [MDN web docs: Accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility)

Authoritative documentation:

- [WAI (Web Accessibility Initiative): Accessibility Fundamentals Overview](https://www.w3.org/WAI/fundamentals/)
- [ARIA in HTML (Accessible Rich Internet Applications)](https://www.w3.org/TR/html-aria/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices/)
- [Using ARIA](https://www.w3.org/TR/using-aria/)
- [WCAG (Web Content Accessibility Guidelines)](https://www.w3.org/TR/WCAG/)

## Publishing on npm

Publish your plugin on [npm](https://www.npmjs.com/), so that people can install it along with its dependencies.
npm's [guide for package authors](https://docs.npmjs.com/using-npm/developers.html) walks you through it.

List `maplair` in `peerDependencies`, not `dependencies`, so that your plugin uses the same copy of Maplair as the
app. With a separate copy, checks like `instanceof LatLng` fail between the two.

Set `"sideEffects": false` if importing your module changes nothing, so that bundlers can drop it when it's unused. If
some files do change things (they call `include()` or `mergeOptions()` on Maplair classes, or are stylesheets), list
those instead: `"sideEffects": ["./src/MarkerPatches.js", "*.css"]`.

Here is an example `package.json` for a Maplair plugin:

```json
{
  "name": "maplair-my-plugin",
  "version": "1.0.0",
  "description": "A simple Maplair plugin.",
  "type": "module",
  "exports": "./src/MyLayer.js",
  "files": ["src", "dist"],
  "sideEffects": false,
  "author": "You",
  "license": "MIT",
  "scripts": {
    "build": "rolldown --config",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "maplair": "^4.0.0"
  }
}
```

Don't commit built files (such as `dist`) to the repo: it's easy to end up debugging the wrong file. Build them just
before publishing with a [`prepublishOnly` script](https://docs.npmjs.com/cli/using-npm/scripts#life-cycle-scripts) as
above, keep them out of the repo with [`.gitignore`](https://docs.github.com/en/get-started/git-basics/ignoring-files),
and list what gets published in the [`files` field](https://docs.npmjs.com/cli/configuring-npm/package-json#files).

## Adding to the plugins list

Once your plugin is published, add it to the [Maplair plugins list](https://maplair.org/plugins.html):

1. [Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)
   the Maplair repo.
2. Copy `docs/_plugins/template.md` into the category folder under `docs/_plugins/` that fits your plugin (the folder
   decides where it's listed), and fill in the information and links, with the Leaflet versions it works with in
   `compatible-v1` and `compatible-v2`.
3. Commit the file to your fork and
   [open a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
   to Maplair's repo.

A maintainer will have a quick look at your plugin, and if everything looks right, it'll appear in the list shortly
after.
