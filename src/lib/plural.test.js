import { describe, expect, it } from 'vitest';
import { formatProductsCount } from './plural.js';

describe('formatProductsCount', () => {
  it.each([
    [0, '0 товаров'],
    [1, '1 товар'],
    [2, '2 товара'],
    [5, '5 товаров'],
    [11, '11 товаров'],
    [21, '21 товар'],
    [24, '24 товара'],
    [500, '500 товаров'],
  ])('%i → %s', (count, expected) => {
    expect(formatProductsCount(count)).toBe(expected);
  });
});
