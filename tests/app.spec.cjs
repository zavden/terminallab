const { test, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const command = async (page, text) => {
  await page.locator("#command-input").fill(text);
  await page.locator("#command-input").press("Enter");
};
async function start(page, mode = "mac") {
  await page.goto("/");
  await page.locator("#platform-" + mode).click();
}

for (const mode of ["mac", "windows"]) {
  test(`${mode}: command workflow, sync, preview, reload and themes`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await start(page, mode);
    for (const text of [
      "ls",
      "mkdir my-project",
      "cd my-project",
      mode === "mac" ? "touch note.txt" : "New-Item note.txt -ItemType File",
      'echo "Hello, world" > note.txt',
      "cat note.txt",
      "cd ..",
    ])
      await command(page, text);
    await expect(page.locator("#folder-title")).toHaveText("user");
    await page
      .getByRole("button", { name: "Open folder my-project", exact: true })
      .dblclick();
    await expect(page.locator("#prompt-label")).toContainText("my-project");
    await page
      .getByRole("button", { name: "View file note.txt", exact: true })
      .dblclick();
    await expect(page.locator("#preview-content")).toHaveValue("Hello, world\n");
    await page.getByRole("button", { name: "Close file" }).click();
    await page.reload();
    await expect(page.locator("#folder-title")).toHaveText("my-project");
    await page.locator("#theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#file-grid .file-item")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test("filesystem changes, errors, filters, autocomplete and history", async ({
  page,
}) => {
  await start(page);
  await command(page, 'mkdir "My ideas"');
  await command(page, 'cd "My ideas"');
  await command(page, 'echo "hola" > note.txt');
  await command(page, "cp note.txt copy.txt");
  await command(page, "mv copy.txt other.txt");
  await command(page, "rm other.txt");
  await expect(page.locator("#file-grid .file-item")).toHaveCount(1);
  await command(page, "cd missing");
  await expect(page.locator(".output-error").last()).toContainText("Not found");
  await expect(page.locator("#folder-title")).toHaveText("My ideas");
  await page.locator("#command-input").press("ArrowUp");
  await expect(page.locator("#command-input")).toHaveValue("cd missing");
  await page.locator("#command-input").fill("cat no");
  await page.locator("#command-input").press("Tab");
  await expect(page.locator("#command-input")).toHaveValue("cat 'note.txt' ");
  await page.locator("#file-search").fill("none");
  await expect(page.locator("#file-grid")).toContainText("No matches found");
  await page.locator("#file-search").fill("note");
  await expect(page.locator("#file-grid .file-item")).toHaveCount(1);
  await page.locator("#list-view").click();
  await expect(page.locator("#file-grid")).toHaveClass("file-grid list");
  await page.locator("#go-up").click();
  await expect(page.locator("#folder-title")).toHaveText("user");
  await page.locator("#go-back").click();
  await expect(page.locator("#folder-title")).toHaveText("My ideas");
});

test("safe text, blocked commands and independent operating systems", async ({
  page,
}) => {
  await start(page);
  await command(page, `echo '<img src=x onerror=alert(1)>' > unsafe.txt`);
  await page
    .getByRole("button", { name: "View file unsafe.txt", exact: true })
    .dblclick();
  await expect(page.locator("#preview-content")).toHaveValue(
    "<img src=x onerror=alert(1)>\n",
  );
  await expect(page.locator("#preview-content img")).toHaveCount(0);
  await page.getByRole("button", { name: "Close file", exact: true }).click();
  await command(page, "ls; rm unsafe.txt");
  await expect(page.locator(".output-error").last()).toContainText(
    "without pipes",
  );
  await page.locator("#platform-windows").click();
  await expect(
    page.getByRole("button", { name: "View file unsafe.txt", exact: true }),
  ).toHaveCount(0);
  await command(page, "touch x.txt");
  await expect(page.locator(".output-error").last()).toContainText("New-Item");
  await page.locator("#platform-mac").click();
  await expect(
    page.getByRole("button", { name: "View file unsafe.txt", exact: true }),
  ).toBeVisible();
  await page.locator("#reset-open").click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View file unsafe.txt", exact: true }),
  ).toBeVisible();
  await page.locator("#reset-open").click();
  await page.locator("#reset-confirm").click();
  await expect(
    page.getByRole("button", { name: "View file unsafe.txt", exact: true }),
  ).toHaveCount(0);
});

test("guide examples and mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await expect(page.locator("#terminal-form")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator("#reference-open").click();
  await page.locator("#reference-search").fill("file");
  await expect(page.locator("#reference-list")).toContainText("Create a file");
  await page
    .locator(".reference-example")
    .filter({ hasText: "New-Item note.txt" })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-platform",
    "windows",
  );
  await expect(page.locator("#command-input")).toHaveValue(
    "New-Item note.txt -ItemType File",
  );
  await page.locator("#command-input").press("Enter");
  await expect(
    page.getByRole("button", { name: "View file note.txt", exact: true }),
  ).toBeVisible();
  await page
    .locator("#toast")
    .evaluate((node) => node.classList.remove("visible"));
  await page.screenshot({ path: "screenshots/mobile.png", fullPage: true });
});

