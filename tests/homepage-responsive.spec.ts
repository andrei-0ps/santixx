import { existsSync } from "node:fs";
import { chromium, expect, test, type Browser } from "@playwright/test";

const BASE_URL = process.env.RESPONSIVE_E2E_BASE_URL ?? "http://127.0.0.1:5174";
const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean) as string[];
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

let browser: Browser | null = null;
let serverAvailable = false;

const scenarios = [
  { width: 360, height: 800, lang: "ro", theme: "dark" },
  { width: 390, height: 844, lang: "en", theme: "light" },
  { width: 768, height: 1024, lang: "en", theme: "dark" },
  { width: 1280, height: 720, lang: "ro", theme: "light" },
  { width: 1440, height: 900, lang: "ro", theme: "dark" },
] as const;

test.describe("homepage responsive", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    if (!executablePath) return;
    try {
      serverAvailable = (await fetch(BASE_URL)).ok;
    } catch {
      serverAvailable = false;
    }
    if (serverAvailable) browser = await chromium.launch({ headless: true, executablePath });
  });

  test.afterAll(async () => {
    await browser?.close();
  });

  for (const scenario of scenarios) {
    test(`${scenario.width}x${scenario.height} ${scenario.lang}/${scenario.theme}`, async () => {
      test.skip(!browser || !serverAvailable, "Homepage check requires the local app and Edge.");
      const context = await browser!.newContext({
        viewport: { width: scenario.width, height: scenario.height },
      });
      await context.addInitScript(({ lang, theme }) => {
        window.localStorage.setItem("santix-lang", lang);
        window.localStorage.setItem("santix-theme", theme);
      }, scenario);
      const page = await context.newPage();
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

      await expect(page.locator("main h1")).toContainText("Santix");
      await expect(page.getByRole("link", { name: /Începe acum|Get started/i }).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/De ce am făcut Santix|Why we built Santix/i);
      await expect(page.locator("html")).toHaveAttribute("lang", scenario.lang);
      if (scenario.theme === "light") {
        await expect(page.locator("html")).toHaveClass(/light-mode/);
      } else {
        await expect(page.locator("html")).not.toHaveClass(/light-mode/);
      }

      const overflow = await page.evaluate(
        () =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      const headerFits = await page.locator("header").evaluate((header) => {
        const viewportWidth = document.documentElement.clientWidth;
        const rect = header.getBoundingClientRect();
        return rect.left >= -1 && rect.right <= viewportWidth + 1 && header.scrollWidth <= header.clientWidth + 1;
      });
      expect(headerFits).toBe(true);
      await context.close();
    });
  }
});
