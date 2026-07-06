# CLAUDE.md

Instructions for Claude (Cowork, Claude Code, or any Claude agent) working on
this repository.

## Project

`gulp-rollup-2` — a Gulp plugin that wraps Rollup 4.x for bundling JS modules
(UMD/ESM/CJS/IIFE/AMD/System), published to npm as `gulp-rollup-2`. Developed
locally in VS Code by Orçun Saltık (saltikorcun@gmail.com) and mirrored to
GitHub at orcunsaltik/gulp-rollup-2. The entire plugin lives in one file,
`index.js`, by design — keep it that way unless explicitly asked to restructure.

## Standing rules

1. **Tests before publish, always.** Run `npm test` (lint + the full
   `node --test` suite) after any change to `index.js` and confirm it passes
   before calling anything "done," before opening a PR, and always before a
   release. Never publish with failing or skipped tests. `prepublishOnly` in
   `package.json` already re-runs `npm test` as a safety net — don't remove it.

2. **Ask before implementing.** Before making a nontrivial change (bug fix,
   refactor, new dependency, new file/doc) that wasn't explicitly requested in
   the current instruction, summarize what you found and what you propose,
   and get explicit approval first. Don't silently bundle "nice to have"
   changes in with what was asked for.

3. **Every behavior change needs a regression test** under `test/*.test.js`.
   No exceptions — this plugin has no other safety net.

## Things already fixed once — don't regress them

- `output.file` is **intentionally optional** in pipe mode (`rollup2.rollup()`).
  When omitted, it falls back to the source Vinyl file's basename (fixes
  GitHub issue #2). Don't reintroduce a hard requirement for `file` outside
  of `rollup2.src()` (standalone mode), where it's still required.
- The duplicate-input-configuration check **excludes `plugins`** from its
  comparison. Plugin factories (e.g. `resolve()`) return a new instance every
  call, so comparing them would make the check never fire for the realistic
  case it exists to catch.
- Inside the per-file loop in `inside()` (pipe mode), `outputs` config objects
  come from `sanitizeConfig()` and are **shared across every file** in the
  stream. Never mutate them directly — always shallow-clone
  (`{ ...outputOpts }`) before deriving a per-file `name`/`file`/`amd.id`, or
  you'll reintroduce the cross-file state leak where the first file's derived
  values get reused for every subsequent file.

## Dev workflow

```bash
npm install
npm run lint        # eslint index.js
npm run lint:fix
npm test            # lint + full test suite — required before commit/PR/publish
npm run test:unit    # node --test only, skips lint
```

## Structure

- `index.js` — the whole plugin: `rollup2.rollup()` (pipe mode) and
  `rollup2.src()` (standalone async factory mode).
- `test/` — `node:test` suite (`validation.test.js`, `bundle.test.js`),
  `helpers.js`, and `fixtures/` (real files on disk — Rollup reads the module
  graph from disk, not from in-memory Vinyl contents).
- `.github/workflows/ci.yml` — runs on Node 18/20/22, `npm ci` +
  `npm audit --audit-level=high` + `npm test`.
- `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md` — contribution
  templates.
- `SECURITY.md` — private vulnerability reporting process.
- `CONTRIBUTING.md` — contributor workflow and code style.

## Release checklist

1. Approved changes merged; `npm test` green locally.
2. Bump `version` in `package.json` (semver: patch for fixes, minor for
   backward-compatible features, major for breaking changes).
3. Add a changelog entry under `## Changelog` in `README.md`.
4. `npm publish` (the `prepublishOnly` hook re-runs `npm test` automatically —
   publish is blocked if it fails).
5. Tag the release and create a matching GitHub release.
