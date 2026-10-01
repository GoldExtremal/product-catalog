import { useEffect, useLayoutEffect, useRef } from 'react';
import { Button } from '../../shared/ui/Button/Button.jsx';
import styles from './FiltersDialog.module.css';

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   doneLabel: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export function FiltersDialog({ open, onClose, doneLabel, children }) {
  const dialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  /** @param {import('react').MouseEvent<HTMLDialogElement>} event */
  const handleClick = (event) => {
    if (event.target === dialogRef.current) dialogRef.current.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="filters-dialog-title"
      onClose={onClose}
      onClick={handleClick}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id="filters-dialog-title" className={styles.title}>
            Фильтры
          </h2>
          <Button
            variant="ghost"
            className={styles.close}
            aria-label="Закрыть фильтры"
            onClick={() => dialogRef.current?.close()}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </Button>
        </header>

        <div className={styles.body}>{children}</div>

        <footer className={styles.footer}>
          <Button variant="primary" className={styles.done} onClick={() => dialogRef.current?.close()}>
            {doneLabel}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
