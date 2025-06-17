export type JobStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  description: string;
  baseRate: number;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
}

export interface Job {
  id: string;
  leadId: string;
  customerName: string;
  equipmentId: string;
  operatorId: string;
  customerId?: string;
  status: JobStatus;
  startDate: string;
  endDate: string;
  location: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  dealId?: string; // Reference to the deal that generated this job
}