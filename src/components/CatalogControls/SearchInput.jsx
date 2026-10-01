import { useEffect, useState } from 'react';
import { Input } from '../../shared/ui/Input/Input.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { parseCatalogParams } from '../../lib/catalogParams.js';
import { SEARCH_DEBOUNCE_MS } from '../../constants/catalog.js';
import styles from './SearchInput.module.css';

/**
 * @param {{ value: string, onSearch: (q: string) => void }} props
 */
export function SearchInput({ value, onSearch }) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [committed, setCommitted] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value !== committed) setDraft(value);
  }
  const debounce = useDebounce(SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const onPopState = () => {
      debounce.cancel();
      setDraft(parseCatalogParams(window.location.search).q);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [debounce]);

  /** @param {string} text */
  const commit = (text) => {
    const q = text.trim();
    setCommitted(q);
    onSearch(q);
  };

  /** @param {import('react').ChangeEvent<HTMLInputElement>} event */
  const handleChange = (event) => {
    const next = event.target.value;
    setDraft(next);
    debounce.schedule(() => commit(next));
  };

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  const handleSubmit = (event) => {
    event.preventDefault();
    debounce.cancel();
    commit(draft);
  };

  return (
    <form role="search" className={styles.form} onSubmit={handleSubmit}>
      <Input
        type="search"
        label="Поиск по названию"
        hideLabel
        inputClassName={styles.input}
        placeholder="Поиск по названию"
        autoComplete="off"
        enterKeyHint="search"
        data-testid="search-input"
        value={draft}
        onChange={handleChange}
      />
    </form>
  );
}
