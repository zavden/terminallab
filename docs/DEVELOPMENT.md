# Development, extension recipes, and verification

> Current edition: [Python and editable documents](PYTHON.md) documents local Python execution and the editable window. Both modular and standalone distributions include the complete runtime.


## Start a development session

Read [../AGENTS.md](../AGENTS.md), then the relevant sections of [ARCHITECTURE.md](ARCHITECTURE.md) and [PRODUCT.md](PRODUCT.md). Inspect the actual current source before changing it; this guide names stable functions rather than line numbers.

The app has no production dependency installation or build step. To develop with tests:

```sh
npm ci
npm test
npm run build:standalone
npx playwright install chromium
npm run test:ui
```

The development baseline used Node 22 and Python 3. Node runs the package builder and tests. Python runs the local preview/test HTTP server. Neither is needed by someone opening the completed HTML in a browser.

If Google Chrome is already installed, you can skip downloading Chromium:

```sh
CHROME_PATH=/usr/bin/google-chrome npm run test:ui
```

Set `CHROME_PATH` to an actual executable on the current machine. Without it, Playwright uses its installed Chromium. A Chrome extension is not required for these automated tests: Playwright launches a separate headless browser, not the user's signed-in Chrome profile.

Manual preview:

```sh
npm run preview
```

Open `http://127.0.0.1:4173`. Stop a server you started when finished. You can also directly open either source `index.html` or `standalone/index.html` with `file://`.

`playwright.config.cjs` starts the preview server automatically for browser tests. It reuses an existing localhost server outside CI, so ensure port 4173 serves this directory. `npm run test:standalone` uses `playwright.standalone.config.cjs` with Chrome, Firefox and WebKit projects and no test server. It opens an isolated copy over `file://` with network disabled.

## Choose the right files to edit

| Requested change                        | Typical files                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Copy, accessible labels, dialog content | `index.html`, relevant strings in `app.js`/`engine.js`                                               |
| New simulated command or option         | `engine.js`, `app.js` reference/completer, engine tests, relevant UI tests                           |
| Theme or layout                         | `styles.css`; `index.html`/`app.js` if structure/state changes                                       |
| Sample files                            | `VirtualShell.reset()` in `engine.js`, migration rules if applicable                                 |
| Saved-data change                       | Storage loader/`save()` in `app.js`, `restore()`/migrations in `engine.js`, migration tests          |
| Native text-window interaction          | Document markup in `index.html`, document state/render/listeners in `app.js`, final window CSS rules |
| Packaging                               | `scripts/build-standalone.cjs`, `tests/standalone.spec.cjs`                                          |
| Documentation only                      | This directory's Markdown files; validate local links and statements against source                  |

Regenerate standalone after production source or runtime changes. Do not keep separate hand-maintained logic inside `standalone/index.html`.

## Recipe: add a simulated command

1. Define the learner-facing behavior and supported platform(s). Pick explicit argument and option rules rather than silently pretending to support an entire native utility.
2. In `VirtualShell.run()`, add a switch case or extend the relevant existing case. Use the local argument-count/option helpers as appropriate. Resolve virtual paths, validate types/parents/names, and protect destructive destinations.
3. For mutations, replace node records through the Map. Do not mutate existing record objects, access real files, start a process, or evaluate the input.
4. Set an appropriate `action`, `path`, `changed`, `output`, and English `explanation`. The surrounding `execute()` checks limits and restores state on failure.
5. If the command has PowerShell aliases, update the engine's `aliases` table. macOS commands remain case-sensitive.
6. If output redirection should work for it, explicitly review the redirection allowlist. Do not bypass the shared handling accidentally.
7. Update both the engine's `help` text and `app.js`'s `reference` array. These are separate hand-maintained sources. Add the name to `complete()` if it should be offered by command completion.
8. Add meaningful engine cases for success, error/atomicity, and platform differences. Add a browser case if the command changes navigation, reader behavior, or learner-visible interactions.
9. Update the README command table and scope notes if necessary, rebuild standalone, and verify the changed behavior.

