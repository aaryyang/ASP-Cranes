import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Template } from '../../types/template';
import { Quotation } from '../../types/quotation';
import { mergeQuotationWithTemplate } from '../../utils/templateMerger';

interface TemplatePreviewerProps {
  template: Template;
  quotation: Quotation;
  className?: string;
}

export function TemplatePreviewer({ template, quotation, className = '' }: TemplatePreviewerProps) {
  // Merge template with quotation data
  const mergedContent = mergeQuotationWithTemplate(quotation, template);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Template Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6 shadow-sm max-h-[800px] overflow-y-auto">
            <div 
              dangerouslySetInnerHTML={{ __html: mergedContent }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 