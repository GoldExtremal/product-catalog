import { describe, expect, it } from 'vitest';
import { ApiError, ApiTimeoutError } from '../api/errors.js';
import { describeCatalogError } from './catalogErrors.js';

describe('describeCatalogError', () => {
  it('предлагает сброс для 400 invalid_param и называет параметр', () => {
    const view = describeCatalogError(new ApiError(400, { error: 'invalid_param', param: 'category' }));
    expect(view.action).toBe('reset');
    expect(view.title).toBe('Некорректные параметры ссылки');
    expect(view.message).toContain('категория');
  });

  it('предлагает сброс для 400 без описания параметра', () => {
    const view = describeCatalogError(new ApiError(400, null));
    expect(view.action).toBe('reset');
    expect(view.message).toContain('неподдерживаемые параметры');
  });

  it('предлагает повтор при таймауте с отдельным сообщением', () => {
    const view = describeCatalogError(new ApiTimeoutError());
    expect(view.action).toBe('retry');
    expect(view.message).toContain('долго не отвечает');
  });

  it.each([[new ApiError(500, null)], [new TypeError('Failed to fetch')]])(
    'предлагает повтор для %s',
    (error) => {
      const view = describeCatalogError(error);
      expect(view.action).toBe('retry');
      expect(view.message).toContain('соединение');
    },
  );
});
