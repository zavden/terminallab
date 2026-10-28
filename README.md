# Terminal Lab

A browser-based lab for learning PowerShell and zsh by watching commands change a synchronized file explorer. The terminal sits on the left and the GUI on the right. On small screens, the panels stack vertically.

## Upload this repository

This folder contains the modular website and its contributor tools. The Python runtime is already included under `vendor/pyodide/`; do not omit it. No production build or installation is required. Generated standalone HTML, screenshots and installed development dependencies are excluded from Git.

To push this local repository, create an empty repository on your GitHub account, then run these commands here (replace the example owner and repository):

```sh
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

If you have not created an initial commit yet, run `git add .` and `git commit -m "Initial Terminal Lab website"` before pushing. For the hosted website, enable GitHub Pages using the steps below. Upload the contents of this directory as the repository root, rather than nesting them in an additional `repo` directory.

## Documentation for contributors and agents

Start with [AGENTS.md](AGENTS.md). The detailed handoff is split into:

- [Product and interactions](docs/PRODUCT.md): accepted interface decisions and behavior to preserve.
- [Architecture and state](docs/ARCHITECTURE.md): engine API, event flow, session/storage schema, migrations, and security boundaries.
- [Development guide](docs/DEVELOPMENT.md): adding commands, changing samples or persistence, UI extension recipes, tests, standalone packaging, and troubleshooting.

**Python edition:** see [Python and editing](docs/PYTHON.md) for usage, packaging and limits. Both the modular source and standalone include vendored Python.

## Open the app

Open **`index.html`** in a modern browser. No server, installation, account, API, or build step is required. Keep `index.html`, `styles.css`, `engine.js`, `app.js`, `python-runtime.js`, `favicon.svg`, and the `vendor/pyodide/` folder together.

For an optional local development preview:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. On Windows, you can use `py` instead of `python3`.

## Single-file version

`standalone/index.html` can be generated locally as the complete app in one HTML file (about 16 MB), including Python, its standard-library archive, the editor, syntax colors, default programs, styles, icons and third-party license notices. After building it, copy **only that file** to an empty folder and open it in a current Chrome, Firefox or Safari. No Python installation, sibling files, server or internet connection is required.

Regenerate with `npm run build:standalone`. Embedded scripts/styles use exact CSP SHA-256 hashes; do not edit or format the generated file by hand.

The offline direct-file tests pass in Chrome, Firefox and Playwright WebKit, in both simulated OS modes. WebKit is the Safari engine; this Linux verification is not a test of the actual Safari app on macOS/iOS. Use current browsers; Pyodide's [browser compatibility reference](https://pyodide.org/en/0.28.3/usage/index.html#supported-browsers) lists Chrome/Firefox 112+ and Safari 16.4+ as its baseline, not a test matrix for this app. Browser storage remains subject to each browser's local-file/privacy policies.

For the cross-browser checks:

```sh
npx playwright install chromium firefox webkit
npm run test:standalone
```

If using installed Chrome on Linux: `CHROME_PATH=/usr/bin/google-chrome npm run test:standalone`. Playwright's WebKit needs OS browser dependencies on the development machine; these are unrelated to the delivered HTML.

## Included Python programs

Run `python hello_world.py` from home. Open **Python Examples** for eight beginner programs covering variables, loops, functions, collections, input, files, paths and arguments. For example: `python "Python Examples/loops.py"`. Samples also appear in existing sessions without overwriting your files.

## Features

- Local Python execution (`python`, `python3`, `py`) with relative/absolute script paths and a native-style, auto-saving text editor shared by notes and code, with Ctrl/Cmd+S and Python syntax highlighting. See [usage and limitations](docs/PYTHON.md).
- English interface, command reference, explanations, errors, and sample files.
- Separate macOS / zsh and Windows / PowerShell practice sessions, both using the username `user`.
- A plain inline PowerShell prompt (`PS C:\Users\user>`) without an introductory banner.
- Minimal macOS terminal inspired by the Basic profile: a plain light background, monochrome text, a login line, and an inline `user@MacBook-Air ~ %` prompt. The dark theme retains the same simple layout. No shell theme or decorative welcome banner.
- Light and dark themes, initially following the system preference.
- Navigation synchronized in both directions. `cd` updates the explorer; browsing folders displays the equivalent command in the terminal.
- Double-click files and folders to open them; a single click selects, and Enter opens the selection.
- Text files open in a window covering 95% of the entire right pane, with a Notepad-style view on Windows and a TextEdit-style view on macOS. Minimizing or closing reveals the underlying explorer. Windows controls appear on the right; macOS uses traffic-light controls on the left. Minimize, maximize within the right pane, restore, and close all work. Previews are editable and update live when terminal commands change the file. Close the document or press Escape inside it to return to the explorer.
- Search, icon/list views, breadcrumbs, and back/up buttons.
- A searchable guide comparing commands on both platforms.
- Command history with ↑/↓, completion with Tab, clearing with Ctrl/Cmd + L, and input cancellation with Ctrl + C. Shift + Tab leaves the input field.
- Local storage for files, location, and history. Resetting affects only the selected system.

Saved practice stays in the browser and is not shared across devices. If storage is blocked or full, the current session continues in memory. Persistence under `file://` depends on browser policies. Old Spanish sample names such as `notas.txt` are migrated to English (`notes.txt`). Unmodified sample contents are translated too. Customized content is preserved, and existing English files are never overwritten by migration.

## Main commands

