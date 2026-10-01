import { ApiError, ApiTimeoutError, REQUEST_TIMEOUT_MS } from './errors.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const ASSET_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

/**
 * @param {string} path
 * @returns {string}
 */
export function resolveAssetUrl(path) {
  return new URL(path, ASSET_ORIGIN).toString();
}

/**
 * @typedef {object} RequestOptions
 * @property {AbortSignal} signal
 * @property {() => boolean} [canRetry]
 */

/**
 * @param {string} path
 * @param {URLSearchParams} query
 * @param {RequestOptions} options
 * @returns {Promise<unknown>}
 */
export async function apiGet(path, query, { signal, canRetry = () => true }) {
  const search = query.toString();
  const url = `${API_BASE_URL}${path}${search ? `?${search}` : ''}`;
  const deadline = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = AbortSignal.any([signal, deadline]);

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await request(url, combined);
    } catch (error) {
      const failure = classify(error, signal, deadline);
      if (failure !== error || attempt >= MAX_ATTEMPTS || !isRetryable(error) || !canRetry()) {
        throw failure;
      }
    }

    try {
      await wait(RETRY_DELAY_MS, combined);
    } catch (error) {
      throw classify(error, signal, deadline);
    }
    if (!canRetry()) throw new DOMException('Запрос устарел', 'AbortError');
  }
}

/**
 * @param {string} url
 * @param {AbortSignal} signal
 * @returns {Promise<unknown>}
 */
async function request(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  const body = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

/**
 * @param {unknown} error
 * @param {AbortSignal} signal
 * @param {AbortSignal} deadline
 * @returns {unknown}
 */
function classify(error, signal, deadline) {
  if (signal.aborted) return signal.reason ?? error;
  if (deadline.aborted) return new ApiTimeoutError();
  return error;
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isRetryable(error) {
  if (error instanceof ApiError) return error.status >= 500;
  return error instanceof TypeError;
}

/**
 * @param {number} ms
 * @param {AbortSignal} signal
 * @returns {Promise<void>}
 */
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
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
