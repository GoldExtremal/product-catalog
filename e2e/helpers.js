const MOCK_API_URL = 'http://localhost:4000';

/**
 * Сбрасывает данные, счётчики и настройки сбоев mock API к исходным.
 * @param {import('@playwright/test').APIRequestContext} request
 */
export async function resetMockApi(request) {
  const res = await request.post(`${MOCK_API_URL}/__reset`);
  if (!res.ok()) throw new Error(`/__reset ответил ${res.status()}`);
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ latency_ms?: number | [number, number], error_rate?: number }} chaos
 */
export async function setChaos(request, chaos) {
  const res = await request.post(`${MOCK_API_URL}/__chaos`, { data: chaos });
  if (!res.ok()) throw new Error(`/__chaos ответил ${res.status()}`);
}

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} search
 * @returns {Promise<{ total: number, items: { title: string }[] }>}
 */
export async function fetchProducts(request, search) {
  const res = await request.get(`${MOCK_API_URL}/api/products?${search}`);
  if (!res.ok()) throw new Error(`/api/products ответил ${res.status()}`);
  return res.json();
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {URLSearchParams[]}
 */
export function trackProductRequests(page) {
  /** @type {URLSearchParams[]} */
  const requests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/products') requests.push(url.searchParams);
  });
  return requests;
}
