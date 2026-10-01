import { useEffect, useId, useImperativeHandle, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '../../shared/ui/Button/Button.jsx';
import { Checkbox } from '../../shared/ui/Checkbox/Checkbox.jsx';
import { Input } from '../../shared/ui/Input/Input.jsx';
import { Select } from '../../shared/ui/Select/Select.jsx';
import { SORT_VALUES, parseCatalogParams, validatePriceDraft } from '../../lib/catalogParams.js';
import { caretAfterDigits, formatPriceInput } from '../../lib/formatPrice.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { PRICE_DEBOUNCE_MS } from '../../constants/catalog.js';
import styles from './CatalogFilters.module.css';

/** @typedef {import('../../lib/catalogParams.js').CatalogParams} CatalogParams */
/** @typedef {import('../../hooks/useCategories.js').CategoriesState} CategoriesState */
/** @typedef {Partial<Omit<CatalogParams, 'page' | 'q'>>} FiltersPatch */
/** @typedef {{ flushPrice: () => void }} CatalogFiltersHandle */

const SORT_OPTIONS = [
  { value: '', label: 'Сортировка' },
  { value: 'price_asc', label: 'Сначала дешёвые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
  { value: 'rating', label: 'По рейтингу' },
];

/**
 * @param {number | null} value
 * @returns {string}
 */
const toDraft = (value) => {
  if (value === null) return '';
  return Number.isSafeInteger(value) ? formatPriceInput(String(value)) : String(value);
};

/**
 * @param {{
 *   params: CatalogParams,
 *   categories: CategoriesState,
 *   onChange: (patch: FiltersPatch) => void,
 *   onReset: () => void,
 *   ref?: import('react').Ref<CatalogFiltersHandle>,
 * }} props
 */
export function CatalogFilters({ params, categories, onChange, onReset, ref }) {
  const [minDraft, setMinDraft] = useState(() => toDraft(params.priceMin));
  const [maxDraft, setMaxDraft] = useState(() => toDraft(params.priceMax));
  const [errors, setErrors] = useState(/** @type {{ min?: string, max?: string }} */ ({}));
  const priceKey = `${params.priceMin}|${params.priceMax}`;
  const [syncedPriceKey, setSyncedPriceKey] = useState(priceKey);
  if (priceKey !== syncedPriceKey) {
    setSyncedPriceKey(priceKey);
    setMinDraft(toDraft(params.priceMin));
    setMaxDraft(toDraft(params.priceMax));
    setErrors({});
  }
  const priceErrorId = useId();
  const priceError = [...new Set([errors.min, errors.max].filter(Boolean))].join(' ');

  const debounce = useDebounce(PRICE_DEBOUNCE_MS);

  useEffect(() => {
    const onPopState = () => {
      debounce.cancel();
      const fromUrl = parseCatalogParams(window.location.search);
      setMinDraft(toDraft(fromUrl.priceMin));
      setMaxDraft(toDraft(fromUrl.priceMax));
      setErrors({});
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [debounce]);

  /**
   * @param {string} min
   * @param {string} max
   */
  const commitPriceDraft = (min, max) => {
    const result = validatePriceDraft(min, max);
    setErrors(result.errors);
    if (!result.valid) return;
    setMinDraft(toDraft(result.priceMin));
    setMaxDraft(toDraft(result.priceMax));
    onChange({ priceMin: result.priceMin, priceMax: result.priceMax });
  };

  const commitPriceNow = () => {
    debounce.cancel();
    commitPriceDraft(minDraft, maxDraft);
  };

  /**
   * @param {import('react').ChangeEvent<HTMLInputElement>} event
   * @param {'min' | 'max'} field
   */
  const handlePriceInput = (event, field) => {
    const input = event.target;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length;
    const formatted = formatPriceInput(input.value);
    flushSync(() => {
      if (field === 'min') setMinDraft(formatted);
      else setMaxDraft(formatted);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    });
    const position = caretAfterDigits(formatted, digitsBeforeCaret);
    input.setSelectionRange(position, position);

    const nextMin = field === 'min' ? formatted : minDraft;
    const nextMax = field === 'max' ? formatted : maxDraft;
    debounce.schedule(() => commitPriceDraft(nextMin, nextMax));
  };

  useImperativeHandle(ref, () => ({
    flushPrice() {
      debounce.cancel();
      if (validatePriceDraft(minDraft, maxDraft).valid) {
        commitPriceDraft(minDraft, maxDraft);
        return;
      }
      setMinDraft(toDraft(params.priceMin));
      setMaxDraft(toDraft(params.priceMax));
      setErrors({});
    },
  }));

  /** @param {import('react').KeyboardEvent<HTMLInputElement>} event */
  const handlePriceKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commitPriceNow();
  };

  const handleReset = () => {
    debounce.cancel();
    setMinDraft('');
    setMaxDraft('');
    setErrors({});
    onReset();
  };

  const categoryOptions = [
    { value: '', label: 'Все категории' },
    ...categories.items.map((category) => ({ value: category.id, label: category.title })),
  ];
  if (params.category && !categories.items.some((category) => category.id === params.category)) {
    categoryOptions.push({ value: params.category, label: params.category });
  }

  const hasFilters =
    params.category !== null ||
    params.priceMin !== null ||
    params.priceMax !== null ||
    params.inStock ||
    params.sort !== null ||
    minDraft !== '' ||
    maxDraft !== '';

  return (
    <div className={styles.filters}>
      <div className={styles.category}>
        <Select
          label="Категория"
          hideLabel
          data-testid="filter-category"
          options={categoryOptions}
          value={params.category ?? ''}
          aria-busy={categories.status === 'loading' || undefined}
          onChange={(event) => onChange({ category: event.target.value || null })}
        />
        {categories.status === 'error' && (
          <p className={styles.note} role="status">
            Категории не загрузились.
            <Button variant="ghost" className={styles.noteAction} onClick={categories.retry}>
              Повторить
            </Button>
          </p>
        )}
        {categories.status === 'success' && categories.items.length === 0 && (
          <p className={styles.note} role="status">
            Список категорий пуст.
          </p>
        )}
      </div>

      <Select
        className={styles.sort}
        label="Сортировка"
        hideLabel
        data-testid="sort-select"
        options={SORT_OPTIONS}
        value={params.sort ?? ''}
        onChange={(event) =>
          onChange({ sort: SORT_VALUES.find((sort) => sort === event.target.value) ?? null })
        }
      />

      <fieldset className={styles.price}>
        <legend className="visually-hidden">Цена, ₸</legend>
        <div className={styles.priceRow}>
          <Input
            label="Цена от"
            hideLabel
            placeholder="Цена от, ₸"
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            data-testid="filter-price-min"
            value={minDraft}
            aria-invalid={errors.min ? true : undefined}
            aria-describedby={errors.min ? priceErrorId : undefined}
            onChange={(event) => handlePriceInput(event, 'min')}
            onKeyDown={handlePriceKeyDown}
            onBlur={commitPriceNow}
          />
          <span className={styles.dash} aria-hidden="true">
            —
          </span>
          <Input
            label="Цена до"
            hideLabel
            placeholder="до, ₸"
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            data-testid="filter-price-max"
            value={maxDraft}
            aria-invalid={errors.max ? true : undefined}
            aria-describedby={errors.max ? priceErrorId : undefined}
            onChange={(event) => handlePriceInput(event, 'max')}
            onKeyDown={handlePriceKeyDown}
            onBlur={commitPriceNow}
          />
        </div>
        {priceError && (
          <p id={priceErrorId} className={styles.error}>
            {priceError}
          </p>
        )}
      </fieldset>

      <div className={styles.extras}>
        <Checkbox
          label="В наличии"
          data-testid="filter-in-stock"
          checked={params.inStock}
          onChange={(event) => onChange({ inStock: event.target.checked })}
        />
        <Button variant="danger" className={styles.reset} disabled={!hasFilters} onClick={handleReset}>
          Сбросить
        </Button>
      </div>
    </div>
  );
}
