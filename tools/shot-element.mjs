/**
 * Снимает один элемент целиком: node tools/shot-element.mjs <селектор> <имя> [url]
 */
import puppeteer from 'puppeteer-core';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', '..', 'review', 'shots');
mkdirSync(OUT, { recursive: true });

const selector = process.argv[2];
const name = process.argv[3] || 'element';
const url = process.argv[4] || 'http://localhost:4173';
const width = Number(process.argv[5]) || 1440;

const candidates = [
  // Chromium первым: headless-режим Edge на этой машине перестал отвечать
  // (процесс сразу завершается, ничего не отдав).
  'C:\\Users\\sergw\\AppData\\Local\\ms-playwright\\chromium-1169\\chrome-win\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = candidates.find((path) => existsSync(path));

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  userDataDir: join(tmpdir(), `edge-profile-${process.pid}`),
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
});

const page = await browser.newPage();
await page.setViewport({ width, height: 1400 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate((sel) => {
  document.querySelector(sel).scrollIntoView({ block: 'center' });
}, selector);
await new Promise((resolve) => setTimeout(resolve, 4200));

const element = await page.$(selector);
await element.screenshot({ path: join(OUT, `${name}.png`) });
console.log('shot', name);

await browser.close();
