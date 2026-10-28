# Architecture and state

> Current edition: [Python and editable documents](PYTHON.md) documents local Python execution and the editable window. Both modular and standalone distributions include the complete runtime.


## File responsibilities

| File                           | Responsibility                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `index.html`                   | Static semantic structure, control IDs, dialogs, document window, CSP, and source asset references.             |
| `styles.css`                   | Design tokens, layouts, platform skins, themes, breakpoints, and document-window appearance.                    |
| `engine.js`                    | Tokenizer, virtual filesystem, supported commands, limits, rollback, snapshot validation, and sample migration. |
| `app.js`                       | DOM rendering, event handlers, reference data, shell-to-GUI coordination, sessions, and local storage.          |
| `favicon.svg`                  | Trusted local brand icon. Other icons are trusted inline SVG templates in `app.js`.                             |
| `scripts/build-standalone.cjs` | Embeds the source assets in one HTML file and computes CSP hashes.                                              |
| `standalone/index.html`        | Generated distribution. No sibling assets are needed.                                                           |
| `tests/engine.test.cjs`        | Pure Node engine tests.                                                                                         |
| `tests/app.spec.cjs`           | Browser, platform, keyboard, migration, accessibility, and layout tests.                                        |
| `tests/standalone.spec.cjs`    | Tests a copied HTML file in an otherwise empty temporary directory.                                             |

The modular HTML loads `engine.js` before `app.js`, both with `defer`. The standalone embeds the engine, vendored Python payload, Python adapter and app in that order at the end of the body, where the DOM already exists. The modular app also loads `python-runtime.js` before `app.js`; its Pyodide payload loads lazily. See [PYTHON.md](PYTHON.md).

## Engine exports

`engine.js` is an IIFE. In browsers it assigns `window.TerminalLab`; under CommonJS it exports the same object:

```js
{
  (VirtualShell, tokenize, HOME, parent, basename, under, LIMITS);
}
```

`app.js` is a separate IIFE. Its helpers and state are private; it consumes `window.TerminalLab`. Tests exercise UI behavior through the DOM, and engine behavior through CommonJS.

## Filesystem representation

A shell instance has `mode`, `cwd`, and `nodes`. `nodes` is a `Map` keyed by normalized absolute virtual paths.

```js
const { VirtualShell, HOME } = require("./engine.js");
const shell = new VirtualShell("mac");
// HOME === '/Users/user'
// cwd === HOME
// nodes.get(HOME + '/Documents') === { type: 'dir' }
// nodes.get(HOME + '/Documents/notes.txt') is:
// { type: 'file', content: 'My first note\n...' }
```

All internal paths use `/`, including Windows sessions. Windows display converts them to `C:\...`. Directories are explicit records. Parent folders must exist and must be directories. The root, `/Users`, and home are protected, as are current-location ancestors for movement/deletion.

Records must be treated as immutable values: replace them with `Map.set(path, newRecord)`. Do not mutate `node.content` in place. `snapshot()` copies Map entries, not a deep clone of every record, and `execute()` relies on that for atomic rollback.

### Core methods

