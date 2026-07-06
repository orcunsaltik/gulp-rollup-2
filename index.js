/**
 * gulp-rollup-2 — Production-grade, Rollup 4+ compatible
 * Cache-safe + sourcemap path fix integrated
 */
const path = require('path');
const Vinyl = require('vinyl');
const applySourceMap = require('vinyl-sourcemaps-apply');
const through2 = require('through2');
const rollup = require('rollup');
const hash = require('object-hash');

const PLUGIN_NAME = 'gulp-rollup-2';
const CACHE = new Map();

// --- helpers ---
const isArray = Array.isArray;
const uniq = (arr) => [...new Set(arr)];

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;

  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;

  for (const key of keysA) {
    if (!Object.hasOwn(b, key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
};

const validFormats = ['es', 'amd', 'cjs', 'iife', 'umd', 'system'];
const isValidFormat = (fmt) => validFormats.includes(fmt);

const sanitizeConfig = (configs, requireInput = false) => {
  if (!configs) throw new Error(`${PLUGIN_NAME}: Missing Rollup config`);

  if (typeof configs === 'string') {
    configs = [{ output: { format: configs } }];
  }
  if (!isArray(configs)) configs = [configs];

  const result = [];

  for (const cfg of configs) {
    if (requireInput && !cfg.input) {
      throw new Error(`${PLUGIN_NAME}: 'input' option is required in src() mode`);
    }
    if (!cfg.output) throw new Error(`${PLUGIN_NAME}: 'output' is required`);

    const inputOpts = { ...cfg };
    const outputs = isArray(cfg.output) ? cfg.output : [cfg.output];
    delete inputOpts.output;

    for (const out of outputs) {
      if (!out.format || !isValidFormat(out.format)) {
        throw new Error(`${PLUGIN_NAME}: Output must have valid 'format'`);
      }
      if (requireInput && !out.file) {
        throw new Error(`${PLUGIN_NAME}: Output must have 'file' in src() mode`);
      }
    }

    result.push({ input: inputOpts, outputs });
  }

  // dedupe inputs (plugins are intentionally excluded: factories like
  // resolve() create a brand new instance on every call, so two functionally
  // identical configs would never be reference/shape-equal on their plugins,
  // and this check would never fire for the realistic case it's meant to catch)
  for (let i = 0; i < result.length; i++) {
    const { plugins: _pluginsA, ...comparableA } = result[i].input;
    for (let j = i + 1; j < result.length; j++) {
      const { plugins: _pluginsB, ...comparableB } = result[j].input;
      if (deepEqual(comparableA, comparableB)) {
        throw new Error(`${PLUGIN_NAME}: Duplicate input configurations`);
      }
    }
  }

  // dedupe explicit output files. Outputs without a 'file' fall back to the
  // source file's basename in pipe mode (see rollup2.rollup()), so only the
  // explicitly-set ones can be compared here.
  const allFiles = result.flatMap((r) => r.outputs.map((o) => o.file));
  const explicitFiles = allFiles.filter(Boolean);
  if (explicitFiles.length !== uniq(explicitFiles).length) {
    throw new Error(`${PLUGIN_NAME}: Multiple outputs target the same file`);
  }
  const implicitCount = allFiles.length - explicitFiles.length;
  if (implicitCount > 1) {
    throw new Error(
      `${PLUGIN_NAME}: Multiple outputs are missing 'file'; they would all overwrite the same filename. Specify 'file' explicitly for each.`
    );
  }

  return result;
};

// --- cache key (plugins intentionally excluded) ---
const createCacheKey = (input, outputs) =>
  hash({
    input: input.input,
    external: input.external,
    treeshake: input.treeshake,
    outputs: outputs.map((o) => o.file),
  });

// --- inside (gulp src pipe) ---
const inside = (rollupConfigs) => {
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
            input: input.input ? path.resolve(cwd, input.input) : file.path,
          };

          const cacheKey = createCacheKey(rollupInput, outputs);
          rollupInput.cache = CACHE.get(cacheKey) ?? false;

          const bundle = await rollup.rollup(rollupInput);
          CACHE.set(cacheKey, bundle.cache);

          return { bundle, outputs };
        })
      );

      for (const { bundle, outputs } of bundles) {
        for (const baseOutputOpts of outputs) {
          // Clone per file: `outputs` comes from sanitizeConfig() and is
          // created once for the whole stream, then reused for every file
          // that passes through. Mutating the shared object directly would
          // leak the first file's derived name/file into every subsequent
          // file in a multi-file stream.
          const outputOpts = { ...baseOutputOpts };

          if (['umd', 'iife'].includes(outputOpts.format) && !outputOpts.name) {
            outputOpts.name = path.basename(inputPath, path.extname(inputPath));
          }
          if (
            ['umd', 'amd'].includes(outputOpts.format) &&
            (!outputOpts.amd || !outputOpts.amd.id)
          ) {
            outputOpts.amd = { ...(outputOpts.amd || {}), id: outputOpts.name };
          }
          if (!outputOpts.file) {
            // No explicit output file: keep the original filename instead of
            // colliding all inputs onto one hardcoded name (see issue #2).
            outputOpts.file = file.basename;
          }

          const { output } = await bundle.generate(outputOpts);

          for (const out of output) {
            if (out.type === 'asset') continue;

            const code = out.code ?? out.source;
            if (!code) continue;

            const outFile = new Vinyl({
              cwd,
              base: cwd,
              path: path.resolve(cwd, outputOpts.file),
              contents: Buffer.from(code),
            });

            if (out.map) {
              applySourceMap(outFile, out.map);
            } else if (file.sourceMap) {
              const sm = JSON.parse(JSON.stringify(file.sourceMap));
              sm.file = path.basename(outputOpts.file);
              sm.sources = sm.sources.map((s) =>
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

// --- outside (no njfs.root, caller controls cwd) ---
const outside = async (rollupConfigs) => {
  const configs = sanitizeConfig(rollupConfigs, true);
  const stream = through2.obj();
  const cwd = process.cwd();

  (async () => {
    try {
      const bundles = await Promise.all(
        configs.map(async ({ input, outputs }) => {
          const rollupInput = {
            ...input,
            input: path.resolve(cwd, input.input),
          };

          const cacheKey = createCacheKey(rollupInput, outputs);
          rollupInput.cache = CACHE.get(cacheKey) ?? false;

          const bundle = await rollup.rollup(rollupInput);
          CACHE.set(cacheKey, bundle.cache);

          return { bundle, outputs };
        })
      );

      for (const { bundle, outputs } of bundles) {
        for (const baseOutputOpts of outputs) {
          const outputOpts = { ...baseOutputOpts };

          if (['umd', 'iife'].includes(outputOpts.format) && !outputOpts.name) {
            outputOpts.name = path.basename(outputOpts.file, path.extname(outputOpts.file));
          }
          if (
            ['umd', 'amd'].includes(outputOpts.format) &&
            (!outputOpts.amd || !outputOpts.amd.id)
          ) {
            outputOpts.amd = { ...(outputOpts.amd || {}), id: outputOpts.name };
          }

          const { output } = await bundle.generate(outputOpts);

          for (const out of output) {
            if (out.type === 'asset') continue;

            const code = out.code ?? out.source;
            if (!code) continue;

            const outFile = new Vinyl({
              cwd,
              base: path.dirname(path.resolve(cwd, outputOpts.file)),
              path: path.resolve(cwd, outputOpts.file),
              contents: Buffer.from(code),
            });

            if (out.map) applySourceMap(outFile, out.map);
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
  src: outside,
};
