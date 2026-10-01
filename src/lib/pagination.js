/** @typedef {number | 'gap'} PageItem */

/**
 * @param {number} total
 * @param {number} pageSize
 * @returns {number}
 */
export function getTotalPages(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * @param {number} page
 * @param {number} totalPages
 * @returns {PageItem[]}
 */
export function getPageItems(page, totalPages) {
  const current = Math.min(Math.max(page, 1), totalPages);
  const pages = new Set([1, totalPages, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (current >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((n) => pages.add(n));

  const sorted = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  /** @type {PageItem[]} */
  const items = [];
  sorted.forEach((n, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && n - previous === 2) items.push(previous + 1);
    else if (previous !== undefined && n - previous > 2) items.push('gap');
    items.push(n);
  });
  return items;
}
