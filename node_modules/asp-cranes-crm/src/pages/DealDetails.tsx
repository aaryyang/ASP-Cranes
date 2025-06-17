import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, User, RefreshCw, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { getDealById, updateDealStage } from '../services/dealService';
import { getQuotationsForLead } from '../services/quotationService';
import { Deal } from '../types/deal';
import { SelectedMachine, Quotation } from '../types/quotation';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';

const STAGE_OPTIONS = [
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // State to store quotations data with _ prefix since we only need it for processing
  const [_, setQuotations] = useState<Quotation[]>([]);
  const [equipmentList, setEquipmentList] = useState<SelectedMachine[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);
  
  useEffect(() => {
    if (deal?.leadId) {
      fetchDealEquipment(deal.leadId);
    }
  }, [deal]);
  const fetchDeal = async () => {
    try {
      setIsLoading(true);
      const dealData = await getDealById(id!);
      if (!dealData) {
        showToast('Deal not found', 'error');
        navigate('/deals');
        return;
      }
      setDeal(dealData);
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast('Error fetching deal details', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchDealEquipment = async (leadId: string) => {
    try {
      setLoadingEquipment(true);
      const quotationList = await getQuotationsForLead(leadId);
      setQuotations(quotationList);
      
      // Extract and flatten all equipment from quotations
      const allEquipment: SelectedMachine[] = [];
      quotationList.forEach(quotation => {
        if (quotation.selectedMachines && quotation.selectedMachines.length > 0) {
          quotation.selectedMachines.forEach(machine => {
            // Avoid duplicates
            if (!allEquipment.some(equip => equip.id === machine.id)) {
              allEquipment.push(machine);
            }
          });
        } else if (quotation.selectedEquipment && quotation.selectedEquipment.id) {
          // Convert legacy selectedEquipment to SelectedMachine format
          const legacyEquipment: SelectedMachine = {
            id: quotation.selectedEquipment.id,
            machineType: quotation.machineType,
            equipmentId: quotation.selectedEquipment.equipmentId,
            name: quotation.selectedEquipment.name,
            baseRates: quotation.selectedEquipment.baseRates,
            baseRate: quotation.selectedEquipment.baseRates[quotation.orderType],
            runningCostPerKm: quotation.runningCostPerKm,
            quantity: 1
          };
          
          // Avoid duplicates
          if (!allEquipment.some(equip => equip.id === legacyEquipment.id)) {
            allEquipment.push(legacyEquipment);
          }
        }
      });
      
      setEquipmentList(allEquipment);
    } catch (error) {
      console.error('Error fetching deal equipment:', error);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const handleStageChange = async (newStage: Deal['stage']) => {
    if (!deal) return;

    try {
      const updatedDeal = await updateDealStage(deal.id, newStage);
      if (updatedDeal) {
        setDeal(updatedDeal);
        showToast(`Deal stage updated to ${newStage}`, 'success');
      }
    } catch (error) {
      console.error('Error updating deal stage:', error);
      showToast('Error updating deal stage', 'error');
    }
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-8 text-gray-500">
        Deal not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/deals')}
            size="sm"
            className="p-1 sm:p-2"
          >
            <ArrowLeft size={16} className="sm:mr-2" />
            <span className="hidden sm:inline">Back to Deals</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Deal Details
          </h1>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      <div className="sm:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Value</div>
                <div className="text-base font-semibold text-gray-900">
                  {formatCurrency(deal.value)}
                </div>
              </div>
              <Button
                className="text-xs"
                size="sm"
                onClick={() => navigate(`/quotations/create?dealId=${deal.id}`)}
              >
                Create Quotation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Deal Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">{deal.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{deal.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500">Deal Value</div>
                  <div className="mt-1 text-base sm:text-lg font-semibold text-gray-900">
                    {formatCurrency(deal.value)}
                  </div>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500">Stage</div>
                  <div className="mt-1">
                    <Select
                      value={deal.stage}
                      onChange={(value) => handleStageChange(value as Deal['stage'])}
                      options={STAGE_OPTIONS}
                      className="w-full sm:w-[200px] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500">Created On</div>
                  <div className="mt-1 text-sm sm:text-base text-gray-900">
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500">Expected Close Date</div>
                  <div className="mt-1 text-sm sm:text-base text-gray-900">
                    {new Date(deal.expectedCloseDate).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500">Probability</div>
                  <div className="mt-1 text-sm sm:text-base text-gray-900">{deal.probability}%</div>
                </div>

                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500">Assigned To</div>
                  <div className="mt-1 text-sm sm:text-base text-gray-900">{deal.assignedTo}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <p className="text-sm text-gray-600">
                {deal.notes || 'No notes available.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer Info */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm sm:text-base">{deal.customer.name}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{deal.customer.designation}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <div className="text-sm text-gray-600 break-words">{deal.customer.company}</div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 break-all">{deal.customer.email}</div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <div className="text-sm text-gray-600">{deal.customer.phone}</div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">{deal.customer.address}</div>
              </div>
            </CardContent>
          </Card>          {/* Equipment Information Card */}
          <Card className="mb-4">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary-600" /> 
                Equipment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              {loadingEquipment ? (
                <div className="flex justify-center items-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary-600" />
                </div>
              ) : equipmentList.length > 0 ? (
                <div className="space-y-2">
                  {equipmentList.map((equipment) => (
                    <div key={equipment.id} className="p-3 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{equipment.name}</h4>
                          <p className="text-xs text-gray-500">{equipment.machineType}</p>
                        </div>
                        <div className="text-sm text-right">
                          <span className="font-medium">Qty: {equipment.quantity}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 flex justify-between">
                        <div>Base Rate: {formatCurrency(equipment.baseRate)}</div>
                        <div>Cost/Km: {formatCurrency(equipment.runningCostPerKm)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No equipment information available for this deal.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Actions Card - Hidden on mobile (shown at top instead) */}
          <Card className="hidden sm:block">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
              <Button
                className="w-full"
                onClick={() => navigate(`/quotations/create?dealId=${deal.id}`)}
              >
                Create Quotation
              </Button>
            </CardContent>
          </Card>
        </div>
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