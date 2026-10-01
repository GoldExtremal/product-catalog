import { describe, expect, it } from 'vitest';
import { createLruCache } from './cache.js';

/** @param {number} [maxEntries] */
function setup(maxEntries = 3) {
  let time = 0;
  const cache = createLruCache({ maxEntries, ttlMs: 1000, now: () => time });
  return {
    cache,
    /** @param {number} ms */
    advance: (ms) => {
      time += ms;
    },
  };
}

describe('createLruCache', () => {
  it('возвращает сохранённое значение', () => {
    const { cache } = setup();
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
    expect(cache.peek('a')).toBe(1);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('удаляет запись по истечении TTL', () => {
    const { cache, advance } = setup();
    cache.set('a', 1);
    advance(999);
    expect(cache.get('a')).toBe(1);
    advance(1);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it('не продлевает TTL при чтении', () => {
    const { cache, advance } = setup();
    cache.set('a', 1);
    advance(600);
    cache.get('a');
    advance(600);
    expect(cache.get('a')).toBeUndefined();
  });

  it('вытесняет давно неиспользованную запись', () => {
    const { cache } = setup();
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.get('a');
    cache.set('d', 4);
    expect(cache.peek('b')).toBeUndefined();
    expect(cache.peek('a')).toBe(1);
    expect(cache.size()).toBe(3);
  });

  it('peek не меняет порядок вытеснения', () => {
    const { cache } = setup();
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.peek('a');
    cache.set('d', 4);
    expect(cache.peek('a')).toBeUndefined();
  });

  it('перезапись обновляет значение и время', () => {
    const { cache, advance } = setup();
    cache.set('a', 1);
    advance(900);
    cache.set('a', 2);
    advance(900);
    expect(cache.get('a')).toBe(2);
    expect(cache.size()).toBe(1);
  });
});
