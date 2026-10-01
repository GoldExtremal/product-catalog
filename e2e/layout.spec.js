import { test, expect } from '@playwright/test';
import { countText, resetMockApi } from './helpers.js';

const SINGLE_TEST_IDS = [
  'search-input',
  'filter-category',
  'filter-price-min',
  'filter-price-max',
  'filter-in-stock',
  'sort-select',
  'filters-open',
  'results-count',
  'pagination-prev',
  'pagination-next',
];

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

for (const width of [320, 599, 600, 601, 1280]) {
  test(`на ${width} px каждый одиночный testid встречается ровно один раз`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByTestId('results-count')).toHaveText(countText(500));

    for (const id of SINGLE_TEST_IDS) await expect(page.getByTestId(id)).toHaveCount(1);
    await expect(page.getByTestId('product-card')).toHaveCount(24);
    await expect(page.getByTestId('search-input')).toBeVisible();

    const mobile = width < 600;
    await expect(page.getByTestId('filters-open')).toBeVisible({ visible: mobile });
    await expect(page.getByTestId('filter-category')).toBeVisible({ visible: !mobile });
  });
}

test.describe('ширина 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('нет горизонтального скролла, пагинация компактная', async ({ page }) => {
    await page.goto('/?page=10');
    await expect(page.getByTestId('results-count')).toHaveText(countText(500));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    await expect(page.getByText('Стр. 10 из 21')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Страница 10' })).toBeHidden();
  });

  test('фильтры открываются в панели, Tab остаётся внутри, Esc закрывает и возвращает фокус', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('results-count')).toHaveText(countText(500));

    const open = page.getByTestId('filters-open');
    const dialog = page.getByRole('dialog', { name: 'Фильтры' });
    await open.click();
    await expect(dialog).toBeVisible();

    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('Tab');
      const insideDialog = await page.evaluate(() => !!document.activeElement?.closest('dialog'));
      expect(insideDialog).toBe(true);
    }

    await page.getByTestId('filter-category').selectOption('shoes');
    await expect(page).toHaveURL('/?category=shoes');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    await expect(open).toContainText('1');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
