import styles from './Checkbox.module.css';

/**
 * @param {Omit<import('react').InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }} props
 */
export function Checkbox({ label, className, ...rest }) {
  return (
    <label className={[styles.field, className].filter(Boolean).join(' ')}>
      <input type="checkbox" className={styles.input} {...rest} />
      <span>{label}</span>
    </label>
  );
}
