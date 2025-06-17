import React from 'react';
import { Modal } from '../common/Modal';
import { Template } from '../../types/template';
import { RefreshCw } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

const sampleData = {
  company_name: 'ASP Cranes',
  company_address: '123 Industrial Park, Mumbai, India',
  company_phone: '+91 98765 43210',
  company_email: 'info@aspcranes.com',
  company_gst: 'GST123456789',
  customer_name: 'John Smith',
  customer_designation: 'Project Manager',
  customer_company: 'ABC Construction Ltd.',
  customer_address: '456 Construction Site, Delhi, India',
  customer_phone: '+91 98765 12345',
  customer_email: 'john@abcconstruction.com',
  quotation_number: 'QT-2024-001',
  valid_until: '2024-04-30',
  quotation_date: '2024-03-31',
  order_type: 'Rental',
  equipment_name: 'Mobile Crane - 50T',
  project_duration: '30 days',
  working_hours: '8 hours per day',
  shift_type: 'Single Shift',
  base_rate: '₹25,000 per day',
  subtotal: '₹750,000',
  gst_amount: '₹135,000',
  total_amount: '₹885,000',
  payment_terms: '50% advance, 50% within 30 days',
  validity_period: '30 days'
};

export function PreviewModal({ isOpen, onClose, template }: PreviewModalProps) {
  if (!isOpen) return null;

  if (!template || !template.content) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Template Preview"
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4" />
          <p>Loading template...</p>
        </div>
      </Modal>
    );
  }

  try {
    // Replace placeholders with sample data
    const previewContent = Object.entries(sampleData).reduce(
      (content, [key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        return content.replace(regex, value);
      },
      template.content
    );

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Template Preview"
        size="lg"
      >
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewContent }} />
      </Modal>
    );
  } catch (error) {
    console.error('Error rendering template preview:', error);
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Template Preview"
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-8 text-red-500">
          <p>Error rendering template preview</p>
          <p className="text-sm mt-2">Please check the template content for any issues.</p>
        </div>
      </Modal>
    );
  }
} 