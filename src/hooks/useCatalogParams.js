import { useCallback, useEffect, useState } from 'react';
import { parseCatalogParams, serializeCatalogParams } from '../lib/catalogParams.js';

/** @typedef {import('../lib/catalogParams.js').CatalogParams} CatalogParams */

export function useCatalogParams() {
  const [params, setParams] = useState(readParams);

  useEffect(() => {
    const onPopState = () => setParams(readParams());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback(
    /** @param {(current: CatalogParams) => CatalogParams} update */
    (update) => {
      const current = readParams();
      const search = serializeCatalogParams(update(current));
      if (search === serializeCatalogParams(current)) return;
      const { pathname } = window.location;
      window.history.pushState(null, '', search ? `${pathname}?${search}` : pathname);
      setParams(parseCatalogParams(search));
    },
    [],
  );

  return { params, navigate };
}

/** @returns {CatalogParams} */
function readParams() {
  return parseCatalogParams(window.location.search);
}
