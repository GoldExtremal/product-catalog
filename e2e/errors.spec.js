import { test, expect } from '@playwright/test';
import { countText, fetchProducts, resetMockApi, setChaos, trackProductRequests } from './helpers.js';

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

test.afterEach(async ({ request }) => {
  await resetMockApi(request);
});

test('при error_rate 1 видна ошибка, а Retry после error_rate 0 показывает данные с теми же фильтрами', async ({
  page,
  request,
}) => {
  const search = 'category=shoes&price_max=60000&in_stock=true&sort=price_asc';
  const expected = await fetchProducts(request, `${search}&limit=24`);
  await setChaos(request, { error_rate: 1 });

  await page.goto(`/?${search}`);
  await expect(page.getByTestId('state-error')).toBeVisible();
  await expect(page.getByTestId('state-error')).toHaveCount(1);
  await expect(page.getByTestId('state-loading')).toHaveCount(0);

  await expect(page.getByTestId('filter-category')).toHaveValue('shoes');
  await expect(page.getByTestId('filter-price-max')).toHaveValue('60 000');
  await expect(page.getByTestId('filter-in-stock')).toBeChecked();
  await expect(page.getByTestId('sort-select')).toHaveValue('price_asc');

  await setChaos(request, { error_rate: 0 });
  await page.getByTestId('retry-button').click();

  await expect(page.getByTestId('state-error')).toHaveCount(0);
  await expect(page.getByTestId('results-count')).toHaveText(countText(expected.total));
  await expect(page).toHaveURL(`/?${search}`);
  const titles = await page.getByTestId('product-card').locator('h2').allTextContents();
  expect(titles).toEqual(expected.items.map((item) => item.title));
});

test('ошибка при смене фильтра сохраняет фильтры и прежнюю выдачу', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByTestId('results-count')).toHaveText(countText(500));
  await expect(page.getByTestId('filter-category').locator('option[value="bags"]')).toHaveCount(1);

  await setChaos(request, { error_rate: 1 });
  await page.getByTestId('filter-category').selectOption('bags');

  await expect(page.getByTestId('state-error')).toBeVisible();
  await expect(page.getByTestId('filter-category')).toHaveValue('bags');
  await expect(page).toHaveURL(/category=bags/);
  await expect(page.getByTestId('product-card')).toHaveCount(24);
});

test('ссылка с price_min > price_max показывает ошибку без запроса и сбрасывает диапазон', async ({
  page,
}) => {
  const requests = trackProductRequests(page);

  await page.goto('/?q=run&price_min=50000&price_max=100');
  await expect(page.getByTestId('state-error')).toHaveCount(1);
  await expect(page.getByTestId('state-error')).toContainText('диапазон');
  await expect(page.getByTestId('retry-button')).toHaveCount(0);
  expect(requests).toHaveLength(0);

  await page.getByRole('button', { name: 'Сбросить цену' }).click();
  await expect(page).toHaveURL('/?q=run');
  await expect(page.getByTestId('state-error')).toHaveCount(0);
  await expect(page.getByTestId('product-card').first()).toBeVisible();
  await expect(page.getByTestId('filter-price-min')).toHaveValue('');
});

test('ответ 400 на некорректную ссылку предлагает сброс вместо повтора', async ({ page }) => {
  await page.goto('/?q=run&category=unknown');

  await expect(page.getByTestId('state-error')).toContainText('Некорректные параметры ссылки');
  await expect(page.getByTestId('retry-button')).toHaveCount(0);

  await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
  await expect(page).toHaveURL('/?q=run');
  await expect(page.getByTestId('product-card').first()).toBeVisible();
});