| Method                        | Contract                                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reset()`                     | Populate the English sample filesystem and set home as the current folder.                                                                                                                                 |
| `resolve(input, options)`     | Resolve a virtual path; supports relative/absolute paths, `.`, `..`, home shorthand, and Windows separators/drive validation. `options.parents` supports nested folder creation. Does not create anything. |
| `display(path)`               | Convert an internal path to a platform-facing absolute path. Defaults to `cwd`.                                                                                                                            |
| `short(path)`                 | Abbreviate paths under home with `~`; used where appropriate by the UI.                                                                                                                                    |
| `get(path)`                   | Return a node at a canonical path, or `undefined`.                                                                                                                                                         |
| `require(path, type)`         | Validate existence and optional type (`dir`/`file`); throw an educational engine error on failure.                                                                                                         |
| `list(path, hidden)`          | Return sorted immediate children, directories first. Each item includes `path`, `name`, and node fields.                                                                                                   |
| `create(path, type, content)` | Validate name and parent, then create a new node; reject an existing destination.                                                                                                                          |
| `protect(path)`               | Reject destructive operations against protected locations.                                                                                                                                                 |
| `checkLimits()`               | Check item, content, and total-space bounds.                                                                                                                                                               |
| `snapshot()`                  | Return `{ cwd, nodes: [...entries], pythonSamplesVersion: 1 }`, suitable for JSON serialization.                                                                                                                                    |
| `restore(data)`               | Validate and restore a snapshot, upgrade old samples, check limits; return `true` on success. On failure restore the previous state and return `false`.                                                    |
| `execute(source)`             | Supported entry point for commands. Wrap parsing/execution/limit checking and roll back on error. Returns a result instead of throwing to the UI.                                                          |
| `run(source)`                 | Internal dispatcher; not the safe public mutation entry point.                                                                                                                                             |

The home structure includes `Desktop`, `Documents`, `Downloads`, `Projects`, `welcome.txt`, `Documents/notes.txt`, `Projects/web/README.md`, `hello_world.py`, and `Python Examples/` with eight beginner programs plus `README.txt`. See [PYTHON.md](PYTHON.md) for the one-time, non-destructive sample migration and snapshot marker `pythonSamplesVersion: 1`.

## Parsing and command results

`tokenize(source, mode)` returns tokens with `{ value, operator }`. It handles quotation and the platform's limited escape rules. Unquoted unsupported operators, substitutions, variables, or multiline input are rejected. A closing quote must exist.

`run()` normalizes Windows command names and resolves aliases, separates one optional final `>`/`>>` redirection, checks command arguments/options, executes the command, and applies supported output redirection. Most commands return:

```js
{
  ok: true,             // supplied by execute()
  output: '',           // text to print; may be empty on success
  action: 'mkdir',      // operation identifier; may differ from input alias
  path: '/Users/user/new-folder',
  changed: true,        // generally indicates a filesystem change
  explanation: 'Folder created. mkdir creates it; cd moves into it.'
}
```

Special cases include `empty`, and `clear` with `clear: true`. A failure returns `{ ok: false, action: 'error', output: '...' }`.

Do not use `changed` as the only condition to update the GUI. `cd` changes location without a file mutation, and reads/errors can affect visible feedback. The UI renders after every submitted command.

Redirection is allowed for `echo`, `pwd`, `ls`, `cat`, `help`, and `whoami`. It yields action `write`, no printed output, and the destination path. `>` replaces file contents; `>>` appends. Files are virtual strings, not executable content.

### Limits

`LIMITS` defines 700 nodes, 100,000 characters per file, 750,000 total characters across paths and file contents, 4096 characters per command, and 40 directory levels. The storage reader separately ignores serialized values of 4,000,000 characters or more. These counts are not equivalent to browser storage bytes.

## UI sessions and persistence

`app.js` creates separate `mac` and `windows` sessions. `active` points to the selected one.

| Field               | Meaning                                                                                                                | Saved? |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| `shell`             | `VirtualShell` instance; saved as its filesystem snapshot.                                                             | Yes    |
| `history`           | Submitted terminal commands, capped at 100. GUI navigation does not add terminal history.                              | Yes    |
| `logs`              | Rendered command entries, capped at 70. Each has command, pre-command path, output, success flag, and GUI-source flag. | Yes    |
| `showLogin`         | Whether the simulated macOS login line is shown. Clearing hides it.                                                    | No     |
| `back`              | GUI navigation history, capped at 80.                                                                                  | No     |
| `selectedPath`      | Currently selected explorer item.                                                                                      | No     |
| `openFile`          | Path shown in the document window, or `null`.                                                                          | No     |
| `documentMinimized` | Whether the open document has been minimized.                                                                          | No     |
| `documentMaximized` | Whether it fills the entire right explorer pane.                                                                             | No     |

Preferences are `{ platform, theme, view }`, saved along with sessions under the localStorage key `terminal-lab:v1`:

```json
{
  "preferences": { "platform": "mac", "theme": "light", "view": "grid" },
  "mac": {
    "filesystem": { "cwd": "/Users/user", "nodes": [] },
    "history": [],
    "logs": []
  },
  "windows": {
    "filesystem": { "cwd": "/Users/user", "nodes": [] },
    "history": [],
    "logs": []
  }
}
```

This example illustrates the schema only: an empty `nodes` array is not a valid snapshot. Required root/home directories must be present. Use `snapshot()` for actual fixtures.

Output entries are shortened for display before saving; the full file contents remain in the filesystem. Storage reads validate preference values, history/log types, lengths, and snapshots. Storage failure leaves the running session usable in memory. Persistence scope and quota belong to the browser; modular and standalone URLs are not guaranteed to share storage.

### Migrations

1. In `app.js`, the storage loader recognizes the old `/Users/alex` home when the new home is absent and rewrites filesystem paths/current location. It also adjusts recorded log paths and matching output. File contents are preserved.
2. In `engine.js`, `restore()` calls `upgradeSamples()`. It renames old `notas.txt`/`inicio.txt` samples and translates only exact known stock contents, including the sample README. Modified content is preserved. If an English destination already exists, the old sample is retained under a unique ` (previous N).txt` name.

Keep these migrations idempotent. Do not delete them merely because the current seed data is already English. A changed storage key or snapshot schema needs an explicit compatibility decision.

## Rendering and event flow

### Terminal command

```text
form submit
  → app.execute(command)
  → active.shell.execute(command)
  → history/log updates and navigation-state adjustments
  → renderTerminal() + renderExplorer()
  → renderDocument() as part of explorer rendering
  → save()
