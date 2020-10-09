# Gulp Rollup 2

[![Build Status](https://travis-ci.com/orcunsaltik/njfs.svg?branch=master)](https://travis-ci.com/orcunsaltik/njfs)
[![Dependency Status](https://david-dm.org/orcunsaltik/njfs.svg)](https://david-dm.org/orcunsaltik/njfs)
[![devDependencies Status](https://david-dm.org/orcunsaltik/njfs/dev-status.svg)](https://david-dm.org/orcunsaltik/njfs?type=dev)
[![Maintainability](https://api.codeclimate.com/v1/badges/035ff3499e767eb6b552/maintainability)](https://codeclimate.com/github/orcunsaltik/njfs/maintainability)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/orcunsaltik/njfs)
![npm](https://img.shields.io/npm/dt/njfs)
[![NPM Version](https://badge.fury.io/js/njfs.svg?style=flat)](https://npmjs.org/package/njfs)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/orcunsaltik/njfs/issues)

A [Gulp](https://www.npmjs.com/package/gulp) plugin for [Rollup](https://www.npmjs.com/package/rollup) Javascript Module Bundler.

You can use before or after any gulp plugins with Rollup Api.
Any map created by a gulp plugin like gulp-sourcemaps etc.
will be overriden if the sourcemap option of the rollup config is set to true; 

## Install

``` bash
npm install --save-dev gulp-rollup-2
```

## Usage
### Inside of the gulp pipe: (between gulp.src & gulp.dest)

``` js
const gulp = require('gulp');
const gru2 = require('gulp-rollup-2');

gulp.task('bundle', () => 
  gulp.src('./src/**/*.js')
    .pipe(gru2.rollup({
           input: 'src/app.js',
        external: ['window'],
         plugins: [plugin1(), plugin2()],
           cache: true,
          output: [
            {
                   file: 'example.js',
                   name: 'example', 
                 format: 'umd',
                globals: {window: 'window'}
            },
            {
                   file: 'example.esm.bundle.js',
                 format: 'es',
                globals: {window: 'window'}
            },
        ]}))
    .pipe(gulp.dest('./dist'));
);
```
### At the beginning... File path in the input option replaces the role of gulp src.

``` js
const gulp = require('gulp');
const gru2 = require('gulp-rollup-2');

gulp.task('bundle', async () =>
  (await gru2.src(...opts))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
);
```

## Troubleshooting

When you encounter a problem, please open an issue. I would be glad to help you to find a solution if possible.

## Author

Github: [@orcunsaltik](https://github.com/orcunsaltik)


## License

See the [LICENSE](LICENSE) file for license rights and limitations (MIT).