import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Template } from '../../types/template';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Toast } from '../common/Toast';
import { getAvailablePlaceholders, validateTemplate } from '../../utils/templateMerger';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Save,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  Type,
  Palette,
  Plus,
  RefreshCw
} from 'lucide-react';

interface RichTextTemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

const getDefaultTemplateContent = () => {
  return `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 15px;">
    <div style="text-align: center; margin-bottom: 15px;">
      <h1 style="color: #0052CC; margin: 0; font-size: 22px; font-weight: 600;">ASP CRANES</h1>
      <h2 style="color: #42526E; margin: 2px 0; font-size: 16px; font-weight: 500;">QUOTATION</h2>
      <hr style="border: none; height: 1px; background: #0052CC; margin: 8px 0 0 0;">
    </div>

    <table style="width: 100%; margin-bottom: 15px; font-size: 13px;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <strong style="color: #42526E;">From:</strong><br>
          <strong>{{company_name}}</strong><br>
          {{company_address}}<br>
          Phone: {{company_phone}}<br>
          Email: {{company_email}}<br>
          GST: {{company_gst}}
        </td>
        <td style="width: 50%; vertical-align: top;">
          <strong style="color: #42526E;">To:</strong><br>
          <strong>{{customer_name}}</strong><br>
          {{customer_designation}}<br>
          {{customer_company}}<br>
          {{customer_address}}<br>
          Phone: {{customer_phone}}<br>
          Email: {{customer_email}}
        </td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Quotation ID:</strong> {{quotation_number}}</td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Valid Until:</strong> {{valid_until}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Date:</strong> {{quotation_date}}</td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Order Type:</strong> {{order_type}}</td>
      </tr>
    </table>

    <div style="margin-bottom: 15px;">
      <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Equipment & Project Details</strong>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA; width: 160px;"><strong>Equipment</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{equipment_name}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Duration</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{project_duration}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Working Hours</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{working_hours}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Shift Type</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{shift_type}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Base Rate</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{base_rate}}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 15px;">
      <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Pricing Summary</strong>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">Subtotal</td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; text-align: right; width: 160px;">{{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;">GST (18%)</td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA; text-align: right;">{{gst_amount}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #0052CC; background: #0052CC; color: white; font-weight: 600;">Total Amount</td>
          <td style="padding: 6px 10px; border: 1px solid #0052CC; background: #0052CC; color: white; text-align: right; font-weight: 600;">{{total_amount}}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 15px;">
      <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Terms & Conditions</strong>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #42526E;">
        <li style="margin-bottom: 2px;">Payment Terms: {{payment_terms}}</li>
        <li style="margin-bottom: 2px;">GST @18% will be charged extra as applicable</li>
        <li style="margin-bottom: 2px;">Mobilization charges will be billed extra based on distance</li>
        <li style="margin-bottom: 2px;">Working hours: Standard 8-hour shift. Additional hours will be charged extra</li>
        <li style="margin-bottom: 2px;">Operator & fuel will be provided by ASP Cranes</li>
        <li style="margin-bottom: 2px;">Client to provide necessary permissions & clearances</li>
        <li style="margin-bottom: 2px;">Rate validity: {{validity_period}}</li>
        <li style="margin-bottom: 2px;">Insurance coverage as per standard terms</li>
      </ol>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #42526E; font-size: 13px;">
      <p style="margin: 0 0 2px 0;"><strong>Thank you for your business!</strong></p>
      <p style="margin: 0;">For any queries, please contact us at {{company_phone}} or email at {{company_email}}</p>
    </div>
  </div>`;
};

export function RichTextTemplateEditor({ template, onSave, onCancel }: RichTextTemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<Template>({
    ...template,
    content: template.content || getDefaultTemplateContent()
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Validate template content whenever it changes
    const result = validateTemplate(editedTemplate.content);
    setValidationResult(result);
  }, [editedTemplate.content]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowPreview(!showPreview);
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPreview, editedTemplate]);

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleSave = async () => {
    if (!editedTemplate.name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    if (!editedTemplate.content.trim()) {
      showToast('Please enter template content', 'error');
      return;
    }

    if (!validationResult.isValid) {
      showToast('Please fix template errors before saving', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const updatedTemplate = {
        ...editedTemplate,
        updatedAt: new Date()
      };

      await onSave(updatedTemplate);
      showToast('Template saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Failed to save template. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      setEditedTemplate(prev => ({
        ...prev,
        content: editorRef.current!.innerHTML
      }));
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const placeholderSpan = document.createElement('span');
      placeholderSpan.style.backgroundColor = '#dbeafe';
      placeholderSpan.style.color = '#1e40af';
      placeholderSpan.style.padding = '2px 4px';
      placeholderSpan.style.borderRadius = '4px';
      placeholderSpan.style.fontFamily = 'monospace';
      placeholderSpan.textContent = `{{${placeholder}}}`;
      
      range.deleteContents();
      range.insertNode(placeholderSpan);
      
      // Move cursor after the placeholder
      range.setStartAfter(placeholderSpan);
      range.setEndAfter(placeholderSpan);
      selection.removeAllRanges();
      selection.addRange(range);
      
      updateContent();
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const placeholders = getAvailablePlaceholders();
  const placeholdersByCategory = placeholders.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) {
      acc[placeholder.category] = [];
    }
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {} as Record<string, typeof placeholders>);

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Template Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">
                Template Name
              </label>
              <input
                type="text"
                id="template-name"
                value={editedTemplate.name}
                onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label htmlFor="template-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="template-description"
                value={editedTemplate.description}
                onChange={(e) => setEditedTemplate(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter template description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Template Content</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="template-content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="template-content"
                value={editedTemplate.content}
                onChange={(e) => setEditedTemplate(prev => ({ ...prev, content: e.target.value }))}
                rows={20}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                placeholder="Enter template content with {{placeholders}}"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(editedTemplate)}
        >
          Save Template
        </Button>
      </div>
    </div>
  );
}