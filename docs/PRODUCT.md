# Product and interaction contract

> Current edition: [Python and editable documents](PYTHON.md) documents local Python execution and the editable window. Both modular and standalone distributions include the complete runtime.


## Purpose

Terminal Lab teaches the connection between command-line actions and visible files/folders. A beginner should be able to type a command and immediately recognize its effect in the GUI, without risking real files or installing a shell.

The app simulates a small useful subset of zsh and Windows PowerShell. It does not aim to implement a complete operating system or shell. Keep explanations honest about simplified output and unsupported syntax.

## Current product decisions

| Area          | Expected behavior                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language      | English interface, accessible labels, error/help messages, reference, and stock files.                                                             |
| User          | `user`, with internal home `/Users/user`.                                                                                                          |
| macOS shell   | Plain zsh; inline prompt `user@MacBook-Air ~ %`, with the current folder basename outside home. A simulated login line appears on initial opening. |
| Windows shell | Inline `PS C:\Users\user>` prompt. No decorative terminal introduction.                                                                            |
| Panels        | Terminal left and GUI right on desktop. Stack vertically below the mobile breakpoint.                                                              |
| Themes        | Light/dark; initial choice follows the system preference, then the stored choice. macOS light terminal is white; Windows uses a dark console.      |
| Navigation    | Terminal and explorer always share the same current folder within a platform session.                                                              |
| Sessions      | macOS and Windows each keep independent files, location, and command history.                                                                      |
| Guidance      | A searchable header command guide compares both platforms and prepares a command without executing it.                                             |
| Removed UI    | No guided lesson cards, free-practice mode selector, or quick-command cards below the workspace.                                                   |
| Deployment    | Modular static files and a self-contained single-HTML distribution. Both work without a server.                                                    |

## Explorer interactions

- Single click selects a file or folder and highlights it.
- Double-click opens it. Enter opens the focused item; Space retains the normal button selection behavior.
- Favorites and breadcrumbs navigate with one click, as do back/up buttons.
- Grid/list controls change presentation without changing files.
- Search filters the current folder. Navigating clears the search.
- The GUI shows dotfiles for learning, even when plain `ls` does not.
- File size labels use UTF-8 byte counts. The document status counts JavaScript string length; these are not necessarily equal.

Opening a folder changes the location and records an equivalent `cd` entry marked as originating from the explorer. Opening a file leaves the location unchanged.

## Text application window

The auto-saving text editor is a child of `.explorer-pane`, at 95% of its full width and height, with a window border and shadow. It covers the underlying explorer title, navigation, sidebar and footer; those controls are inert until the editor is minimized or closed. The terminal remains available.

- Windows uses a Notepad identity and minimize/maximize/close controls on the right.
- macOS uses a TextEdit identity and red/yellow/green controls on the left.
- Minimize hides the window and reveals a restore button in the same right pane.
- Maximize fills the entire right pane, including the sidebar region; it stays clear of the terminal. The same control restores the inset size.
- Double-clicking the document title bar also toggles maximize/restore.
- Close and Escape from inside the document return focus to the selected file when it remains available.
- Terminal commands continue working while a document is open. The reader updates when its file content changes.
- Navigating to another folder closes the current document. Deleting or renaming the open path causes the reader to close on render.
- Notes and code share one editor: `.txt` uses plain text, `.py` uses Python syntax colors. Other extensions fall back to plain text.
- Valid edits save automatically; Save and Ctrl/Cmd+S also save with confirmation while the editor is visible, even when a window control has focus. It does not drag windows, implement rich text, or launch a host application.

All controls and content follow the selected theme. Do not implement decorative controls that imply unsupported actions.

## Terminal interaction

- Enter submits a command. The guide only inserts text and asks the learner to press Enter.
- Arrow Up/Down browse history and preserve an unfinished draft.
- Tab completes commands or paths when the input is nonempty. Shift + Tab leaves the field.
- Ctrl/Cmd + L clears visible output; Ctrl + C cancels the current input.
- Clearing output does not clear files, history, or the current folder.
- Clicking empty terminal space focuses the input. Fine-pointer desktop sessions focus it initially.
- File contents, including HTML-looking text, are always displayed as text.

The status bar explains the last operation or directs the learner to the terminal error. There is no network/process execution behind the UI.

## Reset, migration, and storage

Reset requires confirmation in the UI and restores only the selected platform's sample filesystem and history. It leaves the other platform's files in place.

Old sessions may contain `/Users/alex` and Spanish sample names. They are upgraded to the current home and English stock file names without discarding customized contents. A translation must not silently rewrite arbitrary learner-authored text.

Storage may be unavailable in private browsing, under `file://` policies, or when quotas are exceeded. The active practice should continue in memory with an explanatory notification.

## Limits of realism

The macOS appearance is inspired by a plain Terminal window, not a themed shell. The hostname and login timestamp are simulated; they are not read from the machine. System folder names and command output are intentionally simplified.

The virtual macOS filesystem distinguishes case. A real Mac's case behavior depends on its volume format. The Windows simulation ignores case for paths and command names.

Native OS execution, real disk access, networking, shell variables, pipelines, wildcard expansion, symbolic links, permissions, and non-Python scripts are outside the current scope. These are documented limits, not implicit features for the next agent to build.
