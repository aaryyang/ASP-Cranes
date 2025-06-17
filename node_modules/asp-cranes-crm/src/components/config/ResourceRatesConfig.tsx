import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, IndianRupee, Users } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { getResourceRatesConfig, updateResourceRatesConfig } from '../../services/configService';

export function ResourceRatesConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rates, setRates] = useState({
    foodRatePerMonth: 2500,
    accommodationRatePerMonth: 4000
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
      const config = await getResourceRatesConfig();
      setRates({
        foodRatePerMonth: config.foodRatePerMonth,
        accommodationRatePerMonth: config.accommodationRatePerMonth
      });
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
      
      // Validate rates
      if (rates.foodRatePerMonth <= 0 || rates.accommodationRatePerMonth <= 0) {
        showToast('Rates must be greater than 0', 'error');
        return;
      }

      await updateResourceRatesConfig(rates);
      showToast('Rates updated successfully');
    } catch (error) {
      showToast('Error saving rates', 'error');
    } finally {
      setIsSaving(false);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary-500" />
            <h3 className="font-medium text-gray-900">Food Allowance</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rate
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <Input
                  type="number"
                  value={rates.foodRatePerMonth}
                  onChange={(e) => setRates(prev => ({
                    ...prev,
                    foodRatePerMonth: Number(e.target.value)
                  }))}
                  className="pl-7"
                  min="0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Daily Rate:</span>
              <span className="font-medium text-gray-900">₹{(rates.foodRatePerMonth / 26).toFixed(2)}/day</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary-500" />
            <h3 className="font-medium text-gray-900">Accommodation Allowance</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rate
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <Input
                  type="number"
                  value={rates.accommodationRatePerMonth}
                  onChange={(e) => setRates(prev => ({
                    ...prev,
                    accommodationRatePerMonth: Number(e.target.value)
                  }))}
                  className="pl-7"
                  min="0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Daily Rate:</span>
              <span className="font-medium text-gray-900">₹{(rates.accommodationRatePerMonth / 26).toFixed(2)}/day</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
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