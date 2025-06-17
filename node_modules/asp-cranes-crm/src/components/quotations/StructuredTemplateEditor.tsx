import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Select } from '../common/Select';
import { Template } from '../../types/template';
import { FileText, Layout, Type } from 'lucide-react';

interface TemplateSection {
  id: string;
  title: string;
  content: string;
}

interface StructuredTemplateEditorProps {
  template: Template;
  onChange: (updatedTemplate: Template) => void;
}

const defaultSections: TemplateSection[] = [
  {
    id: 'header',
    title: 'Header Section',
    content: `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0052CC; margin: 0;">{{company_name}}</h1>
        <p style="margin: 5px 0;">{{company_address}}</p>
        <p>Phone: {{company_phone}} | Email: {{company_email}}</p>
        <h2 style="color: #42526E; margin: 10px 0;">QUOTATION</h2>
      </div>
    `
  },
  {
    id: 'customer',
    title: 'Customer Information',
    content: `
      <div style="margin-bottom: 20px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <strong>To:</strong><br/>
              {{customer_name}}<br/>
              {{customer_designation}}<br/>
              {{customer_company}}<br/>
              {{customer_address}}
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <strong>Quotation Details:</strong><br/>
              Quotation No: {{quotation_number}}<br/>
              Date: {{quotation_date}}<br/>
              Valid Until: {{valid_until}}
            </td>
          </tr>
        </table>
      </div>
    `
  },
  {
    id: 'equipment',
    title: 'Equipment Details',
    content: `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #42526E;">Equipment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Equipment</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{{equipment_name}}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Duration</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{{project_duration}}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Working Hours</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{{working_hours}}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Base Rate</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{{base_rate}}</td>
          </tr>
        </table>
      </div>
    `
  },
  {
    id: 'pricing',
    title: 'Pricing Details',
    content: `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #42526E;">Pricing Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Subtotal</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{{subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>GST (18%)</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{{gst_amount}}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">{{total_amount}}</td>
          </tr>
        </table>
      </div>
    `
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    content: `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #42526E;">Terms & Conditions</h3>
        <ol style="padding-left: 20px;">
          <li>Payment Terms: {{payment_terms}}</li>
          <li>Validity: {{validity_period}}</li>
          <li>GST Registration: {{company_gst}}</li>
          <li>PAN: {{company_pan}}</li>
        </ol>
      </div>
    `
  }
];

export function StructuredTemplateEditor({ template, onChange }: StructuredTemplateEditorProps) {
  const [sections, setSections] = useState<TemplateSection[]>(() => {
    // If template is empty or new, use default sections
    if (!template.content) {
      return defaultSections;
    }
    
    // Try to parse existing template into sections
    try {
      return defaultSections.map(defaultSection => {
        const sectionMatch = template.content?.match(new RegExp(`<!-- BEGIN ${defaultSection.id} -->(.*?)<!-- END ${defaultSection.id} -->`, 's'));
        return {
          ...defaultSection,
          content: sectionMatch ? sectionMatch[1].trim() : defaultSection.content
        };
      });
    } catch (error) {
      console.error('Error parsing template sections:', error);
      return defaultSections;
    }
  });

  const [selectedSection, setSelectedSection] = useState<string>(sections[0].id);
  const [styles, setStyles] = useState<string>(template.styles || '');

  const handleSectionChange = (sectionId: string, content: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, content } : section
    );
    setSections(updatedSections);
    updateTemplate(updatedSections);
  };

  const updateTemplate = (updatedSections: TemplateSection[]) => {
    // Combine all sections into a single template
    const content = updatedSections.map(section => `
      <!-- BEGIN ${section.id} -->
      ${section.content}
      <!-- END ${section.id} -->
    `).join('\n');

    onChange({
      ...template,
      content: content,
      styles
    });
  };

  const currentSection = sections.find(s => s.id === selectedSection);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Template Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {sections.map(section => (
              <Button
                key={section.id}
                variant={selectedSection === section.id ? 'default' : 'outline'}
                onClick={() => setSelectedSection(section.id)}
              >
                {section.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Edit {currentSection.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <TextArea
                  value={currentSection.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSectionChange(currentSection.id, e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Available Placeholders</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getPlaceholdersForSection(currentSection.id).map(placeholder => (
                    <div
                      key={placeholder}
                      className="text-xs bg-white px-2 py-1 rounded border border-blue-200 cursor-pointer hover:bg-blue-50"
                      onClick={() => {
                        const textArea = document.querySelector('textarea');
                        if (textArea) {
                          const start = textArea.selectionStart;
                          const end = textArea.selectionEnd;
                          const value = textArea.value;
                          const newValue = value.substring(0, start) + `{{${placeholder}}}` + value.substring(end);
                          handleSectionChange(currentSection.id, newValue);
                          // Reset cursor position
                          setTimeout(() => {
                            textArea.focus();
                            textArea.setSelectionRange(start + placeholder.length + 4, start + placeholder.length + 4);
                          }, 0);
                        }
                      }}
                    >
                      {`{{${placeholder}}}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Styles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TextArea
            value={styles}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setStyles(e.target.value);
              onChange({ ...template, styles: e.target.value });
            }}
            rows={5}
            className="font-mono text-sm"
            placeholder="Add custom CSS styles here..."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function getPlaceholdersForSection(sectionId: string): string[] {
  switch (sectionId) {
    case 'header':
      return ['company_name', 'company_address', 'company_phone', 'company_email'];
    case 'customer':
      return [
        'customer_name',
        'customer_designation',
        'customer_company',
        'customer_address',
        'quotation_number',
        'quotation_date',
        'valid_until'
      ];
    case 'equipment':
      return [
        'equipment_name',
        'project_duration',
        'working_hours',
        'shift_type',
        'base_rate'
      ];
    case 'pricing':
      return ['subtotal', 'gst_amount', 'total_amount'];
    case 'terms':
      return [
        'payment_terms',
        'validity_period',
        'company_gst',
        'company_pan'
      ];
    default:
      return [];
  }
} 