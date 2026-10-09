import { describe, expect, it } from 'vitest';
import { recipeTotalTime, sumKnownMetadata } from './recipe-metadata';

describe('recipe metadata', () => {
  it('only reports a total when both time components are known', () => {
    expect(recipeTotalTime({})).toBeUndefined();
    expect(recipeTotalTime({ prepTime: 10 })).toBeUndefined();
    expect(recipeTotalTime({ cookTime: 20 })).toBeUndefined();
    expect(recipeTotalTime({ prepTime: 0, cookTime: 20 })).toBe(20);
    expect(recipeTotalTime({ prepTime: 0, cookTime: 0 })).toBe(0);
  });
  it('withholds incomplete totals instead of treating missing values as zero', () => {
    expect(sumKnownMetadata([])).toBeUndefined();
    expect(sumKnownMetadata([100, undefined])).toBeUndefined();
    expect(sumKnownMetadata([100, null])).toBeUndefined();
    expect(sumKnownMetadata([0, 0])).toBe(0);
    expect(sumKnownMetadata([100, 200])).toBe(300);
  });
});
