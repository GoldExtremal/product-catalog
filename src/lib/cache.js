/**
 * @template T
 * @typedef {object} LruCache
 * @property {(key: string) => T | undefined} get
 * @property {(key: string) => T | undefined} peek
 * @property {(key: string, value: T) => void} set
 * @property {() => number} size
 */

/**
 * @template T
 * @param {{ maxEntries: number, ttlMs: number, now?: () => number }} options
 * @returns {LruCache<T>}
 */
export function createLruCache({ maxEntries, ttlMs, now = Date.now }) {
  /** @type {Map<string, { value: T, storedAt: number }>} */
  const entries = new Map();

  /** @param {string} key */
  const readFresh = (key) => {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (now() - entry.storedAt >= ttlMs) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  };

  return {
    get(key) {
      const entry = readFresh(key);
      if (!entry) return undefined;
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    peek(key) {
      return readFresh(key)?.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, { value, storedAt: now() });
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
    size() {
      return entries.size;
    },
  };
}
