import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CalendarClock, 
  ClipboardList, 
  CreditCard, 
  IndianRupee, 
  Users
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { getLeads } from '../services/leadService';
import { getQuotationsForLead } from '../services/quotationService';
import { Lead } from '../types/lead';
import { Quotation } from '../types/quotation';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { BarChart } from '../components/dashboard/BarChart';
import { FunnelChart } from '../components/dashboard/FunnelChart';

export function SalesAgentDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
    const fetchData = async () => {
      try {
        const leadsData = await getLeads();
        setLeads(leadsData);
        
        // Get the most recent converted lead to fetch its quotations
        const convertedLeads = leadsData.filter(lead => lead.status === 'converted');
        if (convertedLeads.length > 0) {
          const recentConvertedLead = convertedLeads[0];
          const leadQuotations = await getQuotationsForLead(recentConvertedLead.id);
          setQuotations(leadQuotations);
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  // Count leads by status
  const newLeadsCount = leads.filter(lead => lead.status === 'new').length;
  const inProcessLeadsCount = leads.filter(lead => lead.status === 'in_process').length;
  const qualifiedLeadsCount = leads.filter(lead => lead.status === 'qualified').length;
  const convertedLeadsCount = leads.filter(lead => lead.status === 'converted').length;
  
  // Calculate total quotation value
  const totalQuotationValue = quotations.reduce((total, quotation) => total + quotation.totalRent, 0);
  
  // Recent leads (limit to 5)
  const recentLeads = [...leads].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 5);
  
  // Prepare data for lead funnel
  const leadFunnelStages = [
    { label: 'New', value: newLeadsCount, color: '#93C5FD' },
    { label: 'In Process', value: inProcessLeadsCount, color: '#60A5FA' },
    { label: 'Qualified', value: qualifiedLeadsCount, color: '#3B82F6' },
    { label: 'Converted', value: convertedLeadsCount, color: '#2563EB' }
  ];
  
  // Prepare data for performance chart
  const performanceChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'New Leads',
        data: [4, 6, 2, 8, 5],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
      }
    ]
  };
  
  if (isLoading) {
    return <div className="flex justify-center py-10">Loading dashboard...</div>;
  }
    return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Leads"
          value={newLeadsCount}
          icon={<ClipboardList className="h-5 w-5 text-primary-600" />}
          variant="primary"
        />
        <StatCard
          title="In Process"
          value={inProcessLeadsCount}
          icon={<Users className="h-5 w-5 text-secondary-600" />}
          variant="secondary"
        />
        <StatCard
          title="Qualified Leads"
          value={qualifiedLeadsCount}
          icon={<ClipboardList className="h-5 w-5 text-success-600" />}
          variant="success"
        />
        <StatCard
          title="Quotation Value"
          value={formatCurrency(totalQuotationValue)}
          icon={<IndianRupee className="h-5 w-5 text-accent-600" />}
          variant="accent"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead conversion funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <FunnelChart 
              stages={leadFunnelStages} 
              height={250}
            />
          </CardContent>
        </Card>

        {/* Weekly performance */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Lead Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={performanceChartData} 
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Leads</CardTitle>
                <Link to="/leads" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                  View All Leads
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No leads found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{lead.customerName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{lead.serviceNeeded}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={lead.status as any} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="flex-shrink-0 mt-1">
                    <CreditCard className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Prepare Quotation</h4>
                    <p className="text-xs text-gray-500 mt-1">BuildRight Inc. requires updated pricing by tomorrow</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-100 rounded-md">
                  <div className="flex-shrink-0 mt-1">
                    <CalendarClock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Client Meeting</h4>
                    <p className="text-xs text-gray-500 mt-1">Harbor Construction - 2:30 PM Tomorrow</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <div className="flex-shrink-0 mt-1">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Monthly Report</h4>
                    <p className="text-xs text-gray-500 mt-1">Submit sales summary by end of week</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}