import { Button } from '../../shared/ui/Button/Button.jsx';
import { getPageItems } from '../../lib/pagination.js';
import styles from './Pagination.module.css';

/**
 * @param {{
 *   page: number,
 *   totalPages: number,
 *   disabled: boolean,
 *   onPageChange: (page: number) => void,
 * }} props
 */
export function Pagination({ page, totalPages, disabled, onPageChange }) {
  const items = getPageItems(page, totalPages);

  return (
    <nav className={styles.pagination} aria-label="Страницы каталога">
      <Button
        className={styles.step}
        data-testid="pagination-prev"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <span className={styles.arrow} aria-hidden="true">←</span>Назад
      </Button>

      <ul className={styles.pages}>
        {items.map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} className={styles.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                variant={item === page ? 'primary' : 'secondary'}
                className={styles.page}
                aria-label={`Страница ${item}`}
                aria-current={item === page ? 'page' : undefined}
                disabled={disabled && item !== page}
                onClick={() => item !== page && onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ),
        )}
      </ul>

      <p className={styles.compact}>
        Стр. {page} из {totalPages}
      </p>

      <Button
        className={styles.step}
        data-testid="pagination-next"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Далее<span className={styles.arrow} aria-hidden="true">→</span>
      </Button>
    </nav>
  );
}
