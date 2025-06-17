import { Quotation } from '../types/quotation';
import { Template } from '../types/template';
import { formatCurrency } from './formatters';

/**
 * Interface for template data that can be merged with templates
 */
export interface TemplateData {
  // Customer information
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  customer_address: string;
  customer_designation: string;

  // Quotation information
  quotation_id: string;
  quotation_date: string;
  quotation_number: string;
  valid_until: string;
  created_date: string;

  // Equipment information
  equipment_name: string;
  equipment_id: string;
  equipment_capacity: string;
  equipment_type: string;

  // Project details
  project_duration: string;
  working_hours: string;
  shift_type: string;
  day_night: string;
  order_type: string;
  usage_type: string;
  risk_factor: string;

  // Location and logistics
  site_location: string;
  site_distance: string;
  mob_demob_cost: string;

  // Pricing information
  base_rate: string;
  total_amount: string;
  subtotal: string;
  gst_amount: string;
  gst_applicable: string;

  // Resources
  food_resources: string;
  accommodation_resources: string;
  extra_charges: string;

  // Company information
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_gst: string;
  company_pan: string;

  // Additional details
  terms_conditions: string;
  payment_terms: string;
  validity_period: string;
  notes: string;

  // Dates
  current_date: string;
  current_time: string;
  current_year: string;
}

/**
 * Converts a quotation object to template data
 */
export function quotationToTemplateData(quotation: Quotation): TemplateData {
  const createdDate = new Date(quotation.createdAt);
  const validUntilDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days validity
  const currentDate = new Date();

  // Calculate GST amount
  const subtotalAmount = quotation.includeGst 
    ? quotation.totalRent / 1.18 
    : quotation.totalRent;
  const gstAmount = quotation.includeGst 
    ? quotation.totalRent - subtotalAmount 
    : 0;

  return {
    // Customer information
    customer_name: quotation.customerContact?.name || quotation.customerName || 'N/A',
    customer_email: quotation.customerContact?.email || 'N/A',
    customer_phone: quotation.customerContact?.phone || 'N/A',
    customer_company: quotation.customerContact?.company || 'N/A',
    customer_address: quotation.customerContact?.address || 'N/A',
    customer_designation: quotation.customerContact?.designation || 'N/A',

    // Quotation information
    quotation_id: quotation.id.slice(0, 8).toUpperCase(),
    quotation_date: createdDate.toLocaleDateString('en-IN'),
    quotation_number: `QT-${quotation.id.slice(0, 8).toUpperCase()}`,
    valid_until: validUntilDate.toLocaleDateString('en-IN'),
    created_date: createdDate.toLocaleDateString('en-IN'),    // Equipment information
    equipment_name: (quotation.selectedMachines && quotation.selectedMachines.length > 0)
      ? quotation.selectedMachines.map(m => `${m.name} (${m.quantity} unit${m.quantity > 1 ? 's' : ''})`).join(', ')
      : quotation.selectedEquipment?.name || 'N/A',
    equipment_id: (quotation.selectedMachines && quotation.selectedMachines.length > 0)
      ? quotation.selectedMachines.map(m => m.equipmentId).join(', ')
      : quotation.selectedEquipment?.equipmentId || 'N/A',
    equipment_capacity: (quotation.selectedMachines && quotation.selectedMachines.length > 0)
      ? quotation.selectedMachines.map(m => m.name).join(', ')
      : quotation.selectedEquipment?.name || 'N/A',
    equipment_type: quotation.machineType || 'N/A',

    // Project details
    project_duration: `${quotation.numberOfDays} days`,
    working_hours: `${quotation.workingHours} hours/day`,
    shift_type: quotation.shift === 'double' ? 'Double Shift' : 'Single Shift',
    day_night: quotation.dayNight === 'day' ? 'Day Shift' : 'Night Shift',
    order_type: quotation.orderType.charAt(0).toUpperCase() + quotation.orderType.slice(1),
    usage_type: quotation.usage === 'heavy' ? 'Heavy Usage' : 'Normal Usage',
    risk_factor: quotation.riskFactor.charAt(0).toUpperCase() + quotation.riskFactor.slice(1) + ' Risk',

    // Location and logistics
    site_location: quotation.customerContact?.address || 'N/A',
    site_distance: `${quotation.siteDistance} km`,
    mob_demob_cost: formatCurrency(quotation.mobDemob),    // Pricing information
    base_rate: formatCurrency(
      (quotation.selectedMachines && quotation.selectedMachines.length > 0)
        ? quotation.selectedMachines.reduce((sum, m) => sum + (m.baseRate || 0) * m.quantity, 0)
        : quotation.workingCost || 0
    ),
    total_amount: formatCurrency(quotation.totalRent),
    subtotal: formatCurrency(subtotalAmount),
    gst_amount: formatCurrency(gstAmount),
    gst_applicable: quotation.includeGst ? 'Yes (18%)' : 'No',

    // Resources
    food_resources: quotation.foodResources.toString(),
    accommodation_resources: quotation.accomResources.toString(),
    extra_charges: formatCurrency(quotation.extraCharge),

    // Company information
    company_name: 'ASP Cranes',
    company_address: '123 Industrial Area, Mumbai, Maharashtra 400001',
    company_phone: '+91 22 1234 5678',
    company_email: 'info@aspcranes.com',
    company_gst: '27AABCS1429B1ZB',
    company_pan: 'AABCS1429B',

    // Additional details
    terms_conditions: 'Standard terms and conditions apply',
    payment_terms: '50% advance, balance against monthly bills',
    validity_period: '30 days from quotation date',
    notes: 'Thank you for your business!',

    // Dates
    current_date: currentDate.toLocaleDateString('en-IN'),
    current_time: currentDate.toLocaleTimeString('en-IN'),
    current_year: currentDate.getFullYear().toString(),
  };
}

