const pluralRules = new Intl.PluralRules('ru');

/** @type {Record<string, string>} */
const PRODUCT_FORMS = { one: 'товар', few: 'товара', many: 'товаров', other: 'товара' };

/**
 * @param {number} count
 * @returns {string}
 */
export function formatProductsCount(count) {
  return `${count} ${PRODUCT_FORMS[pluralRules.select(count)]}`;
}
