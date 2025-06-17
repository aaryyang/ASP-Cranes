import { OrderType, BaseRates } from './equipment';

export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  designation?: string;
}

export type SundayWorking = 'yes' | 'no';

export interface QuotationInputs {
  machineType: string;
  selectedEquipment: {
    id: string;
    equipmentId: string;
    name: string;
    baseRates: BaseRates;
  };
  selectedMachines?: SelectedMachine[];
  orderType: OrderType;
  numberOfDays: number;
  workingHours: number;
  foodResources: number;
  accomResources: number;
  siteDistance: number;
  usage: 'normal' | 'heavy';
  riskFactor: 'low' | 'medium' | 'high';
  extraCharge: number;
  incidentalCharges: string[];  otherFactorsCharge: number;
  billing: 'gst' | 'non_gst';
  includeGst: boolean;
  shift: 'single' | 'double';
  dayNight: 'day' | 'night';
  mobDemob: number;
  mobRelaxation: number;
  runningCostPerKm: number;
  dealType: string;
  sundayWorking: SundayWorking;
  otherFactors: string[];
}

export interface SelectedMachine {
  id: string;
  machineType: string;
  equipmentId: string;
  name: string;
  baseRates: BaseRates;
  baseRate: number;
  runningCostPerKm: number;
  quantity: number;
}

export interface Quotation extends QuotationInputs {
  id: string;
  leadId: string;
  customerId: string;
  customerName: string;
  customerContact: CustomerContact;
  selectedMachines?: SelectedMachine[];
  totalRent: number;
  workingCost?: number;
  mobDemobCost?: number;
  foodAccomCost?: number;
  usageLoadFactor?: number;
  extraCharges?: number;
  riskAdjustment?: number;
  gstAmount?: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}