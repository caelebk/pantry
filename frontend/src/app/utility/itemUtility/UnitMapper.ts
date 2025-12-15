import { Unit, UnitDTO, UnitType } from '@models/unit.model';

export function mapUnitDTOToUnit(dto: UnitDTO): Unit {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type as UnitType,
    toBaseFactor: dto.toBaseFactor,
  };
}