| Action                    | macOS / zsh                     | Windows / PowerShell                      |
| ------------------------- | ------------------------------- | ----------------------------------------- |
| Show location             | `pwd`                           | `pwd` / `Get-Location`                    |
| List contents             | `ls`, `ls -la`                  | `ls`, `dir`, `Get-ChildItem`, `ls -Force` |
| Navigate                  | `cd Documents`, `cd ..`, `cd ~` | Same, or `Set-Location`                   |
| Absolute path             | `cd /Users/user/Documents`      | `cd C:\Users\user\Documents`              |
| Create folder             | `mkdir project`                 | `mkdir project`                           |
| Nested folders            | `mkdir -p a/b`                  | Create each level with `mkdir`            |
| Create file               | `touch note.txt`                | `New-Item note.txt -ItemType File`        |
| Display text              | `echo "Hello"`                  | Same, or `Write-Output`                   |
| Write/replace             | `echo "Hello" > note.txt`       | Same                                      |
| Append                    | `echo "More" >> note.txt`       | Same                                      |
| Read                      | `cat note.txt`                  | Same, or `Get-Content`                    |
| Copy file                 | `cp note.txt copy.txt`          | Same, or `Copy-Item`                      |
| Move/rename               | `mv copy.txt other.txt`         | Same, or `Move-Item` / `Rename-Item`      |
| Copy folder recursively   | `cp -r project backup`          | `cp project backup -Recurse`              |
| Delete file               | `rm other.txt`                  | Same, or `Remove-Item`                    |
| Delete folder recursively | `rm -r project`                 | `rm project -Recurse`                     |
| Delete empty folder       | `rmdir project`                 | Same                                      |
| Clear screen              | `clear`                         | `clear`, `cls`, `Clear-Host`              |
| Run Python                | `python3 hello.py`              | `python hello.py` or `py hello.py`         |
| Simulator help            | `help`                          | Same                                      |

Quote names containing spaces: `mkdir "My ideas"`.

## Scope and safety

This is an educational simulator. Commands only transform data held in memory and browser storage. They cannot access real files, processes, accounts, credentials, or the network.

- Python executes only in a disposable browser worker. JavaScript eval is blocked by CSP; user text is rendered with `textContent` or textarea `.value`.
- Pyodide is bundled locally; no CDNs, external fonts, analytics, or background network requests. Documentation links are visited only when clicked.
- A Content Security Policy limits scripts and resources to this site and blocks connections, objects, and form submission.
- Limits: 700 items, 40 folder levels, 100,000 characters per file, 750,000 total path/content characters, and 4096 characters per command.
- Failed operations are rolled back. Root and home folders, and ancestors of the current location, are protected from deletion or movement.
- Pipes, chained commands, variables, wildcards, shell scripts, symbolic links, permissions, timestamps, and many native command options are outside the simulation. Output and copy rules are simplified.
- Windows commands and paths are case-insensitive; this lab’s macOS mode is case-sensitive. On real Macs, file name sensitivity depends on the disk format.
- The GUI always displays hidden files for learning; `ls` hides them until the appropriate option is used.
- `rm` only removes virtual data here. In a real terminal, it can delete files permanently.

Command references: [PowerShell Management](https://learn.microsoft.com/powershell/module/microsoft.powershell.management/), [New-Item](https://learn.microsoft.com/powershell/module/microsoft.powershell.management/new-item), and [the zsh manual](https://zsh.sourceforge.io/Doc/Release/Shell-Builtin-Commands.html).

## Publish to GitHub Pages

1. Upload `index.html`, `styles.css`, `engine.js`, `app.js`, `python-runtime.js`, `favicon.svg`, the `vendor/pyodide/` folder, and `.nojekyll` to your repository root.
2. Open **Settings → Pages** in the repository.
3. Set **Source** to **Deploy from a branch**.
4. Select the branch containing the files and **/(root)**, then save.

No build command is needed. All asset paths are relative, including when hosted under a repository path such as `https://username.github.io/terminal-lab/`. `.nojekyll` skips Jekyll processing. Tests, screenshots, and `node_modules` are not required for hosting.

References: [Configure a Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [create a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). The same files work with other static hosting providers. No remote repository or deployment is created by this project.

## Development and tests

Node is only needed for development tests and standalone packaging, not for running the app.

```sh
npm ci
npm test
npm run build:standalone
npx playwright install chromium
npm run test:ui
```

The browser suite starts its own preview server. It uses Playwright for workflows and axe-core for automated accessibility checks. To use an existing Chrome installation on Linux:

```sh
CHROME_PATH=/usr/bin/google-chrome npm run test:ui
```

Tests cover both command workflows, synchronized navigation, file operations, paths and quotes, atomic errors, session isolation, persistence, literal HTML content, data limits, keyboard interactions, the guide, mobile layout, themes, and `file://` operation with no network requests. Automated accessibility tests supplement manual review; they do not replace testing with assistive technologies.

Screenshots are written to `screenshots/`. Failed runs produce details in `test-results/`.

## Source files

- `index.html`: semantic structure and interface text.
- `styles.css`: platform appearance, themes, and responsive layout.
- `engine.js`: command parser and virtual filesystem, independent of the DOM.
- `app.js`: interactions, the command reference, safe rendering, and persistence.
- `tests/`: engine and browser tests.
- `playwright.config.cjs`: browser test configuration.

- `scripts/build-standalone.cjs`: single-file packager with CSP hashes.
- `standalone/index.html`: complete generated distribution, including Python.
- `AGENTS.md`: instructions for agents working on this project.
- `docs/`: detailed product, architecture, and development documentation.
