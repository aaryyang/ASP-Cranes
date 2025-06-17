import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { getQuotationConfig, updateQuotationConfig } from '../../services/configService';

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

export function QuotationConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [orderTypeLimits, setOrderTypeLimits] = useState<OrderTypeLimits>({
    micro: { minDays: 1, maxDays: 10 },
    small: { minDays: 11, maxDays: 25 },
    monthly: { minDays: 26, maxDays: 365 },
    yearly: { minDays: 366, maxDays: 3650 }
  });
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const config = await getQuotationConfig();
      setOrderTypeLimits(config.orderTypeLimits);
    } catch (error) {
      showToast('Error loading configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate the configuration
      const orderTypes = ['micro', 'small', 'monthly', 'yearly'] as const;
      let isValid = true;
      let previousMax = 0;

      for (const type of orderTypes) {
        const config = orderTypeLimits[type];
        if (config.minDays <= previousMax) {
          showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} minimum days must be greater than previous maximum`, 'error');
          isValid = false;
          break;
        }
        if (config.maxDays <= config.minDays) {
          showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} maximum days must be greater than minimum days`, 'error');
          isValid = false;
          break;
        }
        previousMax = config.maxDays;
      }

      if (!isValid) {
        return;
      }

      await updateQuotationConfig({
        orderTypeLimits
      });
      
      showToast('Configuration saved successfully');
    } catch (error) {
      showToast('Error saving configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    orderType: keyof OrderTypeLimits,
    field: 'minDays' | 'maxDays',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setOrderTypeLimits(prev => ({
      ...prev,
      [orderType]: {
        ...prev[orderType],
        [field]: numValue
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['micro', 'small', 'monthly', 'yearly'] as const).map((type) => (
          <div
            key={type}
            className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm space-y-4"
          >
            <h3 className="text-lg font-semibold capitalize text-gray-900">
              {type} Order
            </h3>
            <div className="space-y-4">
              <div>
                <Input
                  type="number"
                  label="Minimum Days"
                  value={orderTypeLimits[type].minDays}
                  onChange={(e) => handleInputChange(type, 'minDays', e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Input
                  type="number"
                  label="Maximum Days"
                  value={orderTypeLimits[type].maxDays}
                  onChange={(e) => handleInputChange(type, 'maxDays', e.target.value)}
                  min={orderTypeLimits[type].minDays + 1}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
} 