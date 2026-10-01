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
  const debounce = useDebounce(SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const onPopState = () => {
      debounce.cancel();
      setDraft(parseCatalogParams(window.location.search).q);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [debounce]);

  /** @param {import('react').ChangeEvent<HTMLInputElement>} event */
  const handleChange = (event) => {
    const next = event.target.value;
    setDraft(next);
    debounce.schedule(() => onSearch(next.trim()));
  };

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  const handleSubmit = (event) => {
    event.preventDefault();
    debounce.cancel();
    onSearch(draft.trim());
  };

  return (
    <form role="search" className={styles.form} onSubmit={handleSubmit}>
      <Input
        type="search"
        label="Поиск по названию"
        placeholder="Например, кроссовки"
        autoComplete="off"
        enterKeyHint="search"
        data-testid="search-input"
        value={draft}
        onChange={handleChange}
      />
    </form>
  );
}
