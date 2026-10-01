import { useRef, useState } from 'react';
import { Button } from '../../shared/ui/Button/Button.jsx';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { FILTERS_MOBILE_QUERY } from '../../constants/catalog.js';
import { formatProductsCount } from '../../lib/plural.js';
import { CatalogFilters } from './CatalogFilters.jsx';
import { FiltersDialog } from './FiltersDialog.jsx';
import { SearchInput } from './SearchInput.jsx';
import styles from './CatalogControls.module.css';

/** @typedef {import('../../lib/catalogParams.js').CatalogParams} CatalogParams */
/** @typedef {import('./CatalogFilters.jsx').FiltersPatch} FiltersPatch */
/** @typedef {import('./CatalogFilters.jsx').CatalogFiltersHandle} CatalogFiltersHandle */

/**
 * @param {CatalogParams} params
 * @returns {number}
 */
function countActiveFilters(params) {
  return [
    params.category !== null,
    params.priceMin !== null || params.priceMax !== null,
    params.inStock,
    params.sort !== null,
  ].filter(Boolean).length;
}

/**
 * @param {{
 *   params: CatalogParams,
 *   categories: import('../../hooks/useCategories.js').CategoriesState,
 *   resultsTotal: number | null,
 *   onSearch: (q: string) => void,
 *   onFiltersChange: (patch: FiltersPatch) => void,
 *   onFiltersReset: () => void,
 * }} props
 */
export function CatalogControls({
  params,
  categories,
  resultsTotal,
  onSearch,
  onFiltersChange,
  onFiltersReset,
}) {
  const isMobile = useMediaQuery(FILTERS_MOBILE_QUERY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const openButtonRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const filtersRef = useRef(/** @type {CatalogFiltersHandle | null} */ (null));
  const activeFilters = countActiveFilters(params);
  if (!isMobile && dialogOpen) setDialogOpen(false);

  const filters = (
    <CatalogFilters
      ref={filtersRef}
      params={params}
      categories={categories}
      onChange={onFiltersChange}
      onReset={onFiltersReset}
    />
  );

  const handleDialogClose = () => {
    filtersRef.current?.flushPrice();
    setDialogOpen(false);
    openButtonRef.current?.focus();
  };

  return (
    <section className={styles.controls} aria-label="Поиск и фильтры">
      <div className={styles.searchRow}>
        <SearchInput value={params.q} onSearch={onSearch} />
        <Button
          ref={openButtonRef}
          className={styles.openButton}
          data-testid="filters-open"
          hidden={!isMobile}
          aria-haspopup="dialog"
          aria-expanded={isMobile ? dialogOpen : undefined}
          onClick={() => setDialogOpen(true)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Фильтры
          {activeFilters > 0 && (
            <span className={styles.badge}>
              <span className="visually-hidden">, активно: </span>
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {isMobile ? (
        <FiltersDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          doneLabel={resultsTotal === null ? 'Готово' : `Показать ${formatProductsCount(resultsTotal)}`}
        >
          {filters}
        </FiltersDialog>
      ) : (
        filters
      )}
    </section>
  );
}
