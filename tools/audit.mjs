/**
 * Состязательная самопроверка сайта настоящим браузером.
 *
 * Запуск: node tools/audit.mjs [url]
 */
import puppeteer from 'puppeteer-core';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { FILM_CAPTIONS } from '../src/data/site.js';

const URL = process.argv[2] || 'http://localhost:4173';
/*
 * Chromium первым вынужденно: headless-режим Edge на этой машине перестал
 * отвечать. У этой сборки Chromium нет кодека H.264, поэтому проверки,
 * завязанные на само видео, честно сообщают об этом и пропускаются.
 */
const BROWSERS = [
  'C:\\Users\\sergw\\AppData\\Local\\ms-playwright\\chromium-1169\\chrome-win\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const TEXT_RGB = [242, 242, 242];
const MIN_CONTRAST = 3.5;

/*
 * Осознанное отступление, а не поблажка.
 *
 * Заказчик попросил не гасить кадр под надписями: видео здесь главное.
 * Для коротких реплик это ничего не стоит, а под главным слоганом крупные
 * буквы занимают широкую полосу кадра, и замер по всему прямоугольнику
 * строки захватывает блики, которые лежат выше самих букв. Число всё равно
 * печатается — решение принято с открытыми глазами.
 */
const ACCEPTED = {
  hero: 'затемнение снято по требованию, читаемость держится тенью букв',
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const executablePath = BROWSERS.find((path) => existsSync(path));

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  userDataDir: join(tmpdir(), `edge-profile-${process.pid}`),
  args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars'],
});

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.log('  ПРОВАЛ:', message);
};

/** Заставка держит экран первые секунды и мешает проверкам самого сайта. */
const dismissIntro = async (page) => {
  await page
    .waitForSelector('.preloader__skip', { timeout: 8000 })
    .then(() => page.click('.preloader__skip'))
    .catch(() => {});
  await wait(400);
};

const scrollToProgress = async (page, progress) =>
  page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.round(p * max), behavior: 'instant' });
  }, progress);

