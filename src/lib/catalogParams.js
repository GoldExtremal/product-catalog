import { PAGE_SIZE } from '../constants/catalog.js';

/** @typedef {'price_asc' | 'price_desc' | 'rating'} SortValue */

/**
 * @typedef {object} CatalogParams
 * @property {string} q
 * @property {string | null} category
 * @property {number | null} priceMin
 * @property {number | null} priceMax
 * @property {boolean} inStock
 * @property {SortValue | null} sort
 * @property {number} page
 */

/** @type {readonly SortValue[]} */
export const SORT_VALUES = ['price_asc', 'price_desc', 'rating'];

/** @type {Readonly<CatalogParams>} */
export const DEFAULT_PARAMS = Object.freeze({
  q: '',
  category: null,
  priceMin: null,
  priceMax: null,
  inStock: false,
  sort: null,
  page: 1,
});

/**
 * @param {string | URLSearchParams} search
 * @returns {CatalogParams}
 */
export function parseCatalogParams(search) {
  const query = typeof search === 'string' ? new URLSearchParams(search) : search;
  return {
    q: (query.get('q') ?? '').trim(),
    category: parseCategory(query.get('category')),
    priceMin: parsePrice(query.get('price_min')),
    priceMax: parsePrice(query.get('price_max')),
    inStock: query.get('in_stock') === 'true',
    sort: parseSort(query.get('sort')),
    page: parsePage(query.get('page')),
  };
}

/**
 * @param {CatalogParams} params
 * @returns {string}
 */
export function serializeCatalogParams(params) {
  const query = filterEntries(params);
  if (params.page > 1) query.append('page', String(params.page));
  return query.toString();
}

/**
 * @param {CatalogParams} params
 * @returns {string}
 */
export function toApiQuery(params) {
  const query = filterEntries(params);
  query.append('page', String(params.page));
  query.append('limit', String(PAGE_SIZE));
  return query.toString();
}

/**
 * @param {CatalogParams} params
 * @param {Partial<Omit<CatalogParams, 'page'>>} patch
 * @returns {CatalogParams}
 */
export function withFilters(params, patch) {
  return { ...params, ...patch, page: 1 };
}

/**
 * @param {CatalogParams} params
 * @param {number} page
 * @returns {CatalogParams}
 */
export function withPage(params, page) {
  return { ...params, page: parsePage(String(page)) };
}

/**
 * @param {Pick<CatalogParams, 'priceMin' | 'priceMax'>} params
 * @returns {boolean}
 */
export function isPriceRangeInvalid({ priceMin, priceMax }) {
  return priceMin !== null && priceMax !== null && priceMin > priceMax;
}

/**
 * @param {string | null} value
 * @returns {number | null}
 */
export function parsePrice(value) {
  if (value === null || value.trim() === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

/**
 * @typedef {object} PriceDraftResult
 * @property {number | null} priceMin
 * @property {number | null} priceMax
 * @property {{ min?: string, max?: string }} errors
 * @property {boolean} valid
 */

/**
 * @param {string} minText
 * @param {string} maxText
 * @returns {PriceDraftResult}
 */
export function validatePriceDraft(minText, maxText) {
  const minValue = minText.replace(/\s/g, '');
  const maxValue = maxText.replace(/\s/g, '');
  const priceMin = parsePrice(minValue);
  const priceMax = parsePrice(maxValue);
  /** @type {{ min?: string, max?: string }} */
  const errors = {};

  if (minValue !== '' && priceMin === null) errors.min = 'Введите число не меньше 0';
  if (maxValue !== '' && priceMax === null) errors.max = 'Введите число не меньше 0';
  if (!errors.min && !errors.max && isPriceRangeInvalid({ priceMin, priceMax })) {
    errors.max = 'Максимум не может быть меньше минимума';
  }

  const valid = !errors.min && !errors.max;
  return { priceMin, priceMax, errors, valid };
}

/**
 * @param {CatalogParams} params
 * @returns {URLSearchParams}
 */
function filterEntries(params) {
  const query = new URLSearchParams();
  const q = params.q.trim();
  if (q) query.append('q', q);
  if (params.category) query.append('category', params.category);
  if (params.priceMin !== null) query.append('price_min', String(params.priceMin));
  if (params.priceMax !== null) query.append('price_max', String(params.priceMax));
  if (params.inStock) query.append('in_stock', 'true');
  if (params.sort) query.append('sort', params.sort);
  return query;
}

/**
 * @param {string | null} value
 * @returns {string | null}
 */
function parseCategory(value) {
  const category = value?.trim();
  return category ? category : null;
}

/**
 * @param {string | null} value
 * @returns {SortValue | null}
 */
function parseSort(value) {
  return SORT_VALUES.find((sort) => sort === value) ?? null;
}

/**
 * @param {string | null} value
 * @returns {number}
 */
function parsePage(value) {
  if (value === null || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}
