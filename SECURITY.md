# Security Policy

## Supported Versions

Only the latest published `2.x` release of `gulp-rollup-2` is actively
maintained and receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you find a security vulnerability in `gulp-rollup-2`, please **do not**
open a public GitHub issue.

Instead, report it privately by emailing **saltikorcun@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce it (a minimal Gulp/Rollup config is ideal)
- The affected version(s)

You should expect an initial response within a few days. Once a fix is
available, a new patch/minor version will be published to npm and the
reporter will be credited in the changelog (unless anonymity is requested).

## Scope

`gulp-rollup-2` is a build-time Gulp plugin. Relevant security concerns
include (but aren't limited to):

- Path traversal or arbitrary file write via crafted `output.file` / `input`
  values
- Prototype pollution via Rollup config objects
- Issues in how sourcemaps are merged or written

Vulnerabilities in upstream dependencies (`rollup`, `vinyl`, etc.) should
generally be reported to those projects directly, but flagging them here is
still welcome if they affect how this plugin uses them.
