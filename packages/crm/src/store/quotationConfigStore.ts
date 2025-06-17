import { create } from 'zustand';
import { getQuotationConfig } from '../services/configService';

interface OrderTypeConfig {
  minDays: number;
  maxDays: number;
}

interface OrderTypeLimits {
  micro: OrderTypeConfig;
  small: OrderTypeConfig;
  monthly: OrderTypeConfig;
  yearly: OrderTypeConfig;
}

interface QuotationConfigState {
  orderTypeLimits: OrderTypeLimits;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: OrderTypeLimits) => void;
}

const defaultLimits: OrderTypeLimits = {
  micro: { minDays: 1, maxDays: 10 },
  small: { minDays: 11, maxDays: 25 },
  monthly: { minDays: 26, maxDays: 30 },
  yearly: { minDays: 31, maxDays: 366 }
};

export const useQuotationConfigStore = create<QuotationConfigState>((set) => ({
  orderTypeLimits: defaultLimits,
  isLoading: false,
  error: null,
  fetchConfig: async () => {
    try {
      set({ isLoading: true, error: null });
      const config = await getQuotationConfig();
      if (config?.orderTypeLimits) {
        set({ orderTypeLimits: config.orderTypeLimits });
      }
    } catch (error) {
      set({ error: 'Failed to fetch quotation configuration' });
    } finally {
      set({ isLoading: false });
    }
  },
  updateConfig: (config: OrderTypeLimits) => {
    set({ orderTypeLimits: config });
  }
})); 