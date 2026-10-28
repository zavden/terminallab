const { test } = require("node:test");
const assert = require("node:assert/strict");
const { VirtualShell, HOME } = require("../engine.js");
const run = (shell, command) => {
  const result = shell.execute(command);
  assert.equal(result.ok, true, `${command}: ${result.output}`);
  return result;
};

for (const mode of ["mac", "windows"]) {
  test(`${mode}: complete beginner workflow and retained file content`, () => {
    const shell = new VirtualShell(mode);
    assert.match(run(shell, "ls").output, /Documents/);
    run(shell, "mkdir my-project");
    run(shell, "cd my-project");
    assert.equal(shell.cwd, HOME + "/my-project");
    run(
      shell,
      mode === "mac" ? "touch note.txt" : "New-Item note.txt -ItemType File",
    );
    run(shell, 'echo "Hello, world" > note.txt');
    run(shell, 'echo "Otra línea" >> note.txt');
    assert.equal(
      run(shell, "cat note.txt").output,
      "Hello, world\nOtra línea\n",
    );
    run(shell, "cp note.txt copy.txt");
    run(shell, "mv copy.txt memory.txt");
    assert.equal(shell.get(shell.cwd + "/copy.txt"), undefined);
    assert.equal(
      run(shell, "cat memory.txt").output,
      "Hello, world\nOtra línea\n",
    );
    run(shell, "rm memory.txt");
    run(shell, "cd ..");
    assert.equal(shell.cwd, HOME);
    assert.equal(
      shell.get(HOME + "/my-project/note.txt").content,
      "Hello, world\nOtra línea\n",
    );
  });
  test(`${mode}: spaces, quoted operators, overwrite, empty arguments and literal HTML`, () => {
    const shell = new VirtualShell(mode);
    run(shell, 'mkdir "My ideas"');
    run(shell, 'cd "My ideas"');
    run(shell, `echo '<img src=x onerror=alert(1)> | & ;' > 'mi note.txt'`);
    assert.match(run(shell, "cat 'mi note.txt'").output, /<img src=x/);
    run(shell, 'echo "" > "mi note.txt"');
    assert.equal(run(shell, 'cat "mi note.txt"').output, "\n");
    assert.equal(shell.execute('cd ""').ok, false);
  });
  test(`${mode}: invalid operations are atomic`, () => {
    const shell = new VirtualShell(mode),
      before = shell.snapshot();
    assert.equal(shell.execute("mkdir nuevo Documents").ok, false);
    assert.deepEqual(shell.snapshot(), before);
    assert.equal(shell.execute("cd welcome.txt").ok, false);
    assert.equal(shell.execute('echo "x" > Documents').ok, false);
    assert.equal(shell.execute("cp Projects Projects/web").ok, false);
    assert.equal(shell.execute("mkdir welcome.txt/otro").ok, false);
    assert.deepEqual(shell.snapshot(), before);
  });
  test(`${mode}: reject shell evaluation, remote execution, malformed quotes and unsupported options`, () => {
    const shell = new VirtualShell(mode),
      before = shell.snapshot();
    for (const command of [
      "ls; rm welcome.txt",
      "ls | cat",
      "ls && pwd",
      "echo $(whoami)",
      'echo "unterminated',
      "curl example.com",
      "mkdir -unknown x",
      "echo a\necho b",
      "> file.txt",
      "echo hi > a > b",
      "ls *",
    ])
      assert.equal(shell.execute(command).ok, false, command);
    assert.deepEqual(shell.snapshot(), before);
  });
  test(`${mode}: protected directories and recursive deletion`, () => {
    const shell = new VirtualShell(mode),
      recursive = mode === "mac" ? "-r" : "-Recurse";
    for (const path of ["/", "/Users", HOME])
      assert.equal(shell.execute(`rm ${recursive} '${path}'`).ok, false);
    run(shell, "mkdir test");
    run(shell, "echo x > test/a.txt");
    assert.equal(shell.execute("rm test").ok, false);
    run(shell, `cp ${recursive} test backup`);
    assert.equal(shell.get(HOME + "/backup/a.txt").content, "x\n");
    run(shell, `rm ${recursive} test`);
    assert.equal(shell.get(HOME + "/test"), undefined);
    assert.equal(shell.get(HOME + "/backup/a.txt").content, "x\n");
  });
  test(`${mode}: snapshots roundtrip and corrupt saves rejected`, () => {
    const shell = new VirtualShell(mode);
    run(shell, "mkdir saved");
    run(shell, "cd saved");
    run(shell, "echo hi > a.txt");
    const copy = new VirtualShell(mode);
    assert.equal(
      copy.restore(JSON.parse(JSON.stringify(shell.snapshot()))),
      true,
    );
    assert.deepEqual(copy.snapshot(), shell.snapshot());
    const before = copy.snapshot();
    for (const corrupt of [
      null,
      {},
      { cwd: "/", nodes: [] },
      { cwd: "/", nodes: [["/", { type: "file", content: "oops" }]] },
      { ...before, cwd: "/missing" },
      { ...before, nodes: [...before.nodes, ["/evil/child", { type: "dir" }]] },
      {
        ...before,
        nodes: [...before.nodes, ["/Users/../evil", { type: "dir" }]],
      },
    ]) {
      assert.equal(copy.restore(corrupt), false);
      assert.deepEqual(copy.snapshot(), before);
    }
  });
  test(`${mode}: mutation size limits do not corrupt original`, () => {
    const shell = new VirtualShell(mode);
    run(shell, 'echo "hello" > a.txt');
    const data = shell.snapshot();
    data.nodes.push([
      HOME + "/large.txt",
      { type: "file", content: "x".repeat(99999) },
    ]);
    assert.equal(shell.restore(data), true);
    const before = shell.snapshot();
    assert.equal(shell.execute("cat large.txt >> large.txt").ok, false);
    assert.deepEqual(shell.snapshot(), before);
  });
  test(`${mode}: moving an ancestor is blocked and file-to-folder moves work`, () => {
    const shell = new VirtualShell(mode);
    run(shell, "cd Projects/web");
    assert.equal(shell.execute("mv .. ../../renamed").ok, false);
    run(shell, "cd ~");
    run(shell, "cp welcome.txt prueba.txt");
    run(shell, "mv prueba.txt Documents");
    assert.equal(shell.get(HOME + "/prueba.txt"), undefined);
    assert.ok(shell.get(HOME + "/Documents/prueba.txt"));
  });
}

