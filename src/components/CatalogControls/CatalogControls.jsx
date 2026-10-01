import { CatalogFilters } from './CatalogFilters.jsx';
import { SearchInput } from './SearchInput.jsx';
import styles from './CatalogControls.module.css';

/** @typedef {import('../../lib/catalogParams.js').CatalogParams} CatalogParams */
/** @typedef {import('./CatalogFilters.jsx').FiltersPatch} FiltersPatch */

/**
 * @param {{
 *   params: CatalogParams,
 *   categories: import('../../hooks/useCategories.js').CategoriesState,
 *   onSearch: (q: string) => void,
 *   onFiltersChange: (patch: FiltersPatch) => void,
 *   onFiltersReset: () => void,
 * }} props
 */
export function CatalogControls({ params, categories, onSearch, onFiltersChange, onFiltersReset }) {
  return (
    <section className={styles.controls} aria-label="Поиск и фильтры">
      <SearchInput value={params.q} onSearch={onSearch} />
      <CatalogFilters
        params={params}
        categories={categories}
        onChange={onFiltersChange}
        onReset={onFiltersReset}
      />
    </section>
  );
}
