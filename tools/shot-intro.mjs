/**
 * Снимает кадры заставки: node tools/shot-intro.mjs [url]
 * Заставка длится около трёх секунд, поэтому снимки берутся по времени.
 */
import puppeteer from 'puppeteer-core';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', '..', 'review', 'shots');
mkdirSync(OUT, { recursive: true });

const URL = process.argv[2] || 'http://localhost:4173';
const CANDIDATES = [
  // Chromium первым: headless-режим Edge на этой машине перестал отвечать
  // (процесс сразу завершается, ничего не отдав).
  'C:\\Users\\sergw\\AppData\\Local\\ms-playwright\\chromium-1169\\chrome-win\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = CANDIDATES.find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  userDataDir: join(tmpdir(), `edge-profile-${process.pid}`),
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'domcontentloaded' });

const marks = [250, 700, 1150, 1600, 2100, 2600, 3100, 3800];

// Отсчёт от одной точки старта: сам снимок занимает сотни миллисекунд,
// и если вычитать только паузы, кадры уезжают всё дальше по времени.
const startedAt = Date.now();
for (const at of marks) {
  const wait = at - (Date.now() - startedAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const real = Date.now() - startedAt;
  await page.screenshot({ path: join(OUT, `intro-${String(at).padStart(4, '0')}.png`) });
  console.log(`shot intro at ${at} ms (реально ${real} ms)`);
}

await browser.close();
