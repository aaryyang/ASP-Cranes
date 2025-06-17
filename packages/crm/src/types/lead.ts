export type LeadStatus = 'new' | 'in_process' | 'qualified' | 'unqualified' | 'lost' | 'converted';

type DealStatus = 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Customer {
  id: string;
  customerId: string;  // Unique business identifier
  name: string;        // Customer Name
  companyName: string; // Company Name
  email: string;
  phone: string;
  address: string;
  designation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Deal {
  id: string;
  leadId: string;
  customerId: string;
  contactId: string;
  status: DealStatus;
  value: number;
  expectedCloseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  customerId?: string;
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  siteLocation: string;
  startDate: string;
  rentalDays: number;
  shiftTiming: string;
  status: LeadStatus;
  assignedTo: string;  // ID of the sales agent
  assignedToName?: string;  // Name of the sales agent
  designation?: string;  // Customer's designation
  createdAt: string;
  updatedAt: string;
  files?: string[];
  notes?: string;
}