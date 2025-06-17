import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface QuotationConfig {
  orderTypeLimits: {
    micro: {
      minDays: number;
      maxDays: number;
    };
    small: {
      minDays: number;
      maxDays: number;
    };
    monthly: {
      minDays: number;
      maxDays: number;
    };
    yearly: {
      minDays: number;
      maxDays: number;
    };
  };
  updatedAt?: string;
}

const DEFAULT_CONFIG: QuotationConfig = {
  orderTypeLimits: {
    micro: {
      minDays: 1,
      maxDays: 10
    },
    small: {
      minDays: 11,
      maxDays: 25
    },
    monthly: {
      minDays: 26,
      maxDays: 365
    },
    yearly: {
      minDays: 366,
      maxDays: 3650
    }
  }
};

export const getQuotationConfig = async (): Promise<QuotationConfig> => {
  try {
    const configRef = doc(db, 'config', 'quotation');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      // If no config exists, create one with defaults
      await setDoc(configRef, {
        ...DEFAULT_CONFIG,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return DEFAULT_CONFIG;
    }
    
    return configSnap.data() as QuotationConfig;
  } catch (error) {
    console.error('Error fetching quotation config:', error);
    return DEFAULT_CONFIG;
  }
};

export const updateQuotationConfig = async (updates: Partial<QuotationConfig>): Promise<QuotationConfig> => {
  try {
    const configRef = doc(db, 'config', 'quotation');
    const currentConfig = await getQuotationConfig();
    
    const updatedConfig = {
      ...currentConfig,
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(configRef, updatedConfig);
    
    return {
      ...updatedConfig,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating quotation config:', error);
    throw error;
  }
};

interface ResourceRatesConfig {
  foodRatePerMonth: number;
  accommodationRatePerMonth: number;
  updatedAt?: string;
}

const DEFAULT_RESOURCE_RATES: ResourceRatesConfig = {
  foodRatePerMonth: 2500,
  accommodationRatePerMonth: 4000
};

export const getResourceRatesConfig = async (): Promise<ResourceRatesConfig> => {
  try {
    const configRef = doc(db, 'config', 'resourceRates');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      // If no config exists, create one with defaults
      await setDoc(configRef, {
        ...DEFAULT_RESOURCE_RATES,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return DEFAULT_RESOURCE_RATES;
    }
    
    return configSnap.data() as ResourceRatesConfig;
  } catch (error) {
    console.error('Error fetching resource rates config:', error);
    return DEFAULT_RESOURCE_RATES;
  }
};

export const updateResourceRatesConfig = async (updates: Partial<ResourceRatesConfig>): Promise<ResourceRatesConfig> => {
  try {
    const configRef = doc(db, 'config', 'resourceRates');
    const currentConfig = await getResourceRatesConfig();
    
    const updatedConfig = {
      ...currentConfig,
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(configRef, updatedConfig);
    
    return {
      ...updatedConfig,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating resource rates config:', error);
    throw error;
  }
};

interface AdditionalParamsConfig {
  usageRates: {
    light: number;  // percentage
    heavy: number;  // percentage
  };
  riskFactors: {
    low: number;    // percentage
    medium: number; // percentage
    high: number;   // percentage
  };
  incidentalCharges: {
    incident1: number;
    incident2: number;
    incident3: number;
  };
  otherFactors: {
    rigger: number;
    helper: number;
    area: number;
    condition: number;
    customerReputation: number;
  };
  updatedAt?: string;
}

const DEFAULT_ADDITIONAL_PARAMS: AdditionalParamsConfig = {
  usageRates: {
    light: 5,
    heavy: 10
  },
  riskFactors: {
    low: 5,
    medium: 10,
    high: 15
  },
  incidentalCharges: {
    incident1: 5000,
    incident2: 10000,
    incident3: 15000
  },
  otherFactors: {
    rigger: 40000,
    helper: 12000,
    area: 5000,
    condition: 7000,
    customerReputation: 8000
  }
};

export const getAdditionalParamsConfig = async (): Promise<AdditionalParamsConfig> => {
  try {
    const configRef = doc(db, 'config', 'additionalParams');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      // If no config exists, create one with defaults
      await setDoc(configRef, {
        ...DEFAULT_ADDITIONAL_PARAMS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return DEFAULT_ADDITIONAL_PARAMS;
    }
    
    return configSnap.data() as AdditionalParamsConfig;
  } catch (error) {
    console.error('Error fetching additional params config:', error);
    return DEFAULT_ADDITIONAL_PARAMS;
  }
};

export const updateAdditionalParamsConfig = async (updates: Partial<AdditionalParamsConfig>): Promise<AdditionalParamsConfig> => {
  try {
    const configRef = doc(db, 'config', 'additionalParams');
    const currentConfig = await getAdditionalParamsConfig();
    
    const updatedConfig = {
      ...currentConfig,
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(configRef, updatedConfig);
    
    return {
      ...updatedConfig,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating additional params config:', error);
    throw error;
  }
};

// Default Template Configuration
interface DefaultTemplateConfig {
  defaultTemplateId: string;
  updatedAt?: string;
}

export const getDefaultTemplateConfig = async (): Promise<DefaultTemplateConfig> => {
  try {
    // For now, use localStorage since templates are stored there
    const savedConfig = localStorage.getItem('default-template-config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    
    return {
      defaultTemplateId: '',
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching default template config:', error);
    return {
      defaultTemplateId: '',
      updatedAt: new Date().toISOString()
    };
  }
};

export const updateDefaultTemplateConfig = async (templateId: string): Promise<DefaultTemplateConfig> => {
  try {
    const config = {
      defaultTemplateId: templateId,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('default-template-config', JSON.stringify(config));
    return config;
  } catch (error) {
    console.error('Error updating default template config:', error);
    throw error;
  }
};

// Template retrieval helper
export const getTemplateById = async (templateId: string) => {
  try {
    const savedTemplates = localStorage.getItem('quotation-templates');
    if (!savedTemplates) {
      return null;
    }

    const templates = JSON.parse(savedTemplates);
    return templates.find((template: any) => template.id === templateId) || null;
  } catch (error) {
    console.error('Error getting template by ID:', error);
    return null;
  }
};