test("runs directly over file:// without a server or network requests", async ({
  page,
}) => {
  const errors = [],
    requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url())) requests.push(request.url());
  });
  await page.goto(pathToFileURL(path.resolve("index.html")).href);
  await page.locator("#platform-mac").click();
  await command(page, "mkdir offline");
  await command(page, "cd offline");
  await command(page, 'echo "Sin servidor" > note.txt');
  await expect(page.locator("#folder-title")).toHaveText("offline");
  await page
    .getByRole("button", { name: "View file note.txt", exact: true })
    .dblclick();
  await expect(page.locator("#preview-content")).toHaveValue("Sin servidor\n");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("desktop visual states and no client errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await page.screenshot({
    path: "screenshots/macos-light.png",
    fullPage: true,
  });
  await page.locator("#theme-toggle").click();
  await page.screenshot({ path: "screenshots/macos-dark.png", fullPage: true });
  await page.locator("#platform-windows").click();
  await page.screenshot({
    path: "screenshots/windows-dark.png",
    fullPage: true,
  });
  await page.locator("#theme-toggle").click();
  await page.screenshot({
    path: "screenshots/windows-light.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("repository note opens GitHub safely and the footer shows credits", async ({
  page,
}) => {
  await page.goto("/");
  const repo = page.getByRole("link", {
    name: "github.com/zavden/terminallab",
  });
  await expect(repo).toHaveAttribute(
    "href",
    "https://github.com/zavden/terminallab",
  );
  await expect(repo).toHaveAttribute("target", "_blank");
  await expect(repo).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator(".site-credit")).toContainText(
    "Reviewed and fixed by Claude Opus 5.5",
  );
});

test("accessibility: both systems and themes, plus guide dialog", async ({
  page,
}) => {
  const AxeBuilder = require("@axe-core/playwright").default;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  for (const mode of ["mac", "windows"]) {
    await page.locator("#platform-" + mode).click();
    for (let theme = 0; theme < 2; theme++) {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ).toEqual([]);
      await page.locator("#theme-toggle").click();
    }
  }
  await page.locator("#reference-open").click();
  const dialogResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    dialogResults.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("macOS starts with a plain inline zsh prompt and clears cleanly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".terminal-welcome")).toHaveCount(0);
  await expect(page.locator("#mac-login")).toContainText("Last login:");
  await expect(page.locator("#prompt-label")).toHaveText(
    "user@MacBook-Air ~ %",
  );
  await expect(page.locator("#command-input")).toHaveAttribute(
    "placeholder",
    "",
  );
  const layout = await page.evaluate(() => {
    const prompt = document
      .querySelector("#prompt-label")
      .getBoundingClientRect();
    const input = document
      .querySelector("#command-input")
      .getBoundingClientRect();
    return {
      sameLine: Math.abs(prompt.top - input.top) < 4,
      white: getComputedStyle(document.querySelector(".terminal-pane"))
        .backgroundColor,
    };
  });
  expect(layout).toEqual({ sameLine: true, white: "rgb(255, 255, 255)" });
  await command(page, "cd Documents");
  await expect(page.locator("#prompt-label")).toHaveText(
    "user@MacBook-Air Documents %",
  );
  await expect(page.locator("#terminal-output")).toContainText(
    "user@MacBook-Air ~ % cd Documents",
  );
  await command(page, "clear");
  await expect(page.locator("#mac-login")).toBeHidden();
  await expect(page.locator("#terminal-output")).toBeEmpty();
  await page.locator("#platform-windows").click();
  await expect(page.locator("#prompt-label")).toHaveText("PS C:\\Users\\user>");
});

for (const mode of ["mac", "windows"]) {
  test(`${mode}: plain console and saved username migration preserve files`, async ({
    page,
  }) => {
    await start(page, mode);
    await expect(
      page.locator(".learning-section, .quick-section, .terminal-welcome"),
    ).toHaveCount(0);
    await expect(page.locator("#command-input")).toHaveAttribute(
      "placeholder",
      "",
    );
    await command(page, "whoami");
    await expect(page.locator(".output-text").last()).toHaveText("user");
    await page.evaluate((mode) => {
      const shell = new window.TerminalLab.VirtualShell(mode);
      shell.execute('echo "Preserve alex in my text" > Documents/my-work.txt');
      shell.execute("cd Documents");
      const snapshot = shell.snapshot();
      const oldPath = (value) => value.replace("/Users/user", "/Users/alex");
      snapshot.cwd = oldPath(snapshot.cwd);
      snapshot.nodes = snapshot.nodes.map(([path, node]) => [
        oldPath(path),
        node,
      ]);
      localStorage.setItem(
        "terminal-lab:v1",
        JSON.stringify({
          preferences: { platform: mode, theme: "light" },
          [mode]: { filesystem: snapshot, history: [], logs: [] },
        }),
      );
    }, mode);
    await page.reload();
    await expect(page.locator("#folder-title")).toHaveText("Documents");
    await command(page, "pwd");
    await expect(page.locator(".output-text").last()).toHaveText(
      mode === "mac" ? "/Users/user/Documents" : "C:\\Users\\user\\Documents",
    );
    await page
      .getByRole("button", { name: "View file my-work.txt", exact: true })
      .dblclick();
    await expect(page.locator("#preview-content")).toHaveValue(
      "Preserve alex in my text\n",
    );
  });
}