Example engine usage for a test:

```js
const { VirtualShell, HOME } = require("../engine.js");
const shell = new VirtualShell("windows");
const result = shell.execute("New-Item note.txt -ItemType File");
// Assert result.ok and shell.get(HOME + '/note.txt'), not only the action name.
```

A command with multiple operands must leave no partial changes when a later operand fails. Use before/after snapshots in tests for this guarantee.

## Recipe: add or revise sample files

- Edit `VirtualShell.reset()` for new sessions and Reset behavior.
- Changing seeds does not automatically change already-saved files. Decide whether an old stock sample needs a compatibility migration.
- Match known original stock contents exactly before replacing their text. Do not translate or overwrite arbitrary customized content.
- Handle destination collisions without destroying an existing English file.
- Keep migrations repeatable: restoring an already-upgraded snapshot should produce the same filesystem.
- Add fixtures covering the old snapshot, edited content, and a destination collision. Existing examples are in `tests/engine.test.cjs`.
- Keep filename, displayed content, reference examples, and README descriptions consistent.

Spanish text retained in the migration table is historical matching data, not untranslated UI. Likewise, legacy `/Users/alex` strings are compatibility logic, not the active username.

## Recipe: change persistence

The current key is `terminal-lab:v1`. Preserve it for compatible changes. Introducing a new key without importing the old value will make existing work appear lost.

- Read `snapshot()`, `restore()`, the loader, and `save()` together.
- Validate shape, values, lengths, directory ancestry, required roots/home, and limits before trusting saved data.
- Continue working in memory if the storage API throws or its quota is exhausted.
- Keep platform isolation: Reset, navigation, files, and history in one session must not overwrite the other.
- Keep transient window state separate from saved files unless the requested feature explicitly changes persistence behavior.
- Add reload tests and old-format migration fixtures. Preserve learner-written text even if it mentions old usernames or contains HTML.

Do not broaden the storage schema by passing arbitrary saved objects directly into DOM operations.

## Recipe: extend the text application window

The window and minimized restore button are direct children of `.explorer-pane`, after the explorer footer. The pane is their positioning container; the normal window covers 95% of the entire right pane.

1. Add state to `newSession()` if the behavior is transient and platform-specific.
2. Update `renderDocument()` to derive UI from the active shell/session. Avoid an independent copy of file contents that can become stale after terminal commands.
3. Keep the underlying explorer bar, toolbar, body and footer `inert` while covered; restore them when the editor is minimized or closed.
4. Cover the explorer chrome as well as its file contents. Maximize fills the entire right pane; never cover the terminal.
5. Preserve native control placement and semantic button labels. A visible control must do what its label promises.
6. Preserve keyboard focus: opening focuses the document, minimizing focuses its restore button, closing returns focus to the selected file when possible, and Escape works from inside the window.
7. Check long names/content, empty files, file deletion/rename, terminal writes while open, system switching, light/dark mode, and mobile width.
8. Update tests around containment and actual operation results, not just a CSS class.

The editor auto-saves validated changes through `writeFile()`. See [PYTHON.md](PYTHON.md) for editing, limits, Python runs and race prevention.

## Recipe: change HTML, icons, or styling

- Stable IDs connect static markup to private app helpers. Change both sides together.
- Add icons to the trusted `icons` table and use `data-icon`/`hydrate()` where appropriate. Learner data must never become an SVG/HTML template.
- Scope OS-specific styling with root `data-platform`; scope theme changes with `data-theme` and existing CSS tokens.
- Inspect the final override layers in `styles.css`. A rule near the top may be overridden much later.
- Preserve `prefers-reduced-motion` support, readable contrast, focus visibility, and mobile stacking.
- Do not add external fonts/assets for a small cosmetic change. Any necessary new embedded asset must also be handled by the standalone packager.
- Do not use inline event-handler attributes; bind events in `app.js`.

Unused selectors for removed lesson/quick-card UI remain in the stylesheet. They can be removed in a deliberate cleanup, but do not restore those product features just because their classes exist.

