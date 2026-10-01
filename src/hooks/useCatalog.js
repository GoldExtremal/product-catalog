import { useCallback, useEffect, useRef, useState } from 'react';
import { getProducts } from '../api/products.js';
import { createLruCache } from '../lib/cache.js';
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS } from '../constants/catalog.js';

/** @typedef {import('../api/products.js').ProductsResponse} ProductsResponse */

/**
 * @typedef {object} CatalogResult
 * @property {string | null} key
 * @property {ProductsResponse | null} data
 * @property {unknown} error
 */

/** @type {import('../lib/cache.js').LruCache<ProductsResponse>} */
const productsCache = createLruCache({ maxEntries: CACHE_MAX_ENTRIES, ttlMs: CACHE_TTL_MS });

/**
 * @param {string} queryKey
 */
export function useCatalog(queryKey) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState(
    /** @type {CatalogResult} */ ({ key: null, data: null, error: null }),
  );
  const requestIdRef = useRef(0);
  const requestKey = `${queryKey}#${retryCount}`;
  const cached = productsCache.peek(queryKey);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const isCurrent = () => requestId === requestIdRef.current && !controller.signal.aborted;

    if (productsCache.get(queryKey)) return () => controller.abort();

    getProducts(new URLSearchParams(queryKey), controller.signal).then(
      (data) => {
        productsCache.set(queryKey, data);
        if (isCurrent()) setResult({ key: requestKey, data, error: null });
      },
      (error) => {
        if (isCurrent()) setResult((prev) => ({ key: requestKey, data: prev.data, error }));
      },
    );

    return () => controller.abort();
  }, [queryKey, requestKey]);

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);

  if (cached) return { status: /** @type {const} */ ('success'), data: cached, error: null, retry };

  /** @type {'loading' | 'success' | 'error'} */
  const status = result.key !== requestKey ? 'loading' : result.error ? 'error' : 'success';

  return { status, data: result.data, error: result.error, retry };
}
