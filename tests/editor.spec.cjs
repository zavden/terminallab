const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const command = async (page, text) => {
  await page.locator('#command-input').fill(text);
  await page.locator('#command-input').press('Enter');
};
for (const mode of ['mac', 'windows']) test(`${mode}: unified editor, explicit save, syntax and scrolling`, async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.locator('#platform-'+mode).click();
  await command(page, mode === 'mac' ? 'touch demo.py' : 'New-Item demo.py -ItemType File');
  await page.getByRole('button', {name:'View file demo.py', exact:true}).dblclick();
  const code = '# A first program\ndef greet(name):\n    total = 42\n    print("Hello", name, total)\n\ngreet("user")\n';
  const editor = page.locator('#preview-content');
  // Set a pending value without firing input: the shortcut itself must save.
  await editor.evaluate((node, code) => { node.value = code; }, code);
  await page.evaluate(() => window.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 's') window.savePrevented = event.defaultPrevented;
  }));
  await editor.press(mode === 'mac' ? 'Meta+s' : 'Control+s');
  expect(await page.evaluate(() => window.savePrevented)).toBe(true);
  await expect(page.locator('#toast')).toHaveText('File saved.');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('terminal-lab:v1'))[document.documentElement.dataset.platform].filesystem.nodes.find(([p]) => p.endsWith('/demo.py'))[1].content)).toBe(code);
  await expect(page.locator('#document-format')).toHaveText('Python');
  await expect(page.locator('.syntax-keyword').first()).toHaveText('def');
  await expect(page.locator('.syntax-number')).toHaveText('42');
  await expect(page.locator('.syntax-comment')).toHaveText('# A first program');
  await expect(page.locator('.syntax-builtin')).toHaveText('print');
  expect(await page.locator('#editor-highlight').textContent()).toBe(code+'\n');
  for (const theme of ['light','dark']) {
    if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#theme-toggle').click();
    await page.screenshot({path:`screenshots/${mode}-python-editor-${theme}.png`});
  }
  await editor.fill('text = "<img src=x onerror=alert(1)>"\nvalue = r"""a\nb\nc"""\n# end\n');
  await expect(page.locator('#editor-highlight img')).toHaveCount(0);
  await expect(page.locator('.syntax-string').last()).toHaveText('r"""a\nb\nc"""');
  await editor.fill(Array.from({length:80},(_,i)=>`print(${i}, "${'long '.repeat(70)}")`).join('\n'));
  await editor.evaluate(node=> {node.scrollTop=500;node.scrollLeft=300;node.dispatchEvent(new Event('scroll'));});
  const scroll = await page.evaluate(()=> {
    const a=document.querySelector('#preview-content'), b=document.querySelector('#editor-highlight');
    return [a.scrollTop,b.scrollTop,a.scrollLeft,b.scrollLeft];
  });
  expect(scroll[0]).toBeGreaterThan(0); expect(scroll[0]).toBe(scroll[1]);expect(scroll[2]).toBe(scroll[3]);
  await page.setViewportSize({width:390,height:844});
  await page.locator('#text-app').scrollIntoViewIfNeeded();
  const bounds=await page.evaluate(()=>{
    const a=document.querySelector('#text-app').getBoundingClientRect(),b=document.querySelector('.explorer-pane').getBoundingClientRect();
    return {contained:a.left>=b.left && a.right<=b.right && a.bottom<=b.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(bounds).toEqual({contained:true,overflow:false});
  await page.screenshot({path:`screenshots/${mode}-python-editor-mobile.png`});
  await page.locator('#close-file').click();
  await command(page,'mv demo.py demo.txt');
  await page.getByRole('button',{name:'View file demo.txt',exact:true}).dblclick();
  await expect(page.locator('#document-format')).toHaveText('Plain text');
  await expect(page.locator('#editor-highlight')).toBeHidden();
  await expect(page.locator('#run-python')).toBeHidden();
  await editor.fill('Notes and Python use the same editable window.');
  // Save also works when a window control, rather than the textarea, has focus.
  await page.locator('#save-file').focus();
  await page.keyboard.press(mode === 'mac' ? 'Meta+s' : 'Control+s');
  await page.reload();
  await page.getByRole('button',{name:'View file demo.txt',exact:true}).dblclick();
  await expect(editor).toHaveValue('Notes and Python use the same editable window.');
});
