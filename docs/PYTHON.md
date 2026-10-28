# Python and editable documents

Both the modular app and `standalone/index.html` include local Python execution, editing, syntax highlighting and default programs. Generate the complete single-file release with `npm run build:standalone`; it is about 16 MB. The standalone embeds the runtime payload and license notices and needs no adjacent files.

## Try it

1. Run the included `python hello_world.py` from home, or double-click `hello_world.py` to edit it. To create another file, use `touch hello.py` on macOS or `New-Item hello.py -ItemType File` on Windows.
2. Double-click it in the explorer. Enter `print("Hello, Python!")`. Valid edits save automatically to the virtual filesystem and browser storage. Save and Ctrl/Cmd+S also save and show a confirmation. The shortcut works while the editor is visible, including when a window control has focus; it suppresses the browser Save Page action. It does not intercept shortcuts while a dialog is open or the editor is minimized. Tab inserts four spaces, Shift+Tab leaves the editor.
3. Run `python hello.py`, `python3 hello.py`, or `py hello.py`. A Python file also has a Run Python button in the editor.
4. Try `python ../hello.py` from a child folder, `/Users/user/hello.py` on macOS, or `C:\Users\user\hello.py` on Windows. Quote paths containing spaces. Arguments after the filename appear in `sys.argv`.

For `input()`, open **Python input** and enter answers, one per line, before running. Every run consumes a fresh copy of these answers. Blank input means EOF; an empty line inside nonempty input is an empty answer. Answers are per-session and transient. There is no interactive REPL or live input prompt in this version.

The editor covers 95% of the width and height of the entire right explorer pane, covering its title, path bar, sidebar and footer. The underlying explorer is inert while covered; minimizing or closing the window reveals it again. Maximize fills the whole right pane. Borders, title bar and OS-specific minimize/maximize/close controls remain. Opening, minimizing, restoring and closing follow the existing native-window behavior. Notes and Python share the same editable application window. Extension detection is case-insensitive: `.py` selects Python highlighting and the Run Python button; `.txt` selects plain text. Other extensions remain editable as plain text without additional language detection. Python keywords, common built-ins, strings (including triple-quoted strings), comments, numbers and operators have theme-specific colors. This is a lightweight lexical highlighter, not a parser: f-strings are colored as whole strings and it provides no completion or diagnostics. There is no rich text. Invalid edits beyond filesystem limits are rejected with a notification and the last valid contents restored. Terminal writes update the open editor.

## Included beginner programs

Home contains `hello_world.py` and a `Python Examples` folder with eight runnable scripts and `README.txt`:

| File | Practice |
| --- | --- |
| `variables.py` | Variables, arithmetic and formatted strings |
| `loops.py` | For and while loops |
| `functions.py` | Function arguments and return values |
| `lists.py` | Lists, dictionaries and conditions |
| `input.py` | Prepared input; defaults to `user` when no answers are supplied |
| `files.py` | Creates/replaces `python_result.txt` in the terminal's current folder |
| `paths.py` | Script location, cwd, relative paths and absolute paths |
| `arguments.py` | `sys.argv`, e.g. `python "Python Examples/arguments.py" Ada 42` |

From home, try `python "Python Examples/loops.py"`. From inside the examples folder, try `python loops.py` or `python ../hello_world.py`. The folder README includes Windows and macOS absolute-path commands. All examples also run with the editor's Run Python button.

Defaults are created by `VirtualShell.reset()` through `installPythonSamples()`. Existing saved sessions receive missing samples once, without replacing existing paths, case-insensitive Windows matches or learner contents. Snapshots now include `pythonSamplesVersion: 1`; the worker preserves this metadata when exporting. This prevents deliberately deleted samples from returning on reload or after a Python run. If an old session is at capacity or an existing file blocks the folder, conflicting/oversized additions are skipped; the session remains valid. Reset restores the default examples.

## Runtime and filesystem

