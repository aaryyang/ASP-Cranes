import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  AlertCircle,
  ArrowLeft,
  Save,
  Calculator,
  Truck,
  Users,
  MapPin,
  Clock,
  IndianRupee,
  AlertTriangle,
  Settings,
  Calendar,
  FileText,
  Building2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { RequiredFieldsInfo } from '../components/common/RequiredFieldsInfo';
import { useAuthStore } from '../store/authStore';
import { Deal } from '../types/deal';
import { Equipment, OrderType, CraneCategory, BaseRates } from '../types/equipment';
import { Quotation, QuotationInputs } from '../types/quotation';
import type { SundayWorking } from '../types/quotation';
import { getDealById } from '../services/dealService';
import { getEquipment, getEquipmentByCategory } from '../services/firestore/equipmentService';
import { createQuotation, updateQuotation, getQuotationById } from '../services/quotationService';
import { getResourceRatesConfig, getAdditionalParamsConfig, getQuotationConfig } from '../services/configService';
import { formatCurrency } from '../utils/formatters';
import { useQuotationConfigStore } from '../store/quotationConfigStore';

const ORDER_TYPES = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const MACHINE_TYPES = [
  { value: '', label: 'Select machine type...' },
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'crawler_crane', label: 'Crawler Crane' },
  { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
] satisfies { value: string; label: string }[];

const SHIFT_OPTIONS = [
  { value: 'single', label: 'Single Shift' },
  { value: 'double', label: 'Double Shift' },
];

const TIME_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
];

const USAGE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'heavy', label: 'Heavy' },
];

const DEAL_TYPES = [
  { value: 'no_advance', label: 'No Advance' },
  { value: 'credit', label: 'Credit' },
  { value: 'long_credit', label: 'Long Credit' },
];

const RISK_LEVELS = [
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'low', label: 'Low Risk' },
];

const OTHER_FACTORS = [
  { value: 'area', label: 'Area' },
  { value: 'condition', label: 'Condition' },
  { value: 'customer_reputation', label: 'Customer Reputation' },
  { value: 'rigger', label: 'Rigger' },
  { value: 'helper', label: 'Helper' },
];

