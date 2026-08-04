import { Item, ItemDTO } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit, UnitType } from '@models/unit.model';
import { mapItemDTOToItem, mapItemToItemDTO, mapItemToUpdateItemDTO } from './ItemMapper';

describe('ItemMapper', () => {
  const mockUnit: Unit = {
    id: 1,
    name: 'Liters',
    shortName: 'L',
    type: UnitType.Volume,
    toBaseFactor: 1,
  };

  const mockLocation: Location = {
    id: 1,
    name: 'Fridge',
  };

  const unitMap = new Map<number, Unit>([[1, mockUnit]]);
  const locationMap = new Map<number, Location>([[1, mockLocation]]);

  const mockItemDTO: ItemDTO = {
    id: 'item-uuid-1',
    label: 'Organic Whole Milk',
    quantity: 2,
    unitId: 1,
    locationId: 1,
    purchaseDate: '2026-08-01T00:00:00.000Z',
    openedDate: '2026-08-02T00:00:00.000Z',
    expirationDate: '2026-08-15T00:00:00.000Z',
    notes: 'Keep cold',
  };

  describe('mapItemDTOToItem', () => {
    it('should map full ItemDTO to Item domain object', () => {
      const item = mapItemDTOToItem(mockItemDTO, unitMap, locationMap);

      expect(item.id).toBe('item-uuid-1');
      expect(item.name).toBe('Organic Whole Milk');
      expect(item.quantity).toBe(2);
      expect(item.unit).toEqual(mockUnit);
      expect(item.location).toEqual(mockLocation);
      expect(item.purchaseDate).toEqual(new Date('2026-08-01T00:00:00.000Z'));
      expect(item.openedDate).toEqual(new Date('2026-08-02T00:00:00.000Z'));
      expect(item.expirationDate).toEqual(new Date('2026-08-15T00:00:00.000Z'));
      expect(item.notes).toBe('Keep cold');
    });

    it('should handle null / undefined expirationDate and openedDate in DTO', () => {
      const dtoNoExp: ItemDTO = {
        ...mockItemDTO,
        expirationDate: null,
        openedDate: undefined,
        notes: undefined,
      };

      const item = mapItemDTOToItem(dtoNoExp, unitMap, locationMap);
      expect(item.expirationDate).toBeUndefined();
      expect(item.openedDate).toBeUndefined();
      expect(item.notes).toBe('');
    });

    it('should throw an error if unit or location is missing from map', () => {
      const emptyUnitMap = new Map<number, Unit>();
      expect(() => mapItemDTOToItem(mockItemDTO, emptyUnitMap, locationMap)).toThrowError(
        /Unit with ID 1 not found/,
      );

      const emptyLocMap = new Map<number, Location>();
      expect(() => mapItemDTOToItem(mockItemDTO, unitMap, emptyLocMap)).toThrowError(
        /Location with ID 1 not found/,
      );
    });
  });

  describe('mapItemToItemDTO', () => {
    it('should map Item to ItemDTO', () => {
      const item = mapItemDTOToItem(mockItemDTO, unitMap, locationMap);
      const dto = mapItemToItemDTO(item);

      expect(dto.id).toBe('item-uuid-1');
      expect(dto.label).toBe('Organic Whole Milk');
      expect(dto.quantity).toBe(2);
      expect(dto.unitId).toBe(1);
      expect(dto.locationId).toBe(1);
      expect(dto.expirationDate).toBe('2026-08-15T00:00:00.000Z');
    });

    it('should set expirationDate to null when item has no expirationDate', () => {
      const item: Item = {
        id: 'item-uuid-2',
        name: 'Salt',
        quantity: 0,
        unit: mockUnit,
        location: mockLocation,
        purchaseDate: new Date('2026-08-01'),
        expirationDate: undefined,
        notes: '',
      };

      const dto = mapItemToItemDTO(item);
      expect(dto.expirationDate).toBeNull();
    });
  });

  describe('mapItemToUpdateItemDTO', () => {
    it('should map Item to UpdateItemDTO with null expirationDate when undefined', () => {
      const item: Item = {
        id: 'item-uuid-3',
        name: 'Pepper',
        quantity: 0,
        unit: mockUnit,
        location: mockLocation,
        purchaseDate: new Date('2026-08-01'),
        expirationDate: undefined,
        notes: '',
      };

      const updateDTO = mapItemToUpdateItemDTO(item);
      expect(updateDTO.quantity).toBe(0);
      expect(updateDTO.expirationDate).toBeNull();
      expect(updateDTO.notes).toBeUndefined();
    });
  });
});
