'use strict';

const Vinyl = require('vinyl');

/** Build an in-memory Vinyl file, the way gulp.src() would produce one. */
function makeVinylFile({ cwd, base, path: filePath, contents }) {
  return new Vinyl({
    cwd,
    base,
    path: filePath,
    contents: Buffer.from(contents),
  });
}

/** Drain a through2/object stream into an array, rejecting on 'error'. */
function collectStream(stream) {
  return new Promise((resolve, reject) => {
    const files = [];
    stream.on('data', (file) => files.push(file));
    stream.on('error', reject);
    stream.on('end', () => resolve(files));
  });
}

module.exports = { makeVinylFile, collectStream };
