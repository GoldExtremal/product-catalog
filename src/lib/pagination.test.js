import { describe, expect, it } from 'vitest';
import { getPageItems, getTotalPages } from './pagination.js';

describe('getTotalPages', () => {
  it.each([
    [0, 1],
    [1, 1],
    [24, 1],
    [25, 2],
    [500, 21],
  ])('total %i → %i страниц', (total, expected) => {
    expect(getTotalPages(total, 24)).toBe(expected);
  });
});

describe('getPageItems', () => {
  it('показывает все страницы, если их мало', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('сворачивает середину в начале списка', () => {
    expect(getPageItems(1, 7)).toEqual([1, 2, 3, 4, 'gap', 7]);
    expect(getPageItems(1, 21)).toEqual([1, 2, 3, 4, 'gap', 21]);
  });

  it('показывает соседей текущей страницы в середине', () => {
    expect(getPageItems(10, 21)).toEqual([1, 'gap', 9, 10, 11, 'gap', 21]);
  });

  it('сворачивает середину в конце списка', () => {
    expect(getPageItems(21, 21)).toEqual([1, 'gap', 18, 19, 20, 21]);
  });

  it('не ставит разрыв ради одной пропущенной страницы', () => {
    expect(getPageItems(4, 21)).toEqual([1, 2, 3, 4, 5, 'gap', 21]);
  });
});