## Verification map

At handoff, the test inventory is 21 engine cases, 13 modular browser cases, and 2 standalone browser cases. Counts may change as features are added; the commands and assertions are the source of truth. Tests were run during implementation; a documentation-only edit does not imply a new full test run.

| Command                                          | Purpose                                                                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                       | Parser/quoting, file operations, aliases, path behavior, limits, rollback, protected folders, snapshots, migration, and prototype-like names.                               |
| `npm run test:ui`                                | Entire Playwright suite, including modular and standalone tests. Starts a preview server automatically.                                                                     |
| `npm run test:ui -- --grep 'double-click opens'` | Native document view, focus/keyboard handling, updates, controls, containment, dark/light contrast, and mobile layout.                                                      |
| `npm run test:ui -- --grep standalone`           | Single-file distribution copied to a temporary directory, no adjacent assets/network, file operations, native preview, theme and reload persistence, and literal HTML text. |
| `npm run test:ui -- --grep accessibility`        | Page/theme/platform and reference-dialog axe checks.                                                                                                                        |
| `npm run build:standalone`                       | Regenerate the delivered HTML from current source.                                                                                                                          |

Prefix browser commands with `CHROME_PATH=/usr/bin/google-chrome` when using that installed Linux executable. On other platforms set the environment variable using that shell's syntax and the correct executable path.

### Browser/manual review checklist

For affected UI flows, review both platforms in light/dark mode and a narrow viewport (the suite uses 390px for mobile and 1440px for desktop):

- Prompt location, current folder, and breadcrumbs agree after CLI and GUI navigation.
- Single click selects; double-click/Enter opens; close restores useful focus.
- The editor covers 95% of the right pane, including sidebar and path bar, without covering the terminal.
- Minimize, restore, maximize, close, and title-bar double-click work.
- Terminal writes update the open file; deletion/rename/navigation do not leave stale content.
- Long filenames/text wrap or scroll without horizontal page overflow.
- Literal HTML stays visible as text; no script executes.
- Reference search/insertion and Reset confirmation work.
- Refresh preserves files, theme, platform, and history where storage is available.
- Console has no runtime/CSP errors; direct-file operation makes no HTTP requests.

Playwright captures screenshots in `screenshots/`; failures produce context/screenshots in ignored `test-results/`. These are not golden-image pixel comparisons. Inspect representative captures for visible changes. axe covers selected WCAG A/AA rules, not all possible accessibility issues or screen-reader behavior.

## Standalone packaging contract

Run `npm run build:standalone` after production source changes. The builder uses only Node's standard `fs`, `path`, and `crypto` modules and performs these transformations:

1. Read the modular HTML, CSS, engine, Python runtime adapter, vendored payload, app script, favicon and license notices.
2. Remove the CSS `@charset` declaration before embedding; the HTML already declares UTF-8.
3. Replace the stylesheet link with a `<style>` block.
4. Remove the three external deferred script tags.
5. Embed the favicon as a base64 SVG data URL.
6. Change the brand's relative directory link to an in-page anchor for direct-file navigation.
7. Compute SHA-256 hashes over the exact embedded CSS and each script, including added whitespace.
8. Replace the source CSP with hash-authorized scripts/styles, blob workers/scripts and WebAssembly compilation permission; keep network connections blocked.
9. Append the engine, vendored payload, Python adapter and app scripts before `</body>`. Include third-party license notices in an inert template.
10. Reject remaining known source asset references and write only `standalone/index.html`.

Important maintenance details:

- Do not format or edit the generated HTML after hashing. Changed inline bytes invalidate the CSP hashes.
- Use replacement callbacks when inserting source code with JavaScript `String.replace`. A replacement string can interpret `$&`, dollar-backtick, or dollar-apostrophe sequences found in embedded source and corrupt the result. The callback avoids that.
- Literal closing script/style tags in embedded source are rejected by the builder. If a feature introduces them, escape the source safely before packaging and test the generated file.
- The current builder recognizes the existing HTML asset tags and known assets. If markup formatting, script tags, or asset types change, update the builder and its tests together. Its final check is not a generic bundler for arbitrary new assets.
- `standalone/` should contain just `index.html`. Build scripts/docs/tests live outside it.
- Verify by copying the generated HTML into an empty directory, not merely opening it beside the modular assets. The automated standalone tests do this.

