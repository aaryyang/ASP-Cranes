import { useState, useEffect } from 'react';
import { Save, RefreshCw, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { FormInput } from '../components/common/FormInput';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { updateQuotationConfig, getDefaultTemplateConfig, updateDefaultTemplateConfig } from '../services/configService';
import { useQuotationConfigStore } from '../store/quotationConfigStore';
import { Select } from '../components/common/Select';
import { getTemplates } from '../services/firestore/templateService';
import { Template } from '../types/template';

const DefaultTemplateConfig = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<{saving: boolean, message: string, error: boolean}>({
    saving: false,
    message: '',
    error: false
  });

  useEffect(() => {
    loadTemplatesAndConfig();
  }, []);

  const loadTemplatesAndConfig = async () => {
    try {
      setIsLoading(true);
      // Load all templates
      const allTemplates = await getTemplates();
      setTemplates(allTemplates);
      
      // Get current default template config
      const defaultConfig = await getDefaultTemplateConfig();
      if (defaultConfig.defaultTemplateId) {
        setSelectedTemplateId(defaultConfig.defaultTemplateId);
      } else if (allTemplates.length > 0) {
        // If no default is set but templates exist, select the first one
        setSelectedTemplateId(allTemplates[0].id);
      }
    } catch (error) {
      console.error('Error loading templates and config:', error);
      setSaveStatus({
        saving: false,
        message: 'Error loading templates and config',
        error: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDefaultTemplate = async () => {
    if (!selectedTemplateId) {
      setSaveStatus({
        saving: false,
        message: 'Please select a template first',
        error: true
      });
      return;
    }

    try {
      setSaveStatus({
        saving: true,
        message: 'Saving...',
        error: false
      });

      await updateDefaultTemplateConfig(selectedTemplateId);
      
      setSaveStatus({
        saving: false,
        message: 'Default template saved successfully',
        error: false
      });
      
      setTimeout(() => {
        setSaveStatus({
          saving: false,
          message: '',
          error: false
        });
      }, 3000);
    } catch (error) {
      console.error('Error saving default template:', error);
      setSaveStatus({
        saving: false,
        message: 'Error saving default template',
        error: true
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Default Template Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Set the default template that will be used for quotation previews and emails.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Quotation Template
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  value={selectedTemplateId}
                  onChange={setSelectedTemplateId}
                  disabled={isLoading || templates.length === 0}
                  options={[
                    { value: '', label: 'Select a template...' },
                    ...templates.map(template => ({
                      value: template.id,
                      label: template.name
                    }))
                  ]}
                />
              </div>
              <Button
                onClick={handleSaveDefaultTemplate}
                disabled={isLoading || !selectedTemplateId || saveStatus.saving}
                leftIcon={saveStatus.saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              >
                Save Default
              </Button>
            </div>
            {saveStatus.message && (
              <p className={`mt-2 text-sm ${saveStatus.error ? 'text-red-600' : 'text-green-600'}`}>
                {saveStatus.message}
              </p>
            )}
            {templates.length === 0 && !isLoading && (
              <p className="mt-2 text-sm text-amber-600">
                No templates found. Please create a template first in the Quotation Templates section.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function QuotationConfig() {
  const { orderTypeLimits, fetchConfig, updateConfig } = useQuotationConfigStore();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; variant?: 'success' | 'error' }>({
    show: false,
    title: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    setToast({ show: true, title, variant });
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

      // Update the store with new values
      updateConfig(orderTypeLimits);
      
      showToast('Configuration saved successfully');
    } catch (error) {
      showToast('Error saving configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    orderType: keyof typeof orderTypeLimits,
    field: 'minDays' | 'maxDays',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    const newLimits = {
      ...orderTypeLimits,
      [orderType]: {
        ...orderTypeLimits[orderType],
        [field]: numValue
      }
    };
    updateConfig(newLimits);
  };
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Quotation Configuration</h1>
      
      <DefaultTemplateConfig />

      <Card>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(['micro', 'small', 'monthly', 'yearly'] as const).map((type) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="capitalize">{type} Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormInput
                    type="number"
                    label="Minimum Days"
                    value={orderTypeLimits[type].minDays}
                    onChange={(e) => handleInputChange(type, 'minDays', e.target.value)}
                    min="1"
                  />
                  <FormInput
                    type="number"
                    label="Maximum Days"
                    value={orderTypeLimits[type].maxDays}
                    onChange={(e) => handleInputChange(type, 'maxDays', e.target.value)}
                    min={orderTypeLimits[type].minDays + 1}
                  />
                </CardContent>
              </Card>
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
      </Card>
    </div>
  );
}