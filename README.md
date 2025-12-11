# gulp-rollup-2

[![CI](https://github.com/orcunsaltik/gulp-rollup-2/actions/workflows/ci.yml/badge.svg)](https://github.com/orcunsaltik/gulp-rollup-2/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/gulp-rollup-2.svg)](https://www.npmjs.com/package/gulp-rollup-2)
[![npm downloads](https://img.shields.io/npm/dt/gulp-rollup-2.svg)](https://www.npmjs.com/package/gulp-rollup-2)
[![node version](https://img.shields.io/node/v/gulp-rollup-2.svg)](https://www.npmjs.com/package/gulp-rollup-2)
[![license](https://img.shields.io/npm/l/gulp-rollup-2.svg)](https://github.com/orcunsaltik/gulp-rollup-2/blob/master/LICENSE)

> Modern Gulp plugin for Rollup 4.x - Bundle JavaScript modules with tree-shaking, multiple output formats (UMD, ESM, CJS, IIFE), and full Rollup API support. Actively maintained.

A powerful Gulp plugin for Rollup that allows you to use Rollup's module bundler before or after any gulp plugins with full Rollup API support.

## Features

- ✅ Supports the latest Rollup version (4.x)
- ✅ Multiple output formats (UMD, AMD, ES, CJS, IIFE, System)
- ✅ Works with Gulp 4.x
- ✅ Source map support
- ✅ Cache support for faster rebuilds
- ✅ Modern Node.js support (18+)

## Installation

```bash
npm install --save-dev gulp-rollup-2
```

## Usage

### Method A: Inside gulp.pipe()

Use between `gulp.src()` and `gulp.dest()`:

```javascript
const { src, dest } = require('gulp');
const gru2 = require('gulp-rollup-2');

function bundle() {
  return src('./src/**/*.js')
    .pipe(
      gru2.rollup({
        input: 'src/app.js',
        external: ['window'],
        plugins: [plugin1(), plugin2()],
        cache: true,
        output: [
          {
            file: 'example.js',
            name: 'example',
            format: 'umd',
            globals: { window: 'window' },
          },
          {
            file: 'example.esm.bundle.js',
            format: 'es',
            globals: { window: 'window' },
          },
        ],
      })
    )
    .pipe(dest('./dist'));
}

exports.bundle = bundle;
```

### Method B: Standalone with gru2.src()

When gulp-rollup-2 comes first in the pipeline:

```javascript
const { dest } = require('gulp');
const gru2 = require('gulp-rollup-2');
const sourcemaps = require('gulp-sourcemaps');

async function bundle() {
  return (
    await gru2.src({
      input: 'src/app.js',
      plugins: [plugin1()],
      output: {
        file: 'bundle.js',
        format: 'umd',
        name: 'MyBundle',
      },
    })
  )
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist'));
}

exports.bundle = bundle;
```

## API

### gru2.rollup(options)

Use inside a gulp pipeline. The `options` parameter accepts:

- A single Rollup configuration object
- An array of Rollup configuration objects
- A format string (e.g., `'umd'`, `'es'`)

### gru2.src(options)

Use as the first step in a gulp pipeline. Requires the `input` option to be specified.

## Rollup Configuration

Supports all standard Rollup options:

- `input` - Entry point file
- `external` - External module IDs
- `plugins` - Array of Rollup plugins
- `cache` - Enable caching for faster rebuilds
- `output` - Output configuration (can be an array for multiple outputs)
  - `file` - Output file name
  - `format` - Module format (umd, amd, es, cjs, iife, system)
  - `name` - Global variable name (for UMD/IIFE)
  - `globals` - External module mappings

See [Rollup documentation](https://rollupjs.org/configuration-options/) for complete options.

## Multiple Outputs

You can generate multiple bundles from a single source:

```javascript
gru2.rollup({
  input: 'src/main.js',
  output: [
    { file: 'dist/bundle.umd.js', format: 'umd', name: 'MyLib' },
    { file: 'dist/bundle.esm.js', format: 'es' },
    { file: 'dist/bundle.cjs.js', format: 'cjs' },
  ],
});
```

## Source Maps

Source maps from previous gulp plugins (like gulp-sourcemaps) will be preserved unless you enable Rollup's sourcemap option:

```javascript
gru2.rollup({
  input: 'src/app.js',
  output: {
    file: 'bundle.js',
    format: 'umd',
    sourcemap: true, // This will override any existing source maps
  },
});
```

## Requirements

- Node.js >= 18.0.0
- Gulp >= 4.0.0
- Rollup >= 4.0.0

## Changelog

### v2.0.2 (2025)

- 🚀 Updated config files to latest standards
- 🚀 Improved development workflow
- 🚀 Better code quality tools
- 🚀 Updated SEO-friendly package description

### v2.0.1 (2024)

- Dependency updates

### v2.0.0 (2024)

- 🚀 Updated to Rollup 4.x
- 🚀 Node.js 18+ support
- 🚀 Modernized dependencies
- 🚀 Added GitHub Actions CI
- 🚀 Improved code quality with Prettier & ESLint

### v1.3.1 (2021)

- Previous stable release

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

When you encounter a problem, please [open an issue](https://github.com/orcunsaltik/gulp-rollup-2/issues). I would be glad to help you find a solution.

## Author

**Orçun Saltık**

- GitHub: [@orcunsaltik](https://github.com/orcunsaltik)
- Email: saltikorcun@gmail.com

## License

[MIT](LICENSE) © Orçun Saltık
