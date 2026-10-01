import { test, expect } from '@playwright/test';
import { fetchProducts, resetMockApi, trackProductRequests } from './helpers.js';

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ q: string, category: string, inStock: boolean, sort: string, total: number }} expected
 */
async function expectCatalogState(page, expected) {
  await expect(page.getByTestId('search-input')).toHaveValue(expected.q);
  await expect(page.getByTestId('filter-category')).toHaveValue(expected.category);
  if (expected.inStock) await expect(page.getByTestId('filter-in-stock')).toBeChecked();
  else await expect(page.getByTestId('filter-in-stock')).not.toBeChecked();
  await expect(page.getByTestId('sort-select')).toHaveValue(expected.sort);
  await expect(page.getByTestId('state-loading')).toHaveCount(0);
  await expect(page.getByTestId('results-count')).toHaveText(String(expected.total));
}

test('поиск, фильтры, сортировка и страница живут в URL и переживают reload, Back и Forward', async ({
  page,
  context,
  request,
}) => {
  const all = await fetchProducts(request, 'limit=1');
  const searched = await fetchProducts(request, 'q=a&limit=1');
  const filtered = await fetchProducts(request, 'q=a&category=shoes&in_stock=true&limit=1');

  await page.goto('/');
  await expectCatalogState(page, { q: '', category: '', inStock: false, sort: '', total: all.total });

  await page.getByTestId('search-input').fill('a');
  await expect(page).toHaveURL('/?q=a');
  await expectCatalogState(page, { q: 'a', category: '', inStock: false, sort: '', total: searched.total });

  await page.getByTestId('filter-category').selectOption('shoes');
  await page.getByTestId('filter-in-stock').check();
  await page.getByTestId('sort-select').selectOption('price_desc');
  await expect(page).toHaveURL('/?q=a&category=shoes&in_stock=true&sort=price_desc');

  await page.getByTestId('pagination-next').click();
  const finalUrl = '/?q=a&category=shoes&in_stock=true&sort=price_desc&page=2';
  await expect(page).toHaveURL(finalUrl);
  const finalState = { q: 'a', category: 'shoes', inStock: true, sort: 'price_desc', total: filtered.total };
  await expectCatalogState(page, finalState);
  const pageTwoTitles = await page.getByTestId('product-card').locator('h2').allTextContents();

  await page.reload();
  await expectCatalogState(page, finalState);
  await expect(page.getByTestId('product-card').locator('h2')).toHaveText(pageTwoTitles);

  const newTab = await context.newPage();
  await newTab.goto(finalUrl);
  await expectCatalogState(newTab, finalState);
  await expect(newTab.getByTestId('product-card').locator('h2')).toHaveText(pageTwoTitles);
  await newTab.close();

  await page.goBack();
  await expect(page).toHaveURL('/?q=a&category=shoes&in_stock=true&sort=price_desc');
  await expect(page.getByTestId('sort-select')).toHaveValue('price_desc');

  await page.goBack();
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL('/?q=a');
  await expectCatalogState(page, { q: 'a', category: '', inStock: false, sort: '', total: searched.total });

  await page.goBack();
  await expectCatalogState(page, { q: '', category: '', inStock: false, sort: '', total: all.total });

  await page.goForward();
  await expect(page).toHaveURL('/?q=a');
  await expect(page.getByTestId('search-input')).toHaveValue('a');
});

test('Back до срабатывания debounce отменяет поиск и восстанавливает поле из URL', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('search-input').fill('air');
  await page.getByTestId('search-input').press('Enter');
  await expect(page).toHaveURL('/?q=air');
  await expect(page.getByTestId('state-loading')).toHaveCount(0);

  await page.getByTestId('search-input').fill('trail');
  await page.goBack();

  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('search-input')).toHaveValue('');
  await page.waitForTimeout(600);
  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('search-input')).toHaveValue('');
});

test('возврат к уже открытой выборке берётся из кэша без нового запроса', async ({ page }) => {
  const requests = trackProductRequests(page);

  await page.goto('/');
  await expect(page.getByTestId('results-count')).not.toBeEmpty();
  await page.getByTestId('filter-category').selectOption('shoes');
  await expect(page).toHaveURL('/?category=shoes');
  await expect(page.getByTestId('state-loading')).toHaveCount(0);
  await expect(page.getByTestId('results-count')).not.toBeEmpty();
  const shoesCount = await page.getByTestId('results-count').textContent();

  const before = requests.length;
  await page.goBack();
  await expect(page.getByTestId('results-count')).toHaveText('500');
  await page.goForward();
  await expect(page.getByTestId('results-count')).toHaveText(shoesCount ?? '');
  expect(requests).toHaveLength(before);
});

test('пустая выдача показывает state-empty и сбрасывается', async ({ page }) => {
  await page.goto('/?q=zzzz-нет-такого&category=shoes');

  await expect(page.getByTestId('state-empty')).toBeVisible();
  await expect(page.getByTestId('results-count')).toHaveText('0');
  await expect(page.getByTestId('product-card')).toHaveCount(0);

  await page.getByRole('button', { name: 'Сбросить поиск и фильтры' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('search-input')).toHaveValue('');
  await expect(page.getByTestId('results-count')).toHaveText('500');
});
