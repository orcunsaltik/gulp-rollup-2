'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const rollup2 = require('../index.js');
const { makeVinylFile, collectStream } = require('./helpers');

const FIXTURES = path.join(__dirname, 'fixtures');

function fixtureFile(name) {
  return makeVinylFile({
    cwd: FIXTURES,
    base: FIXTURES,
    path: path.join(FIXTURES, name),
    // Rollup reads the module graph from disk via `input`, so these
    // in-memory contents are never actually bundled; they only stand in
    // for whatever upstream gulp step produced this vinyl file.
    contents: '/* placeholder */',
  });
}

test('rollup2.rollup(): explicit output.file is honored', async () => {
  const stream = rollup2.rollup({ output: { file: 'out.js', format: 'es' } });
  stream.end(fixtureFile('foo.js'));

  const files = await collectStream(stream);
  assert.equal(files.length, 1);
  assert.equal(files[0].basename, 'out.js');
  assert.match(files[0].contents.toString(), /foo/);
});

test('rollup2.rollup(): omitted output.file falls back to the source filename (#2)', async () => {
  const stream = rollup2.rollup({ output: { format: 'es' } });
  stream.end(fixtureFile('foo.js'));

  const files = await collectStream(stream);
  assert.equal(files.length, 1);
  assert.equal(files[0].basename, 'foo.js');
});

test('rollup2.rollup(): each file in a multi-file stream keeps its own filename, not the first file\'s', async () => {
  const stream = rollup2.rollup({ output: { format: 'es' } });
  stream.write(fixtureFile('foo.js'));
  stream.end(fixtureFile('bar.js'));

  const files = await collectStream(stream);
  const names = files.map((f) => f.basename).sort();
  assert.deepEqual(names, ['bar.js', 'foo.js']);
});

test('rollup2.rollup(): each file in a multi-file stream gets its own derived UMD name, not a name cached from the first file', async () => {
  // Regression test: outputOpts used to be mutated in place and shared
  // across every file in the stream, so the auto-derived `name` (and `file`)
  // from the first file used to leak into every subsequent file.
  const stream = rollup2.rollup({ output: { file: 'bundle.js', format: 'umd' } });
  stream.write(fixtureFile('foo.js'));
  stream.end(fixtureFile('bar.js'));

  const files = await collectStream(stream);
  assert.equal(files.length, 2);

  const [fooOut, barOut] = files
    .slice()
    .sort((a, b) => (a.contents.toString().includes('foo') ? -1 : 1));

  assert.match(fooOut.contents.toString(), /global\.foo/);
  assert.match(barOut.contents.toString(), /global\.bar/);
});

test('rollup2.rollup(): streaming input is rejected, not silently ignored', async () => {
  const through2 = require('through2');
  const Vinyl = require('vinyl');

  const stream = rollup2.rollup({ output: { format: 'es' } });
  const streamingFile = new Vinyl({
    cwd: FIXTURES,
    base: FIXTURES,
    path: path.join(FIXTURES, 'foo.js'),
    contents: through2(),
  });

  const errorPromise = new Promise((resolve) => stream.on('error', resolve));
  stream.write(streamingFile);
  const err = await errorPromise;
  assert.match(err.message, /Streaming not supported/);
});

test('rollup2.src(): produces a bundle for the given input/output', async () => {
  const stream = await rollup2.src({
    input: path.join(FIXTURES, 'foo.js'),
    output: { file: path.join(FIXTURES, 'out-src.js'), format: 'es' },
  });

  const files = await collectStream(stream);
  assert.equal(files.length, 1);
  assert.equal(files[0].basename, 'out-src.js');
  assert.match(files[0].contents.toString(), /foo/);
});