```

GUI navigation uses `navigate()` → a platform-quoted `cd` → the same `execute()` path with `gui = true`. This keeps the prompt and explorer synchronized rather than maintaining a second GUI location.

### Document window

`preview(path)` validates a virtual file, scrolls the file area to the top, sets the open path and normal window state, renders the document, and focuses its editable textarea.

`renderDocument()` derives content from the active shell every time. It closes a missing path, toggles `.explorer-pane.document-open`, toggles `#text-app` and `#restore-file`, updates title/content/count, and marks the underlying explorer bar, toolbar, body and footer `inert` while covered.

`closeDocument()` clears the open path, rerenders, and restores selection focus. Minimize/restore and maximize/restore update session UI fields. The 95% inset window and maximized window both stay bounded by `.explorer-pane`. Navigation to a different folder clears the open path. Document state is not persisted across reloads.

### Important DOM dependencies

`app.js` directly looks up IDs; removing or renaming them requires changing listeners and renderers together. Key groups:

- Terminal: `terminal-form`, `command-input`, `prompt-label`, `prompt-symbol`, `terminal-output`, `terminal-scroll`, `mac-login`.
- Explorer: `breadcrumbs`, `folder-title`, `file-search`, `file-grid`, `go-back`, `go-up`, `grid-view`, `list-view`.
- Document: `text-app`, `document-window-title`, `preview-title`, `preview-content`, `preview-path`, `document-count`, `minimize-file`, `maximize-file`, `close-file`, `restore-file`, `restore-file-label`.
- Shared controls: `platform-mac`, `platform-windows`, `theme-toggle`, `reference-open`, `reset-open`.

## Styling and security

The root `data-platform` (`mac`/`windows`) and `data-theme` (`light`/`dark`) attributes select CSS tokens. Desktop panel layout uses a grid; mobile stacks it. Existing media-query layers include 1500px, 1050px, and 760px breakpoints.

`styles.css` contains original rules followed by later readability/platform overrides. The final document-window rules position `#text-app` absolutely inside relatively positioned `.explorer-pane`. Some unused selectors from removed learning cards remain; their presence does not mean the feature is active.

The engine has no host access. The app uses `textContent` for untrusted strings. Trusted SVG templates alone use `innerHTML`. The modular CSP permits local scripts/styles, blob workers/scripts and WebAssembly compilation, and blocks connections. Standalone embeds scripts/styles authorized by exact SHA-256 hashes. The Python worker handles runtime fetches from embedded memory; no network API, analytics, or real shell bridge is part of this design.
