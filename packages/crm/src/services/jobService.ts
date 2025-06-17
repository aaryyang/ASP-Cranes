import { Job, JobStatus, Equipment, Operator } from '../types/job';
import { getLeadById } from './leadService';

// Mock Equipment data
const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: '1',
    name: 'Tower Crane TC-50',
    type: 'Tower Crane',
    description: '50m height, 5 ton capacity',
    baseRate: 5000,
  },
  {
    id: '2',
    name: 'Mobile Crane MC-30',
    type: 'Mobile Crane',
    description: '30 ton capacity, extends to 40m',
    baseRate: 3500,
  },
  {
    id: '3',
    name: 'Crawler Crane CC-100',
    type: 'Crawler Crane',
    description: '100 ton capacity, heavy duty',
    baseRate: 8000,
  },
  {
    id: '4',
    name: 'Tower Crane TC-80',
    type: 'Tower Crane',
    description: '80m height, 8 ton capacity',
    baseRate: 7500,
  },
  {
    id: '5',
    name: 'Mobile Crane MC-50',
    type: 'Mobile Crane',
    description: '50 ton capacity, extends to 60m',
    baseRate: 5000,
  },
];

// Mock Operator data
const MOCK_OPERATORS: Operator[] = [
  {
    id: '1',
    name: 'Mike Operator',
    email: 'mike@aspcranes.com',
    phone: '555-123-4567',
    specialization: 'Tower Crane',
  },
  {
    id: '2',
    name: 'Lisa Crane',
    email: 'lisa@aspcranes.com',
    phone: '555-987-6543',
    specialization: 'Mobile Crane',
  },
  {
    id: '3',
    name: 'Tom Heavy',
    email: 'tom@aspcranes.com',
    phone: '555-456-7890',
    specialization: 'Crawler Crane',
  },
  {
    id: '4',
    name: 'Sarah Heights',
    email: 'sarah@aspcranes.com',
    phone: '555-789-0123',
    specialization: 'Tower Crane',
  },
  {
    id: '5',
    name: 'Dave Mobile',
    email: 'dave@aspcranes.com',
    phone: '555-234-5678',
    specialization: 'Mobile Crane',
  },
];

// Mock Job data
const MOCK_JOBS: Job[] = [
  {
    id: '1',
    leadId: '3', // Skyrise Developers
    customerName: 'Skyrise Developers',
    equipmentId: '4', // Tower Crane TC-80
    operatorId: '4', // Sarah Heights
    startDate: '2023-11-01T08:00:00Z',
    endDate: '2024-01-30T17:00:00Z',
    location: '789 Highrise Blvd, Miami',
    status: 'scheduled',
    notes: 'Long-term project, will need regular maintenance checks.',
    createdAt: '2023-09-25T14:30:00Z',
    updatedAt: '2023-09-25T14:30:00Z',
  },
];

// Get all jobs
export const getJobs = async (): Promise<Job[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_JOBS];
};

// Get job by ID
export const getJobById = async (id: string): Promise<Job | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const job = MOCK_JOBS.find(j => j.id === id);
  return job ? { ...job } : null;
};

// Get jobs for an operator
export const getJobsByOperator = async (operatorId: string): Promise<Job[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_JOBS.filter(j => j.operatorId === operatorId).map(job => ({ ...job }));
};

// Create job
export const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // If no customer name is provided, get it from the lead
  let customerName = jobData.customerName;
  if (!customerName && jobData.leadId) {
    const lead = await getLeadById(jobData.leadId);
    customerName = lead?.customerName || 'Unknown Customer';
  }
  
  // If this job is associated with a deal, log it
  if (jobData.dealId) {
    console.log(`Creating job from deal: ${jobData.dealId}`);
  }
  
  const newJob: Job = {
    ...jobData,
    customerName,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dealId: jobData.dealId // Make sure dealId is passed through
  };
  
  MOCK_JOBS.push(newJob);
  return { ...newJob };
};

// Update job
const updateJob = async (id: string, updates: Partial<Job>): Promise<Job | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const index = MOCK_JOBS.findIndex(j => j.id === id);
  if (index === -1) return null;
  
  MOCK_JOBS[index] = {
    ...MOCK_JOBS[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return { ...MOCK_JOBS[index] };
};

// Update job status
export const updateJobStatus = async (id: string, status: JobStatus): Promise<Job | null> => {
  return updateJob(id, { status });
};

// Get equipment by ID
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  const equipment = MOCK_EQUIPMENT.find(e => e.id === id);
  return equipment ? { ...equipment } : null;
};

// Get operator by ID
export const getOperatorById = async (id: string): Promise<Operator | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  const operator = MOCK_OPERATORS.find(o => o.id === id);
  return operator ? { ...operator } : null;
};

// Get all equipment
export const getAllEquipment = async (): Promise<Equipment[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_EQUIPMENT];
};

// Get all operators
export const getAllOperators = async (): Promise<Operator[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_OPERATORS];
};