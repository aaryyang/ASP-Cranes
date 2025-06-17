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
import { Lead, LeadStatus } from '../types/lead';
import { leadsCollection } from './firestore/collections';

export const getLeads = async (): Promise<Lead[]> => {
  try {
    const snapshot = await getDocs(leadsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate().toISOString(),
      updatedAt: (doc.data().updatedAt as Timestamp).toDate().toISOString(),
    } as Lead));
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

export const getLeadById = async (id: string): Promise<Lead | null> => {
  try {
    const leadRef = doc(db, 'leads', id);
    const docSnap = await getDoc(leadRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...(data as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>),
      createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
      updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
    } as Lead;
  } catch (error) {
    console.error('Error fetching lead:', error);
    throw error;
  }
};

const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  try {
    const docRef = await addDoc(leadsCollection, {
      ...lead,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ...lead,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  try {
    const leadRef = doc(db, 'leads', id);
    await updateDoc(leadRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    const docSnap = await getDoc(leadRef);
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...(data as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>),
      createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
      updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
    } as Lead;
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};