test("PowerShell paths, aliases, case insensitivity and name constraints", () => {
  const s = new VirtualShell("windows");
  run(s, "Set-Location C:\\Users\\user\\documents");
  assert.equal(s.cwd, HOME + "/Documents");
  assert.equal(run(s, "Get-Location").output, "C:\\Users\\user\\Documents");
  run(s, 'NI -Path . -Name "My note.txt" -ItemType File -Value "hello"');
  assert.equal(run(s, 'Get-Content "MY NOTE.TXT"').output, "hello");
  assert.equal(s.execute('New-Item "my note.txt" -ItemType File').ok, false);
  run(s, 'Rename-Item "My note.txt" "New note.txt"');
  assert.ok(s.get(HOME + "/Documents/New note.txt"));
  for (const name of ["CON", "nul.txt", "a:b", "trailing.", "PRN"])
    assert.equal(s.execute(`mkdir '${name}'`).ok, false);
  assert.equal(s.execute("touch file.txt").ok, false);
  assert.equal(s.execute("cd D:\\").ok, false);
  run(s, "cd ~");
  assert.equal(s.cwd, HOME);
});

test("zsh: nested mkdir, escapes, touch preservation and paths", () => {
  const s = new VirtualShell("mac");
  run(s, "mkdir -p a/b/c");
  run(s, "cd a/b/../b/c");
  assert.equal(s.cwd, HOME + "/a/b/c");
  run(s, "touch my\\ file.txt");
  run(s, 'echo "hello" > "my file.txt"');
  run(s, 'touch "my file.txt"');
  assert.equal(run(s, 'cat "my file.txt"').output, "hello\n");
  run(s, "echo -n x > no-newline.txt");
  assert.equal(run(s, "cat no-newline.txt").output, "x");
  run(s, "touch .hidden");
  assert.doesNotMatch(run(s, "ls").output, /\.hidden/);
  assert.match(run(s, "ls -la").output, /\.hidden/);
  run(s, "cd /");
  run(s, "cd ..");
  assert.equal(s.cwd, "/");
});

