import { collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const usersCollection = collection(db, 'users');
export const leadsCollection = collection(db, 'leads');
export const dealsCollection = collection(db, 'deals');
export const customersCollection = collection(db, 'customers');
export const quotationsCollection = collection(db, 'quotations');
export const jobsCollection = collection(db, 'jobs');
export const equipmentCollection = collection(db, 'equipment');
export const operatorsCollection = collection(db, 'operators');