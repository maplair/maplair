Contributing to Maplair
=======================

 1. [Getting Involved](#getting-involved)
 2. [Reporting Bugs](#reporting-bugs)
 3. [Contributing Code](#contributing-code)
 4. [Running the Tests](#running-the-tests)
 5. [Improving Documentation](#improving-documentation)
 6. [Code of Conduct](#code-of-conduct)
 7. [Thank You](#thank-you)

## Getting Involved

Third-party patches are absolutely essential in our quest to create the best mapping library that will ever exist.
However, they're not the only way to get involved with Maplair development.
You can help the project tremendously by discovering and [reporting bugs](#reporting-bugs);
[improving documentation](#improving-documentation);
helping others on [GIS Stack Exchange](https://gis.stackexchange.com/questions/tagged/leaflet)
and [GitHub issues](https://github.com/maplair/maplair/issues);
and spreading the word about Maplair among your colleagues and friends.

## Reporting Bugs

Before reporting a bug on the project's [issues page](https://github.com/maplair/maplair/issues),
first make sure that your issue is caused by Maplair, not your application code
(e.g. passing incorrect arguments to methods, etc.).
Second, search the already reported issues for similar cases,
and if it's already reported, just add any additional details in the comments.

After you've made sure that you've found a new Maplair bug,
here are some tips for creating a helpful report that will make fixing it much easier and quicker:

 * Write a **descriptive, specific title**. Bad: *Problem with polylines*. Good: *Doing X in IE9 causes Z*.
 * Include **browser, OS and Maplair version** info in the description.
 * Create a **simple test case** that demonstrates the bug (e.g. using [Maplair plunker](https://maplair.org/edit.html)).
 * Check whether the bug can be reproduced in **other browsers**.
 * Check if the bug occurs in the stable version, main, or both.
 * *Bonus tip:* if the bug only appears in the main version but the stable version is fine,
   use `git bisect` to find the exact commit that introduced the bug.

If you just want some help with your project,
try asking on [GIS Stack Exchange](https://gis.stackexchange.com/questions/tagged/leaflet) instead.

## Contributing Code

### Considerations for Accepting Patches

While we happily accept patches, we're also committed to keeping Maplair simple, lightweight and blazingly fast.
So bugfixes, performance optimizations and small improvements that don't add a lot of code
are much more likely to get accepted quickly.

Before sending a pull request with a new feature, check if it's been discussed before already
on [GitHub issues](https://github.com/maplair/maplair/issues)
and ask yourself two questions:

 1. Are you sure that this new feature is important enough to justify its presence in the Maplair core?
    Or will it look better as a plugin in a separate repository?
 2. Is it written in a simple, concise way that doesn't add bulk to the codebase?

If your feature or API improvement did get merged into main,
please consider submitting another pull request with the corresponding [documentation update](#improving-documentation).

### Setting up the Build System

The Maplair build system uses [NodeJS](https://nodejs.org/) and the [pnpm](https://pnpm.io/) package manager.
To set up the Maplair build system, install [NodeJS](https://nodejs.org/) and [pnpm](https://pnpm.io/installation)
(the pnpm version of the project, set in the `packageManager` field of `package.json`, is picked automatically).
Then run the following command in the project root to install dependencies:

```
pnpm install
```

### Making Changes to Maplair Source

If you're not yet familiar with the way GitHub works (forking, pull requests, etc.),
be sure to check out the awesome [article about forking](https://help.github.com/articles/fork-a-repo)
on the GitHub Help website — it will get you started quickly.

You should always write each batch of changes (feature, bugfix, etc.) in **its own topic branch**.
Please do not commit to the `main` branch of your fork — otherwise your unrelated changes will go into the same pull request.

You should also follow the code style and whitespace conventions of the original codebase.
In particular, use tabs for indentation and spaces for alignment.

Maplair targets browsers which support the web features that are [Baseline Widely available](https://web.dev/baseline)
(supported by all major browsers for at least 30 months).
Only use JavaScript features and web APIs that are Baseline Widely available: `pnpm run lint` checks this with [`eslint-plugin-baseline-js`](https://github.com/3ru/eslint-plugin-baseline-js).

Before committing your changes, run `pnpm run lint` to catch any JS errors in the code and fix them. 
The same command is automatically executed while committing. 
You can prevent it from execution with the git flag `--no-verify`: `git commit -m "WIP" --no-verify`.  

Also, please make sure that you have [line endings configured properly](https://help.github.com/articles/dealing-with-line-endings) in Git! Otherwise the diff will show that all lines of a file were changed even if you touched only one.

Happy coding!

### Building Maplair

The source JavaScript code for Maplair is a few dozen files, in the `src/` directory.
But normally, Maplair is loaded in a web browser as just one JavaScript file.

In order to create this file, run `pnpm run build`.

You'll find `dist/maplair-src.js` and `dist/maplair.js`. The difference is that
`dist/maplair-src.js` has sourcemaps and it's not uglified, so it's better for
development. `dist/maplair.js` is uglified and thus is smaller, so it's better
for deployment.

When developing (or bugfixing) core Maplair functionalities, it's common to use
the webpages in the `debug/` directory, and run the tests
in a graphical browser. This requires regenerating the bundled files quickly.

In order to do so, run `pnpm run watch`. This will keep
on rebuilding the bundles whenever any source file changes.

## Running the Tests

Tests run in real browsers via [Vite+](https://viteplus.dev/) (`vp test`, bundling [Vitest](https://vitest.dev/)) in browser mode (Playwright provider), against the sources in `src/`, so no build is needed.

```
pnpm test
```

Runs the suite once in headless Chromium. To run it in another browser, set `TEST_BROWSER`, and pass spec paths to run only those:

```
TEST_BROWSER=firefox pnpm test
TEST_BROWSER=webkit pnpm test
pnpm test spec/suites/layer/PopupSpec.js
```

For watch mode, run `pnpm exec vp test watch`.

To open the Vitest UI for interactive debugging:

```
pnpm run test:ui
```

This opens a dashboard at `http://localhost:51204/__vitest__/` and spawns a visible browser window. Open DevTools in that window to set breakpoints in source (sourcemaps work), inspect the test DOM, and step through specs. Use `it.only(...)` to isolate a single test, or `debugger;` statements to pause inline.

Playwright will install its own browser binaries the first time it runs (`pnpm exec playwright install chromium firefox webkit`).

## Improving Documentation

The code of the live Maplair website that contains all documentation and examples is located in the `docs/` directory of the `main` branch
and is generated from a set of HTML and Markdown files by a small Node script, [`build/site.js`](./build/site.js),
which covers the part of [Jekyll](https://jekyllrb.com/) the website uses (front matter, Liquid, Markdown, layouts and posts).

The easiest way to make little improvements such as fixing typos without even leaving the browser
is by editing one of the files with the online GitHub editor:
browse the [`docs/ directory`](https://github.com/maplair/maplair/tree/main/docs),
choose a certain file for editing, click the Edit button, make changes and follow instructions from there.
Once it gets merged, the changes will immediately appear on the website.

To preview the website locally, run `pnpm run serve` and open the printed URL.
It builds the website into `_site/` (in a fraction of a second) and serves it; run `pnpm run site` to rebuild after changes.
The examples load Maplair from `docs/dist/`, so run `vp pack && cp -r dist docs/dist` first.
After committing the changes, just send a pull request.

### API documentation

The API documentation is generated from the JSDoc comments in `src/`, which document
every class, method, option, event and property next to its code, with TypeScript
types; see [build/JSDOC.md](build/JSDOC.md) for the conventions. In order to edit the
API documentation, just edit these comments in the source code.

The same comments are the source of the type declarations. Make sure that the
development dependencies are installed (run `pnpm install`), then run

```
pnpm run types        # the type declarations in dist/types/
pnpm run types:check  # type-check them, and the scripts of the debug pages
pnpm run docs         # the API reference in docs/reference.html
```

The order of the API reference is defined in `build/docs-index.json`.

## Translating

Maplair's built-in strings (e.g. the titles of the zoom buttons) are translated on
[Transifex](https://app.transifex.com/simon04/maplair/). Join the project there to
add or improve a translation, rather than editing the files in `i18n/` directly.

For maintainers: after adding or changing strings passed to `I18n.translate()`,
run `pnpm run i18n` to update the source file `i18n/en.json`, and upload it with
`tx push --source` ([Transifex CLI](https://developers.transifex.com/docs/cli)).
Download the translations with `tx pull --all` before a release.

## Code of Conduct

Everyone is invited to participate in the Maplair community and related projects:
we want to create a welcoming and friendly environment.
Harassment of participants or other unethical and unprofessional behavior will not be tolerated in our spaces.
The [Contributor Covenant](CODE_OF_CONDUCT.md)
applies to all projects under the Maplair organization.
Report any issues to agafonkin@gmail.com or ivan@sanchezortega.es.

## Thank You

Not only does your contribution to Maplair and its community earn our gratitude, but it also makes you AWESOME.
Join [this approved list of awesome people](https://github.com/maplair/maplair/graphs/contributors)
and help us push the limits of what's possible with online maps!
