import { existsSync } from "node:fs";
import { chromium, expect, test, type Browser, type Page } from "@playwright/test";

const BASE_URL = process.env.AI_REAL_ROUTE_BASE_URL ?? "http://127.0.0.1:5174";
const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean) as string[];
const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

let browser: Browser | null = null;
let serverAvailable = false;

async function openGuestExplorer(language: "ro" | "en" = "ro") {
  test.skip(
    !browser || !serverAvailable,
    "Real AI route requires the local app and Chromium/Edge.",
  );
  const context = await browser!.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript((lang) => {
    window.localStorage.clear();
    window.localStorage.setItem("santix-lang", lang);
  }, language);
  await context.route("**/studio_small_03_1k.hdr", async (route) => {
    const header = Buffer.from("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 1 +X 1\n", "ascii");
    const pixel = Buffer.from([128, 128, 128, 128]);
    await route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: Buffer.concat([header, pixel]),
    });
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/explorator?debugAi=1`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1_000);
  return page;
}

async function selectStructure(page: Page, search: string) {
  const searchInput = page.locator('[data-testid="anatomy-search-overlay"] input');
  await expect(async () => {
    await searchInput.fill(search);
    await expect(searchInput).toHaveValue(search);
  }).toPass({ timeout: 15_000 });
  await searchInput.press("Enter");
  const panel = page.locator('[data-testid="bone-info-panel"]');
  await expect(panel).toBeVisible({ timeout: 20_000 });
  return panel;
}

async function sendAndWait(panel: ReturnType<Page["locator"]>, message: string) {
  const assistantMessages = panel.locator('[data-testid="ai-message-assistant"]');
  const before = await assistantMessages.count();
  const input = panel.locator('[data-testid="ai-chat-input"]');
  await input.fill(message);
  await input.press("Enter");
  await expect(assistantMessages).toHaveCount(before + 1, { timeout: 20_000 });
}

async function reachHumerusDuration(page: Page) {
  const panel = await selectStructure(page, "humerus");
  for (const message of [
    "ma doare humerusul",
    "nu",
    "da, pot misca normal",
    "nu",
    "nu",
    "moderata",
  ]) {
    await sendAndWait(panel, message);
  }
  await expect(panel.locator('[data-testid="ai-chat-input"]')).toHaveAttribute(
    "placeholder",
    "Ex.: De două zile",
  );
  return panel;
}

test.describe("real browser to server AI state route", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  test.beforeAll(async () => {
    if (!executablePath) return;
    try {
      const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(5_000) });
      serverAvailable = response.ok;
    } catch {
      serverAvailable = false;
    }
    if (serverAvailable) {
      browser = await chromium.launch({ headless: true, executablePath });
    }
  });

  test.afterAll(async () => {
    await browser?.close();
  });

  test("guest duration reply advances without the legacy anatomical fallback", async () => {
    const page = await openGuestExplorer("ro");
    const panel = await reachHumerusDuration(page);
    await sendAndWait(panel, "simt durerea de 2 zile");

    const finalizeButton = panel.getByRole("button", { name: /Finalizează rezumatul/i });
    await expect(finalizeButton).toBeVisible();
    await finalizeButton.click();

    const finalMessage = panel.locator('[data-testid="ai-message-assistant"]').last();
    await expect(finalMessage).toContainText("Orientare Santix:");
    const pdfButton = panel.locator('[data-testid="generate-medical-sheet-button"]');
    await expect(pdfButton).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await pdfButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("santix-fisa-medic.pdf");
    expect(await download.path()).toBeTruthy();
    await expect(panel).not.toContainText(/Te referi la .* sau la o durere în zona/i);
    await page.context().close();
  });

  test("guest fall category answers the active trauma question through the real route", async () => {
    const page = await openGuestExplorer("ro");
    const panel = await selectStructure(page, "coxal");
    await sendAndWait(panel, "ma doare");

    const input = panel.locator('[data-testid="ai-chat-input"]');
    await expect(input).toHaveAttribute("placeholder", "Ex.: Căzătură, lovitură sau efort");

    await sendAndWait(panel, "cazatura");
    const lastAssistantMessage = panel.locator('[data-testid="ai-message-assistant"]').last();
    await expect(lastAssistantMessage).not.toContainText(
      "Nu am putut interpreta răspunsul la întrebarea curentă",
    );
    await expect(lastAssistantMessage).toContainText(/Am notat: căzătură/i);
    await expect(input).not.toHaveAttribute("placeholder", "Ex.: Căzătură, lovitură sau efort");
    await page.context().close();
  });

  test("guest movement, visible signs and sensation advance and survive refresh", async () => {
    const page = await openGuestExplorer("ro");
    let panel = await selectStructure(page, "humerus");
    await sendAndWait(panel, "ma doare");
    await sendAndWait(panel, "cazatura");

    const input = panel.locator('[data-testid="ai-chat-input"]');
    await expect(input).toHaveAttribute("placeholder", "Ex.: Pot mișca normal");
    await sendAndWait(panel, "normal");
    await expect(input).toHaveAttribute("placeholder", "Ex.: Este puțin umflat");

    await sendAndWait(panel, "cred ca o umflatura");
    let lastAssistantMessage = panel.locator('[data-testid="ai-message-assistant"]').last();
    await expect(lastAssistantMessage).toContainText(/Am notat: umflare/i);
    await expect(lastAssistantMessage).not.toContainText(
      "Nu am putut interpreta răspunsul la întrebarea curentă",
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    panel = page.locator('[data-testid="bone-info-panel"]');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(panel.locator('[data-testid="ai-chat-input"]')).toHaveAttribute(
      "placeholder",
      "Ex.: Am amorțeală",
    );

    await sendAndWait(panel, "am furnicaturi");
    lastAssistantMessage = panel.locator('[data-testid="ai-message-assistant"]').last();
    await expect(lastAssistantMessage).toContainText(/Am notat: furnicături/i);
    await expect(lastAssistantMessage).not.toContainText(
      "Nu am putut interpreta răspunsul la întrebarea curentă",
    );
    await page.context().close();
  });

  test("guest mixed local negation stores bruising and advances through the real route", async () => {
    const page = await openGuestExplorer("ro");
    const panel = await selectStructure(page, "humerus");
    for (const message of ["ma doare", "cazatura", "normal"]) {
      await sendAndWait(panel, message);
    }
    await sendAndWait(panel, "nu e umflat dar e vanat");

    const lastAssistantMessage = panel.locator('[data-testid="ai-message-assistant"]').last();
    await expect(lastAssistantMessage).toContainText(/Am notat: vânătaie/i);
    await expect(lastAssistantMessage).not.toContainText(
      "Nu am putut interpreta răspunsul la întrebarea curentă",
    );
    await expect(panel.locator('[data-testid="ai-chat-input"]')).toHaveAttribute(
      "placeholder",
      "Ex.: Am amorțeală",
    );
    await page.context().close();
  });

  test("guest long duration sentence keeps the active flow", async () => {
    const page = await openGuestExplorer("ro");
    const panel = await reachHumerusDuration(page);
    await sendAndWait(
      panel,
      "prima oară a apărut acum 10 zile și tot o simt în fiecare zi de câteva ori pe zi",
    );

    await expect(panel.getByRole("button", { name: /Finalizează rezumatul/i })).toBeVisible();
    await expect(panel).not.toContainText(/Te referi la .* sau la o durere în zona/i);
    await page.context().close();
  });

  test("ribs breathing reply uses the active English question and localized placeholder", async () => {
    const page = await openGuestExplorer("en");
    const panel = await selectStructure(page, "ribs");
    await sendAndWait(panel, "it hurts");
    await sendAndWait(panel, "no");

    await expect(panel.locator('[data-testid="ai-chat-input"]')).toHaveAttribute(
      "placeholder",
      "E.g. It hurts more when I breathe",
    );
    await sendAndWait(panel, "when i take a deep breath it hurts worse");
    await expect(panel).not.toContainText(/Are you asking about .* or pain in the/i);
    await expect(panel.locator('[data-testid="ai-chat-input"]')).not.toHaveAttribute(
      "placeholder",
      "E.g. It hurts more when I breathe",
    );
    await page.context().close();
  });

  test("English evidence sentence advances the contextual visible-sign question", async () => {
    const page = await openGuestExplorer("en");
    const panel = await selectStructure(page, "humerus");
    for (const message of ["it hurts", "I fell", "I can move normally"]) {
      await sendAndWait(panel, message);
    }
    await sendAndWait(panel, "it is not swollen, but it is bruised");

    const lastAssistantMessage = panel.locator('[data-testid="ai-message-assistant"]').last();
    await expect(lastAssistantMessage).toContainText(/I noted: bruising/i);
    await expect(lastAssistantMessage).not.toContainText(
      "I could not interpret the answer to the current question",
    );
    await page.context().close();
  });
});
