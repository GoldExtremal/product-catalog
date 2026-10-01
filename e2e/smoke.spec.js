import { test, expect } from '@playwright/test';
import { resetMockApi } from './helpers.js';

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test('страница открывается', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('results-count')).toHaveText('500');
  await expect(page.getByTestId('state-loading')).toHaveCount(0);
});

test('preview проксирует /api и /img на mock API', async ({ request }) => {
  const products = await request.get('/api/products?limit=1');
  expect(products.ok()).toBe(true);
  expect(await products.json()).toMatchObject({ total: 500, limit: 1 });

  const image = await request.get('/img/p_100.jpg');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toContain('image/svg+xml');
});
