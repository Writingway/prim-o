import { describe, it, expect } from 'vitest';
import { safeText } from '../../src/lib/validation';

describe('safeText', () => {
  const schema = safeText(1);

  it('strippe les tags HTML (anti-XSS)', () => {
    expect(schema.parse('<script>alert(1)</script>hello')).toBe('hello');
    expect(schema.parse('<b>Doc</b> Test')).toBe('Doc Test');
  });

  it('trim les espaces', () => {
    expect(schema.parse('  Prim-O  ')).toBe('Prim-O');
  });

  it('refuse une chaîne vide après sanitize (min length)', () => {
    expect(schema.safeParse('<img src=x onerror=alert(1)>').success).toBe(false);
    expect(schema.safeParse('   ').success).toBe(false);
  });
});
