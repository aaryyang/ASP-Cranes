export type CraneCategory = 'mobile_crane' | 'tower_crane' | 'crawler_crane' | 'pick_and_carry_crane';

export type OrderType = 'micro' | 'small' | 'monthly' | 'yearly';

export interface BaseRates {
  micro: number;
  small: number;
  monthly: number;
  yearly: number;
}

export interface Equipment {
  id: string;
  equipmentId: string; // Format: EQ0001, EQ0002, etc.
  name: string;
  category: CraneCategory;
  manufacturingDate: string; // YYYY-MM format
  registrationDate: string; // YYYY-MM format
  maxLiftingCapacity: number; // in tons
  unladenWeight: number; // in tons
  baseRates: BaseRates; // rates per hour for different order types
  runningCostPerKm: number;
  description?: string;
  status: 'available' | 'in_use' | 'maintenance';
  createdAt: string;
  updatedAt: string;
  runningCost: number;
}