# Working on Terminal Lab

This file is the entry point for agents modifying this directory. Read it before making changes. Follow the current user's instructions if they change an earlier product decision.

## Current Python edition

Read [docs/PYTHON.md](docs/PYTHON.md) for the runtime/editor contract. The current user authorized a vendored Pyodide dependency and an editable window. This supersedes older read-only/no-runtime-dependency statements. Keep everything local and compatible with file://. The standalone now includes Python and is maintained alongside the modular edition. Regenerate it after production source/runtime changes.

## Read first

- [README.md](README.md): running, packaging, hosting, and supported commands.
- [docs/PRODUCT.md](docs/PRODUCT.md): the intended experience and accepted design decisions.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): engine API, UI state, persistence, and security boundaries.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): extension recipes, verification, packaging details, and troubleshooting.

Read the sections relevant to the change; there is no need to reread every document for a small edit.

## Project boundaries

- This is a static educational simulator. No command runs on the host machine.
- Production has no server, API, account, network requirement, build requirement, or externally downloaded runtime dependency.
- The app must work by opening an HTML file with `file://`, and on static hosting under a repository subpath.
- The maintained source is `index.html`, `styles.css`, `engine.js`, `app.js`, and `favicon.svg`.
- `standalone/index.html` is generated. Do not edit it directly. Keep `standalone/` limited to the single self-contained HTML deliverable.
- Use classic browser scripts. Introducing module imports, fetches, external fonts, or CDNs can break direct-file operation or offline use.
- Keep the UI, reference, messages, and stock file contents in English. The simulated user is `user`.
- Keep user data in the browser. Preserve compatible saved sessions and customized text when adding migrations.

## Preserve the current experience

- Terminal left, explorer right; stacked panels on narrow screens.
- macOS uses a plain inline `user@MacBook-Air ~ %` prompt, monochrome terminal text, and no decorative introduction.
- PowerShell starts directly at `PS C:\Users\user>` without a decorative introduction.
- Both platforms support light/dark themes. Preserve their visual differences.
- File/folder single click selects; double-click opens; Enter opens the focused item.
- `cd` changes the explorer location. GUI navigation updates the prompt and logs the equivalent `cd`.
- Opening text shows an auto-saving editor window over 95% of `.explorer-pane`, covering its title bar, path bar and sidebar. The underlying explorer is inert while covered; minimizing or closing reveals it again.
- Window controls are functional: close, minimize/restore, and maximize/restore within the entire right pane. macOS controls are on the left; Windows controls are on the right.
- Do not reintroduce the removed guided-learning section, free-practice switch, or quick-command cards unless requested. The header's searchable command guide remains available.

## Implementation conventions

- Put command parsing and virtual filesystem behavior in `engine.js`; keep it independent of the DOM and storage.
- Route commands through `VirtualShell.execute()`. Its validation, limits, and rollback are part of the contract.
- Filesystem node records are replaced, not mutated in place. Rollback snapshots are shallow.
- Render names, commands, paths, errors, and file contents using `textContent`. `innerHTML` is only for trusted, developer-owned SVG templates.
- Preserve CSP protections. Do not add `eval`, `Function`, inline event handlers, or `unsafe-inline` to solve an integration issue.
- Prefer semantic controls, accessible names, keyboard support, visible focus, and reduced-motion behavior.
- CSS has accumulated overrides. Read the end of `styles.css` before changing earlier rules; later platform/window rules may win.
- Prefer focused edits using the existing vanilla implementation. Routine fixes do not require a framework or dependency migration.

## Commands

```sh
npm ci
npm test
npm run build:standalone
npx playwright install chromium
npm run test:ui
```

If Chrome is installed locally, skip the Playwright browser download and use:

```sh
CHROME_PATH=/usr/bin/google-chrome npm run test:ui
```

For manual preview: `npm run preview` (Python 3; localhost port 4173).

## Finishing a change

1. Run checks appropriate to the changed behavior. Engine changes need relevant engine tests; UI changes need relevant browser checks. Documentation-only edits need link/accuracy checks, not a full application rerun.
2. For visible UI changes, check both platforms/themes and narrow layout where affected. Confirm the explorer and document windows stay inside their intended panels.
3. Regenerate standalone after changing production sources or vendored runtime. Run standalone checks; for packaging/runtime changes use the Chrome/Firefox/WebKit matrix.
4. Update the relevant documentation if behavior, state, commands, setup, or packaging changes.
5. Report the implemented result and checks actually performed. Do not claim a deployment or tests that were not run.

There is no configured remote repository, CI workflow, or published URL supplied by this project. Creating a local package is not publishing it.
