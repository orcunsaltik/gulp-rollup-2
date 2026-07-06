# gulp-rollup-2

[![CI](https://github.com/orcunsaltik/gulp-rollup-2/actions/workflows/ci.yml/badge.svg)](https://github.com/orcunsaltik/gulp-rollup-2/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/gulp-rollup-2.svg)](https://www.npmjs.com/package/gulp-rollup-2)
[![npm downloads](https://img.shields.io/npm/dt/gulp-rollup-2.svg)](https://www.npmjs.com/package/gulp-rollup-2)
[![node version](https://img.shields.io/node/v/gulp-rollup-2.svg)](https://www.npmjs.com/package/gulp-rollup-2)
[![license](https://img.shields.io/npm/l/gulp-rollup-2.svg)](LICENSE)

> Modern, production-grade Gulp plugin for Rollup

`gulp-rollup-2` is a ground-up rewrite for Rollup v3+ (fully tested with v4), delivering robust behavior in caching, sourcemap handling, and multi-output scenarios. This package aims to overcome limitations of legacy `gulp-rollup` / `rollup-stream` approaches.

## Features

- ✅ **Rollup 3.x / 4.x compatibility** - Fully tested with latest Rollup
- ✅ **Native Rollup API** in Gulp `pipe()` chains
- ✅ **Multiple output formats** - ES, CJS, UMD, IIFE, AMD, System
- ✅ **Production-grade caching** - Intelligent incremental builds with `object-hash`
- ✅ **Duplicate detection** - Prevents configuration conflicts automatically
- ✅ **Memory-safe** - Automatic bundle cleanup, no leaks
- ✅ **Sourcemap intelligence** - Secure merge & fallback handling
- ✅ **Dual modes** - Use with `gulp.src()` or standalone `src()` factory
- ✅ **Deterministic builds** - No streaming, predictable output

## Requirements

- **Node.js** >= 18.0.0 (recommended: latest LTS)
- **Gulp** >= 4.0.0
- **Rollup** >= 4.0.0 (tested with 4.x)

## Installation

```bash
npm install --save-dev gulp-rollup-2 rollup
```

## Basic Usage (Pipe Mode)

The most common usage scenario:

> **Tip:** `output.file` is optional inside `rollup2.rollup()` (pipe mode). If you
> omit it, the bundle keeps the original file's name — see [Multiple source files](#multiple-source-files-pipe-mode) below.

```js
const gulp = require('gulp');
const rollup2 = require('gulp-rollup-2');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');

gulp.task('bundle', () =>
  gulp
    .src('src/index.js')
    .pipe(
      rollup2.rollup({
        plugins: [resolve(), commonjs()],
        output: {
          file: 'bundle.js',
          format: 'iife',
          name: 'App',
          sourcemap: true,
        },
      })
    )
    .pipe(gulp.dest('dist'))
);
```

## Multiple Outputs

Generate multiple formats from a single input:

```js
.pipe(rollup2.rollup({
  plugins: [resolve(), commonjs()],
  output: [
    { file: 'app.esm.js', format: 'es', sourcemap: true },
    { file: 'app.umd.js', format: 'umd', name: 'App', sourcemap: true },
    { file: 'app.cjs.js', format: 'cjs', sourcemap: true }
  ]
}))
```

**Important:** Output files must be unique. Duplicate output files will throw an error.

## Multiple Source Files (Pipe Mode)

`rollup2.rollup()` is meant to run inside a `gulp.src()` stream, which can carry
more than one file (e.g. `gulp.src('src/js/*.js')`). If `output.file` is set,
**every** file in the stream is bundled to that same name, so with more than
one input file, each one overwrites the previous output.

To bundle each source file to its own output, omit `output.file`. Each file
then keeps its own name automatically:

```js
gulp
  .src('src/js/*.js')
  .pipe(
    rollup2.rollup({
      plugins: [resolve(), commonjs()],
      output: {
        format: 'iife',
        // no 'file' -> each output keeps its source file's name
      },
    })
  )
  .pipe(gulp.dest('dist'));
```

`src/js/a.js` and `src/js/b.js` produce `dist/a.js` and `dist/b.js` instead of
both being written to the same hardcoded filename.

**Note:** at most one output entry per config may omit `file`. If two or more
outputs in the same `output: [...]` array both omit `file`, they would collide
on the same source filename, so this throws an error asking you to name them
explicitly.

**Note:** in `rollup2.src()` (standalone, non-pipe mode), there is no source
Vinyl file to fall back to, so `output.file` stays required there.

## Cache Behavior

`gulp-rollup-2` leverages Rollup's native caching mechanism with enhanced reliability:

### How It Works

- **Cache keys** are generated using `object-hash` for stability
- **Incremental builds** reuse cached AST when input configuration matches
- **Automatic invalidation** when configuration changes

### Example

```js
const { watch } = require('gulp');

function bundle() {
  return gulp
    .src('src/**/*.js')
    .pipe(
      rollup2.rollup({
        input: 'src/index.js',
        cache: true, // Enable Rollup's cache
        plugins: [resolve(), commonjs()],
        output: {
          file: 'bundle.js',
          format: 'umd',
          name: 'MyLib',
        },
      })
    )
    .pipe(gulp.dest('dist'));
}

// Watch mode benefits from caching
watch('src/**/*.js', bundle);
```

### v2.1.0 Cache Improvements

- ✅ **Stable cache keys** using `object-hash` algorithm
- ✅ **Duplicate detection** prevents conflicting configurations
- ✅ **Memory management** with automatic `bundle.close()`

### Disabling Cache

If your Rollup plugins have dynamic behavior:

```js
rollup2.rollup({
  cache: false,  // Disable caching
  plugins: [...]
})
```

**Note:** Some Rollup plugins may behave differently with the same `name` but different configurations. This edge case is intentionally kept simple.

## Sourcemaps

Sourcemap handling is production-grade:

- ✅ **Rollup-first:** If Rollup generates `output.map`, it's used directly
- ✅ **Fallback support:** If no Rollup map, upstream Gulp sourcemaps are preserved
- ✅ **Path correction:** Source paths are automatically resolved

This ensures seamless integration with:

- `gulp-sourcemaps`
- Transpiler chains (Babel, TypeScript, etc.)
- Multi-stage build pipelines

### Example with gulp-sourcemaps

```js
const sourcemaps = require('gulp-sourcemaps');

gulp.task('bundle', () =>
  gulp
    .src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      rollup2.rollup({
        input: 'src/index.js',
        output: {
          file: 'bundle.js',
          format: 'umd',
          name: 'App',
          sourcemap: true, // Rollup generates sourcemap
        },
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
);
```

## src() Mode (Advanced)

For builds outside the Gulp graph:

- **No `gulp.src()`** required
- **Async factory** pattern
- **Ideal for:** Multi-entry scenarios, CI/CD pipelines

```js
const rollup2 = require('gulp-rollup-2');
const { dest } = require('gulp');

(async () => {
  const stream = await rollup2.src({
    input: 'src/index.js',
    plugins: [resolve(), commonjs()],
    output: {
      file: 'bundle.js',
      format: 'es',
      sourcemap: true,
    },
  });

  stream.pipe(dest('dist'));
})();
```

## Error Detection (v2.1.0)

### Duplicate Input Configurations

Prevents accidental configuration conflicts. Comparison is based on `input`,
`external`, `treeshake` and any other plain input options — **not** `plugins`.
Plugin factories (e.g. `resolve()`) return a fresh instance on every call, so
comparing them directly would never flag a real duplicate; excluding them
keeps the check meaningful:

```js
// ❌ This will throw an error:
rollup2.rollup([
  {
    input: 'src/app.js',
    plugins: [resolve()],
    output: { file: 'bundle1.js', format: 'umd' },
  },
  {
    input: 'src/app.js',
    plugins: [resolve()], // Different instance, but plugins aren't compared
    output: { file: 'bundle2.js', format: 'umd' },
  },
]);
// Error: gulp-rollup-2: Duplicate input configurations
```

### Duplicate Output Files

Prevents multiple outputs targeting the same file:

```js
// ❌ This will throw an error:
rollup2.rollup({
  input: 'src/app.js',
  output: [
    { file: 'bundle.js', format: 'umd' },
    { file: 'bundle.js', format: 'es' }, // Same file!
  ],
});
// Error: gulp-rollup-2: Multiple outputs target the same file
```

## Unsupported

The following are **intentionally not supported**:

- ❌ **Streaming input** (`file.isStream()`)
- ❌ **Rollup v1 / v2**

These constraints are deliberate design decisions for reliability and predictability.

## Philosophy

This plugin:

- ✅ **No magic** - Transparent Rollup integration
- ✅ **Doesn't hide Rollup behavior** - Native API exposed
- ✅ **Deterministic builds** - Predictable, reproducible outputs
- ✅ **Production-ready** - Battle-tested in CI/CD environments

If your goals are:

- Modern Rollup integration
- Robust build outputs
- Production CI reliability

Then `gulp-rollup-2` is the right tool.

## API Reference

### rollup2.rollup(config)

Use inside a Gulp pipeline.

**Parameters:**

- `config` (Object | Array | String) - Rollup configuration
  - Object: Single Rollup config
  - Array: Multiple Rollup configs
  - String: Format shorthand (e.g., `'umd'`, `'es'`)

**Returns:** Transform stream

### rollup2.src(config)

Standalone bundle factory (async).

**Parameters:**

- `config` (Object | Array) - Rollup configuration
- `config.input` (String) - **Required** - Entry point

**Returns:** Promise\<Stream\>

## Changelog

### v2.2.0 (2026)

#### 🐛 Bug Fixes

- **Fixed #2:** `output.file` is now optional in pipe mode (`rollup2.rollup()`).
  Streams with multiple source files no longer overwrite each other under one
  hardcoded filename — each output now falls back to its source file's name.
  Thanks to [@OPMikeBit](https://github.com/OPMikeBit) for the report and the
  proposed fix.
- **Fixed duplicate-input detection:** the check now excludes `plugins` from
  the comparison. Previously, freshly-instantiated plugins (the common
  `plugins: [resolve()]` pattern) made two functionally identical configs
  compare as different, so genuine duplicates were never caught.
- **Fixed cross-file state leak:** in a multi-file pipe stream, the
  auto-derived UMD/IIFE `name` and the new filename fallback are now computed
  per file instead of being cached from the first file and reused for every
  subsequent one.

#### ✅ Testing

- Added a real unit/integration test suite (`node --test`) covering
  validation errors, duplicate detection, the pipe-mode filename fallback,
  and multi-file streams. `npm test` now runs lint **and** these tests, and a
  `prepublishOnly` hook prevents `npm publish` from running if either fails.

### v2.1.0 (2025)

#### ✨ New Features

- **Production-grade caching:** Improved cache system using `object-hash` for reliable cache key generation
- **Duplicate detection:** Automatic detection and prevention of duplicate input configurations
- **Duplicate output detection:** Prevents multiple outputs targeting the same file
- **Memory leak prevention:** Automatic `bundle.close()` after each build

#### 🐛 Bug Fixes

- **Fixed sourcemap paths:** Corrected sourcemap path resolution for accurate debugging
- **Better error messages:** More descriptive errors for configuration issues
- **Deep equality checks:** Proper configuration comparison using deep equality

#### 🔧 Internal Improvements

- Modern async/await patterns throughout
- Replaced custom equality with robust deep equality checking
- Better memory management with Map-based caching
- Added `object-hash` dependency for stable cache keys

### v2.0.2 (2025)

- Updated config files to latest standards
- Improved development workflow
- Better code quality tools
- Updated SEO-friendly package description

### v2.0.0 (2025)

- Updated to Rollup 4.x
- Node.js 18+ support
- Modernized dependencies
- Added GitHub Actions CI
- Improved code quality with Prettier & ESLint

## Migration Guide

### From v2.0.x to v2.1.0

**No breaking changes!** v2.1.0 is fully backward compatible.

**What's New:**

- Automatic duplicate detection (will catch configuration errors early)
- Improved caching reliability
- Better memory management
- Fixed sourcemap paths

**Action Required:**

- ✅ None! Just upgrade: `npm install gulp-rollup-2@latest`
- ⚠️ If you have duplicate configurations, they will now throw errors (this is intentional!)

## Troubleshooting

### Cache Issues

If you experience unexpected caching behavior:

```js
rollup2.rollup({
  input: 'src/app.js',
  cache: false,  // Disable cache temporarily
  plugins: [...],
  output: { file: 'bundle.js', format: 'umd' }
})
```

### Duplicate Configuration Errors

Check that:

1. Input configurations are unique (different `input`, `external`, or `treeshake` options)
2. Output files have unique paths

### Memory Issues

v2.1.0 automatically calls `bundle.close()` to prevent memory leaks. If you still experience issues, please [open an issue](https://github.com/orcunsaltik/gulp-rollup-2/issues).

### Multiple Files Overwriting Each Other

If files bundled from a `gulp.src()` stream with several matches are
overwriting one another under the same name, remove `output.file` from your
config — see [Multiple Source Files (Pipe Mode)](#multiple-source-files-pipe-mode).

## Testing

```bash
npm test        # lint + full test suite
npm run test:unit  # test suite only
```

`npm publish` runs `npm test` automatically via `prepublishOnly` and will
refuse to publish if lint or any test fails.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup,
coding conventions, and the pull request process.

## Security

See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## License

MIT © [Orçun Saltık](https://github.com/orcunsaltik)

## Author

**Orçun Saltık**

- GitHub: [@orcunsaltik](https://github.com/orcunsaltik)
- Email: saltikorcun@gmail.com

---

**Made with care for the Gulp + Rollup community** 🚀
