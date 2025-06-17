import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  IndianRupee, 
  Truck, 
  Users, 
  Activity,
  TrendingUp,
  CircleDollarSign,
  CheckCircle
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { LineChart } from '../components/dashboard/LineChart';
import { BarChart } from '../components/dashboard/BarChart';
import { DoughnutChart } from '../components/dashboard/DoughnutChart';
import { FunnelChart } from '../components/dashboard/FunnelChart';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { getLeads } from '../services/leadService';
import { getJobs, getAllOperators } from '../services/jobService';
import { getEquipment as getAllEquipment } from '../services/firestore/equipmentService';
import { getDeals } from '../services/dealService';
import { Lead } from '../types/lead';
import { Job } from '../types/job';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { Equipment } from '../types/equipment';
import { Deal } from '../types/deal';

export function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [operatorCount, setOperatorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsData, jobsData, equipmentData, operatorsData, dealsData] = await Promise.all([
          getLeads(),
          getJobs(),
          getAllEquipment(),
          getAllOperators(),
          getDeals(),
        ]);
        
        setLeads(leadsData);
        setJobs(jobsData);
        setEquipmentCount(equipmentData.length);
        setOperatorCount(operatorsData.length);
        setEquipment(equipmentData);
        setDeals(dealsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate total revenue from won deals
  const totalRevenue = deals
    .filter(deal => deal.stage === 'won')
    .reduce((total, deal) => total + deal.value, 0);

  // Calculate monthly percentage change
  const calculateMonthlyChange = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Get won deals for current month
    const currentMonthDeals = deals.filter(deal => {
      const dealDate = new Date(deal.updatedAt);
      return deal.stage === 'won' && 
             dealDate.getMonth() === currentMonth &&
             dealDate.getFullYear() === currentYear;
    });

    // Get won deals for last month
    const lastMonthDeals = deals.filter(deal => {
      const dealDate = new Date(deal.updatedAt);
      return deal.stage === 'won' && 
             dealDate.getMonth() === lastMonth &&
             dealDate.getFullYear() === lastMonthYear;
    });

    const currentMonthRevenue = currentMonthDeals.reduce((total, deal) => total + deal.value, 0);
    const lastMonthRevenue = lastMonthDeals.reduce((total, deal) => total + deal.value, 0);

    if (lastMonthRevenue === 0) return { value: 100, isPositive: true };
    
    const percentageChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    return {
      value: Math.abs(Math.round(percentageChange)),
      isPositive: percentageChange >= 0
    };
  };

  const monthlyChange = calculateMonthlyChange();
  
  const equipmentUtilization = jobs.filter(
    job => job.status === 'in_progress' || job.status === 'scheduled'
  ).length / (equipmentCount || 1) * 100;
  
  // Equipment status counts
  const availableCount = equipment.filter(e => e.status === 'available').length;
  const inUseCount = equipment.filter(e => e.status === 'in_use').length;
  const maintenanceCount = equipment.filter(e => e.status === 'maintenance').length;
  
  // Deal conversion calculation
  const dealConversion = leads.length > 0 ? (deals.length / leads.length) * 100 : 0;

  // Generate monthly revenue data for the past 6 months
  const revenueChartData = (() => {
    const now = new Date();
    const labels = [];
    const revenueData = [];
    const winRateData = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      labels.push(monthName);
      
      const monthDeals = deals.filter(deal => {
        const dealDate = new Date(deal.updatedAt);
        return dealDate.getMonth() === month.getMonth() && 
               dealDate.getFullYear() === month.getFullYear() && 
               deal.stage === 'won';
      });
      
      const monthRevenue = monthDeals.reduce((sum, deal) => sum + deal.value, 0);
      revenueData.push(monthRevenue);
      
      // Calculate win rate
      const totalMonthDeals = deals.filter(deal => {
        const dealDate = new Date(deal.updatedAt);
        return dealDate.getMonth() === month.getMonth() && 
               dealDate.getFullYear() === month.getFullYear() &&
               (deal.stage === 'won' || deal.stage === 'lost');
      });
      
      const winRate = totalMonthDeals.length > 0 
        ? (monthDeals.length / totalMonthDeals.length) * 100 
        : 0;
        
      winRateData.push(winRate);
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Win Rate %',
          data: winRateData,
          borderColor: '#22C55E',
          borderDashed: [5, 5],
          backgroundColor: 'transparent',
          yAxisID: 'y1',
        }
      ]
    };
  })();

  // Equipment status chart data
  const equipmentChartData = {
    labels: ['Available', 'In Use', 'Maintenance'],
    datasets: [
      {
        data: [availableCount, inUseCount, maintenanceCount],
        backgroundColor: ['#22C55E', '#EF4444', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  // Deal funnel data
  const dealFunnelStages = [
    { 
      label: 'New Leads',
      value: leads.filter(lead => lead.status === 'new').length,
      color: '#93C5FD'
    },
    { 
      label: 'Qualified Leads',
      value: leads.filter(lead => lead.status === 'qualified').length,
      color: '#60A5FA'
    },
    { 
      label: 'Deals',
      value: deals.filter(deal => deal.stage === 'proposal').length,
      color: '#3B82F6'
    },
    { 
      label: 'Won',
      value: deals.filter(deal => deal.stage === 'won').length,
      color: '#2563EB'
    }
  ];
  
  if (isLoading) {
    return <div className="flex justify-center py-10">Loading dashboard...</div>;
  }
  // Revenue chart options with simplified options to avoid type errors
  const revenueChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Win Rate %'
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<IndianRupee className="h-5 w-5 text-primary-600" />}
          variant="primary"
          trend={monthlyChange}
        />
        <StatCard
          title="Equipment Utilization"
          value={`${Math.round(equipmentUtilization)}%`}
          icon={<Truck className="h-5 w-5 text-secondary-600" />}
          variant="secondary"
        />
        <StatCard
          title="Deal Conversion"
          value={`${Math.round(dealConversion)}%`}
          icon={<Activity className="h-5 w-5 text-success-600" />}
          variant="success"
        />
        <StatCard
          title="Active Operators"
          value={operatorCount}
          icon={<Users className="h-5 w-5 text-accent-600" />}
          variant="accent"
        />
      </div>
      
      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Revenue & Win Rate Trends</CardTitle>
            <div className="text-xs text-gray-500">Last 6 months</div>
          </div>
        </CardHeader>
        <CardContent>
          <LineChart data={revenueChartData} options={revenueChartOptions} height={300} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead to Deal Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <FunnelChart 
              stages={dealFunnelStages} 
              height={280}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Equipment Status</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DoughnutChart data={equipmentChartData} height={280} />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Jobs</CardTitle>
              <Link to="/jobs" className="text-sm font-medium text-primary-600 hover:text-primary-800">
                View All Jobs
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent jobs</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.slice(0, 5).map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{job.customerId || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{job.equipmentId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{job.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(job.startDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={job.status as any} />
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
    </div>
  );
}