/**
 * Merges template content with data, replacing all placeholders
 */
export function mergeTemplate(template: Template, data: TemplateData): string {
  let content = template.content;

  // Replace all placeholders with actual data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, value);
  });

  // Handle any remaining unreplaced placeholders by removing them or replacing with default text
  content = content.replace(/\{\{[^}]+\}\}/g, '[Data not available]');

  return content;
}

/**
 * Convenience function to merge a quotation with a template
 */
export function mergeQuotationWithTemplate(quotation: Quotation | undefined, template: Template): string {
  if (!template.content) {
    return '';
  }

  if (!quotation) {
    return template.content;
  }

  const data = {
    // Company information
    company_name: 'ASP Cranes',
    company_address: '123 Industrial Area, Mumbai, Maharashtra 400001',
    company_phone: '+91 22 1234 5678',
    company_email: 'info@aspcranes.com',
    company_gst: '27AABCS1429B1ZB',
    company_pan: 'AABCS1429B',

    // Customer information
    customer_name: quotation.customerContact?.name || quotation.customerName || 'N/A',
    customer_designation: quotation.customerContact?.designation || 'N/A',
    customer_company: quotation.customerContact?.company || 'N/A',
    customer_address: quotation.customerContact?.address || 'N/A',
    customer_phone: quotation.customerContact?.phone || 'N/A',
    customer_email: quotation.customerContact?.email || 'N/A',

    // Quotation details
    quotation_number: quotation.id || 'N/A',
    quotation_date: new Date(quotation.createdAt).toLocaleDateString('en-IN'),
    valid_until: new Date(new Date(quotation.createdAt).setDate(new Date(quotation.createdAt).getDate() + 30)).toLocaleDateString('en-IN'),
    order_type: quotation.orderType === 'monthly' ? 'Monthly' : 'Daily',    // Equipment details
    equipment_name: (quotation.selectedMachines && quotation.selectedMachines.length > 0) 
      ? quotation.selectedMachines.map(m => `${m.name} (${m.quantity} unit${m.quantity > 1 ? 's' : ''})`)
        .join(', ')
      : quotation.selectedEquipment?.name || 'N/A',
    project_duration: `${quotation.numberOfDays || 0} days`,
    working_hours: `${quotation.workingHours || 0} hours/day`,
    shift_type: quotation.shift === 'double' ? 'Double Shift' : 'Single Shift',
    base_rate: formatCurrency(
      (quotation.selectedMachines && quotation.selectedMachines.length > 0)
        ? quotation.selectedMachines.reduce((sum, m) => sum + (m.baseRate || 0) * m.quantity, 0)
        : quotation.workingCost || 0
    ),

    // Pricing
    subtotal: formatCurrency(quotation.totalRent ? quotation.totalRent / (quotation.includeGst ? 1.18 : 1) : 0),
    gst_amount: quotation.includeGst ? formatCurrency(quotation.totalRent ? quotation.totalRent - (quotation.totalRent / 1.18) : 0) : '0',
    total_amount: formatCurrency(quotation.totalRent || 0),

    // Terms
    payment_terms: '50% advance, balance against monthly bills',
    validity_period: '30 days from quotation date'
  };

  let content = template.content;
  
  // Replace all placeholders
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value.toString());
    }
  });

  return content;
}

