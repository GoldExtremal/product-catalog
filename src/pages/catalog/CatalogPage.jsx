import { useCallback, useEffect } from 'react';
import { useCatalog } from '../../hooks/useCatalog.js';
import { useCatalogParams } from '../../hooks/useCatalogParams.js';
import { useCategories } from '../../hooks/useCategories.js';
import { CatalogControls } from '../../components/CatalogControls/CatalogControls.jsx';
import { EmptyState } from '../../components/EmptyState/EmptyState.jsx';
import { ErrorState } from '../../components/ErrorState/ErrorState.jsx';
import { Pagination } from '../../components/Pagination/Pagination.jsx';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid.jsx';
import { PAGE_SIZE } from '../../constants/catalog.js';
import { DEFAULT_PARAMS, toApiQuery, withFilters, withPage } from '../../lib/catalogParams.js';
import { getTotalPages } from '../../lib/pagination.js';
import styles from './CatalogPage.module.css';

/** @typedef {import('../../components/CatalogControls/CatalogFilters.jsx').FiltersPatch} FiltersPatch */

export function CatalogPage() {
  const { params, navigate, replace } = useCatalogParams();
  const categories = useCategories();
  const { status, data, retry } = useCatalog(toApiQuery(params));

  const handleSearch = useCallback(
    /** @param {string} q */
    (q) => navigate((current) => withFilters(current, { q })),
    [navigate],
  );

  const handleFiltersChange = useCallback(
    /** @param {FiltersPatch} patch */
    (patch) => navigate((current) => withFilters(current, patch)),
    [navigate],
  );

  const handleFiltersReset = useCallback(
    () => navigate((current) => ({ ...DEFAULT_PARAMS, q: current.q })),
    [navigate],
  );

  const handlePageChange = useCallback(
    /** @param {number} page */
    (page) => navigate((current) => withPage(current, page)),
    [navigate],
  );

  const totalPages = data ? getTotalPages(data.total, PAGE_SIZE) : 1;

  useEffect(() => {
    if (status !== 'success' || !data || data.total === 0) return;
    const lastPage = getTotalPages(data.total, PAGE_SIZE);
    if (params.page > lastPage) replace((current) => withPage(current, lastPage));
  }, [status, data, params.page, replace]);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Каталог товаров</h1>

      <CatalogControls
        params={params}
        categories={categories}
        onSearch={handleSearch}
        onFiltersChange={handleFiltersChange}
        onFiltersReset={handleFiltersReset}
      />

      <p data-testid="results-count" aria-live="polite" className={styles.count}>
        {status === 'success' && data ? `Найдено товаров: ${data.total}` : ''}
      </p>

      {status === 'loading' && (
        <p data-testid="state-loading" role="status">
          Загрузка…
        </p>
      )}

      {status === 'error' && <ErrorState onRetry={retry} />}

      {status === 'success' && data && data.total === 0 && <EmptyState />}

      {status === 'success' && data && data.items.length > 0 && (
        <ProductGrid products={data.items} />
      )}

      {status !== 'error' && data && data.total > 0 && (
        <Pagination
          page={params.page}
          totalPages={totalPages}
          disabled={status === 'loading'}
          onPageChange={handlePageChange}
        />
      )}
    </main>
  );
}
