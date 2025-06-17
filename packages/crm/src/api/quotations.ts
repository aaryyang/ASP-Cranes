import { Request, Response } from 'express';
import { getFirestore } from 'firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';

const db = getFirestore();

export async function handleQuotationSubmission(req: Request, res: Response) {
  try {
    const quotationData = req.body;

    if (!quotationData) {
      return res.status(400).json({ error: 'Quotation data is required' });
    }

    // Validate required fields
    const requiredFields = ['leadId', 'equipmentDetails', 'totalPrice'];
    for (const field of requiredFields) {
      if (!quotationData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Add timestamp if not provided
    if (!quotationData.createdAt) {
      quotationData.createdAt = new Date();
    }

    // Set status to draft if not provided
    if (!quotationData.status) {
      quotationData.status = 'draft';
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'quotations'), quotationData);

    return res.status(201).json({ 
      success: true,
      message: 'Quotation created successfully',
      id: docRef.id 
    });
  } catch (error) {
    console.error('Error in quotation submission:', error);
    return res.status(500).json({ error: 'Failed to create quotation' });
  }
}
