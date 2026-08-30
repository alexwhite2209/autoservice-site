/**
 * Единственный источник правды по контенту сайта.
 *
 * Всё, что помечено PLACEHOLDER, — временные данные. Их меняют здесь,
 * и больше нигде: вёрстка ничего не хардкодит.
 */

/**
 * Базовый путь для статических файлов.
 *
 * Локально:
 *   /assets/
 *
 * GitHub Pages:
 *   /autoservice-site/assets/
 *
 * Благодаря BASE_URL сайт одинаково работает и локально,
 * и на GitHub Pages.
 */
const ASSETS = `${import.meta.env.BASE_URL}assets/`;

/**
 * Логотип.
 * Файл logo-mark.webp получен из исходного LOGO.png: чёрный фон
 * убран в прозрачность, поля обрезаны.
 */
export const BRAND = {
  logoSrc: `${ASSETS}logo-mark.webp`,
  logoWidth: 900,
  logoHeight: 279,
  logoLabel: '[ ЛОГОТИП ]',
  logoAlt: 'АвтоспецNN, Нижний Новгород',
};

/** PLACEHOLDER. */
export const CONTACTS = {
  phoneDisplay: '+7 (904) 054-59-38',
  phoneHref: 'tel:+79040545938',
  hours: 'Ежедневно с 7:00 до 17:00',
  addressLines: ['Нижний Новгород', 'ул. Ванеева 116Б/1'],
};

export const NAV = [
  { label: 'УСЛУГИ', href: '#services' },
  { label: 'О НАС', href: '#technical' },
  { label: 'КОНТАКТЫ', href: '#contact' },
];

/** В подвале порядок другой, как в брифе. */
export const FOOTER_NAV = [
  { label: 'О НАС', href: '#technical' },
  { label: 'УСЛУГИ', href: '#services' },
  { label: 'КОНТАКТЫ', href: '#contact' },
];

/** Левый индикатор. Нумерация идёт подряд по тому, что есть на странице. */
export const SECTIONS = [
  { id: 'hero', num: '01', label: 'Начало' },
  { id: 'services', num: '02', label: 'Сервис' },
  { id: 'technical', num: '03', label: 'Диагностика' },
  { id: 'compare', num: '04', label: 'До и после' },
  { id: 'contact', num: '05', label: 'Контакты' },
];

/** Четыре направления. Электрики здесь нет намеренно. */
export const SERVICES = [
  {
    num: '01',
    title: 'ДИАГНОСТИКА',
    description: 'Точная проверка всех систем автомобиля',
    image: `${ASSETS}service-diagnostics.webp`,
  },
  {
    num: '02',
    title: 'ДВИГАТЕЛЬ',
    description: 'Ремонт и обслуживание двигателей',
    image: `${ASSETS}service-engine.webp`,
  },
  {
    num: '03',
    title: 'ХОДОВАЯ',
    description: 'Ремонт подвески и рулевого управления',
    image: `${ASSETS}service-suspension.webp`,
  },
  {
    num: '04',
    title: 'ТОРМОЗНАЯ СИСТЕМА',
    description: 'Диагностика и ремонт тормозной системы',
    image: `${ASSETS}service-brakes.webp`,
  },
];

/**
 * Точки на фотографии автомобиля в секции 04.
 *
 * Все координаты — проценты от размера самого изображения, поэтому точки
 * держатся на своих узлах при любой ширине экрана.
 *
 * point — где сидит красная точка на машине
 * elbow — излом выноски
 * edge — куда приходит линия и где начинается подпись
 * side — с какой стороны кадра живёт подпись
 *
 * При замене фотографии меняются только эти координаты.
 */

/**
 * Последний отрезок каждой выноски намеренно вертикальный: линия входит
 * в подпись сверху или снизу и не пересекает её текст.
 */
export const CAR_HOTSPOTS = [
  {
    id: 'engine',
    title: 'ДВИГАТЕЛЬ',
    description: 'Проверка всех систем двигателя',
    // Двигатель с коробкой, вынесенный слева вверху.
    point: { x: 23, y: 24 },
    elbow: { x: 4, y: 10 },
    edge: { x: 4, y: 4 },
    side: 'right',
  },
  {
    id: 'suspension',
    title: 'ХОДОВАЯ',
    description: 'Диагностика подвески и рулевого управления',
    // Стойки подвески, вынесенные справа вверху.
    point: { x: 78, y: 17 },
    elbow: { x: 96, y: 10 },
    edge: { x: 96, y: 4 },
    side: 'left',
  },
  {
    id: 'ecu',
    title: 'ДИАГНОСТИКА',
    description: 'Компьютерная диагностика всех блоков',
    // Просвечивающий блок двигателя под капотом самой машины.
    point: { x: 36, y: 54 },
    elbow: { x: 4, y: 80 },
    edge: { x: 4, y: 94 },
    side: 'right',
  },
  {
    id: 'brakes',
    title: 'ТОРМОЗА',
    description: 'Проверка тормозной системы',
    // Тормозной диск с суппортом, вынесенный внизу по центру.
    point: { x: 45, y: 88 },
    elbow: { x: 96, y: 92 },
    edge: { x: 96, y: 96 },
    side: 'left',
  },
];

/** Медиа. Пути автоматически учитывают GitHub Pages. */
export const MEDIA = {
  heroVideo: `${ASSETS}hero-scrub.mp4`,
  heroPoster: `${ASSETS}hero-poster.webp`,
  heroEnding: `${ASSETS}hero-ending.webp`,

  // Реальный размер файла в байтах.
  // Запасной вариант, когда сервер не отдаёт Content-Length.
  heroVideoBytes: 7382544,

  // Фотография для секции «Видим главное».
  technicalCar: `${ASSETS}technical-car.webp`,

  compareBefore: `${ASSETS}before.webp`,
  compareAfter: `${ASSETS}after.webp`,
};

/** Главный слоган первого экрана. Меняться не должен. */
export const HERO_SLOGAN = {
  title: ['НАШЛИ', 'ПРОБЛЕМУ,', 'УСТРАНИЛИ.'],
  accentLine: 2,
  subtitle: ['Точная диагностика.', 'Профессиональный ремонт.'],
};

/**
 * Реплики в окнах между секциями.
 *
 * Окно — это участок страницы, где содержимого нет и фильм виден целиком.
 * Каждая реплика стоит там, где фильм показывает нужный момент.
 */
export const FILM_CAPTIONS = [
  {
    id: 'apart',
    // Фильм: переднее колесо отходит, открывается тормозной диск.
    text: 'РАЗБИРАЕМ ЗАДАЧУ',
    entrance: 'drift',
    anchor: 'bottom-left',
  },
  {
    id: 'deeper',
    // Фильм: крупный план узлов, машина раскрыта.
    text: 'ИЩЕМ ПРИЧИНУ',
    entrance: 'depth',
    anchor: 'top-right',
  },
  {
    id: 'cause',
    // Фильм: обратный ход, моторный отсек.
    text: 'РАБОТАЕМ',
    entrance: 'part',
    anchor: 'bottom-right',
  },
  {
    id: 'fix',
    // Фильм: детали встают на места.
    text: 'ГОТОВЫЙ РЕЗУЛЬТАТ',
    entrance: 'blur',
    anchor: 'top-left',
  },
];

export const COPYRIGHT = '© 2026';