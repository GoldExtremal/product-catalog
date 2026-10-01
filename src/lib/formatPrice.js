/** @type {Map<string, Intl.NumberFormat>} */
const formatters = new Map();

const GROUP_SEPARATOR = ' ';

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

/**
 * @param {string} text
 * @returns {string}
 */
export function formatPriceInput(text) {
  const digits = text.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}

/**
 * @param {string} text
 * @param {number} digitCount
 * @returns {number}
 */
export function caretAfterDigits(text, digitCount) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text[index])) seen += 1;
    if (seen === digitCount) return index + 1;
  }
  return text.length;
}
