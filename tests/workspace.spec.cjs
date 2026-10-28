const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
for (const mode of ['mac','windows']) test(`${mode}: viewport workspace and return preserve the open editor`, async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.locator('#platform-'+mode).click();
  await page.getByRole('button',{name:'View file hello_world.py',exact:true}).dblclick();
  const editor = page.locator('#preview-content');
  await editor.fill('print("Full viewport")\n');
  for (const theme of ['light','dark']) {
    if(await page.locator('html').getAttribute('data-theme')!==theme) await page.locator('#theme-toggle').click();
    await page.locator('#workspace-expand').click();
    await expect(page.locator('#workspace-collapse')).toBeFocused();
    await expect(page.locator('.intro')).toBeHidden();
    await expect(page.locator('.site-header')).toBeHidden();
    await expect(page.locator('.connection-bar')).toBeHidden();
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:900});
      const layout=await page.evaluate(()=>{
        const box=s=>document.querySelector(s).getBoundingClientRect();
        const workspace=box('.workspace'),terminal=box('.terminal-pane'),gui=box('.explorer-pane'),editor=box('#text-app');
        return {fills:workspace.x===0&&workspace.y===0&&Math.abs(workspace.width-innerWidth)<1&&Math.abs(workspace.height-innerHeight)<1,
          contained:[terminal,gui].every(b=>b.width>0&&b.height>0&&b.left>=0&&b.top>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1),
          editor:editor.left>=gui.left&&editor.right<=gui.right&&editor.bottom<=gui.bottom,
          aligned:innerWidth>760?Math.abs(terminal.right-gui.left)<1:Math.abs(terminal.bottom-gui.top)<1};
      });
      expect(layout).toEqual({fills:true,contained:true,editor:true,aligned:true});
      await page.screenshot({path:`screenshots/${mode}-workspace-${theme}-${width}.png`});
    }
    await editor.press(mode==='mac'?'Meta+s':'Control+s');
    await expect(page.locator('#toast')).toHaveText('File saved.');
    await page.locator('#workspace-collapse').click();
    await expect(page.locator('#workspace-expand')).toBeFocused();
    await expect(page.locator('.intro')).toBeVisible();
    await expect(editor).toHaveValue('print("Full viewport")\n');
    await page.setViewportSize({width:1440,height:900});
  }
  await page.locator('#workspace-expand').click();
  await editor.press('Escape');
  await expect(page.locator('#text-app')).toBeHidden();
  await expect(page.locator('#workspace-collapse')).toBeVisible();
  await page.locator('#command-input').press('Escape');
  await expect(page.locator('#workspace-expand')).toBeVisible();
});
