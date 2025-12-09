/**
 * gulp-rollup-2 — Modern, correct, and robust
 * Supports:
 * - Multiple inputs → multiple outputs
 * - Full Vinyl + sourcemap support
 * - Proper cache handling
 * - Gulp stream compliance
 * - Rollup 2+ / 3+ / 4+ compatible
 */

const path = require('path');
const Vinyl = require('vinyl');
const applySourceMap = require('vinyl-sourcemaps-apply');
const through2 = require('through2');
const rollup = require('rollup');
const hash = require('object-hash');
const { root } = require('njfs');

const PLUGIN_NAME = 'gulp-rollup-2';
const CACHE = new Map(); // input hash → rollup cache

// --- Helpers ---
const isArray = Array.isArray;
const uniq = arr => [...new Set(arr)];

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.hasOwn(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
};

const validateFormat = fmt => ['es', 'amd', 'cjs', 'iife', 'umd', 'system'].includes(fmt);

const sanitizeConfig = (configs, requireInput = false) => {
  if (!configs) throw new Error(`${PLUGIN_NAME}: Missing Rollup config`);
  if (typeof configs === 'string') {
    configs = [{ output: { format: configs } }];
  }
  if (!isArray(configs)) configs = [configs];

  const result = [];

  for (const cfg of configs) {
    if (requireInput && !cfg.input) {
      throw new Error(`${PLUGIN_NAME}: 'input' is required`);
    }
    if (!cfg.output) {
      throw new Error(`${PLUGIN_NAME}: 'output' is required`);
    }

    const inputOpts = { ...cfg };
    const outputs = isArray(cfg.output) ? cfg.output : [cfg.output];
    delete inputOpts.output;

    for (const out of outputs) {
      if (!out.file || !out.format || !validateFormat(out.format)) {
        throw new Error(`${PLUGIN_NAME}: Output must have 'file' and valid 'format'`);
      }
    }

    result.push({ input: inputOpts, outputs });
  }

  // Dedupe inputs
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (deepEqual(result[i].input, result[j].input)) {
        throw new Error(`${PLUGIN_NAME}: Duplicate input options`);
      }
    }
  }

  // Dedupe output files
  const files = result.flatMap(r => r.outputs.map(o => o.file));
  if (files.length !== uniq(files).length) {
    throw new Error(`${PLUGIN_NAME}: Multiple outputs write to the same file`);
  }

  return result;
};

// --- Inside Stream (Transform) ---
const inside = rollupConfigs => {
  const configs = sanitizeConfig(rollupConfigs);

  return through2.obj(async function (file, enc, cb) {
    if (file.isStream()) {
      return cb(new Error(`${PLUGIN_NAME}: Streaming not supported`));
    }

    const cwd = file.cwd;
    const inputPath = path.relative(cwd, file.path);

    try {
      const bundles = await Promise.all(
        configs.map(async ({ input, outputs }) => {
          const rollupInput = {
            ...input,
            input: input.input ? path.relative(cwd, input.input) : inputPath
          };

          const cacheKey = hash(rollupInput);
          rollupInput.cache = CACHE.get(cacheKey) || false;

          const bundle = await rollup.rollup(rollupInput);
          CACHE.set(cacheKey, bundle.cache);

          return { bundle, outputs, inputPath: rollupInput.input };
        })
      );

      for (const { bundle, outputs, inputPath } of bundles) {
        for (const outputOpts of outputs) {
          // Auto-fill name for UMD/IIFE
          if ((outputOpts.format === 'umd' || outputOpts.format === 'iife') && !outputOpts.name) {
            outputOpts.name = path.basename(inputPath, path.extname(inputPath));
          }
          if ((outputOpts.format === 'umd' || outputOpts.format === 'amd') && !outputOpts.amd?.id) {
            outputOpts.amd = { ...(outputOpts.amd || {}), id: outputOpts.name };
          }

          const result = await bundle.generate(outputOpts);
          for (const output of result.output) {
            const { code, map } = output;

            const outFile = new Vinyl({
              cwd,
              base: path.dirname(path.join(cwd, inputPath)),
              path: path.resolve(cwd, outputOpts.file),
              contents: Buffer.from(code)
            });

            if (map) {
              applySourceMap(outFile, map);
            } else if (file.sourceMap) {
              // Fallback to input sourcemap
              const sm = { ...file.sourceMap };
              sm.file = path.basename(outputOpts.file);
              sm.sources = sm.sources.map(s =>
                path.relative(outFile.base, path.resolve(file.base, s))
              );
              applySourceMap(outFile, sm);
            }

            this.push(outFile);
          }
        }
        await bundle.close();
      }

      cb();
    } catch (err) {
      cb(err);
    }
  });
};

// --- Outside Stream (Readable) ---
const outside = async rollupConfigs => {
  const configs = sanitizeConfig(rollupConfigs, true);
  const cwd = root();
  const stream = through2.obj();

  (async () => {
    try {
      const bundles = await Promise.all(
        configs.map(async ({ input, outputs }) => {
          const rollupInput = {
            ...input,
            input: path.relative(cwd, input.input)
          };

          const cacheKey = hash(rollupInput);
          rollupInput.cache = CACHE.get(cacheKey) || false;

          const bundle = await rollup.rollup(rollupInput);
          CACHE.set(cacheKey, bundle.cache);

          return { bundle, outputs, inputPath: rollupInput.input };
        })
      );

      for (const { bundle, outputs, inputPath } of bundles) {
        for (const outputOpts of outputs) {
          if ((outputOpts.format === 'umd' || outputOpts.format === 'iife') && !outputOpts.name) {
            outputOpts.name = path.basename(inputPath, path.extname(inputPath));
          }
          if ((outputOpts.format === 'umd' || outputOpts.format === 'amd') && !outputOpts.amd?.id) {
            outputOpts.amd = { ...(outputOpts.amd || {}), id: outputOpts.name };
          }

          const result = await bundle.generate(outputOpts);
          for (const output of result.output) {
            const { code, map } = output;

            const outFile = new Vinyl({
              cwd,
              base: path.dirname(path.join(cwd, inputPath)),
              path: path.resolve(cwd, outputOpts.file),
              contents: Buffer.from(code)
            });

            if (map) applySourceMap(outFile, map);
            stream.push(outFile);
          }
        }
        await bundle.close();
      }

      stream.push(null);
    } catch (err) {
      stream.emit('error', err);
    }
  })();

  return stream;
};

module.exports = {
  rollup: inside,
  src: outside
};
