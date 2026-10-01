const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const ASSET_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

/**
 * @param {string} path
 * @returns {string}
 */
export function resolveAssetUrl(path) {
  return new URL(path, ASSET_ORIGIN).toString();
}

export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {unknown} body
   */
  constructor(status, body) {
    super(`API ответил ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {string} path
 * @param {URLSearchParams} query
 * @param {AbortSignal} signal
 * @returns {Promise<unknown>}
 */
export async function apiGet(path, query, signal) {
  const search = query.toString();
  const url = `${API_BASE_URL}${path}${search ? `?${search}` : ''}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  const body = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

/**
 * @param {Response} res
 * @returns {Promise<unknown>}
 */
async function readJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
