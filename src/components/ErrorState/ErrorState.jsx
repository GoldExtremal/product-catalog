import { Button } from '../../shared/ui/Button/Button.jsx';

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
    <div data-testid="state-error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      <Button variant="primary" data-testid={actionTestId} onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
