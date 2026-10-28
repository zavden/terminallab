/* Package the static app as one HTML file, with hash-based inline CSP. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const digest = (source) =>
  `'sha256-${crypto.createHash("sha256").update(source, "utf8").digest("base64")}'`;
const css =
  "\n" + read("styles.css").replace(/^@charset\s+"UTF-8";\s*/i, "") + "\n";
const scripts = ["engine.js", "vendor/pyodide/payload.js", "python-runtime.js", "app.js"].map((file) => "\n" + read(file) + "\n");
if (
  scripts.some((source) => /<\/script/i.test(source)) ||
  /<\/style/i.test(css)
) {
  throw new Error(
    "Embedded source contains a closing HTML tag. Escape it before packaging.",
  );
}
let html = read("index.html");
html = html.replace(
  /    <link rel="stylesheet" href="styles\.css"\s*\/>/,
  () => `<style>${css}</style>`,
);
html = html.replace(
  /    <script src="(?:engine|python-runtime|app)\.js" defer><\/script>\n/g,
  "",
);
html = html.replace(
  'href="favicon.svg"',
  `href="data:image/svg+xml;base64,${Buffer.from(read("favicon.svg")).toString("base64")}"`,
);
html = html.replace('class="brand" href="./"', 'class="brand" href="#"');
const csp = `default-src 'none'; script-src blob: 'wasm-unsafe-eval' ${scripts.map(digest).join(" ")}; worker-src blob:; style-src ${digest(css)}; img-src data:; font-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`;
html = html.replace(/content="default-src[^\"]+"/, `content="${csp}"`);
html = html.replace(
  "  </body>",
  () =>
    `<template id="python-license">${read("vendor/pyodide/LICENSE").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</template>\n` +
    scripts.map((source) => `<script>${source}</script>`).join("\n") +
    "\n  </body>",
);
if (
  /\b(?:src|href)="(?:engine\.js|python-runtime\.js|app\.js|styles\.css|favicon\.svg|vendor\/[^"]+)"/.test(html)
)
  throw new Error("An external asset reference remains.");
fs.mkdirSync(path.join(root, "standalone"), { recursive: true });
fs.writeFileSync(path.join(root, "standalone/index.html"), html);
console.log(
  `Created standalone/index.html (${Buffer.byteLength(html).toLocaleString("en-US")} bytes).`,
);
