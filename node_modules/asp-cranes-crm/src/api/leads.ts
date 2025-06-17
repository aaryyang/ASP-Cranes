import { Request, Response } from 'express';
import { getFirestore } from 'firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';

const db = getFirestore();

export async function handleLeadSubmission(req: Request, res: Response) {
  try {
    const leadData = req.body;

    if (!leadData) {
      return res.status(400).json({ error: 'Lead data is required' });
    }

    // Validate required fields
    const requiredFields = ['customerName', 'equipmentNeeded', 'contactInfo'];
    for (const field of requiredFields) {
      if (!leadData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Add timestamp if not provided
    if (!leadData.timestamp) {
      leadData.timestamp = new Date();
    }

    // Set status to new if not provided
    if (!leadData.status) {
      leadData.status = 'new';
    }

    // Add source if not provided
    if (!leadData.source) {
      leadData.source = 'AI Assistant';
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'leads'), leadData);

    return res.status(201).json({ 
      success: true,
      message: 'Lead created successfully',
      id: docRef.id 
    });
  } catch (error) {
    console.error('Error in lead submission:', error);
    return res.status(500).json({ error: 'Failed to create lead' });
  }
}
