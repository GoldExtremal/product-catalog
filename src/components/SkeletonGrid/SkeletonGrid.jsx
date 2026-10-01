import { PAGE_SIZE } from '../../constants/catalog.js';
import gridStyles from '../ProductGrid/ProductGrid.module.css';
import styles from './SkeletonGrid.module.css';

const PLACEHOLDERS = Array.from({ length: PAGE_SIZE }, (_, index) => index);

export function SkeletonGrid() {
  return (
    <div data-testid="state-loading" role="status" aria-label="Загрузка товаров">
      <ul className={gridStyles.grid} aria-hidden="true">
        {PLACEHOLDERS.map((index) => (
          <li key={index} className={gridStyles.item}>
            <div className={styles.card}>
              <div className={styles.media} />
              <div className={styles.body}>
                <div className={`${styles.line} ${styles.title}`} />
                <div className={`${styles.line} ${styles.price}`} />
                <div className={`${styles.line} ${styles.meta}`} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
