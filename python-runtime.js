/* Local Pyodide runner. One disposable worker per run; never executes host commands. */
(() => {
  let payloadPromise;
  function payload() {
    if (window.TerminalPythonPayload) return Promise.resolve(window.TerminalPythonPayload);
    if (!payloadPromise) payloadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'vendor/pyodide/payload.js';
      script.onload = () => resolve(window.TerminalPythonPayload);
      script.onerror = () => { payloadPromise = null; script.remove(); reject(new Error('Cannot load the local Python runtime. Keep vendor/pyodide with this app.')); };
      document.head.append(script);
    });
    return payloadPromise;
  }
  async function workerMain(event) {
    const { bundle, snapshot, path, args, stdin } = event.data;
    const decode = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
    // Pyodide fetches its wasm and stdlib. Serve only these embedded bytes, in memory.
    self.fetch = async url => {
      const name = String(url).split('/').pop();
      if (name === 'pyodide.asm.wasm') return new Response(decode(bundle.wasm), { headers: { 'Content-Type': 'application/wasm' } });
      if (name === 'python_stdlib.zip') return new Response(decode(bundle.stdlib));
      throw new Error('Network access is unavailable in Terminal Lab.');
    };
    let output = '', sent = 0;
    const write = text => {
      if (output.length < 16000) {
        output += (text + '\n').slice(0, 16000 - output.length);
        if (output.length - sent >= 512) { postMessage({ type: 'output', output }); sent = output.length; }
      }
    };
    try {
      const py = await loadPyodide({ indexURL: 'https://terminal-lab.invalid/',
        lockFileContents: bundle.lock, stdout: write, stderr: write,
        jsglobals: {}, enableRunUntilComplete: false });
      const fs = py.FS;
      for (const [name, node] of snapshot.nodes.filter(e => e[1].type === 'dir').sort((a,b) => a[0].length-b[0].length)) fs.mkdirTree(name);
      for (const [name, node] of snapshot.nodes) if (node.type === 'file') fs.writeFile(name, node.content);
      fs.chdir(snapshot.cwd);
      const lines = stdin === '' ? [] : stdin.split('\n');
      py.setStdin({ stdin: () => lines.length ? lines.shift() : null });
      py.globals.set('_lab_path', path);
      py.globals.set('_lab_args', py.toPy(args));
      postMessage({ type: 'running' });
      let ok = true;
      try {
        py.runPython(`import sys, runpy, os
sys.argv = [_lab_path] + list(_lab_args)
sys.path.insert(0, os.path.dirname(_lab_path))
runpy.run_path(_lab_path, run_name="__main__")`);
      } catch (error) { ok = false; write(error.message); }
      // Export only the learner tree, bounded before allocating large strings.
      const nodes = snapshot.nodes.filter(([name]) => name !== '/Users/user' && !name.startsWith('/Users/user/'));
      let size = 0;
      function walk(name, depth) {
        if (depth > 40 || nodes.length >= 700) throw new Error('Python file changes exceed lab limits.');
        const stat = fs.lstat(name);
        if (fs.isDir(stat.mode)) {
          nodes.push([name, {type:'dir'}]);
          for (const item of fs.readdir(name)) if (item !== '.' && item !== '..') walk(name + '/' + item, depth+1);
        } else if (fs.isFile(stat.mode)) {
          if (stat.size > 400000) throw new Error('Python created a file larger than the lab limit.');
          const content = new TextDecoder('utf-8', {fatal:true}).decode(fs.readFile(name));
          size += name.length + content.length;
          if (content.length > 100000 || size > 750000) throw new Error('Python file changes exceed lab limits.');
          nodes.push([name, {type:'file', content}]);
        } else throw new Error('Only text files and folders can be saved to the explorer.');
      }
      walk('/Users/user', 0);
      postMessage({ type:'done', ok, output, snapshot: {cwd:snapshot.cwd, nodes, pythonSamplesVersion:snapshot.pythonSamplesVersion} });
    } catch (error) { postMessage({type:'done', ok:false, output:output + '\n' + error.message}); }
  }
  window.TerminalPython = {
    start(request, onUpdate) {
      let worker, timer, workerURL, stopped = false, finish;
      const done = new Promise(resolve => { finish = result => {
        if (stopped) return;
        stopped = true; clearTimeout(timer); worker?.terminate();
        if (workerURL) URL.revokeObjectURL(workerURL);
        resolve(result);
      }; });
      timer = setTimeout(() => finish({ok:false, output:'Python initialization timed out. Try again.'}), 60000);
      payload().then(bundle => {
        if (stopped) return;
        workerURL = URL.createObjectURL(new Blob([bundle.runtime, '\nself.onmessage = ', workerMain.toString(), ';'], {type:'text/javascript'}));
        worker = new Worker(workerURL);
        worker.onerror = event => finish({ok:false, output:'Python runtime error: ' + event.message});
        worker.onmessage = ({data}) => {
          if (data.type === 'done') finish(data);
          else { if (data.type === 'running') {
            clearTimeout(timer);
            timer = setTimeout(() => finish({ok:false, output:'Python stopped after 10 seconds. File changes were discarded.'}), 10000);
          } onUpdate(data); }
        };
        worker.postMessage({...request, bundle});
      }).catch(error => finish({ok:false, output:error.message}));
      return { done, stop: () => finish({ok:false, output:'Python stopped. File changes were discarded.'}) };
    }
  };
})();
