import { apiGet } from './client.js';

/**
 * @typedef {object} Category
 * @property {string} id
 * @property {string} title
 */

/**
 * @param {AbortSignal} signal
 * @returns {Promise<Category[]>}
 */
export async function getCategories(signal) {
  return /** @type {Category[]} */ (await apiGet('/categories', new URLSearchParams(), signal));
}
