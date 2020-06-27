# gulp-rollup-2

## Install

``` bash
npm install --save-dev gulp-rollup-2
```

## Usage
### Inside of the gulp pipe

``` js
const gulp = require('gulp');
const gru2 = require('gulp-rollup-2');

gulp.task('bundle', () => 
  gulp.src('./src/**/*.js')
    .pipe(gru2.rollup({
           input: 'src/app.js',
        external: ['window'],
         plugins: [plugin1(), plugin2()],       
          output: [
            {
                   file: "example.js",
                   name: "example", 
                 format: "umd",
                globals: {window: 'window'}
            },
            {
                   file: "example.esm.bundle.js",
                 format: "esm",
                globals: {window: 'window'}
            },
        ]}))
    .pipe(gulp.dest('./dist'));
);
```
### like gulp-src...

``` js
const gulp = require('gulp');
const gru2 = require('gulp-rollup-2');

gulp.task('bundle', async () =>
  (await gru2.src(...opts))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
);
```
