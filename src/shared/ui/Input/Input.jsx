import { useId } from 'react';
import styles from './Input.module.css';

/**
 * @typedef {object} InputOwnProps
 * @property {string} label
 * @property {boolean} [hideLabel]
 * @property {string} [error]
 * @property {string} [inputClassName]
 * @property {import('react').Ref<HTMLInputElement>} [ref]
 */

/**
 * @param {import('react').InputHTMLAttributes<HTMLInputElement> & InputOwnProps} props
 */
export function Input({ label, hideLabel = false, error, id, className, inputClassName, ref, ...rest }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={hideLabel ? 'visually-hidden' : styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={[styles.input, inputClassName].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
