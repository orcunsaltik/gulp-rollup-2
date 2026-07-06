'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const rollup2 = require('../index.js');

// These cover sanitizeConfig() indirectly, through the two public entry
// points (rollup2.rollup / rollup2.src), since it isn't part of the public API.

test('rollup2.rollup() throws synchronously when config is missing', () => {
  assert.throws(() => rollup2.rollup(), /Missing Rollup config/);
});

test('rollup2.rollup() throws when output is missing', () => {
  assert.throws(() => rollup2.rollup({}), /'output' is required/);
});

test('rollup2.rollup() throws on an invalid format', () => {
  assert.throws(
    () => rollup2.rollup({ output: { format: 'not-a-real-format' } }),
    /valid 'format'/
  );
});

test('rollup2.rollup() does NOT require output.file (see #2)', () => {
  assert.doesNotThrow(() => rollup2.rollup({ output: { format: 'es' } }));
});

test('rollup2.rollup() throws when two outputs share the same explicit file', () => {
  assert.throws(
    () =>
      rollup2.rollup({
        output: [
          { file: 'bundle.js', format: 'es' },
          { file: 'bundle.js', format: 'cjs' },
        ],
      }),
    /Multiple outputs target the same file/
  );
});

test('rollup2.rollup() throws when two+ outputs are all missing file (would collide on the source name)', () => {
  assert.throws(
    () =>
      rollup2.rollup({
        output: [{ format: 'es' }, { format: 'cjs' }],
      }),
    /Multiple outputs are missing 'file'/
  );
});

test('rollup2.rollup() allows one implicit file alongside other explicit ones', () => {
  assert.doesNotThrow(() =>
    rollup2.rollup({
      output: [{ format: 'es' }, { file: 'other.js', format: 'cjs' }],
    })
  );
});

test('rollup2.rollup() detects duplicate input configs even when plugin factories produce fresh instances each call (regression)', () => {
  // Simulates the common `plugins: [resolve()]` pattern: two calls to the
  // same factory produce different function/object references, so a naive
  // deepEqual across the whole input (including plugins) would never match.
  function fakeResolvePlugin() {
    return { name: 'fake-resolve', resolveId() { return null; } };
  }

  assert.throws(
    () =>
      rollup2.rollup([
        { input: 'src/app.js', plugins: [fakeResolvePlugin()], output: { file: 'a.js', format: 'umd' } },
        { input: 'src/app.js', plugins: [fakeResolvePlugin()], output: { file: 'b.js', format: 'umd' } },
      ]),
    /Duplicate input configurations/
  );
});

test('rollup2.rollup() does not flag genuinely different inputs as duplicates', () => {
  function fakeResolvePlugin() {
    return { name: 'fake-resolve', resolveId() { return null; } };
  }

  assert.doesNotThrow(() =>
    rollup2.rollup([
      { input: 'src/app.js', plugins: [fakeResolvePlugin()], output: { file: 'a.js', format: 'umd' } },
      { input: 'src/other.js', plugins: [fakeResolvePlugin()], output: { file: 'b.js', format: 'umd' } },
    ])
  );
});

test('rollup2.src() requires an input path', async () => {
  await assert.rejects(() => rollup2.src({ output: { file: 'out.js', format: 'es' } }), /'input' option is required/);
});

test('rollup2.src() requires output.file', async () => {
  await assert.rejects(
    () => rollup2.src({ input: 'test/fixtures/foo.js', output: { format: 'es' } }),
    /Output must have 'file' in src\(\) mode/
  );
});
