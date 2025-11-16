import { describe, it, expect } from 'vitest';
import { cn } from '../../utils';

/**
 * Testy jednostkowe dla funkcji pomocniczej cn (classnames)
 * Przykład testowania czystych funkcji
 */
describe('cn (classnames utility)', () => {
  it('powinien łączyć klasy CSS', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('powinien obsługiwać warunkowe klasy', () => {
    const condition = true;
    const result = cn('base', condition && 'conditional');
    expect(result).toBe('base conditional');
  });

  it('powinien ignorować falsy wartości', () => {
    const result = cn('base', false, null, undefined, 0, '');
    expect(result).toBe('base');
  });

  it('powinien obsługiwać obiekty z klasami', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    });
    expect(result).toContain('class1');
    expect(result).toContain('class3');
    expect(result).not.toContain('class2');
  });

  it('powinien łączyć klasy Tailwind z duplikatami', () => {
    // tailwind-merge powinien usunąć konflikty
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
    expect(result).toContain('py-1');
  });

  it('powinien zwracać pusty string dla braku argumentów', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('powinien obsługiwać tablice klas', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });
});

