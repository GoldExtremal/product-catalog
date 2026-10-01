import { test, expect } from '@playwright/test';
import { resetMockApi } from './helpers.js';

const PAUSE_AFTER_TYPING_MS = 800;

test.beforeEach(async ({ request }) => {
  await resetMockApi(request);
});

/** @param {import('@playwright/test').Page} page */
const historyLength = (page) => page.evaluate(() => history.length);

test('пауза при вводе цены не оставляет промежуточных записей в истории', async ({ page }) => {
  await page.goto('/?category=shoes');
  await expect(page.getByTestId('results-count')).not.toBeEmpty();
  const lengthBefore = await historyLength(page);
  const priceMin = page.getByTestId('filter-price-min');

  await priceMin.pressSequentially('3');
  await page.waitForTimeout(PAUSE_AFTER_TYPING_MS);
  await expect(page).toHaveURL('/?category=shoes&price_min=3');

  await priceMin.pressSequentially('0000');
  await page.waitForTimeout(PAUSE_AFTER_TYPING_MS);
  await expect(page).toHaveURL('/?category=shoes&price_min=30000');

  await priceMin.press('Tab');
  expect(await historyLength(page)).toBe(lengthBefore + 1);

  await page.goBack();
  await expect(page).toHaveURL('/?category=shoes');
  await expect(priceMin).toHaveValue('');
});

test('«Назад» посреди ввода цены не даёт перезаписать запись, к которой вернулись', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('results-count')).toHaveText('500');
  await page.getByTestId('filter-category').selectOption('shoes');
  await expect(page).toHaveURL('/?category=shoes');
  const priceMin = page.getByTestId('filter-price-min');

  await priceMin.pressSequentially('5000');
  await page.waitForTimeout(PAUSE_AFTER_TYPING_MS);
  await expect(page).toHaveURL('/?category=shoes&price_min=5000');

  await page.goBack();
  await expect(page).toHaveURL('/?category=shoes');
  await expect(priceMin).toHaveValue('');

  await priceMin.pressSequentially('7000');
  await page.waitForTimeout(PAUSE_AFTER_TYPING_MS);
  await expect(page).toHaveURL('/?category=shoes&price_min=7000');

  await page.goBack();
  await expect(page).toHaveURL('/?category=shoes');
  await expect(page.getByTestId('filter-category')).toHaveValue('shoes');
  await page.goBack();
  await expect(page).toHaveURL('/');
});

test('ошибка диапазона появляется только после окончания ввода', async ({ page }) => {
  await page.goto('/?price_min=50000');
  await expect(page.getByTestId('results-count')).not.toBeEmpty();
  const priceMax = page.getByTestId('filter-price-max');
  const rangeError = page.getByText('Максимум не может быть меньше минимума');

  await priceMax.pressSequentially('6');
  await page.waitForTimeout(PAUSE_AFTER_TYPING_MS);
  await expect(rangeError).toHaveCount(0);
  await expect(page).toHaveURL('/?price_min=50000');

  await priceMax.press('Enter');
  await expect(rangeError).toBeVisible();
  await expect(priceMax).toHaveAttribute('aria-invalid', 'true');
  await expect(page).toHaveURL('/?price_min=50000');

  await priceMax.pressSequentially('0000');
  await expect(rangeError).toHaveCount(0);
  await page.waitForTimeout(PAUSE_AFTER_TYPING_MS);
  await expect(page).toHaveURL('/?price_min=50000&price_max=60000');
});
