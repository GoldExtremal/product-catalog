import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARAMS,
  isPriceRangeInvalid,
  parseCatalogParams,
  serializeCatalogParams,
  toApiQuery,
  validatePriceDraft,
  withFilters,
  withPage,
} from './catalogParams.js';

describe('parseCatalogParams', () => {
  it('возвращает значения по умолчанию для пустой строки', () => {
    expect(parseCatalogParams('')).toEqual(DEFAULT_PARAMS);
  });

  it('читает все параметры', () => {
    expect(
      parseCatalogParams(
        '?q=run&category=shoes&price_min=1000&price_max=30000&in_stock=true&sort=rating&page=3',
      ),
    ).toEqual({
      q: 'run',
      category: 'shoes',
      priceMin: 1000,
      priceMax: 30000,
      inStock: true,
      sort: 'rating',
      page: 3,
    });
  });

  it('обрезает пробелы в поиске и категории', () => {
    const params = parseCatalogParams('q=%20%20run%20&category=%20%20');
    expect(params.q).toBe('run');
    expect(params.category).toBeNull();
  });

  it('сохраняет неизвестную категорию до проверки API', () => {
    expect(parseCatalogParams('category=unknown').category).toBe('unknown');
  });

  it.each([['abc'], ['-5'], ['Infinity'], ['']])('отбрасывает некорректную цену %j', (value) => {
    const params = parseCatalogParams(`price_min=${value}&price_max=${value}`);
    expect(params.priceMin).toBeNull();
    expect(params.priceMax).toBeNull();
  });

  it('принимает нулевую цену', () => {
    expect(parseCatalogParams('price_min=0').priceMin).toBe(0);
  });

  it.each([['false'], ['1'], ['yes'], ['']])('считает in_stock=%j отсутствующим фильтром', (value) => {
    expect(parseCatalogParams(`in_stock=${value}`).inStock).toBe(false);
  });

  it('отбрасывает неизвестную сортировку', () => {
    expect(parseCatalogParams('sort=name').sort).toBeNull();
  });

  it.each([['0'], ['-1'], ['2.5'], ['abc'], ['1e3'], ['99999999999999999999']])(
    'нормализует страницу %j к 1',
    (value) => {
      expect(parseCatalogParams(`page=${value}`).page).toBe(1);
    },
  );

  it('не путает min > max с невалидным значением', () => {
    const params = parseCatalogParams('price_min=500&price_max=100');
    expect(params.priceMin).toBe(500);
    expect(params.priceMax).toBe(100);
    expect(isPriceRangeInvalid(params)).toBe(true);
  });
});

describe('serializeCatalogParams', () => {
  it('не пишет значения по умолчанию', () => {
    expect(serializeCatalogParams(DEFAULT_PARAMS)).toBe('');
  });

  it('пишет параметры в фиксированном порядке', () => {
    expect(
      serializeCatalogParams({
        sort: 'price_desc',
        page: 2,
        inStock: true,
        priceMax: 30000,
        priceMin: 0,
        category: 'shoes',
        q: 'кроссовки run',
      }),
    ).toBe(
      'q=%D0%BA%D1%80%D0%BE%D1%81%D1%81%D0%BE%D0%B2%D0%BA%D0%B8+run&category=shoes&price_min=0&price_max=30000&in_stock=true&sort=price_desc&page=2',
    );
  });

  it('восстанавливает то же состояние после разбора', () => {
    const params = parseCatalogParams('q=air&category=bags&price_max=50000&sort=rating&page=4');
    expect(parseCatalogParams(serializeCatalogParams(params))).toEqual(params);
  });
});

describe('toApiQuery', () => {
  it('всегда добавляет page и limit', () => {
    expect(toApiQuery(DEFAULT_PARAMS)).toBe('page=1&limit=24');
  });

  it('даёт одинаковый ключ для семантически одинаковых URL', () => {
    const a = parseCatalogParams('sort=rating&q=%20run%20&page=1&in_stock=true&utm=x');
    const b = parseCatalogParams('in_stock=true&q=run&sort=rating');
    expect(toApiQuery(a)).toBe(toApiQuery(b));
    expect(toApiQuery(a)).toBe('q=run&in_stock=true&sort=rating&page=1&limit=24');
  });

  it('различает разные страницы', () => {
    expect(toApiQuery(withPage(DEFAULT_PARAMS, 2))).not.toBe(toApiQuery(DEFAULT_PARAMS));
  });
});

describe('withFilters и withPage', () => {
  const onPage3 = parseCatalogParams('q=run&category=shoes&page=3');

  it('сбрасывает страницу при изменении фильтра', () => {
    expect(withFilters(onPage3, { sort: 'rating' })).toEqual({ ...onPage3, sort: 'rating', page: 1 });
  });

  it('сбрасывает страницу при изменении поиска', () => {
    expect(withFilters(onPage3, { q: 'air' }).page).toBe(1);
  });

  it('меняет только страницу', () => {
    expect(withPage(onPage3, 4)).toEqual({ ...onPage3, page: 4 });
  });

  it('нормализует некорректную страницу', () => {
    expect(withPage(onPage3, 0).page).toBe(1);
  });
});

describe('validatePriceDraft', () => {
  it('принимает пустой диапазон', () => {
    expect(validatePriceDraft('', '')).toEqual({ priceMin: null, priceMax: null, errors: {}, valid: true });
  });

  it('убирает пробелы-разделители разрядов', () => {
    expect(validatePriceDraft('1 000', ' 30 000 ')).toMatchObject({ priceMin: 1000, priceMax: 30000, valid: true });
  });

  it('помечает нечисловое и отрицательное значение', () => {
    expect(validatePriceDraft('abc', '-5')).toMatchObject({
      valid: false,
      errors: { min: expect.any(String), max: expect.any(String) },
    });
  });

  it('помечает максимум при min > max', () => {
    const result = validatePriceDraft('500', '100');
    expect(result.valid).toBe(false);
    expect(result.errors.min).toBeUndefined();
    expect(result.errors.max).toEqual(expect.any(String));
  });

  it('допускает min = max', () => {
    expect(validatePriceDraft('100', '100').valid).toBe(true);
  });
});