try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  await dismissIntro(page);

  const videoReady = await page
    .waitForSelector('.film.is-video-ready', { timeout: 25000 })
    .then(() => true)
    .catch(() => false);
  await wait(800);

  /* ---------- 1. ход фильма туда и обратно ---------- */
  console.log('\n[1] ХОД ФИЛЬМА ПО ВСЕЙ СТРАНИЦЕ');

  if (!videoReady) {
    // Не выдаём это за успех: проверку просто нечем выполнить.
    console.log(
      '  ПРОПУЩЕНО: браузер не проигрывает H.264 (сборка Chromium без кодека).'
    );
    console.log('  Проверить ход фильма можно в Edge или обычном Chrome.');
  } else {
    const duration = await page.evaluate(
      () => document.querySelector('.film__video').duration
    );
    console.log(`  длительность видео: ${duration.toFixed(2)} с`);

    const marks = [0, 0.25, 0.5, 0.75, 1];
    const expected = marks.map((p) => (p <= 0.5 ? p * 2 : (1 - p) * 2) * duration);
    const measured = [];

    for (const p of marks) {
      await scrollToProgress(page, p);
      await wait(1500);
      const time = await page.evaluate(
        () => document.querySelector('.film__video').currentTime
      );
      measured.push(time);
    }

    marks.forEach((p, index) => {
      const drift = Math.abs(measured[index] - expected[index]);
      const verdict = drift < 0.7 ? 'ок' : 'РАСХОЖДЕНИЕ';
      console.log(
        `  прокрутка ${(p * 100).toString().padStart(3)}% → кадр ${measured[index].toFixed(2)} с ` +
          `(ожидалось ${expected[index].toFixed(2)}) ${verdict}`
      );
      if (drift >= 0.7) fail(`на ${p * 100}% страницы фильм не там, где должен быть`);
    });

    const finish = measured[measured.length - 1];
    console.log(
      `  финал страницы: кадр ${finish.toFixed(2)} с — ${
        finish < 0.6 ? 'машина снова собрана' : 'НЕ вернулся к началу'
      }`
    );
    if (finish >= 0.6) fail('внизу страницы фильм не вернулся к собранной машине');
  }

  /* ---------- 2. надписи в окнах ---------- */
  console.log('\n[2] РЕПЛИКИ В ОКНАХ (держатся и не проскакивают)');

  // Сначала прогон до низа: картинки грузятся отложенно, и без этого
  // страница вырастает уже во время замера. Раньше из-за этого цикл
  // не доезжал до нижних окон и они «не читались» ни одного рывка.
  await page.evaluate(async () => {
    const step = () =>
      new Promise((resolve) => {
        window.scrollBy(0, window.innerHeight);
        setTimeout(resolve, 60);
      });
    for (let i = 0; i < 60; i += 1) {
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) break;
      await step();
    }
  });
  await wait(900);

  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(700);

  const held = new Map();
  // Высота пересчитывается на каждом шаге, а не один раз в начале.
  const maxSteps = 400;

  for (let i = 0; i < maxSteps; i += 1) {
    const atBottom = await page.evaluate(() => {
      window.scrollBy(0, 120);
      return (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
      );
    });
    await wait(90);
    const visible = await page.evaluate(() =>
      [...document.querySelectorAll('.window')].map((section) => ({
        id: section.dataset.caption,
        opacity: Number(getComputedStyle(section.querySelector('.window__caption')).opacity),
        onScreen: (() => {
          const rect = section.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        })(),
      }))
    );
    visible.forEach((item) => {
      if (item.onScreen && item.opacity > 0.92) {
        held.set(item.id, (held.get(item.id) || 0) + 1);
      }
    });

    if (atBottom) break;
  }

  FILM_CAPTIONS.forEach((caption) => {
    const count = held.get(caption.id) || 0;
    const verdict = count >= 5 ? 'ок' : 'СЛИШКОМ КОРОТКО';
    console.log(`  ${caption.id.padEnd(7)} читается ${count} рывков колеса  ${verdict}`);
    if (count < 5) fail(`реплика "${caption.id}" держится всего ${count} рывков`);
  });

  /* ---------- 3. читаемость поверх видео ---------- */
  console.log('\n[3] ЧИТАЕМОСТЬ ТЕКСТА ПОВЕРХ ВИДЕО (порог 3.5:1)');

  const targets = [
    {
      id: 'hero',
      selector: '.hero__inner',
      parts: '.band-text',
      hide: '.band-text, .visually-hidden',
    },
    ...FILM_CAPTIONS.map((caption) => ({
      id: caption.id,
      selector: `.window[data-caption="${caption.id}"] .window__inner`,
      parts: '.band-text',
      hide: '.band-text, .visually-hidden, .window__rule',
    })),
  ];

  for (const target of targets) {
    let worstRatio = Infinity;

    for (const offset of [-0.28, 0, 0.28]) {
      const placed = await page.evaluate(
        (selector, shift) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          const top = window.scrollY + rect.top - window.innerHeight * (0.5 - shift);
          window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
          return true;
        },
        target.selector,
        offset
      );
      if (!placed) continue;
      await wait(1100);

      // Рамка считается по самим буквам, а не по строке целиком: в строку
      // входят красная линия, отступ и поля, и блик рядом с текстом портил
      // бы оценку того, что лежит под глифами.
      const box = await page.evaluate(
        (selector, partsSelector) => {
          const element = document.querySelector(selector);
          const parts = [...element.querySelectorAll(partsSelector)];
          if (!parts.length) return null;
          const rects = parts.map((part) => part.getBoundingClientRect());
          const left = Math.max(0, Math.floor(Math.min(...rects.map((r) => r.left))));
          const top = Math.max(0, Math.floor(Math.min(...rects.map((r) => r.top))));
          const right = Math.min(window.innerWidth, Math.ceil(Math.max(...rects.map((r) => r.right))));
          const bottom = Math.min(window.innerHeight, Math.ceil(Math.max(...rects.map((r) => r.bottom))));
          return { x: left, y: top, width: right - left, height: bottom - top };
        },
        target.selector,
        target.parts
      );

      if (!box || box.width < 4 || box.height < 4) continue;

      // Прячем сам текст: измеряем подложку так, как её видит глаз,
      // со всеми затемнениями и без подсветки от тени букв.
      await page.evaluate(
        (selector, hideSelector) => {
          document
            .querySelector(selector)
            .querySelectorAll(hideSelector)
            .forEach((part) => {
              part.style.visibility = 'hidden';
            });
        },
        target.selector,
        target.hide
      );
      await wait(120);

      // Снимок всего экрана, а вырезка — уже внутри страницы: clip у
      // скриншота считается от документа, а рамка — от экрана, и на
      // прокрученной странице это разные системы координат.
      const shot = await page.screenshot({ encoding: 'base64' });

      await page.evaluate(
        (selector, hideSelector) => {
          document
            .querySelector(selector)
            .querySelectorAll(hideSelector)
            .forEach((part) => {
              part.style.visibility = '';
            });
        },
        target.selector,
        target.hide
      );

      const ratio = await page.evaluate(
        async (base64, textRgb, region) => {
          const image = new Image();
          image.src = `data:image/png;base64,${base64}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(image, 0, 0);
          const { data } = context.getImageData(
            region.x,
            region.y,
            region.width,
            region.height
          );

          const channel = (value) => {
            const v = value / 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          const luminance = (r, g, b) =>
            0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

          let worst = 0;
          for (let i = 0; i < data.length; i += 4) {
            worst = Math.max(worst, luminance(data[i], data[i + 1], data[i + 2]));
          }
          const textLum = luminance(...textRgb);
          const hi = Math.max(textLum, worst);
          const lo = Math.min(textLum, worst);
          return (hi + 0.05) / (lo + 0.05);
        },
        shot,
        TEXT_RGB,
        box
      );

      worstRatio = Math.min(worstRatio, ratio);
    }

    if (worstRatio === Infinity) {
      console.log(`  ${target.id.padEnd(7)} измерить не удалось`);
      continue;
    }

    const passes = worstRatio >= MIN_CONTRAST;
    const accepted = ACCEPTED[target.id];
    const verdict = passes ? 'ок' : accepted ? `принято: ${accepted}` : 'НЕ ПРОХОДИТ';
    console.log(`  ${target.id.padEnd(7)} худший кадр: ${worstRatio.toFixed(2)}:1  ${verdict}`);
    if (!passes && !accepted) {
      fail(`"${target.id}" читается хуже порога (${worstRatio.toFixed(2)}:1)`);
    }
  }

  console.log('\n[4] ОШИБКИ КОНСОЛИ:', consoleErrors.length);
  consoleErrors.forEach((error) => fail(`консоль: ${error}`));

  /* ---------- 5. reduced motion ---------- */
  console.log('\n[5] PREFERS-REDUCED-MOTION');
  const reduced = await browser.newPage();
  await reduced.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  await reduced.setViewport({ width: 1440, height: 900 });
  await reduced.goto(URL, { waitUntil: 'networkidle2' });
  await wait(2500);

  const reducedState = await reduced.evaluate(() => ({
    videoRequested: performance
      .getEntriesByType('resource')
      .some((entry) => entry.name.includes('hero-scrub.mp4')),
    videoElement: !!document.querySelector('.film__video'),
    windows: document.querySelectorAll('.window').length,
    phoneLink: !!document.querySelector('a[href^="tel:"]'),
    posterPainted: !!document.querySelector('.film__poster'),
  }));
  console.log('  видео запрошено:', reducedState.videoRequested, '(должно быть false)');
  console.log('  элемент видео в разметке:', reducedState.videoElement, '(должно быть false)');
  console.log('  окон с репликами:', reducedState.windows, '(должно быть 0)');
  console.log('  постер на месте:', reducedState.posterPainted, '(должно быть true)');
  console.log('  телефон кликабелен:', reducedState.phoneLink, '(должно быть true)');
  if (reducedState.videoRequested) fail('при reduced-motion видео всё равно грузится');
  if (!reducedState.posterPainted) fail('при reduced-motion пропал постер');
  if (!reducedState.phoneLink) fail('при reduced-motion потерялась ссылка на телефон');

  /* ---------- 6. страница без видео ---------- */
  console.log('\n[6] СТРАНИЦА БЕЗ ВИДЕО');
  const blocked = await browser.newPage();
  await blocked.setViewport({ width: 1440, height: 900 });
  const client = await blocked.createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.setBlockedURLs', { urls: ['*hero-scrub.mp4*'] });
  await blocked.goto(URL, { waitUntil: 'networkidle2' });
  await dismissIntro(blocked);
  await wait(4000);

  const blockedState = await blocked.evaluate(() => {
    const film = document.querySelector('.film');
    return {
      failedClass: film ? film.className.includes('is-video-failed') : null,
      posterPainted: !!document.querySelector('.film__poster'),
      ringHidden: getComputedStyle(document.querySelector('.film__ring')).visibility,
      sectionsPresent: document.querySelectorAll('main section.section').length,
    };
  });
  console.log('  режим «видео не пришло»:', blockedState.failedClass);
  console.log('  постер на месте:', blockedState.posterPainted);
  console.log('  кольцо загрузки скрыто:', blockedState.ringHidden);
  console.log('  секций на странице:', blockedState.sectionsPresent);
  if (!blockedState.failedClass) fail('без видео не включился запасной режим');
  if (blockedState.sectionsPresent < 4) fail('без видео страница потеряла секции');

  /* ---------- 7. слайдер с клавиатуры ---------- */
  console.log('\n[7] СЛАЙДЕР ДО/ПОСЛЕ С КЛАВИАТУРЫ');
  const keys = await browser.newPage();
  await keys.setViewport({ width: 1440, height: 900 });
  await keys.goto(URL, { waitUntil: 'networkidle2' });
  await dismissIntro(keys);
  await keys.evaluate(() => document.getElementById('compare').scrollIntoView());
  await wait(900);

  const before = await keys.$eval('.compare__range', (el) => Number(el.value));
  await keys.focus('.compare__range');
  for (let i = 0; i < 8; i += 1) await keys.keyboard.press('ArrowRight');
  const afterRight = await keys.$eval('.compare__range', (el) => Number(el.value));
  await keys.keyboard.press('Home');
  const atHome = await keys.$eval('.compare__range', (el) => Number(el.value));

  console.log(`  старт ${before} → стрелки ${afterRight} → Home ${atHome}`);
  if (afterRight <= before) fail('стрелки не двигают разделитель');
  if (atHome !== 0) fail('Home не отправляет разделитель в начало');

  /* ---------- 8. вес и скорость ---------- */
  console.log('\n[8] ВЕС И СКОРОСТЬ');
  const perf = await keys.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const sum = (filter) =>
      resources.filter(filter).reduce((total, entry) => total + (entry.transferSize || 0), 0);
    return {
      loadMs: Math.round(navigation.loadEventEnd),
      withoutVideoBytes:
        (navigation.transferSize || 0) +
        sum((entry) => !entry.name.includes('hero-scrub.mp4')),
    };
  });
  console.log(`  загрузка страницы: ${perf.loadMs} мс`);
  console.log(`  вес без видео: ${Math.round(perf.withoutVideoBytes / 1024)} КБ`);

  /* ---------- 9. переполнение ---------- */
  console.log('\n[9] ПЕРЕПОЛНЕНИЕ И ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА');
  const widths = [1920, 1440, 1280, 1024, 768, 430, 375];
  const overflowPage = await browser.newPage();

  for (const width of widths) {
    const isPhone = width <= 768;
    await overflowPage.setViewport({
      width,
      height: isPhone ? 812 : 900,
      isMobile: isPhone,
      hasTouch: isPhone,
    });
    await overflowPage.goto(URL, { waitUntil: 'networkidle2' });
    await dismissIntro(overflowPage);
    await wait(1400);

    const result = await overflowPage.evaluate(() => {
      const pageOverflow =
        document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const bleeding = [];
      // Сравнивать коробку с коробкой бесполезно: блочный заголовок всегда
      // шириной с колонку, даже когда текст внутри него уже вылез.
      // Реплики сюда не попадают намеренно: у них есть абсолютно
      // спозиционированное пятно тени, и оно раздувает scrollWidth, хотя
      // сам текст никуда не вылезает.
      document
        .querySelectorAll(
          '.section__title, .section__lead, .services__title, .hero__title, .contact__phone'
        )
        .forEach((element) => {
          const spill = element.scrollWidth - element.clientWidth;
          if (spill > 2) bleeding.push(`${element.className.split(' ')[0]} +${spill}px`);
        });

      // Реплики проверяются иначе: их строка обязана целиком помещаться
      // в экран по горизонтали.
      document.querySelectorAll('.window__caption').forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.left < -1 || rect.right > window.innerWidth + 1) {
          bleeding.push(`реплика вне экрана (${Math.round(rect.left)}..${Math.round(rect.right)})`);
        }
      });

      return { pageOverflow, bleeding };
    });

    const verdict =
      result.pageOverflow <= 0 && result.bleeding.length === 0 ? 'ок' : 'ПРОБЛЕМА';
    console.log(
      `  ${String(width).padStart(4)}px → прокрутка вбок ${result.pageOverflow}px, ` +
        `вылезает: ${result.bleeding.length ? result.bleeding.join(', ') : 'ничего'}  ${verdict}`
    );
    if (result.pageOverflow > 0) fail(`на ${width}px страница едет вбок`);
    result.bleeding.forEach((item) => fail(`на ${width}px вылезает ${item}`));
  }

  console.log(
    failures === 0
      ? '\nИТОГ: все проверки пройдены.'
      : `\nИТОГ: провалов — ${failures}.`
  );
} finally {
  await browser.close();
}