- Pyodide 0.28.3 (CPython 3.13) is vendored in `vendor/pyodide/payload.js`. It runs in a fresh disposable Web Worker for each command. No host Python executable, installation, backend, CDN or internet connection is needed.
- Standard beginner Python works: expressions, loops, functions, lists/dictionaries, print, pre-supplied input, bundled standard-library imports, local `.py` imports and text-file I/O.
- The worker imports the virtual snapshot and starts at the terminal's current working directory. The script directory is added to `sys.path`; running a script in another folder does **not** change cwd.
- Shell paths use the selected platform's syntax. **Inside Python**, Pyodide is a POSIX environment on both platforms: use `/Users/user/...` or relative paths with `/`. It is not a native Windows Python installation.
- Changes inside `/Users/user` are exported to the explorer when execution finishes, including changes made before an ordinary Python exception. Only UTF-8 text files and directories are supported. Other original virtual paths are preserved; changes outside the home tree remain worker-local and are discarded. Python `os.chdir()` does not change the shell location.
- Export validates size, nesting, types, names, ancestry, required directories and Windows name/case constraints. Invalid exports are rejected atomically. Python symlinks, binary files, deleting the shell's current folder and exceeding lab limits cannot be committed.
- Stop Python or Ctrl+C in the terminal terminates the worker. Execution has a 10-second limit after initialization (60 seconds to initialize). Stopping/timeouts discard uncommitted file changes; valid editor changes remain. Output is capped at 16,000 characters.
- While a run is active, editing, filesystem commands, platform changes and reset are blocked to prevent snapshot races. Theme changes and window controls still work.
- No pip, third-party package downloads, native processes, shell `-c`/`-m`, GUI libraries or network access. Only the standard-library components shipped in the vendored archive are available.

## Implementation and security

`VirtualShell.execute()` parses Python commands and returns `{ok, action:"python", path, args}`. It does not run Python. `app.js` owns asynchronous lifecycle/history and uses `TerminalPython.start()` from `python-runtime.js`; the returned object has `done` and `stop()`. `VirtualShell.writeFile()` validates editor writes with immutable node replacement, limits and rollback. Python exports use `restore()` for atomic validation.

In the modular app, the payload loads lazily through a classic local script. In standalone, it is already embedded and the adapter uses it directly without requesting a script. The runner makes a blob worker containing the trusted runtime and worker function. A worker-local fetch implementation serves exactly the embedded wasm and ZIP bytes from memory; other requests fail. The official package lock is passed directly. CSP permits `blob:` workers/scripts and `wasm-unsafe-eval` for WebAssembly; JavaScript eval and external connections remain blocked. `jsglobals: {}` avoids exposing worker globals through the default Python `js` module. There is no native filesystem mount, DOM access, storage handle or host process bridge. This is browser isolation for learner programs, not a hardened service for adversarial code; worker termination bounds runtime, but does not impose a strict memory quota.

`vendor/pyodide/README.md` documents provenance, licensing, checksums and the reproducible vendor script. For the modular edition, include `python-runtime.js` and the entire `vendor/pyodide/` folder alongside the original production assets. For standalone, distribute only the generated HTML. Both can be hosted under a repository subpath.

## Checks

`npm test` includes parser path/argument dispatch and editor rollback checks. Run `CHROME_PATH=/usr/bin/google-chrome npx playwright test tests/app.spec.cjs tests/python.spec.cjs tests/editor.spec.cjs` for modular UI and Python coverage. Python tests use both `file://` and HTTP, assert no external requests, execute scripts in both modes, test relative/absolute paths, arguments/input/imports, file writes, errors, cancellation/recovery and persistence. Existing app tests cover native controls, themes, narrow containment and accessibility. Run `npm run test:standalone` for the complete offline Chrome/Firefox/WebKit single-file matrix; see [DEVELOPMENT.md](DEVELOPMENT.md#standalone-browser-matrix).

### Editor rendering

`highlightEditor()` in `app.js` creates text nodes and trusted span elements beneath the real textarea; learner content never goes through HTML parsing. The decorative `#editor-highlight` layer is aria-hidden. The textarea remains the only accessible editing control. Both layers share font, whitespace and padding, and `syncEditorScroll()` keeps their scroll positions aligned. Forced-colors mode disables the overlay and restores visible textarea text. Language selection and syntax refresh also run after terminal writes and reopening files. `tests/editor.spec.cjs` checks explicit Ctrl/Cmd+S persistence independently of auto-save, safe highlighting, plain-text fallback, scroll alignment and mobile containment in both platforms.
