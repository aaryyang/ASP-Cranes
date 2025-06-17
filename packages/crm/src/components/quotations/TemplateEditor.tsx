import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Template } from '../../types/template';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Eye, Save, FileText } from 'lucide-react';
import { Toast } from '../common/Toast';

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

// Mock data for placeholder replacement
const MOCK_DATA = {
  customer_name: 'John Doe',
  customer_email: 'john.doe@abcconstruction.com',
  customer_phone: '+91 98765 43210',
  customer_company: 'ABC Construction Ltd.',
  customer_address: '456 Building Site, Construction Zone, Mumbai 400001',
  customer_designation: 'Project Manager',
  quotation_id: 'QT-2024-001',
  quotation_date: new Date().toLocaleDateString('en-IN'),
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
  equipment_name: 'Hydraulic Crane XL2000',
  equipment_capacity: '50 tons',
  project_duration: '30 days',
  working_hours: '8 hours/day',
  total_amount: '₹1,50,000',
  base_rate: '₹2,500/hour',
  site_location: 'Mumbai Construction Site',
  company_name: 'ASP Cranes',
  company_address: '123 Industrial Area, Mumbai, Maharashtra 400001',
  company_phone: '+91 22 1234 5678',
  company_email: 'info@aspcranes.com',
  company_gst: '27AABCS1429B1ZB'
};

const DEFAULT_TEMPLATE_CONTENT = `QUOTATION

From: {{company_name}}
{{company_address}}
Phone: {{company_phone}}
Email: {{company_email}}
GST: {{company_gst}}

To: {{customer_name}}
{{customer_designation}}
{{customer_company}}
{{customer_address}}
Phone: {{customer_phone}}
Email: {{customer_email}}

Date: {{quotation_date}}
Quotation ID: {{quotation_id}}
Valid Until: {{valid_until}}

Equipment Details:
- Equipment: {{equipment_name}}
- Capacity: {{equipment_capacity}}
- Duration: {{project_duration}}
- Working Hours: {{working_hours}}
- Base Rate: {{base_rate}}
- Site Location: {{site_location}}

Total Amount: {{total_amount}}

Terms & Conditions:
1. Payment Terms: 50% advance, balance against monthly bills
2. GST @18% will be charged extra as applicable
3. Mobilization charges will be billed extra based on distance
4. Working hours: Standard 8-hour shift. Additional hours will be charged extra
5. Operator & fuel will be provided by ASP Cranes

Thank you for your business!

Best regards,
{{company_name}}`;

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<Template>({
    ...template,
    content: template.content || DEFAULT_TEMPLATE_CONTENT
  });
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleSave = () => {
    if (!editedTemplate.name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    if (!editedTemplate.content.trim()) {
      showToast('Please enter template content', 'error');
      return;
    }

    const updatedTemplate = {
      ...editedTemplate,
      updatedAt: new Date()
    };

    onSave(updatedTemplate);
    showToast('Template saved successfully!', 'success');
  };

  const replaceTemplatePlaceholders = (content: string): string => {
    let result = content;
    Object.entries(MOCK_DATA).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, value);
    });
    return result;
  };

  const getAvailablePlaceholders = (): string[] => {
    return Object.keys(MOCK_DATA).map(key => `{{${key}}}`);
  };

  return (
    <div className="space-y-6">
      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Template Name"
            value={editedTemplate.name}
            onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
            disabled={editedTemplate.isDefault}
            placeholder="Enter template name"
          />
          
          <Input
            label="Description"
            value={editedTemplate.description}
            onChange={(e) => setEditedTemplate(prev => ({ ...prev, description: e.target.value }))}
            disabled={editedTemplate.isDefault}
            placeholder="Enter template description"
          />
        </CardContent>
      </Card>

      {/* Available Placeholders */}
      <Card>
        <CardHeader>
          <CardTitle>Available Placeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {getAvailablePlaceholders().map((placeholder) => (
              <div
                key={placeholder}
                className="text-xs font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => {
                  // Add placeholder to template content at cursor position
                  const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const newContent = 
                      editedTemplate.content.substring(0, start) + 
                      placeholder + 
                      editedTemplate.content.substring(end);
                    setEditedTemplate(prev => ({ ...prev, content: newContent }));
                    
                    // Restore cursor position
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
                    }, 0);
                  }
                }}
                title="Click to insert at cursor position"
              >
                {placeholder}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Click on any placeholder to insert it at your cursor position in the template.
          </p>
        </CardContent>
      </Card>

      {/* Template Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Template Content</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TextArea
              id="template-content"
              value={editedTemplate.content}
              onChange={(e) => setEditedTemplate(prev => ({ ...prev, content: e.target.value }))}
              rows={20}
              className="font-mono text-sm"
              placeholder="Enter your template content with {{placeholders}}"
            />
            <p className="text-sm text-gray-500 mt-2">
              Use placeholders like {{customer_name}} in your template. They will be replaced with actual values when generating quotations.
            </p>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Preview with Mock Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {replaceTemplatePlaceholders(editedTemplate.content)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={editedTemplate.isDefault}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Template
        </Button>
      </div>

      {/* Toast Notifications */}
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