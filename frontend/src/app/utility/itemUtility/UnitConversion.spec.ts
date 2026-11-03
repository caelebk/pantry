import { Unit, UnitType } from '@models/unit.model';
import { convertQuantity } from './UnitConversion';

describe('UnitConversion', () => {
  const kg: Unit = {
    id: 1,
    name: 'Kg',
    shortName: 'kg',
    type: UnitType.Weight,
    toBaseFactor: 1000,
  };
  const g: Unit = { id: 2, name: 'Gram', shortName: 'g', type: UnitType.Weight, toBaseFactor: 1 };
  const ml: Unit = { id: 3, name: 'Ml', shortName: 'ml', type: UnitType.Volume, toBaseFactor: 1 };
  const pc: Unit = { id: 4, name: 'Piece', shortName: 'pc', type: UnitType.Count, toBaseFactor: 1 };
  const box: Unit = {
    id: 5,
    name: 'Box',
    shortName: 'box',
    type: UnitType.Count,
    toBaseFactor: 12,
  };

  it('converts between units of the same type', () => {
    expect(convertQuantity(2, kg, g)).toBe(2000);
    expect(convertQuantity(500, g, kg)).toBe(0.5);
  });

  it('returns the quantity unchanged for the same unit', () => {
    expect(convertQuantity(6, pc, pc)).toBe(6);
  });

  it('returns null for different unit types', () => {
    expect(convertQuantity(6, pc, g)).toBeNull();
    expect(convertQuantity(1, ml, g)).toBeNull();
  });

  it('returns null between different Count units', () => {
    expect(convertQuantity(1, box, pc)).toBeNull();
  });

  it('returns null when a unit is missing or has no base factor', () => {
    expect(convertQuantity(1, undefined, g)).toBeNull();
    expect(convertQuantity(1, kg, null)).toBeNull();
    expect(convertQuantity(1, kg, { ...g, toBaseFactor: 0 })).toBeNull();
  });
});