The standalone is HTML with embedded CSS/JavaScript; it retains all interactive behavior. It is not a script-free HTML page.

## Troubleshooting

| Symptom                                                     | Likely cause and action                                                                                                                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modular HTML works, standalone does not                     | Regenerate; inspect console for CSP hash failures, source tag changes, or literal closing tags. Confirm the builder uses callback replacements.                                                             |
| Playwright says an executable is missing                    | Install Chromium with `npx playwright install chromium`, or set `CHROME_PATH` to an installed Chrome executable.                                                                                            |
| Browser tests visit an unexpected site                      | Port 4173 may already belong to another server. Stop/reconfigure the conflicting local server before rerunning.                                                                                             |
| Browser tests cannot start Python                           | Install Python 3 or adjust the local test-server command for that environment. The delivered app still does not require Python.                                                                             |
| Contrast audit fails only immediately after theme switching | Test the settled state. The existing accessibility cases emulate reduced motion to avoid sampling intermediate transition colors. Investigate a real settled-state failure rather than disabling the audit. |
| English seeds still appear in Spanish in a saved session    | Seed changes alone do not upgrade saved data. Check exact known-sample migration matching and preserve customized content.                                                                                  |
| Files seem lost when opening a different copy               | Storage scope may differ by origin/path, particularly with `file://`. Do not assume a downloaded copy imports another URL's localStorage.                                                                   |
| A file command reports an error with partial-looking output | Inspect the filesystem snapshot and wrapper; commands must mutate through `execute()`, with replaced node records and rollback on failure.                                                                  |
| A CSS edit seems ignored                                    | Check root platform/theme and later overrides/media queries, especially the final document-window rules.                                                                                                    |
| A file opens a dialog or replaces the whole explorer        | Outdated markup/state logic. The current contract is a child window over the full `.explorer-pane`.                                                                                                                   |
| Reader shows old text after a terminal write                | Render from the current shell's node via `renderDocument()`; avoid duplicated content state.                                                                                                                |

## Delivery and hosting

For the modular distribution, publish the original assets, `python-runtime.js`, `vendor/pyodide/`, and `.nojekyll`. For the single-file distribution, publish/copy `standalone/index.html` as the entry HTML. Production does not need tests, docs, Node modules, or the build script.

The README contains the GitHub Pages setup instructions. There is no project-provided remote, CI pipeline, or deployment credential. Do not confuse a successful local build with a deployed site.

When handing off a change, state what changed, what verification actually ran, any relevant limitation, and whether standalone was regenerated. Keep the documentation aligned with actual supported behavior instead of documenting unimplemented native-shell features.


### Standalone browser matrix

`npm run test:standalone` runs two OS modes in each of Chrome, Firefox and WebKit (six tests). Install the Playwright browsers and required OS libraries first; use `CHROME_PATH` for an installed Chrome executable. The tests copy only the HTML into a new directory, set the browser offline, run relative/absolute Python scripts, supply input, write virtual files, edit/save with keyboard shortcuts, check highlighting, minimize/restore, reload persistence, literal HTML safety and narrow containment, and reject console errors or external requests. The normal `test:ui` command still includes standalone tests under its default Chromium configuration.

The runner uses classic blob workers, keeps their URLs alive until termination, disables Pyodide's optional stack-switching integration, and serves wasm/stdlib from embedded memory. It does not require cross-origin isolation, SharedArrayBuffer or a native filesystem API. WebKit tests on Linux are engine verification, not a substitute for manually checking Safari on macOS/iOS. On the Fedora development host, missing Ubuntu-fallback ICU/JPEG test libraries were extracted into a temporary folder and linked into the Playwright cache; no such libraries are part of the app or needed by end users.
