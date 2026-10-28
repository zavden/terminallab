# Vendored Pyodide 0.28.3

`payload.js` contains the original classic loader, Emscripten loader, WebAssembly binary, standard-library ZIP and package lock from the official [Pyodide npm distribution](https://registry.npmjs.org/pyodide/-/pyodide-0.28.3.tgz). The binary resources are base64 encoded so the app also works from `file://` without a fetch to disk. This approximately 16 MB payload is loaded only on the first Python run.

Version 0.28.3 is pinned deliberately for the classic-script loader. Upgrades require testing the loader, CSP, worker, filesystem and direct-file behavior. The app does not install packages from the lockfile. No CDN is used at runtime.

The upstream [LICENSE](LICENSE) contains the Pyodide and third-party license notices. The standard library archive also retains its upstream contents. `checksums.json` records SHA-256 digests of the five original inputs.

To reproduce: download and extract the above official tarball, then run `node scripts/vendor-python.cjs /absolute/path/to/extracted/package` from the project. The generator uses only Node built-ins. Retain the LICENSE and this README when distributing the app.
