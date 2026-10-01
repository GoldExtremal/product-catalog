import styles from './Button.module.css';

/**
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost', ref?: import('react').Ref<HTMLButtonElement> }} props
 */
export function Button({ variant = 'secondary', type = 'button', className, ...rest }) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={classes} {...rest} />;
}
