import { useEffect, useState } from 'react';
import { getCategories } from '../api/categories.js';

/** @typedef {import('../api/categories.js').Category} Category */

/**
 * @typedef {object} CategoriesState
 * @property {'loading' | 'success' | 'error'} status
 * @property {Category[]} items
 */

export function useCategories() {
  const [state, setState] = useState(
    /** @type {CategoriesState} */ ({ status: 'loading', items: [] }),
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
  }, []);

  return state;
}
