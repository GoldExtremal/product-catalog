'use strict';
// Мок-сервер задания 01 · Product Catalog
const { createApp, HttpError, send, mulberry32 } = require('./lib');

const SEED = Number(process.env.SEED) || 42;
const COUNT = 500;

const CATEGORIES = [
  { id: 'shoes', title: 'Обувь', nouns: ['Кроссовки', 'Кеды', 'Ботинки', 'Сандалии', 'Лоферы'] },
  { id: 'clothing', title: 'Одежда', nouns: ['Футболка', 'Худи', 'Куртка', 'Джинсы', 'Свитер'] },
  { id: 'bags', title: 'Сумки', nouns: ['Рюкзак', 'Сумка', 'Шопер', 'Портфель', 'Поясная сумка'] },
  { id: 'accessories', title: 'Аксессуары', nouns: ['Кепка', 'Шарф', 'Ремень', 'Очки', 'Перчатки'] },
  { id: 'sport', title: 'Спорт', nouns: ['Коврик для йоги', 'Гантели', 'Скакалка', 'Бутылка', 'Мяч'] },
  { id: 'electronics', title: 'Электроника', nouns: ['Наушники', 'Колонка', 'Powerbank', 'Часы', 'Зарядка'] },
  { id: 'home', title: 'Дом', nouns: ['Плед', 'Кружка', 'Лампа', 'Подушка', 'Органайзер'] },
  { id: 'beauty', title: 'Красота', nouns: ['Крем', 'Шампунь', 'Сыворотка', 'Бальзам', 'Маска'] },
];
const ADJ = ['Classic', 'Urban', 'Run', 'Pro', 'Lite', 'Air', 'Street', 'Trail', 'Soft', 'Nomad', 'Steppe', 'Alatau'];

function generate() {
  const rnd = mulberry32(SEED);
  const items = [];
  for (let i = 0; i < COUNT; i++) {
    const cat = CATEGORIES[Math.floor(rnd() * CATEGORIES.length)];
    const noun = cat.nouns[Math.floor(rnd() * cat.nouns.length)];
    const adj = ADJ[Math.floor(rnd() * ADJ.length)];
    const model = 1 + Math.floor(rnd() * 9);
    const id = `p_${100 + i}`;
    items.push({
      id,
      title: `${noun} ${adj} ${model}`,
      price: Math.round((1990 + rnd() * 198000) / 1000) * 1000 - 10, // цены вида ...990
      currency: 'KZT',
      category: cat.id,
      rating: Math.round((2.5 + rnd() * 2.5) * 10) / 10,
      in_stock: rnd() < 0.75,
      image_url: `/img/${id}.jpg`,
    });
  }
  return items;
}

const PRODUCTS = generate();
const SORTS = new Set(['price_asc', 'price_desc', 'rating']);

function num(q, key, { min = -Infinity, int = false } = {}) {
  if (q[key] === undefined || q[key] === '') return undefined;
  const v = Number(q[key]);
  if (!Number.isFinite(v) || v < min || (int && !Number.isInteger(v))) {
    throw new HttpError(400, { error: 'invalid_param', param: key });
  }
  return v;
}

function listProducts(q) {
  const search = (q.q || '').trim().toLowerCase();
  const category = q.category || '';
  if (category && !CATEGORIES.some((c) => c.id === category)) {
    throw new HttpError(400, { error: 'invalid_param', param: 'category' });
  }
  const priceMin = num(q, 'price_min', { min: 0 });
  const priceMax = num(q, 'price_max', { min: 0 });
  let inStock;
  if (q.in_stock !== undefined && q.in_stock !== '') {
    if (!['true', 'false', '1', '0'].includes(q.in_stock)) {
      throw new HttpError(400, { error: 'invalid_param', param: 'in_stock' });
    }
    inStock = q.in_stock === 'true' || q.in_stock === '1';
  }
  const sort = q.sort || '';
  if (sort && !SORTS.has(sort)) throw new HttpError(400, { error: 'invalid_param', param: 'sort' });
  const page = num(q, 'page', { min: 1, int: true }) ?? 1;
  const limit = Math.min(num(q, 'limit', { min: 1, int: true }) ?? 24, 100);

  let items = PRODUCTS.filter((p) =>
    (!search || p.title.toLowerCase().includes(search)) &&
    (!category || p.category === category) &&
    (priceMin === undefined || p.price >= priceMin) &&
    (priceMax === undefined || p.price <= priceMax) &&
    (inStock === undefined || p.in_stock === inStock));

  const byId = (a, b) => Number(a.id.slice(2)) - Number(b.id.slice(2));
  if (sort === 'price_asc') items = items.slice().sort((a, b) => a.price - b.price || byId(a, b));
  if (sort === 'price_desc') items = items.slice().sort((a, b) => b.price - a.price || byId(a, b));
  if (sort === 'rating') items = items.slice().sort((a, b) => b.rating - a.rating || byId(a, b));

  const total = items.length;
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total, page, limit };
}

function placeholderSvg(id) {
  const n = Number(id.replace(/\D/g, '')) || 0;
  const hue = (n * 47) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<rect width="600" height="600" fill="hsl(${hue},45%,82%)"/>
<circle cx="300" cy="270" r="120" fill="hsl(${hue},45%,62%)"/>
<text x="300" y="480" font-family="sans-serif" font-size="44" text-anchor="middle" fill="hsl(${hue},40%,30%)">${id}</text>
</svg>`;
}

const app = createApp({
  name: '01-product-catalog',
  defaults: { latency_ms: [50, 300], error_rate: 0 },
  routes: [
    { method: 'GET', path: '/api/products', handler: (ctx) => send(ctx.res, 200, listProducts(ctx.query)) },
    {
      method: 'GET', path: '/api/categories',
      handler: (ctx) => send(ctx.res, 200, CATEGORIES.map(({ id, title }) => ({ id, title }))),
    },
    {
      method: 'GET', path: '/img/:file', chaos: false,
      handler: (ctx) => {
        const id = ctx.params.file.replace(/\.(jpg|jpeg|png|svg)$/i, '');
        if (!/^p_\d+$/.test(id)) return send(ctx.res, 404, { error: 'not_found' });
        ctx.res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
        ctx.res.end(placeholderSvg(id));
      },
    },
  ],
});

if (require.main === module) app.listen();
module.exports = { app, listProducts, PRODUCTS };
