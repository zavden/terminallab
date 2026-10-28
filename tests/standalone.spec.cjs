const { test, expect } = require("@playwright/test");
const { mkdtempSync, copyFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

for (const mode of ["mac", "windows"]) {
  test(`standalone ${mode}: copied HTML works alone, without external assets or network`, async ({
    page,
  }) => {
    const directory = mkdtempSync(
      path.join(tmpdir(), "terminal-lab-standalone-"),
    );
    const file = path.join(directory, "index.html");
    copyFileSync(path.resolve("standalone/index.html"), file);
    const errors = [],
      requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => requests.push(request.url()));
    try {
      await page.context().setOffline(true);
      await page.goto(pathToFileURL(file).href);
      await page.locator("#platform-" + mode).click();
      await expect(
        page.locator('script[src], link[rel="stylesheet"]'),
      ).toHaveCount(0);
      const command = async (text) => {
        await page.locator("#command-input").fill(text);
        await page.locator("#command-input").press("Enter");
      };
      if (await page.locator("html").getAttribute("data-theme") !== "dark") await page.locator("#theme-toggle").click();
      await page.locator("#workspace-expand").click();
      await expect(page.locator(".intro")).toBeHidden();
      await expect(page.locator("#workspace-collapse")).toBeVisible();
      await command("python hello_world.py");
      await expect(page.locator("#python-stop")).toBeHidden({timeout:60000});
      await expect(page.locator("#terminal-output")).toContainText("Hello, world!");
      await command("mkdir standalone-test");
      await command("cd standalone-test");
      await command('echo "One HTML file" > note.txt');
      await expect(page.locator("#folder-title")).toHaveText("standalone-test");
      await page
        .getByRole("button", { name: "View file note.txt", exact: true })
        .dblclick();
      await expect(page.locator("#preview-content")).toHaveValue(
        "One HTML file\n",
      );
      await expect(page.locator("#document-window-title")).toContainText(
        mode === "mac" ? "TextEdit" : "Notepad",
      );
      await page.locator("#preview-content").fill('name = input("Name: ")\nprint("Hello", name)\nfrom pathlib import Path\nPath("result.txt").write_text("Saved by Python", encoding="utf-8")');
      await page.locator("#preview-content").press(mode === "mac" ? "Meta+s" : "Control+s");
      await expect(page.locator("#toast")).toHaveText("File saved.");
      await page
        .getByRole("button", { name: "Minimize file", exact: true })
        .click();
      await page.locator("#restore-file").click();
      await expect(page.locator("#text-app")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.locator("#close-file").click();
      await command("mv note.txt program.py");
      await page.getByRole("button", {name:"View file program.py", exact:true}).dblclick();
      await expect(page.locator("#document-format")).toHaveText("Python");
      await expect(page.locator(".syntax-keyword").first()).toHaveText("from");
      await page.locator("#python-input-open").click();
      await page.locator("#python-stdin").fill("Ada");
      await page.getByRole("button", {name:"Done", exact:true}).click();
      await command(mode === "mac" ? "python /Users/user/standalone-test/program.py" : "py C:\\Users\\user\\standalone-test\\program.py");
      await expect(page.locator("#python-stop")).toBeHidden({timeout:60000});
      await expect(page.locator("#terminal-output")).toContainText("Hello Ada");
      await page.locator("#close-file").click();
      await expect(page.getByRole("button", {name:"View file result.txt", exact:true})).toBeVisible();
      await page.reload();
      await expect(page.locator("#folder-title")).toHaveText("standalone-test");
      await expect(
        page.getByRole("button", { name: "View file program.py", exact: true }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await command('echo "<script>alert(1)</script>" > literal.txt');
      await page
        .getByRole("button", { name: "View file literal.txt", exact: true })
        .dblclick();
      await expect(page.locator("#preview-content")).toHaveValue(
        "<script>alert(1)</script>\n",
      );
      // Reload returns to normal mode; expand again to verify mobile bounds.
      await page.locator("#workspace-expand").click();
      await page.setViewportSize({width:390, height:844});
      const contained = await page.evaluate(() => {
        const app = document.querySelector("#text-app").getBoundingClientRect();
        const pane = document.querySelector(".explorer-pane").getBoundingClientRect();
        return app.left >= pane.left && app.right <= pane.right && app.bottom <= pane.bottom &&
          document.documentElement.scrollWidth <= innerWidth;
      });
      expect(contained).toBe(true);
      const viewport = await page.locator(".workspace").boundingBox();
      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);
      expect(viewport.width).toBe(390);
      expect(viewport.height).toBe(844);
      await page.locator("#workspace-collapse").click();
      await expect(page.locator(".intro")).toBeVisible();
      expect(
        requests.every(
          (url) => url === pathToFileURL(file).href || (url.startsWith("data:") || url.startsWith("blob:")),
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
