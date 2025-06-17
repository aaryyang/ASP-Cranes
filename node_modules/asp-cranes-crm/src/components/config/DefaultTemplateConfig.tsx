import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, FileText } from 'lucide-react';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Template } from '../../types/template';
import { Quotation } from '../../types/quotation';
import { mergeQuotationWithTemplate } from '../../utils/templateMerger';
import { getTemplates, updateTemplate } from '../../services/firestore/templateService';

interface DefaultTemplateConfigProps {
  onSave?: () => void;
}

// Sample quotation data for preview
const SAMPLE_QUOTATION: Quotation = {
  id: 'sample-quotation',
  leadId: 'sample-lead',
  customerId: 'sample-customer',
  customerName: 'Sample Company Ltd.',
  customerContact: {
    name: 'John Smith',
    email: 'john.smith@samplecompany.com',
    phone: '+91 98765 43210',
    company: 'Sample Company Ltd.',
    address: '123 Business Park, Tech City, State - 400001',
    designation: 'Procurement Manager'
  },
  orderType: 'monthly',
  numberOfDays: 30,
  workingHours: 8,
  selectedEquipment: {
    id: 'sample-equipment',
    equipmentId: 'crane-001',
    name: '50T Mobile Crane',
    baseRates: {
      micro: 5000,
      small: 4500,
      monthly: 4000,
      yearly: 3500
    }
  },
  foodResources: 2,
  accomResources: 2,
  siteDistance: 50,
  usage: 'normal',
  riskFactor: 'low',
  extraCharge: 5000,
  incidentalCharges: 10000,
  otherFactorsCharge: 2000,
  billing: 'gst',
  baseRate: 4000,
  includeGst: true,
  shift: 'single',
  dayNight: 'day',
  mobDemob: 15000,
  mobRelaxation: 5000,
  runningCostPerKm: 100,
  totalRent: 150000,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  status: 'draft'
};

export function DefaultTemplateConfig({ onSave }: DefaultTemplateConfigProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  useEffect(() => {
    loadTemplatesAndConfig();
  }, []);

  useEffect(() => {
    // Update selected template when ID changes
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  const loadTemplatesAndConfig = async () => {
    try {
      setIsLoading(true);
      const fetchedTemplates = await getTemplates();
      setTemplates(fetchedTemplates);
      
      // Find and set the default template
      const defaultTemplate = fetchedTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error loading templates and config:', error);
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
      
      // Update the old default template to non-default
      const oldDefaultTemplate = templates.find(t => t.isDefault);
      if (oldDefaultTemplate && oldDefaultTemplate.id !== selectedTemplateId) {
        await updateTemplate(oldDefaultTemplate.id, { isDefault: false });
      }

      // Update the new default template
      if (selectedTemplateId) {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
          await updateTemplate(template.id, { isDefault: true });
        }
      }
      
      // Refresh templates
      await loadTemplatesAndConfig();
      
      showToast('Default template configuration saved successfully');
      onSave?.();
    } catch (error) {
      console.error('Error saving default template config:', error);
      showToast('Error saving configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const templateOptions = [
    { value: '', label: 'No default template selected' },
    ...templates.map(template => ({
      value: template.id,
      label: template.name
    }))
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            <CardTitle>Default Quotation Template</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Default Template
              </label>
              <Select
                options={templateOptions}
                value={selectedTemplateId}
                onChange={setSelectedTemplateId}
                className="w-full max-w-md"
              />
              <p className="text-sm text-gray-500 mt-2">
                This template will be used as the default when creating new quotations.
              </p>
            </div>

            {selectedTemplateId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Selected Template
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {templates.find(t => t.id === selectedTemplateId)?.name}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {templates.find(t => t.id === selectedTemplateId)?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {templates.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900">
                      No Templates Available
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Create quotation templates first to set a default template.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={isSaving || templates.length === 0}
              leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Saving Configuration...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Preview */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 shadow-sm max-h-[800px] overflow-y-auto">
              <div 
                dangerouslySetInnerHTML={{ __html: mergeQuotationWithTemplate(SAMPLE_QUOTATION, selectedTemplate) }}
              />
            </div>
          </CardContent>
        </Card>
      )}

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