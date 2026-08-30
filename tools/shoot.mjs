/**
 * Снимает страницу настоящим браузером (headless Edge через puppeteer-core).
 * Папка tools в сборку не попадает.
 *
 * Запуск: node tools/shoot.mjs [url]
 */
import puppeteer from 'puppeteer-core';
import { tmpdir } from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILM_CAPTIONS } from '../src/data/site.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', '..', 'review', 'shots');
mkdirSync(OUT, { recursive: true });

const URL = process.argv[2] || 'http://localhost:4173';

/**
 * Оба варианта — движок Chromium.
 *
 * Chromium стоит первым вынужденно: headless-режим Edge на этой машине
 * перестал отвечать, процесс сразу завершается. У сборки Chromium от
 * Playwright нет кодека H.264, поэтому hero-видео в ней не проигрывается —
 * это особенность сборки, а не сайта. Для проверки самого видео нужен Edge
 * или обычный Chrome.
 */
const BROWSER_CANDIDATES = [
  'C:\\Users\\sergw\\AppData\\Local\\ms-playwright\\chromium-1169\\chrome-win\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const SECTIONS = ['services', 'technical', 'compare', 'contact'];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function shoot(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log('shot', name);
}

async function toSection(page, id, offset) {
  await page.evaluate(
    (sectionId, shift) => {
      const element = document.getElementById(sectionId);
      if (element) window.scrollTo({ top: element.offsetTop + shift, behavior: 'instant' });
    },
    id,
    offset
  );
}

const executablePath = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error('Не найден ни один браузер на движке Chromium');
console.log('browser:', executablePath);

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  userDataDir: join(tmpdir(), `edge-profile-${process.pid}`),
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
});

try {
  /* ---------- десктоп ---------- */
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  await page
    .waitForSelector('.film.is-video-ready', { timeout: 45000 })
    .catch(() => console.log('WARNING: видео не дошло до готовности'));
  await wait(900);

  await shoot(page, 'desktop-hero');

  // Окна с репликами: там фильм виден целиком.
  for (const caption of FILM_CAPTIONS) {
    await page.evaluate((id) => {
      document
        .querySelector(`.window[data-caption="${id}"]`)
        .scrollIntoView({ block: 'center' });
    }, caption.id);
    await wait(1800);
    await shoot(page, `desktop-window-${caption.id}`);
  }

  for (const id of SECTIONS) {
    await toSection(page, id, 40);
    await wait(3600);
    await shoot(page, `desktop-${id}`);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1200);
  await shoot(page, 'desktop-footer');

  /* ---------- телефон ---------- */
  const phone = await browser.newPage();
  await phone.setViewport({
    width: 375,
    height: 812,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await phone.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await wait(1400);
  await shoot(phone, 'phone-hero');

  for (const id of SECTIONS) {
    await toSection(phone, id, 20);
    await wait(2600);
    await shoot(phone, `phone-${id}`);
  }

  // Проверяем, что телефон действительно не тянет видео.
  const requestedVideo = await phone.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .some((entry) => entry.name.includes('hero-scrub.mp4'))
  );
  console.log('phone requested video:', requestedVideo, '(должно быть false)');
} finally {
  await browser.close();
}
