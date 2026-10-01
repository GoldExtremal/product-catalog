import { useCatalog } from '../../hooks/useCatalog.js';
import { EmptyState } from '../../components/EmptyState/EmptyState.jsx';
import { ErrorState } from '../../components/ErrorState/ErrorState.jsx';
import { PAGE_SIZE } from '../../constants/catalog.js';
import styles from './CatalogPage.module.css';

const INITIAL_QUERY = new URLSearchParams({ limit: String(PAGE_SIZE) }).toString();

export function CatalogPage() {
  const { status, data, retry } = useCatalog(INITIAL_QUERY);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Каталог товаров</h1>

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
        <ul>
          {data.items.map((product) => (
            <li key={product.id}>{product.title}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
