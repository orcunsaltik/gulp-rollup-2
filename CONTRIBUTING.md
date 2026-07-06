# Contributing to gulp-rollup-2

Thanks for taking the time to contribute! This project is a small, focused
Gulp plugin, so the process is intentionally lightweight.

## Getting Started

```bash
git clone https://github.com/orcunsaltik/gulp-rollup-2.git
cd gulp-rollup-2
npm install
```

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your change in `index.js`
4. Add or update tests under `test/` for any behavior change
5. Run the full check locally: `npm test` (lint + tests) — this must pass
6. Commit: `git commit -m 'Add some amazing feature'`
7. Push and open a Pull Request against `master`

## Code Style

- Formatting/lint rules are enforced by ESLint (`eslint-config-standard`) and
  Prettier. Run `npm run lint:fix` before committing.
- Keep `index.js` dependency-light and framework-agnostic — this plugin
  intentionally has a small surface area.

## Tests

- Tests live in `test/*.test.js` and run with Node's built-in test runner
  (`node --test`), no extra test framework required.
- New behavior (bug fixes, options, edge cases) should come with a
  regression test. PRs that change behavior without a test are unlikely to
  be merged as-is.
- CI runs the suite against Node 18, 20, and 22.

## Reporting Bugs / Requesting Features

Please use the issue templates when opening a
[new issue](https://github.com/orcunsaltik/gulp-rollup-2/issues/new/choose).
Include a minimal reproduction (Rollup config + `gulp.src()` call) whenever
reporting a bug.

## Security

Do not open a public issue for security vulnerabilities — see
[SECURITY.md](SECURITY.md) instead.

## Code of Conduct

Be respectful and constructive. Disagreements about code are fine;
disrespect toward other contributors is not.
