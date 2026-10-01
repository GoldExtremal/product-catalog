import { ApiError, ApiTimeoutError } from '../api/errors.js';

/**
 * @typedef {object} CatalogErrorView
 * @property {'retry' | 'reset'} action
 * @property {string} title
 * @property {string} message
 */

/** @type {Record<string, string>} */
const PARAM_NAMES = {
  q: 'поиск',
  category: 'категория',
  price_min: 'цена от',
  price_max: 'цена до',
  in_stock: 'наличие',
  sort: 'сортировка',
  page: 'страница',
  limit: 'размер страницы',
};

/**
 * @param {unknown} error
 * @returns {CatalogErrorView}
 */
export function describeCatalogError(error) {
  if (error instanceof ApiError && error.status === 400) {
    const param = readInvalidParam(error.body);
    const name = param ? PARAM_NAMES[param] : undefined;
    return {
      action: 'reset',
      title: 'Некорректные параметры ссылки',
      message: name
        ? `Значение «${name}» в ссылке не поддерживается. Сбросьте фильтры, чтобы открыть каталог.`
        : 'Ссылка содержит неподдерживаемые параметры. Сбросьте фильтры, чтобы открыть каталог.',
    };
  }

  if (error instanceof ApiTimeoutError) {
    return {
      action: 'retry',
      title: 'Не удалось загрузить товары',
      message: 'Сервер слишком долго не отвечает. Попробуйте ещё раз.',
    };
  }

  return {
    action: 'retry',
    title: 'Не удалось загрузить товары',
    message: 'Проверьте соединение и попробуйте ещё раз.',
  };
}

/**
 * @param {unknown} body
 * @returns {string | null}
 */
function readInvalidParam(body) {
  if (typeof body !== 'object' || body === null) return null;
  if (!('error' in body) || body.error !== 'invalid_param') return null;
  return 'param' in body && typeof body.param === 'string' ? body.param : null;
}
