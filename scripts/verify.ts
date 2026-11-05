import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { ALGORITHMS } from "../src/algorithms";
import { LANGUAGES } from "../src/core/types";

const PORT = 4179;
const shots = process.argv[2] ?? "screenshots";
const server = spawn("bunx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
const base = `http://localhost:${PORT}/`;

function assert(ok: unknown, msg: string): asserts ok {
  if (!ok) throw new Error(`FAIL: ${msg}`);
  console.log(`ok   ${msg}`);
}

try {
  for (let i = 0; i < 50; i++) {
    if (await fetch(base).then((r) => r.ok, () => false)) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  for (const algo of ALGORITHMS) {
    await page.goto(`${base}#/${algo.id}`);
    await page.waitForSelector("h1");
    assert((await page.textContent("h1")) === algo.name, `${algo.id}: page title is ${algo.name}`);

    for (const lang of LANGUAGES) {
      await page.getByRole("tab", { name: lang.label, exact: true }).click();
      const firstLine = await page.locator(".code li").first().textContent();
      assert(firstLine && !firstLine.includes("@@"), `${algo.id}/${lang.id}: code renders without tags`);
    }

    await page.getByRole("tab", { name: "C++", exact: true }).click();
    const counter = page.locator(".counter");
    const before = await counter.textContent();
    await page.getByRole("button", { name: "Next step" }).click();
    await page.getByRole("button", { name: "Next step" }).click();
    assert((await counter.textContent()) !== before, `${algo.id}: stepping advances the frame`);
    assert((await page.locator(".code li.active").count()) > 0, `${algo.id}: a code line is highlighted`);

    const beforePlay = await counter.textContent();
    await page.getByRole("button", { name: "Play" }).click();
    await page.waitForTimeout(1200);
    assert(beforePlay !== (await counter.textContent()), `${algo.id}: play advances frames on its own`);
    await page.getByRole("button", { name: "Pause" }).click();
    const paused = await counter.textContent();
    await page.waitForTimeout(500);
    assert(paused === (await counter.textContent()), `${algo.id}: pause holds the frame`);
    await page.screenshot({ path: `${shots}/${algo.id}-mid.png` });

    await page.getByRole("button", { name: "Last step" }).click();
    const [cur, total] = (await counter.textContent())!.split("/").map((s) => s.trim());
    assert(cur === total, `${algo.id}: seek to last frame (${total} frames)`);
    if (algo.kind === "sorting") {
      const sorted = await page.locator('.bar[data-mark="sorted"]').count();
      assert(sorted === (await page.locator(".bar").count()), `${algo.id}: every bar ends sorted`);
    } else {
      const visited = await page.locator('.node[data-mark="visited"]').count();
      assert(visited === (await page.locator(".node").count()), `${algo.id}: every node ends visited`);
    }
    await page.screenshot({ path: `${shots}/${algo.id}-end.png` });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}#/${ALGORITHMS[0].id}`);
  await page.waitForSelector("h1");
  for (let i = 0; i < 25; i++) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(600);
  const scrolled = await page.evaluate(() => window.scrollY);
  assert(scrolled === 0, `mobile: stepping keeps the page still (scrollY ${scrolled})`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, `mobile: no horizontal scroll (overflow ${overflow}px)`);
  await page.screenshot({ path: `${shots}/mobile.png`, fullPage: true });

  assert(errors.length === 0, `no console errors ${errors.join(" | ")}`);
  await browser.close();
} finally {
  server.kill();
}
