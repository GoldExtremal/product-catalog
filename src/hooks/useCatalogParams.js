import { useCallback, useEffect, useState } from 'react';
import { parseCatalogParams, serializeCatalogParams } from '../lib/catalogParams.js';

/** @typedef {import('../lib/catalogParams.js').CatalogParams} CatalogParams */
/** @typedef {(current: CatalogParams) => CatalogParams} ParamsUpdate */

export function useCatalogParams() {
  const [params, setParams] = useState(readParams);

  useEffect(() => {
    const onPopState = () => setParams(readParams());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const update = useCallback(
    /**
     * @param {ParamsUpdate} change
     * @param {'push' | 'replace'} mode
     */
    (change, mode) => {
      const current = readParams();
      const search = serializeCatalogParams(change(current));
      if (search === serializeCatalogParams(current)) return;
      const { pathname } = window.location;
      const url = search ? `${pathname}?${search}` : pathname;
      if (mode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
      setParams(parseCatalogParams(search));
    },
    [],
  );

  const navigate = useCallback(
    /** @param {ParamsUpdate} change */
    (change) => update(change, 'push'),
    [update],
  );

  const replace = useCallback(
    /** @param {ParamsUpdate} change */
    (change) => update(change, 'replace'),
    [update],
  );

  return { params, navigate, replace };
}

/** @returns {CatalogParams} */
function readParams() {
  return parseCatalogParams(window.location.search);
}
