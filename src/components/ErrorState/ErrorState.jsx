/**
 * @param {{ onRetry: () => void }} props
 */
export function ErrorState({ onRetry }) {
  return (
    <div data-testid="state-error" role="alert">
      <h2>Не удалось загрузить товары</h2>
      <p>Проверьте соединение и попробуйте ещё раз.</p>
      <button type="button" data-testid="retry-button" onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}
