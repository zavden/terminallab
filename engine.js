/* A deliberately small, data-only shell. No host filesystem or process access. */
(function (root) {
  "use strict";
  const HOME = "/Users/user";
  const PYTHON_SAMPLES = {
    "hello_world.py": "# Your first Python program. Run: python hello_world.py\nprint(\"Hello, world!\")\n",
    "Python Examples/variables.py": "# Variables, numbers and formatted strings.\nname = \"user\"\napples = 3\nprice = 2.5\ntotal = apples * price\nprint(f\"Hello, {name}!\")\nprint(f\"{apples} apples cost {total:.2f}.\")\n",
    "Python Examples/loops.py": "# Repeat an action with for and while.\nfor number in range(1, 6):\n    print(f\"{number} squared is {number ** 2}\")\n\ncountdown = 3\nwhile countdown > 0:\n    print(countdown)\n    countdown -= 1\nprint(\"Go!\")\n",
    "Python Examples/functions.py": "# Define a function, return a value, and call it.\ndef rectangle_area(width, height):\n    return width * height\n\narea = rectangle_area(4, 3)\nprint(f\"The area is {area} square units.\")\n",
    "Python Examples/lists.py": "# Lists, dictionaries and a simple condition.\nscores = [8, 10, 7, 9]\naverage = sum(scores) / len(scores)\nprint(\"Scores:\", scores)\nprint(\"Average:\", average)\n\nstudent = {\"name\": \"user\", \"average\": average}\nif student[\"average\"] >= 6:\n    print(student[\"name\"], \"passed!\")\nelse:\n    print(\"Keep practicing!\")\n",
    "Python Examples/input.py": "# Open Python input and enter your name before running.\n# Without prepared answers, this example uses a default name.\ntry:\n    name = input(\"What is your name? \")\nexcept EOFError:\n    name = \"user\"\nprint(f\"Nice to meet you, {name}!\")\n",
    "Python Examples/files.py": "# Create and read a UTF-8 text file in the current terminal folder.\n# Run again to replace the same example file.\nfrom pathlib import Path\n\npath = Path(\"python_result.txt\")\npath.write_text(\"This file was created by Python!\\n\", encoding=\"utf-8\")\nprint(path.read_text(encoding=\"utf-8\"))\nprint(\"Saved to:\", path.resolve())\n",
    "Python Examples/paths.py": "# The script folder and current terminal folder can be different.\nfrom pathlib import Path\n\nprint(\"Current folder:\", Path.cwd())\nprint(\"This script:\", Path(__file__).resolve())\nrelative_path = Path(\"hello_world.py\")\nprint(\"Relative path:\", relative_path)\nprint(\"Resolved from the current folder:\", relative_path.resolve())\nprint(\"Absolute home path:\", Path(\"/Users/user/hello_world.py\"))\n# Python uses POSIX paths on both simulated platforms.\n",
    "Python Examples/arguments.py": "# Run from home: python \"Python Examples/arguments.py\" Ada 42\nimport sys\n\nprint(\"Script:\", sys.argv[0])\nprint(\"Arguments:\", sys.argv[1:])\nif len(sys.argv) > 1:\n    print(f\"Hello, {sys.argv[1]}!\")\nelse:\n    print(\"Try adding a name after the script path.\")\n",
    "Python Examples/README.txt": "PYTHON EXAMPLES\n\nStart in your home folder:\n  python hello_world.py\n  python \"Python Examples/variables.py\"\n  python \"Python Examples/arguments.py\" Ada 42\n\nOr enter this folder:\n  cd \"Python Examples\"\n  python loops.py\n  python ../hello_world.py\n\nAbsolute script paths from any folder:\n  macOS: python /Users/user/hello_world.py\n  Windows: python C:\\Users\\user\\hello_world.py\n\nExamples:\n  variables.py   Variables and arithmetic\n  loops.py       For and while loops\n  functions.py   Functions and return values\n  lists.py       Lists, dictionaries and conditions\n  input.py       Prepared input (Python input button)\n  files.py       Writes python_result.txt in the current folder\n  paths.py       Relative and absolute paths\n  arguments.py   Command-line arguments\n\nDouble-click any file to edit it. Edits save automatically; Ctrl+S or Cmd+S also saves.\nThe Run Python button runs the open script without changing the terminal folder.\nOnly virtual files are changed.\n"
};
  const LIMITS = {
    nodes: 700,
    content: 100000,
    total: 750000,
    command: 4096,
    depth: 40,
  };
  const aliases = {
    "set-location": "cd",
    sl: "cd",
    chdir: "cd",
    "get-location": "pwd",
    gl: "pwd",
    "get-childitem": "ls",
    gci: "ls",
    dir: "ls",
    "write-output": "echo",
    write: "echo",
    "get-content": "cat",
    gc: "cat",
    type: "cat",
    "copy-item": "cp",
    copy: "cp",
    cpi: "cp",
    "move-item": "mv",
    move: "mv",
    mi: "mv",
    "remove-item": "rm",
    del: "rm",
    erase: "rm",
    ri: "rm",
    "new-item": "new-item",
    ni: "new-item",
    md: "mkdir",
    "clear-host": "clear",
    cls: "clear",
    "get-help": "help",
    "rename-item": "rename",
    ren: "rename",
  };
  class ShellError extends Error {}
  const fail = (message) => {
    throw new ShellError(message);
  };
  const parent = (path) => path.slice(0, path.lastIndexOf("/")) || "/";
  const basename = (path) => path.split("/").pop() || "/";
  const under = (path, directory) =>
    path === directory ||
    path.startsWith(directory === "/" ? "/" : directory + "/");

  function tokenize(source, mode) {
    if (source.length > LIMITS.command)
      fail("The command is too long (4096 characters maximum).");
    const tokens = [];
    let value = "",
      quote = null,
      started = false;
    const push = () => {
      if (started) tokens.push({ value, operator: false });
      value = "";
      started = false;
    };
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (ch === "\n" || ch === "\r" || ch === "\0")
        fail("Enter one command per line.");
      const escape = mode === "windows" ? "`" : "\\";
      if (
        ch === escape &&
        quote !== "'" &&
        (mode === "windows" ||
          quote !== '"' ||
          ["$", "`", '"', "\\"].includes(source[i + 1]))
      ) {
        if (i + 1 >= source.length)
          fail("A character is missing after the escape.");
        value += source[++i];
        started = true;
        continue;
      }
      if (quote) {
        if (ch === quote) {
          if (mode === "windows" && quote === "'" && source[i + 1] === "'") {
            value += "'";
            i++;
          } else quote = null;
        } else {
          if (quote === '"' && (ch === "$" || (mode === "mac" && ch === "`")))
            fail(
              "Variables and substitutions are not simulated. Use single quotes to write those symbols literally.",
            );
          value += ch;
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        started = true;
        continue;
      }
      if (/\s/.test(ch)) {
        push();
        continue;
      }
      if (ch === ">") {
        push();
        const append = source[i + 1] === ">";
        if (append) i++;
        tokens.push({ value: append ? ">>" : ">", operator: true });
        continue;
      }
      if (/[|;&<$`(){}*?\[\]]/.test(ch))
        fail(
          "This lab supports one command at a time, without pipes, wildcards, or variables. Type help for examples.",
        );
      value += ch;
      started = true;
    }
    if (quote) fail('A closing quote is missing. Example: mkdir "My folder"');
    push();
    return tokens;
  }

  class VirtualShell {
    constructor(mode = "mac") {
      this.mode = mode === "windows" ? "windows" : "mac";
      this.reset();
    }
    reset() {
      this.cwd = HOME;
      this.nodes = new Map([
        ["/", { type: "dir" }],
        ["/Users", { type: "dir" }],
        [HOME, { type: "dir" }],
        [HOME + "/Desktop", { type: "dir" }],
        [HOME + "/Documents", { type: "dir" }],
        [HOME + "/Downloads", { type: "dir" }],
        [HOME + "/Projects", { type: "dir" }],
        [
          HOME + "/welcome.txt",
          {
            type: "file",
            content:
              "Hello! This is your practice space.\n\nA terminal and an explorer work with the same folders.\nTry: mkdir my-project\nThen: cd my-project\n\nYou can create, read, copy, and move files without changing your computer.\n",
          },
        ],
        [
          HOME + "/Documents/notes.txt",
          {
            type: "file",
            content:
              "My first note\n\ncd changes folders.\nls lists the contents.\npwd shows the current path.\n",
          },
        ],
        [HOME + "/Projects/web", { type: "dir" }],
        [
          HOME + "/Projects/web/README.md",
          {
            type: "file",
            content:
              "# My website\n\nEvery great project starts with a folder.\n",
          },
        ],
      ]);
      this.installPythonSamples();
    }
    installPythonSamples() {
      const additions = [[HOME + "/Python Examples", { type: "dir" }],
        ...Object.entries(PYTHON_SAMPLES).map(([name, content]) => [HOME + "/" + name, { type: "file", content }])];
      for (const [path, node] of additions) {
        try {
          // resolve also finds case-insensitive collisions in Windows sessions.
          const canonical = this.resolve(path);
          if (this.nodes.has(canonical)) continue;
          this.require(parent(canonical), "dir");
          this.nodes.set(canonical, node);
          try { this.checkLimits(); } catch { this.nodes.delete(canonical); }
        } catch { /* An existing file can block the examples folder. Preserve it. */ }
      }
    }
    upgradeSamples() {
      const defaults = new VirtualShell(this.mode);
      const samples = [
        {
          old: HOME + "/Documents/notas.txt",
          path: HOME + "/Documents/notes.txt",
          text: "Mi primera nota\n\ncd cambia de carpeta.\nls muestra su contenido.\npwd muestra la ruta actual.\n",
        },
        {
          old: HOME + "/inicio.txt",
          path: HOME + "/welcome.txt",
          text: "¡Hola! Este es tu espacio de práctica.\n\nUna terminal y un explorador trabajan con las mismas carpetas.\nPrueba: mkdir mi-proyecto\nDespués: cd mi-proyecto\n\nPuedes crear, leer, copiar y mover archivos sin tocar tu equipo.\n",
        },
        {
          old: HOME + "/Projects/web/README.md",
          path: HOME + "/Projects/web/README.md",
          text: "# Mi web\n\nTodo gran proyecto empieza con una carpeta.\n",
        },
      ];
      for (const sample of samples) {
        const old = this.nodes.get(sample.old);
        if (old?.type === "file") {
          let destination = sample.path;
          if (sample.old !== sample.path && this.nodes.has(destination)) {
            let suffix = 1;
            const stem = destination.slice(0, -4);
            while (this.nodes.has(destination))
              destination = `${stem} (previous ${suffix++}).txt`;
          }
          this.nodes.set(destination, {
            type: "file",
            content:
              old.content === sample.text
                ? defaults.get(sample.path).content
                : old.content,
          });
          if (sample.old !== destination) this.nodes.delete(sample.old);
        }
        const current = this.nodes.get(sample.path);
        if (current?.type === "file" && current.content === sample.text)
          this.nodes.set(sample.path, {
            type: "file",
            content: defaults.get(sample.path).content,
          });
      }
    }
    display(path = this.cwd) {
      return this.mode === "windows" ? "C:" + path.replaceAll("/", "\\") : path;
    }
    short(path = this.cwd) {
      return under(path, HOME)
        ? "~" + path.slice(HOME.length)
        : this.display(path);
    }
    resolve(input = ".", options = {}) {
      let value = String(input);
      if (!value) fail("The path cannot be empty.");
      if (this.mode === "windows") {
        value = value.replaceAll("\\", "/");
        if (/^[a-z]:/i.test(value)) {
          if (!/^c:\//i.test(value))
            fail(
              "Only the C: drive exists in this lab. Use a path such as C:\\Users\\user.",
            );
          value = value.slice(2);
        }
      }
      if (value === "~" || value.startsWith("~/"))
        value = HOME + value.slice(1);
      const parts = value.startsWith("/")
        ? []
        : this.cwd.split("/").filter(Boolean);
      for (const part of value.split("/").filter(Boolean)) {
        const current = "/" + parts.join("/");
        const node = this.nodes.get(current);
        if (node && node.type !== "dir")
          fail(`Not a folder: ${basename(current)}`);
        if (!node && !options.parents)
          fail(`Folder not found: ${this.display(current)}`);
        if (part === ".") continue;
        if (part === "..") {
          parts.pop();
          continue;
        }
        let actual = part;
        if (this.mode === "windows") {
          const match = [...this.nodes.keys()].find(
            (key) =>
              parent(key) === current &&
              basename(key).toLowerCase() === part.toLowerCase(),
          );
          if (match) actual = basename(match);
        }
        parts.push(actual);
        if (parts.length > LIMITS.depth)
          fail("This lab supports up to 40 folder levels.");
      }
      return "/" + parts.join("/");
    }
    get(path) {
      return this.nodes.get(path);
    }
    require(path, type) {
      const node = this.nodes.get(path);
      if (!node)
        fail(
          `Not found: ${this.display(path)}. Use ls to see the available names.`,
        );
      if (type && node.type !== type)
        fail(
          type === "dir"
            ? `«${basename(path)}» is a file, not a folder.`
            : `«${basename(path)}» is a folder, not a file.`,
        );
      return node;
    }
    list(path = this.cwd, hidden = false) {
      this.require(path, "dir");
      return [...this.nodes.entries()]
        .filter(
          ([key]) =>
            key !== "/" &&
            parent(key) === path &&
            (hidden || !basename(key).startsWith(".")),
        )
        .map(([key, node]) => ({ path: key, name: basename(key), ...node }))
        .sort((a, b) =>
          a.type !== b.type
            ? a.type === "dir"
              ? -1
              : 1
            : a.name.localeCompare(b.name, "en"),
        );
    }
    validateName(path) {
      const name = basename(path);
      if (!name || /[\0-\x1f]/.test(name) || name.length > 180)
        fail(
          "Use a name between 1 and 180 characters, without control characters.",
        );
      if (
        this.mode === "windows" &&
        (/[<>:"|?*]/.test(name) ||
          /[. ]$/.test(name) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(name))
      )
        fail(
          "That name is not valid on Windows. Try letters, numbers, and hyphens.",
        );
    }
    create(path, type, content = "") {
      this.validateName(path);
      this.require(parent(path), "dir");
      if (this.nodes.has(path))
        fail(`«${basename(path)}» already exists. Choose another name.`);
      this.nodes.set(path, type === "dir" ? { type } : { type, content });
    }
    protect(path) {
      if (["/", "/Users", HOME].includes(path))
        fail("The root and home folders are protected in this lab.");
      if (under(this.cwd, path))
        fail("Leave that folder with cd .. before moving or deleting it.");
    }
    checkLimits() {
      if (this.nodes.size > LIMITS.nodes)
        fail(
          "You have reached the 700-item limit. Delete some items or reset your practice.",
        );
      let size = 0;
      for (const [path, node] of this.nodes) {
        if ((node.content || "").length > LIMITS.content)
          fail("A virtual file can contain up to 100,000 characters.");
        size += path.length + (node.content || "").length;
      }
      if (size > LIMITS.total)
        fail("The practice space is full. Delete some files or reset.");
    }
    snapshot() {
      return { cwd: this.cwd, nodes: [...this.nodes], pythonSamplesVersion: 1 };
    }
    restore(data) {
      if (
        !data ||
        !Array.isArray(data.nodes) ||
        data.nodes.length > LIMITS.nodes ||
        typeof data.cwd !== "string"
      )
        return false;
      const old = this.snapshot();
      try {
        this.nodes = new Map();
        for (const entry of data.nodes) {
          if (!Array.isArray(entry) || entry.length !== 2) throw Error();
          const [path, node] = entry;
          if (
            typeof path !== "string" ||
            !path.startsWith("/") ||
            path.length > 7500 ||
            this.nodes.has(path) ||
            !node ||
            !["dir", "file"].includes(node.type)
          )
            throw Error();
          if (
            path !== "/" &&
            path
              .split("/")
              .slice(1)
              .some((p) => !p || p === "." || p === "..")
          )
            throw Error();
          if (path.split("/").length > LIMITS.depth + 1) throw Error();
          if (node.type === "file" && typeof node.content !== "string")
            throw Error();
          this.nodes.set(
            path,
            node.type === "dir"
              ? { type: "dir" }
              : { type: "file", content: node.content },
          );
        }
        for (const path of this.nodes.keys()) {
          if (path !== "/") {
            this.validateName(path);
            this.require(parent(path), "dir");
          }
          if (this.mode === "windows" && this.resolve(path) !== path)
            throw Error();
        }
        for (const path of ["/", "/Users", HOME, data.cwd])
          this.require(path, "dir");
        this.cwd = data.cwd;
        this.upgradeSamples();
        if (data.pythonSamplesVersion !== 1) this.installPythonSamples();
        this.checkLimits();
        return true;
      } catch {
        this.nodes = new Map(old.nodes);
        this.cwd = old.cwd;
        return false;
      }
    }
    execute(source) {
      const before = this.snapshot();
      try {
        const result = this.run(source.trim());
        this.checkLimits();
        return { ok: true, ...result };
      } catch (error) {
        this.nodes = new Map(before.nodes);
        this.cwd = before.cwd;
        return {
          ok: false,
          output:
            error instanceof ShellError
              ? error.message
              : "That command could not be completed. Try an example from the guide.",
          action: "error",
        };
      }
    }
    writeFile(path, content) {
      const before = this.snapshot();
      try {
        this.require(path, "file");
        if (typeof content !== "string") fail("File contents must be text.");
        this.nodes.set(path, { type: "file", content });
        this.checkLimits();
        return { ok: true };
      } catch (error) {
        this.nodes = new Map(before.nodes);
        return { ok: false, output: error.message };
      }
    }
    run(source) {
      let tokens = tokenize(source, this.mode);
      if (!tokens.length) return { output: "", action: "empty" };
      const redirection = tokens.findIndex((t) => t.operator);
      let target,
        append = false;
      if (redirection !== -1) {
        if (
          redirection === 0 ||
          redirection !== tokens.length - 2 ||
          tokens[redirection + 1].operator
        )
          fail('Use: echo "Hello" > note.txt. To append text, use >>.');
        target = this.resolve(tokens[redirection + 1].value);
        append = tokens[redirection].value === ">>";
        tokens = tokens.slice(0, redirection);
      }
      const original = tokens.shift().value;
      let cmd = this.mode === "windows" ? original.toLowerCase() : original;
      if (this.mode === "windows") cmd = aliases[cmd] || cmd;
      const args = tokens.map((t) => t.value);
      if (
        target &&
        !["echo", "pwd", "ls", "cat", "help", "whoami"].includes(cmd)
      )
        fail(
          "You can redirect output from echo, pwd, ls, cat, help, and whoami here.",
        );
      let output = "",
        action = cmd,
        path = this.cwd,
        changed = false,
        explanation = "";
      const count = (min, max = min) => {
        if (args.length < min || args.length > max)
          fail(
            `«${original}» needs ${min === max ? min : `${min} to ${max}`} argument(s). See the guide for an example.`,
          );
      };
      const options = (allowed) => {
        const flags = [],
          positional = [];
        let ended = false;
        for (const arg of args) {
          if (!ended && arg === "--" && this.mode === "mac") {
            ended = true;
            continue;
          }
          if (!ended && arg.startsWith("-")) {
            const flag = this.mode === "windows" ? arg.toLowerCase() : arg;
            if (!allowed.includes(flag))
              fail(
                `The option «${arg}» is not supported for ${original}. See the guide.`,
              );
            flags.push(flag);
          } else positional.push(arg);
        }
        return { flags, positional };
      };
      switch (cmd) {
        case "python":
        case "python3":
        case "py": {
          if (args.length === 1 && ["--version", "-V"].includes(args[0]))
            return { action: "python-version", output: "Python 3.13 (Pyodide 0.28.3)" };
          if (!args.length || args[0].startsWith("-"))
            fail("Use: python script.py [arguments]. Interactive REPL and -c/-m are not supported.");
          const script = this.resolve(args[0]);
          this.require(script, "file");
          return { action: "python", path: script, args: args.slice(1), output: "" };
        }
        case "pwd":
          count(0);
          output = this.display();
          explanation = "This is the full path of your current folder.";
          break;
        case "whoami":
          count(0);
          output = "user";
          explanation = "user is the user of this virtual space.";
          break;
        case "ls": {
          const { flags, positional } = options(
            this.mode === "windows"
              ? ["-force", "-name"]
              : ["-a", "-l", "-la", "-al", "-h", "-lh", "-lah"],
          );
          if (positional.length > 1)
            fail("List one folder at a time: ls Documents");
          path = this.resolve(positional[0] ?? ".");
          const node = this.require(path);
          const items =
            node.type === "dir"
              ? this.list(
                  path,
                  flags.some((f) => f.includes("a") || f === "-force"),
                )
              : [{ name: basename(path), ...node }];
          output = items
            .map(
              (item) =>
                (flags.some((f) => f.includes("l"))
                  ? item.type === "dir"
                    ? "d  "
                    : "-  "
                  : "") +
                item.name +
                (item.type === "dir" && this.mode === "windows" ? "\\" : ""),
            )
            .join("\n");
          explanation =
            "ls lists the contents; it does not change your location.";
          break;
        }
        case "cd": {
          if (this.mode === "windows" && args[0]?.toLowerCase() === "-path")
            args.shift();
          count(0, 1);
          path = this.resolve(args[0] ?? "~");
          this.require(path, "dir");
          this.cwd = path;
          explanation = `Both panels are now in ${this.display()}.`;
          break;
        }
        case "mkdir": {
          const { flags, positional } = options(
            this.mode === "mac" ? ["-p"] : [],
          );
          if (!positional.length)
            fail("Give the folder a name: mkdir my-project");
          for (const name of positional) {
            path = this.resolve(name, { parents: flags.includes("-p") });
            if (flags.includes("-p")) {
              let partial = "";
              for (const part of path.split("/").filter(Boolean)) {
                partial += "/" + part;
                if (!this.nodes.has(partial)) this.create(partial, "dir");
                else this.require(partial, "dir");
              }
            } else this.create(path, "dir");
          }
          changed = true;
          explanation = "Folder created. mkdir creates it; cd moves into it.";
          break;
        }
        case "touch": {
          if (this.mode === "windows")
            fail(
              "touch is not included in PowerShell. Use: New-Item note.txt -ItemType File",
            );
          const { positional } = options([]);
          if (!positional.length) fail("Specify a file: touch note.txt");
          for (const name of positional) {
            path = this.resolve(name);
            if (!this.nodes.has(path)) this.create(path, "file");
          }
          action = "create-file";
          changed = true;
          explanation =
            "touch creates an empty file if it does not exist, and preserves its contents if it does.";
          break;
        }
        case "new-item": {
          if (this.mode !== "windows")
            fail(
              "New-Item is a PowerShell command. On macOS, use touch note.txt or mkdir folder.",
            );
          let itemType = "file",
            itemPath,
            name,
            value = "",
            force = false;
          for (let i = 0; i < args.length; i++) {
            const arg = args[i].toLowerCase();
            if (arg === "-force") {
              force = true;
              continue;
            }
            if (arg.startsWith("-")) {
              if (
                !["-itemtype", "-type", "-path", "-name", "-value"].includes(
                  arg,
                )
              )
                fail(`Unsupported option: ${args[i]}`);
              if (++i >= args.length) fail(`Missing value for ${arg}.`);
              if (arg === "-itemtype" || arg === "-type")
                itemType = args[i].toLowerCase();
              if (arg === "-path") itemPath = args[i];
              if (arg === "-name") name = args[i];
              if (arg === "-value") value = args[i];
            } else if (itemPath === undefined) itemPath = args[i];
            else fail("Create one item at a time with New-Item.");
          }
          if (!["file", "directory"].includes(itemType))
            fail("Use -ItemType File or -ItemType Directory.");
          if (itemPath === undefined && !name)
            fail("Specify a name: New-Item note.txt -ItemType File");
          path = this.resolve(itemPath ?? ".");
          if (name) {
            this.require(path, "dir");
            path = this.resolve(path + "/" + name);
          }
          const type = itemType === "directory" ? "dir" : "file";
          if (this.nodes.has(path) && force) {
            this.require(path, type);
            if (type === "file") this.nodes.set(path, { type, content: value });
          } else this.create(path, type, value);
          action = type === "dir" ? "mkdir" : "create-file";
          changed = true;
          explanation = `Created ${type === "dir" ? "a folder" : "a file"} with New-Item.`;
          break;
        }
        case "echo": {
          let newline = true;
          if (this.mode === "mac" && args[0] === "-n") {
            args.shift();
            newline = false;
          }
          output = args.join(this.mode === "windows" ? "\n" : " ");
          if (this.mode === "mac")
            output = output.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
          explanation = target
            ? "Text is written to the specified file."
            : "echo displays text. Add > note.txt to save it in a file.";
          if (target) output += newline ? "\n" : "";
          break;
        }
        case "cat": {
          if (!args.length) fail("Specify the file to read: cat note.txt");
          const { positional } = options([]);
          output = positional
            .map((name) => {
              path = this.resolve(name);
              return this.require(path, "file").content;
            })
            .join("");
          explanation = "cat reads the file’s contents without changing them.";
          break;
        }
        case "cp":
        case "mv":
        case "rename": {
          const { flags, positional } = options(
            this.mode === "windows"
              ? ["-recurse", "-force"]
              : cmd === "cp"
                ? ["-r", "-R", "-f"]
                : ["-f"],
          );
          if (positional.length !== 2)
            fail(`Use: ${original} source destination`);
          const from = this.resolve(positional[0]);
          const node = this.require(from);
          if (cmd !== "cp") this.protect(from);
          let to =
            cmd === "rename"
              ? this.resolve(parent(from) + "/" + positional[1])
              : this.resolve(positional[1]);
          if (cmd === "rename" && /[\\/]/.test(positional[1]))
            fail(
              "Rename-Item changes a name; use Move-Item to move to another folder.",
            );
          if (cmd !== "rename" && this.nodes.get(to)?.type === "dir")
            to = this.resolve(to + "/" + basename(from));
          if (from === to || (node.type === "dir" && under(to, from)))
            fail(
              "The destination cannot be the same item or a folder inside it.",
            );
          if (
            node.type === "dir" &&
            cmd === "cp" &&
            !flags.some((f) => ["-r", "-R", "-recurse"].includes(f))
          )
            fail(
              this.mode === "windows"
                ? "To copy a folder and its contents, use: cp source destination -Recurse"
                : "To copy a folder and its contents, use: cp -r source destination",
            );
          this.validateName(to);
          this.require(parent(to), "dir");
          const existing = this.nodes.get(to);
          if (existing && (existing.type !== "file" || node.type !== "file"))
            fail(
              "A folder with that name already exists. Use another destination.",
            );
          const subtree = [...this.nodes.entries()].filter(([key]) =>
            under(key, from),
          );
          for (const [key, child] of subtree)
            this.nodes.set(to + key.slice(from.length), { ...child });
          if (cmd !== "cp") for (const [key] of subtree) this.nodes.delete(key);
          path = to;
          changed = true;
          explanation =
            cmd === "cp"
              ? "Copy created. The original stays in place."
              : "Item moved or renamed. Its contents are preserved.";
          break;
        }
        case "rm":
        case "rmdir": {
          const { flags, positional } = options(
            this.mode === "windows"
              ? ["-recurse", "-force"]
              : cmd === "rm"
                ? ["-r", "-R", "-f", "-rf", "-fr"]
                : [],
          );
          if (!positional.length)
            fail("Specify what to delete. Example: rm note.txt");
          for (const name of positional) {
            path = this.resolve(name);
            this.protect(path);
            const node = this.nodes.get(path);
            if (
              !node &&
              this.mode === "mac" &&
              flags.some((f) => f.includes("f"))
            )
              continue;
            this.require(path);
            const descendants = [...this.nodes.keys()].filter(
              (key) => under(key, path) && key !== path,
            );
            const recursive = flags.some((f) =>
              ["-r", "-R", "-rf", "-fr", "-recurse"].includes(f),
            );
            if (cmd === "rmdir" && node.type !== "dir")
              fail("rmdir only deletes folders. For a file, use rm.");
            if (
              node.type === "dir" &&
              !recursive &&
              ((cmd === "rm" && this.mode === "mac") || descendants.length)
            )
              fail(
                this.mode === "windows"
                  ? "The folder contains items. Use rm folder -Recurse to delete everything inside."
                  : "To delete a folder and its contents, use rm -r folder.",
              );
            for (const key of descendants) this.nodes.delete(key);
            this.nodes.delete(path);
          }
          changed = true;
          explanation =
            "Item deleted from the virtual space. In a real terminal, rm can delete permanently.";
          break;
        }
        case "clear":
          count(0);
          return {
            output: "",
            clear: true,
            action: "clear",
            explanation: "Screen cleared. Your files are still here.",
          };
        case "help":
          count(0);
          output =
            this.mode === "windows"
              ? 'pwd                  Show your location\nls                   List files and folders\ncd Documents         Enter a folder\ncd ..                Go up one level\nmkdir project       Create a folder\nNew-Item note.txt -ItemType File\n                     Create a file\necho "Hello" > note.txt  Write (replace)\necho "More" >> note.txt  Append text\ncat note.txt         Read a file\ncp note.txt copy.txt Copy\nmv copy.txt other.txt Move or rename\nrm other.txt          Delete file\nrm project -Recurse Delete folder and contents\nclear                Clear screen'
              : 'pwd                  Show your location\nls / ls -la          List contents\ncd Documents         Enter a folder\ncd .. / cd ~         Go up / go home\nmkdir project       Create a folder\nmkdir -p a/b         Create nested folders\ntouch note.txt       Create a file\necho "Hello" > note.txt  Write (replace)\necho "More" >> note.txt  Append text\ncat note.txt         Read a file\ncp note.txt copy.txt Copy\nmv copy.txt other.txt Move or rename\nrm other.txt          Delete file\nrm -r project       Delete folder and contents\nclear                Clear screen';
          output += "\npython script.py     Run a Python file (relative or absolute path)";
          explanation =
            "Open the command guide to compare examples for both systems.";
          break;
        default:
          fail(
            `Unsupported command: «${original}». Type help or open the command guide.`,
          );
      }
      if (target) {
        this.validateName(target);
        this.require(parent(target), "dir");
        const existing = this.nodes.get(target);
        if (existing?.type === "dir")
          fail("The destination of > must be a file, not a folder.");
        const content =
          (append ? existing?.content || "" : "") +
          output +
          (cmd !== "echo" && !output.endsWith("\n") ? "\n" : "");
        this.nodes.set(target, { type: "file", content });
        path = target;
        output = "";
        changed = true;
        action = "write";
        explanation = append
          ? ">> appends text to the file."
          : "> saves the text and replaces the file’s previous contents.";
      }
      return { output, action, path, changed, explanation };
    }
  }
  const api = { VirtualShell, tokenize, HOME, parent, basename, under, LIMITS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TerminalLab = api;
})(typeof window !== "undefined" ? window : globalThis);
