import { Button } from '../../shared/ui/Button/Button.jsx';

/**
 * @param {{ onRetry: () => void }} props
 */
export function ErrorState({ onRetry }) {
  return (
    <div data-testid="state-error" role="alert">
      <h2>Не удалось загрузить товары</h2>
      <p>Проверьте соединение и попробуйте ещё раз.</p>
      <Button variant="primary" data-testid="retry-button" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}