test("prototype-like names are ordinary files and do not affect objects", () => {
  const s = new VirtualShell("mac");
  run(s, "touch __proto__ constructor");
  assert.equal(s.get(HOME + "/__proto__").type, "file");
  assert.equal(Object.prototype.polluted, undefined);
});

for (const mode of ["mac", "windows"]) {
  test(`${mode}: saved Spanish samples are translated without overwriting user edits or colliding files`, () => {
    const shell = new VirtualShell(mode);
    const sample =
      "Mi primera nota\n\ncd cambia de carpeta.\nls muestra su contenido.\npwd muestra la ruta actual.\n";
    const data = shell.snapshot();
    data.nodes = data.nodes.filter(
      ([path]) => path !== HOME + "/Documents/notes.txt",
    );
    data.nodes.push([
      HOME + "/Documents/notas.txt",
      { type: "file", content: sample },
    ]);
    assert.equal(shell.restore(data), true);
    assert.equal(shell.get(HOME + "/Documents/notas.txt"), undefined);
    assert.match(
      shell.get(HOME + "/Documents/notes.txt").content,
      /My first note/,
    );
    const modified = shell.snapshot();
    modified.nodes.push([
      HOME + "/Documents/notas.txt",
      { type: "file", content: "Mis palabras personales" },
    ]);
    assert.equal(shell.restore(modified), true);
    assert.equal(
      shell.get(HOME + "/Documents/notes (previous 1).txt").content,
      "Mis palabras personales",
    );
    assert.match(
      shell.get(HOME + "/Documents/notes.txt").content,
      /My first note/,
    );
  });
}

for (const mode of ['mac', 'windows']) test(`${mode}: Python dispatch and atomic editor saves`, () => {
  const shell = new VirtualShell(mode);
  shell.execute(mode === 'mac' ? 'touch "hello world.py"' : 'New-Item "hello world.py" -ItemType File');
  const relative = shell.execute('python "hello world.py" one "two words"');
  assert.equal(relative.ok, true);
  assert.equal(relative.path, HOME + '/hello world.py');
  assert.deepEqual(relative.args, ['one','two words']);
  assert.equal(shell.execute(mode === 'mac' ? 'python3 "/Users/user/hello world.py"' : 'py "C:\\Users\\user\\hello world.py"').path, relative.path);
  assert.equal(shell.execute('python missing.py').ok, false);
  assert.equal(shell.execute('python -c "print(1)"').ok, false);
  assert.equal(shell.writeFile(relative.path, 'print(42)').ok, true);
  assert.equal(shell.writeFile(relative.path, 'x'.repeat(100001)).ok, false);
  assert.equal(shell.get(relative.path).content, 'print(42)');
});

for (const mode of ['mac', 'windows']) test(`${mode}: default Python samples migrate once and preserve learner files`, () => {
  const shell = new VirtualShell(mode);
  assert.match(shell.get(HOME + '/hello_world.py').content, /Hello, world!/);
  assert.equal(shell.list(HOME + '/Python Examples').filter(node => node.name.endsWith('.py')).length, 8);
  const legacy = shell.snapshot();
  delete legacy.pythonSamplesVersion;
  legacy.nodes = legacy.nodes.filter(([p]) => !p.startsWith(HOME + '/Python Examples'));
  const hello = legacy.nodes.find(([p]) => p === HOME + '/hello_world.py');
  hello[1] = {type:'file', content:'print("My own greeting")\n'};
  if (mode === 'windows') hello[0] = HOME + '/HELLO_WORLD.PY';
  assert.equal(shell.restore(legacy), true);
  assert.equal(shell.get(shell.resolve('hello_world.py')).content, 'print("My own greeting")\n');
  assert.equal(shell.get(HOME + '/Python Examples/loops.py').type, 'file');
  run(shell, mode === 'mac' ? 'rm -r "Python Examples"' : 'rm "Python Examples" -Recurse');
  const afterDelete = shell.snapshot();
  assert.equal(afterDelete.pythonSamplesVersion, 1);
  assert.equal(shell.restore(afterDelete), true);
  assert.equal(shell.get(HOME + '/Python Examples'), undefined);
  const full = shell.snapshot();
  delete full.pythonSamplesVersion;
  while (full.nodes.length < 700) full.nodes.push([HOME + '/filler' + full.nodes.length, {type:'file',content:''}]);
  assert.equal(shell.restore(full), true);
  assert.equal(shell.nodes.size, 700);
});
