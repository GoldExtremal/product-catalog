import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * @param {number} delay
 */
export function useDebounce(delay) {
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const cancel = useCallback(() => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const schedule = useCallback(
    /** @param {() => void} task */
    (task) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        task();
      }, delay);
    },
    [cancel, delay],
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(() => ({ schedule, cancel }), [schedule, cancel]);
}
