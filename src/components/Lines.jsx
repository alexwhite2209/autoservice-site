import '../styles/lines.css';

/**
 * Построчное кинематографичное появление заголовка.
 *
 * Каждая строка живёт в своей маске и выезжает снизу. Буквы по отдельности
 * не анимируются намеренно: на крупном кегле это только мешает читать.
 *
 * У маски есть запас снизу в долях кегля, иначе хвосты у «у», «р» и «д»
 * срезаются краем обрезки.
 */
export function Lines({ lines, accentLine = null, delay = 0 }) {
  return (
    <>
      <span className="visually-hidden">{lines.join(' ')}</span>
      <span className="lines" aria-hidden="true">
        {lines.map((line, index) => (
          <span className="lines__mask" key={line}>
            <span
              className={`lines__inner${
                accentLine === index ? ' lines__inner--accent' : ''
              }`}
              style={{ '--i': index, '--lines-delay': `${delay}ms` }}
            >
              {line}
            </span>
          </span>
        ))}
      </span>
    </>
  );
}
