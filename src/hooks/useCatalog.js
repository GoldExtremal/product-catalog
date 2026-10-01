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
 * @param {string | null} queryKey
 */
export function useCatalog(queryKey) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState(
    /** @type {CatalogResult} */ ({ key: null, data: null, error: null }),
  );
  const requestIdRef = useRef(0);
  const requestKey = `${queryKey}#${retryCount}`;
  const cached = queryKey === null ? undefined : productsCache.peek(queryKey);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const isCurrent = () => requestId === requestIdRef.current && !controller.signal.aborted;

    if (queryKey === null || productsCache.get(queryKey)) return () => controller.abort();

    getProducts(new URLSearchParams(queryKey), {
      signal: controller.signal,
      canRetry: isCurrent,
    }).then(
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

  /** @type {'idle' | 'loading' | 'success' | 'error'} */
  let status = 'success';
  if (queryKey === null) status = 'idle';
  else if (cached) return { status, data: cached, error: null, retry };
  else if (result.key !== requestKey) status = 'loading';
  else if (result.error) status = 'error';

  return { status, data: result.data, error: result.error, retry };
}
