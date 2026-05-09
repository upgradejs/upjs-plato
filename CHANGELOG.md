# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The next release, currently `2.0.0` in `package.json`, will collect the work merged to `main` since `1.3.1`. It has not yet been published to npm.

### Added

- **Dynamic configuration loading** for Babel and ESLint: callers can now point at their own `.babelrc` / ESLint configs without needing the relevant plugins installed as direct dependencies of `upjs-plato`. ([#2](https://github.com/upgradejs/upjs-plato/pull/2))
- **Dependencies reports** in the HTML output: audit (`yarn audit` / `npm audit`), outdated (`yarn outdated` / `npm outdated`), and depngn (Node engine compatibility). Two new CLI flags drive these:
  - `-p` / `--projectRoot`: directory containing the lockfile used by audit / outdated / depngn. Defaults to the current working directory.
  - `-T` / `--targetNode`: target Node major version for the depngn report. ([#3](https://github.com/upgradejs/upjs-plato/pull/3))

### Documentation

- README example for running via `npx upjs-plato`. ([#5](https://github.com/upgradejs/upjs-plato/pull/5))
- README install instructions for Yarn and a note clarifying the `upjs-plato` executable name. ([#6](https://github.com/upgradejs/upjs-plato/pull/6))

### Infrastructure

- Replaced the non-functional Travis CI config with a GitHub Actions workflow running on Ubuntu and macOS across Node 20, 22, and 24. ([#8](https://github.com/upgradejs/upjs-plato/pull/8))
- `engines.node` bumped from `>= 0.10.0` to `>= 18.0.0` to match what the codebase actually requires. ([#8](https://github.com/upgradejs/upjs-plato/pull/8))
- `npm test` now runs `node --test test/*_test.js` (built-in test runner, no new dependencies) instead of the previous TODO placeholder. ([#8](https://github.com/upgradejs/upjs-plato/pull/8))

## [1.3.1] - 2023-05-16

### Changed

- Metadata-only release. Updated `homepage`, `repository.url`, and `bugs.url` from `es6-plato` to `upjs-plato` after the fork rename. No source changes from `1.3.0`.

## [1.3.0] - 2023-05-16

Initial publish of the `upjs-plato` fork to npm. Code is a snapshot of `es6-plato@1.2.4` with the package renamed.

Note: this release shipped with `homepage`, `repository.url`, and `bugs.url` still pointing at `es6-plato`. Those were corrected in `1.3.1` minutes later.

---

## Pre-fork history

The following versions belong to the upstream [`plato`](https://github.com/es-analysis/plato) and [`es6-plato`](https://github.com/the-simian/es6-plato) projects from which `upjs-plato` was forked. They were never published under the `upjs-plato` name and are preserved here for context.

| version     | update                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------ |
| 1.0.2-alpha | Project works with es6 and eslint                                                                |
| 1.0.6-alpha | Use typhonjs-escomplex                                                                           |
| 1.0.0       | Class methods parsed and evaluated correctly                                                     |
| 1.0.2       | Fix error when no callback supplied                                                              |
| 1.0.5       | Update dependencies; fix lodash; add summary display link                                        |
| 1.0.7       | Default complexity to 1-100 not 1-177, this can be overridden in the complexity object settings. |
| 1.0.8       | Fixes to eslint allowing for plugin usage.                                                       |
| 1.0.9       | Update dependencies to latest versions                                                           |
| 1.0.13      | Fix templates to work in some CI envs + add jsx support                                          |
| 1.0.14      | update dependencies in package.json                                                              |
| 1.0.15      | update dependencies in package.json                                                              |
| 1.0.16      | switch to globby, address Linux line endings                                                     |
| 1.0.17      | Explicitly add eslint-plugin-react and update the dependencies                                   |
| 1.0.18      | Offer eslintrc option in cli and update documentation, update dependencies too                   |
| 1.1.15      | Update the dependencies and remove Grunt, for now since it was insecure dependency               |
| 1.1.16      | Update eslint to 5.14.0                                                                          |
| 1.2.0       | Update eslint, globby, lodash, typhon-complex and others                                         |
| 1.2.1       | reverts typhon-complex for now, see issue #95                                                    |
| 1.2.2       | reverts globby, 10 doesn't by default handle windows slashes                                     |
| 1.2.3       | updates eslint and globby                                                                        |
| 1.2.4       | updates lodash                                                                                   |
