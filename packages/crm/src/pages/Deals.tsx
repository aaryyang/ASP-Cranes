import { useState, useEffect, ReactNode } from 'react';
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided
} from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Users, 
  Calendar, 
  Search,
  Building2,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Deal, DealStage } from '../types/deal';
import { getDeals, updateDealStage } from '../services/dealService';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';



const STAGE_CONFIGS = [
  { id: 'qualification', label: 'Qualification', color: 'bg-blue-50' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-50' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-50' },
  { id: 'won', label: 'Won', color: 'bg-green-50' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50' }
];

export function Deals() {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');  const [toast, setToast] = useState<{ 
    show: boolean; 
    title: string; 
    variant?: 'success' | 'error' | 'warning';
    description?: string;
  }>({
    show: false,
    title: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const data = await getDeals();
      setDeals(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching deals:', error);
      showToast('Error fetching deals', 'error');
      setIsLoading(false);
    }
  };
  const showToast = (title: string, variant: 'success' | 'error' = 'success', description?: string) => {
    setToast({ show: true, title, variant, description });
    setTimeout(() => setToast({ show: false, title: '' }), 4000); // Increased duration slightly
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStage = destination.droppableId as DealStage;

    try {
      const updatedDeal = await updateDealStage(draggableId, newStage);
      if (updatedDeal) {        setDeals(prev => prev.map(deal => deal.id === draggableId ? updatedDeal : deal));
        
        const stageName = STAGE_CONFIGS.find(s => s.id === newStage)?.label || newStage;
        const dealTitle = updatedDeal.title || 'Deal';
        showToast(
          `Deal moved to ${stageName}`, 
          'success', 
          `"${dealTitle}" has been successfully moved to the ${stageName} stage.`
        );
        
        // Check if deal was moved to "won" stage and prompt for job scheduling
        if (newStage === 'won') {
          handleDealWon(updatedDeal);
        }
      }
    } catch (error) {
      console.error('Error updating deal stage:', error);
      showToast('Error updating deal stage', 'error');
    }
  };
  // Function to handle when a deal is won
  const handleDealWon = (deal: Deal) => {
    showToast(
      'Schedule a job for this deal', 
      'success', 
      `You've won the deal with ${deal.customer.name}! You'll be redirected to schedule a job.`
    );
    
    // Short delay before navigation to ensure the toast is seen
    setTimeout(() => {
      navigate(`/jobs?dealId=${deal.id}&action=schedule&customerName=${encodeURIComponent(deal.customer.name)}`);
    }, 1500);
  };

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDealsByStage = (stage: DealStage) => 
    filteredDeals.filter(deal => deal.stage === stage);

  const calculateStageTotal = (stage: DealStage) =>
    getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0);

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-6 max-w-full">
      {/* Toast notification is positioned fixed via its own component */}      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          duration={4000}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Deals Pipeline</h1>
        <div className="flex items-center w-full sm:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <Input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-6">
            <div className="flex space-x-4 min-w-[800px] lg:min-w-full">
              {STAGE_CONFIGS.map((stage) => (
                <div key={stage.id} className={`rounded-lg ${stage.color} p-3 sm:p-4 flex-1 min-w-[240px]`}>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900">{stage.label}</h3>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(calculateStageTotal(stage.id as DealStage))}
                    </Badge>
                  </div>
                    <Droppable droppableId={stage.id}>
                    {(
                      provided: DroppableProvided
                    ): ReactNode => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2 sm:space-y-3 min-h-[300px] sm:min-h-[500px]"
                      >                        {getDealsByStage(stage.id as DealStage).map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(
                              provided: DraggableProvided
                            ): ReactNode => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white rounded-lg shadow p-3 sm:p-4 hover:shadow-md transition-shadow touch-manipulation"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 sm:space-y-2 flex-1 pr-2">
                                    <h4 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2">
                                      {deal.title}
                                    </h4>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      <span className="truncate">
                                        {deal.customer.company || 'No company'}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/deals/${deal.id}`);
                                    }}
                                    className="p-1"
                                  >
                                    <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                                
                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center text-gray-500 truncate max-w-[60%]">
                                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                      <span className="truncate">{deal.customer.name}</span>
                                    </div>
                                    <div className="font-medium text-gray-900">
                                      {formatCurrency(deal.value)}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 sm:mt-2 text-xs">
                                    <div className="flex items-center text-gray-500">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline">
                                        {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                      </span>
                                      <span className="sm:hidden">
                                        {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    <Badge className="text-xs">
                                      {Math.round(deal.probability)}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 text-xs text-center text-gray-500 sm:hidden">
            <p>Scroll horizontally to see all pipeline stages</p>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