const INCIDENTAL_OPTIONS = [
  { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
  { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
  { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
];

const RIGGER_AMOUNT = 40000;
const HELPER_AMOUNT = 12000;

const SUNDAY_WORKING_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
];

interface SelectedMachine {
  id: string;
  machineType: string;
  equipmentId: string;
  name: string;
  baseRates: BaseRates;
  baseRate: number;
  runningCostPerKm: number;
  quantity: number;
}

interface QuotationFormState extends QuotationInputs {
  version: number;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  selectedMachines: SelectedMachine[];
}

export function QuotationCreation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('dealId') || '';
  const quotationId = searchParams.get('quotationId');
  const fresh = searchParams.get('fresh');

  const { orderTypeLimits, fetchConfig } = useQuotationConfigStore();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEquipmentBaseRate, setSelectedEquipmentBaseRate] = useState<number>(0);
  const [resourceRates, setResourceRates] = useState({
    foodRatePerMonth: 0,
    accommodationRatePerMonth: 0
  });

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    duration: true,
    orderType: true,
    machineSelection: true,
    workingHours: true,
    accommodation: true,
    mobDemob: true,
    additional: true
  });

  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [formData, setFormData] = useState<QuotationFormState>({
    machineType: '',
    selectedEquipment: {
      id: '',
      equipmentId: '',
      name: '',
      baseRates: {
        micro: 0,
        small: 0,
        monthly: 0,
        yearly: 0
      }
    },
    selectedMachines: [], // Initialize empty array for multiple machines
    orderType: 'micro',
    numberOfDays: 0,
    workingHours: 8,
    foodResources: 0,
    accomResources: 0,
    siteDistance: 0,
    usage: 'normal',
    riskFactor: 'low',
    extraCharge: 0,
    incidentalCharges: [],
    otherFactorsCharge: 0,
    billing: 'gst',
    includeGst: true,
    shift: 'single',
    dayNight: 'day',
    mobDemob: 0,
    mobRelaxation: 0,
    runningCostPerKm: 0,
    version: 1,
    createdBy: user?.id || '',
    status: 'draft',
    otherFactors: [],
    dealType: DEAL_TYPES[0].value,
    sundayWorking: 'no'
  });

  const [calculations, setCalculations] = useState({
    baseRate: 0,
    totalHours: 0,
    workingCost: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    usageLoadFactor: 0,
    extraCharges: 0,
    riskAdjustment: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchData();
  }, [dealId, quotationId]);

  useEffect(() => {
    calculateQuotation();
  }, [formData, selectedEquipmentBaseRate]);

  // Specific effect to ensure immediate recalculation when working hours change
  useEffect(() => {
    if (formData.workingHours !== undefined) {
      calculateQuotation();
    }
  }, [formData.workingHours]);
  
  // Effect to update the selected equipment base rate when order type changes
  useEffect(() => {
    if (formData.orderType && formData.selectedEquipment?.id && availableEquipment.length > 0) {
      const selected = availableEquipment.find(eq => eq.id === formData.selectedEquipment.id);
      if (selected?.baseRates) {
        const baseRate = selected.baseRates[formData.orderType];
        setSelectedEquipmentBaseRate(baseRate);
      }
    }
    
    // Also update base rates for all machines when order type changes
    if (formData.selectedMachines.length > 0 && availableEquipment.length > 0) {
      setFormData(prev => ({
        ...prev,
        selectedMachines: prev.selectedMachines.map(machine => {
          // Try to find the machine in available equipment
          const equipmentDetails = availableEquipment.find(eq => eq.id === machine.id);
          if (equipmentDetails?.baseRates) {
            // Update the base rate for the new order type
            return {
              ...machine,
              baseRate: equipmentDetails.baseRates[formData.orderType] || machine.baseRate
            };
          }
          return machine;
        })
      }));
    }
  }, [formData.orderType, availableEquipment.length]);

  useEffect(() => {
    if (formData.machineType) {
      const fetchEquipment = async () => {
        try {
          const equipment = await getEquipmentByCategory(formData.machineType as CraneCategory);
          setAvailableEquipment(equipment);
        } catch (error) {
          console.error('Error fetching equipment:', error);
        }
      };
      fetchEquipment();
    } else {
      setAvailableEquipment([]);
    }
  }, [formData.machineType]);

  useEffect(() => {
    if (formData.selectedEquipment && availableEquipment.length > 0) {
      const selected = availableEquipment.find(eq => eq.id === formData.selectedEquipment.id);
      if (selected?.baseRates) {
        const baseRate = selected.baseRates[formData.orderType];
        setSelectedEquipmentBaseRate(baseRate);
        setFormData(prev => ({
          ...prev,
          baseRate,
          runningCostPerKm: selected.runningCostPerKm || 0
        }));
      }
    }
  }, [formData.orderType, formData.selectedEquipment, availableEquipment]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching data with dealId:', dealId, 'quotationId:', quotationId);

      // Fetch deal data
      if (!dealId) {
        showToast('Deal ID not found', 'error');
        navigate('/quotations');
        return;
      }

      const dealData = await getDealById(dealId);
      console.log('Fetched deal data:', dealData);
      
      if (!dealData) {
        showToast('Deal not found', 'error');
        navigate('/quotations');
        return;
      }
      setDeal(dealData);

      // Fetch equipment data
      const equipmentData = await getEquipment();
      console.log('Fetched equipment data:', equipmentData);
      setEquipment(equipmentData);

      // Fetch resource rates
      const rates = await getResourceRatesConfig();
      console.log('Fetched resource rates:', rates);
      setResourceRates(rates);

      // If editing an existing quotation, load its data
      if (quotationId) {
        console.log('Fetching existing quotation:', quotationId);
        const existingQuotation = await getQuotationById(quotationId);
        console.log('Fetched quotation data:', existingQuotation);
        
        if (existingQuotation) {
          // Set machine type first to trigger equipment loading
          setFormData(prev => ({
            ...prev,
            machineType: existingQuotation.machineType || '',
          }));

          // Wait for equipment to load
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // First make sure we have loaded the right equipment for the machine type
          const machineEquipment = await getEquipmentByCategory(existingQuotation.machineType as CraneCategory);
          setAvailableEquipment(machineEquipment);
          
          // Wait again for equipment list to update
          await new Promise(resolve => setTimeout(resolve, 100));

          // Then set the rest of the form data
          // Use selectedMachines if available, otherwise convert selectedEquipment to machine array
          let existingMachines: SelectedMachine[] = [];
          
          if (existingQuotation.selectedMachines && existingQuotation.selectedMachines.length > 0) {
            // Use the existing machines array directly
            existingMachines = existingQuotation.selectedMachines.map(machine => {
              // Try to find the machine in available equipment to get the latest data
              const equipmentDetails = machineEquipment.find(eq => eq.id === machine.id);
              
              return {
                ...machine,
                // Ensure all required properties are present
                machineType: machine.machineType || existingQuotation.machineType || '',
                name: equipmentDetails?.name || machine.name || 'Unknown Equipment',
                baseRates: equipmentDetails?.baseRates || machine.baseRates,
                baseRate: equipmentDetails?.baseRates?.[existingQuotation.orderType] || machine.baseRate || 0,
                quantity: machine.quantity || 1
              };
            });
            console.log('Loaded machines from selectedMachines:', existingMachines);
          } else if (existingQuotation.selectedEquipment) {
            // Fallback to using selectedEquipment
            const equipmentDetails = machineEquipment.find(eq => eq.id === existingQuotation.selectedEquipment.id);
            
            existingMachines = [
              {
                id: existingQuotation.selectedEquipment.id,
                machineType: existingQuotation.machineType || '',
                equipmentId: existingQuotation.selectedEquipment.equipmentId,
                name: equipmentDetails?.name || existingQuotation.selectedEquipment.name || 'Unknown Equipment',
                baseRates: equipmentDetails?.baseRates || existingQuotation.selectedEquipment.baseRates,
                baseRate: equipmentDetails?.baseRates?.[existingQuotation.orderType] || 
                          existingQuotation.selectedEquipment?.baseRates?.[existingQuotation.orderType] || 0,
                runningCostPerKm: existingQuotation.runningCostPerKm || 0,
                quantity: 1
              }
            ];
            console.log('Created machine from selectedEquipment:', existingMachines);
          }
          
          setFormData({
            machineType: existingQuotation.machineType || '',
            selectedEquipment: existingQuotation.selectedEquipment || {
              id: '',
              equipmentId: '',
              name: '',
              baseRates: {
                micro: 0,
                small: 0,
                monthly: 0,
                yearly: 0
              }
            },
            selectedMachines: existingMachines,
            orderType: existingQuotation.orderType || 'micro',
            numberOfDays: existingQuotation.numberOfDays || 0,
            workingHours: existingQuotation.workingHours || 8,
            foodResources: existingQuotation.foodResources || 0,
            accomResources: existingQuotation.accomResources || 0,
            siteDistance: existingQuotation.siteDistance || 0,
            usage: existingQuotation.usage || 'normal',
            riskFactor: existingQuotation.riskFactor || 'low',
            extraCharge: existingQuotation.extraCharge || 0,
            incidentalCharges: existingQuotation.incidentalCharges || [],
            otherFactorsCharge: existingQuotation.otherFactorsCharge || 0,
            billing: existingQuotation.billing || 'gst',
            includeGst: existingQuotation.includeGst ?? true,
            shift: existingQuotation.shift || 'single',
            dayNight: existingQuotation.dayNight || 'day',
            mobDemob: existingQuotation.mobDemob || 0,
            mobRelaxation: existingQuotation.mobRelaxation || 0,
            runningCostPerKm: existingQuotation.runningCostPerKm || 0,
            version: existingQuotation.version || 1,
            createdBy: existingQuotation.createdBy || user?.id || '',
            status: existingQuotation.status || 'draft',
            otherFactors: existingQuotation.otherFactors || [],
            dealType: existingQuotation.dealType,
            sundayWorking: existingQuotation.sundayWorking,
          });
          
          // Set the selected equipment base rate for the form
          if (existingMachines.length > 0) {
            // For multi-machine quotations, use the base rate of the first machine
            const firstMachine = existingMachines[0];
            setSelectedEquipmentBaseRate(firstMachine.baseRate);
            console.log('Setting selected equipment base rate to:', firstMachine.baseRate);
          } else if (existingQuotation.selectedEquipment?.baseRates) {
            // Fall back to the equipment's base rate for the current order type
            const baseRate = existingQuotation.selectedEquipment.baseRates[existingQuotation.orderType];
            setSelectedEquipmentBaseRate(baseRate);
            console.log('Setting selected equipment base rate from baseRates:', baseRate);
          }
          
          console.log('Form data updated with quotation data');
        } else {
          showToast('Quotation not found', 'error');
          navigate('/quotations');
          return;
        }
      }

      // Fetch quotation config
      await fetchConfig();
      console.log('Quotation config fetched');
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error fetching data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const determineOrderType = (days: number): OrderType => {
    if (days <= 0) return 'micro'; // Default for no days entered
    if (days >= orderTypeLimits.yearly.minDays) return 'yearly';
    if (days >= orderTypeLimits.monthly.minDays) return 'monthly';
    if (days >= orderTypeLimits.small.minDays) return 'small';
    return 'micro';
  };

  const calculateQuotation = () => {
    console.log("Calculating quotation with working hours:", formData.workingHours);
    
    // Check if we have multiple machines or need to use the single machine
    const hasMachines = formData.selectedMachines.length > 0;
    
    // Use the selectedEquipmentBaseRate for single machine mode
    const effectiveBaseRate = selectedEquipmentBaseRate;
    
    if (!formData.numberOfDays || (!hasMachines && !effectiveBaseRate)) {
      setCalculations({
        baseRate: 0,
        totalHours: 0,
        workingCost: 0,
        mobDemobCost: 0,
        foodAccomCost: 0,
        usageLoadFactor: 0,
        extraCharges: 0,
        riskAdjustment: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
      return;
    }

    const days = Number(formData.numberOfDays);
    const isMonthly = days > 25;
    const effectiveDays = isMonthly ? 26 : days;
    const workingHours = calculateWorkingHours(effectiveDays);
    const shiftMultiplier = formData.shift === 'double' ? 2 : 1;
    
    let workingCost = 0;
    // Use 8 hours as default if workingHours is 0 or undefined
    const actualHours = formData.workingHours === 0 ? 8 : Number(formData.workingHours) || 8;
    
    if (hasMachines) {
      // Calculate working cost for all machines
      formData.selectedMachines.forEach(machine => {
        const machineBaseRate = machine.baseRate;
        const machineQuantity = machine.quantity;
        let machineCost = 0;
        
        if (isMonthly) {
          const hourlyRate = (machineBaseRate / 26) / actualHours;
          machineCost = hourlyRate * actualHours * effectiveDays * shiftMultiplier * machineQuantity;
        } else {
          machineCost = machineBaseRate * actualHours * effectiveDays * shiftMultiplier * machineQuantity;
        }
        
        workingCost += machineCost;
      });
    } else {
      // Use original single machine calculation
      if (isMonthly) {
        const hourlyRate = (effectiveBaseRate / 26) / actualHours;
        workingCost = hourlyRate * actualHours * effectiveDays * shiftMultiplier;
      } else {
        // Make sure we're using actualHours here, not the calculated workingHours
        workingCost = effectiveBaseRate * actualHours * effectiveDays * shiftMultiplier;
      }
    }

    // Calculate usage load factor by summing it for each machine
    const usagePercentage = formData.usage === 'heavy' ? 0.10 : 0.05;
    let usageLoadFactor = 0;
    
    if (hasMachines) {
      // Calculate usage load factor for all machines
      formData.selectedMachines.forEach(machine => {
        usageLoadFactor += machine.baseRate * machine.quantity * usagePercentage;
      });
    } else {
      // Fallback to single machine
      usageLoadFactor = effectiveBaseRate * usagePercentage;
    }
    
    let foodAccomCost;
    if (isMonthly) {
      foodAccomCost = (
        (Number(formData.foodResources) * resourceRates.foodRatePerMonth) +
        (Number(formData.accomResources) * resourceRates.accommodationRatePerMonth)
      );
    } else {
      const foodDailyRate = resourceRates.foodRatePerMonth / 26;
      const accomDailyRate = resourceRates.accommodationRatePerMonth / 26;
      foodAccomCost = (
        (Number(formData.foodResources) * foodDailyRate +
        Number(formData.accomResources) * accomDailyRate) *
        effectiveDays
      );
    }

    const mobDemobCost = calculateMobDemobCost();
    
    // Calculate risk adjustment considering each machine's base rate
    let riskAdjustment = 0;
    const riskPercentage = formData.riskFactor === 'high' ? 0.15 : 
                           formData.riskFactor === 'medium' ? 0.10 : 0.05;
    
    if (hasMachines) {
      // Calculate risk adjustment for all machines
      formData.selectedMachines.forEach(machine => {
        riskAdjustment += machine.baseRate * machine.quantity * riskPercentage;
      });
    } else {
      // Fallback to single machine
      riskAdjustment = effectiveBaseRate * riskPercentage;
    }

    const incidentalChargesTotal = formData.incidentalCharges.reduce((sum, val) => {
      const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
      return sum + (found ? found.amount : 0);
    }, 0);
    
    let otherFactorsTotal = 0;
    if (formData.otherFactors.includes('rigger')) otherFactorsTotal += RIGGER_AMOUNT;
    if (formData.otherFactors.includes('helper')) otherFactorsTotal += HELPER_AMOUNT;
    
    const extraCharges = (
      Number(formData.extraCharge) +
      incidentalChargesTotal +
      otherFactorsTotal
    );
    
    const subtotal = (
      workingCost +
      foodAccomCost +
      mobDemobCost +
      riskAdjustment +
      usageLoadFactor +
      extraCharges
    );
    
    const gstAmount = formData.includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;
    
    setCalculations({
      baseRate: effectiveBaseRate,
      totalHours: isMonthly ? 0 : workingHours,
      workingCost,
      mobDemobCost,
      foodAccomCost,
      usageLoadFactor,
      extraCharges,
      riskAdjustment,
      gstAmount,
      totalAmount,
    });
  };

  const calculateWorkingHours = (days: number): number => {
    // Use 8 as default only when workingHours is 0 or undefined
    const baseHours = formData.workingHours === 0 ? 8 : Number(formData.workingHours) || 8;
    const shiftMultiplier = formData.shift === 'double' ? 2 : 1;
    return baseHours * days * shiftMultiplier;
  };

  const calculateMobDemobCost = (): number => {
    const distance = Number(formData.siteDistance);
    const trailerCost = Number(formData.mobDemob) || 0;
    const mobRelaxationPercent = Number(formData.mobRelaxation) || 0;
    
    // If we have multiple machines, calculate mob/demob for each
    if (formData.selectedMachines.length > 0) {
      let totalMobDemobCost = 0;
      
      formData.selectedMachines.forEach(machine => {
        // Get running cost from the machine or look it up in available equipment
        let runningCostPerKm = machine.runningCostPerKm || 0;
        
        // If machine doesn't have running cost yet, try to find it in available equipment
        if (runningCostPerKm === 0) {
          const matchedEquipment = availableEquipment.find(eq => eq.id === machine.id);
          if (matchedEquipment) {
            runningCostPerKm = matchedEquipment.runningCostPerKm || 0;
          }
        }
        
        // Calculate mobilization and demobilization costs for this machine
        const distToSiteCost = distance * runningCostPerKm * 2 * machine.quantity;
        const mobRelaxationAmount = (distToSiteCost * mobRelaxationPercent) / 100;
        
        // Calculate final cost including trailer cost per machine quantity
        const machineMobDemobCost = (distToSiteCost - mobRelaxationAmount) + (trailerCost * machine.quantity);
        
        totalMobDemobCost += machineMobDemobCost;
      });
      
      return totalMobDemobCost;
    } else {
      // Fall back to original calculation for a single machine
      const selectedEquip = availableEquipment.find(eq => eq.id === formData.selectedEquipment.id);
      const runningCostPerKm = selectedEquip?.runningCostPerKm || 0;
      
      const distToSiteCost = distance * runningCostPerKm * 2;
      const mobRelaxationAmount = (distToSiteCost * mobRelaxationPercent) / 100;
      const finalMobDemobCost = (distToSiteCost - mobRelaxationAmount) + trailerCost;
      
      return finalMobDemobCost;
    }
  };

  const toggleCard = (cardName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deal) {
      showToast('Deal not found', 'error');
      return;
    }

    if (formData.selectedMachines.length === 0 && !formData.selectedEquipment.id) {
      showToast('Please select at least one machine', 'error');
      return;
    }

    if (formData.numberOfDays <= 0) {
      showToast('Please enter valid number of days', 'error');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Current calculations:', calculations);

      const quotationData = {
        ...formData,
        leadId: deal.id,
        customerId: deal.customerId,
        customerName: deal.customer.name,
        customerContact: {
          name: deal.customer.name,
          email: deal.customer.email,
          phone: deal.customer.phone,
          company: deal.customer.company,
          address: deal.customer.address,
          designation: deal.customer.designation
        },
        // Ensure both selectedEquipment and selectedMachines are included
        selectedEquipment: formData.selectedEquipment,
        selectedMachines: formData.selectedMachines,
        totalRent: calculations.totalAmount,
        baseRate: calculations.baseRate,
        workingCost: calculations.workingCost,
        mobDemobCost: calculations.mobDemobCost,
        foodAccomCost: calculations.foodAccomCost,
        usageLoadFactor: calculations.usageLoadFactor,
        extraCharges: calculations.extraCharges,
        riskAdjustment: calculations.riskAdjustment,
        gstAmount: calculations.gstAmount,
        sundayWorking: formData.sundayWorking || 'no'
      };

      console.log('Submitting quotation data:', quotationData);

      let savedQuotation;
      if (quotationId) {
        // Update existing quotation
        savedQuotation = await updateQuotation(quotationId, {
          ...quotationData,
          version: formData.version + 1
        });
        showToast('Quotation updated successfully', 'success');
      } else {
        // Create new quotation
        savedQuotation = await createQuotation(quotationData);
        showToast('Quotation created successfully', 'success');
      }

      console.log('Saved quotation:', savedQuotation);
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      showToast('Error saving quotation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success',
    description?: string
  ) => {
    setToast({ show: true, title, variant, description });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleEquipmentSelect = (equipmentId: string) => {
    const selected = availableEquipment.find(eq => eq.id === equipmentId);
    if (selected) {
      const baseRate = selected.baseRates[formData.orderType];
      setSelectedEquipmentBaseRate(baseRate);
      
      setFormData(prev => ({
        ...prev,
        selectedEquipment: {
          id: selected.id,
          equipmentId: selected.equipmentId,
          name: selected.name,
          baseRates: selected.baseRates
        },
        runningCostPerKm: selected.runningCostPerKm || 0
      }));
    }
  };

  const handleMachineTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      machineType: value,
      selectedEquipment: {
        id: '',
        equipmentId: '',
        name: '',
        baseRates: {
          micro: 0,
          small: 0,
          monthly: 0,
          yearly: 0
        }
      }
    }));
    setSelectedEquipmentBaseRate(0);
  };

  const addMachine = () => {
    if (!formData.machineType || !formData.selectedEquipment.id) {
      showToast('Please select a machine type and equipment first', 'warning');
      return;
    }

    // Check if this machine is already added
    const machineExists = formData.selectedMachines.some(
      m => m.id === formData.selectedEquipment.id
    );

    if (machineExists) {
      // If machine already exists, increment quantity instead of adding a new one
      updateMachineQuantity(formData.selectedEquipment.id, 1);
      return;
    }

    const selected = availableEquipment.find(eq => eq.id === formData.selectedEquipment.id);
    if (!selected) {
      showToast('Selected equipment not found', 'error');
      return;
    }

    const newMachine: SelectedMachine = {
      id: selected.id,
      machineType: formData.machineType,
      equipmentId: selected.equipmentId,
      name: selected.name,
      baseRates: selected.baseRates,
      baseRate: selected.baseRates[formData.orderType],
      runningCostPerKm: selected.runningCostPerKm || 0,
      quantity: 1
    };

    setFormData(prev => ({
      ...prev,
      selectedMachines: [...prev.selectedMachines, newMachine]
    }));

    // Reset the machine selection fields
    setFormData(prev => ({
      ...prev,
      machineType: '',
      selectedEquipment: {
        id: '',
        equipmentId: '',
        name: '',
        baseRates: {
          micro: 0,
          small: 0,
          monthly: 0,
          yearly: 0
        }
      },
      baseRate: 0
    }));
    
    setSelectedEquipmentBaseRate(0);
  };

  const removeMachine = (machineId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMachines: prev.selectedMachines.filter(m => m.id !== machineId)
    }));
  };

  const updateMachineQuantity = (machineId: string, change: number) => {
    setFormData(prev => ({
      ...prev,
      selectedMachines: prev.selectedMachines.map(m => {
        if (m.id === machineId) {
          const newQuantity = Math.max(1, m.quantity + change); // Ensure quantity is at least 1
          return { ...m, quantity: newQuantity };
        }
        return m;
      })
    }));
  };

  const updateMachineBaseRate = (machineId: string, baseRate: number) => {
    setFormData(prev => ({
      ...prev,
      selectedMachines: prev.selectedMachines.map(m => {
        if (m.id === machineId) {
          return { ...m, baseRate };
        }
        return m;
      })
    }));
  };

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quotation form...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-4 text-center text-gray-500">
        Deal not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <style>
        {`
          /* Remove number input spinners */
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft size={16} />}
            className="self-start"
          >
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {quotationId ? 'Edit Quotation' : 'Create Quotation'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">For {deal.customer.name} - {deal.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-full md:max-w-7xl mx-auto px-2 sm:px-4">
        {/* Customer Information Card */}
        <Card className="mb-4 sm:mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <CardTitle className="text-base sm:text-lg font-medium">Customer Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm text-gray-500">Customer Name</div>
                <div className="text-sm sm:text-base font-medium">{deal.customer.name}</div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm text-gray-500">Company</div>
                <div className="text-sm sm:text-base font-medium">{deal.customer.company}</div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm text-gray-500">Designation</div>
                <div className="text-sm sm:text-base font-medium">{deal.customer.designation || 'N/A'}</div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm text-gray-500">Email</div>
                <div className="text-sm sm:text-base font-medium break-all">{deal.customer.email}</div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm text-gray-500">Phone</div>
                <div className="text-sm sm:text-base font-medium">{deal.customer.phone}</div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm text-gray-500">Address</div>
                <div className="text-sm sm:text-base font-medium">{deal.customer.address}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <RequiredFieldsInfo />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="col-span-7 space-y-6">
              {/* Duration Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('duration')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Duration</CardTitle>
                    </div>
                    {expandedCards.duration ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.duration && (
                  <CardContent className="pt-4 space-y-4">
                    <FormInput
                      type="number"
                      label="Number of Days"
                      value={formData.numberOfDays || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const days = e.target.value === '' ? 0 : Number(e.target.value);
                        // Always determine the order type based on the number of days
                        const newOrderType = determineOrderType(days);
                        console.log(`Days: ${days}, Order Type: ${newOrderType}`);
                        
                        setFormData(prev => {
                          // If order type changes due to day change, update base rates for machines
                          const orderTypeChanged = days > 0 && newOrderType !== prev.orderType;
                          
                          // If order type changed, update base rates for all machines
                          let updatedMachines = [...prev.selectedMachines];
                          if (orderTypeChanged) {
                            updatedMachines = prev.selectedMachines.map(machine => ({
                              ...machine,
                              baseRate: machine.baseRates[newOrderType] || machine.baseRate
                            }));
                          }
                          
                          return {
                            ...prev,
                            numberOfDays: days,
                            orderType: days > 0 ? newOrderType : prev.orderType,
                            selectedMachines: updatedMachines
                          };
                        });
                      }}
                      required
                      min="1"
                      placeholder="Enter number of days"
                    />
                    {formData.numberOfDays > 0 && selectedEquipmentBaseRate > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.orderType !== 'monthly' ? (
                          <div className="text-sm text-gray-600">
                            Daily Rate: {formatCurrency(selectedEquipmentBaseRate * (formData.workingHours === 0 ? 8 : Number(formData.workingHours) || 8))}/day
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Monthly Rate: {formatCurrency(selectedEquipmentBaseRate)}/month
                          </div>
                        )}
                        <div className="text-sm font-medium text-primary-600">
                          {Number(formData.numberOfDays) >= orderTypeLimits.yearly.minDays ? 'Yearly rate' :
                           Number(formData.numberOfDays) >= orderTypeLimits.monthly.minDays ? 'Monthly rate' :
                           Number(formData.numberOfDays) >= orderTypeLimits.small.minDays ? 'Small order rate' :
                           'Micro order rate'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Order Type Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('orderType')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Order Type</CardTitle>
                    </div>
                    {expandedCards.orderType ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.orderType && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Order Type"
                      options={ORDER_TYPES}
                      value={formData.orderType}
                      onChange={(value) => {
                        // Only allow changing order type when number of days is 0
                        if (Number(formData.numberOfDays) === 0) {
                          setFormData(prev => ({
                            ...prev,
                            orderType: value as OrderType
                          }));
                        }
                      }}
                      disabled={Number(formData.numberOfDays) > 0}
                    />
                    {Number(formData.numberOfDays) > 0 ? (
                      <div className="mt-2 text-sm text-amber-600">
                        {Number(formData.numberOfDays) >= orderTypeLimits.yearly.minDays ? 'Order type is set to Yearly as duration exceeds ' + (orderTypeLimits.yearly.minDays - 1) + ' days' :
                         Number(formData.numberOfDays) >= orderTypeLimits.monthly.minDays ? 'Order type is set to Monthly as duration exceeds ' + (orderTypeLimits.monthly.minDays - 1) + ' days' :
                         Number(formData.numberOfDays) >= orderTypeLimits.small.minDays ? 'Order type is set to Small as duration is between ' + orderTypeLimits.small.minDays + '-' + orderTypeLimits.small.maxDays + ' days' :
                         'Order type is set to Micro as duration is ' + orderTypeLimits.micro.maxDays + ' days or less'}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-500 flex items-center">
                        <Info className="w-4 h-4 mr-1.5" />
                        <span>Order type will be automatically set based on the number of days</span>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Machine Selection Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('machineSelection')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      <div>
                        <CardTitle className="text-lg font-medium">Machine Selection</CardTitle>
                        <p className="text-sm text-gray-500 flex items-center">
                          You can add multiple machines to this quotation 
                          <span className="ml-1 cursor-help text-gray-400 hover:text-gray-600 relative group">
                            <Info className="h-4 w-4" />
                            <span className="hidden group-hover:block absolute left-full ml-2 top-0 bg-gray-800 text-white text-xs rounded p-2 w-48">
                              Add different types of machines or multiple units of the same machine using the Add Machine button
                            </span>
                          </span>
                        </p>
                      </div>
                    </div>
                    {expandedCards.machineSelection ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.machineSelection && (
                  <CardContent className="pt-4 space-y-4">
                    {/* Selected Machines List */}
                    {formData.selectedMachines.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold mb-2 text-gray-700">Selected Machines ({formData.selectedMachines.length})</h3>
                          <span className="text-xs text-gray-500 mb-2">You can edit the base rate and quantity for each machine</span>
                        </div>
                        <div className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                          {formData.selectedMachines.map(machine => (
                            <div 
                              key={machine.id} 
                              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex-grow">
                                <div className="font-semibold">{machine.name}</div>
                                <div className="text-sm text-gray-500 mb-2">ID: {machine.equipmentId}</div>
                                {/* Base Rate Input */}
                                <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded-md border border-gray-100">
                                  <label className="text-xs font-medium text-gray-700">Base Rate:</label>
                                  <input
                                    type="number"
                                    className="border rounded px-2 py-1 w-24 text-sm"
                                    value={machine.baseRate}
                                    onChange={(e) => {
                                      const value = Number(e.target.value);
                                      if (!isNaN(value)) {
                                        updateMachineBaseRate(machine.id, value);
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">
                                    {formData.orderType === 'monthly' ? '/month' : '/hr'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                <button
                                  type="button"
                                  className="p-1 text-gray-400 hover:text-error-500 transition-colors duration-150"
                                  onClick={() => removeMachine(machine.id)}
                                  title="Remove machine"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500 mb-1">Quantity</span>
                                  <div className="flex items-center border rounded-md overflow-hidden">
                                    <button
                                      type="button"
                                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
                                      onClick={() => updateMachineQuantity(machine.id, -1)}
                                      disabled={machine.quantity <= 1}
                                    >
                                      -
                                    </button>
                                    <span className="px-3 py-1 font-medium">{machine.quantity}</span>
                                    <button
                                      type="button"
                                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
                                      onClick={() => updateMachineQuantity(machine.id, 1)}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-sm font-semibold mb-2 text-gray-700">
                        Add Machine
                      </h3>
                      <Select
                        label="Machine Type"
                        options={MACHINE_TYPES}
                        value={formData.machineType}
                        onChange={(value) => {
                          handleMachineTypeChange(value);
                        }}
                      />

                      {formData.machineType && (
                        <div className="mt-3">
                          <Select
                            label="Select Equipment"
                            options={[
                              { value: '', label: 'Select equipment...' },
                              ...availableEquipment.map(eq => ({
                                value: eq.id,
                                label: `${eq.equipmentId} - ${eq.name} (${formatCurrency(eq.baseRates[formData.orderType])}${formData.orderType === 'monthly' ? '/month' : '/hr'})`,
                              }))
                            ]}
                            value={formData.selectedEquipment.id}
                            onChange={(value) => {
                              // This will set the selectedEquipmentBaseRate
                              handleEquipmentSelect(value);
                            }}
                          />
                        </div>
                      )}
                      
                      {!availableEquipment.length && formData.machineType && (
                        <div className="text-sm text-amber-600 mt-2">
                          No available equipment found for this machine type
                        </div>
                      )}

                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="default"
                          onClick={addMachine}
                          leftIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>}
                          disabled={!formData.machineType || !formData.selectedEquipment.id}
                          className="w-full"
                        >
                          {formData.selectedMachines.length === 0 ? 'Add Machine to Quotation' : 'Add Another Machine'}
                        </Button>
                        {formData.selectedMachines.length > 0 && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            You have added {formData.selectedMachines.length} machine{formData.selectedMachines.length > 1 ? 's' : ''} to this quotation
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Working Hours Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('workingHours')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Working Hours</CardTitle>
                    </div>
                    {expandedCards.workingHours ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.workingHours && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Shift"
                      options={SHIFT_OPTIONS}
                      value={formData.shift}
                      onChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          shift: value as 'single' | 'double'
                        }));
                      }}
                    />
                    <div>
                      <FormInput
                        type="number"
                        label="Number of Hours"
                        value={formData.workingHours === 0 ? '' : formData.workingHours}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty value for user editing
                          if (value === '') {
                            setFormData(prev => ({ ...prev, workingHours: 0 }));
                          } else if (/^\d+$/.test(value)) {
                            const numValue = parseInt(value, 10);
                            if (numValue >= 1 && numValue <= 24) {
                              setFormData(prev => ({ ...prev, workingHours: numValue }));
                            }
                          }
                        }}
                        required
                        min="1"
                        max="24"
                        placeholder="Enter hours (default: 8)"
                        step="1"
                        autoComplete="off"
                      />
                      <div className="flex items-center mt-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>Standard single shift duration is 8 hours</span>
                      </div>
                    </div>
                    <Select
                      label="Day/Night"
                      options={TIME_OPTIONS}
                      value={formData.dayNight}
                      onChange={(value) => setFormData(prev => ({ ...prev, dayNight: value as 'day' | 'night' }))}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sundayWorking"
                        checked={formData.sundayWorking === 'yes'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          sundayWorking: e.target.checked ? 'yes' : 'no' 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="sundayWorking" className="text-sm">
                        Sunday Working
                      </label>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Accommodation Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('accommodation')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Accommodation</CardTitle>
                    </div>
                    {expandedCards.accommodation ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.accommodation && (
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <FormInput
                        type="number"
                        label="Number of Resources"
                        value={formData.foodResources || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, foodResources: e.target.value === '' ? 0 : Number(e.target.value) }))}
                        placeholder="Enter number of resources"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Rate: ₹2500/month per resource
                      </div>
                    </div>
                    <div>
                      <FormInput
                        type="number"
                        label="Number of Resources"
                        value={formData.accomResources || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, accomResources: e.target.value === '' ? 0 : Number(e.target.value) }))}
                        placeholder="Enter number of resources"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Rate: ₹4000/month per resource
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Mob - Demob Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('mobDemob')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Mob - Demob</CardTitle>
                    </div>
                    {expandedCards.mobDemob ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.mobDemob && (
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <FormInput
                        type="number"
                        label="Distance to Site (km)"
                        value={formData.siteDistance || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, siteDistance: e.target.value === '' ? 0 : Number(e.target.value) }))}
                        placeholder="Enter distance in kilometers"
                      />
                    </div>
                    <div>
                      <FormInput
                        type="number"
                        label="Trailer Cost"
                        value={formData.mobDemob || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobDemob: e.target.value === '' ? 0 : Number(e.target.value) }))}
                        placeholder="Enter additional trailer charges"
                      />
                    </div>
                    <div>
                      <FormInput
                        type="number"
                        label="Mob Relaxation"
                        value={formData.mobRelaxation || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobRelaxation: e.target.value === '' ? 0 : Number(e.target.value) }))}
                        placeholder="Enter relaxation value (X%)"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Enter percentage value for discount on distance cost
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Additional Parameters Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('additional')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Additional Parameters</CardTitle>
                    </div>
                    {expandedCards.additional ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.additional && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Usage"
                      options={USAGE_OPTIONS}
                      value={formData.usage}
                      onChange={(value) => setFormData(prev => ({ ...prev, usage: value as 'normal' | 'heavy' }))}
                    />
                    <div className="flex items-center mt-1.5 text-sm text-gray-600">
                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                      <span>Usage rates: Normal - 5% of base rate | Heavy - 10% of base rate</span>
                    </div>
                    
                    <Select
                      label="Deal Type"
                      options={DEAL_TYPES}
                      value={formData.dealType || DEAL_TYPES[0].value}
                      onChange={(value) => setFormData(prev => ({ ...prev, dealType: value || DEAL_TYPES[0].value }))}
                    />
                    
                    {/* Removed duplicate Sunday Working select */}
                    
                    <FormInput
                      type="number"
                      label="Extra Commercial Charges"
                      value={formData.extraCharge || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, extraCharge: e.target.value === '' ? 0 : Number(e.target.value) }))}
                      placeholder="Enter extra charges"
                    />
                    
                    <Select
                      label="Risk Factor"
                      options={RISK_LEVELS}
                      value={formData.riskFactor}
                      onChange={(value) => setFormData(prev => ({ ...prev, riskFactor: value as 'low' | 'medium' | 'high' }))}
                    />
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Incidental Charges</label>
                      <div className="space-y-2">
                        {INCIDENTAL_OPTIONS.map(opt => (
                          <label key={opt.value} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={formData.incidentalCharges.includes(opt.value)}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  incidentalCharges: e.target.checked
                                    ? [...prev.incidentalCharges, opt.value]
                                    : prev.incidentalCharges.filter(val => val !== opt.value)
                                }));
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Other Factors</label>
                      <div className="space-y-2">
                        {OTHER_FACTORS.map((factor) => (
                          <label key={factor.value} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={formData.otherFactors.includes(factor.value)}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  otherFactors: e.target.checked
                                    ? [...prev.otherFactors, factor.value]
                                    : prev.otherFactors.filter(f => f !== factor.value)
                                }));
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">
                              {factor.label}
                              {factor.value === 'rigger' && ' (₹40,000)'}
                              {factor.value === 'helper' && ' (₹12,000)'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="col-span-5 space-y-6 sticky top-6">
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <CardHeader className="border-b border-gray-100 pb-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary-500" />
                    Quotation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEquipmentBaseRate > 0 && !formData.selectedMachines.length && (
                    <div className="mb-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                      <div className="text-sm font-medium text-primary-900 mb-2">Equipment Details</div>
                      <div className="text-2xl font-bold text-primary-700">
                        ₹{formatCurrency(selectedEquipmentBaseRate).replace('₹', '')}
                        <span className="text-base font-medium text-primary-600 ml-1">
                          {formData.orderType === 'monthly' ? '/month' : '/hr'}
                        </span>
                      </div>
                      <div className="text-sm text-primary-600 mt-1">
                        {formData.orderType.charAt(0).toUpperCase() + formData.orderType.slice(1)} Rate
                      </div>
                      {formData.orderType === 'monthly' && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span>Hourly Rate: </span>
                            <span className="font-medium ml-1">
                              ₹{formatCurrency((selectedEquipmentBaseRate / 26) / (parseFloat(formData.workingHours.toString()) || 8)).replace('₹', '')}/hr
                            </span>
                          </div>
                        </div>
                      )}
                      {formData.numberOfDays && (
                        <div className="mt-3 text-sm text-gray-600">
                          <div className="flex justify-between items-center mb-1">
                            <span>Total Days:</span>
                            <span className="font-medium">
                              {Number(formData.numberOfDays) > 25 ? '26 (Monthly)' : formData.numberOfDays}
                            </span>
                          </div>
                          {formData.orderType !== 'monthly' && (
                            <div className="flex justify-between items-center mb-1">
                              <span>Hours per Day:</span>
                              <span className="font-medium">
                                {formData.workingHours === 0 ? 8 : formData.workingHours || 8}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span>Order Type:</span>
                            <span className="font-medium">
                              {formData.orderType.charAt(0).toUpperCase() + formData.orderType.slice(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Selected Machines Summary */}
                    {formData.selectedMachines.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700">Selected Machines ({formData.selectedMachines.length})</h3>
                        <div className="space-y-2 bg-primary-50 p-3 rounded-md border border-primary-100">
                          {formData.selectedMachines.map(machine => (
                            <div key={machine.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                              <div>
                                <div className="font-medium">{machine.name}</div>
                                <div className="text-sm text-gray-500">
                                  {machine.quantity} unit{machine.quantity > 1 ? 's' : ''} × {formatCurrency(machine.baseRate)}{formData.orderType === 'monthly' ? '/month' : '/hr'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-primary-700">
                                  {formatCurrency(machine.baseRate * machine.quantity)}
                                  <span className="text-xs ml-1">{formData.orderType === 'monthly' ? '/month' : '/hr'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center p-2 mt-2 border-t border-primary-200">
                            <div className="text-sm text-gray-600">Total machines value</div>
                            <div className="font-semibold text-primary-700">
                              {formatCurrency(formData.selectedMachines.reduce((total, m) => total + (m.baseRate * m.quantity), 0))}
                              <span className="text-xs ml-1">{formData.orderType === 'monthly' ? '/month' : '/hr'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Working Cost</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.workingCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (calculations.workingCost / calculations.totalAmount) * 100 : 0.5}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-success-500" />
                            <span className="text-sm font-medium">Food & Accommodation</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.foodAccomCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (calculations.foodAccomCost / calculations.totalAmount) * 100 : 0.5}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-warning-500" />
                            <span className="text-sm font-medium">Mob/Demob Cost</span>
                            <div className="group relative inline-block">
                              <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                              <div className="opacity-0 bg-gray-800 text-white text-xs rounded p-2 absolute z-10 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 w-48">
                                Cost calculated for each machine based on distance, running cost per km, and trailer cost.
                              </div>
                            </div>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.mobDemobCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-warning-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (calculations.mobDemobCost / calculations.totalAmount) * 100 : 0.5}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-error-500" />
                            <span className="text-sm font-medium">Risk & Usage</span>
                            <div className="group relative inline-block">
                              <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                              <div className="opacity-0 bg-gray-800 text-white text-xs rounded p-2 absolute z-10 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 w-48">
                                Risk factor (5-15%) and usage load (5-10%) calculated for each machine based on its base rate and quantity.
                              </div>
                            </div>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.riskAdjustment + calculations.usageLoadFactor)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-error-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? ((calculations.riskAdjustment + calculations.usageLoadFactor) / calculations.totalAmount) * 100 : 0.5}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Extra Commercial Charges */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Extra Commercial Charges</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(Number(formData.extraCharge))}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (Number(formData.extraCharge) / calculations.totalAmount) * 100 : 0.5}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Incidental Charges */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">Incidental Charges</span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(formData.incidentalCharges.reduce((sum, val) => {
                              const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
                              return sum + (found ? found.amount : 0);
                            }, 0))}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? 
                                (formData.incidentalCharges.reduce((sum, val) => {
                                  const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
                                  return sum + (found ? found.amount : 0);
                                }, 0) / calculations.totalAmount) * 100 : 0.5}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Other Factors Charges */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-500" />
                            <span className="text-sm font-medium">Other Factors</span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(
                              (formData.otherFactors.includes('rigger') ? RIGGER_AMOUNT : 0) + 
                              (formData.otherFactors.includes('helper') ? HELPER_AMOUNT : 0)
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? 
                                (((formData.otherFactors.includes('rigger') ? RIGGER_AMOUNT : 0) + 
                                (formData.otherFactors.includes('helper') ? HELPER_AMOUNT : 0)) / 
                                calculations.totalAmount) * 100 : 0.5}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-medium">{formatCurrency(calculations.totalAmount - calculations.gstAmount)}</span>
                        </div>
                        
                        {formData.includeGst && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>GST (18%)</span>
                            <span className="font-medium">{formatCurrency(calculations.gstAmount)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-lg font-semibold">Total Amount</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(calculations.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={formData.includeGst}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            includeGst: e.target.checked 
                          }))}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Include GST</div>
                          <div className="text-sm text-gray-500">
                            GST will be calculated at 18% of the total amount
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/quotations')}
                  className="sm:flex-1 order-2 sm:order-1"
                  size="md"
                >
                  Cancel
                </Button>
                <div className="sm:flex-1 order-1 sm:order-2">
                  <Button 
                    type="submit"
                    disabled={isSaving || (formData.selectedMachines.length === 0 && !formData.selectedEquipment.id)}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                    leftIcon={isSaving ? <Clock className="animate-spin" /> : <Save />}
                    size="md"
                  >
                    {isSaving ? 'Saving...' : quotationId ? 'Update Quotation' : 'Create Quotation'}
                  </Button>
                  {formData.selectedMachines.length === 0 && !formData.selectedEquipment.id && (
                    <div className="mt-1 text-xs text-center text-amber-600">
                      Please add at least one machine
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}