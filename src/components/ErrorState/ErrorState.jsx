import { Button } from '../../shared/ui/Button/Button.jsx';
import styles from './ErrorState.module.css';

/**
 * @param {{
 *   title: string,
 *   message: string,
 *   actionLabel: string,
 *   onAction: () => void,
 *   actionTestId?: string,
 *   titleRef?: import('react').Ref<HTMLHeadingElement>,
 * }} props
 */
export function ErrorState({ title, message, actionLabel, onAction, actionTestId, titleRef }) {
  return (
    <div className={styles.error} data-testid="state-error" role="alert">
      <h2 ref={titleRef} className={styles.title} tabIndex={-1}>
        {title}
      </h2>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" data-testid={actionTestId} onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
