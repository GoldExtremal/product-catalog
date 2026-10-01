/** @type {Map<string, Intl.NumberFormat>} */
const formatters = new Map();

/**
 * @param {number} price
 * @param {string} currency
 * @returns {string}
 */
export function formatPrice(price, currency) {
  const locale = navigator.language || 'ru-KZ';
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(price);
}
