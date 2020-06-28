# gulp-rollup-2

A [Gulp](https://www.npmjs.com/package/gulp) plugin for [Rollup](https://www.npmjs.com/package/rollup) Javascript Module Bundler.
You can use before or after any gulp plugins with Rollup Api.
If sourcemap option of Rollup config is true; any map created by a plugin like gulp-sourcemaps
will be overriden.

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
