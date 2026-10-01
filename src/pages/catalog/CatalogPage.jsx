import { useCallback, useEffect } from 'react';
import { useCatalog } from '../../hooks/useCatalog.js';
import { useCatalogParams } from '../../hooks/useCatalogParams.js';
import { useCategories } from '../../hooks/useCategories.js';
import { CatalogControls } from '../../components/CatalogControls/CatalogControls.jsx';
import { EmptyState } from '../../components/EmptyState/EmptyState.jsx';
import { ErrorState } from '../../components/ErrorState/ErrorState.jsx';
import { Pagination } from '../../components/Pagination/Pagination.jsx';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid.jsx';
import { SkeletonGrid } from '../../components/SkeletonGrid/SkeletonGrid.jsx';
import { PAGE_SIZE } from '../../constants/catalog.js';
import { describeCatalogError } from '../../lib/catalogErrors.js';
import {
  DEFAULT_PARAMS,
  isPriceRangeInvalid,
  toApiQuery,
  withFilters,
  withPage,
} from '../../lib/catalogParams.js';
import { getTotalPages } from '../../lib/pagination.js';
import styles from './CatalogPage.module.css';

/** @typedef {import('../../components/CatalogControls/CatalogFilters.jsx').FiltersPatch} FiltersPatch */

export function CatalogPage() {
  const { params, navigate, replace } = useCatalogParams();
  const categories = useCategories();
  const priceRangeInvalid = isPriceRangeInvalid(params);
  const { status, data, error, retry } = useCatalog(priceRangeInvalid ? null : toApiQuery(params));

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

  const handleResetAll = useCallback(() => navigate(() => DEFAULT_PARAMS), [navigate]);

  const handlePriceReset = useCallback(
    () => navigate((current) => withFilters(current, { priceMin: null, priceMax: null })),
    [navigate],
  );

  const handlePageChange = useCallback(
    /** @param {number} page */
    (page) => navigate((current) => withPage(current, page)),
    [navigate],
  );

  const totalPages = data ? getTotalPages(data.total, PAGE_SIZE) : 1;
  const errorView = status === 'error' ? describeCatalogError(error) : null;
  const showSkeleton = status === 'loading' && (!data || data.page !== params.page);
  const showUpdating = status === 'loading' && !showSkeleton;
  const showGrid =
    !showSkeleton && status !== 'idle' && data !== null && data.items.length > 0;

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

      <div className={styles.summary}>
        <p data-testid="results-count" aria-live="polite" className={styles.count}>
          {status === 'success' && data ? `Найдено товаров: ${data.total}` : ''}
        </p>
        {showUpdating && (
          <p data-testid="state-loading" role="status" className={styles.updating}>
            <span className={styles.spinner} aria-hidden="true" />
            Обновляем результаты…
          </p>
        )}
      </div>

      {priceRangeInvalid && (
        <ErrorState
          title="Некорректный диапазон цены"
          message="В ссылке минимальная цена больше максимальной."
          actionLabel="Сбросить цену"
          onAction={handlePriceReset}
        />
      )}

      {errorView && (
        <ErrorState
          title={errorView.title}
          message={errorView.message}
          {...(errorView.action === 'retry'
            ? { actionLabel: 'Повторить', onAction: retry, actionTestId: 'retry-button' }
            : { actionLabel: 'Сбросить фильтры', onAction: handleFiltersReset })}
        />
      )}

      {showSkeleton && <SkeletonGrid />}

      {status === 'success' && data && data.total === 0 && <EmptyState onReset={handleResetAll} />}

      {showGrid && status === 'error' && (
        <p className={styles.staleNote}>Ниже — результаты предыдущего запроса.</p>
      )}

      {showGrid && (
        <div
          className={status === 'success' ? undefined : styles.stale}
          aria-busy={status === 'loading' || undefined}
        >
          <ProductGrid products={data.items} />
        </div>
      )}

      {(status === 'success' || status === 'loading') && data && data.total > 0 && (
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
