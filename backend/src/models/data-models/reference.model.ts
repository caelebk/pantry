// Key Reference Tables
export interface Location {
  id: number;
  name: string;
}

export interface Unit {
  id: number;
  name: string;
  type?: string; // 'volume' | 'weight' | 'count'
  toBaseFactor?: number;
}