import { Button } from '../../shared/ui/Button/Button.jsx';
import styles from './ErrorState.module.css';

/**
 * @param {{
 *   title: string,
 *   message: string,
 *   actionLabel: string,
 *   onAction: () => void,
 *   actionTestId?: string,
 * }} props
 */
export function ErrorState({ title, message, actionLabel, onAction, actionTestId }) {
  return (
    <div className={styles.error} data-testid="state-error" role="alert">
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" data-testid={actionTestId} onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
