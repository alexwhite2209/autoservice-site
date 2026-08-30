import { useMemo } from 'react';
import '../styles/band-text.css';

/**
 * Разбивает строку на слова и буквы для покадровой сборки текста.
 *
 * Генератор случайных чисел с зерном — намеренно: «случайные» смещения
 * обязаны быть одинаковыми при каждой загрузке, иначе заголовок
 * пересобирается по-разному и это заметно.
 */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * Каждый вход отвечает тому, что делает кадр в этот момент:
 * слова падают, пока отваливается колесо; строка приближается, пока
 * приближается камера; половины расходятся, пока открывается капот.
 */
function buildLines(lines, entrance, seed) {
  const random = seededRandom(seed);
  let wordIndex = 0;
  const totalWords = lines.reduce((sum, line) => sum + line.split(' ').length, 0);

  return lines.map((line) => {
    const words = line.split(' ');
    return words.map((word, positionInLine) => {
      const globalIndex = wordIndex;
      wordIndex += 1;

      const base = {
        text: word,
        threshold: 0,
        jitterX: 0,
        chars: null,
      };

      if (entrance === 'rise') {
        base.threshold = clamp01((globalIndex / Math.max(1, totalWords)) * 0.55);
      } else if (entrance === 'drift') {
        base.threshold = clamp01(random() * 0.34);
      } else if (entrance === 'part') {
        const half = (words.length - 1) / 2;
        const direction = positionInLine <= half ? -1 : 1;
        base.threshold = clamp01(random() * 0.18);
        base.jitterX = direction * (26 + random() * 22);
      } else if (entrance === 'scatter') {
        base.chars = Array.from(word).map((char) => ({
          char,
          threshold: clamp01(random() * 0.5),
          jitterX: (random() - 0.5) * 74,
          jitterY: (random() - 0.5) * 62,
          jitterR: (random() - 0.5) * 26,
        }));
      }

      return base;
    });
  });
}

export function BandText({ lines, entrance, accentLine = null, seed = 17 }) {
  const built = useMemo(
    () => buildLines(lines, entrance, seed),
    [lines, entrance, seed]
  );

  const visual = (
    <span className={`band-text band-text--${entrance}`} aria-hidden="true">
      {built.map((words, lineIndex) => (
        <span
          className={`band-text__line${
            accentLine === lineIndex ? ' band-text__line--accent' : ''
          }`}
          key={lines[lineIndex]}
        >
          {words.map((word, wordIndex) => (
            <span
              className="band-text__word"
              key={`${word.text}-${wordIndex}`}
              style={{
                '--th': word.threshold,
                '--jx': `${word.jitterX}px`,
              }}
            >
              {word.chars
                ? word.chars.map((item, charIndex) => (
                    <span
                      className="band-text__char"
                      key={`${item.char}-${charIndex}`}
                      style={{
                        '--th': item.threshold,
                        '--jx': `${item.jitterX}px`,
                        '--jy': `${item.jitterY}px`,
                        '--jr': `${item.jitterR}deg`,
                      }}
                    >
                      {item.char}
                    </span>
                  ))
                : word.text}
              {wordIndex < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </span>
      ))}
    </span>
  );

  return (
    <>
      {/* Читалке достаётся цельная фраза, а не россыпь букв. */}
      <span className="visually-hidden">{lines.join(' ')}</span>
      {entrance === 'blur' ? (
        <span className="band-text__stack">
          {/* Мягкая копия несёт СТАТИЧНОЕ размытие: сам filter анимировать
              нельзя, он не дружит с композитором. Меняется только прозрачность. */}
          <span className="band-text__soft">{visual}</span>
          <span className="band-text__sharp">{visual}</span>
        </span>
      ) : (
        visual
      )}
    </>
  );
}