/**
 * Get available template placeholders for documentation/help
 */
export function getAvailablePlaceholders() {
  return [
    {
      category: 'Company Information',
      key: 'company_name',
      description: 'Company name'
    },
    {
      category: 'Company Information',
      key: 'company_address',
      description: 'Company address'
    },
    {
      category: 'Company Information',
      key: 'company_phone',
      description: 'Company phone number'
    },
    {
      category: 'Company Information',
      key: 'company_email',
      description: 'Company email address'
    },
    {
      category: 'Company Information',
      key: 'company_gst',
      description: 'Company GST number'
    },
    {
      category: 'Company Information',
      key: 'company_pan',
      description: 'Company PAN number'
    },
    {
      category: 'Customer Information',
      key: 'customer_name',
      description: 'Customer name'
    },
    {
      category: 'Customer Information',
      key: 'customer_designation',
      description: 'Customer designation'
    },
    {
      category: 'Customer Information',
      key: 'customer_company',
      description: 'Customer company name'
    },
    {
      category: 'Customer Information',
      key: 'customer_address',
      description: 'Customer address'
    },
    {
      category: 'Customer Information',
      key: 'customer_phone',
      description: 'Customer phone number'
    },
    {
      category: 'Customer Information',
      key: 'customer_email',
      description: 'Customer email address'
    },
    {
      category: 'Quotation Details',
      key: 'quotation_number',
      description: 'Quotation number'
    },
    {
      category: 'Quotation Details',
      key: 'quotation_date',
      description: 'Quotation date'
    },
    {
      category: 'Quotation Details',
      key: 'valid_until',
      description: 'Quotation validity date'
    },
    {
      category: 'Quotation Details',
      key: 'order_type',
      description: 'Order type (Monthly/Daily)'
    },
    {
      category: 'Equipment Details',
      key: 'equipment_name',
      description: 'Equipment name'
    },
    {
      category: 'Equipment Details',
      key: 'project_duration',
      description: 'Project duration'
    },
    {
      category: 'Equipment Details',
      key: 'working_hours',
      description: 'Working hours per day'
    },
    {
      category: 'Equipment Details',
      key: 'shift_type',
      description: 'Shift type'
    },
    {
      category: 'Equipment Details',
      key: 'base_rate',
      description: 'Base rate'
    },
    {
      category: 'Pricing',
      key: 'subtotal',
      description: 'Subtotal amount'
    },
    {
      category: 'Pricing',
      key: 'gst_amount',
      description: 'GST amount'
    },
    {
      category: 'Pricing',
      key: 'total_amount',
      description: 'Total amount'
    },
    {
      category: 'Terms',
      key: 'payment_terms',
      description: 'Payment terms'
    },
    {
      category: 'Terms',
      key: 'validity_period',
      description: 'Validity period'
    }
  ];
}

/**
 * Validate template content for missing or invalid placeholders
 */
export function validateTemplate(content: string | undefined): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  // If content is undefined or empty, return with error
  if (!content) {
    result.isValid = false;
    result.errors.push('Template content is empty');
    return result;
  }

  // Required placeholders
  const requiredPlaceholders = [
    'customer_name',
    'customer_company',
    'customer_address',
    'quotation_number',
    'quotation_date',
    'equipment_name',
    'project_duration',
    'working_hours',
    'base_rate',
    'total_amount'
  ];

  // Recommended placeholders
  const recommendedPlaceholders = [
    'customer_designation',
    'customer_phone',
    'customer_email',
    'valid_until',
    'order_type',
    'shift_type',
    'subtotal',
    'gst_amount',
    'payment_terms',
    'validity_period'
  ];

  // Check required placeholders
  requiredPlaceholders.forEach(placeholder => {
    if (!content.includes(`{{${placeholder}}}`)) {
      result.errors.push(`Missing required placeholder: {{${placeholder}}}`);
      result.isValid = false;
    }
  });

  // Check recommended placeholders
  recommendedPlaceholders.forEach(placeholder => {
    if (!content.includes(`{{${placeholder}}}`)) {
      result.warnings.push(`Consider adding recommended placeholder: {{${placeholder}}}`);
    }
  });

  return result;
}