import { ApiTimeoutError } from '../../api/client.js';
import { Button } from '../../shared/ui/Button/Button.jsx';

/**
 * @param {unknown} error
 * @returns {string}
 */
function describe(error) {
  if (error instanceof ApiTimeoutError) return 'Сервер слишком долго не отвечает. Попробуйте ещё раз.';
  return 'Проверьте соединение и попробуйте ещё раз.';
}

/**
 * @param {{ error: unknown, onRetry: () => void }} props
 */
export function ErrorState({ error, onRetry }) {
  return (
    <div data-testid="state-error" role="alert">
      <h2>Не удалось загрузить товары</h2>
      <p>{describe(error)}</p>
      <Button variant="primary" data-testid="retry-button" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}
