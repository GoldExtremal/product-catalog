import { test, expect } from '@playwright/test';
import { resetMockApi, setChaos } from './helpers.js';

const QUERIES = ['a', 'ai', 'steppe', 'кроссовки', 'trail'];
const PAUSE_BETWEEN_QUERIES_MS = 450;

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
  await setChaos(request, { latency_ms: [50, 2000] });
});

test.afterEach(async ({ request }) => {
  await resetMockApi(request);
});

test('на экране результаты последнего запроса, даже если старые ответы пришли позже', async ({
  page,
}) => {
  /** @type {import('@playwright/test').Request[]} */
  const requests = [];
  /** @type {Set<import('@playwright/test').Request>} */
  const pending = new Set();
  const isProducts = (/** @type {import('@playwright/test').Request} */ request) =>
    new URL(request.url()).pathname === '/api/products';

  page.on('request', (request) => {
    if (!isProducts(request)) return;
    requests.push(request);
    pending.add(request);
  });
  page.on('requestfinished', (request) => pending.delete(request));
  page.on('requestfailed', (request) => pending.delete(request));

  await page.goto('/');
  const search = page.getByTestId('search-input');

  for (const query of QUERIES) {
    await search.fill(query);
    await page.waitForTimeout(PAUSE_BETWEEN_QUERIES_MS);
  }

  const lastQuery = QUERIES[QUERIES.length - 1];
  const queriesSent = new Set(requests.map((request) => new URL(request.url()).searchParams.get('q')));
  for (const query of QUERIES) expect(queriesSent).toContain(query);

  await expect.poll(() => pending.size, { timeout: 15_000 }).toBe(0);

  const lastRequest = requests.findLast(
    (request) => new URL(request.url()).searchParams.get('q') === lastQuery,
  );
  if (!lastRequest) throw new Error(`Не найден запрос с q=${lastQuery}`);
  const lastResponse = await lastRequest.response();
  if (!lastResponse) throw new Error(`Запрос с q=${lastQuery} не получил ответа`);
  expect(lastResponse.ok()).toBe(true);
  const { total, items } = await lastResponse.json();

  await expect(page.getByTestId('state-loading')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`[?&]q=${lastQuery}(&|$)`));
  await expect(search).toHaveValue(lastQuery);
  await expect(page.getByTestId('results-count')).toHaveText(new RegExp(`\\b${total}\\b`));

  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(items.length);
  const titles = await cards.locator('h2').allTextContents();
  expect(titles).toEqual(items.map((/** @type {{ title: string }} */ item) => item.title));
  for (const title of titles) expect(title.toLowerCase()).toContain(lastQuery);
});
