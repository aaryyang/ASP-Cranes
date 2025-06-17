import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Deal, DealStage } from '../types/deal';
import { dealsCollection } from './firestore/collections';

const convertTimestampToISOString = (timestamp: Timestamp | string | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  return timestamp.toDate().toISOString();
};

export const getDeals = async (): Promise<Deal[]> => {
  try {
    console.log('Fetching deals from Firestore...');
    const snapshot = await getDocs(dealsCollection);
    console.log('Raw deals data:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    const deals = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestampToISOString(data.createdAt as Timestamp),
        updatedAt: convertTimestampToISOString(data.updatedAt as Timestamp),
        expectedCloseDate: convertTimestampToISOString(data.expectedCloseDate as Timestamp),
        // Ensure required fields have default values
        value: data.value || 0,
        probability: data.probability || 0,
        stage: data.stage || 'qualification',
        customer: {
          name: data.customer?.name || 'Unknown',
          email: data.customer?.email || '',
          phone: data.customer?.phone || '',
          company: data.customer?.company || '',
          address: data.customer?.address || '',
          designation: data.customer?.designation || ''
        }
      } as Deal;
    });
    
    console.log('Processed deals:', deals);
    return deals;
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
};

export const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
  try {
    const docRef = await addDoc(dealsCollection, {
      ...dealData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expectedCloseDate: Timestamp.fromDate(new Date(dealData.expectedCloseDate))
    });

    return {
      ...dealData,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};

export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  try {
    const dealRef = doc(dealsCollection, id);
    await updateDoc(dealRef, {
      stage,
      updatedAt: serverTimestamp(),
    });

    const docSnap = await getDoc(dealRef);
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestampToISOString(data.createdAt as Timestamp),
      updatedAt: convertTimestampToISOString(data.updatedAt as Timestamp),
      expectedCloseDate: convertTimestampToISOString(data.expectedCloseDate as Timestamp),
    } as Deal;
  } catch (error) {
    console.error('Error updating deal stage:', error);
    throw error;
  }
};

export const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    const dealRef = doc(dealsCollection, id);
    const docSnap = await getDoc(dealRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestampToISOString(data.createdAt as Timestamp),
      updatedAt: convertTimestampToISOString(data.updatedAt as Timestamp),
      expectedCloseDate: convertTimestampToISOString(data.expectedCloseDate as Timestamp),
    } as Deal;
  } catch (error) {
    console.error('Error fetching deal:', error);
    throw error;
  }
};