import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Send,
  Eye,
  Edit2,
  Trash2,
  FileText,
  IndianRupee,
  Calendar,
  User,
  Building2,
  X,
  Clock,
  MapPin,
  Truck,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { TemplatePreview } from '../components/quotations/TemplatePreview';
import { useAuthStore } from '../store/authStore';
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';
import { Deal } from '../types/deal';
import { getQuotations } from '../services/quotationService';
import { getDeals, getDealById } from '../services/dealService';
import { getDefaultTemplateConfig, getTemplateById } from '../services/configService';
import { mergeQuotationWithTemplate } from '../utils/templateMerger';
import { formatCurrency } from '../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export function QuotationManagement() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const [isEditingQuotation, setIsEditingQuotation] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [quotationsData, dealsData] = await Promise.all([
        getQuotations(),
        getDeals()
      ]);
      
      setQuotations(quotationsData);
      
      // Filter deals to only show qualified ones
      const qualifiedDeals = dealsData.filter(deal => 
        deal.stage === 'qualification' || deal.stage === 'proposal'
      );
      setDeals(qualifiedDeals);

      // Load default template
      await loadDefaultTemplate();
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load quotations. Please try again.');
      showToast('Error fetching data', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const loadDefaultTemplate = async () => {
    try {
      const config = await getDefaultTemplateConfig();
      
      // First try to get the default template from config
      if (config.defaultTemplateId) {
        const template = await getTemplateById(config.defaultTemplateId);
        if (template) {
          console.log("Loaded template from config:", template);
          setDefaultTemplate(template);
          return;
        }
      }
      
      // If no template found, use the default template from templateService
      try {
        // Try to get all templates
        const templateService = await import('../services/firestore/templateService');
        const templates = await templateService.getTemplates();
        
        if (templates && templates.length > 0) {
          // Use the first template or the one marked as default
          const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
          console.log("Loaded template from templateService:", defaultTemplate);
          setDefaultTemplate(defaultTemplate);
          return;
        }
      } catch (e) {
        console.error("Error loading templates from service:", e);
      }
      
      // If still no template, create a fallback template
      const fallbackTemplate = {
        id: 'fallback-template',
        name: 'Default Template',
        description: 'Standard quotation template',
        content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 15px;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h1 style="color: #0052CC; margin: 0; font-size: 22px; font-weight: 600;">ASP CRANES</h1>
            <h2 style="color: #42526E; margin: 2px 0; font-size: 16px; font-weight: 500;">QUOTATION</h2>
            <hr style="border: none; height: 1px; background: #0052CC; margin: 8px 0 0 0;">
          </div>
          <div style="margin-bottom: 15px;">
            <p><strong>Equipment:</strong> {{equipment_name}}</p>
            <p><strong>Duration:</strong> {{project_duration}}</p>
            <p><strong>Total Amount:</strong> {{total_amount}}</p>
          </div>
        </div>`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true
      };
      
      console.log("Using fallback template");
      setDefaultTemplate(fallbackTemplate);
    } catch (error) {
      console.error('Error loading default template:', error);
      
      // Final fallback - always set some template
      const emergencyTemplate = {
        id: 'emergency-template',
        name: 'Basic Template',
        description: 'Basic quotation template',
        content: '<div style="padding: 20px; font-family: Arial;">Basic quotation for {{equipment_name}}</div>',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true
      };
      
      setDefaultTemplate(emergencyTemplate);
    }
  };

  const filterQuotations = () => {
    let filtered = [...quotations];

    if (searchTerm) {
      filtered = filtered.filter(quotation =>
        (quotation.customerContact?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.customerContact?.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.selectedEquipment?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(quotation => quotation.status === statusFilter);
    }

    setFilteredQuotations(filtered);
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success',
    description?: string
  ) => {
    setToast({
      show: true,
      title,
      description,
      variant
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
      setToast({ show: false, title: '' });
    }, 5000);
  };

  const handleProceedWithDeal = () => {
    if (!selectedDealId) {
      showToast('Please select a deal', 'warning');
      return;
    }

    // Navigate to quotation creation with the selected deal
    navigate(`/quotations/create?dealId=${selectedDealId}`);
    
    setSelectedDealId('');
  };

  const handleEditQuotation = async (quotation: Quotation) => {
    try {
      setIsEditingQuotation(quotation.id);
      console.log('Editing quotation:', quotation);
      
      if (!quotation.leadId) {
        showToast('Invalid quotation data', 'error', 'Missing lead ID');
        return;
      }

      // Verify that the deal still exists
      const deal = await getDealById(quotation.leadId);
      if (!deal) {
        showToast('Associated deal not found', 'error', 'The deal associated with this quotation no longer exists');
        return;
      }

      console.log('Navigating to:', `/quotations/create?dealId=${quotation.leadId}&quotationId=${quotation.id}`);
      navigate(`/quotations/create?dealId=${quotation.leadId}&quotationId=${quotation.id}`);
    } catch (error) {
      console.error('Error preparing quotation edit:', error);
      showToast('Error preparing quotation edit', 'error');
    } finally {
      setIsEditingQuotation(null);
    }
  };

  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      setIsGeneratingPDF(true);
      
      if (!defaultTemplate) {
        showToast('No default template configured', 'warning', 'Please set a default template in Configuration settings.');
        return;
      }

      // Use the template merger utility to get the merged content
      const content = mergeQuotationWithTemplate(quotation, defaultTemplate);
      
      // Create a new window with the content for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Popup blocked', 'error', 'Please allow popups to download PDF.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quotation - ${quotation.customerContact?.name || 'Customer'}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      
      showToast('PDF generated successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendToCustomer = async (quotation: Quotation) => {
    try {
      setIsSendingEmail(true);
      
      if (!defaultTemplate) {
        showToast('No default template configured', 'warning', 'Please set a default template in Configuration settings.');
        return;
      }

      // Use the template merger utility
      const content = mergeQuotationWithTemplate(quotation, defaultTemplate);
      
      // Create mailto link with the quotation content      // Create a more descriptive equipment text based on whether we have multiple machines
      let equipmentDescription = quotation.selectedEquipment.name;
      
      if (quotation.selectedMachines && quotation.selectedMachines.length > 1) {
        equipmentDescription = `${quotation.selectedMachines.length} machines (${quotation.selectedMachines.map(m => m.name).join(', ')})`;
      } else if (quotation.selectedMachines && quotation.selectedMachines.length === 1) {
        equipmentDescription = quotation.selectedMachines[0].name;
      }
      
      const subject = `Quotation from ASP Cranes - ${quotation.id.slice(0, 8).toUpperCase()}`;
      const emailBody = `Dear ${quotation.customerContact.name || 'Customer'},

Please find your quotation details for ${equipmentDescription} below:

${content}

Best regards,
ASP Cranes Team`;
      
      const mailtoLink = `mailto:${quotation.customerContact.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink);
      
      showToast('Email prepared successfully', 'success', 'Your email client should open with the quotation details.');
    } catch (error) {
      console.error('Error sending to customer:', error);
      showToast('Error preparing email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Transform deals into select options
  const dealOptions = useMemo(() => {
    if (deals.length === 0) return [{ value: '', label: 'No deals available' }];
    
    return deals.map(deal => ({
      value: deal.id,
      label: `${deal.customer?.name || 'Unnamed'} - ${deal.customer?.company || 'No Company'} (${formatCurrency(deal.value)})`
    }));
  }, [deals]);

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quotation Management</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Create, manage, and send quotations to customers
            </p>
          </div>          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Quotation
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by customer, company or equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              disabled={isLoading}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              leftIcon={<Filter className="w-4 h-4" />}
              disabled={isLoading}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quotation History</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <X className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No quotations found</p>
                <p className="text-sm">Create a new quotation to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Equipment
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Duration
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Total Rent
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQuotations.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-start flex-col">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {quotation.customerContact.name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {quotation.customerContact.company}
                            </div>
                            {/* Mobile-only equipment info */}
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              {quotation.selectedEquipment?.name || 
                               (quotation.selectedMachines && quotation.selectedMachines.length > 0 ? 
                                `${quotation.selectedMachines.length} machine(s)` : 'No equipment')}
                            </div>
                            {/* Mobile-only total info */}
                            <div className="text-xs font-medium text-gray-800 sm:hidden mt-1">
                              {formatCurrency(quotation.totalRent)}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          {quotation.selectedMachines && quotation.selectedMachines.length > 0 ? (
                            <>
                              <div className="text-xs sm:text-sm text-gray-900">
                                {quotation.selectedMachines.map(machine => machine.name).join(', ')}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {quotation.selectedMachines.length} machine{quotation.selectedMachines.length > 1 ? 's' : ''}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs sm:text-sm text-gray-900">{quotation.selectedEquipment?.name || 'N/A'}</div>
                              <div className="text-xs sm:text-sm text-gray-500">{quotation.machineType || 'N/A'}</div>
                            </>
                          )}
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <div className="text-xs sm:text-sm text-gray-900">{quotation.numberOfDays} days</div>
                          <div className="text-xs sm:text-sm text-gray-500">{quotation.workingHours} hrs/day</div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 hidden sm:table-cell text-xs sm:text-sm text-gray-900">
                          {formatCurrency(quotation.totalRent)}
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4">
                          <StatusBadge status={quotation.status} />
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleEditQuotation(quotation)}
                              title="Edit Quotation"
                              disabled={isLoading || isEditingQuotation === quotation.id}
                            >
                              {isEditingQuotation === quotation.id ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Edit2 size={14} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setIsPreviewOpen(true);
                              }}
                              title="Preview Quotation"
                              disabled={!defaultTemplate || isLoading}
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleDownloadPDF(quotation)}
                              disabled={isGeneratingPDF || !defaultTemplate || isLoading}
                              title="Download PDF"
                            >
                              {isGeneratingPDF ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleSendToCustomer(quotation)}
                              disabled={isSendingEmail || !defaultTemplate || isLoading}
                              title="Send to Customer"
                            >
                              {isSendingEmail ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Quotation Modal - Deal Selection */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedDealId('');
          }}
          title="Create New Quotation"
          size="lg"
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-4">
                Select a Qualified Deal
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Choose from qualified deals to create a quotation. Only deals in qualification or proposal stage are shown.
              </p>              <Select
                options={isLoading ? [{ value: '', label: 'Loading deals...' }] : [
                  { value: '', label: 'Select a Deal' },
                  ...dealOptions.filter(option => option.value !== '')
                ]}
                value={selectedDealId}
                onChange={setSelectedDealId}
                label="Available Deals"
                disabled={isLoading}
                required
              />
              
              {selectedDealId && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const selectedDeal = deals.find(d => d.id === selectedDealId);
                    if (!selectedDeal) return null;
                    
                    return (
                      <div className="space-y-2">
                        <h4 className="text-sm sm:text-base font-medium text-blue-900">Selected Deal Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">Customer:</span>
                            <p className="text-blue-800">{selectedDeal.customer.name}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Company:</span>
                            <p className="text-blue-800">{selectedDeal.customer.company}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Value:</span>
                            <p className="text-blue-800">{formatCurrency(selectedDeal.value)}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Stage:</span>
                            <p className="text-blue-800 capitalize">{selectedDeal.stage}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSelectedDealId('');
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedWithDeal}
                disabled={!selectedDealId || isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Quotation
              </Button>
            </div>
          </div>
        </Modal>

        {/* Template Preview Modal */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Quotation Preview"
          size="full"
        >
          {selectedQuotation && defaultTemplate && (
            <TemplatePreview
              quotation={selectedQuotation}
              template={defaultTemplate}
              onDownloadPDF={() => handleDownloadPDF(selectedQuotation)}
              onSendEmail={() => handleSendToCustomer(selectedQuotation)}
            />
          )}
        </Modal>

        {toast.show && (
          <Toast
            title={toast.title}
            variant={toast.variant}
            isVisible={toast.show}
            onClose={() => setToast({ show: false, title: '' })}
          />
        )}
      </div>
    </div>
  );
}