import { useId } from 'react';
import styles from './Select.module.css';

/**
 * @typedef {object} SelectOption
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {object} SelectOwnProps
 * @property {string} label
 * @property {boolean} [hideLabel]
 * @property {SelectOption[]} options
 */

/**
 * @param {import('react').SelectHTMLAttributes<HTMLSelectElement> & SelectOwnProps} props
 */
export function Select({ label, hideLabel = false, options, id, className, ...rest }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={hideLabel ? 'visually-hidden' : styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select id={selectId} className={styles.select} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
