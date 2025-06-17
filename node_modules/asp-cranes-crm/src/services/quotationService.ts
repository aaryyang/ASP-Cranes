import { Quotation, QuotationInputs } from '../types/quotation';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getLeadById } from './leadService';
import { getDealById } from './dealService';
import { quotationsCollection } from './firestore/collections';

// Get all quotations
export const getQuotations = async (): Promise<Quotation[]> => {
  try {
    const snapshot = await getDocs(quotationsCollection);
    return snapshot.docs.map(doc => {
      const data = doc.data();      return {
        id: doc.id,
        ...data,
        customerContact: {
          name: data.customerContact?.name || data.customerName || 'Unknown',
          email: data.customerContact?.email || '',
          phone: data.customerContact?.phone || '',
          company: data.customerContact?.company || '',
          address: data.customerContact?.address || '',
          designation: data.customerContact?.designation || ''
        },        selectedEquipment: {
          id: data.selectedEquipment?.id || '',
          equipmentId: data.selectedEquipment?.equipmentId || '',
          name: (data.selectedMachines?.length > 0) 
            ? `${data.selectedMachines.length} machines selected`
            : (data.selectedEquipment?.name || 'Unknown Equipment'),
          baseRates: data.selectedEquipment?.baseRates || {
            micro: 0,
            small: 0,
            monthly: 0,
            yearly: 0
          }
        },
        selectedMachines: data.selectedMachines || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        status: data.status || 'draft',
        totalRent: data.totalRent || 0,
        version: data.version || 1
      } as Quotation;
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};

// Calculate total rent based on the form data
const calculateTotalRent = (quotationData: QuotationInputs): number => {
  try {
    // Early return if required fields are missing
    if (!quotationData.numberOfDays) {
      return 0;
    }
    
    // Check if we have multiple machines
    const hasMachines = quotationData.selectedMachines && quotationData.selectedMachines.length > 0;
    
    const days = Number(quotationData.numberOfDays);
    const isMonthly = days > 25;
    const effectiveDays = isMonthly ? 26 : days;
    const workingHours = Number(quotationData.workingHours || 8);
    const shiftMultiplier = quotationData.shift === 'double' ? 2 : 1;
    
    // Calculate working cost
    let workingCost = 0;
    
    if (hasMachines) {
      // Calculate working cost for all machines
      quotationData.selectedMachines!.forEach(machine => {
        const machineBaseRate = machine.baseRate;
        const machineQuantity = machine.quantity;
        let machineCost = 0;
        
        if (isMonthly) {
          const hourlyRate = (machineBaseRate / 26) / workingHours;
          machineCost = hourlyRate * workingHours * effectiveDays * shiftMultiplier * machineQuantity;
        } else {
          machineCost = machineBaseRate * workingHours * effectiveDays * shiftMultiplier * machineQuantity;
        }
        
        workingCost += machineCost;
      });
    } else if (quotationData.selectedEquipment?.baseRates) {
      // Fallback to using selectedEquipment for backwards compatibility
      const machineBaseRate = quotationData.selectedEquipment.baseRates[quotationData.orderType];
      
      if (isMonthly) {
        const hourlyRate = (machineBaseRate / 26) / workingHours;
        workingCost = hourlyRate * workingHours * effectiveDays * shiftMultiplier;
      } else {
        workingCost = machineBaseRate * workingHours * effectiveDays * shiftMultiplier;
      }
    }

    // Calculate usage load factor
    const usagePercentage = quotationData.usage === 'heavy' ? 0.10 : 0.05;
    let usageLoadFactor = 0;
    
    if (hasMachines) {
      // Calculate usage for each machine
      quotationData.selectedMachines!.forEach(machine => {
        usageLoadFactor += machine.baseRate * machine.quantity * usagePercentage;
      });
    } else if (quotationData.selectedEquipment?.baseRates) {
      // Fallback to single machine
      const baseRate = quotationData.selectedEquipment.baseRates[quotationData.orderType];
      usageLoadFactor = baseRate * usagePercentage;
    }

    // Calculate food and accommodation cost
    const foodDailyRate = 2500 / 26; // ₹2500 per month
    const accomDailyRate = 4000 / 26; // ₹4000 per month
    const foodAccomCost = isMonthly
      ? (Number(quotationData.foodResources || 0) * 2500) + (Number(quotationData.accomResources || 0) * 4000)
      : ((Number(quotationData.foodResources || 0) * foodDailyRate) + (Number(quotationData.accomResources || 0) * accomDailyRate)) * effectiveDays;

    // Calculate mob-demob cost
    const distance = Number(quotationData.siteDistance || 0);
    const trailerCost = Number(quotationData.mobDemob || 0);
    const mobRelaxationPercent = Number(quotationData.mobRelaxation || 0);
    
    let mobDemobCost = 0;
    
    if (hasMachines) {
      // Calculate mob-demob for each machine
      quotationData.selectedMachines!.forEach(machine => {
        const runningCostPerKm = machine.runningCostPerKm || 0;
        const distToSiteCost = distance * runningCostPerKm * 2 * machine.quantity;
        const mobRelaxationAmount = (distToSiteCost * mobRelaxationPercent) / 100;
        const machineMobDemobCost = (distToSiteCost - mobRelaxationAmount) + (trailerCost * machine.quantity);
        
        mobDemobCost += machineMobDemobCost;
      });
    } else {
      const runningCostPerKm = quotationData.runningCostPerKm || 0;
      const distanceCost = distance * runningCostPerKm * 2; // Round trip
      const relaxationAmount = (distanceCost * mobRelaxationPercent) / 100;
      mobDemobCost = distanceCost + trailerCost - relaxationAmount;
    }

    // Calculate risk adjustment
    let riskAdjustment = 0;
    const riskPercentage = quotationData.riskFactor === 'high' ? 0.15 : 
                         quotationData.riskFactor === 'medium' ? 0.10 : 0.05;
    
    if (hasMachines) {
      // Calculate risk for each machine
      quotationData.selectedMachines!.forEach(machine => {
        riskAdjustment += machine.baseRate * machine.quantity * riskPercentage;
      });
    } else if (quotationData.selectedEquipment?.baseRates) {
      // Fallback to single machine
      const baseRate = quotationData.selectedEquipment.baseRates[quotationData.orderType];
      riskAdjustment = baseRate * riskPercentage;
    }

    // Calculate extra charges
    const extraCharges = Number(quotationData.extraCharge || 0);

    // Calculate subtotal
    const subtotal = (
      workingCost +
      foodAccomCost +
      mobDemobCost +
      riskAdjustment +
      usageLoadFactor +
      extraCharges
    );

    // Calculate GST
    const gstAmount = quotationData.includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;

    return totalAmount;
  } catch (error) {
    console.error('Error calculating total rent:', error);
    return 0;
  }
};

// Create quotation
export const createQuotation = async (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quotation> => {
  try {
    const timestamp = new Date().toISOString();
    const newQuotation = {
      ...quotationData,
      createdAt: timestamp,
      updatedAt: timestamp,
      totalRent: calculateTotalRent(quotationData)
    };

    const docRef = await addDoc(quotationsCollection, newQuotation);
    
    // Update the deal value with the quotation total
    if (quotationData.leadId) {
      const dealRef = doc(db, 'deals', quotationData.leadId);
      await updateDoc(dealRef, {
        value: newQuotation.totalRent,
        updatedAt: timestamp
      });
    }
    
    return {
      id: docRef.id,
      ...newQuotation
    };
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

// Get quotations for a lead
export const getQuotationsForLead = async (leadId: string): Promise<Quotation[]> => {
  const q = query(
    quotationsCollection,
    where('leadId', '==', leadId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};

// Get quotations for a customer
export const getQuotationsForCustomer = async (customerId: string): Promise<Quotation[]> => {
  const q = query(
    quotationsCollection,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};

// Get quotation by ID
export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  try {
    const docRef = doc(quotationsCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    
    // Ensure selectedMachines is properly initialized if it doesn't exist
    const selectedMachines = data.selectedMachines || [];
    
    // Generate proper name for display when we have multiple machines
    let equipmentName = data.selectedEquipment?.name || 'Unknown Equipment';
    if (selectedMachines.length > 1) {
      equipmentName = `${selectedMachines.length} machines selected`;
    } else if (selectedMachines.length === 1) {
      equipmentName = selectedMachines[0].name;
    }
    
    return {
      id: docSnap.id,
      ...data,
      customerContact: {
        name: data.customerContact?.name || data.customerName || 'Unknown',
        email: data.customerContact?.email || '',
        phone: data.customerContact?.phone || '',
        company: data.customerContact?.company || '',
        address: data.customerContact?.address || '',
        designation: data.customerContact?.designation || ''
      },
      selectedEquipment: {
        id: data.selectedEquipment?.id || '',
        equipmentId: data.selectedEquipment?.equipmentId || '',
        name: equipmentName,
        baseRates: data.selectedEquipment?.baseRates || {
          micro: 0,
          small: 0,
          monthly: 0,
          yearly: 0
        }
      },
      selectedMachines: selectedMachines,
      machineType: data.machineType || '',
      orderType: data.orderType || 'micro',
      numberOfDays: data.numberOfDays || 0,
      workingHours: data.workingHours || 8,
      foodResources: data.foodResources || 0,
      accomResources: data.accomResources || 0,
      siteDistance: data.siteDistance || 0,
      usage: data.usage || 'normal',
      riskFactor: data.riskFactor || 'low',
      extraCharge: data.extraCharge || 0,
      incidentalCharges: data.incidentalCharges || [],
      otherFactorsCharge: data.otherFactorsCharge || 0,
      billing: data.billing || 'gst',
      baseRate: data.baseRate || 0,
      includeGst: data.includeGst ?? true,
      shift: data.shift || 'single',
      dayNight: data.dayNight || 'day',
      mobDemob: data.mobDemob || 0,
      mobRelaxation: data.mobRelaxation || 0,
      runningCostPerKm: data.runningCostPerKm || 0,
      version: data.version || 1,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      createdBy: data.createdBy || 'system',
      status: data.status || 'draft',
      totalRent: data.totalRent || 0,
      leadId: data.leadId || '',
      customerId: data.customerId || '',
      customerName: data.customerName || 'Unknown',
      otherFactors: data.otherFactors || [],
      dealType: data.dealType,
      sundayWorking: data.sundayWorking
    } as Quotation;
  } catch (error) {
    console.error('Error fetching quotation:', error);
    throw error;
  }
};

// Update quotation
export const updateQuotation = async (id: string, quotationData: Partial<Quotation>): Promise<Quotation> => {
  try {
    const quotationRef = doc(quotationsCollection, id);
    
    // If we're updating a quotation, get the latest deal information
    if (quotationData.leadId) {
      const deal = await getDealById(quotationData.leadId);
      if (deal) {
        quotationData.customerContact = {
          name: deal.customer.name,
          email: deal.customer.email,
          phone: deal.customer.phone,
          company: deal.customer.company,
          address: deal.customer.address,
          designation: deal.customer.designation
        };
      }
    }

    const updateData = {
      ...quotationData,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(quotationRef, updateData);

    const updatedDoc = await getDoc(quotationRef);
    if (!updatedDoc.exists()) {
      throw new Error('Quotation not found');
    }

    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Quotation;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};