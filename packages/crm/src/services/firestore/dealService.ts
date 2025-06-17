import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Deal } from '../../types/deal';

export const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const dealsCollection = collection(db, 'deals');
    
    const dealWithTimestamps = {
      ...dealData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(dealsCollection, dealWithTimestamps);
    
    return {
      id: docRef.id,
      ...dealData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};