import { db } from '../../lib/firebase';
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { Customer, Contact } from '../../types/lead';

const CUSTOMERS_COLLECTION = 'customers';
const CONTACTS_COLLECTION = 'contacts';

// Function to generate the next customer ID
const generateNextCustomerId = async (): Promise<string> => {
  try {
    // Get the latest customer ordered by customerId in descending order
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy('customerId', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // If no customers exist, start with CRM0001
      return 'CRM0001';
    }
    
    // Get the latest customer ID
    const latestCustomer = snapshot.docs[0].data() as Customer;
    const latestId = latestCustomer.customerId;
    
    // Extract the number and increment it
    const currentNumber = parseInt(latestId.replace('CRM', ''));
    const nextNumber = currentNumber + 1;
    
    // Format the new ID with leading zeros
    return `CRM${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating customer ID:', error);
    throw error;
  }
};

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'customerId'>): Promise<Customer> => {
  try {
    const customerId = await generateNextCustomerId();
    const timestamp = new Date().toISOString();

    const newCustomer = {
      ...customerData,
      customerId,
      createdAt: timestamp,
      updatedAt: timestamp,
      name: customerData.name.trim(),
      companyName: customerData.companyName?.trim() || '',
      designation: customerData.designation?.trim() || 'N/A'
    };

    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), newCustomer);
    return {
      id: docRef.id,
      ...newCustomer
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    const timestamp = new Date().toISOString();

    const updateData = {
      ...customerData,
      updatedAt: timestamp,
      name: customerData.name?.trim(),
      companyName: customerData.companyName?.trim(),
      designation: customerData.designation?.trim()
    };

    await updateDoc(customerRef, updateData);

    // Update related deals with new customer information
    const dealsQuery = query(collection(db, 'deals'), where('customerId', '==', id));
    const dealsSnapshot = await getDocs(dealsQuery);
    
    const dealUpdates = dealsSnapshot.docs.map(dealDoc => {
      const dealRef = doc(db, 'deals', dealDoc.id);
      return updateDoc(dealRef, {
        customer: {
          name: customerData.name?.trim() || dealDoc.data().customer.name,
          email: customerData.email || dealDoc.data().customer.email,
          phone: customerData.phone || dealDoc.data().customer.phone,
          company: customerData.companyName?.trim() || dealDoc.data().customer.company,
          address: customerData.address || dealDoc.data().customer.address,
          designation: customerData.designation?.trim() || dealDoc.data().customer.designation || 'N/A'
        },
        updatedAt: timestamp
      });
    });

    await Promise.all(dealUpdates);

    // Update related quotations with new customer information
    const quotationsQuery = query(collection(db, 'quotations'), where('customerId', '==', id));
    const quotationsSnapshot = await getDocs(quotationsQuery);
    
    const quotationUpdates = quotationsSnapshot.docs.map(quotationDoc => {
      const quotationRef = doc(db, 'quotations', quotationDoc.id);
      return updateDoc(quotationRef, {
        customerContact: {
          name: customerData.name?.trim() || quotationDoc.data().customerContact.name,
          email: customerData.email || quotationDoc.data().customerContact.email,
          phone: customerData.phone || quotationDoc.data().customerContact.phone,
          company: customerData.companyName?.trim() || quotationDoc.data().customerContact.company,
          address: customerData.address || quotationDoc.data().customerContact.address,
          designation: customerData.designation?.trim() || quotationDoc.data().customerContact.designation || 'N/A'
        },
        updatedAt: timestamp
      });
    });

    await Promise.all(quotationUpdates);

    const updatedDoc = await getDoc(customerRef);
    if (!updatedDoc.exists()) {
      throw new Error('Customer not found');
    }

    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

export const getContactsByCustomer = async (customerId: string): Promise<Contact[]> => {
  try {
    const contactsQuery = query(
      collection(db, CONTACTS_COLLECTION),
      where('customerId', '==', customerId)
    );
    
    const querySnapshot = await getDocs(contactsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Contact[];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

export const createContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
  try {
    const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), {
      ...contactData,
      createdAt: new Date().toISOString()
    });
    
    return {
      id: docRef.id,
      ...contactData
    };
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

export const updateContact = async (
  contactId: string,
  contactData: Partial<Contact>
): Promise<Contact> => {
  try {
    const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
    await updateDoc(contactRef, {
      ...contactData,
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: contactId,
      ...contactData
    } as Contact;
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

export const deleteContact = async (contactId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, CONTACTS_COLLECTION, contactId));
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};