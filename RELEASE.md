## Releasing a new version of Maplair

- [ ] Ensure all https://github.com/maplair/maplair/labels/blocker issues and pull requests are resolved.
- [ ] Update [the changelog](https://github.com/maplair/maplair/blob/main/CHANGELOG.md) since last release and commit.
- [ ] Make sure all tests pass on CI before proceeding.
- [ ] Run `pnpm version <patch | minor | major | prerelease>` (this will bump the version in `package.json` and create a new tag); `prerelease` bumps e.g. `4.0.0-alpha.1` to `4.0.0-alpha.2`.
- [ ] Run `git push --follow-tags` to push the commit created by pnpm to Github (together with the tag).
  If `main` already contains the docs of the new version (see below), push only the tag first, e.g. `git push origin vX.X.X`, and push `main` once the release is on npm: the website is deployed on every push to `main`, and its CDN links point to the new version.
- [ ] Wait for the CI to complete and follow the logs to make sure it runs successfully.
- [ ] Approve the release staged on npm by the CI, with 2FA: `pnpm stage approve` (picks from the staged versions), or on npmjs.com.
  For a pre-release, which is published with its pre-release tag (e.g. `alpha`), also run `pnpm dist-tag add maplair@X.X.X latest` while there's no stable version yet.
- [ ] Verify that the release was correctly published to NPM by checking:
  - [ ] [Maplair NPM package page](https://www.npmjs.com/package/maplair)
  - [ ] files on [Maplair jsDelivr page](https://cdn.jsdelivr.net/npm/maplair@latest/)
- [ ] Make a new release on [Maplair's GitHub release page](https://github.com/maplair/maplair/releases/) with the most important parts of the changelog
- [ ] Download TGZ archive from https://registry.npmjs.org/maplair/-/maplair-X.X.X.tgz (where `X.X.X` is the new version number) and upload it as an "asset" of the GitHub release.

### Updating docs after the release

- [ ] Make a new branch for the update
- [ ] Write a blog post about the new release and put it in `/docs/_posts/`
- [ ] [Click here to save a snapshot](https://web.archive.org/save/https://maplair.org/reference.html)
of the version of docs prior to this release to the Internet Archive's Wayback Machine
(and optionally, add a link to the snapshot in `docs/reference-versions.html`).
- [ ] Run `pnpm run docs` to generate the new `docs/reference.html` and update `latest_maplair_version` in `docs/_config.yml`
- [ ] Update link to latest release in `docs/download.md`
- [ ] Update the announcement section in `docs/index.html`
- [ ] Commit all the changes and submit a PR for someone to review
