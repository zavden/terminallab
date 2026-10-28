const {test,expect} = require('@playwright/test');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const command = async(page,text) => {
  await page.locator('#command-input').fill(text);
  await page.locator('#command-input').press('Enter');
};
for (const mode of ['mac','windows']) test(`${mode}: bundled beginner programs run and existing sessions upgrade`, async({page})=> {
  test.setTimeout(90000);
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.locator('#platform-'+mode).click();
  // Simulate a saved session from before examples were introduced.
  await page.evaluate(mode=> {
    const shell=new TerminalLab.VirtualShell(mode);
    const old=shell.snapshot();
    delete old.pythonSamplesVersion;
    old.nodes=old.nodes.filter(([p])=>p!=='/Users/user/hello_world.py' && !p.startsWith('/Users/user/Python Examples'));
    old.nodes.push(['/Users/user/my_work.py',{type:'file',content:'print("Keep my work")'}]);
    localStorage.setItem('terminal-lab:v1',JSON.stringify({preferences:{platform:mode,theme:'light'},[mode]:{filesystem:old}}));
  },mode);
  await page.reload();
  await expect(page.getByRole('button',{name:'View file hello_world.py',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Open folder Python Examples',exact:true})).toBeVisible();
  const examples=[
    ['hello_world.py','Hello, world!'],
    ['Python Examples/variables.py','3 apples cost 7.50.'],
    ['Python Examples/loops.py','5 squared is 25'],
    ['Python Examples/functions.py','12 square units'],
    ['Python Examples/lists.py','passed!'],
    ['Python Examples/input.py','Nice to meet you, user!'],
    ['Python Examples/files.py','This file was created by Python!'],
    ['Python Examples/paths.py','Absolute home path: /Users/user/hello_world.py'],
    ['Python Examples/arguments.py','Try adding a name'],
  ];
  for (const [file,output] of examples) {
    await command(page,`python "${file}"`);
    await expect(page.locator('#python-stop')).toBeHidden({timeout:60000});
    await expect(page.locator('#terminal-output .output-text').last()).toContainText(output);
  }
  await expect(page.getByRole('button',{name:'View file python_result.txt',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Open folder Python Examples',exact:true}).dblclick();
  await command(page,'python ../hello_world.py');
  await expect(page.locator('#python-stop')).toBeHidden({timeout:60000});
  await expect(page.locator('#terminal-output .output-text').last()).toContainText('Hello, world!');
  await command(page,mode==='mac'?'python /Users/user/hello_world.py':'python C:\\Users\\user\\hello_world.py');
  await expect(page.locator('#python-stop')).toBeHidden({timeout:60000});
  await expect(page.locator('#terminal-output .output-text').last()).toContainText('Hello, world!');
  await command(page,'cat ../my_work.py');
  await expect(page.locator('#terminal-output .output-text').last()).toContainText('Keep my work');
});
