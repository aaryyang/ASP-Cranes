import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Percent, AlertTriangle, Wrench, IndianRupee } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { getAdditionalParamsConfig, updateAdditionalParamsConfig } from '../../services/configService';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';

export function AdditionalParamsConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [params, setParams] = useState({
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
      const config = await getAdditionalParamsConfig();
      setParams(config);
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
      await updateAdditionalParamsConfig(params);
      showToast('Parameters updated successfully');
    } catch (error) {
      showToast('Error saving parameters', 'error');
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

  const RateInput = ({ 
    value, 
    onChange, 
    label, 
    isPercentage = false 
  }: { 
    value: number; 
    onChange: (value: number) => void; 
    label: string;
    isPercentage?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative mt-1">
        {!isPercentage && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">₹</span>
          </div>
        )}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={isPercentage ? "pr-8" : "pl-7"}
          min="0"
        />
        {isPercentage && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Percent className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Rates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-500" />
              <CardTitle>Usage Rates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Light Usage Rate"
              value={params.usageRates.light}
              onChange={(value) => setParams(prev => ({
                ...prev,
                usageRates: { ...prev.usageRates, light: value }
              }))}
              isPercentage
            />
            <RateInput
              label="Heavy Usage Rate"
              value={params.usageRates.heavy}
              onChange={(value) => setParams(prev => ({
                ...prev,
                usageRates: { ...prev.usageRates, heavy: value }
              }))}
              isPercentage
            />
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary-500" />
              <CardTitle>Risk Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Low Risk"
              value={params.riskFactors.low}
              onChange={(value) => setParams(prev => ({
                ...prev,
                riskFactors: { ...prev.riskFactors, low: value }
              }))}
              isPercentage
            />
            <RateInput
              label="Medium Risk"
              value={params.riskFactors.medium}
              onChange={(value) => setParams(prev => ({
                ...prev,
                riskFactors: { ...prev.riskFactors, medium: value }
              }))}
              isPercentage
            />
            <RateInput
              label="High Risk"
              value={params.riskFactors.high}
              onChange={(value) => setParams(prev => ({
                ...prev,
                riskFactors: { ...prev.riskFactors, high: value }
              }))}
              isPercentage
            />
          </CardContent>
        </Card>

        {/* Incidental Charges */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary-500" />
              <CardTitle>Incidental Charges</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Incident 1"
              value={params.incidentalCharges.incident1}
              onChange={(value) => setParams(prev => ({
                ...prev,
                incidentalCharges: { ...prev.incidentalCharges, incident1: value }
              }))}
            />
            <RateInput
              label="Incident 2"
              value={params.incidentalCharges.incident2}
              onChange={(value) => setParams(prev => ({
                ...prev,
                incidentalCharges: { ...prev.incidentalCharges, incident2: value }
              }))}
            />
            <RateInput
              label="Incident 3"
              value={params.incidentalCharges.incident3}
              onChange={(value) => setParams(prev => ({
                ...prev,
                incidentalCharges: { ...prev.incidentalCharges, incident3: value }
              }))}
            />
          </CardContent>
        </Card>

        {/* Other Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-500" />
              <CardTitle>Other Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Rigger"
              value={params.otherFactors.rigger}
              onChange={(value) => setParams(prev => ({
                ...prev,
                otherFactors: { ...prev.otherFactors, rigger: value }
              }))}
            />
            <RateInput
              label="Helper"
              value={params.otherFactors.helper}
              onChange={(value) => setParams(prev => ({
                ...prev,
                otherFactors: { ...prev.otherFactors, helper: value }
              }))}
            />
            <RateInput
              label="Area"
              value={params.otherFactors.area}
              onChange={(value) => setParams(prev => ({
                ...prev,
                otherFactors: { ...prev.otherFactors, area: value }
              }))}
            />
            <RateInput
              label="Condition"
              value={params.otherFactors.condition}
              onChange={(value) => setParams(prev => ({
                ...prev,
                otherFactors: { ...prev.otherFactors, condition: value }
              }))}
            />
            <RateInput
              label="Customer Reputation"
              value={params.otherFactors.customerReputation}
              onChange={(value) => setParams(prev => ({
                ...prev,
                otherFactors: { ...prev.otherFactors, customerReputation: value }
              }))}
            />
          </CardContent>
        </Card>
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