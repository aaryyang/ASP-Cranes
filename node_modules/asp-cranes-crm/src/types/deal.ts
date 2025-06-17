export type DealStage = 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  leadId: string;
  customerId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    designation?: string;
  };
  title: string;
  description: string;
  value: number;
  stage: DealStage;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo: string;
  probability: number;
  expectedCloseDate: string;
  notes?: string;
}