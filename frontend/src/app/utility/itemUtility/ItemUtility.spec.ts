import { Item } from '@models/items.model';
import { UnitType } from '@models/unit.model';
import {
  getItemTimeStatus,
  isExpired,
  isExpiringSoon,
  isOutOfStock,
  sortItemsByExpirationDate,
} from './ItemUtility';

describe('ItemUtility', () => {
  const createMockItem = (quantity: number, daysFromNow: number): Item => {
    const now = new Date();
    const exp = new Date();
    exp.setDate(now.getDate() + daysFromNow);
    const purchase = new Date();
    purchase.setDate(now.getDate() - 10);

    return {
      id: 'item-uuid-1',
      name: 'Test Item',
      quantity,
      unit: { id: 1, name: 'Pcs', shortName: 'pcs', type: UnitType.Count, toBaseFactor: 1 },
      purchaseDate: purchase,
      expirationDate: exp,
      location: { id: 1, name: 'Pantry' },
      notes: '',
    };
  };

  describe('isOutOfStock', () => {
    it('should return true when quantity is 0 or negative', () => {
      expect(isOutOfStock(createMockItem(0, 5))).toBeTrue();
      expect(isOutOfStock(createMockItem(-1, 5))).toBeTrue();
    });

    it('should return false when quantity is greater than 0', () => {
      expect(isOutOfStock(createMockItem(1, 5))).toBeFalse();
      expect(isOutOfStock(createMockItem(10, 5))).toBeFalse();
    });
  });

  describe('isExpired', () => {
    it('should return true if expiration date is in the past', () => {
      expect(isExpired(createMockItem(2, -1))).toBeTrue();
    });

    it('should return false if expiration date is in the future', () => {
      expect(isExpired(createMockItem(2, 5))).toBeFalse();
    });

    it('should return false if expiration date is undefined or out of stock', () => {
      const itemNoExp = createMockItem(2, 5);
      itemNoExp.expirationDate = undefined;
      expect(isExpired(itemNoExp)).toBeFalse();

      const itemOutOfStock = createMockItem(0, -5);
      expect(isExpired(itemOutOfStock)).toBeFalse();
    });
  });

  describe('isExpiringSoon', () => {
    it('should return true if expiring within 14 days and not already expired', () => {
      expect(isExpiringSoon(createMockItem(2, 5))).toBeTrue();
    });

    it('should return false if expiring outside threshold days', () => {
      expect(isExpiringSoon(createMockItem(2, 30))).toBeFalse();
    });

    it('should return false if already expired', () => {
      expect(isExpiringSoon(createMockItem(2, -2))).toBeFalse();
    });

    it('should return false if expiration date is undefined or out of stock', () => {
      const itemNoExp = createMockItem(2, 5);
      itemNoExp.expirationDate = undefined;
      expect(isExpiringSoon(itemNoExp)).toBeFalse();

      const itemOutOfStock = createMockItem(0, 5);
      expect(isExpiringSoon(itemOutOfStock)).toBeFalse();
    });
  });

  describe('sortItemsByExpirationDate', () => {
    it('should sort items in ascending order of expiration date with no-expiration items at the end', () => {
      const itemFar = createMockItem(1, 20);
      const itemNear = createMockItem(1, 2);
      const itemExpired = createMockItem(1, -5);
      const itemNoExp = createMockItem(1, 5);
      itemNoExp.expirationDate = undefined;

      const sorted = sortItemsByExpirationDate([itemNoExp, itemFar, itemNear, itemExpired]);
      expect(sorted[0]).toBe(itemExpired);
      expect(sorted[1]).toBe(itemNear);
      expect(sorted[2]).toBe(itemFar);
      expect(sorted[3]).toBe(itemNoExp);
    });
  });

  describe('getItemTimeStatus', () => {
    it('should return status object with label and flags', () => {
      const item = createMockItem(1, 3);
      const status = getItemTimeStatus(item);
      expect(status.isExpired).toBeFalse();
      expect(status.isClose).toBeTrue();
      expect(status.label).toContain('day');
    });

    it('should return No Expiration status when expirationDate is undefined', () => {
      const item = createMockItem(1, 3);
      item.expirationDate = undefined;
      const status = getItemTimeStatus(item);
      expect(status.isExpired).toBeFalse();
      expect(status.isClose).toBeFalse();
      expect(status.label).toBe('No Expiration');
    });
  });
});
