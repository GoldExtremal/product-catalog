export const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {unknown} body
   */
  constructor(status, body) {
    super(`API ответил ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class ApiTimeoutError extends Error {
  constructor() {
    super(`API не ответил за ${REQUEST_TIMEOUT_MS / 1000} с`);
    this.name = 'ApiTimeoutError';
  }
}
