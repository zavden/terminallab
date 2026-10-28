(function () {
  "use strict";
  const { VirtualShell, HOME, parent, basename } = window.TerminalLab;
  const $ = (id) => document.getElementById(id);
  const icons = {
    book: '<path d="M3 4h6a4 4 0 0 1 3 1.5A4 4 0 0 1 15 4h6v15h-6a4 4 0 0 0-3 1.5A4 4 0 0 0 9 19H3z"/><path d="M12 6v14"/>',
    moon: '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
    windows:
      '<path d="m3 5 8-1v7H3zm10-1 8-1v8h-8zM3 13h8v7l-8-1zm10 0h8v8l-8-1z" fill="currentColor" stroke="none"/>',
    apple:
      '<path d="M16 3c-.2 2-1.3 3.4-3.2 3.5C12.5 4.8 13.7 3.3 16 3ZM19.7 16.5c-.6 1.7-2 4.5-3.6 4.5-1 0-1.8-.7-3-.7s-2 .7-3 .7C7.6 21 4 15.8 4 11.9c0-3.1 2-5.1 4.3-5.1 1.4 0 2.5.8 3.4.8s2.5-.9 4-.8c1.7 0 3 .9 3.8 2.1-3.1 1.8-2.8 5.7.2 7.6Z" fill="currentColor" stroke="none"/>',
    reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    terminal:
      '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3m6 0h4"/>',
    folder:
      '<path d="M3 7V5a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7h18"/>',
    enter: '<path d="M20 5v7H4m5-5-5 5 5 5"/>',
    clear: '<path d="m15 3 6 6-10 11H6l-4-4zM8 10l7 7m-4 3h10"/>',
    back: '<path d="m14 5-7 7 7 7"/>',
    right: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    up: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
    desktop:
      '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5"/>',
    file: '<path d="M14 2H5v20h14V7zm0 0v5h5M8 12h8m-8 4h6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',
    shield:
      '<path d="m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5z"/><path d="m8 11 3 3 5-5"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    link: '<path d="m10 14 4-4m-6 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 2 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(2 -1) scale(.9)"/>',
    spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
    minimize: '<path d="M5 12h14"/>',
    maximize: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`;
  function hydrate(scope = document) {
    scope.querySelectorAll("[data-icon]").forEach((el) => {
      el.innerHTML = icon(el.dataset.icon);
    });
  }
  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  function iconEl(name) {
    const node = el("span");
    node.innerHTML = icon(name);
    return node;
  }
  const folderArt =
    '<svg class="file-art" viewBox="0 0 64 52" aria-hidden="true"><path class="folder-back" d="M3 10a4 4 0 0 1 4-4h17l7 7h26a4 4 0 0 1 4 4v29H3Z"/><path class="folder-front" d="M3 21a4 4 0 0 1 4-4h50a4 4 0 0 1 4 4v25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z"/><path d="M7 19h50" stroke="#fff" opacity=".25"/></svg>';
  const fileArt =
    '<svg class="file-art" viewBox="0 0 64 52" aria-hidden="true"><path class="file-sheet" d="M17 3h22l10 10v36H17Z"/><path class="file-sheet" d="M39 3v11h10"/><path class="file-lines" d="M24 23h18M24 29h18M24 35h13"/></svg>';
  const reference = [
    { title: "python · Run a program", desc: "Run a saved Python file with a relative or absolute path. Double-click files to edit; changes save automatically. Prepare input() answers with Python input. Stop cancels a run.", mac: "python3 hello_world.py", windows: "python hello_world.py", aliases: "python python3 py" },
    {
      title: "See where you are",
      desc: "A path is the address of a folder. pwd shows your current path.",
      mac: "pwd",
      windows: "pwd",
      aliases: "Get-Location",
    },
    {
      title: "List the contents",
      desc: "Lists files and folders without changing your location. In PowerShell, ls is an alias for Get-ChildItem.",
      mac: "ls",
      windows: "ls",
      aliases: "dir Get-ChildItem",
    },
    {
      title: "Enter a folder",
      desc: "cd means change directory. Use the name of a folder that exists in your current location.",
      mac: "cd Documents",
      windows: "cd Documents",
      aliases: "Set-Location",
    },
    {
      title: "Go up one level",
      desc: "Two dots (..) represent the parent folder: the folder containing your current one.",
      mac: "cd ..",
      windows: "cd ..",
    },
    {
      title: "Return to your home folder",
      desc: "~ represents your home folder. Here, it belongs to the user user.",
      mac: "cd ~",
      windows: "cd ~",
    },
    {
      title: "Create a folder",
      desc: "mkdir creates a folder in your current location. It does not move you into it.",
      mac: "mkdir my-project",
      windows: "mkdir my-project",
      aliases: "md New-Item Directory",
    },
    {
      title: "Create a file",
      desc: "touch preserves the contents if the file already exists. PowerShell does not include touch: use New-Item.",
      mac: "touch note.txt",
      windows: "New-Item note.txt -ItemType File",
      aliases: "ni",
    },
    {
      title: "Display text",
      desc: "echo prints text in the terminal. Quotation marks keep words together.",
      mac: 'echo "Hello, world"',
      windows: 'echo "Hello, world"',
      aliases: "Write-Output",
    },
    {
      title: "Write to a file",
      desc: "> saves output to a file. It replaces the contents of an existing file, or creates a new one.",
      mac: 'echo "My first note" > note.txt',
      windows: 'echo "My first note" > note.txt',
    },
    {
      title: "Append a line",
      desc: ">> adds text at the end without erasing the existing contents.",
      mac: 'echo "One more idea" >> note.txt',
      windows: 'echo "One more idea" >> note.txt',
    },
    {
      title: "Read a file",
      desc: "cat displays a file’s contents without changing them. You can also open the file in the explorer.",
      mac: "cat note.txt",
      windows: "cat note.txt",
      aliases: "type Get-Content",
    },
    {
      title: "Copy a file",
      desc: "Write the source first, then the destination. The original is preserved.",
      mac: "cp note.txt copy.txt",
      windows: "cp note.txt copy.txt",
      aliases: "Copy-Item copy",
    },
    {
      title: "Move or rename",
      desc: "If the destination is an existing folder, the file moves inside it. A new name renames the file.",
      mac: "mv copy.txt memory.txt",
      windows: "mv copy.txt memory.txt",
      aliases: "Move-Item move Rename-Item",
    },
    {
      title: "Delete a file",
      desc: "rm deletes a file. Here it only affects your practice; in a real terminal, deletion can be permanent.",
      mac: "rm memory.txt",
      windows: "rm memory.txt",
      aliases: "Remove-Item del",
    },
    {
      title: "Delete a folder and its contents",
      desc: "The recursive option includes everything inside. Leave the folder before deleting it.",
      mac: "rm -r my-project",
      windows: "rm my-project -Recurse",
    },
    {
      title: "Copy a folder and its contents",
      desc: "The recursive option also copies every file and subfolder.",
      mac: "cp -r my-project backup",
      windows: "cp my-project backup -Recurse",
    },
    {
      title: "Use names with spaces",
      desc: "Put the full name in quotes so it is treated as one argument.",
      mac: 'mkdir "My ideas"',
      windows: 'mkdir "My ideas"',
    },
    {
      title: "Use an absolute path",
      desc: "An absolute path starts at the root: / on macOS or C:\\ on Windows. It works from any folder.",
      mac: "cd /Users/user/Documents",
      windows: "cd C:\\Users\\user\\Documents",
    },
    {
      title: "Show hidden items",
      desc: "Files starting with a dot also exist in this lab. Use these options to list them.",
      mac: "ls -la",
      windows: "ls -Force",
    },
    {
      title: "Clear the screen",
      desc: "Clears terminal text while keeping your files and current location. You can also press Ctrl + L.",
      mac: "clear",
      windows: "cls",
      aliases: "Clear-Host",
    },
  ];
  const STORAGE = "terminal-lab:v1";
  let preferences = {
    platform: /Windows/.test(navigator.userAgent) ? "windows" : "mac",
    theme: matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    view: "grid",
  };
  const newSession = (mode) => ({
    shell: new VirtualShell(mode),
    showLogin: true,
    history: [],
    logs: [],
    back: [],
    openFile: null,
    documentMinimized: false,
    documentMaximized: false,
    selectedPath: null,
    pythonInput: "",
  });
  const sessions = { mac: newSession("mac"), windows: newSession("windows") };
  let storageUnavailable = false,
    recovered = false;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw && raw.length < 4000000) {
      const saved = JSON.parse(raw);
      if (["mac", "windows"].includes(saved.preferences?.platform))
        preferences.platform = saved.preferences.platform;
      if (["light", "dark"].includes(saved.preferences?.theme))
        preferences.theme = saved.preferences.theme;
      if (saved.preferences?.view === "list") preferences.view = "list";
      for (const mode of ["mac", "windows"]) {
        const data = saved[mode];
        if (!data) continue;
        const legacyHome = "/Users/alex";
        const renameHome = (value) =>
          typeof value === "string" &&
          (value === legacyHome || value.startsWith(legacyHome + "/"))
            ? HOME + value.slice(legacyHome.length)
            : value;
        const filesystem = data.filesystem;
        if (
          Array.isArray(filesystem?.nodes) &&
          filesystem.nodes.some(
            (entry) => Array.isArray(entry) && entry[0] === legacyHome,
          ) &&
          !filesystem.nodes.some(
            (entry) => Array.isArray(entry) && entry[0] === HOME,
          )
        ) {
          filesystem.cwd = renameHome(filesystem.cwd);
          filesystem.nodes = filesystem.nodes.map((entry) =>
            Array.isArray(entry) ? [renameHome(entry[0]), entry[1]] : entry,
          );
          if (Array.isArray(data.logs))
            data.logs.forEach((entry) => {
              if (!entry || typeof entry !== "object") return;
              entry.path = renameHome(entry.path);
              if (typeof entry.output === "string")
                entry.output = entry.output
                  .replaceAll(legacyHome, HOME)
                  .replaceAll("C:\\Users\\alex", "C:\\Users\\user");
              if (entry.output === "alex") entry.output = "user";
            });
        }
        if (!sessions[mode].shell.restore(filesystem)) {
          recovered = true;
          continue;
        }
        sessions[mode].history = Array.isArray(data.history)
          ? data.history
              .filter((x) => typeof x === "string" && x.length <= 4096)
              .slice(-100)
          : [];
        sessions[mode].logs = Array.isArray(data.logs)
          ? data.logs
              .filter(
                (x) =>
                  x &&
                  ["command", "path", "output"].every(
                    (k) => typeof x[k] === "string",
                  ) &&
                  x.command.length <= 4096 &&
                  x.path.length < 8000 &&
                  x.output.length <= 8000,
              )
              .slice(-70)
              .map((x) => ({
                command: x.command,
                path: x.path,
                output: x.output,
                ok: x.ok !== false,
                gui: x.gui === true,
              }))
          : [];
      }
    } else if (raw) recovered = true;
  } catch {
    storageUnavailable = true;
  }
  let active = sessions[preferences.platform],
    historyIndex = active.history.length,
    draft = "",
    toastTimer;
  function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 4000);
  }
  function save() {
    try {
      const data = { preferences };
      for (const mode of ["mac", "windows"]) {
        const s = sessions[mode];
        data[mode] = {
          filesystem: s.shell.snapshot(),
          history: s.history,
          logs: s.logs,
        };
      }
      localStorage.setItem(STORAGE, JSON.stringify(data));
    } catch {
      if (!storageUnavailable)
        toast(
          "Your browser cannot save more data. You can keep practicing in this tab.",
        );
      storageUnavailable = true;
    }
  }
  function setTheme() {
    document.documentElement.dataset.theme = preferences.theme;
    $("theme-toggle").innerHTML = icon(
      preferences.theme === "dark" ? "sun" : "moon",
    );
    $("theme-toggle").setAttribute(
      "aria-label",
      `Switch to ${preferences.theme === "dark" ? "light" : "dark"} theme`,
    );
  }
  function promptText(path = active.shell.cwd) {
    return preferences.platform === "windows"
      ? "PS " + active.shell.display(path) + ">"
      : `user@MacBook-Air ${path === HOME ? "~" : basename(path)} %`;
  }
  function renderLog(entry) {
    const node = el("div", "output-entry");
    node.append(el("div", "output-prompt", promptText(entry.path) + " "));
    const command = el("div", "output-command", entry.command);
    if (entry.gui)
      command.append(el("span", "output-source", "from the explorer"));
    node.append(command);
    if (entry.output)
      node.append(
        el(
          "pre",
          "output-text" + (entry.ok ? "" : " output-error"),
          entry.output,
        ),
      );
    return node;
  }
  function scrollTerminal() {
    const box = $("terminal-scroll");
    box.scrollTop = box.scrollHeight;
  }
  function renderTerminal() {
    $("terminal-output").replaceChildren(...active.logs.map(renderLog));
    $("mac-login").hidden = preferences.platform !== "mac" || !active.showLogin;
    $("command-input").placeholder = "";
    $("terminal-heading").textContent =
      preferences.platform === "mac"
        ? `${active.shell.cwd === HOME ? "user" : basename(active.shell.cwd)} — -zsh — 80×24`
        : "Windows Terminal";
    $("prompt-label").textContent = promptText();
    $("prompt-symbol").textContent =
      preferences.platform === "windows" ? ">" : "%";
    scrollTerminal();
  }
  function renderExplorer() {
    renderDocument();
    const shell = active.shell;
    const crumbs = $("breadcrumbs");
    crumbs.replaceChildren();
    const parts = shell.cwd.split("/").filter(Boolean);
    const rootButton = el(
      "button",
      "",
      preferences.platform === "windows" ? "C:" : "/",
    );
    rootButton.addEventListener("click", () => navigate("/"));
    crumbs.append(rootButton);
    let path = "";
    parts.forEach((part) => {
      path += "/" + part;
      const target = path;
      const button = el("button", "", part);
      button.addEventListener("click", () => navigate(target));
      crumbs.append(el("span", "breadcrumb-separator", "›"), button);
    });
    crumbs.lastElementChild?.setAttribute("aria-current", "location");
    crumbs.scrollLeft = crumbs.scrollWidth;
    $("folder-title").textContent =
      basename(shell.cwd) === "/"
        ? preferences.platform === "windows"
          ? "Local Disk (C:)"
          : "Macintosh HD"
        : basename(shell.cwd);
    $("go-up").disabled = shell.cwd === "/";
    $("go-back").disabled = !active.back.some(
      (p) => shell.get(p)?.type === "dir" && p !== shell.cwd,
    );
    document.querySelectorAll("[data-shortcut]").forEach((button) => {
      const target = shell.resolve(button.dataset.shortcut);
      button.classList.toggle("active", shell.cwd === target);
      button.disabled = shell.get(target)?.type !== "dir";
      if (shell.cwd === target) button.setAttribute("aria-current", "location");
      else button.removeAttribute("aria-current");
    });
    const all = shell.list(shell.cwd, true),
      query = $("file-search").value.toLocaleLowerCase();
    const items = all.filter((item) =>
      item.name.toLocaleLowerCase().includes(query),
    );
    $("file-count").textContent =
      (query ? `${items.length} of ${all.length}` : String(all.length)) +
      (all.length === 1 ? " item" : " items");
    const grid = $("file-grid");
    grid.classList.toggle("list", preferences.view === "list");
    grid.replaceChildren();
    $("grid-view").setAttribute(
      "aria-pressed",
      String(preferences.view === "grid"),
    );
    $("list-view").setAttribute(
      "aria-pressed",
      String(preferences.view === "list"),
    );
    if (!items.length) {
      const empty = el("div", "empty-folder");
      empty.append(
        iconEl(query ? "search" : "folder"),
        el(
          "p",
          "",
          query ? "No matches found." : "An empty folder. A fresh start.",
        ),
        el(
          "p",
          "",
          query ? "Try another name." : "Create something from the terminal.",
        ),
      );
      grid.append(empty);
    }
    items.forEach((item) => {
      const button = el("button", "file-item");
      button.dataset.path = item.path;
      button.setAttribute(
        "aria-pressed",
        String(active.selectedPath === item.path),
      );
      button.title = `Double-click to open ${item.name}`;
      button.setAttribute(
        "aria-label",
        `${item.type === "dir" ? "Open folder" : "View file"} ${item.name}`,
      );
      const art = el("span");
      art.innerHTML = item.type === "dir" ? folderArt : fileArt;
      const size =
        item.type === "dir"
          ? "Folder"
          : `${new TextEncoder().encode(item.content).length} B`;
      button.append(
        art,
        el("span", "file-name", item.name),
        el("span", "file-size", size),
      );
      const openItem = () =>
        item.type === "dir" ? navigate(item.path) : preview(item.path);
      button.addEventListener("click", () => {
        active.selectedPath = item.path;
        grid
          .querySelectorAll(".file-item")
          .forEach((node) =>
            node.setAttribute("aria-pressed", String(node === button)),
          );
      });
      button.addEventListener("dblclick", openItem);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          openItem();
        }
      });
      grid.append(button);
    });
  }
  function renderAll() {
    document.documentElement.dataset.platform = preferences.platform;
    const windows = preferences.platform === "windows";
    document
      .querySelectorAll("[data-platform-choice]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.platformChoice === preferences.platform),
        ),
      );
    $("platform-label").textContent = windows
      ? "Windows · PowerShell"
      : "macOS · zsh";
    $("shell-label").textContent = windows ? "— PowerShell" : "— zsh";
    $("terminal-heading").textContent = windows
      ? "Windows Terminal"
      : "Terminal";
    $("explorer-heading").textContent = windows ? "File Explorer" : "Finder";
    setTheme();
    renderTerminal();
    renderExplorer();
  }
  function insert(command) {
    $("command-input").value = command;
    $("command-input").focus({ preventScroll: true });
    $("command-input").setSelectionRange(command.length, command.length);
    scrollTerminal();
    toast("Command ready. Press Enter to run it.");
  }
  let pythonJob = null;
  function execute(command, gui = false, recordBack = true) {
    if (pythonJob) { toast("Stop Python before changing files or folders."); return; }
    if (!command.trim()) return;
    const before = active.shell.cwd,
      result = active.shell.execute(command);
    if (result.ok && result.action === "python") {
      runPython(command, result);
      return result;
    }
    if (!gui) {
      active.history.push(command);
      active.history = active.history.slice(-100);
    }
    historyIndex = active.history.length;
    draft = "";
    if (result.clear) {
      active.logs = [];
      active.showLogin = false;
    } else {
      const fullOutput = result.output || "";
      const entry = {
        command,
        path: before,
        output:
          fullOutput.length > 7900
            ? fullOutput.slice(0, 7900) +
              "\n… Output shortened. Open the file to see its full contents."
            : fullOutput,
        ok: result.ok,
        gui,
      };
      active.logs.push(entry);
      active.logs = active.logs.slice(-70);
    }
    if (result.ok && before !== active.shell.cwd) {
      if (recordBack) {
        active.back.push(before);
        active.back = active.back.slice(-80);
      }
      $("file-search").value = "";
      active.openFile = null;
      active.selectedPath = null;
    }
    $("connection-text").textContent = result.ok
      ? result.explanation || "The terminal and explorer share the same files."
      : "No changes were made. Read the hint in the terminal and try again.";
    $("command-input").value = "";
    renderTerminal();
    renderExplorer();
    save();
    return result;
  }
  function setPythonBusy(busy) {
    $("python-stop").hidden = !busy;
    $("preview-content").readOnly = busy;
    $("run-python").disabled = busy;
    $("save-file").disabled = busy;
  }
  async function runPython(command, result) {
    const session = active;
    session.history.push(command);
    session.history = session.history.slice(-100);
    historyIndex = session.history.length;
    const entry = { command, path: session.shell.cwd, output: "Loading local Python…", ok: true, gui: false };
    session.logs.push(entry);
    session.logs = session.logs.slice(-70);
    $("command-input").value = "";
    setPythonBusy(true);
    renderTerminal();
    const job = TerminalPython.start({snapshot:session.shell.snapshot(), path:result.path, args:result.args, stdin:session.pythonInput}, message => {
      entry.output = message.type === "running" ? "Running Python…" : message.output;
      if (active === session) renderTerminal();
    });
    pythonJob = job;
    const response = await job.done;
    entry.output = response.output || "";
    entry.ok = response.ok;
    if (response.snapshot && !session.shell.restore(response.snapshot)) {
      entry.output += "\nPython file changes could not be saved: invalid paths or lab limits exceeded.";
      entry.ok = false;
    }
    if (pythonJob === job) pythonJob = null;
    setPythonBusy(false);
    renderAll();
    save();
  }
  // Presentation only: Python is still executed exclusively by the worker.
  const pythonKeywords = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case".split(" "));
  const pythonBuiltins = new Set("abs all any bool dict enumerate float input int len list max min open print range reversed round set sorted str sum tuple type zip super isinstance Exception ValueError TypeError".split(" "));
  function highlightEditor() {
    const input = $("preview-content");
    const python = active.openFile?.toLowerCase().endsWith(".py");
    $("text-app").dataset.language = python ? "python" : "text";
    $("document-format").textContent = python ? "Python" : "Plain text";
    const layer = $("editor-highlight");
    layer.hidden = !python;
    if (!python) { layer.replaceChildren(); return; }
    const source = input.value;
    const fragment = document.createDocumentFragment();
    // Sticky tokenization keeps incomplete source editable and avoids HTML parsing.
    const tokens = /\s+|#[^\n]*|(?:[rRuUbBfF]{1,2})?["']|(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?[\d_]+)?[jJ]?)|[A-Za-z_]\w*|[+*%=<>!&|^~:/-]+|./gy;
    let token, plain = "";
    const flush = () => { if (plain) { fragment.append(document.createTextNode(plain)); plain = ""; } };
    while ((token = tokens.exec(source))) {
      let value = token[0], kind = "";
      if (/^[rRuUbBfF]{0,2}["']$/.test(value)) {
        const quote = value.at(-1);
        const start = tokens.lastIndex - 1;
        const triple = source.startsWith(quote.repeat(3), start);
        const delimiter = quote.repeat(triple ? 3 : 1);
        let end = start + delimiter.length;
        while (end < source.length) {
          if (source.startsWith(delimiter, end)) { end += delimiter.length; break; }
          if (!triple && source[end] === "\n") break;
          if (source[end] === "\\") end++;
          end++;
        }
        tokens.lastIndex = Math.min(end, source.length);
        value = source.slice(token.index, tokens.lastIndex);
        kind = "string";
      } else if (value.startsWith("#")) kind = "comment";
      else if (pythonKeywords.has(value)) kind = "keyword";
      else if (pythonBuiltins.has(value)) kind = "builtin";
      else if (/^(?:\d|\.\d)/.test(value)) kind = "number";
      else if (/^[+*%=<>!&|^~:/-]+$/.test(value)) kind = "operator";
      if (kind) { flush(); fragment.append(el("span", "syntax-" + kind, value)); }
      else plain += value;
    }
    flush();
    // Match the textarea's final empty line without changing saved file contents.
    fragment.append(document.createTextNode("\n"));
    layer.replaceChildren(fragment);
    syncEditorScroll();
  }
  function syncEditorScroll() {
    $("editor-highlight").scrollTop = $("preview-content").scrollTop;
    $("editor-highlight").scrollLeft = $("preview-content").scrollLeft;
  }
  function saveEditor() {
    if (!active.openFile || pythonJob) return;
    const result = active.shell.writeFile(active.openFile, $("preview-content").value);
    if (!result.ok) {
      toast(result.output);
      renderDocument();
      return;
    }
    highlightEditor();
    $("save-status").textContent = "Saved";
    $("document-count").textContent = `${$("preview-content").value.length.toLocaleString("en-US")} characters`;
    save();
    return true;
  }
  function confirmEditorSave() {
    if (saveEditor()) toast(storageUnavailable ? "File saved in this tab. Browser storage is unavailable." : "File saved.");
  }
  function shellQuote(value) {
    return (
      "'" +
      (preferences.platform === "windows"
        ? value.replaceAll("'", "''")
        : value.replaceAll("'", "'\\''")) +
      "'"
    );
  }
  function navigate(path, recordBack = true) {
    if (path === active.shell.cwd) return;
    execute("cd " + shellQuote(active.shell.display(path)), true, recordBack);
  }
  function renderDocument() {
    const path = active.openFile;
    const file = path ? active.shell.get(path) : null;
    if (file?.type !== "file") active.openFile = null;
    const opened = !!active.openFile;
    const visible = opened && !active.documentMinimized;
    document
      .querySelector(".explorer-pane")
      .classList.toggle("document-open", visible);
    $("text-app").hidden = !visible;
    $("text-app").classList.toggle("maximized", active.documentMaximized);
    $("restore-file").hidden = !opened || !active.documentMinimized;
    for (const selector of [".explorer-bar", ".explorer-toolbar", ".explorer-body", ".explorer-footer"])
      document.querySelector(selector).inert = visible;
    const windows = preferences.platform === "windows";
    $("explorer-heading").textContent = windows ? "File Explorer" : "Finder";
    if (!opened) return;
    $("document-window-title").textContent =
      `${windows ? "Notepad" : "TextEdit"} — ${basename(path)}`;
    $("preview-title").textContent = basename(path);
    $("preview-path").textContent = active.shell.display(path);
    $("text-app").title = active.shell.display(path);
    if ($("preview-content").value !== file.content) $("preview-content").value = file.content;
    $("run-python").hidden = !path.toLowerCase().endsWith(".py");
    highlightEditor();
    $("document-count").textContent =
      `${file.content.length.toLocaleString("en-US")} characters`;
    $("restore-file-label").textContent =
      `${basename(path)} — ${windows ? "Notepad" : "TextEdit"}`;
    const maximizeLabel = active.documentMaximized
      ? "Restore file window"
      : "Maximize file";
    $("maximize-file").setAttribute("aria-label", maximizeLabel);
    $("maximize-file").title = active.documentMaximized
      ? "Restore"
      : "Maximize";
    $("maximize-file").setAttribute(
      "aria-pressed",
      String(active.documentMaximized),
    );
  }
  function preview(path) {
    if (active.shell.get(path)?.type !== "file") return;
    document.querySelector(".files-area").scrollTop = 0;
    active.openFile = path;
    active.documentMinimized = false;
    active.documentMaximized = false;
    renderDocument();
    $("preview-content").focus({ preventScroll: true });
  }
  function closeDocument() {
    active.openFile = null;
    renderExplorer();
    const selected = [...$("file-grid").querySelectorAll(".file-item")].find(
      (node) => node.dataset.path === active.selectedPath,
    );
    selected?.focus({ preventScroll: true });
  }
  function renderReference() {
    const query = $("reference-search").value.toLocaleLowerCase();
    const rows = reference
      .filter((row) =>
        Object.values(row).join(" ").toLocaleLowerCase().includes(query),
      )
      .map((row) => {
        const block = el("section", "reference-row");
        block.append(el("h3", "", row.title), el("p", "", row.desc));
        const examples = el("div", "reference-examples");
        for (const mode of ["mac", "windows"]) {
          const button = el(
            "button",
            "reference-example" +
              (preferences.platform === mode ? " active-example" : ""),
          );
          button.append(
            el(
              "small",
              "",
              mode === "mac" ? "macOS · zsh" : "Windows · PowerShell",
            ),
            el("code", "", row[mode]),
          );
          button.addEventListener("click", () => {
            if (preferences.platform !== mode) switchPlatform(mode);
            $("reference-dialog").close();
            insert(row[mode]);
          });
          examples.append(button);
        }
        block.append(examples);
        return block;
      });
    $("reference-list").replaceChildren(
      ...(rows.length
        ? rows
        : [
            el(
              "p",
              "empty-folder",
              "No matches found. Try “create”, “folder”, or “cd”.",
            ),
          ]),
    );
  }
  function openReference() {
    $("reference-search").value = "";
    renderReference();
    $("reference-dialog").showModal();
  }
  function switchPlatform(mode) {
    if (mode === preferences.platform) return;
    if (pythonJob) { toast("Stop Python before switching systems."); return; }
    save();
    preferences.platform = mode;
    active = sessions[mode];
    historyIndex = active.history.length;
    draft = "";
    $("command-input").value = "";
    $("file-search").value = "";
    renderAll();
    save();
    $("connection-text").textContent =
      "Each system keeps its own files. Keep exploring.";
  }
  function complete() {
    const input = $("command-input"),
      value = input.value;
    if (!value.trim()) return;
    const match = value.match(/(?:^|\s)("[^"]*|'[^']*|[^\s]*)$/);
    if (!match) return;
    const raw = match[1],
      prefix = value.slice(0, value.length - raw.length);
    let suggestions = [],
      quoted = raw.startsWith('"') || raw.startsWith("'"),
      fragment = quoted ? raw.slice(1) : raw;
    if (!prefix) {
      const commands =
        preferences.platform === "mac"
          ? [
              "cd",
              "pwd",
              "ls",
              "mkdir",
              "touch",
              "echo",
              "cat",
              "cp",
              "mv",
              "rm",
              "rmdir",
              "clear",
              "python",
              "python3",
              "py",
              "help",
              "whoami",
            ]
          : [
              "cd",
              "pwd",
              "ls",
              "mkdir",
              "New-Item",
              "echo",
              "cat",
              "cp",
              "mv",
              "rm",
              "rmdir",
              "cls",
              "python",
              "python3",
              "py",
              "help",
              "Get-ChildItem",
              "Set-Location",
              "Get-Content",
              "Copy-Item",
              "Move-Item",
              "Remove-Item",
            ];
      suggestions = commands.filter((c) =>
        c.toLowerCase().startsWith(fragment.toLowerCase()),
      );
      if (suggestions.length === 1) input.value = suggestions[0] + " ";
    } else {
      try {
        const normalized =
          preferences.platform === "windows"
            ? fragment.replaceAll("\\", "/")
            : fragment;
        const slash = normalized.lastIndexOf("/"),
          directory = slash >= 0 ? normalized.slice(0, slash + 1) : ".",
          base = normalized.slice(slash + 1);
        const folder = active.shell.resolve(directory),
          onlyDirectories = /^(cd|Set-Location)\s/i.test(prefix);
        const entries = active.shell
          .list(folder, true)
          .filter(
            (item) =>
              (!onlyDirectories || item.type === "dir") &&
              (preferences.platform === "windows"
                ? item.name.toLowerCase().startsWith(base.toLowerCase())
                : item.name.startsWith(base)),
          );
        suggestions = entries.map((item) => item.name);
        if (entries.length === 1) {
          const replacement =
            (slash >= 0 ? normalized.slice(0, slash + 1) : "") +
            entries[0].name;
          input.value = prefix + shellQuote(replacement) + " ";
        }
      } catch {
        suggestions = [];
      }
    }
    if (suggestions.length > 1) toast("Matches: " + suggestions.join(" · "));
    else if (!suggestions.length)
      toast("No completion matches. Use ls to see the available names.");
    input.setSelectionRange(input.value.length, input.value.length);
  }
  const loginDate = new Date();
  const stamp = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
    .format(loginDate)
    .replaceAll(",", "");
  $("mac-login").textContent =
    `Last login: ${stamp} ${loginDate.toLocaleTimeString("en-GB", { hour12: false })} on ttys000`;
  hydrate();
  renderAll();
  if (matchMedia("(pointer: fine)").matches)
    $("command-input").focus({ preventScroll: true });
  $("terminal-scroll").addEventListener("click", (event) => {
    if (event.target === $("terminal-scroll"))
      $("command-input").focus({ preventScroll: true });
  });
  $("terminal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    execute($("command-input").value);
    $("command-input").focus({ preventScroll: true });
  });
  $("command-input").addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === active.history.length) draft = event.target.value;
      historyIndex = Math.max(
        0,
        Math.min(
          active.history.length,
          historyIndex + (event.key === "ArrowUp" ? -1 : 1),
        ),
      );
      event.target.value = active.history[historyIndex] ?? draft;
      event.target.setSelectionRange(
        event.target.value.length,
        event.target.value.length,
      );
    }
    if (event.key === "Tab" && !event.shiftKey && event.target.value.trim()) {
      event.preventDefault();
      complete();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      active.logs = [];
      active.showLogin = false;
      renderTerminal();
      save();
    }
    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      pythonJob?.stop();
      event.target.value = "";
    }
  });
  $("terminal-clear").addEventListener("click", () => {
    active.logs = [];
    active.showLogin = false;
    renderTerminal();
    save();
    $("command-input").focus();
  });
  document
    .querySelectorAll("[data-platform-choice]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        switchPlatform(button.dataset.platformChoice),
      ),
    );
  $("theme-toggle").addEventListener("click", () => {
    preferences.theme = preferences.theme === "light" ? "dark" : "light";
    setTheme();
    save();
  });
  document
    .querySelectorAll("[data-shortcut]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        navigate(active.shell.resolve(button.dataset.shortcut)),
      ),
    );
  $("go-up").addEventListener("click", () =>
    navigate(parent(active.shell.cwd)),
  );
  $("go-back").addEventListener("click", () => {
    let target;
    do {
      target = active.back.pop();
    } while (
      target &&
      (active.shell.get(target)?.type !== "dir" || target === active.shell.cwd)
    );
    if (target) navigate(target, false);
  });
  $("file-search").addEventListener("input", renderExplorer);
  for (const view of ["grid", "list"])
    $(view + "-view").addEventListener("click", () => {
      preferences.view = view;
      renderExplorer();
      save();
    });
  $("preview-content").addEventListener("input", saveEditor);
  $("preview-content").addEventListener("keydown", event => {
    if (event.key === "Tab" && !event.shiftKey && !pythonJob) {
      event.preventDefault();
      const input = event.target;
      input.setRangeText("    ", input.selectionStart, input.selectionEnd, "end");
      saveEditor();
    }
  });
  $("preview-content").addEventListener("scroll", syncEditorScroll);
  $("save-file").addEventListener("click", confirmEditorSave);
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" &&
        active.openFile && !active.documentMinimized && !document.querySelector("dialog[open]")) {
      event.preventDefault();
      if (!event.repeat) confirmEditorSave();
    }
  });
  $("run-python").addEventListener("click", () => {
    if (active.openFile) execute("python " + shellQuote(active.shell.display(active.openFile)));
  });
  $("python-stop").addEventListener("click", () => pythonJob?.stop());
  $("python-input-open").addEventListener("click", () => {
    $("python-stdin").value = active.pythonInput;
    $("python-input-dialog").showModal();
  });
  $("python-stdin").addEventListener("input", () => { active.pythonInput = $("python-stdin").value; });
  $("close-file").addEventListener("click", closeDocument);
  $("minimize-file").addEventListener("click", () => {
    active.documentMinimized = true;
    renderDocument();
    $("restore-file").focus({ preventScroll: true });
  });
  $("restore-file").addEventListener("click", () => {
    active.documentMinimized = false;
    renderDocument();
    $("preview-content").focus({ preventScroll: true });
  });
  function toggleDocumentSize() {
    active.documentMaximized = !active.documentMaximized;
    renderDocument();
  }
  $("maximize-file").addEventListener("click", toggleDocumentSize);
  document
    .querySelector(".document-titlebar")
    .addEventListener("dblclick", (event) => {
      if (!event.target.closest("button")) toggleDocumentSize();
    });
  $("text-app").addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDocument();
    }
  });
  let workspaceExpanded = false, normalScrollY = 0;
  function setWorkspaceExpanded(expanded) {
    if (expanded === workspaceExpanded) return;
    if (expanded) normalScrollY = window.scrollY;
    workspaceExpanded = expanded;
    document.body.classList.toggle("workspace-expanded", expanded);
    $("workspace-expand").setAttribute("aria-pressed", String(expanded));
    $("workspace-collapse").hidden = !expanded;
    (expanded ? $("workspace-collapse") : $("workspace-expand")).focus({preventScroll:true});
    if (!expanded) window.scrollTo(0, normalScrollY);
  }
  $("workspace-expand").addEventListener("click", () => setWorkspaceExpanded(true));
  $("workspace-collapse").addEventListener("click", () => setWorkspaceExpanded(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !event.defaultPrevented && workspaceExpanded && !document.querySelector("dialog[open]")) {
      event.preventDefault();
      setWorkspaceExpanded(false);
    }
  });
  $("reference-open").addEventListener("click", openReference);
  $("reference-search").addEventListener("input", renderReference);
  document
    .querySelectorAll("[data-close]")
    .forEach((button) =>
      button.addEventListener("click", () => $(button.dataset.close).close()),
    );
  document.querySelectorAll("dialog").forEach((dialog) =>
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      )
        dialog.close();
    }),
  );
  document
    .querySelectorAll("[data-insert]")
    .forEach((button) =>
      button.addEventListener("click", () => insert(button.dataset.insert)),
    );
  $("reset-open").addEventListener("click", () =>
    $("reset-dialog").showModal(),
  );
  $("reset-confirm").addEventListener("click", () => {
    if (pythonJob) { toast("Stop Python before resetting."); $("reset-dialog").close(); return; }
    sessions[preferences.platform] = newSession(preferences.platform);
    active = sessions[preferences.platform];
    historyIndex = 0;
    $("command-input").value = "";
    $("file-search").value = "";
    $("reset-dialog").close();
    renderAll();
    save();
    $("connection-text").textContent =
      "Ready for a fresh start. Try ls to see what is here.";
    toast("Practice reset.");
  });
  if (recovered)
    toast("Sample files were restored because the saved data was invalid.");
  else if (storageUnavailable)
    toast("You can practice, but your browser does not allow saving progress.");
})();
