import { Button } from '../../shared/ui/Button/Button.jsx';
import styles from './EmptyState.module.css';

/**
 * @param {{ onReset: () => void }} props
 */
export function EmptyState({ onReset }) {
  return (
    <div className={styles.empty} data-testid="state-empty">
      <h2 className={styles.title}>Ничего не найдено</h2>
      <p className={styles.message}>Попробуйте изменить запрос или ослабить фильтры.</p>
      <Button variant="primary" onClick={onReset}>
        Сбросить поиск и фильтры
      </Button>
    </div>
  );
}