for (const mode of ["mac", "windows"]) {
  test(`${mode}: double-click opens a text app on the right, with live updates and keyboard navigation`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await start(page, mode);
    const folder = page.getByRole("button", {
      name: "Open folder Documents",
      exact: true,
    });
    await folder.click();
    await expect(folder).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#folder-title")).toHaveText("user");
    await folder.dblclick();
    const file = page.getByRole("button", {
      name: "View file notes.txt",
      exact: true,
    });
    await file.click();
    await expect(page.locator("#text-app")).toBeHidden();
    await file.dblclick();
    await expect(page.locator("#text-app")).toBeVisible();
    await expect(page.locator("#explorer-heading")).toHaveText(
      mode === "mac" ? "Finder" : "File Explorer",
    );
    await expect(page.locator("#document-window-title")).toHaveText(
      `${mode === "mac" ? "TextEdit" : "Notepad"} — notes.txt`,
    );
    await expect(page.locator(".explorer-sidebar")).toBeVisible();
    await expect(page.locator("#breadcrumbs")).toBeVisible();
    await expect(page.locator("#preview-content")).toHaveValue(
      /My first note/,
    );
    const location = await page.evaluate(() => ({
      viewer: document.querySelector("#text-app").getBoundingClientRect().left,
      terminal: document.querySelector(".terminal-pane").getBoundingClientRect()
        .right,
    }));
    expect(location.viewer).toBeGreaterThanOrEqual(location.terminal - 1);
    await command(page, 'echo "Updated in the terminal" > notes.txt');
    await expect(page.locator("#preview-content")).toHaveValue(
      "Updated in the terminal\n",
    );
    await page.locator("#preview-content").focus();
    await page.keyboard.press("Escape");
    await expect(file).toBeFocused();
    await file.press("Enter");
    await expect(page.locator("#text-app")).toBeVisible();
    const AxeBuilder = require("@axe-core/playwright").default;
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    const bounds = await page.evaluate(() => {
      const app = document.querySelector("#text-app").getBoundingClientRect();
      const area = document
        .querySelector(".explorer-pane")
        .getBoundingClientRect();
      return {
        contained:
          app.left >= area.left &&
          app.top >= area.top &&
          app.right <= area.right &&
          app.bottom <= area.bottom,
        width: app.width,
      };
    });
    expect(bounds.contained).toBe(true);
    const paneWidth = (await page.locator(".explorer-pane").boundingBox()).width;
    expect(bounds.width / paneWidth).toBeCloseTo(0.95, 1);
    await expect(page.locator(".explorer-body")).toHaveAttribute("inert", "");
    await page
      .getByRole("button", { name: "Minimize file", exact: true })
      .click();
    await expect(page.locator("#text-app")).toBeHidden();
    await expect(page.locator("#restore-file")).toBeVisible();
    await expect(page.locator(".explorer-body")).not.toHaveAttribute("inert", "");
    await expect(page.locator(".explorer-sidebar").getByRole("button", { name: "user", exact: true })).toBeEnabled();
    await page.locator("#restore-file").click();
    await page
      .getByRole("button", { name: "Maximize file", exact: true })
      .click();
    expect(
      (await page.locator("#text-app").boundingBox()).width,
    ).toBeGreaterThan(bounds.width);
    await expect(page.locator("#breadcrumbs")).toBeVisible();
    await page
      .getByRole("button", { name: "Restore file window", exact: true })
      .click();
    await page.locator("#command-input").focus();
    await page.screenshot({
      path: `screenshots/${mode}-text-app.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.locator("#theme-toggle").click();
    const darkAudit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      darkAudit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    await page.screenshot({
      path: `screenshots/${mode}-text-app-dark.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileLayout = await page.evaluate(() => {
      const app = document.querySelector("#text-app").getBoundingClientRect();
      const sidebar = document
        .querySelector(".explorer-sidebar")
        .getBoundingClientRect();
      const area = document
        .querySelector(".explorer-pane")
        .getBoundingClientRect();
      return (
        app.left >= area.left &&
        app.left < sidebar.right &&
        app.top >= area.top &&
        app.right <= area.right &&
        app.bottom <= area.bottom &&
        document.documentElement.scrollWidth <= window.innerWidth
      );
    });
    expect(mobileLayout).toBe(true);
    await page.getByRole("button", { name: "Close file", exact: true }).click();
    await expect(page.locator("#folder-title")).toHaveText("Documents");
  });
}
