import { describe, expect, it } from 'vitest';
import { caretAfterDigits, formatPriceInput } from './formatPrice.js';

const NBSP = ' ';

describe('formatPriceInput', () => {
  it.each([
    ['', ''],
    ['5', '5'],
    ['500', '500'],
    ['5000', `5${NBSP}000`],
    ['500000', `500${NBSP}000`],
    ['1234567', `1${NBSP}234${NBSP}567`],
  ])('группирует разряды %j → %j', (input, expected) => {
    expect(formatPriceInput(input)).toBe(expected);
  });

  it('убирает всё, кроме цифр', () => {
    expect(formatPriceInput('-1a2 3.4,5')).toBe(`12${NBSP}345`);
  });

  it('перегруппировывает уже отформатированное значение', () => {
    expect(formatPriceInput(`50${NBSP}0001`)).toBe(`500${NBSP}001`);
  });

  it('убирает ведущие нули, но оставляет ноль', () => {
    expect(formatPriceInput('000')).toBe('0');
    expect(formatPriceInput('0050')).toBe('50');
  });
});

describe('caretAfterDigits', () => {
  const text = `1${NBSP}234${NBSP}567`;

  it('ставит курсор после n-й цифры с учётом разделителей', () => {
    expect(caretAfterDigits(text, 0)).toBe(0);
    expect(caretAfterDigits(text, 1)).toBe(1);
    expect(caretAfterDigits(text, 2)).toBe(3);
    expect(caretAfterDigits(text, 4)).toBe(5);
  });

  it('не выходит за конец строки', () => {
    expect(caretAfterDigits(text, 99)).toBe(text.length);
  });
});
