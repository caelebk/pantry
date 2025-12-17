export interface UnitDTO {
  id: number;
  name: string;
  shortName: string;
  type: string;
  toBaseFactor: number;
}

export interface Unit {
  id: number;
  name: string;
  shortName: string;
  type: UnitType;
  toBaseFactor: number;
}

export enum UnitType {
  Weight = 'Weight',
  Volume = 'Volume',
  Count = 'Count',
}
