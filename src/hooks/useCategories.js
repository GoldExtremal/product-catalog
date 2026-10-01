import { useCallback, useEffect, useState } from 'react';
import { getCategories } from '../api/categories.js';

/** @typedef {import('../api/categories.js').Category} Category */

/**
 * @typedef {object} CategoriesState
 * @property {'loading' | 'success' | 'error'} status
 * @property {Category[]} items
 * @property {() => void} retry
 */

export function useCategories() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(
    /** @type {Omit<CategoriesState, 'retry'>} */ ({ status: 'loading', items: [] }),
  );

  useEffect(() => {
    const controller = new AbortController();
    getCategories(controller.signal).then(
      (items) => setState({ status: 'success', items }),
      () => {
        if (!controller.signal.aborted) setState({ status: 'error', items: [] });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading', items: [] });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
