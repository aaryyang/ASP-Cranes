import { 
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Equipment, CraneCategory } from '../../types/equipment';
import { equipmentCollection } from './collections';

// Function to generate the next equipment ID
const generateNextEquipmentId = async (): Promise<string> => {
  try {
    // Get the latest equipment ordered by equipmentId in descending order
    const q = query(
      equipmentCollection,
      orderBy('equipmentId', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // If no equipment exists, start with EQ0001
      return 'EQ0001';
    }
    
    // Get the latest equipment ID
    const latestEquipment = snapshot.docs[0].data() as Equipment;
    const latestId = latestEquipment.equipmentId;
    
    // Extract the number and increment it
    const currentNumber = parseInt(latestId.replace('EQ', ''));
    const nextNumber = currentNumber + 1;
    
    // Format the new ID with leading zeros
    return `EQ${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating equipment ID:', error);
    throw error;
  }
};

export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    const snapshot = await getDocs(equipmentCollection);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        // Ensure baseRates has all required fields
        baseRates: {
          micro: data.baseRates?.micro || 0,
          small: data.baseRates?.small || 0,
          monthly: data.baseRates?.monthly || 0,
          yearly: data.baseRates?.yearly || 0,
        }
      } as Equipment;
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
};

export const createEquipment = async (equipment: Omit<Equipment, 'id' | 'equipmentId' | 'createdAt' | 'updatedAt'>): Promise<Equipment> => {
  try {
    // Generate the next equipment ID
    const equipmentId = await generateNextEquipmentId();
    
    // Ensure baseRates has all required fields
    const baseRates = {
      micro: equipment.baseRates.micro || 0,
      small: equipment.baseRates.small || 0,
      monthly: equipment.baseRates.monthly || 0,
      yearly: equipment.baseRates.yearly || 0,
    };

    const docRef = await addDoc(equipmentCollection, {
      ...equipment,
      baseRates,
      equipmentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ...equipment,
      baseRates,
      id: docRef.id,
      equipmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw error;
  }
};

export const updateEquipment = async (id: string, updates: Partial<Equipment>): Promise<Equipment> => {
  try {
    const equipmentRef = doc(db, 'equipment', id);
    
    // First get the current data
    const docSnap = await getDoc(equipmentRef);
    if (!docSnap.exists()) {
      throw new Error('Equipment not found');
    }

    // Don't allow updating the equipmentId
    const { equipmentId, ...updatesWithoutId } = updates;

    // Ensure baseRates has all required fields if it's being updated
    const baseRates = updates.baseRates ? {
      micro: updates.baseRates.micro || 0,
      small: updates.baseRates.small || 0,
      monthly: updates.baseRates.monthly || 0,
      yearly: updates.baseRates.yearly || 0,
    } : undefined;

    // Perform the update
    await updateDoc(equipmentRef, {
      ...updatesWithoutId,
      ...(baseRates && { baseRates }),
      updatedAt: serverTimestamp(),
    });

    // Get the updated data
    const updatedSnap = await getDoc(equipmentRef);
    const data = updatedSnap.data();
    if (!data) {
      throw new Error('Updated equipment data not found');
    }

    return {
      id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(), // Use current time since serverTimestamp hasn't propagated yet
      baseRates: {
        micro: data.baseRates?.micro || 0,
        small: data.baseRates?.small || 0,
        monthly: data.baseRates?.monthly || 0,
        yearly: data.baseRates?.yearly || 0,
      }
    } as Equipment;
  } catch (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
};

export const getEquipmentByCategory = async (category: CraneCategory): Promise<Equipment[]> => {
  try {
    const q = query(equipmentCollection, where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
        baseRates: {
          micro: data.baseRates?.micro || 0,
          small: data.baseRates?.small || 0,
          monthly: data.baseRates?.monthly || 0,
          yearly: data.baseRates?.yearly || 0,
        }
      } as Equipment;
    });
  } catch (error) {
    console.error('Error fetching equipment by category:', error);
    throw error;
  }
};

// Add a function to get equipment by equipmentId
export const getEquipmentByEquipmentId = async (equipmentId: string): Promise<Equipment | null> => {
  try {
    const q = query(equipmentCollection, where('equipmentId', '==', equipmentId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
      baseRates: {
        micro: data.baseRates?.micro || 0,
        small: data.baseRates?.small || 0,
        monthly: data.baseRates?.monthly || 0,
        yearly: data.baseRates?.yearly || 0,
      }
    } as Equipment;
  } catch (error) {
    console.error('Error fetching equipment by equipmentId:', error);
    throw error;
  }
};

export const deleteEquipment = async (id: string): Promise<void> => {
  try {
    const equipmentRef = doc(db, 'equipment', id);
    await deleteDoc(equipmentRef);
  } catch (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
};