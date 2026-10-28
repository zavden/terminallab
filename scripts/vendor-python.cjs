/* Rebuild the local, file://-compatible runtime from an extracted official npm package. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/vendor-python.cjs /path/to/extracted/package');
const read = name => fs.readFileSync(path.join(source, name));
const version = JSON.parse(read('package.json')).version;
if (version !== '0.28.3') throw new Error('Review and test the integration before changing Pyodide versions.');
const bundle = {version, runtime:read('pyodide.js').toString()+'\n'+read('pyodide.asm.js').toString(),
  wasm:read('pyodide.asm.wasm').toString('base64'), stdlib:read('python_stdlib.zip').toString('base64'), lock:JSON.parse(read('pyodide-lock.json'))};
const target = path.join(__dirname, '../vendor/pyodide');
fs.mkdirSync(target, {recursive:true});
fs.writeFileSync(path.join(target,'payload.js'), '/* Pyodide 0.28.3; see README.md and LICENSE. Generated from the official npm distribution. */\nwindow.TerminalPythonPayload = '+JSON.stringify(bundle)+';\n');
const hashes = Object.fromEntries(['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'].map(name => [name, crypto.createHash('sha256').update(read(name)).digest('hex')]));
fs.writeFileSync(path.join(target,'checksums.json'), JSON.stringify(hashes,null,2)+'\n');
