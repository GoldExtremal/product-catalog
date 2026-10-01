import { apiGet } from './client.js';

/**
 * @typedef {object} Product
 * @property {string} id
 * @property {string} title
 * @property {number} price
 * @property {string} currency
 * @property {string} category
 * @property {number} rating
 * @property {boolean} in_stock
 * @property {string} image_url
 */

/**
 * @typedef {object} ProductsResponse
 * @property {Product[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 */

/**
 * @param {URLSearchParams} query
 * @param {import('./client.js').RequestOptions} options
 * @returns {Promise<ProductsResponse>}
 */
export async function getProducts(query, options) {
  return /** @type {ProductsResponse} */ (await apiGet('/products', query, options));
}
